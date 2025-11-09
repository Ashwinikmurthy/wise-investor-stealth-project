"""
Priority Cache Refresh Service
This module handles the calculation and caching of donor priorities and opportunities
Run this as a scheduled job (daily at 2 AM recommended)
"""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID
import logging

from sqlalchemy import select, update, and_, func, case, extract
from sqlalchemy.ext.asyncio import AsyncSession

from models import (
    Donor, Donation, DonorPriorityCache, DonorExclusionTag,
    DonorPortfolioAssignment, MajorGiftOfficer
)
from models.major_gifts import (
    DonorLevelEnum, PriorityLevelEnum, PortfolioRoleEnum
)

logger = logging.getLogger(__name__)


class PriorityCacheService:
    """Service for calculating and refreshing donor priority cache"""

    # Donor level thresholds
    MEGA_DONOR_THRESHOLD = Decimal("100000.00")
    MAJOR_DONOR_THRESHOLD = Decimal("10000.00")
    MID_LEVEL_THRESHOLD = Decimal("1000.00")
    UPPER_DONOR_THRESHOLD = Decimal("100.00")

    # Priority 5 opportunity percentage
    PRIORITY_5_OPPORTUNITY_PCT = Decimal("0.20")  # 20% growth opportunity

    def __init__(self, db: AsyncSession):
        self.db = db

    async def refresh_organization_priorities(
            self,
            organization_id: UUID,
            force_full_refresh: bool = False
    ) -> Dict[str, int]:
        """
        Refresh priority cache for an entire organization

        Args:
            organization_id: The organization to refresh
            force_full_refresh: If True, recalculates all donors even if recently updated

        Returns:
            Dict with statistics about the refresh
        """
        logger.info(f"Starting priority cache refresh for org {organization_id}")

        start_time = datetime.utcnow()
        stats = {
            "total_donors": 0,
            "updated": 0,
            "priority_1": 0,
            "priority_2": 0,
            "priority_3": 0,
            "priority_4": 0,
            "priority_5": 0,
            "excluded": 0,
        }

        try:
            # Step 1: Get all donors for this organization
            donor_ids = await self._get_all_donor_ids(organization_id)
            stats["total_donors"] = len(donor_ids)

            logger.info(f"Processing {len(donor_ids)} donors")

            # Step 2: Mark all existing cache records as not current
            await self._mark_cache_as_stale(organization_id)

            # Step 3: Calculate priorities for each donor
            batch_size = 100
            for i in range(0, len(donor_ids), batch_size):
                batch = donor_ids[i:i + batch_size]
                batch_stats = await self._process_donor_batch(
                    organization_id,
                    batch
                )

                # Aggregate stats
                for key in ["updated", "priority_1", "priority_2", "priority_3",
                            "priority_4", "priority_5", "excluded"]:
                    stats[key] += batch_stats.get(key, 0)

                # Commit in batches
                await self.db.commit()

            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Priority cache refresh completed in {duration:.2f}s. "
                f"Updated {stats['updated']} donors"
            )

            return stats

        except Exception as e:
            logger.error(f"Error refreshing priority cache: {str(e)}")
            await self.db.rollback()
            raise

    async def _get_all_donor_ids(self, organization_id: UUID) -> List[UUID]:
        """Get all donor IDs for an organization"""
        result = await self.db.execute(
            select(Donor.id)
            .where(Donor.organization_id == organization_id)
        )
        return [row[0] for row in result.all()]

    async def _mark_cache_as_stale(self, organization_id: UUID):
        """Mark all current cache records as not current"""
        await self.db.execute(
            update(DonorPriorityCache)
            .where(
                and_(
                    DonorPriorityCache.organization_id == organization_id,
                    DonorPriorityCache.is_current == True
                )
            )
            .values(is_current=False)
        )

    async def _process_donor_batch(
            self,
            organization_id: UUID,
            donor_ids: List[UUID]
    ) -> Dict[str, int]:
        """Process a batch of donors and update their priority cache"""
        stats = {
            "updated": 0,
            "priority_1": 0,
            "priority_2": 0,
            "priority_3": 0,
            "priority_4": 0,
            "priority_5": 0,
            "excluded": 0,
        }

        for donor_id in donor_ids:
            try:
                # Calculate donor metrics
                metrics = await self._calculate_donor_metrics(organization_id, donor_id)

                # Check for exclusion tags
                has_exclusion = await self._has_active_exclusion(organization_id, donor_id)
                exclusion_tags = await self._get_exclusion_tags(organization_id, donor_id) if has_exclusion else []

                # Get portfolio assignment
                officer_info = await self._get_portfolio_assignment(organization_id, donor_id)

                # Determine donor level
                donor_level = self._calculate_donor_level(
                    metrics['largest_gift_amount'],
                    metrics['current_year_total']
                )

                # Determine priority level
                priority_level = self._calculate_priority_level(
                    metrics['current_year_total'],
                    metrics['last_year_total'],
                    metrics['year_2023_total'],
                    metrics['year_2022_total']
                )

                # Calculate opportunity amount
                opportunity = self._calculate_opportunity_amount(
                    priority_level,
                    metrics['current_year_total'],
                    metrics['last_year_total'],
                    metrics['year_2023_total'],
                    metrics['year_2022_total']
                )

                # Calculate YoY metrics
                yoy_change = metrics['current_year_total'] - metrics['last_year_total']
                yoy_pct = (
                    ((metrics['current_year_total'] - metrics['last_year_total'])
                     / metrics['last_year_total'] * 100)
                    if metrics['last_year_total'] > 0 else None
                )

                # Days since last gift
                days_since = (
                    (date.today() - metrics['last_gift_date']).days
                    if metrics['last_gift_date'] else None
                )

                # Create or update cache record
                cache_record = DonorPriorityCache(
                    organization_id=organization_id,
                    donor_id=donor_id,
                    current_donor_level=donor_level,
                    priority_level=priority_level,
                    current_year_total=metrics['current_year_total'],
                    last_year_total=metrics['last_year_total'],
                    two_years_ago_total=metrics['two_years_ago_total'],
                    year_2023_total=metrics['year_2023_total'],
                    year_2022_total=metrics['year_2022_total'],
                    largest_gift_amount=metrics['largest_gift_amount'],
                    largest_gift_date=metrics['largest_gift_date'],
                    opportunity_amount=opportunity['amount'],
                    opportunity_basis=opportunity['basis'],
                    yoy_dollar_change=yoy_change,
                    yoy_percentage_change=yoy_pct,
                    gift_count_current_year=metrics['gift_count_current'],
                    gift_count_last_year=metrics['gift_count_last'],
                    gift_count_two_years_ago=metrics['gift_count_two_years'],
                    last_gift_date=metrics['last_gift_date'],
                    days_since_last_gift=days_since,
                    assigned_officer_id=officer_info['officer_id'],
                    portfolio_role=officer_info['portfolio_role'],
                    has_exclusion_tag=has_exclusion,
                    exclusion_tags=exclusion_tags,
                    calculation_date=date.today(),
                    is_current=True
                )

                # Merge (upsert) the record
                await self.db.merge(cache_record)

                stats["updated"] += 1
                stats[f"priority_{priority_level.value.split('_')[1]}"] += 1
                if has_exclusion:
                    stats["excluded"] += 1

            except Exception as e:
                logger.error(f"Error processing donor {donor_id}: {str(e)}")
                continue

        return stats

    async def _calculate_donor_metrics(
            self,
            organization_id: UUID,
            donor_id: UUID
    ) -> Dict:
        """Calculate giving metrics for a donor"""

        # Define date ranges
        today = date.today()
        twelve_months_ago = today - timedelta(days=365)
        twenty_four_months_ago = today - timedelta(days=730)
        thirty_six_months_ago = today - timedelta(days=1095)

        # Query donations with aggregations
        result = await self.db.execute(
            select(
                # Current year (rolling 12 months)
                func.coalesce(
                    func.sum(
                        case(
                            (Donation.donation_date >= twelve_months_ago, Donation.amount),
                            else_=0
                        )
                    ),
                    0
                ).label('current_year_total'),

                # Last year (12-24 months ago)
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    Donation.donation_date >= twenty_four_months_ago,
                                    Donation.donation_date < twelve_months_ago
                                ),
                                Donation.amount
                            ),
                            else_=0
                        )
                    ),
                    0
                ).label('last_year_total'),

                # Two years ago (24-36 months ago)
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    Donation.donation_date >= thirty_six_months_ago,
                                    Donation.donation_date < twenty_four_months_ago
                                ),
                                Donation.amount
                            ),
                            else_=0
                        )
                    ),
                    0
                ).label('two_years_ago_total'),

                # Year 2023
                func.coalesce(
                    func.sum(
                        case(
                            (extract('year', Donation.donation_date) == 2023, Donation.amount),
                            else_=0
                        )
                    ),
                    0
                ).label('year_2023_total'),

                # Year 2022
                func.coalesce(
                    func.sum(
                        case(
                            (extract('year', Donation.donation_date) == 2022, Donation.amount),
                            else_=0
                        )
                    ),
                    0
                ).label('year_2022_total'),

                # Largest gift
                func.coalesce(func.max(Donation.amount), 0).label('largest_gift_amount'),

                # Last gift date
                func.max(Donation.donation_date).label('last_gift_date'),

                # Gift counts
                func.count(
                    case(
                        (Donation.donation_date >= twelve_months_ago, 1),
                        else_=None
                    )
                ).label('gift_count_current'),

                func.count(
                    case(
                        (
                            and_(
                                Donation.donation_date >= twenty_four_months_ago,
                                Donation.donation_date < twelve_months_ago
                            ),
                            1
                        ),
                        else_=None
                    )
                ).label('gift_count_last'),

                func.count(
                    case(
                        (
                            and_(
                                Donation.donation_date >= thirty_six_months_ago,
                                Donation.donation_date < twenty_four_months_ago
                            ),
                            1
                        ),
                        else_=None
                    )
                ).label('gift_count_two_years'),
            )
            .where(
                and_(
                    Donation.donor_id == donor_id,
                    Donation.organization_id == organization_id
                )
            )
        )

        row = result.first()

        return {
            'current_year_total': Decimal(str(row.current_year_total or 0)),
            'last_year_total': Decimal(str(row.last_year_total or 0)),
            'two_years_ago_total': Decimal(str(row.two_years_ago_total or 0)),
            'year_2023_total': Decimal(str(row.year_2023_total or 0)),
            'year_2022_total': Decimal(str(row.year_2022_total or 0)),
            'largest_gift_amount': Decimal(str(row.largest_gift_amount or 0)),
            'largest_gift_date': row.last_gift_date,
            'last_gift_date': row.last_gift_date,
            'gift_count_current': row.gift_count_current,
            'gift_count_last': row.gift_count_last,
            'gift_count_two_years': row.gift_count_two_years,
        }

    def _calculate_donor_level(
            self,
            largest_gift: Decimal,
            current_year_total: Decimal
    ) -> DonorLevelEnum:
        """Determine donor level based on largest gift or 12-month cumulative"""
        max_amount = max(largest_gift, current_year_total)

        if max_amount >= self.MEGA_DONOR_THRESHOLD:
            return DonorLevelEnum.MEGA_DONOR
        elif max_amount >= self.MAJOR_DONOR_THRESHOLD:
            return DonorLevelEnum.MAJOR_DONOR
        elif max_amount >= self.MID_LEVEL_THRESHOLD:
            return DonorLevelEnum.MID_LEVEL
        elif max_amount >= self.UPPER_DONOR_THRESHOLD:
            return DonorLevelEnum.UPPER_DONOR
        else:
            return DonorLevelEnum.LOWER_DONOR

    def _calculate_priority_level(
            self,
            current_year: Decimal,
            last_year: Decimal,
            year_2023: Decimal,
            year_2022: Decimal
    ) -> PriorityLevelEnum:
        """Determine priority level based on giving history"""

        # Priority 1: $0 this year with any gifts last year
        if current_year == 0 and last_year > 0:
            return PriorityLevelEnum.PRIORITY_1

        # Priority 2: Last year's gifts > this year's gifts
        if last_year > current_year and current_year > 0:
            return PriorityLevelEnum.PRIORITY_2

        # Priority 3: No gifts since 2023 (but gave in 2023)
        if current_year == 0 and last_year == 0 and year_2023 > 0:
            return PriorityLevelEnum.PRIORITY_3

        # Priority 4: No gifts since 2022 (but gave in 2022)
        if current_year == 0 and last_year == 0 and year_2023 == 0 and year_2022 > 0:
            return PriorityLevelEnum.PRIORITY_4

        # Priority 5: This year's gifts >= last year's gifts (or default)
        return PriorityLevelEnum.PRIORITY_5

    def _calculate_opportunity_amount(
            self,
            priority: PriorityLevelEnum,
            current_year: Decimal,
            last_year: Decimal,
            year_2023: Decimal,
            year_2022: Decimal
    ) -> Dict[str, any]:
        """Calculate opportunity amount based on priority"""

        if priority == PriorityLevelEnum.PRIORITY_1:
            return {
                'amount': last_year,
                'basis': f"Priority 1: Full last year amount (${last_year:,.2f})"
            }

        elif priority == PriorityLevelEnum.PRIORITY_2:
            delta = last_year - current_year
            return {
                'amount': delta,
                'basis': f"Priority 2: Delta from last year (${delta:,.2f})"
            }

        elif priority == PriorityLevelEnum.PRIORITY_3:
            return {
                'amount': year_2023,
                'basis': f"Priority 3: 2023 gift amount (${year_2023:,.2f})"
            }

        elif priority == PriorityLevelEnum.PRIORITY_4:
            return {
                'amount': year_2022,
                'basis': f"Priority 4: 2022 gift amount (${year_2022:,.2f})"
            }

        else:  # PRIORITY_5
            opportunity = current_year * self.PRIORITY_5_OPPORTUNITY_PCT
            return {
                'amount': opportunity,
                'basis': f"Priority 5: 20% growth opportunity (${opportunity:,.2f})"
            }

    async def _has_active_exclusion(
            self,
            organization_id: UUID,
            donor_id: UUID
    ) -> bool:
        """Check if donor has any active exclusion tags"""
        result = await self.db.execute(
            select(func.count())
            .select_from(DonorExclusionTag)
            .where(
                and_(
                    DonorExclusionTag.organization_id == organization_id,
                    DonorExclusionTag.donor_id == donor_id,
                    DonorExclusionTag.is_active == True
                )
            )
        )
        count = result.scalar()
        return count > 0

    async def _get_exclusion_tags(
            self,
            organization_id: UUID,
            donor_id: UUID
    ) -> List[str]:
        """Get list of active exclusion tags"""
        result = await self.db.execute(
            select(DonorExclusionTag.exclusion_tag)
            .where(
                and_(
                    DonorExclusionTag.organization_id == organization_id,
                    DonorExclusionTag.donor_id == donor_id,
                    DonorExclusionTag.is_active == True
                )
            )
        )
        return [row[0].value for row in result.all()]

    async def _get_portfolio_assignment(
            self,
            organization_id: UUID,
            donor_id: UUID
    ) -> Dict[str, Optional[any]]:
        """Get the current portfolio assignment for a donor"""
        result = await self.db.execute(
            select(
                DonorPortfolioAssignment.officer_id,
                MajorGiftOfficer.portfolio_role
            )
            .join(
                MajorGiftOfficer,
                DonorPortfolioAssignment.officer_id == MajorGiftOfficer.id
            )
            .where(
                and_(
                    DonorPortfolioAssignment.organization_id == organization_id,
                    DonorPortfolioAssignment.donor_id == donor_id,
                    DonorPortfolioAssignment.is_active == True,
                    DonorPortfolioAssignment.is_primary == True
                )
            )
        )

        row = result.first()

        if row:
            return {
                'officer_id': row.officer_id,
                'portfolio_role': row.portfolio_role
            }
        else:
            return {
                'officer_id': None,
                'portfolio_role': None
            }


# Usage example for FastAPI endpoint
async def refresh_priority_cache_endpoint(
        organization_id: UUID,
        db: AsyncSession
) -> Dict:
    """
    Endpoint handler for manual cache refresh

    Usage in FastAPI:
    @router.post("/major-gifts/cache/refresh")
    async def refresh_cache(
        organization_id: UUID = Depends(get_current_org),
        db: AsyncSession = Depends(get_db)
    ):
        service = PriorityCacheService(db)
        return await service.refresh_organization_priorities(organization_id)
    """
    service = PriorityCacheService(db)
    return await service.refresh_organization_priorities(organization_id)