# campaign_stats_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from models import Campaigns as Campaign  # Your SQLAlchemy models
from campaign.campaign_stats_schema import (
    CampaignOrganizationStats,
    CampaignStatusStats,
    CampaignTypeStats
)


def calculate_organization_campaign_stats(
        db: Session,
        organization_id: UUID
) -> CampaignOrganizationStats:
    """
    Calculate comprehensive campaign statistics for an organization.

    Args:
        db: Database session
        organization_id: UUID of the organization

    Returns:
        CampaignOrganizationStats object with all calculated metrics
    """

    # Base query for the organization's campaigns
    base_query = db.query(Campaign).filter(
        Campaign.organization_id == organization_id
    )

    # Get all campaigns for detailed calculations
    campaigns = base_query.all()

    if not campaigns:
        return CampaignOrganizationStats()

    # Calculate date thresholds
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    thirty_days_from_now = now + timedelta(days=30)

    # Initialize stats object
    stats = CampaignOrganizationStats()

    # ============================================================
    # OVERALL COUNTS
    # ============================================================
    stats.total_campaigns = len(campaigns)
    stats.active_campaigns = sum(1 for c in campaigns if c.status == 'active')
    stats.featured_campaigns = sum(1 for c in campaigns if c.is_featured)

    # ============================================================
    # FINANCIAL METRICS
    # ============================================================
    stats.total_goal_amount = sum(
        Decimal(str(c.goal_amount or 0)) for c in campaigns
    )
    stats.total_raised_amount = sum(
        Decimal(str(c.raised_amount or 0)) for c in campaigns
    )
    stats.total_remaining_amount = stats.total_goal_amount - stats.total_raised_amount

    # Overall completion rate
    if stats.total_goal_amount > 0:
        stats.overall_completion_rate = float(
            (stats.total_raised_amount / stats.total_goal_amount) * 100
        )

    # Average completion rate per campaign
    completion_rates = []
    for c in campaigns:
        if c.goal_amount and c.goal_amount > 0:
            rate = (float(c.raised_amount or 0) / float(c.goal_amount)) * 100
            completion_rates.append(rate)

    if completion_rates:
        stats.average_completion_rate = sum(completion_rates) / len(completion_rates)

    # ============================================================
    # DONOR METRICS
    # ============================================================
    stats.total_donors = sum(c.donor_count or 0 for c in campaigns)
    stats.total_donations = sum(c.donation_count or 0 for c in campaigns)

    if stats.total_donations > 0:
        stats.average_donation = stats.total_raised_amount / Decimal(str(stats.total_donations))

    # ============================================================
    # CAMPAIGN PERFORMANCE
    # ============================================================
    for c in campaigns:
        if c.goal_amount and c.goal_amount > 0:
            raised = float(c.raised_amount or 0)
            goal = float(c.goal_amount)
            percentage = (raised / goal) * 100

            if percentage >= 100:
                stats.campaigns_at_goal += 1
                if percentage > 100:
                    stats.campaigns_above_goal += 1
            elif percentage < 50:
                stats.campaigns_below_50_percent += 1

    # ============================================================
    # ENGAGEMENT METRICS
    # ============================================================
    stats.total_views = sum(c.view_count or 0 for c in campaigns)
    stats.total_shares = sum(c.share_count or 0 for c in campaigns)

    if stats.total_campaigns > 0:
        stats.average_views_per_campaign = stats.total_views / stats.total_campaigns

    # ============================================================
    # BREAKDOWN BY STATUS
    # ============================================================
    status_counts = {
        'active': 0,
        'draft': 0,
        'completed': 0,
        'paused': 0,
        'archived': 0
    }

    for c in campaigns:
        status = c.status.upper() if c.status else 'DRAFT'
        if status in status_counts:
            status_counts[status] += 1

    stats.by_status = CampaignStatusStats(
        active=status_counts['active'],
        draft=status_counts['draft'],
        completed=status_counts['completed'],
        paused=status_counts['paused'],
        archived=status_counts['archived']
    )

    # ============================================================
    # BREAKDOWN BY TYPE
    # ============================================================
    type_counts = {
        'general': 0,
        'project': 0,
        'emergency': 0,
        'capital': 0,
        'endowment': 0,
        'annual': 0
    }

    for c in campaigns:
        ctype = c.campaign_type.upper() if c.campaign_type else 'GENERAL'
        if ctype in type_counts:
            type_counts[ctype] += 1

    stats.by_type = CampaignTypeStats(
        general=type_counts['general'],
        project=type_counts['project'],
        emergency=type_counts['emergency'],
        capital=type_counts['capital'],
        endowment=type_counts['endowment'],
        annual=type_counts['annual']
    )

    # ============================================================
    # TOP PERFORMERS
    # ============================================================
    # Highest raised campaign
    highest_raised = max(
        campaigns,
        key=lambda c: float(c.raised_amount or 0)
    )
    if highest_raised.raised_amount and highest_raised.raised_amount > 0:
        stats.highest_raised_campaign_id = str(highest_raised.id)
        stats.highest_raised_amount = Decimal(str(highest_raised.raised_amount))

    # Most donors campaign
    most_donors = max(
        campaigns,
        key=lambda c: c.donor_count or 0
    )
    if most_donors.donor_count and most_donors.donor_count > 0:
        stats.most_donors_campaign_id = str(most_donors.id)
        stats.most_donors_count = most_donors.donor_count

    # ============================================================
    # TIME-BASED METRICS
    # ============================================================
    for c in campaigns:
        # Ending soon
        if c.end_date:
            end_datetime = datetime.combine(c.end_date, datetime.min.time())
            if now < end_datetime <= thirty_days_from_now:
                stats.campaigns_ending_soon += 1

        # Recently created
        if c.created_at and c.created_at >= thirty_days_ago:
            stats.campaigns_recently_created += 1

    return stats


