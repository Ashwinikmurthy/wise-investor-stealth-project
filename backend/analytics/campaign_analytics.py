"""
Campaign Performance Analytics API
Endpoints for campaign tracking, ROI analysis, and active campaign monitoring
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from decimal import Decimal
from enum import Enum
from database import get_db
from models import Donors as Donor, Donations as Donation, Campaigns as Campaign , Organizations as Organization
# Assuming you have these imports from your existing setup
# from database import get_db
#

router = APIRouter(prefix="/api/v1/analytics/campaigns", tags=["campaigns"])


# ============================================================================
# ENUMS
# ============================================================================

class CampaignStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PLANNED = "planned"
    CANCELLED = "cancelled"


class CampaignType(str, Enum):
    ANNUAL = "annual"
    MAJOR_GIFTS = "major_gifts"
    MONTHLY_GIVING = "monthly_giving"
    EVENT = "event"
    CAPITAL = "capital"
    EMERGENCY = "emergency"
    PEER_TO_PEER = "peer_to_peer"


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ActiveCampaign(BaseModel):
    campaign_id: str
    campaign_name: str
    campaign_type: str
    status: str
    start_date: datetime
    end_date: datetime
    goal_amount: float
    raised_to_date: float
    donor_count: int
    avg_gift: float
    largest_gift: float
    progress_percentage: float
    days_remaining: int
    daily_average_needed: float
    pace: str  # ahead, on_track, behind
    projected_total: float
    confidence_level: float


class ActiveCampaignsResponse(BaseModel):
    summary: Dict[str, Any]
    campaigns: List[ActiveCampaign]
    organization_id: str
    generated_at: datetime


class CampaignPerformanceDetail(BaseModel):
    campaign_id: str
    campaign_name: str
    campaign_type: str
    start_date: datetime
    end_date: datetime
    duration_days: int

    # Financial metrics
    goal: float
    raised: float
    expenses: float
    net_revenue: float
    roi_percentage: float

    # Donor metrics
    total_donors: int
    new_donors: int
    repeat_donors: int
    lapsed_reactivated: int
    upgraded_donors: int

    # Gift metrics
    total_gifts: int
    avg_gift: float
    median_gift: float
    largest_gift: float
    smallest_gift: float

    # Engagement metrics
    participation_rate: float
    conversion_rate: float
    retention_rate: float

    # Performance indicators
    cost_per_dollar_raised: float
    cost_per_donor_acquired: float
    donor_ltv_ratio: float

    # Comparative metrics
    vs_goal_percentage: float
    vs_last_year_percentage: float
    benchmark_comparison: str


class CampaignPerformanceResponse(BaseModel):
    campaign: CampaignPerformanceDetail
    daily_progress: List[Dict[str, Any]]
    gift_distribution: Dict[str, int]
    donor_segments: Dict[str, Dict[str, Any]]
    timeline_milestones: List[Dict[str, Any]]
    organization_id: str
    generated_at: datetime


class CampaignROI(BaseModel):
    campaign_id: str
    campaign_name: str
    campaign_type: str
    total_raised: float
    total_expenses: float
    net_revenue: float
    roi_percentage: float
    cost_per_dollar: float
    break_even_point: float
    payback_period_days: int
    donor_acquisition_cost: float
    donor_lifetime_value: float
    ltv_to_cac_ratio: float
    efficiency_score: float


class ROIAnalysisResponse(BaseModel):
    summary: Dict[str, Any]
    campaigns: List[CampaignROI]
    roi_trends: List[Dict[str, Any]]
    efficiency_benchmarks: Dict[str, float]
    recommendations: List[str]
    organization_id: str
    generated_at: datetime


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_campaign_pace(current: float, goal: float, days_elapsed: int, total_days: int) -> str:
    """Determine if campaign is ahead, on track, or behind schedule"""
    if total_days == 0:
        return "on_track"

    expected_progress = (days_elapsed / total_days) * goal
    variance = (current - expected_progress) / goal if goal > 0 else 0

    if variance > 0.10:  # More than 10% ahead
        return "ahead"
    elif variance < -0.10:  # More than 10% behind
        return "behind"
    else:
        return "on_track"


def project_final_total(current: float, days_elapsed: int, total_days: int) -> float:
    """Project final campaign total based on current pace"""
    if days_elapsed == 0:
        return current

    daily_rate = current / days_elapsed
    return daily_rate * total_days


def calculate_confidence_level(donor_count: int, days_remaining: int, current_progress: float) -> float:
    """Calculate confidence in meeting goal (0-100)"""
    # More donors = higher confidence
    donor_confidence = min(100, donor_count * 2)

    # More time remaining = lower confidence in current projection
    time_confidence = max(50, 100 - (days_remaining * 0.5))

    # Higher current progress = higher confidence
    progress_confidence = min(100, current_progress * 1.2)

    return round((donor_confidence * 0.3 + time_confidence * 0.3 + progress_confidence * 0.4), 1)


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/active/{organization_id}", response_model=ActiveCampaignsResponse)
async def get_active_campaigns(
        organization_id: str,
        status: Optional[CampaignStatus] = CampaignStatus.ACTIVE,
        db: Session = Depends(get_db)
):
    """
    Get all active campaigns with real-time metrics

    Args:
        organization_id: Organization UUID
        status: Filter by campaign status (default: active)

    Returns:
        List of active campaigns with progress metrics
    """

    current_date = datetime.now()

    # Query campaigns
    # In real implementation, query Campaign table
    # For now, generating from donation data grouped by campaign

    campaign_data = db.query(
        Donation.campaign.label('campaign_name'),
        func.min(Donation.donation_date).label('start_date'),
        func.max(Donation.donation_date).label('end_date'),
        func.sum(Donation.amount).label('raised'),
        func.count(func.distinct(Donation.donor_id)).label('donor_count'),
        func.avg(Donation.amount).label('avg_gift'),
        func.max(Donation.amount).label('largest_gift'),
        func.count(Donation.id).label('gift_count')
    ).filter(
        Donation.organization_id == organization_id,
        Donation.campaign.isnot(None),
        Donation.donation_date >= current_date - timedelta(days=365)
    ).group_by(
        Donation.campaign
    ).all()

    campaigns = []

    for idx, camp in enumerate(campaign_data):
        # Determine if campaign is active
        is_active = (current_date - camp.end_date).days <= 30

        if status == CampaignStatus.ACTIVE and not is_active:
            continue

        # Calculate campaign metrics
        raised = float(camp.raised)

        # Mock goal (in real implementation, get from Campaign table)
        # Set goal as 120% of current raised for active campaigns
        goal = raised * 1.2 if is_active else raised * 1.05

        duration = (camp.end_date - camp.start_date).days
        days_elapsed = (current_date - camp.start_date).days
        days_remaining = max(0, (camp.end_date - current_date).days)

        progress_pct = (raised / goal * 100) if goal > 0 else 0

        # Calculate daily average needed
        if days_remaining > 0 and goal > raised:
            daily_avg_needed = (goal - raised) / days_remaining
        else:
            daily_avg_needed = 0

        # Determine pace
        pace = calculate_campaign_pace(raised, goal, days_elapsed, duration)

        # Project final total
        projected_total = project_final_total(raised, days_elapsed, duration)

        # Calculate confidence
        confidence = calculate_confidence_level(camp.donor_count, days_remaining, progress_pct)

        # Determine campaign type (mock - should be in database)
        campaign_types = ["annual", "major_gifts", "monthly_giving", "event"]
        campaign_type = campaign_types[idx % len(campaign_types)]

        campaign = ActiveCampaign(
            campaign_id=f"CAMP-{idx+1:04d}",
            campaign_name=camp.campaign_name,
            campaign_type=campaign_type,
            status="active" if is_active else "completed",
            start_date=camp.start_date,
            end_date=camp.end_date,
            goal_amount=goal,
            raised_to_date=raised,
            donor_count=camp.donor_count,
            avg_gift=float(camp.avg_gift),
            largest_gift=float(camp.largest_gift),
            progress_percentage=round(progress_pct, 1),
            days_remaining=days_remaining,
            daily_average_needed=daily_avg_needed,
            pace=pace,
            projected_total=projected_total,
            confidence_level=confidence
        )

        campaigns.append(campaign)

    # Calculate summary
    total_goal = sum(c.goal_amount for c in campaigns)
    total_raised = sum(c.raised_to_date for c in campaigns)
    total_donors = sum(c.donor_count for c in campaigns)

    ahead_count = len([c for c in campaigns if c.pace == "ahead"])
    on_track_count = len([c for c in campaigns if c.pace == "on_track"])
    behind_count = len([c for c in campaigns if c.pace == "behind"])

    summary = {
        "total_campaigns": len(campaigns),
        "total_goal": total_goal,
        "total_raised": total_raised,
        "overall_progress": round((total_raised / total_goal * 100) if total_goal > 0 else 0, 1),
        "total_donors": total_donors,
        "campaigns_ahead": ahead_count,
        "campaigns_on_track": on_track_count,
        "campaigns_behind": behind_count,
        "avg_confidence": round(sum(c.confidence_level for c in campaigns) / len(campaigns), 1) if campaigns else 0
    }

    return ActiveCampaignsResponse(
        summary=summary,
        campaigns=sorted(campaigns, key=lambda x: x.raised_to_date, reverse=True),
        organization_id=organization_id,
        generated_at=datetime.now()
    )


@router.get("/{campaign_id}/performance", response_model=CampaignPerformanceResponse)
async def get_campaign_performance(
        campaign_id: str,
        organization_id: str,
        db: Session = Depends(get_db)
):
    """
    Get detailed performance metrics for a specific campaign

    Args:
        campaign_id: Campaign UUID or name
        organization_id: Organization UUID

    Returns:
        Comprehensive campaign performance analysis
    """

    # Query campaign donations
    campaign_donations = db.query(
        Donation.donation_date,
        Donation.amount,
        Donation.donor_id,
        Donor.first_name,
        Donor.last_name
    ).join(
        Donor, Donation.donor_id == Donor.id
    ).filter(
        Donation.organization_id == organization_id,
        or_(
            Donation.id == campaign_id,
            Donation.campaign == campaign_id
        )
    ).order_by(
        Donation.donation_date
    ).all()

    if not campaign_donations:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Calculate campaign metrics
    start_date = min(d.donation_date for d in campaign_donations)
    end_date = max(d.donation_date for d in campaign_donations)
    duration = (end_date - start_date).days + 1

    total_raised = sum(float(d.amount) for d in campaign_donations)
    total_gifts = len(campaign_donations)
    unique_donors = len(set(d.donor_id for d in campaign_donations))

    # Mock additional metrics
    goal = total_raised * 1.15  # Assume goal was 115% of raised
    expenses = total_raised * 0.08  # 8% expense ratio
    net_revenue = total_raised - expenses
    roi = ((net_revenue - expenses) / expenses * 100) if expenses > 0 else 0

    # Donor analysis
    # Query donor history to determine new vs repeat
    new_donors = 0
    repeat_donors = 0

    for donor_id in set(d.donor_id for d in campaign_donations):
        prior_gifts = db.query(func.count(Donation.id)).filter(
            Donation.donor_id == donor_id,
            Donation.donation_date < start_date
        ).scalar()

        if prior_gifts == 0:
            new_donors += 1
        else:
            repeat_donors += 1

    # Mock other donor metrics
    lapsed_reactivated = int(unique_donors * 0.15)
    upgraded_donors = int(unique_donors * 0.20)

    # Gift metrics
    amounts = [float(d.amount) for d in campaign_donations]
    amounts.sort()

    median_gift = amounts[len(amounts) // 2] if amounts else 0

    # Engagement metrics
    # Mock database totals
    total_org_donors = db.query(func.count(func.distinct(Donor.id))).filter(
        Donor.organization_id == organization_id
    ).scalar()

    participation_rate = (unique_donors / total_org_donors * 100) if total_org_donors > 0 else 0
    conversion_rate = (unique_donors / (total_org_donors * 2) * 100)  # Mock: assume 2x were solicited
    retention_rate = (repeat_donors / unique_donors * 100) if unique_donors > 0 else 0

    # Cost metrics
    cost_per_dollar = expenses / total_raised if total_raised > 0 else 0
    cost_per_donor = expenses / new_donors if new_donors > 0 else 0

    # Mock LTV (should calculate actual)
    avg_donor_ltv = 5000
    donor_ltv_ratio = avg_donor_ltv / cost_per_donor if cost_per_donor > 0 else 0

    # Comparative metrics
    vs_goal = (total_raised / goal * 100) if goal > 0 else 0
    vs_last_year = 15.5  # Mock: 15.5% increase YoY

    # Determine benchmark comparison
    if roi >= 400:
        benchmark = "Excellent (Top 10%)"
    elif roi >= 300:
        benchmark = "Above Average"
    elif roi >= 200:
        benchmark = "Average"
    else:
        benchmark = "Below Average"

    campaign_detail = CampaignPerformanceDetail(
        campaign_id=campaign_id,
        campaign_name=campaign_donations[0].donation_date.strftime('%B %Y Campaign'),  # Mock name
        campaign_type="annual",
        start_date=start_date,
        end_date=end_date,
        duration_days=duration,
        goal=goal,
        raised=total_raised,
        expenses=expenses,
        net_revenue=net_revenue,
        roi_percentage=round(roi, 1),
        total_donors=unique_donors,
        new_donors=new_donors,
        repeat_donors=repeat_donors,
        lapsed_reactivated=lapsed_reactivated,
        upgraded_donors=upgraded_donors,
        total_gifts=total_gifts,
        avg_gift=total_raised / total_gifts if total_gifts > 0 else 0,
        median_gift=median_gift,
        largest_gift=max(amounts) if amounts else 0,
        smallest_gift=min(amounts) if amounts else 0,
        participation_rate=round(participation_rate, 1),
        conversion_rate=round(conversion_rate, 1),
        retention_rate=round(retention_rate, 1),
        cost_per_dollar_raised=round(cost_per_dollar, 3),
        cost_per_donor_acquired=round(cost_per_donor, 2),
        donor_ltv_ratio=round(donor_ltv_ratio, 2),
        vs_goal_percentage=round(vs_goal, 1),
        vs_last_year_percentage=vs_last_year,
        benchmark_comparison=benchmark
    )

    # Daily progress
    daily_progress = []
    running_total = 0

    for day_offset in range(duration):
        day = start_date + timedelta(days=day_offset)
        day_gifts = [d for d in campaign_donations if d.donation_date.date() == day.date()]
        day_amount = sum(float(d.amount) for d in day_gifts)
        running_total += day_amount

        daily_progress.append({
            "date": day.strftime('%Y-%m-%d'),
            "daily_amount": day_amount,
            "daily_gifts": len(day_gifts),
            "cumulative_amount": running_total,
            "progress_percentage": round((running_total / goal * 100), 1)
        })

    # Gift distribution
    gift_ranges = {
        "$1-$99": len([a for a in amounts if a < 100]),
        "$100-$499": len([a for a in amounts if 100 <= a < 500]),
        "$500-$999": len([a for a in amounts if 500 <= a < 1000]),
        "$1,000-$4,999": len([a for a in amounts if 1000 <= a < 5000]),
        "$5,000+": len([a for a in amounts if a >= 5000])
    }

    # Donor segments
    donor_segments = {
        "New Donors": {
            "count": new_donors,
            "total_raised": total_raised * 0.35,  # Mock: 35% from new
            "avg_gift": (total_raised * 0.35) / new_donors if new_donors > 0 else 0
        },
        "Repeat Donors": {
            "count": repeat_donors,
            "total_raised": total_raised * 0.50,  # Mock: 50% from repeat
            "avg_gift": (total_raised * 0.50) / repeat_donors if repeat_donors > 0 else 0
        },
        "Reactivated": {
            "count": lapsed_reactivated,
            "total_raised": total_raised * 0.15,  # Mock: 15% from reactivated
            "avg_gift": (total_raised * 0.15) / lapsed_reactivated if lapsed_reactivated > 0 else 0
        }
    }

    # Timeline milestones
    timeline_milestones = [
        {"date": start_date, "event": "Campaign Launch", "amount": 0},
        {"date": start_date + timedelta(days=duration//4), "event": "25% of Goal", "amount": goal * 0.25},
        {"date": start_date + timedelta(days=duration//2), "event": "50% of Goal", "amount": goal * 0.50},
        {"date": start_date + timedelta(days=3*duration//4), "event": "75% of Goal", "amount": goal * 0.75},
        {"date": end_date, "event": "Campaign Complete", "amount": total_raised}
    ]

    return CampaignPerformanceResponse(
        campaign=campaign_detail,
        daily_progress=daily_progress,
        gift_distribution=gift_ranges,
        donor_segments=donor_segments,
        timeline_milestones=timeline_milestones,
        organization_id=organization_id,
        generated_at=datetime.now()
    )


@router.get("/roi-analysis/{organization_id}", response_model=ROIAnalysisResponse)
async def get_roi_analysis(
        organization_id: str,
        years_back: int = 2,
        min_raised: float = 1000,
        db: Session = Depends(get_db)
):
    """
    Analyze ROI across all campaigns

    Args:
        organization_id: Organization UUID
        years_back: Years of historical data to analyze
        min_raised: Minimum amount raised to include campaign

    Returns:
        Comprehensive ROI analysis with trends and benchmarks
    """

    start_date = datetime.now() - timedelta(days=365 * years_back)

    # Query campaigns
    campaign_data = db.query(
        Donation.campaign.label('campaign_name'),
        func.min(Donation.donation_date).label('start_date'),
        func.sum(Donation.amount).label('raised'),
        func.count(func.distinct(Donation.donor_id)).label('donor_count'),
        func.count(Donation.id).label('gift_count')
    ).filter(
        Donation.organization_id == organization_id,
        Donation.campaign.isnot(None),
        Donation.donation_date >= start_date
    ).group_by(
        Donation.campaign
    ).having(
        func.sum(Donation.amount) >= min_raised
    ).all()

    campaigns_roi = []

    for idx, camp in enumerate(campaign_data):
        raised = float(camp.raised)

        # Mock expenses (should come from campaign budget table)
        # Typical fundraising expense ratios: 5-15%
        expense_ratio = 0.08  # 8% average
        expenses = raised * expense_ratio

        net_revenue = raised - expenses
        roi = ((net_revenue - expenses) / expenses * 100) if expenses > 0 else 0
        cost_per_dollar = expenses / raised if raised > 0 else 0

        # Calculate break-even
        # Assuming linear fundraising curve
        break_even_days = int((expenses / raised) * 90) if raised > 0 else 90  # Mock 90-day campaign

        # Mock donor acquisition cost
        # Assume 30% of donors are new
        new_donor_count = int(camp.donor_count * 0.30)
        donor_acq_cost = expenses / new_donor_count if new_donor_count > 0 else 0

        # Mock donor LTV (should calculate from actual retention data)
        donor_ltv = 5000  # Average $5K lifetime value

        ltv_to_cac = donor_ltv / donor_acq_cost if donor_acq_cost > 0 else 0

        # Efficiency score (0-100)
        # Based on ROI, cost per dollar, and LTV ratio
        roi_score = min(100, roi / 5)  # 500% ROI = 100 score
        cost_score = max(0, 100 - (cost_per_dollar * 1000))  # $0.10 per dollar = 90 score
        ltv_score = min(100, ltv_to_cac * 10)  # 10:1 ratio = 100 score

        efficiency = (roi_score * 0.5 + cost_score * 0.3 + ltv_score * 0.2)

        # Determine campaign type
        campaign_types = ["annual", "major_gifts", "monthly_giving", "event", "capital"]
        campaign_type = campaign_types[idx % len(campaign_types)]

        campaign_roi = CampaignROI(
            campaign_id=f"CAMP-{idx+1:04d}",
            campaign_name=camp.campaign_name,
            campaign_type=campaign_type,
            total_raised=raised,
            total_expenses=expenses,
            net_revenue=net_revenue,
            roi_percentage=round(roi, 1),
            cost_per_dollar=round(cost_per_dollar, 3),
            break_even_point=expenses,
            payback_period_days=break_even_days,
            donor_acquisition_cost=round(donor_acq_cost, 2),
            donor_lifetime_value=donor_ltv,
            ltv_to_cac_ratio=round(ltv_to_cac, 2),
            efficiency_score=round(efficiency, 1)
        )

        campaigns_roi.append(campaign_roi)

    # Calculate summary
    total_raised = sum(c.total_raised for c in campaigns_roi)
    total_expenses = sum(c.total_expenses for c in campaigns_roi)
    total_net = sum(c.net_revenue for c in campaigns_roi)

    avg_roi = sum(c.roi_percentage for c in campaigns_roi) / len(campaigns_roi) if campaigns_roi else 0
    avg_efficiency = sum(c.efficiency_score for c in campaigns_roi) / len(campaigns_roi) if campaigns_roi else 0

    summary = {
        "total_campaigns_analyzed": len(campaigns_roi),
        "total_raised": total_raised,
        "total_expenses": total_expenses,
        "total_net_revenue": total_net,
        "overall_roi": round((total_net / total_expenses * 100) if total_expenses > 0 else 0, 1),
        "avg_campaign_roi": round(avg_roi, 1),
        "avg_efficiency_score": round(avg_efficiency, 1),
        "best_roi_campaign": max(campaigns_roi, key=lambda x: x.roi_percentage).campaign_name if campaigns_roi else None,
        "most_efficient_campaign": max(campaigns_roi, key=lambda x: x.efficiency_score).campaign_name if campaigns_roi else None
    }

    # ROI trends (by quarter)
    roi_trends = []
    for i in range(8):  # Last 8 quarters
        quarter_date = datetime.now() - timedelta(days=90 * i)
        quarter_campaigns = [c for c in campaigns_roi if abs((camp.start_date - quarter_date).days) <= 45]

        if quarter_campaigns:
            avg_quarterly_roi = sum(c.roi_percentage for c in quarter_campaigns) / len(quarter_campaigns)
        else:
            avg_quarterly_roi = 0

        roi_trends.append({
            "quarter": quarter_date.strftime('Q%q %Y'),
            "avg_roi": round(avg_quarterly_roi, 1),
            "campaign_count": len(quarter_campaigns)
        })

    # Efficiency benchmarks
    efficiency_benchmarks = {
        "excellent_roi": 400.0,  # 4:1 return
        "good_roi": 300.0,  # 3:1 return
        "acceptable_roi": 200.0,  # 2:1 return
        "target_cost_per_dollar": 0.10,  # $0.10 to raise $1
        "target_ltv_to_cac": 5.0,  # 5:1 ratio
        "industry_avg_roi": 320.0
    }

    # Generate recommendations
    recommendations = []

    if avg_roi < 250:
        recommendations.append("Overall ROI below target. Review campaign expenses and donor acquisition strategies.")

    if total_expenses / total_raised > 0.12:
        recommendations.append("Expense ratio above 12%. Optimize campaign costs and administrative overhead.")

    low_efficiency = [c for c in campaigns_roi if c.efficiency_score < 60]
    if low_efficiency:
        recommendations.append(f"{len(low_efficiency)} campaigns have low efficiency scores. Analyze and replicate high-performing campaign strategies.")

    best_performers = sorted(campaigns_roi, key=lambda x: x.roi_percentage, reverse=True)[:3]
    if best_performers:
        recommendations.append(f"Top performing campaign types: {', '.join(set(c.campaign_type for c in best_performers))}. Focus resources on these campaign models.")

    if not recommendations:
        recommendations.append("Campaign ROI performance is strong. Continue current strategies while testing incremental improvements.")

    return ROIAnalysisResponse(
        summary=summary,
        campaigns=sorted(campaigns_roi, key=lambda x: x.roi_percentage, reverse=True),
        roi_trends=list(reversed(roi_trends)),
        efficiency_benchmarks=efficiency_benchmarks,
        recommendations=recommendations,
        organization_id=organization_id,
        generated_at=datetime.now()
    )