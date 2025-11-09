from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import re

from database import get_db
from user_management.auth_dependencies import get_current_user
# FIXED: Use correct models import, not models_bkp
from models import Users as User, Organizations as Organization, Donations as Donation, Campaigns as Campaign, CampaignUpdates as CampaignUpdate
#from campaign.campaign_models import Campaign, CampaignUpdate
from campaign.campaign_schemas import (
    CampaignCreate, CampaignUpdate as CampaignUpdateSchema, CampaignResponse,
    CampaignPerformance, CampaignUpdateCreate, CampaignUpdateResponse,
    PublicCampaignSummary, CampaignStatus
)

router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from campaign name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return f"{slug}-{str(uuid.uuid4())[:8]}"

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
        today = datetime.utcnow().date()
        days_remaining = (campaign.end_date - today).days if campaign.end_date else None
        metrics['days_remaining'] = max(0, days_remaining)
    else:
        metrics['days_remaining'] = None

    # Is active
    now = datetime.utcnow()
    is_active = (
            campaign.status == "active" and
            (campaign.start_date is None or campaign.start_date <= now) and
            (campaign.end_date is None or campaign.end_date >= now)
    )
    metrics['is_active'] = is_active

    return metrics

# FIXED: Add helper function to check organization access
def verify_organization_access(user: User, organization_id: uuid.UUID) -> None:
    """Verify user has access to the organization's campaigns"""
    # Superadmins can access any organization
    if user.is_superadmin:
        return

    # Regular users can only access their own organization
    if str(user.organization_id) != str(organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this organization's campaigns"
        )


# ==================== ORGANIZATION ADMIN ENDPOINTS ====================

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
        campaign_data: CampaignCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new campaign for the organization"""

    # FIXED: Check if user has an organization
    if not current_user.organization_id and not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization to create campaigns"
        )

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
    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign)
    for key, value in metrics.items():
        setattr(response, key, value)

    return response


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
        organization_id: Optional[uuid.UUID] = None,  # FIXED: Added organization_id parameter
        status: Optional[CampaignStatus] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """List all campaigns for the organization"""

    # FIXED: Determine which organization to query
    if organization_id:
        # If organization_id provided, verify access
        verify_organization_access(current_user, organization_id)
        target_org_id = organization_id
    elif current_user.is_superadmin and not organization_id:
        # Superadmin without org_id specified - return all campaigns
        query = db.query(Campaign)
    else:
        # Regular user - use their organization
        if not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to an organization"
            )
        target_org_id = current_user.organization_id

    # Build query
    if not (current_user.is_superadmin and not organization_id):
        query = db.query(Campaign).filter(Campaign.organization_id == target_org_id)

    if status:
        query = query.filter(Campaign.status == status)

    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    # Add computed metrics to each campaign
    responses = []
    for campaign in campaigns:
        metrics = calculate_campaign_metrics(campaign)
        response = CampaignResponse.model_validate(campaign)
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

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

    # Add computed metrics
    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign)
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

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

    # Update fields
    update_data = campaign_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)

    campaign.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(campaign)

    # Add computed metrics
    metrics = calculate_campaign_metrics(campaign)
    response = CampaignResponse.model_validate(campaign)
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

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

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

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

    # Calculate metrics
    progress_percentage = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
    today = datetime.utcnow().date()
    days_active = (today - campaign.start_date).days if campaign.start_date else 0
    # Calculate days active
    #days_active = (datetime.utcnow() - campaign.created_at).days or 1

    # Calculate days remaining
    days_remaining = None
    if campaign.end_date:
        days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

    # Calculate daily average and projections
    daily_average = campaign.raised_amount / days_active if days_active > 0 else 0
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


@router.get("/performance/all", response_model=List[CampaignPerformance])
async def get_all_campaign_performance(
        organization_id: Optional[uuid.UUID] = None,  # FIXED: Added organization_id parameter
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get performance metrics for all campaigns"""

    # FIXED: Determine which organization to query
    if organization_id:
        verify_organization_access(current_user, organization_id)
        target_org_id = organization_id
    elif current_user.is_superadmin:
        # Superadmin can see all
        campaigns = db.query(Campaign).all()
    else:
        if not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to an organization"
            )
        target_org_id = current_user.organization_id
        campaigns = db.query(Campaign).filter(Campaign.organization_id == target_org_id).all()

    if not current_user.is_superadmin or organization_id:
        campaigns = db.query(Campaign).filter(Campaign.organization_id == target_org_id).all()

    performances = []
    for campaign in campaigns:
        progress_percentage = (campaign.raised_amount / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
        days_active = (datetime.utcnow() - campaign.created_at).days or 1
        days_remaining = None
        if campaign.end_date:
            days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

        daily_average = campaign.raised_amount / days_active if days_active > 0 else 0
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

    # Verify campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

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

    # Verify campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # FIXED: Verify access
    verify_organization_access(current_user, campaign.organization_id)

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
            days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

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
            days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

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
        days_remaining = max(0, (campaign.end_date - datetime.utcnow()).days)

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