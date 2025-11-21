from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta, date
import uuid
import re

from database import get_db
from user_management.auth_dependencies import get_current_user
from models import Users as User, Organizations as Organization, Campaigns as Campaign, CampaignUpdates as CampaignUpdate, Donations
#from campaign.campaign_models import  Campaign, CampaignUpdate
from campaign.campaign_schemas import (
    CampaignCreate, CampaignUpdate as CampaignUpdateSchema, CampaignResponse,
    CampaignPerformance, CampaignUpdateCreate, CampaignUpdateResponse,
    PublicCampaignSummary, CampaignStatus
)

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from campaign name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return f"{slug}-{str(uuid.uuid4())[:8]}"

def normalize_campaign_fields(campaign: Campaign) -> Campaign:
    """
    Normalize campaign fields to prevent Pydantic validation errors.
    Sets None values to appropriate defaults.
    """
    from decimal import Decimal

    # Integer fields that should default to 0
    if campaign.donor_count is None:
        campaign.donor_count = 0
    if campaign.donation_count is None:
        campaign.donation_count = 0
    if campaign.view_count is None:
        campaign.view_count = 0
    if campaign.share_count is None:
        campaign.share_count = 0

    # Decimal/Float fields
    if campaign.raised_amount is None:
        campaign.raised_amount = 0
    if campaign.average_donation is None:
        campaign.average_donation = 0

    return campaign

def calculate_live_donation_stats(db: Session, campaign_id: uuid.UUID) -> dict:
    """
    Calculate live donation statistics from the Donations table.
    This ensures accurate totals that reflect actual completed donations.
    """
    from sqlalchemy import func

    # Get total raised
    total_raised = db.query(
        func.coalesce(func.sum(Donations.amount), 0)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0

    # Get donor count (unique donors)
    donor_count = db.query(
        func.count(func.distinct(Donations.donor_id))
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed',
        Donations.donor_id.isnot(None)
    ).scalar() or 0

    # Get donation count
    donation_count = db.query(
        func.count(Donations.id)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0

    # Calculate average donation
    average_donation = float(total_raised / donation_count) if donation_count > 0 else 0

    # Get largest donation
    largest_donation = db.query(
        func.max(Donations.amount)
    ).filter(
        Donations.campaign_id == campaign_id,
        Donations.payment_status == 'completed'
    ).scalar() or 0

    return {
        'raised_amount': float(total_raised),
        'donor_count': donor_count,
        'donation_count': donation_count,
        'average_donation': average_donation,
        'largest_donation': float(largest_donation)
    }

def calculate_campaign_metrics(campaign: Campaign) -> dict:
    """Calculate computed metrics for a campaign"""
    metrics = {}

    # Progress percentage
    if campaign.goal_amount > 0:
        metrics['progress_percentage'] = round((campaign.raised_amount / campaign.goal_amount) * 100, 2)
    else:
        metrics['progress_percentage'] = 0

    # Days remaining
    if campaign.end_date:
        end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = (end_date - date.today()).days
        metrics['days_remaining'] = max(0, days_remaining)
    else:
        metrics['days_remaining'] = None

    # Is active
    now = date.today()
    start_date = campaign.start_date.date() if isinstance(campaign.start_date, datetime) else campaign.start_date
    end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
    is_active = (
            campaign.status == "active" and
            (start_date is None or start_date <= now) and
            (end_date is None or end_date >= now)
    )
    metrics['is_active'] = is_active

    return metrics


# ==================== ORGANIZATION ADMIN ENDPOINTS ====================

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
        campaign_data: CampaignCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new campaign for the organization"""

    # Generate slug
    slug = generate_slug(campaign_data.name)

    # Create campaign
    campaign = Campaign(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id,
        slug=slug,
        **campaign_data.model_dump()
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Add computed metrics
    campaign = normalize_campaign_fields(campaign)

    # Get live donation stats from database (will be 0 for new campaigns)
    live_stats = calculate_live_donation_stats(db, campaign.id)
    campaign.raised_amount = live_stats['raised_amount']
    campaign.donor_count = live_stats['donor_count']
    campaign.donation_count = live_stats['donation_count']
    campaign.average_donation = live_stats['average_donation']

    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign,from_attributes=True)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
        status: Optional[CampaignStatus] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all campaigns for the organization"""

    query = db.query(Campaign).filter(Campaign.organization_id == current_user.organization_id)

    if status:
        query = query.filter(Campaign.status == status)

    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    # Add computed metrics to each campaign
    responses = []
    for campaign in campaigns:
        campaign = normalize_campaign_fields(campaign)

        # Get live donation stats from database
        live_stats = calculate_live_donation_stats(db, campaign.id)
        campaign.raised_amount = live_stats['raised_amount']
        campaign.donor_count = live_stats['donor_count']
        campaign.donation_count = live_stats['donation_count']
        campaign.average_donation = live_stats['average_donation']

        metrics = calculate_campaign_metrics(campaign)
        response = CampaignResponse.model_validate(campaign,from_attributes=True)
        for key, value in metrics.items():
            setattr(response, key, value)
        responses.append(response)

    return responses


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get a specific campaign by ID"""

    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Add computed metrics
    campaign = normalize_campaign_fields(campaign)

    # Get live donation stats from database
    live_stats = calculate_live_donation_stats(db, campaign.id)
    campaign.raised_amount = live_stats['raised_amount']
    campaign.donor_count = live_stats['donor_count']
    campaign.donation_count = live_stats['donation_count']
    campaign.average_donation = live_stats['average_donation']

    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign,from_attributes=True)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
        campaign_id: uuid.UUID,
        campaign_data: CampaignUpdateSchema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update a campaign"""

    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Update fields
    update_data = campaign_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)

    campaign.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(campaign)

    # Add computed metrics
    campaign = normalize_campaign_fields(campaign)

    # Get live donation stats from database
    live_stats = calculate_live_donation_stats(db, campaign.id)
    campaign.raised_amount = live_stats['raised_amount']
    campaign.donor_count = live_stats['donor_count']
    campaign.donation_count = live_stats['donation_count']
    campaign.average_donation = live_stats['average_donation']

    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign,from_attributes=True)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete a campaign"""

    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()

    return None


# ==================== CAMPAIGN PERFORMANCE ====================

@router.get("/{campaign_id}/performance", response_model=CampaignPerformance)
async def get_campaign_performance(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get detailed performance metrics for a campaign"""

    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Calculate metrics
    progress_percentage = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0

    # Calculate days active
    days_active = (datetime.utcnow() - campaign.created_at).days or 1

    # Calculate days remaining
    days_remaining = None
    if campaign.end_date:
        end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = max(0, (end_date - date.today()).days)

    # Calculate daily average
    daily_average = campaign.raised_amount / days_active if days_active > 0 else 0

    # Project total if end date exists
    projected_total = None
    is_on_track = True
    if campaign.end_date and days_remaining is not None:
        total_campaign_days = (campaign.end_date - campaign.created_at).days or 1
        projected_total = daily_average * total_campaign_days
        is_on_track = projected_total >= campaign.goal_amount

    performance = CampaignPerformance(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        goal_amount=campaign.goal_amount,
        raised_amount=campaign.raised_amount,
        progress_percentage=round(progress_percentage, 2),
        donor_count=campaign.donor_count,
        donation_count=campaign.donation_count,
        average_donation=campaign.average_donation,
        days_active=days_active,
        days_remaining=days_remaining,
        status=campaign.status,
        daily_average=round(daily_average, 2),
        projected_total=round(projected_total, 2) if projected_total else None,
        is_on_track=is_on_track
    )

    return performance


