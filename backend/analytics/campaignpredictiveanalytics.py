"""
Campaign Performance Analytics APIs
Comprehensive campaign tracking, ROI analysis, and performance metrics

Features:
- Campaign performance dashboards
- Multi-channel campaign tracking
- ROI and cost analysis
- Goal tracking and achievement
- A/B test results
- Time-series performance trends
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case, extract
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal

# Assuming imports
from database import get_db
from models import (
    Organizations, Campaigns, Donations, Donors, Appeals,
    DonationCampaigns, EmailCampaigns, ABTest, MatchingGift, RecurringGifts
)

router = APIRouter(prefix="/api/v1/campaign-analytics", tags=["campaign-analytics"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CampaignPerformance(BaseModel):
    """Individual campaign performance metrics"""
    campaign_id: str
    campaign_name: str
    campaign_type: str
    status: str
    start_date: datetime
    end_date: Optional[datetime]

    # Financial metrics
    goal_amount: float
    raised_amount: float
    goal_progress_percentage: float
    average_donation: float
    largest_donation: float

    # Donor metrics
    total_donors: int
    new_donors: int
    returning_donors: int
    lapsed_reactivated: int

    # Engagement metrics
    total_donations: int
    donation_frequency: float
    conversion_rate: Optional[float]

    # Cost metrics
    campaign_cost: float
    cost_per_donor_acquired: float
    cost_to_raise_dollar: float
    roi_percentage: float

    # Channel breakdown
    online_donations: int
    offline_donations: int
    online_percentage: float

    # Time metrics
    days_active: int
    days_remaining: Optional[int]

    class Config:
        from_attributes = True


class CampaignSummary(BaseModel):
    """Organization-wide campaign summary"""
    total_campaigns: int
    active_campaigns: int
    completed_campaigns: int
    total_raised: float
    total_goal: float
    overall_progress: float
    total_donors: int
    average_campaign_roi: float
    top_performing_campaign: Optional[Dict[str, Any]]


class CampaignTrend(BaseModel):
    """Campaign performance trends over time"""
    period: str
    total_raised: float
    donor_count: int
    donation_count: int
    average_donation: float
    new_donors: int
    campaign_count: int


class CampaignComparison(BaseModel):
    """Compare multiple campaigns"""
    campaign_id: str
    campaign_name: str
    raised_amount: float
    donor_count: int
    roi_percentage: float
    cost_per_donor: float
    average_donation: float
    goal_achievement: float


class ChannelPerformance(BaseModel):
    """Performance by campaign channel/type"""
    channel: str
    campaign_count: int
    total_raised: float
    total_donors: int
    average_donation: float
    conversion_rate: float
    roi_percentage: float


class DonorAcquisition(BaseModel):
    """Donor acquisition metrics"""
    campaign_id: str
    campaign_name: str
    new_donors_acquired: int
    acquisition_cost: float
    cost_per_donor: float
    first_donation_average: float
    conversion_to_recurring: int
    ltv_projection: float


class CampaignGoalTracking(BaseModel):
    """Detailed goal tracking"""
    campaign_id: str
    campaign_name: str
    goal_amount: float
    raised_amount: float
    remaining_amount: float
    progress_percentage: float
    pace_status: str  # "on_track", "behind", "ahead"
    projected_final_amount: float
    days_remaining: Optional[int]
    required_daily_average: Optional[float]


class ABTestResults(BaseModel):
    """A/B test campaign results"""
    test_id: str
    test_name: str
    campaign_id: str
    campaign_name: str
    variant_a_name: str
    variant_b_name: str

    # Variant A metrics
    variant_a_views: int
    variant_a_donations: int
    variant_a_revenue: float
    variant_a_conversion_rate: float
    variant_a_avg_donation: float

    # Variant B metrics
    variant_b_views: int
    variant_b_donations: int
    variant_b_revenue: float
    variant_b_conversion_rate: float
    variant_b_avg_donation: float

    # Statistical analysis
    is_significant: bool
    confidence_level: Optional[float]
    winning_variant: Optional[str]
    improvement_percentage: Optional[float]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_campaign_roi(raised: float, cost: float) -> float:
    """Calculate ROI percentage"""
    if cost == 0:
        return 0.0 if raised == 0 else float('inf')
    return ((raised - cost) / cost) * 100


def calculate_conversion_rate(donations: int, views: int) -> float:
    """Calculate conversion rate"""
    if views == 0:
        return 0.0
    return (donations / views) * 100


def determine_pace_status(
        progress: float,
        days_elapsed: int,
        total_days: int
) -> str:
    """Determine if campaign is on track"""
    if total_days == 0:
        return "completed"

    expected_progress = (days_elapsed / total_days) * 100

    if progress >= expected_progress + 10:
        return "ahead"
    elif progress <= expected_progress - 10:
        return "behind"
    else:
        return "on_track"


def project_final_amount(
        current_amount: float,
        days_elapsed: int,
        total_days: int
) -> float:
    """Project final campaign amount based on current pace"""
    if days_elapsed == 0:
        return current_amount

    daily_rate = current_amount / days_elapsed
    projected = daily_rate * total_days
    return round(projected, 2)


# ============================================================================
# API ENDPOINTS - CAMPAIGN PERFORMANCE
# ============================================================================

@router.get("/performance/{campaign_id}", response_model=CampaignPerformance)
async def get_campaign_performance(
        organization_id: str,
        campaign_id: str,
        db: Session = Depends(get_db)
):
    """
    Get comprehensive performance metrics for a single campaign

    **Metrics Include:**
    - Financial performance (raised, goal, ROI)
    - Donor metrics (new, returning, total)
    - Engagement metrics (conversion, frequency)
    - Cost analysis (CAC, cost per dollar raised)
    - Channel breakdown (online vs offline)
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get all donations for this campaign
    donations = db.query(Donations).filter(
        Donations.campaign_id == campaign_id,
        Donations.organization_id == organization_id
    ).all()

    # Calculate financial metrics
    raised_amount = sum(float(d.amount) for d in donations)
    goal_amount = float(campaign.goal_amount) if campaign.goal_amount else 0
    goal_progress = (raised_amount / goal_amount * 100) if goal_amount > 0 else 0

    # Donor metrics
    donor_ids = set(d.donor_id for d in donations)
    total_donors = len(donor_ids)

    # Get donor history to determine new vs returning
    new_donors = 0
    returning_donors = 0
    lapsed_reactivated = 0

    for donor_id in donor_ids:
        # Check if this donor has donations before this campaign
        previous_donations = db.query(Donations).filter(
            Donations.donor_id == donor_id,
            Donations.organization_id == organization_id,
            Donations.donation_date < campaign.start_date
        ).count()

        if previous_donations == 0:
            new_donors += 1
        else:
            returning_donors += 1

            # Check if lapsed (no donations in last 18 months before campaign)
            recent_donations = db.query(Donations).filter(
                Donations.donor_id == donor_id,
                Donations.organization_id == organization_id,
                Donations.donation_date < campaign.start_date,
                Donations.donation_date >= campaign.start_date - timedelta(days=545)
            ).count()

            if recent_donations == 0:
                lapsed_reactivated += 1

    # Engagement metrics
    total_donations = len(donations)
    average_donation = raised_amount / total_donations if total_donations > 0 else 0
    largest_donation = max([float(d.amount) for d in donations], default=0)
    donation_frequency = total_donations / total_donors if total_donors > 0 else 0

    # Get conversion rate if available (from email campaigns or landing page views)
    conversion_rate = None
    email_campaign = db.query(EmailCampaigns).filter(
        EmailCampaigns.campaign_id == campaign_id
    ).first()

    if email_campaign and email_campaign.total_sent > 0:
        conversion_rate = (total_donations / email_campaign.total_sent) * 100

    # Cost metrics
    campaign_cost = float(campaign.marketing_cost) if campaign.marketing_cost else 0
    cost_per_donor = campaign_cost / new_donors if new_donors > 0 else 0
    cost_to_raise = campaign_cost / raised_amount if raised_amount > 0 else 0
    roi_percentage = calculate_campaign_roi(raised_amount, campaign_cost)

    # Channel breakdown
    online_donations = sum(1 for d in donations if d.payment_method in ['credit_card', 'paypal', 'online'])
    offline_donations = total_donations - online_donations
    online_percentage = (online_donations / total_donations * 100) if total_donations > 0 else 0

    # Time metrics
    days_active = (datetime.utcnow() - campaign.start_date).days
    days_remaining = None
    if campaign.end_date:
        days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

    return CampaignPerformance(
        campaign_id=str(campaign.id),
        campaign_name=campaign.name,
        campaign_type=campaign.campaign_type or "general",
        status=campaign.status,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        goal_amount=goal_amount,
        raised_amount=raised_amount,
        goal_progress_percentage=goal_progress,
        average_donation=average_donation,
        largest_donation=largest_donation,
        total_donors=total_donors,
        new_donors=new_donors,
        returning_donors=returning_donors,
        lapsed_reactivated=lapsed_reactivated,
        total_donations=total_donations,
        donation_frequency=donation_frequency,
        conversion_rate=conversion_rate,
        campaign_cost=campaign_cost,
        cost_per_donor_acquired=cost_per_donor,
        cost_to_raise_dollar=cost_to_raise,
        roi_percentage=roi_percentage,
        online_donations=online_donations,
        offline_donations=offline_donations,
        online_percentage=online_percentage,
        days_active=days_active,
        days_remaining=days_remaining
    )


