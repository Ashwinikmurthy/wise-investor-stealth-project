"""
Major Gift Development API - FINAL COMPLETE VERSION
All enum issues resolved - uses lowercase string literals everywhere
Ready to deploy - tested and working
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract, case, or_, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from models import Users as User
from database import get_db
from user_management.auth_dependencies import get_current_user
from models import (
    Users as User,
    Donations as Donation,
    Parties as Party,
    DonorMeetings as DonorMeeting,
    MajorGiftOfficer as MajorGiftOfficer,
    MovesManagementStages as MovesManagementStage,
    OfficerAnnualTargets as OfficerAnnualTarget,
    DonorPriorityCache,
    DonorExclusionTags as DonorExclusionTag,
    GiftGoals as GiftGoal,
    SolicitationProposals as SolicitationProposal
)

router = APIRouter(prefix="/api/v1/major-gifts", tags=["major-gifts"])


# ============================================================================
# PYDANTIC SCHEMAS - All using UUID instead of UUID4
# ============================================================================

class DecimalEncoder(BaseModel):
    """Base model with proper Decimal serialization"""
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None
        }


class MovesManagementDistributionResponse(BaseModel):
    """Distribution of donors across moves management stages"""
    officer_id: Optional[UUID]
    officer_name: str
    officer_role: Optional[str]
    identification: int = 0
    qualification: int = 0
    cultivation: int = 0
    solicitation: int = 0
    stewardship: int = 0
    total_donors: int = 0

    class Config:
        from_attributes = True


class GiftGoalSummaryResponse(DecimalEncoder):
    """Gift goals summary by officer"""
    officer_id: Optional[UUID]
    officer_name: str
    officer_role: Optional[str]
    total_goal_count: int = 0
    total_goal_amount: Decimal = Decimal("0")
    total_raised_amount: Decimal = Decimal("0")
    goals_achieved: int = 0
    goals_in_progress: int = 0
    completion_rate: float = 0.0


class ProposalSummaryResponse(DecimalEncoder):
    """Solicitation proposals summary by officer"""
    officer_id: Optional[UUID]
    officer_name: str
    officer_role: Optional[str]
    total_proposals_sent: int = 0
    total_proposal_amount: Decimal = Decimal("0")
    proposals_accepted: int = 0
    proposals_pending: int = 0
    proposals_declined: int = 0
    total_accepted_amount: Decimal = Decimal("0")


class MeetingActivityResponse(BaseModel):
    """Meeting activity summary by officer"""
    officer_id: Optional[UUID]
    officer_name: str
    officer_role: Optional[str]
    total_meetings: int = 0
    substantive_meetings: int = 0
    in_person_meetings: int = 0
    virtual_meetings: int = 0
    unique_donors_met: int = 0
    next_meeting_date: Optional[date] = None
    class Config:
        from_attributes = True


class ProductivitySummaryResponse(DecimalEncoder):
    """Fundraising productivity summary by officer"""
    officer_id: UUID
    officer_name: str
    officer_role: Optional[str]
    ytd_closures_count: int = 0
    ytd_closures_amount: Decimal = Decimal("0")
    annual_goal_count: int = 0
    annual_goal_amount: Decimal = Decimal("0")
    count_progress_percent: float = 0.0
    amount_progress_percent: float = 0.0
    remaining_count: int = 0
    remaining_amount: Decimal = Decimal("0")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def verify_organization_access(organization_id: UUID, current_user: "CurrentUser") -> UUID:
    """Verify user has access to organization"""
    if current_user.is_superadmin:
        return organization_id
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        )
    return organization_id


def get_current_fiscal_year() -> int:
    """Get current fiscal year (assuming July 1 start)"""
    today = date.today()
    return today.year if today.month >= 7 else today.year - 1


# ============================================================================
# 1. MOVES MANAGEMENT STAGE DISTRIBUTION
# ============================================================================

@router.get(
    "/moves-management-distribution",
    response_model=List[MovesManagementDistributionResponse],
    summary="Get moves management stage distribution by officer",
    description="Shows how many major donors are in each moves management stage per officer"
)
async def get_moves_management_distribution(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """Get distribution of donors across moves management stages by officer."""
    verify_organization_access(organization_id, current_user)

    try:
        # ✅ ALL LOWERCASE STRING LITERALS
        query = db.query(
            MovesManagementStage.officer_id,
            func.count(case((MovesManagementStage.current_stage == 'identification', 1))).label('identification'),
            func.count(case((MovesManagementStage.current_stage == 'qualification', 1))).label('qualification'),
            func.count(case((MovesManagementStage.current_stage == 'cultivation', 1))).label('cultivation'),
            func.count(case((MovesManagementStage.current_stage == 'solicitation', 1))).label('solicitation'),
            func.count(case((MovesManagementStage.current_stage == 'stewardship', 1))).label('stewardship'),
            func.count(MovesManagementStage.id).label('total_donors')
        ).filter(
            MovesManagementStage.organization_id == organization_id
        )

        if officer_id:
            query = query.filter(MovesManagementStage.officer_id == officer_id)

        query = query.group_by(MovesManagementStage.officer_id)
        results = query.all()

        response = []
        for row in results:
            # Use raw SQL to bypass portfolio_role enum issues
            officer_result = db.execute(
                text("""
                    SELECT first_name, last_name, portfolio_role::text as role
                    FROM major_gift_officers 
                    WHERE id = :officer_id
                """),
                {"officer_id": str(row.officer_id)}
            ).fetchone()

            if officer_result:
                officer_name = f"{officer_result[0]} {officer_result[1]}"
                officer_role = officer_result[2]
            else:
                officer_name = "Unassigned"
                officer_role = None

            response.append(MovesManagementDistributionResponse(
                officer_id=row.officer_id,
                officer_name=officer_name,
                officer_role=officer_role,
                identification=row.identification,
                qualification=row.qualification,
                cultivation=row.cultivation,
                solicitation=row.solicitation,
                stewardship=row.stewardship,
                total_donors=row.total_donors
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving moves management distribution: {str(e)}"
        )


# ============================================================================
# 2. GIFT GOALS SUMMARY
# ============================================================================

@router.get(
    "/gift-goals",
    response_model=List[GiftGoalSummaryResponse],
    summary="Get gift goals summary by officer",
    description="Total gift goals and their values by major gift officer"
)
async def get_gift_goals_summary(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        include_inactive: bool = Query(False, description="Include cancelled/achieved goals"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """Get summary of gift goals by officer."""
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(
            GiftGoal.officer_id,
            func.count(GiftGoal.id).label('total_goal_count'),
            func.sum(GiftGoal.goal_amount).label('total_goal_amount'),
            func.sum(GiftGoal.current_received_amount).label('total_raised_amount'),
            func.count(case((GiftGoal.is_realized == True, 1))).label('goals_achieved'),
            func.count(case((GiftGoal.status == 'active', 1))).label('goals_in_progress')
        ).filter(
            GiftGoal.organization_id == organization_id
        )

        if not include_inactive:
            query = query.filter(GiftGoal.status.in_(['active', 'realized']))

        if officer_id:
            query = query.filter(GiftGoal.officer_id == officer_id)

        query = query.group_by(GiftGoal.officer_id)
        results = query.all()

        response = []
        for row in results:
            officer_result = db.execute(
                text("""
                    SELECT first_name, last_name, portfolio_role::text as role
                    FROM major_gift_officers 
                    WHERE id = :officer_id
                """),
                {"officer_id": str(row.officer_id)}
            ).fetchone()

            if officer_result:
                officer_name = f"{officer_result[0]} {officer_result[1]}"
                officer_role = officer_result[2]
            else:
                officer_name = "Unassigned"
                officer_role = None

            total_goal = float(row.total_goal_amount or 0)
            total_raised = float(row.total_raised_amount or 0)
            completion_rate = (total_raised / total_goal * 100) if total_goal > 0 else 0.0

            response.append(GiftGoalSummaryResponse(
                officer_id=row.officer_id,
                officer_name=officer_name,
                officer_role=officer_role,
                total_goal_count=row.total_goal_count,
                total_goal_amount=row.total_goal_amount or Decimal("0"),
                total_raised_amount=row.total_raised_amount or Decimal("0"),
                goals_achieved=row.goals_achieved,
                goals_in_progress=row.goals_in_progress,
                completion_rate=round(completion_rate, 2)
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving gift goals: {str(e)}"
        )


# ============================================================================
# 3. SOLICITATION PROPOSALS SUMMARY
# ============================================================================

@router.get(
    "/solicitation-proposals",
    response_model=List[ProposalSummaryResponse],
    summary="Get solicitation proposals summary",
    description="Number and value of proposals sent by each officer"
)
async def get_solicitation_proposals_summary(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """Get summary of solicitation proposals by officer."""
    verify_organization_access(organization_id, current_user)

    start_datetime = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_datetime = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59) if end_date else None

    try:
        # ✅ ALL LOWERCASE STRING LITERALS - NO ENUM REFERENCES
        query = db.query(
            SolicitationProposal.officer_id,
            func.count(SolicitationProposal.id).label('total_proposals_sent'),
            func.sum(SolicitationProposal.requested_amount).label('total_proposal_amount'),
            func.count(case((SolicitationProposal.status == 'accepted', 1))).label('proposals_accepted'),
            func.count(case((SolicitationProposal.status.in_(['sent', 'under_review']), 1))).label('proposals_pending'),
            func.count(case((SolicitationProposal.status == 'declined', 1))).label('proposals_declined'),
            func.sum(case((SolicitationProposal.status == 'accepted', SolicitationProposal.received_amount))).label('total_accepted_amount')
        ).filter(
            SolicitationProposal.organization_id == organization_id
        )

        if start_datetime:
            query = query.filter(SolicitationProposal.date_sent >= start_datetime.date())
        if end_datetime:
            query = query.filter(SolicitationProposal.date_sent <= end_datetime.date())
        if officer_id:
            query = query.filter(SolicitationProposal.officer_id == officer_id)

        query = query.group_by(SolicitationProposal.officer_id)
        results = query.all()

        response = []
        for row in results:
            officer_result = db.execute(
                text("""
                    SELECT first_name, last_name, portfolio_role::text as role
                    FROM major_gift_officers 
                    WHERE id = :officer_id
                """),
                {"officer_id": str(row.officer_id)}
            ).fetchone()

            if officer_result:
                officer_name = f"{officer_result[0]} {officer_result[1]}"
                officer_role = officer_result[2]
            else:
                officer_name = "Unassigned"
                officer_role = None

            response.append(ProposalSummaryResponse(
                officer_id=row.officer_id,
                officer_name=officer_name,
                officer_role=officer_role,
                total_proposals_sent=row.total_proposals_sent,
                total_proposal_amount=row.total_proposal_amount or Decimal("0"),
                proposals_accepted=row.proposals_accepted,
                proposals_pending=row.proposals_pending,
                proposals_declined=row.proposals_declined,
                total_accepted_amount=row.total_accepted_amount or Decimal("0")
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving proposals: {str(e)}"
        )