def calculate_organization_campaign_stats_optimized(
        db: Session,
        organization_id: UUID
) -> CampaignOrganizationStats:
    """
    Optimized version using database aggregations.
    More efficient for large datasets.
    """

    # Calculate date thresholds
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    thirty_days_from_now = now + timedelta(days=30)

    # Single aggregation query
    result = db.query(
        func.count(Campaign.id).label('total_campaigns'),
        func.sum(case((Campaign.status == 'active', 1), else_=0)).label('active_campaigns'),
        func.sum(case((Campaign.is_featured == True, 1), else_=0)).label('featured_campaigns'),
        func.sum(Campaign.goal_amount).label('total_goal'),
        func.sum(Campaign.raised_amount).label('total_raised'),
        func.sum(Campaign.donor_count).label('total_donors'),
        func.sum(Campaign.donation_count).label('total_donations'),
        func.sum(Campaign.view_count).label('total_views'),
        func.sum(Campaign.share_count).label('total_shares'),
        func.max(Campaign.raised_amount).label('highest_raised'),
        func.max(Campaign.donor_count).label('most_donors'),

        # Status breakdown
        func.sum(case((Campaign.status == 'active', 1), else_=0)).label('status_active'),
        func.sum(case((Campaign.status == 'draft', 1), else_=0)).label('status_draft'),
        func.sum(case((Campaign.status == 'completed', 1), else_=0)).label('status_completed'),
        func.sum(case((Campaign.status == 'paused', 1), else_=0)).label('status_paused'),
        func.sum(case((Campaign.status == 'archived', 1), else_=0)).label('status_archived'),

        # Type breakdown
        func.sum(case((Campaign.campaign_type == 'general', 1), else_=0)).label('type_general'),
        func.sum(case((Campaign.campaign_type == 'project', 1), else_=0)).label('type_project'),
        func.sum(case((Campaign.campaign_type == 'emergency', 1), else_=0)).label('type_emergency'),
        func.sum(case((Campaign.campaign_type == 'capital', 1), else_=0)).label('type_capital'),
        func.sum(case((Campaign.campaign_type == 'endowment', 1), else_=0)).label('type_endowment'),
        func.sum(case((Campaign.campaign_type == 'annual', 1), else_=0)).label('type_annual'),

        # Time-based
        func.sum(case((Campaign.end_date.between(now.date(), thirty_days_from_now.date()), 1), else_=0)).label('ending_soon'),
        func.sum(case((Campaign.created_at >= thirty_days_ago, 1), else_=0)).label('recently_created'),

    ).filter(
        Campaign.organization_id == organization_id
    ).first()

    if not result or result.total_campaigns == 0:
        return CampaignOrganizationStats()

    # Build stats object from aggregated results
    stats = CampaignOrganizationStats()

    stats.total_campaigns = result.total_campaigns or 0
    stats.active_campaigns = result.active_campaigns or 0
    stats.featured_campaigns = result.featured_campaigns or 0

    stats.total_goal_amount = Decimal(str(result.total_goal or 0))
    stats.total_raised_amount = Decimal(str(result.total_raised or 0))
    stats.total_remaining_amount = stats.total_goal_amount - stats.total_raised_amount

    if stats.total_goal_amount > 0:
        stats.overall_completion_rate = float(
            (stats.total_raised_amount / stats.total_goal_amount) * 100
        )

    stats.total_donors = result.total_donors or 0
    stats.total_donations = result.total_donations or 0

    if stats.total_donations > 0:
        stats.average_donation = stats.total_raised_amount / Decimal(str(stats.total_donations))

    stats.total_views = result.total_views or 0
    stats.total_shares = result.total_shares or 0

    if stats.total_campaigns > 0:
        stats.average_views_per_campaign = stats.total_views / stats.total_campaigns

    # Status breakdown
    stats.by_status = CampaignStatusStats(
        active=result.status_active or 0,
        draft=result.status_draft or 0,
        completed=result.status_completed or 0,
        paused=result.status_paused or 0,
        archived=result.status_archived or 0
    )

    # Type breakdown
    stats.by_type = CampaignTypeStats(
        general=result.type_general or 0,
        project=result.type_project or 0,
        emergency=result.type_emergency or 0,
        capital=result.type_capital or 0,
        endowment=result.type_endowment or 0,
        annual=result.type_annual or 0
    )

    # Time-based
    stats.campaigns_ending_soon = result.ending_soon or 0
    stats.campaigns_recently_created = result.recently_created or 0

    # For top performers, we need separate queries
    highest_raised_campaign = db.query(Campaign).filter(
        Campaign.organization_id == organization_id
    ).order_by(Campaign.raised_amount.desc()).first()

    if highest_raised_campaign and highest_raised_campaign.raised_amount:
        stats.highest_raised_campaign_id = str(highest_raised_campaign.id)
        stats.highest_raised_amount = Decimal(str(highest_raised_campaign.raised_amount))

    most_donors_campaign = db.query(Campaign).filter(
        Campaign.organization_id == organization_id
    ).order_by(Campaign.donor_count.desc()).first()

    if most_donors_campaign and most_donors_campaign.donor_count:
        stats.most_donors_campaign_id = str(most_donors_campaign.id)
        stats.most_donors_count = most_donors_campaign.donor_count

    # Calculate performance metrics (requires individual campaign data)
    campaigns = db.query(Campaign).filter(
        Campaign.organization_id == organization_id,
        Campaign.goal_amount > 0
    ).all()

    completion_rates = []
    for c in campaigns:
        if c.goal_amount and c.goal_amount > 0:
            raised = float(c.raised_amount or 0)
            goal = float(c.goal_amount)
            percentage = (raised / goal) * 100
            completion_rates.append(percentage)

            if percentage >= 100:
                stats.campaigns_at_goal += 1
                if percentage > 100:
                    stats.campaigns_above_goal += 1
            elif percentage < 50:
                stats.campaigns_below_50_percent += 1

    if completion_rates:
        stats.average_completion_rate = sum(completion_rates) / len(completion_rates)

    return stats