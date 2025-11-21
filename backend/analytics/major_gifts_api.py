"""
Major Gifts Analytics API
Endpoints for major donor pipeline tracking, moves management, and prospect prioritization
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from decimal import Decimal

# Assuming you have these imports from your existing setup
from database import get_db
from models import Donors as Donor, Donations as Donation,  Organizations as Organization

router = APIRouter(prefix="/api/v1/analytics/major-gifts", tags=["major-gifts"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ProspectInPipeline(BaseModel):
    donor_id: str
    donor_name: str
    stage: str
    priority_score: float
    estimated_capacity: float
    current_giving: float
    last_gift_amount: float
    last_gift_date: Optional[datetime]
    lifetime_value: float
    engagement_level: int  # 1-5 from investment continuum
    next_action: str
    next_action_date: Optional[datetime]
    assigned_officer: Optional[str]
    days_in_stage: int
    probability: float
    projected_ask_amount: float
    projected_close_date: Optional[datetime]


class PipelineStage(BaseModel):
    stage: str
    count: int
    total_capacity: float
    avg_capacity: float
    weighted_value: float  # count * probability * avg_capacity
    conversion_rate: float


class MajorGiftsPipelineResponse(BaseModel):
    summary: Dict[str, Any]
    pipeline_stages: List[PipelineStage]
    prospects: List[ProspectInPipeline]
    velocity_metrics: Dict[str, float]
    organization_id: str
    generated_at: datetime


class Move(BaseModel):
    move_id: str
    donor_id: str
    donor_name: str
    move_type: str  # qualification, cultivation, solicitation, stewardship
    status: str  # planned, in_progress, completed, cancelled
    priority: str  # high, medium, low
    description: str
    assigned_to: str
    due_date: Optional[datetime]
    completed_date: Optional[datetime]
    stage_from: Optional[str]
    stage_to: Optional[str]
    outcome: Optional[str]
    notes: Optional[str]


class MovesManagementResponse(BaseModel):
    moves_by_stage: Dict[str, List[Move]]
    moves_by_officer: Dict[str, int]
    overdue_moves: List[Move]
    upcoming_moves: List[Move]
    completion_rate: float
    avg_days_to_complete: float
    organization_id: str
    generated_at: datetime


class NextAction(BaseModel):
    donor_id: str
    donor_name: str
    priority: str
    action_type: str
    action_description: str
    due_date: datetime
    estimated_capacity: float
    current_stage: str
    days_since_last_contact: int
    urgency_score: float


class NextActionsResponse(BaseModel):
    high_priority: List[NextAction]
    medium_priority: List[NextAction]
    low_priority: List[NextAction]
    overdue: List[NextAction]
    this_week: List[NextAction]
    summary: Dict[str, int]
    organization_id: str
    generated_at: datetime


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_capacity_score(donor_data: Dict) -> float:
    """Calculate estimated giving capacity based on donor history"""
    lifetime_value = donor_data.get('lifetime_value', 0)
    largest_gift = donor_data.get('largest_gift', 0)
    avg_gift = donor_data.get('avg_gift', 0)

    # Capacity = max(3x largest gift, 5x average gift, 2x lifetime value)
    capacity_estimates = [
        largest_gift * 3,
        avg_gift * 5,
        lifetime_value * 2
    ]

    return max(capacity_estimates)


def determine_pipeline_stage(donor_data: Dict) -> str:
    """Determine appropriate pipeline stage based on donor behavior"""
    total_gifts = donor_data.get('total_gifts', 0)
    lifetime_value = donor_data.get('lifetime_value', 0)
    days_since_last_gift = donor_data.get('days_since_last_gift', 999)
    largest_gift = donor_data.get('largest_gift', 0)

    # Stage determination logic
    if largest_gift >= 25000:
        if days_since_last_gift <= 90:
            return "Stewardship"
        else:
            return "Re-engagement"
    elif largest_gift >= 10000:
        if total_gifts >= 3:
            return "Solicitation"
        else:
            return "Cultivation"
    elif largest_gift >= 5000:
        return "Qualification"
    else:
        return "Identification"


def calculate_probability(stage: str, engagement_level: int) -> float:
    """Calculate probability of gift based on stage and engagement"""
    stage_probabilities = {
        "Identification": 0.10,
        "Qualification": 0.25,
        "Cultivation": 0.40,
        "Solicitation": 0.70,
        "Stewardship": 0.90,
        "Re-engagement": 0.30
    }

    base_prob = stage_probabilities.get(stage, 0.25)
    engagement_multiplier = 0.5 + (engagement_level * 0.1)  # 0.6 to 1.0

    return min(base_prob * engagement_multiplier, 0.95)


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/pipeline/{organization_id}", response_model=MajorGiftsPipelineResponse)
async def get_major_gifts_pipeline(
        organization_id: str,
        min_capacity: float = 10000.0,
        db: Session = Depends(get_db)
):
    """
    Get major gifts pipeline with prospects, stages, and velocity metrics

    Args:
        organization_id: Organization UUID
        min_capacity: Minimum estimated capacity to include (default $10K)

    Returns:
        Complete pipeline analysis with prospects and stage metrics
    """

    # Query major donors (>= $5K lifetime or single gift >= $2.5K)
    major_donors = db.query(
        Donor.id.label('donor_id'),
        Donor.first_name,
        Donor.last_name,
        func.count(Donation.id).label('total_gifts'),
        func.sum(Donation.amount).label('lifetime_value'),
        func.max(Donation.amount).label('largest_gift'),
        func.avg(Donation.amount).label('avg_gift'),
        func.max(Donation.donation_date).label('last_gift_date'),
        func.max(Donation.amount).filter(
            Donation.donation_date == func.max(Donation.donation_date)
        ).label('last_gift_amount')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name
    ).having(
        or_(
            func.sum(Donation.amount) >= 5000,
            func.max(Donation.amount) >= 2500
        )
    ).all()

    prospects = []
    pipeline_stages_count = {}

    for donor in major_donors:
        # Calculate metrics
        donor_dict = {
            'lifetime_value': float(donor.lifetime_value or 0),
            'largest_gift': float(donor.largest_gift or 0),
            'avg_gift': float(donor.avg_gift or 0),
            'total_gifts': donor.total_gifts,
            'days_since_last_gift': (datetime.now() - donor.last_gift_date).days if donor.last_gift_date else 999
        }

        estimated_capacity = calculate_capacity_score(donor_dict)

        # Filter by minimum capacity
        if estimated_capacity < min_capacity:
            continue

        stage = determine_pipeline_stage(donor_dict)

        # Get engagement level (mock - should come from investment continuum API)
        engagement_level = min(5, max(1, int(donor.total_gifts / 2) + 2))

        probability = calculate_probability(stage, engagement_level)

        # Calculate days in stage (mock - should track stage changes)
        days_in_stage = min(donor_dict['days_since_last_gift'], 180)

        # Determine next action
        next_actions_map = {
            "Identification": "Research prospect capacity and interests",
            "Qualification": "Schedule discovery meeting",
            "Cultivation": "Present giving opportunity aligned with interests",
            "Solicitation": "Prepare and deliver proposal",
            "Stewardship": "Send impact report and schedule gratitude call",
            "Re-engagement": "Personalized outreach to re-establish relationship"
        }

        prospect = ProspectInPipeline(
            donor_id=donor.donor_id,
            donor_name=f"{donor.first_name} {donor.last_name}",
            stage=stage,
            priority_score=round(estimated_capacity * probability / 10000, 2),
            estimated_capacity=estimated_capacity,
            current_giving=float(donor.lifetime_value),
            last_gift_amount=float(donor.last_gift_amount or 0),
            last_gift_date=donor.last_gift_date,
            lifetime_value=float(donor.lifetime_value),
            engagement_level=engagement_level,
            next_action=next_actions_map.get(stage, "Follow up"),
            next_action_date=datetime.now() + timedelta(days=7),
            assigned_officer="Gift Officer",  # Mock - should come from assignments table
            days_in_stage=days_in_stage,
            probability=probability,
            projected_ask_amount=estimated_capacity * 0.5,  # Ask for 50% of capacity
            projected_close_date=datetime.now() + timedelta(days=90) if stage in ["Solicitation", "Cultivation"] else None
        )

        prospects.append(prospect)

        # Count by stage
        pipeline_stages_count[stage] = pipeline_stages_count.get(stage, 0) + 1

    # Calculate pipeline stage metrics
    pipeline_stages = []
    stage_order = ["Identification", "Qualification", "Cultivation", "Solicitation", "Stewardship", "Re-engagement"]

    for stage in stage_order:
        stage_prospects = [p for p in prospects if p.stage == stage]

        if stage_prospects:
            total_capacity = sum(p.estimated_capacity for p in stage_prospects)
            avg_capacity = total_capacity / len(stage_prospects)
            avg_probability = sum(p.probability for p in stage_prospects) / len(stage_prospects)
            weighted_value = total_capacity * avg_probability

            # Mock conversion rate - should be calculated from historical data
            conversion_rates = {
                "Identification": 0.40,
                "Qualification": 0.60,
                "Cultivation": 0.75,
                "Solicitation": 0.85,
                "Stewardship": 0.95,
                "Re-engagement": 0.50
            }

            pipeline_stages.append(PipelineStage(
                stage=stage,
                count=len(stage_prospects),
                total_capacity=total_capacity,
                avg_capacity=avg_capacity,
                weighted_value=weighted_value,
                conversion_rate=conversion_rates.get(stage, 0.5)
            ))

    # Calculate velocity metrics
    total_capacity = sum(p.estimated_capacity for p in prospects)
    total_weighted = sum(p.estimated_capacity * p.probability for p in prospects)
    avg_days_in_stage = sum(p.days_in_stage for p in prospects) / len(prospects) if prospects else 0

    # Pipeline velocity = weighted value / avg days in stage
    velocity = (total_weighted / avg_days_in_stage * 30) if avg_days_in_stage > 0 else 0

    summary = {
        "total_prospects": len(prospects),
        "total_pipeline_value": total_capacity,
        "weighted_pipeline_value": total_weighted,
        "average_capacity": total_capacity / len(prospects) if prospects else 0,
        "pipeline_coverage_ratio": total_weighted / 1000000,  # Assuming $1M annual goal
        "top_25_value": sum(p.estimated_capacity for p in sorted(prospects, key=lambda x: x.estimated_capacity, reverse=True)[:25])
    }

    velocity_metrics = {
        "avg_days_in_stage": avg_days_in_stage,
        "pipeline_velocity_monthly": velocity,
        "expected_close_rate": sum(p.probability for p in prospects) / len(prospects) if prospects else 0,
        "projected_revenue_90_days": sum(
            p.projected_ask_amount * p.probability
            for p in prospects
            if p.projected_close_date and (p.projected_close_date - datetime.now()).days <= 90
        )
    }

    return MajorGiftsPipelineResponse(
        summary=summary,
        pipeline_stages=pipeline_stages,
        prospects=sorted(prospects, key=lambda x: x.priority_score, reverse=True),
        velocity_metrics=velocity_metrics,
        organization_id=organization_id,
        generated_at=datetime.now()
    )


@router.get("/moves-management/{organization_id}", response_model=MovesManagementResponse)
async def get_moves_management(
        organization_id: str,
        days_back: int = 90,
        days_forward: int = 30,
        db: Session = Depends(get_db)
):
    """
    Get moves management dashboard with planned and completed moves

    Args:
        organization_id: Organization UUID
        days_back: Days to look back for completed moves
        days_forward: Days to look forward for upcoming moves

    Returns:
        Moves organized by stage, officer, and timeline
    """

    # In a real implementation, you'd query a DonorInteraction or Moves table
    # For now, generating sample data based on donor activity

    start_date = datetime.now() - timedelta(days=days_back)
    end_date = datetime.now() + timedelta(days=days_forward)

    # Query recent interactions/donations as proxy for moves
    interactions = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donation.donation_date,
        Donation.amount,
        Donation.campaign
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == organization_id,
        Donation.amount >= 2500,  # Major gift threshold
        Donation.donation_date >= start_date
    ).order_by(
        desc(Donation.donation_date)
    ).limit(100).all()

    # Generate moves from interactions
    moves_list = []
    move_types = ["qualification", "cultivation", "solicitation", "stewardship"]
    statuses = ["completed", "in_progress", "planned"]
    priorities = ["high", "medium", "low"]

    for idx, interaction in enumerate(interactions):
        # Determine move type based on amount and recency
        if interaction.amount >= 25000:
            move_type = "stewardship"
            priority = "high"
        elif interaction.amount >= 10000:
            move_type = "solicitation"
            priority = "high"
        elif interaction.amount >= 5000:
            move_type = "cultivation"
            priority = "medium"
        else:
            move_type = "qualification"
            priority = "low"

        # Determine status based on date
        days_ago = (datetime.now() - interaction.donation_date).days
        if days_ago < 7:
            status = "completed"
            completed_date = interaction.donation_date
            due_date = interaction.donation_date - timedelta(days=3)
        elif days_ago < 30:
            status = "in_progress"
            completed_date = None
            due_date = datetime.now() + timedelta(days=7)
        else:
            status = "planned"
            completed_date = None
            due_date = datetime.now() + timedelta(days=14)

        move = Move(
            move_id=f"MOVE-{idx+1:04d}",
            donor_id=interaction.id,
            donor_name=f"{interaction.first_name} {interaction.last_name}",
            move_type=move_type,
            status=status,
            priority=priority,
            description=f"{move_type.title()} activity for ${interaction.amount:,.0f} {move_type}",
            assigned_to="Major Gifts Officer",
            due_date=due_date,
            completed_date=completed_date,
            stage_from="cultivation" if move_type == "solicitation" else None,
            stage_to=move_type if move_type != "qualification" else "cultivation",
            outcome="Successful" if status == "completed" else None,
            notes=f"Campaign: {interaction.campaign}" if interaction.campaign else None
        )

        moves_list.append(move)

    # Organize moves
    moves_by_stage = {
        "qualification": [m for m in moves_list if m.move_type == "qualification"],
        "cultivation": [m for m in moves_list if m.move_type == "cultivation"],
        "solicitation": [m for m in moves_list if m.move_type == "solicitation"],
        "stewardship": [m for m in moves_list if m.move_type == "stewardship"]
    }

    moves_by_officer = {}
    for move in moves_list:
        officer = move.assigned_to
        moves_by_officer[officer] = moves_by_officer.get(officer, 0) + 1

    overdue_moves = [m for m in moves_list if m.status != "completed" and m.due_date < datetime.now()]
    upcoming_moves = [m for m in moves_list if m.status == "planned" and m.due_date <= datetime.now() + timedelta(days=7)]

    # Calculate completion metrics
    completed = len([m for m in moves_list if m.status == "completed"])
    total = len(moves_list)
    completion_rate = (completed / total * 100) if total > 0 else 0

    completed_moves = [m for m in moves_list if m.status == "completed" and m.completed_date and m.due_date]
    if completed_moves:
        avg_days = sum((m.completed_date - m.due_date).days for m in completed_moves) / len(completed_moves)
    else:
        avg_days = 0

    return MovesManagementResponse(
        moves_by_stage=moves_by_stage,
        moves_by_officer=moves_by_officer,
        overdue_moves=overdue_moves,
        upcoming_moves=upcoming_moves,
        completion_rate=completion_rate,
        avg_days_to_complete=avg_days,
        organization_id=organization_id,
        generated_at=datetime.now()
    )


@router.get("/next-actions/{organization_id}", response_model=NextActionsResponse)
async def get_next_actions(
        organization_id: str,
        limit: int = 50,
        db: Session = Depends(get_db)
):
    """
    Get prioritized next actions for major gift prospects

    Args:
        organization_id: Organization UUID
        limit: Maximum number of actions to return

    Returns:
        Prioritized action items organized by urgency
    """

    # Query major donors with recent activity
    donors_data = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        func.max(Donation.donation_date).label('last_gift_date'),
        func.max(Donation.amount).label('last_gift_amount'),
        func.sum(Donation.amount).label('lifetime_value'),
        func.count(Donation.id).label('gift_count')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name
    ).having(
        or_(
            func.sum(Donation.amount) >= 5000,
            func.max(Donation.amount) >= 2500
        )
    ).limit(limit).all()

    actions = []

    for donor in donors_data:
        days_since_contact = (datetime.now() - donor.last_gift_date).days if donor.last_gift_date else 365

        donor_dict = {
            'lifetime_value': float(donor.lifetime_value or 0),
            'largest_gift': float(donor.last_gift_amount or 0),
            'avg_gift': float(donor.lifetime_value / donor.gift_count) if donor.gift_count > 0 else 0,
            'total_gifts': donor.gift_count,
            'days_since_last_gift': days_since_contact
        }

        estimated_capacity = calculate_capacity_score(donor_dict)
        stage = determine_pipeline_stage(donor_dict)

        # Determine priority based on capacity, recency, and stage
        if estimated_capacity >= 50000 and days_since_contact <= 60:
            priority = "high"
            urgency_score = 0.9
        elif estimated_capacity >= 25000 and days_since_contact <= 90:
            priority = "high"
            urgency_score = 0.8
        elif estimated_capacity >= 10000 and days_since_contact <= 120:
            priority = "medium"
            urgency_score = 0.6
        elif days_since_contact > 180:
            priority = "high"  # Re-engagement is urgent
            urgency_score = 0.75
        else:
            priority = "low"
            urgency_score = 0.4

        # Determine action type and description
        action_map = {
            "Identification": ("research", f"Complete capacity research and wealth screening"),
            "Qualification": ("meeting", f"Schedule qualification meeting to assess interest"),
            "Cultivation": ("proposal", f"Develop customized giving proposal"),
            "Solicitation": ("ask", f"Schedule solicitation meeting for ${estimated_capacity * 0.5:,.0f}"),
            "Stewardship": ("gratitude", f"Send impact report and schedule thank you call"),
            "Re-engagement": ("outreach", f"Personalized re-engagement outreach after {days_since_contact} days")
        }

        action_type, action_desc = action_map.get(stage, ("follow_up", "Follow up with prospect"))

        # Calculate due date based on urgency
        if urgency_score >= 0.8:
            due_days = 3
        elif urgency_score >= 0.6:
            due_days = 7
        else:
            due_days = 14

        action = NextAction(
            donor_id=donor.id,
            donor_name=f"{donor.first_name} {donor.last_name}",
            priority=priority,
            action_type=action_type,
            action_description=action_desc,
            due_date=datetime.now() + timedelta(days=due_days),
            estimated_capacity=estimated_capacity,
            current_stage=stage,
            days_since_last_contact=days_since_contact,
            urgency_score=urgency_score
        )

        actions.append(action)

    # Sort by urgency score
    actions.sort(key=lambda x: x.urgency_score, reverse=True)

    # Categorize actions
    high_priority = [a for a in actions if a.priority == "high"]
    medium_priority = [a for a in actions if a.priority == "medium"]
    low_priority = [a for a in actions if a.priority == "low"]
    overdue = [a for a in actions if a.due_date < datetime.now()]
    this_week = [a for a in actions if a.due_date <= datetime.now() + timedelta(days=7)]

    summary = {
        "total_actions": len(actions),
        "high_priority": len(high_priority),
        "medium_priority": len(medium_priority),
        "low_priority": len(low_priority),
        "overdue": len(overdue),
        "due_this_week": len(this_week)
    }

    return NextActionsResponse(
        high_priority=high_priority[:20],
        medium_priority=medium_priority[:20],
        low_priority=low_priority[:10],
        overdue=overdue,
        this_week=this_week,
        summary=summary,
        organization_id=organization_id,
        generated_at=datetime.now()
    )