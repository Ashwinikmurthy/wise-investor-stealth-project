"""
Public Campaigns and Donations API Routes - CORRECTED
Handles public-facing campaign display and donation processing
Aligned with actual database schema
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid
import secrets

from database import get_db
from models import (
    Campaigns as Campaign,
    Organizations as Organization,
    Parties as Party,
    Donors as Donor,
    Donations as Donation
)
# Updated import path - adjust to match your actual schema file location
from campaign.pulic_campaigns_schema import (
    PublicCampaignResponse,
    PublicCampaignListResponse,
    CampaignPublicToggle,
    DonationCreate,
    DonationResponse,
    DonationConfirmation,
    DonorLookup,
    DonorProfileResponse,
    DonorDonationHistory,
    DonorDashboardResponse,
    CampaignStatistics,
    PaymentIntent,
    PaymentIntentResponse
)


router = APIRouter(prefix="/api/public", tags=["Public Campaigns & Donations"])


# ============================================================================
# PUBLIC CAMPAIGN ENDPOINTS (No Authentication Required)
# ============================================================================

@router.get("/campaigns", response_model=PublicCampaignListResponse)
async def get_public_campaigns(
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(10, ge=1, le=100, description="Items per page"),
        status: Optional[str] = Query(None, description="Filter by status: active, completed"),
        sort_by: str = Query("created_at", description="Sort by: created_at, goal_amount, end_date"),
        db: Session = Depends(get_db)
):
    """
    Get all public campaigns for display on landing page
    No authentication required - publicly accessible
    """

    # Base query for public campaigns
    query = db.query(
        Campaign,
        Organization.name.label("org_name"),
        Organization.logo_url.label("org_logo"),
        Organization.mission.label("org_mission")
    ).join(
        Organization, Campaign.organization_id == Organization.id
    ).filter(
        Campaign.is_public == True
    )

    # Filter by status if provided
    if status:
        query = query.filter(Campaign.status == status)

    # Apply sorting
    if sort_by == "goal_amount":
        query = query.order_by(desc(Campaign.goal_amount))
    elif sort_by == "end_date":
        query = query.order_by(Campaign.end_date)
    else:
        query = query.order_by(desc(Campaign.created_at))

    # Get total count
    total = query.count()

    # Apply pagination
    campaigns_data = query.offset((page - 1) * page_size).limit(page_size).all()

    # Build response with calculated fields
    campaigns_response = []
    for campaign, org_name, org_logo, org_mission in campaigns_data:
        # Calculate amount raised from donations table
        amount_raised = db.query(func.coalesce(func.sum(Donation.amount), 0)).filter(
            Donation.campaign_id == campaign.id,
            Donation.payment_status == 'completed'
        ).scalar() or Decimal(0)

        # Count unique donors
        donor_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.campaign_id == campaign.id,
            Donation.payment_status == 'completed',
            Donation.donor_id.isnot(None)
        ).scalar() or 0

        # Calculate progress percentage
        progress = (
            float((Decimal(amount_raised) / Decimal(campaign.goal_amount)) * 100)
            if campaign.goal_amount and campaign.goal_amount > 0
            else 0
        )

        # Calculate days remaining
        days_remaining = (campaign.end_date - date.today()).days if campaign.end_date else None

        campaigns_response.append(
            PublicCampaignResponse(
                id=campaign.id,
                organization_id=campaign.organization_id,
                organization_name=org_name,
                organization_logo=org_logo,
                organization_mission=org_mission,
                name=campaign.name,
                description=campaign.description,
                goal_amount=campaign.goal_amount or Decimal(0),
                start_date=campaign.start_date,
                end_date=campaign.end_date,
                campaign_type=campaign.campaign_type,
                is_public=campaign.is_public,
                status=campaign.status,
                story=campaign.story,
                image_url=campaign.image_url,
                video_url=campaign.video_url,
                slug=campaign.slug,
                is_featured=campaign.is_featured,
                allow_recurring=campaign.allow_recurring,
                suggested_amounts=campaign.suggested_amounts,
                amount_raised=amount_raised,
                donor_count=donor_count,
                progress_percentage=round(progress, 2),
                days_remaining=days_remaining if days_remaining and days_remaining > 0 else None,
                created_at=campaign.created_at,
                updated_at=campaign.updated_at
            )
        )

    return PublicCampaignListResponse(
        campaigns=campaigns_response,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/campaigns/{campaign_id}", response_model=PublicCampaignResponse)
async def get_public_campaign_detail(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific public campaign
    No authentication required
    """

    # Query campaign with organization info
    campaign_data = db.query(
        Campaign,
        Organization.name.label("org_name"),
        Organization.logo_url.label("org_logo"),
        Organization.mission.label("org_mission")
    ).join(
        Organization, Campaign.organization_id == Organization.id
    ).filter(
        Campaign.id == campaign_id,
        Campaign.is_public == True
    ).first()

    if not campaign_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public campaign not found"
        )

    campaign, org_name, org_logo, org_mission = campaign_data

    # Calculate metrics
    amount_raised = db.query(func.coalesce(func.sum(Donation.amount), 0)).filter(
        Donation.campaign_id == campaign.id,
        Donation.payment_status == 'completed'
    ).scalar() or Decimal(0)

    donor_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.campaign_id == campaign.id,
        Donation.payment_status == 'completed',
        Donation.donor_id.isnot(None)
    ).scalar() or 0

    progress = (
        float((Decimal(amount_raised) / Decimal(campaign.goal_amount)) * 100)
        if campaign.goal_amount and campaign.goal_amount > 0
        else 0
    )
    days_remaining = (campaign.end_date - date.today()).days if campaign.end_date else None

    return PublicCampaignResponse(
        id=campaign.id,
        organization_id=campaign.organization_id,
        organization_name=org_name,
        organization_logo=org_logo,
        organization_mission=org_mission,
        name=campaign.name,
        description=campaign.description,
        goal_amount=campaign.goal_amount or Decimal(0),
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        campaign_type=campaign.campaign_type,
        is_public=campaign.is_public,
        status=campaign.status,
        story=campaign.story,
        image_url=campaign.image_url,
        video_url=campaign.video_url,
        slug=campaign.slug,
        is_featured=campaign.is_featured,
        allow_recurring=campaign.allow_recurring,
        suggested_amounts=campaign.suggested_amounts,
        amount_raised=amount_raised,
        donor_count=donor_count,
        progress_percentage=round(progress, 2),
        days_remaining=days_remaining if days_remaining and days_remaining > 0 else None,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at
    )


