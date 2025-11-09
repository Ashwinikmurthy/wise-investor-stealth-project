"""
Public Donations API Router
Handles public donation submissions without authentication
Creates donors, donations, and updates campaign stats
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from decimal import Decimal

from database import get_db
from models import (
    Donations as Donation,
    Donors as Donor,
    Campaigns as Campaign,
    Organizations as Organization
)

router = APIRouter(prefix="/api/public", tags=["Public Donations"])


# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================

class DonationCreate(BaseModel):
    campaign_id: UUID
    amount: float = Field(gt=0, description="Donation amount must be greater than 0")
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    is_anonymous: bool = False
    payment_method: str = Field(default="credit_card")
    payment_status: str = Field(default="completed")
    notes: Optional[str] = None


class DonationResponse(BaseModel):
    success: bool
    donation_id: UUID
    donor_id: UUID
    campaign_id: UUID
    amount: float
    campaign_name: str
    organization_name: str
    message: str

    class Config:
        from_attributes = True


class DonationConfirmResponse(BaseModel):
    success: bool
    donation_id: UUID
    amount: str
    campaign_name: str
    organization_name: str
    transaction_id: str
    message: str
    confirmation_email: str


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

def get_or_create_donor(db: Session, email: str, first_name: str, last_name: str,
                        phone: Optional[str], organization_id: UUID) -> Donor:
    """
    Get existing donor by email or create a new one
    """
    # Check if donor exists by email and organization
    donor = db.query(Donor).filter(
        Donor.email == email,
        Donor.organization_id == organization_id
    ).first()

    if donor:
        # Update donor info if needed
        donor.first_name = first_name
        donor.last_name = last_name
        if phone:
            donor.phone = phone
        donor.updated_at = datetime.utcnow()
        return donor

    # Create new donor
    new_donor = Donor(
        id=uuid4(),
        organization_id=organization_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        donor_status="active",
        total_donated=0,
        donation_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_donor)
    return new_donor


def update_donor_stats(db: Session, donor: Donor, amount: float):
    """
    Update donor statistics after donation
    """
    donor.total_donated = float(donor.total_donated or 0) + amount
    donor.donation_count = (donor.donation_count or 0) + 1
    donor.last_donation_date = datetime.utcnow()
    donor.updated_at = datetime.utcnow()


def update_campaign_stats(db: Session, campaign: Campaign, amount: float):
    """
    Update campaign statistics after donation
    """
    # Update amount raised
    current_raised = float(campaign.raised_amount or 0)
    campaign.raised_amount = current_raised + amount

    # Update donor count (count distinct donors for this campaign)
    donor_count = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.campaign_id == campaign.id
    ).scalar()
    campaign.donor_count = donor_count

    # Update progress percentage
    if campaign.goal_amount and campaign.goal_amount > 0:
        campaign.progress_percentage = (campaign.raised_amount / float(campaign.goal_amount)) * 100

    campaign.updated_at = datetime.utcnow()


# =====================================================================
# API ENDPOINTS
# =====================================================================

@router.post("/donations", response_model=DonationResponse)
async def create_public_donation(
        donation_data: DonationCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new donation from the public donation form.

    This endpoint:
    1. Creates or updates the donor record
    2. Creates the donation record
    3. Updates campaign statistics (raised_amount, donor_count, progress)
    4. Updates donor statistics (total_donated, donation_count)

    All operations are performed in a single transaction.
    """
    try:
        # Validate campaign exists and is active
        campaign = db.query(Campaign).filter(
            Campaign.id == donation_data.campaign_id
        ).first()

        if not campaign:
            raise HTTPException(
                status_code=404,
                detail=f"Campaign with ID {donation_data.campaign_id} not found"
            )

        if campaign.status != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Campaign is not active. Current status: {campaign.status}"
            )

        # Get organization info
        organization = db.query(Organization).filter(
            Organization.id == campaign.organization_id
        ).first()

        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Organization not found"
            )

        # Get or create donor
        donor = get_or_create_donor(
            db=db,
            email=donation_data.email,
            first_name=donation_data.first_name,
            last_name=donation_data.last_name,
            phone=donation_data.phone,
            organization_id=campaign.organization_id
        )

        # Create donation record
        new_donation = Donation(
            id=uuid4(),
            organization_id=campaign.organization_id,
            donor_id=donor.id,
            campaign_id=donation_data.campaign_id,
            amount=Decimal(str(donation_data.amount)),
            donation_date=datetime.utcnow(),
            payment_method=donation_data.payment_method,
            payment_status=donation_data.payment_status,
            is_anonymous=donation_data.is_anonymous,
            notes=donation_data.notes,
            currency="USD",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_donation)

        # Update donor statistics
        update_donor_stats(db, donor, donation_data.amount)

        # Update campaign statistics
        update_campaign_stats(db, campaign, donation_data.amount)

        # Commit all changes
        db.commit()
        db.refresh(new_donation)
        db.refresh(donor)
        db.refresh(campaign)

        # Return response
        return DonationResponse(
            success=True,
            donation_id=new_donation.id,
            donor_id=donor.id,
            campaign_id=campaign.id,
            amount=donation_data.amount,
            campaign_name=campaign.name,
            organization_name=organization.name,
            message=f"Thank you for your donation of ${donation_data.amount:.2f}!"
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating donation: {str(e)}"
        )


