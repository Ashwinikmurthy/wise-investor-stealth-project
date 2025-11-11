"""
Campaign Analytics API Router
Comprehensive metrics and analytics for campaign performance
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, extract, case
from typing import List, Optional
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid

from database import get_db
from models import Campaigns, Donations, Donors
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/campaigns/analytics", tags=["Campaign Analytics"])


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class CampaignPerformanceMetrics(BaseModel):
    campaign_id: str
    campaign_name: str
    total_raised: float
    goal_amount: float
    progress_percentage: float
    donor_count: int
    donation_count: int
    average_donation: float
    largest_donation: float
    days_active: int
    days_remaining: Optional[int]
    velocity_per_day: float  # Average raised per day
    projected_total: Optional[float]  # Based on current velocity
    status: str
    is_on_track: bool  # Will it reach goal by end date?

class DonorSegmentMetrics(BaseModel):
    segment: str
    donor_count: int
    total_amount: float
    average_donation: float
    percentage_of_total: float

class TimeSeriesDataPoint(BaseModel):
    date: str
    amount: float
    cumulative_amount: float
    donor_count: int
    donation_count: int

class CampaignTrendResponse(BaseModel):
    campaign_id: str
    campaign_name: str
    timeline: List[TimeSeriesDataPoint]
    total_raised: float
    donor_count: int

class CampaignComparisonMetrics(BaseModel):
    campaign_id: str
    campaign_name: str
    total_raised: float
    donor_count: int
    progress_percentage: float
    velocity_per_day: float
    average_donation: float
    status: str

class DonationPatternMetrics(BaseModel):
    hour_distribution: dict  # Distribution by hour of day
    day_of_week_distribution: dict  # Distribution by day of week
    month_distribution: dict  # Distribution by month
    recurring_vs_one_time: dict
    average_by_payment_method: dict

class TopDonorsResponse(BaseModel):
    donor_id: str
    donor_name: str
    email: str
    total_donated: float
    donation_count: int
    first_donation_date: str
    last_donation_date: str
    average_donation: float

class CampaignHealthScore(BaseModel):
    campaign_id: str
    overall_score: float  # 0-100
    momentum_score: float  # Based on donation velocity
    engagement_score: float  # Based on donor count and frequency
    conversion_score: float  # Based on goal progress
    health_status: str  # "Excellent", "Good", "Needs Attention", "Critical"
    recommendations: List[str]


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/{campaign_id}/performance", response_model=CampaignPerformanceMetrics)
async def get_campaign_performance(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive performance metrics for a campaign
    """
    # Get campaign
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Calculate metrics
    donations_query = db.query(Donations).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    )
    
    total_raised = db.query(
        func.coalesce(func.sum(Donations.amount), 0)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0
    
    donor_count = db.query(
        func.count(func.distinct(Donations.donor_id))
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed',
        Donations.donor_id.isnot(None)
    ).scalar() or 0
    
    donation_count = donations_query.count()
    
    average_donation = float(total_raised / donation_count) if donation_count > 0 else 0
    
    largest_donation = db.query(
        func.max(Donations.amount)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0
    
    # Calculate days active and remaining
    days_active = 0
    days_remaining = None
    today = date.today()
    if campaign.start_date:
        days_active = (today - campaign.start_date).days
    if campaign.end_date:
        days_remaining = (campaign.end_date - today).days
        days_remaining = max(0, days_remaining)
    
    # Calculate velocity
    velocity_per_day = float(total_raised / days_active) if days_active > 0 else 0
    
    # Project total based on velocity
    projected_total = None
    if campaign.end_date and velocity_per_day > 0:
        total_days = (campaign.end_date - campaign.start_date).days
        projected_total = velocity_per_day * total_days
    
    # Progress and on-track status
    progress_percentage = (float(total_raised) / float(campaign.goal_amount) * 100) if campaign.goal_amount > 0 else 0
    is_on_track = projected_total >= float(campaign.goal_amount) if projected_total else False
    
    return CampaignPerformanceMetrics(
        campaign_id=str(campaign.id),
        campaign_name=campaign.name,
        total_raised=float(total_raised),
        goal_amount=float(campaign.goal_amount),
        progress_percentage=round(progress_percentage, 2),
        donor_count=donor_count,
        donation_count=donation_count,
        average_donation=round(average_donation, 2),
        largest_donation=float(largest_donation),
        days_active=days_active,
        days_remaining=days_remaining,
        velocity_per_day=round(velocity_per_day, 2),
        projected_total=round(projected_total, 2) if projected_total else None,
        status=campaign.status.value,
        is_on_track=is_on_track
    )


@router.get("/{campaign_id}/donor-segments", response_model=List[DonorSegmentMetrics])
async def get_donor_segments(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db)
):
    """
    Break down donors by giving level segments
    """
    # Verify campaign exists
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get total raised for percentage calculations
    total_raised = db.query(
        func.coalesce(func.sum(Donations.amount), 0)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 1  # Avoid division by zero
    
    # Define segments
    segments = [
        ("Major Donor ($10,000+)", 10000, None),
        ("Mid-Level ($1,000-$9,999)", 1000, 10000),
        ("Regular Donor ($100-$999)", 100, 1000),
        ("Small Donor (<$100)", 0, 100)
    ]
    
    results = []
    
    for segment_name, min_amount, max_amount in segments:
        # Query for this segment
        query = db.query(
            func.count(func.distinct(Donations.donor_id)).label('donor_count'),
            func.coalesce(func.sum(Donations.amount), 0).label('total_amount')
        ).filter(
            Donations.campaign_id == campaign_id,
            Donations.payment_status == 'completed',
            Donations.donor_id.isnot(None)
        )
        
        # Subquery to get donor totals
        donor_totals = db.query(
            Donations.donor_id,
            func.sum(Donations.amount).label('donor_total')
        ).filter(
            Donations.campaign_id == campaign_id,
            Donations.payment_status == 'completed',
            Donations.donor_id.isnot(None)
        ).group_by(Donations.donor_id).subquery()
        
        # Filter by segment range
        segment_donors = db.query(donor_totals.c.donor_id).filter(
            donor_totals.c.donor_total >= min_amount
        )
        if max_amount:
            segment_donors = segment_donors.filter(donor_totals.c.donor_total < max_amount)
        
        segment_donor_ids = [row[0] for row in segment_donors.all()]
        
        if segment_donor_ids:
            segment_data = db.query(
                func.count(func.distinct(Donations.donor_id)).label('donor_count'),
                func.coalesce(func.sum(Donations.amount), 0).label('total_amount')
            ).filter(
                Donations.campaign_id == campaign_id,
                Donations.payment_status == 'completed',
                Donations.donor_id.in_(segment_donor_ids)
            ).first()
            
            donor_count = segment_data.donor_count or 0
            total_amount = float(segment_data.total_amount or 0)
        else:
            donor_count = 0
            total_amount = 0.0
        
        avg_donation = total_amount / donor_count if donor_count > 0 else 0
        percentage = (total_amount / float(total_raised)) * 100 if total_raised > 0 else 0
        
        results.append(DonorSegmentMetrics(
            segment=segment_name,
            donor_count=donor_count,
            total_amount=round(total_amount, 2),
            average_donation=round(avg_donation, 2),
            percentage_of_total=round(percentage, 2)
        ))
    
    return results


@router.get("/{campaign_id}/timeline", response_model=CampaignTrendResponse)
async def get_campaign_timeline(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    interval: str = Query("day", description="Interval: day, week, month"),
    db: Session = Depends(get_db)
):
    """
    Get time-series data showing campaign progress over time
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get all donations ordered by date
    donations = db.query(
        cast(Donations.donation_date, Date).label('date'),
        func.sum(Donations.amount).label('amount'),
        func.count(func.distinct(Donations.donor_id)).label('donor_count'),
        func.count(Donations.id).label('donation_count')
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).group_by(
        cast(Donations.donation_date, Date)
    ).order_by('date').all()
    
    # Build timeline with cumulative amounts
    timeline = []
    cumulative = 0.0
    
    for donation in donations:
        cumulative += float(donation.amount)
        timeline.append(TimeSeriesDataPoint(
            date=donation.date.isoformat(),
            amount=float(donation.amount),
            cumulative_amount=round(cumulative, 2),
            donor_count=donation.donor_count,
            donation_count=donation.donation_count
        ))
    
    total_raised = cumulative
    total_donors = db.query(
        func.count(func.distinct(Donations.donor_id))
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0
    
    return CampaignTrendResponse(
        campaign_id=str(campaign_id),
        campaign_name=campaign.name,
        timeline=timeline,
        total_raised=round(total_raised, 2),
        donor_count=total_donors
    )


@router.get("/compare", response_model=List[CampaignComparisonMetrics])
async def compare_campaigns(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    campaign_ids: str = Query(..., description="Comma-separated campaign IDs"),
    db: Session = Depends(get_db)
):
    """
    Compare metrics across multiple campaigns
    """
    # Parse campaign IDs
    try:
        ids = [uuid.UUID(id.strip()) for id in campaign_ids.split(',')]
    except:
        raise HTTPException(status_code=400, detail="Invalid campaign IDs format")
    
    results = []
    
    for campaign_id in ids:
        campaign = db.query(Campaigns).filter(
            Campaigns.id == campaign_id,
            Campaigns.organization_id == organization_id
        ).first()
        
        if not campaign:
            continue
        
        # Calculate metrics
        total_raised = db.query(
            func.coalesce(func.sum(Donations.amount), 0)
        ).filter(
            Donations.campaign_id == campaign_id,
            Donations.payment_status == 'completed'
        ).scalar() or 0
        
        donor_count = db.query(
            func.count(func.distinct(Donations.donor_id))
        ).filter(
            Donations.campaign_id == campaign_id,
            Donations.payment_status == 'completed',
            Donations.donor_id.isnot(None)
        ).scalar() or 0
        
        donation_count = db.query(func.count(Donations.id)).filter(
            Donations.campaign_id == campaign_id,
            Donations.payment_status == 'completed'
        ).scalar() or 0
        
        progress = (float(total_raised) / float(campaign.goal_amount) * 100) if campaign.goal_amount > 0 else 0
        
        days_active = (date.today() - campaign.start_date).days if campaign.start_date else 1
        velocity = float(total_raised / days_active) if days_active > 0 else 0
        
        avg_donation = float(total_raised / donation_count) if donation_count > 0 else 0
        
        results.append(CampaignComparisonMetrics(
            campaign_id=str(campaign.id),
            campaign_name=campaign.name,
            total_raised=float(total_raised),
            donor_count=donor_count,
            progress_percentage=round(progress, 2),
            velocity_per_day=round(velocity, 2),
            average_donation=round(avg_donation, 2),
            status=campaign.status.value
        ))
    
    return results


@router.get("/{campaign_id}/patterns", response_model=DonationPatternMetrics)
async def get_donation_patterns(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db)
):
    """
    Analyze donation patterns - timing, methods, frequency
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    donations = db.query(Donations).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).all()
    
    # Hour distribution
    hour_dist = {}
    for i in range(24):
        hour_dist[str(i)] = 0
    
    # Day of week distribution
    day_dist = {
        '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0
    }
    
    # Month distribution
    month_dist = {}
    for i in range(1, 13):
        month_dist[str(i)] = 0
    
    # Payment method breakdown
    payment_methods = {}
    
    # Recurring vs one-time
    recurring_vs_onetime = {
        'recurring': 0,
        'one_time': 0
    }
    
    for donation in donations:
        if donation.donation_date:
            hour = donation.donation_date.hour
            hour_dist[str(hour)] += float(donation.amount)
            
            day = donation.donation_date.weekday()
            day_dist[str(day)] += float(donation.amount)
            
            month = donation.donation_date.month
            month_dist[str(month)] += float(donation.amount)
        
        if donation.payment_method:
            method = donation.payment_method
            payment_methods[method] = payment_methods.get(method, 0) + float(donation.amount)
        
        if donation.is_recurring:
            recurring_vs_onetime['recurring'] += float(donation.amount)
        else:
            recurring_vs_onetime['one_time'] += float(donation.amount)
    
    return DonationPatternMetrics(
        hour_distribution=hour_dist,
        day_of_week_distribution=day_dist,
        month_distribution=month_dist,
        recurring_vs_one_time=recurring_vs_onetime,
        average_by_payment_method=payment_methods
    )


@router.get("/{campaign_id}/top-donors", response_model=List[TopDonorsResponse])
async def get_top_donors(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    limit: int = Query(10, description="Number of top donors to return"),
    db: Session = Depends(get_db)
):
    """
    Get top donors for a campaign
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get top donors
    top_donors = db.query(
        Donations.donor_id,
        func.sum(Donations.amount).label('total_donated'),
        func.count(Donations.id).label('donation_count'),
        func.min(Donations.donation_date).label('first_donation'),
        func.max(Donations.donation_date).label('last_donation')
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed',
        Donations.donor_id.isnot(None)
    ).group_by(
        Donations.donor_id
    ).order_by(
        func.sum(Donations.amount).desc()
    ).limit(limit).all()
    
    results = []
    for donor_data in top_donors:
        donor = db.query(Donors).filter(Donors.id == donor_data.donor_id).first()
        
        if donor:
            avg_donation = float(donor_data.total_donated) / donor_data.donation_count
            
            results.append(TopDonorsResponse(
                donor_id=str(donor.id),
                donor_name=f"{donor.first_name or ''} {donor.last_name or ''}".strip() or "Anonymous",
                email=donor.email or "N/A",
                total_donated=float(donor_data.total_donated),
                donation_count=donor_data.donation_count,
                first_donation_date=donor_data.first_donation.isoformat() if donor_data.first_donation else "N/A",
                last_donation_date=donor_data.last_donation.isoformat() if donor_data.last_donation else "N/A",
                average_donation=round(avg_donation, 2)
            ))
    
    return results


@router.get("/{campaign_id}/health-score", response_model=CampaignHealthScore)
async def get_campaign_health_score(
    campaign_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db)
):
    """
    Calculate an overall health score for the campaign
    """
    campaign = db.query(Campaigns).filter(
        Campaigns.id == campaign_id,
        Campaigns.organization_id == organization_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get performance metrics
    total_raised = db.query(
        func.coalesce(func.sum(Donations.amount), 0)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0
    
    donor_count = db.query(
        func.count(func.distinct(Donations.donor_id))
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed',
        Donations.donor_id.isnot(None)
    ).scalar() or 0
    
    days_active = (date.today() - campaign.start_date).days if campaign.start_date else 1
    
    # Calculate scores (0-100)
    
    # 1. Conversion Score - based on progress to goal
    progress = (float(total_raised) / float(campaign.goal_amount)) if campaign.goal_amount > 0 else 0
    conversion_score = min(progress * 100, 100)
    
    # 2. Momentum Score - based on donation velocity
    velocity = float(total_raised / days_active) if days_active > 0 else 0
    expected_velocity = float(campaign.goal_amount) / 30  # Expected over 30 days
    momentum_score = min((velocity / expected_velocity) * 100, 100) if expected_velocity > 0 else 50
    
    # 3. Engagement Score - based on donor count
    expected_donors = 20  # Baseline expectation
    engagement_score = min((donor_count / expected_donors) * 100, 100)
    
    # Overall score (weighted average)
    overall_score = (
        conversion_score * 0.4 +
        momentum_score * 0.3 +
        engagement_score * 0.3
    )
    
    # Determine health status
    if overall_score >= 80:
        health_status = "Excellent"
    elif overall_score >= 60:
        health_status = "Good"
    elif overall_score >= 40:
        health_status = "Needs Attention"
    else:
        health_status = "Critical"
    
    # Generate recommendations
    recommendations = []
    if conversion_score < 50:
        recommendations.append("Consider extending the campaign or increasing outreach efforts")
    if momentum_score < 50:
        recommendations.append("Daily donation velocity is low - try launching a matching campaign")
    if engagement_score < 50:
        recommendations.append("Donor engagement is low - consider email campaigns or social media push")
    if donor_count < 10:
        recommendations.append("Focus on donor acquisition through targeted marketing")
    if progress > 0.8:
        recommendations.append("You're close to your goal! Create urgency with a final push campaign")
    
    if not recommendations:
        recommendations.append("Campaign is performing well! Maintain current strategies")
    
    return CampaignHealthScore(
        campaign_id=str(campaign_id),
        overall_score=round(overall_score, 1),
        momentum_score=round(momentum_score, 1),
        engagement_score=round(engagement_score, 1),
        conversion_score=round(conversion_score, 1),
        health_status=health_status,
        recommendations=recommendations
    )


# Export router
__all__ = ['router']