@router.get("/campaigns/{campaign_id}/statistics", response_model=CampaignStatistics)
async def get_campaign_statistics(
        campaign_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a public campaign
    """

    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.is_public == True
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public campaign not found"
        )

    # Financial metrics
    donation_stats = db.query(
        func.count(Donation.id).label('count'),
        func.coalesce(func.sum(Donation.amount), 0).label('total'),
        func.coalesce(func.avg(Donation.amount), 0).label('average')
    ).filter(
        Donation.campaign_id == campaign.id,
        Donation.payment_status == 'completed'
    ).first()

    amount_raised = donation_stats.total if donation_stats else Decimal(0)
    avg_donation = donation_stats.average if donation_stats else Decimal(0)
    total_donors = donation_stats.count if donation_stats else 0

    # Progress
    progress = (
        float((Decimal(amount_raised) / Decimal(campaign.goal_amount)) * 100)
        if campaign.goal_amount and campaign.goal_amount > 0
        else 0
    )

    # Time metrics
    days_active = (date.today() - campaign.start_date).days if campaign.start_date else 0
    days_remaining = (campaign.end_date - date.today()).days if campaign.end_date else None

    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_stats = db.query(
        func.count(Donation.id).label('count'),
        func.coalesce(func.sum(Donation.amount), 0).label('total')
    ).filter(
        Donation.campaign_id == campaign.id,
        Donation.payment_status == 'completed',
        Donation.donation_date >= yesterday
    ).first()

    recent_count = recent_stats.count if recent_stats else 0
    recent_amount = recent_stats.total if recent_stats else Decimal(0)

    return CampaignStatistics(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        goal_amount=campaign.goal_amount or Decimal(0),
        amount_raised=amount_raised,
        progress_percentage=round(progress, 2),
        average_donation=avg_donation,
        total_donors=total_donors,
        new_donors=0,  # Would need additional tracking
        returning_donors=0,  # Would need additional tracking
        days_active=days_active,
        days_remaining=days_remaining,
        recent_donation_count_24h=recent_count,
        recent_donation_amount_24h=recent_amount
    )


# ============================================================================
# DONATION PROCESSING ENDPOINTS
# ============================================================================

@router.post("/campaigns/{campaign_id}/donate", response_model=DonationResponse)
async def create_donation(
        campaign_id: uuid.UUID,
        donation: DonationCreate,
        db: Session = Depends(get_db)
):
    """
    Process a new donation to a public campaign
    Creates or updates party record and donation record
    """

    # Verify campaign exists and is public
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.is_public == True
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public campaign not found"
        )

    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == campaign.organization_id
    ).first()

    if not organization:
        raise HTTPException(status_code=500, detail="Organization not found")

    # Find or create party record for donor
    party = db.query(Party).filter(
        Party.email == donation.donor_email,
        Party.organization_id == organization.id
    ).first()

    if not party:
        # Create new party record
        party = Party(
            id=uuid.uuid4(),
            organization_id=organization.id,
            full_name=donation.donor_full_name,
            display_name=donation.donor_full_name,
            email=donation.donor_email,
            phone=donation.donor_phone,
            address=donation.address,
            city=donation.city,
            state=donation.state,
            postal_code=donation.postal_code,
            country=donation.country or 'USA',
            donor_type='individual',
            created_at=datetime.utcnow()
        )
        db.add(party)
        db.flush()  # Get the party ID

    # Generate transaction ID
    transaction_id = f"TXN-{secrets.token_hex(8).upper()}"

    # Calculate tax deductible amount (typically 100% for donations)
    tax_deductible = donation.amount

    # Create donation record
    new_donation = Donation(
        id=uuid.uuid4(),
        organization_id=organization.id,
        party_id=party.id,
        donor_id=None,  # Can be linked later if donor record exists
        campaign_id=campaign.id,
        amount=donation.amount,
        currency=donation.currency,
        donation_date=datetime.utcnow(),
        payment_method=donation.payment_method,
        payment_status='completed',  # In real implementation, would be 'pending' until payment processed
        transaction_id=transaction_id,
        is_recurring=bool(donation.recurring_frequency),
        recurring_frequency=donation.recurring_frequency,
        dedication_type=donation.dedication_type,
        dedication_name=donation.dedication_name,
        is_anonymous=donation.is_anonymous,
        tax_deductible_amount=tax_deductible,
        receipt_sent=False,
        thank_you_sent=False,
        notes=donation.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_donation)

    # UPDATE CAMPAIGN STATISTICS
    # Calculate current campaign totals
    campaign_totals = db.query(
        func.sum(Donation.amount).label('total_raised'),
        func.count(func.distinct(Donation.party_id)).label('unique_donors')
    ).filter(
        Donation.campaign_id == campaign.id,
        Donation.payment_status == 'completed'
    ).first()

    # Update campaign fields (defensive - only if fields exist)
    try:
        # Use correct field name: raised_amount (not amount_raised)
        if hasattr(campaign, 'raised_amount'):
            campaign.raised_amount = float(campaign_totals.total_raised or 0)

        if hasattr(campaign, 'donor_count'):
            campaign.donor_count = campaign_totals.unique_donors or 0

        # Also update donation_count if it exists (total number of donations)
        if hasattr(campaign, 'donation_count'):
            donation_count = db.query(func.count(Donation.id)).filter(
                Donation.campaign_id == campaign.id,
                Donation.payment_status == 'completed'
            ).scalar()
            campaign.donation_count = donation_count or 0

        # Update progress percentage if goal exists and fields exist
        if (hasattr(campaign, 'progress_percentage') and
                hasattr(campaign, 'goal_amount') and
                campaign.goal_amount and campaign.goal_amount > 0):
            campaign.progress_percentage = (float(campaign_totals.total_raised or 0) / float(campaign.goal_amount)) * 100

        # Mark campaign as updated
        if hasattr(campaign, 'updated_at'):
            campaign.updated_at = datetime.utcnow()

        print(f"Updated campaign {campaign.id}: raised_amount=${campaign.raised_amount}, donor_count={campaign.donor_count}")

    except Exception as e:
        print(f"Warning: Could not update campaign stats: {e}")

    # Save all changes
    db.commit()
    db.refresh(new_donation)

    return DonationResponse(
        id=new_donation.id,
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        organization_id=organization.id,
        organization_name=organization.name,
        amount=new_donation.amount,
        currency=new_donation.currency,
        donor_email=party.email,
        donor_full_name=party.full_name,
        is_anonymous=new_donation.is_anonymous,
        payment_status=new_donation.payment_status,
        transaction_id=new_donation.transaction_id,
        donation_date=new_donation.donation_date,
        tax_deductible_amount=new_donation.tax_deductible_amount,
        receipt_sent=new_donation.receipt_sent,
        thank_you_sent=new_donation.thank_you_sent
    )


@router.post("/donations/confirm", response_model=DonationConfirmation)
async def confirm_donation(
        donation_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    """
    Get donation confirmation details
    """

    donation = db.query(Donation).filter(Donation.id == donation_id).first()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )

    # Get related records
    campaign = db.query(Campaign).filter(Campaign.id == donation.campaign_id).first()
    organization = db.query(Organization).filter(Organization.id == donation.organization_id).first()
    party = db.query(Party).filter(Party.id == donation.party_id).first()

    # Generate transaction ID if not present
    transaction_id = donation.transaction_id
    if not transaction_id:
        transaction_id = f"TXN-{str(donation.id).replace('-', '')[:12].upper()}"
        # Optionally save it to database
        donation.transaction_id = transaction_id
        db.commit()

    return DonationConfirmation(
        success=donation.payment_status == 'completed',
        donation_id=donation.id,
        amount=donation.amount,
        campaign_name=campaign.name if campaign else "Unknown Campaign",
        organization_name=organization.name if organization else "Unknown Organization",
        transaction_id=transaction_id,
        message="Thank you for your generous donation!",
        confirmation_email=party.email if party else ""
    )


# ============================================================================
# DONOR LOOKUP / DASHBOARD ENDPOINTS
# ============================================================================

@router.post("/donor/lookup", response_model=DonorProfileResponse)
async def lookup_donor(
        lookup: DonorLookup,
        db: Session = Depends(get_db)
):
    """
    Look up donor information by email
    Simplified version without authentication
    """

    donor = db.query(Donor).filter(Donor.email == lookup.email).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )

    # Get donation statistics
    donation_stats = db.query(
        func.count(Donation.id).label('count'),
        func.coalesce(func.sum(Donation.amount), 0).label('total'),
        func.min(Donation.donation_date).label('first_donation'),
        func.max(Donation.donation_date).label('last_donation')
    ).filter(
        Donation.donor_id == donor.id,
        Donation.payment_status == 'completed'
    ).first()

    return DonorProfileResponse(
        id=donor.id,
        email=donor.email,
        full_name=f"{donor.first_name or ''} {donor.last_name or ''}".strip(),
        display_name=donor.first_name or f"{donor.first_name or ''} {donor.last_name or ''}".strip(),
        phone=donor.phone,
        total_donated=donation_stats.total if donation_stats else Decimal(0),
        donation_count=donation_stats.count if donation_stats else 0,
        first_donation_date=donation_stats.first_donation if donation_stats else None,
        last_donation_date=donation_stats.last_donation if donation_stats else None,
        created_at=donor.created_at
    )


@router.get("/donor/{donor_id}/dashboard", response_model=DonorDashboardResponse)
async def get_donor_dashboard(
        donor_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    """
    Get donor dashboard with donation history and statistics
    Simplified version without authentication
    """

    donor = db.query(Donor).filter(Donor.id == donor_id).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )

    # Get donation statistics
    donation_stats = db.query(
        func.count(Donation.id).label('count'),
        func.coalesce(func.sum(Donation.amount), 0).label('total'),
        func.min(Donation.donation_date).label('first_donation'),
        func.max(Donation.donation_date).label('last_donation')
    ).filter(
        Donation.donor_id == donor.id,
        Donation.payment_status == 'completed'
    ).first()

    # Get recent donations
    recent_donations_query = db.query(
        Donation,
        Campaign.name.label('campaign_name'),
        Organization.name.label('org_name')
    ).outerjoin(
        Campaign, Donation.campaign_id == Campaign.id
    ).outerjoin(
        Organization, Donation.organization_id == Organization.id
    ).filter(
        Donation.donor_id == donor.id
    ).order_by(desc(Donation.donation_date)).limit(10).all()

    recent_donations = [
        DonorDonationHistory(
            id=don.id,
            campaign_id=don.campaign_id,
            campaign_name=campaign_name or "General Donation",
            organization_name=org_name or "Unknown",
            amount=don.amount,
            donation_date=don.donation_date,
            payment_status=don.payment_status,
            is_recurring=bool(don.recurring_frequency),
            currency=don.currency or "USD"
        )
        for don, campaign_name, org_name in recent_donations_query
    ]

    # Count unique organizations and campaigns
    orgs_supported = db.query(func.count(func.distinct(Donation.organization_id))).filter(
        Donation.donor_id == donor.id,
        Donation.payment_status == 'completed'
    ).scalar() or 0

    campaigns_supported = db.query(func.count(func.distinct(Donation.campaign_id))).filter(
        Donation.donor_id == donor.id,
        Donation.payment_status == 'completed',
        Donation.campaign_id.isnot(None)
    ).scalar() or 0

    profile = DonorProfileResponse(
        id=donor.id,
        email=donor.email,
        full_name=f"{donor.first_name or ''} {donor.last_name or ''}".strip(),
        display_name=donor.first_name or f"{donor.first_name or ''} {donor.last_name or ''}".strip(),
        phone=donor.phone,
        total_donated=donation_stats.total if donation_stats else Decimal(0),
        donation_count=donation_stats.count if donation_stats else 0,
        first_donation_date=donation_stats.first_donation if donation_stats else None,
        last_donation_date=donation_stats.last_donation if donation_stats else None,
        created_at=donor.created_at
    )

    return DonorDashboardResponse(
        profile=profile,
        recent_donations=recent_donations,
        total_impact=donation_stats.total if donation_stats else Decimal(0),
        organizations_supported=orgs_supported,
        campaigns_supported=campaigns_supported
    )


# Export router
__all__ = ['router']