@router.get("/performance/summary")
async def get_all_campaigns_performance(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get performance summary for all active campaigns"""

    campaigns = db.query(Campaign).filter(
        and_(
            Campaign.organization_id == current_user.organization_id,
            Campaign.status.in_(["active", "paused"])
        )
    ).all()

    performances = []
    for campaign in campaigns:
        # Calculate metrics
        progress_percentage = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
        days_active = (datetime.utcnow() - campaign.created_at).days or 1
        days_remaining = None
        if campaign.end_date:
            end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = max(0, (end_date - date.today()).days)

        daily_average = campaign.raised_amount / days_active if days_active > 0 else 0
        projected_total = None
        is_on_track = True
        if campaign.end_date and days_remaining is not None:
            end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
            created_date = campaign.created_at.date() if isinstance(campaign.created_at, datetime) else campaign.created_at
            total_campaign_days = (end_date - created_date).days or 1
            projected_total = daily_average * total_campaign_days
            is_on_track = projected_total >= campaign.goal_amount

        performance = CampaignPerformance(
            campaign_id=campaign.id,
            campaign_name=campaign.name,
            goal_amount=campaign.goal_amount,
            raised_amount=campaign.raised_amount,
            progress_percentage=round(progress_percentage, 2),
            donor_count=campaign.donor_count,
            donation_count=campaign.donation_count,
            average_donation=campaign.average_donation,
            days_active=days_active,
            days_remaining=days_remaining,
            status=campaign.status,
            daily_average=round(daily_average, 2),
            projected_total=round(projected_total, 2) if projected_total else None,
            is_on_track=is_on_track
        )
        performances.append(performance)

    return performances


# ==================== CAMPAIGN UPDATES ====================

@router.post("/{campaign_id}/updates", response_model=CampaignUpdateResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign_update(
        campaign_id: uuid.UUID,
        update_data: CampaignUpdateCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create an update for a campaign"""

    # Verify campaign exists and belongs to organization
    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update = CampaignUpdate(
        id=uuid.uuid4(),
        campaign_id=campaign_id,
        **update_data.model_dump()
    )

    db.add(update)
    db.commit()
    db.refresh(update)

    return update


@router.get("/{campaign_id}/updates", response_model=List[CampaignUpdateResponse])
async def list_campaign_updates(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all updates for a campaign"""

    # Verify campaign exists and belongs to organization
    campaign = db.query(Campaign).filter(
        and_(
            Campaign.id == campaign_id,
            Campaign.organization_id == current_user.organization_id
        )
    ).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    updates = db.query(CampaignUpdate).filter(
        CampaignUpdate.campaign_id == campaign_id
    ).order_by(CampaignUpdate.created_at.desc()).all()

    return updates


# ==================== PUBLIC ENDPOINTS ====================

@router.get("/public/featured", response_model=List[PublicCampaignSummary])
async def get_public_featured_campaigns(
        limit: int = Query(6, ge=1, le=20),
        db: Session = Depends(get_db)
):
    """Get featured public campaigns for landing page"""

    campaigns = db.query(Campaign, Organization.name.label('organization_name')).join(
        Organization, Campaign.organization_id == Organization.id
    ).filter(
        and_(
            Campaign.is_public == True,
            Campaign.is_featured == True,
            Campaign.status == "active"
        )
    ).order_by(Campaign.created_at.desc()).limit(limit).all()

    summaries = []
    for campaign, org_name in campaigns:
        progress = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
        days_remaining = None
        if campaign.end_date:
            end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = max(0, (end_date - date.today()).days)

        summary = PublicCampaignSummary(
            id=campaign.id,
            name=campaign.name,
            slug=campaign.slug,
            description=campaign.description,
            campaign_type=campaign.campaign_type,
            goal_amount=campaign.goal_amount,
            raised_amount=campaign.raised_amount,
            progress_percentage=round(progress, 2),
            donor_count=campaign.donor_count,
            image_url=campaign.image_url,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            days_remaining=days_remaining,
            organization_name=org_name,
            is_featured=campaign.is_featured
        )
        summaries.append(summary)

    return summaries


@router.get("/public/all", response_model=List[PublicCampaignSummary])
async def get_all_public_campaigns(
        campaign_type: Optional[str] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(12, ge=1, le=50),
        db: Session = Depends(get_db)
):
    """Get all public campaigns for landing page"""

    query = db.query(Campaign, Organization.name.label('organization_name')).join(
        Organization, Campaign.organization_id == Organization.id
    ).filter(
        and_(
            Campaign.is_public == True,
            Campaign.status == "active"
        )
    )

    if campaign_type:
        query = query.filter(Campaign.campaign_type == campaign_type)

    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    summaries = []
    for campaign, org_name in campaigns:
        progress = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
        days_remaining = None
        if campaign.end_date:
            end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = max(0, (end_date - date.today()).days)

        summary = PublicCampaignSummary(
            id=campaign.id,
            name=campaign.name,
            slug=campaign.slug,
            description=campaign.description,
            campaign_type=campaign.campaign_type,
            goal_amount=campaign.goal_amount,
            raised_amount=campaign.raised_amount,
            progress_percentage=round(progress, 2),
            donor_count=campaign.donor_count,
            image_url=campaign.image_url,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            days_remaining=days_remaining,
            organization_name=org_name,
            is_featured=campaign.is_featured
        )
        summaries.append(summary)

    return summaries


@router.get("/public/{slug}", response_model=PublicCampaignSummary)
async def get_public_campaign_by_slug(
        slug: str,
        db: Session = Depends(get_db)
):
    """Get a specific public campaign by slug"""

    result = db.query(Campaign, Organization.name.label('organization_name')).join(
        Organization, Campaign.organization_id == Organization.id
    ).filter(
        and_(
            Campaign.slug == slug,
            Campaign.is_public == True
        )
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign, org_name = result

    # Increment view count
    campaign.view_count += 1
    db.commit()

    progress = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
    days_remaining = None
    if campaign.end_date:
        end_date = campaign.end_date.date() if isinstance(campaign.end_date, datetime) else campaign.end_date
        days_remaining = max(0, (end_date - date.today()).days)

    summary = PublicCampaignSummary(
        id=campaign.id,
        name=campaign.name,
        slug=campaign.slug,
        description=campaign.description,
        campaign_type=campaign.campaign_type,
        goal_amount=campaign.goal_amount,
        raised_amount=campaign.raised_amount,
        progress_percentage=round(progress, 2),
        donor_count=campaign.donor_count,
        image_url=campaign.image_url,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        days_remaining=days_remaining,
        organization_name=org_name,
        is_featured=campaign.is_featured
    )

    return summary