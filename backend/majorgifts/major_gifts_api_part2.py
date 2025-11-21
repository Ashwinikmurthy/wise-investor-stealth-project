"""
Major Gift Development API Routes - Part 2: Meetings, Productivity, Donor Prioritization
CORRECTED VERSION - With correct MeetingResponse schema
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract, case, or_, desc,  text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta, timezone
from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from majorgifts.major_gifts_schema import *
from database import get_db
from models import Users as User, Donations as Donation, Donors as Donor,Parties as Party, DonorMeetings as DonorMeeting, MajorGiftOfficer as MajorGiftOfficer,MovesManagementStages as MovesManagementStage, OfficerAnnualTargets as OfficerAnnualTarget, DonorPriorityCache,DonorExclusionTags as DonorExclusionTag
from majorgifts.major_gifts_api_part1 import MeetingActivityResponse, verify_organization_access, \
    get_current_fiscal_year, ProductivitySummaryResponse

from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1/major-gifts", tags=["major-gifts"])


# ============================================================================
# PYDANTIC SCHEMAS (continued)
# ============================================================================

# OVERRIDE the imported MeetingResponse with the correct one for YOUR schema
class MeetingResponse(BaseModel):
    """Meeting response schema matching YOUR actual donor_meetings table"""
    id: UUID
    organization_id: UUID
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID] = None
    officer_name: Optional[str] = None
    actual_date: date  # ← This is DATE, not datetime! Matches your actual_date column
    meeting_type: str  # ← Enum cast to text
    agenda: Optional[str] = None
    follow_up_actions: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None,
            UUID: lambda v: str(v)
        }


class DonorOpportunityResponse(BaseModel):
    """Donor opportunity with priority and calculations"""
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID]
    officer_name: Optional[str]

    priority_tier: int
    priority_description: str
    opportunity_amount: float
    calculation_basis: str

    donor_level: str
    current_year_total: float
    last_year_total: float
    two_years_ago_total: float
    last_gift_date: Optional[date]

    class Config:
        from_attributes = True


class SegmentYTDResponse(BaseModel):
    """YTD segment comparison data"""
    segment_name: str

    current_ytd_amount: float
    last_year_ytd_amount: float
    two_years_ago_ytd_amount: float

    current_ytd_donors: int
    last_year_ytd_donors: int
    two_years_ago_ytd_donors: int

    yoy_amount_variance: float
    yoy_donor_variance: float
    two_year_amount_variance: float
    two_year_donor_variance: float

    class Config:
        from_attributes = True


# ============================================================================
# 4. MEETINGS - LAST WEEK
# ============================================================================
@router.get("/meetings/last-week", response_model=List[MeetingResponse])
async def get_last_week_meetings(
        organization_id: Optional[UUID] = Query(None),
        officer_id: Optional[UUID] = Query(None),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """Get all donor meetings from the last 7 days - FIXED FOR YOUR SCHEMA"""
    try:
        verify_organization_access(organization_id, current_user)

        # Calculate date 7 days ago - use DATE not DATETIME
        seven_days_ago_date = (datetime.now(timezone.utc) - timedelta(days=7)).date()

        # Use raw SQL with explicit column names
        if officer_id:
            sql = text("""
                SELECT 
                    dm.id as meeting_id,
                    dm.organization_id,
                    dm.donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dm.officer_id,
                    CASE 
                        WHEN mgo.first_name IS NOT NULL 
                        THEN CONCAT(mgo.first_name, ' ', mgo.last_name)
                        ELSE NULL 
                    END as officer_name,
                    dm.actual_date,
                    dm.meeting_type::text as meeting_type,
                    dm.agenda,
                    dm.follow_up_actions,
                    dm.created_at,
                    dm.updated_at
                FROM donor_meetings dm
                LEFT JOIN donors d ON dm.donor_id = d.id
                LEFT JOIN major_gift_officers mgo ON dm.officer_id = mgo.id
                WHERE dm.organization_id = :org_id
                    AND dm.actual_date >= :seven_days_ago
                    AND dm.officer_id = :officer_id
                ORDER BY dm.actual_date DESC
            """)
            params = {
                "org_id": str(organization_id),
                "seven_days_ago": seven_days_ago_date,
                "officer_id": str(officer_id)
            }
        else:
            sql = text("""
                SELECT 
                    dm.id as meeting_id,
                    dm.organization_id,
                    dm.donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dm.officer_id,
                    CASE 
                        WHEN mgo.first_name IS NOT NULL 
                        THEN CONCAT(mgo.first_name, ' ', mgo.last_name)
                        ELSE NULL 
                    END as officer_name,
                    dm.actual_date,
                    dm.meeting_type::text as meeting_type,
                    dm.agenda,
                    dm.follow_up_actions,
                    dm.created_at,
                    dm.updated_at
                FROM donor_meetings dm
                LEFT JOIN donors d ON dm.donor_id = d.id
                LEFT JOIN major_gift_officers mgo ON dm.officer_id = mgo.id
                WHERE dm.organization_id = :org_id
                    AND dm.actual_date >= :seven_days_ago
                ORDER BY dm.actual_date DESC
            """)
            params = {
                "org_id": str(organization_id),
                "seven_days_ago": seven_days_ago_date
            }

        # Execute and fetch results
        result = db.execute(sql, params)
        rows = result.fetchall()

        # Build response using named column access
        response = []
        for row in rows:
            response.append(MeetingResponse(
                id=row.meeting_id,
                organization_id=row.organization_id,
                donor_id=row.donor_id,
                donor_name=row.donor_name or "Unknown Donor",
                officer_id=row.officer_id,
                officer_name=row.officer_name,
                actual_date=row.actual_date,  # This is a date, not datetime
                meeting_type=row.meeting_type,
                agenda=row.agenda,
                follow_up_actions=row.follow_up_actions,
                created_at=row.created_at,
                updated_at=row.updated_at
            ))

        return response

    except Exception as e:
        import traceback
        print(f"Error details:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving last week's meetings: {str(e)}"
        )


# ============================================================================
# 5. MEETINGS - UPCOMING WEEK
# ============================================================================

@router.get(
    "/meetings/upcoming",
    response_model=List[MeetingActivityResponse],
    summary="Get meetings scheduled for upcoming week",
    description="Number of meetings scheduled for the next 7 days by officer"
)
async def get_meetings_upcoming(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get count of meetings scheduled for the next 7 days, grouped by officer
    """
    verify_organization_access(organization_id, current_user)

    try:
        today = date.today()
        seven_days_from_now = today + timedelta(days=7)

        query = db.query(
            DonorMeeting.officer_id,
            func.count(DonorMeeting.id).label('upcoming_meetings_count')
        ).filter(
            DonorMeeting.organization_id == organization_id,
            DonorMeeting.scheduled_date >= today,
            DonorMeeting.scheduled_date <= seven_days_from_now
        )

        if officer_id:
            query = query.filter(DonorMeeting.officer_id == officer_id)

        results = query.group_by(DonorMeeting.officer_id).all()

        response = []
        for row in results:
            # Get officer info with role
            officer_info = db.query(MajorGiftOfficer).filter(
                MajorGiftOfficer.id == row.officer_id,
                MajorGiftOfficer.organization_id == organization_id
            ).first()

            if officer_info:
                #user, mgo = officer_info
                officer_name = f"{officer_info.first_name} {officer_info.last_name}"
                officer_role = str(officer_info.portfolio_role) if officer_info.portfolio_role else None
            else:
                officer_name = "Unknown Officer"
                officer_role = None

            response.append(MeetingActivityResponse(
                officer_id=row.officer_id,
                officer_name=officer_name,
                officer_role=officer_role,
                meetings_count=row.upcoming_meetings_count
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving upcoming meetings: {str(e)}"
        )


# ============================================================================
# 6. PRODUCTIVITY SUMMARY
# ============================================================================
@router.get(
    "/productivity/summary",
    response_model=List[ProductivitySummaryResponse],
    summary="Get officer fundraising productivity",
    description="YTD closures vs annual goals by major gift officer"
)
async def get_officer_productivity(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        fiscal_year: Optional[int] = Query(None, description="Fiscal year (default: current)"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get officer productivity metrics using gift goals data.
    FIXED: Uses gift_goals.current_received_amount for consistency.
    """
    verify_organization_access(organization_id, current_user)

    try:
        # Get fiscal year
        if not fiscal_year:
            fiscal_year = get_current_fiscal_year()

        # ============================================================================
        # FIXED: Use gift_goals data (same as Gift Goals section)
        # This ensures Officer Performance matches Gift Goals
        # ============================================================================

        from models import GiftGoals as GiftGoal

        gift_goals_query = db.query(
            GiftGoal.officer_id,
            func.count(GiftGoal.id).label('ytd_closures_count'),
            func.sum(GiftGoal.current_received_amount).label('ytd_closures_amount')
        ).filter(
            GiftGoal.organization_id == organization_id,
            GiftGoal.status.in_(['active', 'realized'])
        )

        if officer_id:
            gift_goals_query = gift_goals_query.filter(GiftGoal.officer_id == officer_id)

        gift_goals_query = gift_goals_query.group_by(GiftGoal.officer_id)
        ytd_results = {row.officer_id: row for row in gift_goals_query.all()}

        # Get annual targets
        targets_query = db.query(OfficerAnnualTarget).filter(
            OfficerAnnualTarget.organization_id == organization_id,
            OfficerAnnualTarget.fiscal_year == fiscal_year
        )

        if officer_id:
            targets_query = targets_query.filter(OfficerAnnualTarget.officer_id == officer_id)

        targets = targets_query.all()

        # Build response
        response = []
        for target in targets:
            ytd = ytd_results.get(target.officer_id)

            ytd_count = ytd.ytd_closures_count if ytd else 0
            ytd_amount = float(ytd.ytd_closures_amount or 0) if ytd else 0.0

            goal_count = target.target_gift_count
            goal_amount = float(target.target_dollars)

            count_progress = (ytd_count / goal_count * 100) if goal_count > 0 else 0
            amount_progress = (ytd_amount / goal_amount * 100) if goal_amount > 0 else 0

            remaining_count = max(0, goal_count - ytd_count)
            remaining_amount = max(0, goal_amount - ytd_amount)

            # Get officer info using raw SQL to avoid enum issues
            officer_result = db.execute(
                text("""
                    SELECT first_name, last_name, portfolio_role::text as role
                    FROM major_gift_officers 
                    WHERE id = :officer_id
                """),
                {"officer_id": str(target.officer_id)}
            ).fetchone()

            if officer_result:
                officer_name = f"{officer_result[0]} {officer_result[1]}"
                officer_role = officer_result[2]
            else:
                officer_name = "Unknown Officer"
                officer_role = None

            response.append(ProductivitySummaryResponse(
                officer_id=target.officer_id,
                officer_name=officer_name,
                officer_role=officer_role,
                ytd_closures_count=ytd_count,
                ytd_closures_amount=Decimal(str(ytd_amount)),
                annual_goal_count=goal_count,
                annual_goal_amount=Decimal(str(goal_amount)),
                count_progress_percent=round(count_progress, 2),
                amount_progress_percent=round(amount_progress, 2),
                remaining_count=remaining_count,
                remaining_amount=Decimal(str(remaining_amount))
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving productivity: {str(e)}"
        )



# ============================================================================
# 7. DONOR OPPORTUNITIES (PRIORITY-BASED)
# ============================================================================

@router.get(
    "/opportunities",
    response_model=List[DonorOpportunityResponse],
    summary="Get donor opportunities by priority tier",
    description="Prioritized list of donor opportunities based on giving history"
)
async def get_donor_opportunities(
        organization_id: UUID = Query(..., description="Organization ID"),
        priority_tier: Optional[int] = Query(None, ge=1, le=5, description="Filter by priority tier (1-5)"),
        donor_level: Optional[str] = Query(None, description="Filter by donor level (Mega, Major, Mid-level, Upper, Lower)"),
        officer_id: Optional[UUID] = Query(None, description="Filter by assigned officer"),
        exclude_tags: Optional[str] = Query(None, description="Comma-separated exclusion tags"),
        limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get prioritized donor opportunities based on:
    - Priority 1: $0 this year with gifts last year
    - Priority 2: Last year's gifts > this year's gifts
    - Priority 3: No gifts since 2023
    - Priority 4: No gifts since 2022
    - Priority 5: This year's gifts >= last year's gifts

    Can be filtered by donor level, portfolio, and exclusion tags.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(DonorPriorityCache).filter(
            DonorPriorityCache.organization_id == organization_id,
            DonorPriorityCache.is_current == True
        )

        if priority_tier:
            query = query.filter(DonorPriorityCache.priority_level == priority_tier)

        if donor_level:
            query = query.filter(DonorPriorityCache.current_donor_level == donor_level)

        if officer_id:
            query = query.filter(DonorPriorityCache.assigned_officer_id == officer_id)

        # Apply exclusion tags
        if exclude_tags:
            tag_list = [tag.strip() for tag in exclude_tags.split(',')]
            # Subquery to get party_ids with exclusion tags
            excluded_parties = db.query(DonorExclusionTag.party_id).filter(
                DonorExclusionTag.organization_id == organization_id,
                DonorExclusionTag.tag_type.in_(tag_list),
                DonorExclusionTag.is_active == True
            ).subquery()

            query = query.filter(~DonorPriorityCache.donor_id.in_(excluded_parties))

        # Order by priority tier and opportunity value
        query = query.order_by(
            DonorPriorityCache.priority_level.asc(),
            DonorPriorityCache.opportunity_amount.desc()
        ).offset(skip).limit(limit)

        results = query.all()

        # Enrich with party and officer information
        response = []
        for row in results:
            # Get party info
            party = db.query(Donor).filter(Donor.id == row.donor_id).first()
            donor_name = f"{party.first_name} {party.last_name}" if party else "Unknown Donor"

            # Get officer info
            officer_name = None
            if row.assigned_officer_id:
                officer = db.query(MajorGiftOfficer).filter(MajorGiftOfficer.id == row.assigned_officer_id).first()
                officer_name = f"{officer.first_name} {officer.last_name}" if officer else None

            # Priority descriptions
            priority_descriptions = {
                1: "$0 this year with gifts last year",
                2: "Last year's gifts > this year's gifts",
                3: "No gifts since 2023",
                4: "No gifts since 2022",
                5: "This year's gifts >= last year's gifts"
            }

            # Convert priority_level enum to integer (e.g., 'priority_1' -> 1)
            priority_value = int(str(row.priority_level).replace('priority_', '').replace('PriorityLevelEnum.', ''))

            response.append(DonorOpportunityResponse(
                donor_id=row.donor_id,
                donor_name=donor_name,
                officer_id=row.assigned_officer_id,
                officer_name=officer_name,
                priority_tier=priority_value,
                priority_description=priority_descriptions.get(priority_value, "Unknown"),
                opportunity_amount=float(row.opportunity_amount) if row.opportunity_amount is not None else 0.0,
                calculation_basis=row.opportunity_basis or "",
                donor_level=str(row.current_donor_level).replace('DonorLevelEnum.', ''),
                current_year_total=float(row.current_year_total) if row.current_year_total is not None else 0.0,
                last_year_total=float(row.last_year_total) if row.last_year_total is not None else 0.0,
                two_years_ago_total=float(row.two_years_ago_total) if row.two_years_ago_total is not None else 0.0,
                last_gift_date=row.last_gift_date
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving opportunities: {str(e)}"
        )