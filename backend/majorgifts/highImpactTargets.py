"""
High Impact Targets API - Identifies high-value donor prospects
Analyzes donors based on giving capacity, engagement, and opportunity
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_, desc, case, text
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from uuid import UUID
from decimal import Decimal

from database import get_db
from models import (
    Donors as Donor,
    DonorPriorityCache,
    MovesManagementStages as MovesManagementStage,
    GiftGoals as GiftGoal,
    SolicitationProposals as SolicitationProposal,
    DonorMeetings as DonorMeeting,
    MajorGiftOfficer,
    Donations as Donation,
    DonorExclusionTags as DonorExclusionTag
)
from user_management.auth_dependencies import get_current_user


router = APIRouter(prefix="/api/v1/major-gifts", tags=["major-gifts"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class HighImpactTarget(BaseModel):
    """High-impact donor target with enriched engagement metrics"""
    
    # Donor identification
    donor_id: UUID
    donor_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Giving profile
    donor_level: str
    priority_tier: int
    priority_description: str
    
    # Financial metrics
    opportunity_amount: Decimal = Field(description="Estimated next gift opportunity")
    giving_capacity: Optional[Decimal] = None
    wealth_rating: Optional[str] = None
    
    # Historical giving
    current_year_total: Decimal = Decimal("0")
    last_year_total: Decimal = Decimal("0")
    lifetime_value: Decimal = Decimal("0")
    largest_gift_amount: Decimal = Decimal("0")
    average_gift_amount: Decimal = Decimal("0")
    
    # Recent activity
    last_gift_date: Optional[date] = None
    days_since_last_gift: Optional[int] = None
    recent_meeting_count: int = 0
    last_interaction_date: Optional[date] = None
    
    # Moves management
    current_stage: Optional[str] = None
    stage_entered_date: Optional[date] = None
    next_steps: Optional[str] = None
    
    # Active goals and proposals
    active_gift_goals_count: int = 0
    active_gift_goals_total: Decimal = Decimal("0")
    pending_proposals_count: int = 0
    pending_proposals_total: Decimal = Decimal("0")
    
    # Portfolio assignment
    officer_id: Optional[UUID] = None
    officer_name: Optional[str] = None
    
    # Scoring metrics
    impact_score: float = Field(description="Calculated impact score (0-100)")
    engagement_level: str = Field(description="Hot, Warm, or Cold based on recent activity")
    readiness_indicator: str = Field(description="Ready, Developing, or Long-term")
    
    # Additional context
    exclusion_flags: List[str] = []
    notes_summary: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None,
            date: lambda v: v.isoformat() if v else None
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_impact_score(
    opportunity_amount: float,
    donor_level: str,
    priority_level: int,
    recent_meetings: int,
    days_since_gift: Optional[int],
    active_goals: int,
    pending_proposals: int,
    current_stage: Optional[str]
) -> float:
    """
    Calculate a composite impact score (0-100) based on multiple factors
    Higher score = higher priority target
    """
    score = 0.0
    
    # Opportunity size (0-30 points)
    if opportunity_amount >= 100000:
        score += 30
    elif opportunity_amount >= 50000:
        score += 25
    elif opportunity_amount >= 25000:
        score += 20
    elif opportunity_amount >= 10000:
        score += 15
    elif opportunity_amount >= 5000:
        score += 10
    else:
        score += 5
    
    # Donor level (0-20 points)
    donor_level_scores = {
        "mega_donor": 20,
        "major_donor": 15,
        "mid_level": 10,
        "upper_donor": 5,
        "lower_donor": 2
    }
    score += donor_level_scores.get(donor_level, 0)
    
    # Priority tier (0-15 points) - lower tier number = higher priority
    if priority_level == 1:
        score += 15
    elif priority_level == 2:
        score += 12
    elif priority_level == 3:
        score += 8
    elif priority_level == 4:
        score += 5
    else:
        score += 2
    
    # Recent engagement (0-15 points)
    if recent_meetings >= 3:
        score += 15
    elif recent_meetings >= 2:
        score += 10
    elif recent_meetings >= 1:
        score += 5
    
    # Recency of giving (0-10 points)
    if days_since_gift is not None:
        if days_since_gift <= 90:
            score += 10
        elif days_since_gift <= 180:
            score += 7
        elif days_since_gift <= 365:
            score += 4
        elif days_since_gift <= 730:
            score += 2
    
    # Active goals (0-5 points)
    if active_goals >= 2:
        score += 5
    elif active_goals >= 1:
        score += 3
    
    # Pending proposals (0-5 points)
    if pending_proposals >= 2:
        score += 5
    elif pending_proposals >= 1:
        score += 3
    
    # Moves stage bonus (0-5 points)
    stage_scores = {
        "solicitation": 5,
        "cultivation": 4,
        "qualification": 3,
        "stewardship": 2,
        "identification": 1
    }
    if current_stage:
        score += stage_scores.get(current_stage, 0)
    
    return min(round(score, 2), 100.0)


def determine_engagement_level(recent_meetings: int, days_since_last_gift: Optional[int], 
                               last_interaction_date: Optional[date]) -> str:
    """Determine engagement level: Hot, Warm, or Cold"""
    today = date.today()
    
    # Hot: Active recent engagement
    if recent_meetings >= 2 or (days_since_last_gift and days_since_last_gift <= 90):
        return "Hot"
    
    # Warm: Some recent activity
    if (recent_meetings >= 1 or 
        (days_since_last_gift and days_since_last_gift <= 180) or
        (last_interaction_date and (today - last_interaction_date).days <= 180)):
        return "Warm"
    
    # Cold: Limited recent activity
    return "Cold"


def determine_readiness_indicator(current_stage: Optional[str], 
                                 pending_proposals: int,
                                 active_goals: int,
                                 engagement_level: str) -> str:
    """Determine readiness for solicitation: Ready, Developing, or Long-term"""
    
    # Ready for solicitation
    if (current_stage == "solicitation" or 
        pending_proposals > 0 or
        (current_stage == "cultivation" and engagement_level == "Hot")):
        return "Ready"
    
    # Developing relationship
    if (current_stage in ["cultivation", "qualification"] or
        active_goals > 0 or
        engagement_level in ["Hot", "Warm"]):
        return "Developing"
    
    # Long-term cultivation needed
    return "Long-term"


def get_timeframe_date(timeframe: Optional[str]) -> Optional[date]:
    """Calculate the start date based on timeframe"""
    if not timeframe:
        return None
    
    today = date.today()
    if timeframe == "90_day":
        return today - timedelta(days=90)
    elif timeframe == "1_year":
        return today - timedelta(days=365)
    return None


# ============================================================================
# HIGH IMPACT TARGETS ENDPOINT
# ============================================================================

@router.get("/high-impact-targets/{organization_id}", response_model=List[HighImpactTarget])
async def get_high_impact_targets(
        organization_id: UUID,
        timeframe: Optional[str] = Query(None, regex="^(90_day|1_year)$", 
                                        description="Filter by recent activity timeframe"),
        min_opportunity: Optional[float] = Query(None, ge=0, 
                                                description="Minimum opportunity amount"),
        donor_level: Optional[str] = Query(None, 
                                          description="Filter by donor level: mega_donor, major_donor, mid_level"),
        priority_tier: Optional[int] = Query(None, ge=1, le=5,
                                            description="Filter by priority tier (1-5)"),
        stage: Optional[str] = Query(None,
                                    description="Filter by moves management stage"),
        engagement: Optional[str] = Query(None, regex="^(Hot|Warm|Cold)$",
                                        description="Filter by engagement level"),
        readiness: Optional[str] = Query(None, regex="^(Ready|Developing|Long-term)$",
                                       description="Filter by readiness indicator"),
        limit: int = Query(100, ge=1, le=500, description="Maximum targets to return"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get high-impact donor targets for major gift fundraising.
    
    Identifies donors with:
    - High giving capacity and opportunity
    - Priority classifications (especially Priority 1-2)
    - Recent engagement activity
    - Active in cultivation or solicitation stages
    - Active gift goals or pending proposals
    
    Results are scored and ranked by impact potential.
    """
    
    try:
        # Calculate timeframe date for filtering
        timeframe_date = get_timeframe_date(timeframe)
        
        # Base query: Get donors with priority cache data
        query = db.query(
            DonorPriorityCache,
            Donor,
            MovesManagementStage
        ).join(
            Donor, DonorPriorityCache.donor_id == Donor.id
        ).outerjoin(
            MovesManagementStage, 
            and_(
                MovesManagementStage.donor_id == Donor.id,
                MovesManagementStage.organization_id == organization_id
            )
        ).filter(
            DonorPriorityCache.organization_id == organization_id,
            DonorPriorityCache.is_current == True
        )
        
        # Apply filters
        if min_opportunity:
            query = query.filter(DonorPriorityCache.opportunity_amount >= min_opportunity)
        
        if donor_level:
            query = query.filter(DonorPriorityCache.current_donor_level == donor_level)
        
        if priority_tier:
            query = query.filter(DonorPriorityCache.priority_level == f"priority_{priority_tier}")
        
        if stage:
            query = query.filter(MovesManagementStage.current_stage == stage)
        
        # Focus on high-value opportunities (mega and major donors, priority 1-3)
        query = query.filter(
            or_(
                DonorPriorityCache.current_donor_level.in_(['mega_donor', 'major_donor']),
                DonorPriorityCache.priority_level.in_(['priority_1', 'priority_2', 'priority_3']),
                DonorPriorityCache.opportunity_amount >= 5000
            )
        )
        
        # Exclude donors with exclusion tags (estate gifts, bequests, etc.)
        query = query.filter(DonorPriorityCache.has_exclusion_tag == False)
        
        # Get base results
        results = query.limit(limit * 2).all()  # Get more than needed for post-filtering
        
        # Enrich results with additional data
        enriched_targets = []
        
        for priority_cache, donor, moves_stage in results:
            # Get recent meeting count
            recent_meetings = 0
            last_interaction_date = None
            if timeframe_date:
                recent_meetings = db.query(func.count(DonorMeeting.id)).filter(
                    DonorMeeting.donor_id == donor.id,
                    DonorMeeting.organization_id == organization_id,
                    DonorMeeting.actual_date >= timeframe_date
                ).scalar() or 0
                
                # Get last interaction date
                last_interaction = db.query(DonorMeeting.actual_date).filter(
                    DonorMeeting.donor_id == donor.id,
                    DonorMeeting.organization_id == organization_id
                ).order_by(desc(DonorMeeting.actual_date)).first()
                if last_interaction:
                    last_interaction_date = last_interaction[0]
            
            # Get active gift goals
            active_goals = db.query(
                func.count(GiftGoal.id).label('count'),
                func.sum(GiftGoal.goal_amount).label('total')
            ).filter(
                GiftGoal.donor_id == donor.id,
                GiftGoal.organization_id == organization_id,
                GiftGoal.status == 'active',
                GiftGoal.is_realized == False
            ).first()
            
            active_goals_count = active_goals.count if active_goals else 0
            active_goals_total = active_goals.total if active_goals and active_goals.total else Decimal("0")
            
            # Get pending proposals
            pending_proposals = db.query(
                func.count(SolicitationProposal.id).label('count'),
                func.sum(SolicitationProposal.requested_amount).label('total')
            ).filter(
                SolicitationProposal.donor_id == donor.id,
                SolicitationProposal.organization_id == organization_id,
                SolicitationProposal.status.in_(['sent', 'under_review'])
            ).first()
            
            pending_proposals_count = pending_proposals.count if pending_proposals else 0
            pending_proposals_total = pending_proposals.total if pending_proposals and pending_proposals.total else Decimal("0")
            
            # Get officer information
            officer_name = None
            officer_id = None
            if moves_stage and moves_stage.officer_id:
                officer = db.query(MajorGiftOfficer).filter(
                    MajorGiftOfficer.id == moves_stage.officer_id
                ).first()
                if officer:
                    officer_id = officer.id
                    officer_name = f"{officer.first_name} {officer.last_name}"
            
            # Extract priority tier number
            priority_tier_num = 5
            if priority_cache.priority_level:
                priority_level_str = str(priority_cache.priority_level)
                if 'priority_' in priority_level_str:
                    priority_tier_num = int(priority_level_str.split('_')[1])
            
            # Priority descriptions
            priority_descriptions = {
                1: "$0 this year with gifts last year - URGENT",
                2: "Last year's gifts > this year's gifts - High Priority",
                3: "No gifts since 2023 - Reactivation Needed",
                4: "No gifts since 2022 - Long-term Cultivation",
                5: "On track or exceeding - Stewardship Focus"
            }
            
            # Calculate metrics
            current_stage = str(moves_stage.current_stage) if moves_stage and moves_stage.current_stage else None
            days_since_gift = priority_cache.days_since_last_gift
            
            # Calculate impact score
            impact_score = calculate_impact_score(
                opportunity_amount=float(priority_cache.opportunity_amount or 0),
                donor_level=str(priority_cache.current_donor_level) if priority_cache.current_donor_level else "lower_donor",
                priority_level=priority_tier_num,
                recent_meetings=recent_meetings,
                days_since_gift=days_since_gift,
                active_goals=active_goals_count,
                pending_proposals=pending_proposals_count,
                current_stage=current_stage
            )
            
            # Determine engagement and readiness
            engagement_level = determine_engagement_level(
                recent_meetings=recent_meetings,
                days_since_last_gift=days_since_gift,
                last_interaction_date=last_interaction_date or moves_stage.last_interaction_date if moves_stage else None
            )
            
            readiness = determine_readiness_indicator(
                current_stage=current_stage,
                pending_proposals=pending_proposals_count,
                active_goals=active_goals_count,
                engagement_level=engagement_level
            )
            
            # Apply post-query filters
            if engagement and engagement_level != engagement:
                continue
            
            if readiness and readiness != readiness:
                continue
            
            # Get exclusion flags
            exclusion_flags = []
            if priority_cache.exclusion_tags:
                exclusion_flags = priority_cache.exclusion_tags or []
            
            # Build target object
            target = HighImpactTarget(
                donor_id=donor.id,
                donor_name=f"{donor.first_name or ''} {donor.last_name or ''}".strip() or "Unknown Donor",
                email=donor.email,
                phone=donor.phone,
                
                donor_level=str(priority_cache.current_donor_level) if priority_cache.current_donor_level else "lower_donor",
                priority_tier=priority_tier_num,
                priority_description=priority_descriptions.get(priority_tier_num, "Unknown Priority"),
                
                opportunity_amount=priority_cache.opportunity_amount or Decimal("0"),
                giving_capacity=donor.giving_capacity,
                wealth_rating=donor.wealth_rating,
                
                current_year_total=priority_cache.current_year_total or Decimal("0"),
                last_year_total=priority_cache.last_year_total or Decimal("0"),
                lifetime_value=donor.lifetime_value or Decimal("0"),
                largest_gift_amount=priority_cache.largest_gift_amount or Decimal("0"),
                average_gift_amount=donor.average_donation or Decimal("0"),
                
                last_gift_date=priority_cache.last_gift_date,
                days_since_last_gift=days_since_gift,
                recent_meeting_count=recent_meetings,
                last_interaction_date=last_interaction_date or (moves_stage.last_interaction_date if moves_stage else None),
                
                current_stage=current_stage,
                stage_entered_date=moves_stage.stage_entered_date if moves_stage else None,
                next_steps=moves_stage.next_steps if moves_stage else None,
                
                active_gift_goals_count=active_goals_count,
                active_gift_goals_total=active_goals_total,
                pending_proposals_count=pending_proposals_count,
                pending_proposals_total=pending_proposals_total,
                
                officer_id=officer_id,
                officer_name=officer_name,
                
                impact_score=impact_score,
                engagement_level=engagement_level,
                readiness_indicator=readiness,
                
                exclusion_flags=exclusion_flags,
                notes_summary=donor.notes[:200] if donor.notes else None
            )
            
            enriched_targets.append(target)
        
        # Sort by impact score descending
        enriched_targets.sort(key=lambda x: x.impact_score, reverse=True)
        
        # Apply limit after sorting
        enriched_targets = enriched_targets[:limit]
        
        return enriched_targets
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving high-impact targets: {str(e)}"
        )


# Export router
__all__ = ['router']
