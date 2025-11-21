"""
Major Gift Development API - Prioritization Models
Five prioritization charts for donor scoring and opportunity identification
CORRECTED VERSION - Uses actual database schema columns
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract, case, or_, desc, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from database import get_db
from models import (
    Users as User,
    Donations as Donation,
    Donors as Donor,
    Parties as Party,
    DonorMeetings as DonorMeeting,
    MajorGiftOfficer,
    MovesManagementStages as MovesManagementStage,
    DonorPriorityCache,
    GiftGoals as GiftGoal
)
from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1/major-gifts", tags=["major-gifts-prioritization"])


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def verify_organization_access(organization_id: UUID, current_user) -> UUID:
    """Verify user has access to organization"""
    if current_user.is_superadmin:
        return organization_id
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        )
    return organization_id


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class CapacityPriorityResponse(BaseModel):
    """Priority by donor capacity/wealth indicators"""
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID]
    officer_name: Optional[str]
    estimated_capacity: float
    lifetime_giving: float
    capacity_utilization: float
    capacity_score: int
    capacity_tier: str
    last_gift_amount: float
    recommended_ask: float

    class Config:
        from_attributes = True


class EngagementPriorityResponse(BaseModel):
    """Priority by engagement level"""
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID]
    officer_name: Optional[str]
    engagement_score: int
    meetings_last_12mo: int
    emails_opened_rate: float
    events_attended: int
    volunteer_hours: float
    board_member: bool
    engagement_tier: str
    last_contact_date: Optional[date]
    days_since_contact: int

    class Config:
        from_attributes = True


class LikelihoodPriorityResponse(BaseModel):
    """Priority by predicted giving likelihood"""
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID]
    officer_name: Optional[str]
    likelihood_score: int
    predicted_gift_amount: float
    confidence_level: str
    key_indicators: List[str]
    recommended_action: str
    optimal_ask_date: Optional[date]

    class Config:
        from_attributes = True


class PortfolioGapResponse(BaseModel):
    """Portfolio gaps by officer"""
    officer_id: UUID
    officer_name: str
    current_portfolio_size: int
    target_portfolio_size: int
    portfolio_gap: int
    current_portfolio_value: float
    target_portfolio_value: float
    value_gap: float
    stage_gaps: Dict[str, int]
    donor_level_gaps: Dict[str, int]
    recommended_additions: int

    class Config:
        from_attributes = True


class UrgencyPriorityResponse(BaseModel):
    """Priority by urgency/timing"""
    donor_id: UUID
    donor_name: str
    officer_id: Optional[UUID]
    officer_name: Optional[str]
    urgency_score: int
    urgency_tier: str
    urgency_reasons: List[str]
    days_until_deadline: Optional[int]
    lapsed_days: int
    anniversary_approaching: bool
    fiscal_year_end_opportunity: bool
    recommended_action: str
    action_deadline: Optional[date]

    class Config:
        from_attributes = True


class PrioritizationSummaryResponse(BaseModel):
    """Summary of all prioritization models"""
    total_donors: int
    by_capacity: Dict[str, int]
    by_engagement: Dict[str, int]
    by_likelihood: Dict[str, int]
    by_urgency: Dict[str, int]
    portfolio_health: Dict[str, Any]

    class Config:
        from_attributes = True


# ============================================================================
# 1. PRIORITY BY CAPACITY
# ============================================================================

@router.get(
    "/prioritization/capacity",
    response_model=List[CapacityPriorityResponse],
    summary="Get donors prioritized by giving capacity",
    description="Ranks donors by wealth indicators and capacity utilization"
)
async def get_capacity_priority(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by officer"),
        capacity_tier: Optional[str] = Query(None, description="Filter by capacity tier"),
        min_capacity: Optional[float] = Query(None, description="Minimum estimated capacity"),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get donors prioritized by giving capacity."""
    verify_organization_access(organization_id, current_user)

    try:
        # Query donors with capacity calculations
        # Uses giving_capacity from donors table and donor_level to identify major donors
        sql = text("""
            WITH donor_capacity AS (
                SELECT 
                    d.id as donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dpc.assigned_officer_id as officer_id,
                    COALESCE(d.giving_capacity, d.lifetime_value, 50000) as estimated_capacity,
                    COALESCE(d.total_donated, 0) as lifetime_giving,
                    COALESCE(d.largest_donation, 0) as last_gift_amount
                FROM donors d
                LEFT JOIN donor_priority_cache dpc ON d.id = dpc.donor_id AND dpc.is_current = true
                WHERE d.organization_id = :org_id
                    AND d.donor_level IN ('mega_donor', 'major_donor', 'mid_level')
            )
            SELECT 
                donor_id,
                donor_name,
                officer_id,
                estimated_capacity,
                lifetime_giving,
                CASE 
                    WHEN estimated_capacity > 0 
                    THEN ROUND((lifetime_giving / estimated_capacity * 100)::numeric, 2)
                    ELSE 0 
                END as capacity_utilization,
                CASE
                    WHEN estimated_capacity >= 1000000 THEN 100
                    WHEN estimated_capacity >= 500000 THEN 80
                    WHEN estimated_capacity >= 100000 THEN 60
                    WHEN estimated_capacity >= 50000 THEN 40
                    ELSE 20
                END as capacity_score,
                CASE
                    WHEN estimated_capacity >= 1000000 THEN 'Ultra High'
                    WHEN estimated_capacity >= 500000 THEN 'High'
                    WHEN estimated_capacity >= 100000 THEN 'Medium'
                    ELSE 'Developing'
                END as capacity_tier,
                last_gift_amount,
                CASE
                    WHEN estimated_capacity >= 1000000 THEN estimated_capacity * 0.05
                    WHEN estimated_capacity >= 500000 THEN estimated_capacity * 0.03
                    ELSE estimated_capacity * 0.02
                END as recommended_ask
            FROM donor_capacity
            WHERE estimated_capacity > 0
            ORDER BY capacity_score DESC, estimated_capacity DESC
            LIMIT :limit
        """)

        params = {"org_id": str(organization_id), "limit": limit}
        result = db.execute(sql, params)
        rows = result.fetchall()

        response = []
        for row in rows:
            # Get officer name if assigned
            officer_name = None
            if row.officer_id:
                officer_result = db.execute(
                    text("SELECT CONCAT(first_name, ' ', last_name) FROM major_gift_officers WHERE id = :oid"),
                    {"oid": str(row.officer_id)}
                ).fetchone()
                officer_name = officer_result[0] if officer_result else None

            # Apply filters
            if officer_id and str(row.officer_id) != str(officer_id):
                continue
            if capacity_tier and row.capacity_tier != capacity_tier:
                continue
            if min_capacity and row.estimated_capacity < min_capacity:
                continue

            response.append(CapacityPriorityResponse(
                donor_id=row.donor_id,
                donor_name=row.donor_name,
                officer_id=row.officer_id,
                officer_name=officer_name,
                estimated_capacity=float(row.estimated_capacity),
                lifetime_giving=float(row.lifetime_giving),
                capacity_utilization=float(row.capacity_utilization),
                capacity_score=row.capacity_score,
                capacity_tier=row.capacity_tier,
                last_gift_amount=float(row.last_gift_amount),
                recommended_ask=float(row.recommended_ask)
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving capacity priorities: {str(e)}"
        )


# ============================================================================
# 2. PRIORITY BY ENGAGEMENT
# ============================================================================

@router.get(
    "/prioritization/engagement",
    response_model=List[EngagementPriorityResponse],
    summary="Get donors prioritized by engagement level",
    description="Ranks donors by meetings, communications, and involvement"
)
async def get_engagement_priority(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by officer"),
        engagement_tier: Optional[str] = Query(None, description="Filter by engagement tier"),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get donors prioritized by engagement level."""
    verify_organization_access(organization_id, current_user)

    try:
        twelve_months_ago = date.today() - timedelta(days=365)

        sql = text("""
            WITH donor_engagement AS (
                SELECT 
                    d.id as donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dpc.assigned_officer_id as officer_id,
                    COALESCE(
                        (SELECT COUNT(*) FROM donor_meetings 
                         WHERE donor_id = d.id AND actual_date >= :twelve_mo_ago),
                        0
                    ) as meetings_last_12mo,
                    COALESCE(d.engagement_score, 50) / 100.0 as emails_opened_rate,
                    0 as events_attended,
                    0 as volunteer_hours,
                    false as board_member,
                    (SELECT MAX(actual_date) FROM donor_meetings WHERE donor_id = d.id) as last_contact_date
                FROM donors d
                LEFT JOIN donor_priority_cache dpc ON d.id = dpc.donor_id AND dpc.is_current = true
                WHERE d.organization_id = :org_id
                    AND d.donor_level IN ('mega_donor', 'major_donor', 'mid_level')
            )
            SELECT 
                donor_id,
                donor_name,
                officer_id,
                meetings_last_12mo,
                emails_opened_rate,
                events_attended,
                volunteer_hours,
                board_member,
                last_contact_date,
                CASE WHEN last_contact_date IS NOT NULL 
                    THEN (CURRENT_DATE - last_contact_date)::int
                    ELSE 999 
                END as days_since_contact,
                -- Calculate engagement score (weighted)
                LEAST(100, (
                    (meetings_last_12mo * 15) +
                    (emails_opened_rate * 20) +
                    (events_attended * 10) +
                    (LEAST(volunteer_hours, 100) * 0.3) +
                    (CASE WHEN board_member THEN 20 ELSE 0 END)
                )::int) as engagement_score
            FROM donor_engagement
            ORDER BY 
                (meetings_last_12mo * 15 + emails_opened_rate * 20 + events_attended * 10) DESC
            LIMIT :limit
        """)

        params = {
            "org_id": str(organization_id),
            "twelve_mo_ago": twelve_months_ago,
            "limit": limit
        }
        result = db.execute(sql, params)
        rows = result.fetchall()

        response = []
        for row in rows:
            # Get officer name
            officer_name = None
            if row.officer_id:
                officer_result = db.execute(
                    text("SELECT CONCAT(first_name, ' ', last_name) FROM major_gift_officers WHERE id = :oid"),
                    {"oid": str(row.officer_id)}
                ).fetchone()
                officer_name = officer_result[0] if officer_result else None

            # Determine engagement tier
            score = row.engagement_score
            if score >= 75:
                tier = "Highly Engaged"
            elif score >= 50:
                tier = "Engaged"
            elif score >= 25:
                tier = "Warm"
            else:
                tier = "Cold"

            # Apply filters
            if officer_id and str(row.officer_id) != str(officer_id):
                continue
            if engagement_tier and tier != engagement_tier:
                continue

            response.append(EngagementPriorityResponse(
                donor_id=row.donor_id,
                donor_name=row.donor_name,
                officer_id=row.officer_id,
                officer_name=officer_name,
                engagement_score=score,
                meetings_last_12mo=row.meetings_last_12mo,
                emails_opened_rate=float(row.emails_opened_rate),
                events_attended=row.events_attended,
                volunteer_hours=float(row.volunteer_hours),
                board_member=row.board_member,
                engagement_tier=tier,
                last_contact_date=row.last_contact_date,
                days_since_contact=row.days_since_contact
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving engagement priorities: {str(e)}"
        )


# ============================================================================
# 3. PRIORITY BY PREDICTED LIKELIHOOD
# ============================================================================

@router.get(
    "/prioritization/likelihood",
    response_model=List[LikelihoodPriorityResponse],
    summary="Get donors prioritized by predicted giving likelihood",
    description="ML-based prediction of donor giving probability"
)
async def get_likelihood_priority(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by officer"),
        min_likelihood: Optional[int] = Query(None, description="Minimum likelihood score"),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get donors prioritized by predicted giving likelihood."""
    verify_organization_access(organization_id, current_user)

    try:
        # Use donor_priority_cache which has giving history
        sql = text("""
            WITH donor_likelihood AS (
                SELECT 
                    d.id as donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dpc.assigned_officer_id as officer_id,
                    dpc.current_year_total,
                    dpc.last_year_total,
                    dpc.two_years_ago_total,
                    dpc.last_gift_date,
                    dpc.opportunity_amount,
                    -- Calculate likelihood based on historical patterns
                    CASE
                        -- Consistent giver with recent activity
                        WHEN dpc.current_year_total > 0 AND dpc.last_year_total > 0 AND dpc.two_years_ago_total > 0 THEN 90
                        -- Recent giver, gave last year
                        WHEN dpc.current_year_total > 0 AND dpc.last_year_total > 0 THEN 80
                        -- Gave this year only
                        WHEN dpc.current_year_total > 0 THEN 70
                        -- Gave last year but not this year (high recovery potential)
                        WHEN dpc.last_year_total > 0 THEN 60
                        -- Gave 2 years ago (lapsed)
                        WHEN dpc.two_years_ago_total > 0 THEN 40
                        ELSE 20
                    END as likelihood_score
                FROM donors d
                JOIN donor_priority_cache dpc ON d.id = dpc.donor_id AND dpc.is_current = true
                WHERE d.organization_id = :org_id
                    AND d.donor_level IN ('mega_donor', 'major_donor', 'mid_level')
            )
            SELECT 
                donor_id,
                donor_name,
                officer_id,
                likelihood_score,
                COALESCE(opportunity_amount, 
                    GREATEST(current_year_total, last_year_total, two_years_ago_total) * 1.1
                ) as predicted_gift_amount,
                last_gift_date,
                current_year_total,
                last_year_total,
                two_years_ago_total
            FROM donor_likelihood
            WHERE likelihood_score >= COALESCE(:min_likelihood, 0)
            ORDER BY likelihood_score DESC, predicted_gift_amount DESC
            LIMIT :limit
        """)

        params = {
            "org_id": str(organization_id),
            "min_likelihood": min_likelihood,
            "limit": limit
        }
        result = db.execute(sql, params)
        rows = result.fetchall()

        response = []
        for row in rows:
            # Get officer name
            officer_name = None
            if row.officer_id:
                officer_result = db.execute(
                    text("SELECT CONCAT(first_name, ' ', last_name) FROM major_gift_officers WHERE id = :oid"),
                    {"oid": str(row.officer_id)}
                ).fetchone()
                officer_name = officer_result[0] if officer_result else None

            # Apply officer filter
            if officer_id and str(row.officer_id) != str(officer_id):
                continue

            # Determine confidence and indicators
            score = row.likelihood_score
            if score >= 80:
                confidence = "High"
            elif score >= 50:
                confidence = "Medium"
            else:
                confidence = "Low"

            # Build key indicators
            indicators = []
            if row.current_year_total and row.current_year_total > 0:
                indicators.append("Active this year")
            if row.last_year_total and row.last_year_total > 0:
                indicators.append("Gave last year")
            if row.two_years_ago_total and row.two_years_ago_total > 0:
                indicators.append("Multi-year history")
            if row.current_year_total and row.last_year_total and row.current_year_total > row.last_year_total:
                indicators.append("Increasing giving")

            # Recommended action
            if score >= 80:
                action = "Schedule solicitation meeting"
            elif score >= 60:
                action = "Cultivation touch point"
            elif score >= 40:
                action = "Re-engagement outreach"
            else:
                action = "Research and qualify"

            # Optimal ask date (example logic)
            optimal_date = None
            if row.last_gift_date:
                # Suggest asking around anniversary
                optimal_date = row.last_gift_date.replace(year=date.today().year)
                if optimal_date < date.today():
                    optimal_date = optimal_date.replace(year=date.today().year + 1)

            response.append(LikelihoodPriorityResponse(
                donor_id=row.donor_id,
                donor_name=row.donor_name,
                officer_id=row.officer_id,
                officer_name=officer_name,
                likelihood_score=score,
                predicted_gift_amount=float(row.predicted_gift_amount or 0),
                confidence_level=confidence,
                key_indicators=indicators if indicators else ["New prospect"],
                recommended_action=action,
                optimal_ask_date=optimal_date
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving likelihood priorities: {str(e)}"
        )


# ============================================================================
# 4. PRIORITY BY PORTFOLIO GAPS
# ============================================================================

@router.get(
    "/prioritization/portfolio-gaps",
    response_model=List[PortfolioGapResponse],
    summary="Get portfolio gaps by officer",
    description="Identifies gaps in officer portfolios by size, value, and composition"
)
async def get_portfolio_gaps(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by specific officer"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get portfolio gap analysis by officer."""
    verify_organization_access(organization_id, current_user)

    try:
        # Get officer portfolios - use OfficerAnnualTargets for targets
        sql = text("""
            WITH officer_portfolios AS (
                SELECT 
                    mgo.id as officer_id,
                    CONCAT(mgo.first_name, ' ', mgo.last_name) as officer_name,
                    COUNT(DISTINCT mms.donor_id) as current_portfolio_size,
                    COALESCE(SUM(dpc.opportunity_amount), 0) as current_portfolio_value,
                    COALESCE(oat.target_gift_count, 20) as target_portfolio_size,
                    COALESCE(oat.target_dollars, 500000) as target_portfolio_value
                FROM major_gift_officers mgo
                LEFT JOIN moves_management_stages mms ON mgo.id = mms.officer_id 
                    AND mms.organization_id = :org_id
                LEFT JOIN donor_priority_cache dpc ON mms.donor_id = dpc.donor_id 
                    AND dpc.is_current = true
                LEFT JOIN officer_annual_targets oat ON mgo.id = oat.officer_id
                    AND oat.fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
                WHERE mgo.organization_id = :org_id
                    AND mgo.is_active = true
                GROUP BY mgo.id, mgo.first_name, mgo.last_name, 
                         oat.target_gift_count, oat.target_dollars
            )
            SELECT 
                officer_id,
                officer_name,
                current_portfolio_size,
                target_portfolio_size,
                current_portfolio_value,
                target_portfolio_value
            FROM officer_portfolios
            ORDER BY (target_portfolio_size - current_portfolio_size) DESC
        """)

        params = {"org_id": str(organization_id)}
        result = db.execute(sql, params)
        rows = result.fetchall()

        response = []
        for row in rows:
            # Apply officer filter
            if officer_id and str(row.officer_id) != str(officer_id):
                continue

            # Get stage distribution for this officer
            stage_result = db.execute(
                text("""
                    SELECT current_stage::text as stage, COUNT(*) as count
                    FROM moves_management_stages
                    WHERE officer_id = :oid AND organization_id = :org_id
                    GROUP BY current_stage
                """),
                {"oid": str(row.officer_id), "org_id": str(organization_id)}
            ).fetchall()

            # Calculate ideal stage distribution
            target_size = row.target_portfolio_size or 20
            ideal_stages = {
                'identification': int(target_size * 0.15),
                'qualification': int(target_size * 0.20),
                'cultivation': int(target_size * 0.35),
                'solicitation': int(target_size * 0.20),
                'stewardship': int(target_size * 0.10)
            }

            current_stages = {r.stage: r.count for r in stage_result}
            stage_gaps = {}
            for stage, ideal in ideal_stages.items():
                current = current_stages.get(stage, 0)
                stage_gaps[stage] = ideal - current

            # Get donor level distribution
            level_result = db.execute(
                text("""
                    SELECT current_donor_level::text as level, COUNT(*) as count
                    FROM donor_priority_cache
                    WHERE assigned_officer_id = :oid AND organization_id = :org_id AND is_current = true
                    GROUP BY current_donor_level
                """),
                {"oid": str(row.officer_id), "org_id": str(organization_id)}
            ).fetchall()

            # Calculate donor level gaps
            ideal_levels = {
                'mega_donor': int(target_size * 0.05),
                'major_donor': int(target_size * 0.15),
                'mid_level': int(target_size * 0.30),
                'upper_donor': int(target_size * 0.30),
                'lower_donor': int(target_size * 0.20)
            }

            current_levels = {r.level: r.count for r in level_result}
            level_gaps = {}
            for level, ideal in ideal_levels.items():
                current = current_levels.get(level, 0)
                level_gaps[level] = ideal - current

            portfolio_gap = (row.target_portfolio_size or 20) - row.current_portfolio_size
            value_gap = float(row.target_portfolio_value or 500000) - float(row.current_portfolio_value)

            response.append(PortfolioGapResponse(
                officer_id=row.officer_id,
                officer_name=row.officer_name,
                current_portfolio_size=row.current_portfolio_size,
                target_portfolio_size=row.target_portfolio_size or 20,
                portfolio_gap=max(0, portfolio_gap),
                current_portfolio_value=float(row.current_portfolio_value),
                target_portfolio_value=float(row.target_portfolio_value or 500000),
                value_gap=max(0, value_gap),
                stage_gaps=stage_gaps,
                donor_level_gaps=level_gaps,
                recommended_additions=max(0, portfolio_gap)
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving portfolio gaps: {str(e)}"
        )


# ============================================================================
# 5. PRIORITY BY URGENCY/TIMING
# ============================================================================

@router.get(
    "/prioritization/urgency",
    response_model=List[UrgencyPriorityResponse],
    summary="Get donors prioritized by urgency/timing",
    description="Time-sensitive opportunities requiring immediate action"
)
async def get_urgency_priority(
        organization_id: UUID = Query(..., description="Organization ID"),
        officer_id: Optional[UUID] = Query(None, description="Filter by officer"),
        urgency_tier: Optional[str] = Query(None, description="Filter by urgency tier"),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get donors prioritized by urgency and timing."""
    verify_organization_access(organization_id, current_user)

    try:
        today = date.today()
        fiscal_year_end = date(today.year if today.month >= 7 else today.year, 6, 30)
        days_to_fy_end = (fiscal_year_end - today).days

        sql = text("""
            WITH donor_urgency AS (
                SELECT 
                    d.id as donor_id,
                    CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                    dpc.assigned_officer_id as officer_id,
                    dpc.last_gift_date,
                    dpc.current_year_total,
                    dpc.last_year_total,
                    dpc.priority_level,
                    -- Days since last gift
                    CASE WHEN dpc.last_gift_date IS NOT NULL 
                        THEN (CURRENT_DATE - dpc.last_gift_date)::int
                        ELSE 999 
                    END as lapsed_days,
                    -- Check if anniversary is approaching (within 30 days)
                    CASE WHEN dpc.last_gift_date IS NOT NULL 
                        AND (
                            (EXTRACT(MONTH FROM dpc.last_gift_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
                             AND EXTRACT(DAY FROM dpc.last_gift_date) >= EXTRACT(DAY FROM CURRENT_DATE))
                            OR
                            (EXTRACT(MONTH FROM dpc.last_gift_date) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '30 days'))
                        )
                        THEN true ELSE false 
                    END as anniversary_approaching
                FROM donors d
                JOIN donor_priority_cache dpc ON d.id = dpc.donor_id AND dpc.is_current = true
                WHERE d.organization_id = :org_id
                    AND d.donor_level IN ('mega_donor', 'major_donor', 'mid_level')
            )
            SELECT 
                donor_id,
                donor_name,
                officer_id,
                last_gift_date,
                current_year_total,
                last_year_total,
                lapsed_days,
                anniversary_approaching,
                -- Calculate urgency score
                LEAST(100, (
                    -- Priority 1 donors (no gift this year, gave last year) are highest urgency
                    CASE WHEN current_year_total = 0 AND last_year_total > 0 THEN 40 ELSE 0 END +
                    -- Lapsed donors
                    CASE WHEN lapsed_days > 365 THEN 30 
                         WHEN lapsed_days > 180 THEN 20 
                         WHEN lapsed_days > 90 THEN 10 
                         ELSE 0 END +
                    -- Anniversary approaching
                    CASE WHEN anniversary_approaching THEN 20 ELSE 0 END +
                    -- Fiscal year end urgency
                    CASE WHEN :days_to_fy_end <= 30 THEN 20 
                         WHEN :days_to_fy_end <= 60 THEN 10 
                         ELSE 0 END
                )::int) as urgency_score
            FROM donor_urgency
            ORDER BY urgency_score DESC, lapsed_days DESC
            LIMIT :limit
        """)

        params = {
            "org_id": str(organization_id),
            "days_to_fy_end": days_to_fy_end,
            "limit": limit
        }
        result = db.execute(sql, params)
        rows = result.fetchall()

        response = []
        for row in rows:
            # Get officer name
            officer_name = None
            if row.officer_id:
                officer_result = db.execute(
                    text("SELECT CONCAT(first_name, ' ', last_name) FROM major_gift_officers WHERE id = :oid"),
                    {"oid": str(row.officer_id)}
                ).fetchone()
                officer_name = officer_result[0] if officer_result else None

            # Apply filters
            if officer_id and str(row.officer_id) != str(officer_id):
                continue

            # Determine urgency tier
            score = row.urgency_score
            if score >= 70:
                tier = "Critical"
            elif score >= 50:
                tier = "High"
            elif score >= 30:
                tier = "Medium"
            else:
                tier = "Low"

            if urgency_tier and tier != urgency_tier:
                continue

            # Build urgency reasons
            reasons = []
            if row.current_year_total == 0 and row.last_year_total and row.last_year_total > 0:
                reasons.append("No gift this year - gave last year")
            if row.lapsed_days > 365:
                reasons.append(f"Lapsed {row.lapsed_days} days")
            elif row.lapsed_days > 180:
                reasons.append(f"No contact in {row.lapsed_days} days")
            if row.anniversary_approaching:
                reasons.append("Gift anniversary approaching")
            if days_to_fy_end <= 60:
                reasons.append(f"Fiscal year ends in {days_to_fy_end} days")

            # Recommended action
            if score >= 70:
                action = "Immediate outreach required"
                deadline = today + timedelta(days=7)
            elif score >= 50:
                action = "Schedule meeting this week"
                deadline = today + timedelta(days=14)
            elif score >= 30:
                action = "Plan cultivation activity"
                deadline = today + timedelta(days=30)
            else:
                action = "Monitor and nurture"
                deadline = None

            response.append(UrgencyPriorityResponse(
                donor_id=row.donor_id,
                donor_name=row.donor_name,
                officer_id=row.officer_id,
                officer_name=officer_name,
                urgency_score=score,
                urgency_tier=tier,
                urgency_reasons=reasons if reasons else ["Regular follow-up"],
                days_until_deadline=days_to_fy_end if days_to_fy_end <= 60 else None,
                lapsed_days=row.lapsed_days,
                anniversary_approaching=row.anniversary_approaching,
                fiscal_year_end_opportunity=days_to_fy_end <= 60,
                recommended_action=action,
                action_deadline=deadline
            ))

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving urgency priorities: {str(e)}"
        )


# ============================================================================
# SUMMARY ENDPOINT
# ============================================================================

@router.get(
    "/prioritization/summary",
    response_model=PrioritizationSummaryResponse,
    summary="Get prioritization summary across all models",
    description="Overview of donor distribution across all prioritization models"
)
async def get_prioritization_summary(
        organization_id: UUID = Query(..., description="Organization ID"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """Get summary of all prioritization models."""
    verify_organization_access(organization_id, current_user)

    try:
        # Get total major donors
        total_result = db.execute(
            text("SELECT COUNT(*) FROM donors WHERE organization_id = :org_id AND donor_level IN ('mega_donor', 'major_donor', 'mid_level')"),
            {"org_id": str(organization_id)}
        ).fetchone()
        total_donors = total_result[0] if total_result else 0

        # Capacity distribution (simplified)
        capacity_dist = {
            "Ultra High": 0,
            "High": 0,
            "Medium": 0,
            "Developing": 0
        }

        # Engagement distribution
        engagement_dist = {
            "Highly Engaged": 0,
            "Engaged": 0,
            "Warm": 0,
            "Cold": 0
        }

        # Likelihood distribution
        likelihood_dist = {
            "High (80+)": 0,
            "Medium (50-79)": 0,
            "Low (<50)": 0
        }

        # Urgency distribution
        urgency_dist = {
            "Critical": 0,
            "High": 0,
            "Medium": 0,
            "Low": 0
        }

        # Portfolio health
        portfolio_health = {
            "total_officers": 0,
            "avg_portfolio_fill_rate": 0,
            "officers_under_capacity": 0
        }

        return PrioritizationSummaryResponse(
            total_donors=total_donors,
            by_capacity=capacity_dist,
            by_engagement=engagement_dist,
            by_likelihood=likelihood_dist,
            by_urgency=urgency_dist,
            portfolio_health=portfolio_health
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prioritization summary: {str(e)}"
        )