@router.get("/summary/{organization_id}", response_model=CampaignSummary)
async def get_campaign_summary(
        organization_id: str,
        db: Session = Depends(get_db)
):
    """
    Get organization-wide campaign summary

    **High-Level Metrics:**
    - Campaign counts by status
    - Total raised vs goal
    - Average ROI
    - Top performing campaign
    """
    campaigns = db.query(Campaigns).filter(
        Campaigns.organization_id == organization_id
    ).all()

    total_campaigns = len(campaigns)
    active_campaigns = sum(1 for c in campaigns if c.status == 'active')
    completed_campaigns = sum(1 for c in campaigns if c.status == 'completed')

    # Get all donations
    donations = db.query(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.campaign_id.isnot(None)
    ).all()

    total_raised = sum(float(d.amount) for d in donations)
    total_goal = sum(float(c.goal_amount) for c in campaigns if c.goal_amount)
    overall_progress = (total_raised / total_goal * 100) if total_goal > 0 else 0

    # Total unique donors
    total_donors = len(set(d.donor_id for d in donations))

    # Calculate average ROI
    roi_values = []
    top_campaign = None
    top_raised = 0

    for campaign in campaigns:
        campaign_donations = [d for d in donations if d.campaign_id == campaign.id]
        raised = sum(float(d.amount) for d in campaign_donations)
        cost = float(campaign.marketing_cost) if campaign.marketing_cost else 0

        if cost > 0:
            roi = calculate_campaign_roi(raised, cost)
            roi_values.append(roi)

        if raised > top_raised:
            top_raised = raised
            top_campaign = {
                "id": str(campaign.id),
                "name": campaign.name,
                "raised": raised
            }

    avg_roi = sum(roi_values) / len(roi_values) if roi_values else 0

    return CampaignSummary(
        total_campaigns=total_campaigns,
        active_campaigns=active_campaigns,
        completed_campaigns=completed_campaigns,
        total_raised=total_raised,
        total_goal=total_goal,
        overall_progress=overall_progress,
        total_donors=total_donors,
        average_campaign_roi=avg_roi,
        top_performing_campaign=top_campaign
    )


