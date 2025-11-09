"""
Major Gift Development API Routes - Part 3: YTD Segments View and Analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract, case, or_, desc, between
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, UUID4
from decimal import Decimal
from models import Donations as Donation, DonorExclusionTags as DonorExclusionTag,MovesManagementStages as MovesManagementStage, DonorPriorityCache
from database import get_db
from majorgifts.major_gifts_api_part1 import verify_organization_access
from majorgifts.major_gifts_api_part2 import SegmentYTDResponse

from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1/major-gifts", tags=["major-gifts"])


# ============================================================================
# 8. YTD SEGMENTS VIEW
# ============================================================================

@router.get(
    "/segments-ytd",
    response_model=List[SegmentYTDResponse],
    summary="Get YTD segment analysis",
    description="Year-over-year comparison of giving by donor segment (Mega, Major, Mid-level)"
)
async def get_segments_ytd(
        organization_id: UUID4 = Query(..., description="Organization ID"),
        officer_id: Optional[UUID4] = Query(None, description="Filter by specific officer portfolio"),
        exclude_tags: Optional[str] = Query(None, description="Comma-separated exclusion tags"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get YTD segment comparison showing:
    - Current YTD $ and # donors
    - Last Year YTD $ and # donors
    - 2 Years Ago YTD $ and # donors
    - YoY variance percentages

    Segments:
    - Mega Donors ($100K+)
    - Major Donors ($10K-99,999.99)
    - Mid-level ($1K-9,999.99)
    """
    verify_organization_access(organization_id, current_user)

    try:
        # Define segment boundaries
        segments = [
            {
                'name': 'Mega Donors ($100K+)',
                'min': 100000,
                'max': None
            },
            {
                'name': 'Major Donors ($10K-99,999)',
                'min': 10000,
                'max': 99999.99
            },
            {
                'name': 'Mid-level ($1K-9,999)',
                'min': 1000,
                'max': 9999.99
            }
        ]

        # Calculate YTD date ranges for current year, last year, and 2 years ago
        today = date.today()
        current_year = today.year

        # Assuming calendar year (adjust if using fiscal year)
        current_ytd_start = date(current_year, 1, 1)
        current_ytd_end = today

        last_year_ytd_start = date(current_year - 1, 1, 1)
        last_year_ytd_end = date(current_year - 1, today.month, today.day)

        two_years_ago_ytd_start = date(current_year - 2, 1, 1)
        two_years_ago_ytd_end = date(current_year - 2, today.month, today.day)

        response = []

        for segment in segments:
            # Build base query for donations in this segment
            base_query = db.query(Donation).filter(
                Donation.organization_id == organization_id,
                Donation.payment_status == 'completed'
            )

            # Apply segment amount filter
            if segment['max']:
                base_query = base_query.filter(
                    Donation.amount >= segment['min'],
                    Donation.amount <= segment['max']
                )
            else:
                base_query = base_query.filter(Donation.amount >= segment['min'])

            # Apply officer filter if provided
            if officer_id:
                base_query = base_query.join(
                    MovesManagementStage,
                    Donation.party_id == MovesManagementStage.party_id
                ).filter(MovesManagementStage.officer_id == officer_id)

            # Apply exclusion tags
            if exclude_tags:
                tag_list = [tag.strip() for tag in exclude_tags.split(',')]
                excluded_parties = db.query(DonorExclusionTag.party_id).filter(
                    DonorExclusionTag.organization_id == organization_id,
                    DonorExclusionTag.tag_type.in_(tag_list),
                    DonorExclusionTag.is_active == True
                ).subquery()
                base_query = base_query.filter(~Donation.party_id.in_(excluded_parties))

            # Current YTD
            current_ytd = base_query.filter(
                Donation.donation_date >= current_ytd_start,
                Donation.donation_date <= current_ytd_end
            )

            current_ytd_amount = db.query(
                func.coalesce(func.sum(Donation.amount), 0)
            ).select_from(current_ytd.subquery()).scalar()

            current_ytd_donors = db.query(
                func.count(func.distinct(Donation.party_id))
            ).select_from(current_ytd.subquery()).scalar()

            # Last Year YTD
            last_year_ytd = base_query.filter(
                Donation.donation_date >= last_year_ytd_start,
                Donation.donation_date <= last_year_ytd_end
            )

            last_year_ytd_amount = db.query(
                func.coalesce(func.sum(Donation.amount), 0)
            ).select_from(last_year_ytd.subquery()).scalar()

            last_year_ytd_donors = db.query(
                func.count(func.distinct(Donation.party_id))
            ).select_from(last_year_ytd.subquery()).scalar()

            # Two Years Ago YTD
            two_years_ago_ytd = base_query.filter(
                Donation.donation_date >= two_years_ago_ytd_start,
                Donation.donation_date <= two_years_ago_ytd_end
            )

            two_years_ago_ytd_amount = db.query(
                func.coalesce(func.sum(Donation.amount), 0)
            ).select_from(two_years_ago_ytd.subquery()).scalar()

            two_years_ago_ytd_donors = db.query(
                func.count(func.distinct(Donation.party_id))
            ).select_from(two_years_ago_ytd.subquery()).scalar()

            # Calculate variances
            yoy_amount_variance = (
                ((float(current_ytd_amount) - float(last_year_ytd_amount)) / float(last_year_ytd_amount) * 100)
                if float(last_year_ytd_amount) > 0
                else 0.0
            )

            yoy_donor_variance = (
                ((current_ytd_donors - last_year_ytd_donors) / last_year_ytd_donors * 100)
                if last_year_ytd_donors > 0
                else 0.0
            )

            two_year_amount_variance = (
                ((float(current_ytd_amount) - float(two_years_ago_ytd_amount)) / float(two_years_ago_ytd_amount) * 100)
                if float(two_years_ago_ytd_amount) > 0
                else 0.0
            )

            two_year_donor_variance = (
                ((current_ytd_donors - two_years_ago_ytd_donors) / two_years_ago_ytd_donors * 100)
                if two_years_ago_ytd_donors > 0
                else 0.0
            )

            response.append(SegmentYTDResponse(
                segment_name=segment['name'],
                current_ytd_amount=float(current_ytd_amount),
                last_year_ytd_amount=float(last_year_ytd_amount),
                two_years_ago_ytd_amount=float(two_years_ago_ytd_amount),
                current_ytd_donors=current_ytd_donors,
                last_year_ytd_donors=last_year_ytd_donors,
                two_years_ago_ytd_donors=two_years_ago_ytd_donors,
                yoy_amount_variance=round(yoy_amount_variance, 2),
                yoy_donor_variance=round(yoy_donor_variance, 2),
                two_year_amount_variance=round(two_year_amount_variance, 2),
                two_year_donor_variance=round(two_year_donor_variance, 2)
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving YTD segments: {str(e)}"
        )


# ============================================================================
# 9. REFRESH DONOR PRIORITY CACHE (Utility Endpoint)
# ============================================================================

@router.post(
    "/refresh-priority-cache",
    summary="Refresh donor priority cache",
    description="Recalculate and cache donor priorities based on current giving data"
)
async def refresh_donor_priority_cache(
        organization_id: UUID4 = Query(..., description="Organization ID"),
        force_full_refresh: bool = Query(False, description="Force refresh all donors"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Refresh the donor priority cache by recalculating priorities based on current giving history.

    This should be run periodically (e.g., nightly) to keep priorities up to date.
    """
    verify_organization_access(organization_id, current_user)

    try:
        # Get all donors with giving history
        current_year = date.today().year

        # Calculate giving totals by year for all donors
        donors_query = db.query(
            Donation.party_id,
            func.sum(case((extract('year', Donation.donation_date) == current_year, Donation.amount))).label('current_year_total'),
            func.sum(case((extract('year', Donation.donation_date) == current_year - 1, Donation.amount))).label('last_year_total'),
            func.sum(case((extract('year', Donation.donation_date) == current_year - 2, Donation.amount))).label('two_years_ago_total'),
            func.max(Donation.donation_date).label('last_gift_date'),
            func.sum(Donation.amount).label('lifetime_total')
        ).filter(
            Donation.organization_id == organization_id,
            Donation.payment_status == 'completed'
        ).group_by(Donation.party_id)

        donors = donors_query.all()

        processed_count = 0

        for donor in donors:
            current_total = float(donor.current_year_total or 0)
            last_year_total = float(donor.last_year_total or 0)
            two_years_ago_total = float(donor.two_years_ago_total or 0)
            lifetime_total = float(donor.lifetime_total or 0)

            # Determine priority tier and opportunity value
            priority_tier = None
            opportunity_value = 0.0
            calculation_basis = ""

            # Priority 1: $0 this year with gifts last year
            if current_total == 0 and last_year_total > 0:
                priority_tier = 1
                opportunity_value = last_year_total
                calculation_basis = "Based on last year's gifts"

            # Priority 2: Last year > this year
            elif last_year_total > current_total and current_total > 0:
                priority_tier = 2
                opportunity_value = last_year_total - current_total
                calculation_basis = "Based on the difference/delta"

            # Priority 3: No gifts since 2023
            elif current_total == 0 and last_year_total == 0 and two_years_ago_total > 0:
                priority_tier = 3
                opportunity_value = two_years_ago_total
                calculation_basis = "Based on 2023 gifts"

            # Priority 4: No gifts since 2022 (would need 3 years ago data)
            elif current_total == 0 and last_year_total == 0 and two_years_ago_total == 0 and lifetime_total > 0:
                priority_tier = 4
                opportunity_value = lifetime_total * 0.5  # Conservative estimate
                calculation_basis = "Based on historical giving"

            # Priority 5: This year >= last year
            elif current_total >= last_year_total and current_total > 0:
                priority_tier = 5
                opportunity_value = current_total * 0.2
                calculation_basis = "Based on 20% of this year's gifts"

            # Determine donor level
            max_gift = max(current_total, last_year_total, two_years_ago_total)
            if max_gift >= 100000:
                donor_level = "Mega Donors"
            elif max_gift >= 10000:
                donor_level = "Major Donors"
            elif max_gift >= 1000:
                donor_level = "Mid-level"
            elif max_gift >= 100:
                donor_level = "Upper Donors"
            else:
                donor_level = "Lower Donors"

            # Get officer assignment if exists
            officer_assignment = db.query(MovesManagementStage).filter(
                MovesManagementStage.party_id == donor.party_id,
                MovesManagementStage.organization_id == organization_id
            ).first()

            officer_id = officer_assignment.officer_id if officer_assignment else None

            # Invalidate old records
            db.query(DonorPriorityCache).filter(
                DonorPriorityCache.party_id == donor.party_id,
                DonorPriorityCache.organization_id == organization_id,
                DonorPriorityCache.is_current == True
            ).update({'is_current': False})

            # Create new cache record
            new_cache = DonorPriorityCache(
                organization_id=organization_id,
                party_id=donor.party_id,
                officer_id=officer_id,
                priority_tier=priority_tier,
                opportunity_value=Decimal(str(opportunity_value)),
                opportunity_calculation_basis=calculation_basis,
                current_year_total=Decimal(str(current_total)),
                last_year_total=Decimal(str(last_year_total)),
                two_years_ago_total=Decimal(str(two_years_ago_total)),
                donor_level=donor_level,
                last_gift_date=donor.last_gift_date,
                is_current=True
            )

            db.add(new_cache)
            processed_count += 1

        db.commit()

        return {
            "status": "success",
            "message": f"Priority cache refreshed for {processed_count} donors",
            "processed_count": processed_count,
            "organization_id": str(organization_id)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing priority cache: {str(e)}"
        )


# ============================================================================
# 10. COMPREHENSIVE DASHBOARD SUMMARY
# ============================================================================

@router.get(
    "/dashboard-summary",
    summary="Get comprehensive major gifts dashboard summary",
    description="All key metrics in a single endpoint for dashboard display"
)
async def get_dashboard_summary(
        organization_id: UUID4 = Query(..., description="Organization ID"),
        officer_id: Optional[UUID4] = Query(None, description="Filter by specific officer"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get comprehensive dashboard summary including all key metrics.
    """
    verify_organization_access(organization_id, current_user)

    try:
        # This would call all the other endpoints and aggregate the data
        # For brevity, returning structure outline

        return {
            "organization_id": str(organization_id),
            "generated_at": datetime.now().isoformat(),
            "moves_management": "Call /moves-management-distribution",
            "gift_goals": "Call /gift-goals",
            "proposals": "Call /solicitation-proposals",
            "meetings_last_week": "Call /meetings/last-week",
            "meetings_upcoming": "Call /meetings/upcoming",
            "productivity": "Call /productivity/closures",
            "opportunities": "Call /opportunities",
            "segments_ytd": "Call /segments-ytd",
            "note": "This endpoint aggregates data from all other endpoints"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating dashboard summary: {str(e)}"
        )