@router.post("/donations/confirm", response_model=DonationConfirmResponse)
async def confirm_donation(
        donation_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Confirm a donation and return confirmation details.

    This is typically called after payment processing to confirm the donation
    and send confirmation email.
    """
    try:
        # Get donation
        donation = db.query(Donation).filter(
            Donation.id == donation_id
        ).first()

        if not donation:
            raise HTTPException(
                status_code=404,
                detail=f"Donation with ID {donation_id} not found"
            )

        # Get related data
        campaign = db.query(Campaign).filter(
            Campaign.id == donation.campaign_id
        ).first()

        organization = db.query(Organization).filter(
            Organization.id == donation.organization_id
        ).first()

        donor = db.query(Donor).filter(
            Donor.id == donation.donor_id
        ).first()

        if not campaign or not organization or not donor:
            raise HTTPException(
                status_code=404,
                detail="Related records not found"
            )

        # Generate transaction ID (you can customize this format)
        transaction_id = f"TXN-{donation.id.hex[:8].upper()}"

        # Update donation with transaction ID if you have a field for it
        # donation.transaction_id = transaction_id
        donation.updated_at = datetime.utcnow()

        db.commit()

        # Return confirmation
        return DonationConfirmResponse(
            success=True,
            donation_id=donation.id,
            amount=str(donation.amount),
            campaign_name=campaign.name,
            organization_name=organization.name,
            transaction_id=transaction_id,
            message=f"Thank you for your donation to {campaign.name}!",
            confirmation_email=donor.email
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error confirming donation: {str(e)}"
        )


@router.get("/donations/{donation_id}")
async def get_donation_details(
        donation_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Get details of a specific donation (for receipt/confirmation page)
    """
    donation = db.query(Donation).filter(
        Donation.id == donation_id
    ).first()

    if not donation:
        raise HTTPException(
            status_code=404,
            detail="Donation not found"
        )

    # Get related data
    campaign = db.query(Campaign).filter(
        Campaign.id == donation.campaign_id
    ).first()

    organization = db.query(Organization).filter(
        Organization.id == donation.organization_id
    ).first()

    donor = db.query(Donor).filter(
        Donor.id == donation.donor_id
    ).first()

    return {
        "donation": {
            "id": str(donation.id),
            "amount": float(donation.amount),
            "donation_date": donation.donation_date.isoformat(),
            "payment_method": donation.payment_method,
            "payment_status": donation.payment_status,
            "is_anonymous": donation.is_anonymous
        },
        "campaign": {
            "id": str(campaign.id),
            "name": campaign.name,
            "description": campaign.description
        },
        "organization": {
            "id": str(organization.id),
            "name": organization.name
        },
        "donor": {
            "first_name": donor.first_name if not donation.is_anonymous else "Anonymous",
            "last_name": donor.last_name if not donation.is_anonymous else "Donor",
            "email": donor.email
        }
    }


# =====================================================================
# CAMPAIGN INFO (for donation page)
# =====================================================================

@router.get("/campaigns/{campaign_id}")
async def get_campaign_for_donation(
        campaign_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Get campaign details for the donation page
    """
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id
    ).first()

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    organization = db.query(Organization).filter(
        Organization.id == campaign.organization_id
    ).first()

    # Calculate days remaining
    days_remaining = None
    if campaign.end_date:
        delta = campaign.end_date - datetime.now().date()
        days_remaining = max(0, delta.days)

    return {
        "id": str(campaign.id),
        "name": campaign.name,
        "description": campaign.description,
        "goal_amount": float(campaign.goal_amount or 0),
        "raised_amount": float(campaign.raised_amount or 0),
        "donor_count": campaign.donor_count or 0,
        "progress_percentage": float(campaign.progress_percentage or 0),
        "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
        "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
        "days_remaining": days_remaining,
        "status": campaign.status,
        "campaign_type": campaign.campaign_type,
        "organization_id": str(organization.id),
        "organization_name": organization.name,
        "organization_logo": None,  # Add if you have this field
        "organization_mission": None,  # Add if you have this field
        "is_public": True
    }