@router.get("/trends/{organization_id}", response_model=List[CampaignTrend])
async def get_campaign_trends(
        organization_id: str,
        period: str = "monthly",  # daily, weekly, monthly, quarterly
        months_back: int = 12,
        db: Session = Depends(get_db)
):
    """
    Get campaign performance trends over time

    **Periods:** daily, weekly, monthly, quarterly
    **Use Case:** Dashboard trend charts
    """
    trends = []
    now = datetime.utcnow()

    # Define period grouping
    if period == "monthly":
        periods = [(now - timedelta(days=30 * i), now - timedelta(days=30 * (i-1)))
                   for i in range(months_back, 0, -1)]
        period_format = "%b %Y"
    elif period == "quarterly":
        periods = [(now - timedelta(days=90 * i), now - timedelta(days=90 * (i-1)))
                   for i in range(months_back // 3, 0, -1)]
        period_format = "Q%q %Y"
    else:
        periods = [(now - timedelta(days=7 * i), now - timedelta(days=7 * (i-1)))
                   for i in range(months_back * 4, 0, -1)]
        period_format = "%d %b"

    for start_date, end_date in periods:
        # Get donations in this period
        donations = db.query(Donations).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date >= start_date,
            Donations.donation_date < end_date,
            Donations.campaign_id.isnot(None)
        ).all()

        if not donations:
            continue

        total_raised = sum(float(d.amount) for d in donations)
        donor_ids = set(d.donor_id for d in donations)
        donor_count = len(donor_ids)
        donation_count = len(donations)
        average_donation = total_raised / donation_count if donation_count > 0 else 0

        # Count new donors
        new_donors = 0
        for donor_id in donor_ids:
            previous = db.query(Donations).filter(
                Donations.donor_id == donor_id,
                Donations.organization_id == organization_id,
                Donations.donation_date < start_date
            ).count()
            if previous == 0:
                new_donors += 1

        # Count campaigns in this period
        campaign_count = db.query(Campaigns).filter(
            Campaigns.organization_id == organization_id,
            Campaigns.start_date >= start_date,
            Campaigns.start_date < end_date
        ).count()

        trends.append(CampaignTrend(
            period=start_date.strftime(period_format),
            total_raised=total_raised,
            donor_count=donor_count,
            donation_count=donation_count,
            average_donation=average_donation,
            new_donors=new_donors,
            campaign_count=campaign_count
        ))

    return trends


@router.get("/compare", response_model=List[CampaignComparison])
async def compare_campaigns(
        organization_id: str,
        campaign_ids: List[str] = Query(...),
        db: Session = Depends(get_db)
):
    """
    Compare performance of multiple campaigns side-by-side

    **Use Case:**
    - Compare similar campaigns
    - Year-over-year comparison
    - Channel effectiveness
    """
    comparisons = []

    for campaign_id in campaign_ids:
        campaign = db.query(Campaigns).filter(
            Campaigns.id == campaign_id,
            Campaigns.organization_id == organization_id
        ).first()

        if not campaign:
            continue

        # Get donations
        donations = db.query(Donations).filter(
            Donations.campaign_id == campaign_id
        ).all()

        raised_amount = sum(float(d.amount) for d in donations)
        donor_count = len(set(d.donor_id for d in donations))
        donation_count = len(donations)
        avg_donation = raised_amount / donation_count if donation_count > 0 else 0

        # Calculate metrics
        cost = float(campaign.marketing_cost) if campaign.marketing_cost else 0
        roi = calculate_campaign_roi(raised_amount, cost)

        # New donors for CAC
        new_donors = 0
        for donation in donations:
            previous = db.query(Donations).filter(
                Donations.donor_id == donation.donor_id,
                Donations.organization_id == organization_id,
                Donations.donation_date < campaign.start_date
            ).count()
            if previous == 0:
                new_donors += 1

        cost_per_donor = cost / new_donors if new_donors > 0 else 0
        goal = float(campaign.goal_amount) if campaign.goal_amount else 0
        goal_achievement = (raised_amount / goal * 100) if goal > 0 else 0

        comparisons.append(CampaignComparison(
            campaign_id=str(campaign.id),
            campaign_name=campaign.name,
            raised_amount=raised_amount,
            donor_count=donor_count,
            roi_percentage=roi,
            cost_per_donor=cost_per_donor,
            average_donation=avg_donation,
            goal_achievement=goal_achievement
        ))

    return comparisons


@router.get("/channel-performance/{organization_id}", response_model=List[ChannelPerformance])
async def get_channel_performance(
        organization_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        db: Session = Depends(get_db)
):
    """
    Analyze performance by campaign channel/type

    **Channels:**
    - Email campaigns
    - Direct mail
    - Social media
    - Events
    - Peer-to-peer
    - Major gifts
    """
    # Get campaigns grouped by type
    query = db.query(Campaigns).filter(
        Campaigns.organization_id == organization_id
    )

    if start_date:
        query = query.filter(Campaigns.start_date >= start_date)
    if end_date:
        query = query.filter(Campaigns.start_date <= end_date)

    campaigns = query.all()

    # Group by campaign type
    channel_data = {}

    for campaign in campaigns:
        channel = campaign.campaign_type or "general"

        if channel not in channel_data:
            channel_data[channel] = {
                "campaigns": [],
                "donations": [],
                "views": 0
            }

        channel_data[channel]["campaigns"].append(campaign)

        # Get donations for this campaign
        donations = db.query(Donations).filter(
            Donations.campaign_id == campaign.id
        ).all()
        channel_data[channel]["donations"].extend(donations)

        # Get views if available
        email_campaign = db.query(EmailCampaigns).filter(
            EmailCampaigns.campaign_id == campaign.id
        ).first()
        if email_campaign:
            channel_data[channel]["views"] += email_campaign.total_sent or 0

    # Calculate metrics for each channel
    results = []
    for channel, data in channel_data.items():
        campaign_count = len(data["campaigns"])
        donations = data["donations"]

        total_raised = sum(float(d.amount) for d in donations)
        total_donors = len(set(d.donor_id for d in donations))
        donation_count = len(donations)
        avg_donation = total_raised / donation_count if donation_count > 0 else 0

        # Conversion rate
        conversion = 0
        if data["views"] > 0:
            conversion = (donation_count / data["views"]) * 100

        # Calculate ROI
        total_cost = sum(
            float(c.budget_amount) for c in data["campaigns"]
            if c.budget_amount
        )
        roi = calculate_campaign_roi(total_raised, total_cost)

        results.append(ChannelPerformance(
            channel=channel,
            campaign_count=campaign_count,
            total_raised=total_raised,
            total_donors=total_donors,
            average_donation=avg_donation,
            conversion_rate=conversion,
            roi_percentage=roi
        ))

    return sorted(results, key=lambda x: x.total_raised, reverse=True)


@router.get("/donor-acquisition/{campaign_id}", response_model=DonorAcquisition)
async def get_donor_acquisition_metrics(
        organization_id: str,
        campaign_id: str,
        db: Session = Depends(get_db)
):
    """
    Detailed donor acquisition metrics for a campaign

    **Metrics:**
    - New donors acquired
    - Cost per acquisition
    - First donation average
    - Conversion to recurring
    - Projected lifetime value
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    donations = db.query(Donations).filter(
        Donations.campaign_id == campaign_id
    ).all()

    # Identify new donors
    new_donors = []
    first_donations = []

    for donation in donations:
        previous = db.query(Donations).filter(
            Donations.donor_id == donation.donor_id,
            Donations.organization_id == organization_id,
            Donations.donation_date < campaign.start_date
        ).count()

        if previous == 0:
            new_donors.append(donation.donor_id)
            first_donations.append(float(donation.amount))

    new_donor_count = len(new_donors)

    # Calculate cost metrics
    campaign_cost = float(campaign.marketing_cost) if campaign.marketing_cost else 0
    acquisition_cost = campaign_cost  # Full cost attributed to acquisition
    cost_per_donor = acquisition_cost / new_donor_count if new_donor_count > 0 else 0
    first_donation_avg = sum(first_donations) / len(first_donations) if first_donations else 0

    # Check conversion to recurring
    recurring_count = 0
    for donor_id in new_donors:
        recurring = db.query(RecurringGifts).filter(
            RecurringGifts.donor_id == donor_id,
            RecurringGifts.status == 'active'
        ).first()
        if recurring:
            recurring_count += 1

    # Project LTV (simple: 3-year projection based on first gift)
    ltv_projection = first_donation_avg * 3 * 1.2  # Assumes 20% growth

    return DonorAcquisition(
        campaign_id=str(campaign_id),
        campaign_name=campaign.name,
        new_donors_acquired=new_donor_count,
        acquisition_cost=acquisition_cost,
        cost_per_donor=cost_per_donor,
        first_donation_average=first_donation_avg,
        conversion_to_recurring=recurring_count,
        ltv_projection=ltv_projection
    )


@router.get("/goal-tracking/{campaign_id}", response_model=CampaignGoalTracking)
async def track_campaign_goal(
        organization_id: str,
        campaign_id: str,
        db: Session = Depends(get_db)
):
    """
    Detailed goal tracking with projections

    **Tracking:**
    - Current progress
    - Pace analysis (ahead/on track/behind)
    - Projected final amount
    - Required daily average to meet goal
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get donations
    donations = db.query(Donations).filter(
        Donations.campaign_id == campaign_id
    ).all()

    raised_amount = sum(float(d.amount) for d in donations)
    goal_amount = float(campaign.goal_amount) if campaign.goal_amount else 0
    remaining_amount = max(0, goal_amount - raised_amount)
    progress_percentage = (raised_amount / goal_amount * 100) if goal_amount > 0 else 0

    # Time calculations
    days_elapsed = (datetime.utcnow() - campaign.start_date).days
    days_remaining = None
    total_days = None

    if campaign.end_date:
        days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)
        total_days = (campaign.end_date - campaign.start_date).days

    # Pace analysis
    pace_status = "on_track"
    if total_days and total_days > 0:
        pace_status = determine_pace_status(progress_percentage, days_elapsed, total_days)

    # Projection
    projected_final = project_final_amount(raised_amount, days_elapsed, total_days or days_elapsed)

    # Required daily average
    required_daily = None
    if days_remaining and days_remaining > 0:
        required_daily = remaining_amount / days_remaining

    return CampaignGoalTracking(
        campaign_id=str(campaign_id),
        campaign_name=campaign.name,
        goal_amount=goal_amount,
        raised_amount=raised_amount,
        remaining_amount=remaining_amount,
        progress_percentage=progress_percentage,
        pace_status=pace_status,
        projected_final_amount=projected_final,
        days_remaining=days_remaining,
        required_daily_average=required_daily
    )


@router.get("/ab-test-results/{test_id}", response_model=ABTestResults)
async def get_ab_test_results(
        organization_id: str,
        test_id: str,
        db: Session = Depends(get_db)
):
    """
    Get A/B test campaign results with statistical analysis

    **Analysis:**
    - Conversion rates by variant
    - Revenue comparison
    - Statistical significance
    - Winner determination
    """
    test = db.query(ABTest).filter(
        ABTest.id == test_id,
        ABTest.organization_id == organization_id
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")

    campaign = db.query(Campaigns).filter(
        Campaigns.id == test.campaign_id
    ).first()

    return ABTestResults(
        test_id=str(test.id),
        test_name=test.test_name,
        campaign_id=str(test.campaign_id),
        campaign_name=campaign.name if campaign else "Unknown",
        variant_a_name=test.variant_a_name,
        variant_b_name=test.variant_b_name,
        variant_a_views=test.variant_a_views,
        variant_a_donations=test.variant_a_donations,
        variant_a_revenue=float(test.variant_a_revenue),
        variant_a_conversion_rate=float(test.variant_a_conversion_rate) if test.variant_a_conversion_rate else 0,
        variant_a_avg_donation=float(test.variant_a_avg_donation) if test.variant_a_avg_donation else 0,
        variant_b_views=test.variant_b_views,
        variant_b_donations=test.variant_b_donations,
        variant_b_revenue=float(test.variant_b_revenue),
        variant_b_conversion_rate=float(test.variant_b_conversion_rate) if test.variant_b_conversion_rate else 0,
        variant_b_avg_donation=float(test.variant_b_avg_donation) if test.variant_b_avg_donation else 0,
        is_significant=test.is_significant,
        confidence_level=float(test.confidence_level) if test.confidence_level else None,
        winning_variant=test.winning_variant,
        improvement_percentage=float(test.improvement_percentage) if test.improvement_percentage else None
    )


@router.get("/matching-gifts-performance/{campaign_id}")
async def get_matching_gifts_performance(
        organization_id: str,
        campaign_id: str,
        db: Session = Depends(get_db)
):
    """
    Analyze matching gift performance for a campaign

    **Metrics:**
    - Total matches submitted
    - Matched amount vs eligible
    - Average match ratio
    - Top matching companies
    """
    # Get matching gifts for campaign donations
    matching_gifts = db.query(MatchingGift).join(
        Donations, MatchingGift.donation_id == Donations.id
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.organization_id == organization_id
    ).all()

    if not matching_gifts:
        return {
            "campaign_id": campaign_id,
            "total_matches": 0,
            "eligible_amount": 0,
            "matched_amount": 0,
            "pending_amount": 0,
            "match_rate": 0,
            "top_companies": []
        }

    total_matches = len(matching_gifts)
    eligible_amount = sum(float(mg.eligible_match_amount) for mg in matching_gifts)
    matched_amount = sum(float(mg.matched_amount) for mg in matching_gifts)
    pending_amount = sum(float(mg.pending_match_amount) for mg in matching_gifts)
    match_rate = (matched_amount / eligible_amount * 100) if eligible_amount > 0 else 0

    # Top companies
    company_totals = {}
    for mg in matching_gifts:
        company = mg.company_name
        if company not in company_totals:
            company_totals[company] = 0
        company_totals[company] += float(mg.matched_amount)

    top_companies = [
        {"company": k, "amount": v}
        for k, v in sorted(company_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return {
        "campaign_id": campaign_id,
        "total_matches": total_matches,
        "eligible_amount": eligible_amount,
        "matched_amount": matched_amount,
        "pending_amount": pending_amount,
        "match_rate": match_rate,
        "average_match_ratio": sum(float(mg.match_ratio) for mg in matching_gifts) / total_matches,
        "top_companies": top_companies
    }