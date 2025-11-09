"""
Analytics API Routes for Wise Investor Platform - FIXED for skip parameter
Provides GET endpoints for donations, donors, campaigns, programs, and beneficiaries
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, UUID4
from decimal import Decimal
from database import get_db
from models import Programs as Program, Donations as Donation, Beneficiaries as Beneficiary, Donors as Donor, Campaigns as Campaign
from user_management.auth_dependencies import get_current_user
class DecimalEncoder(BaseModel):
    """Base model that properly serializes Decimal to float for JSON"""
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None
        }
router = APIRouter(prefix="/api/v1", tags=["analytics"])


# ============================================================================
# PYDANTIC SCHEMAS - Response Models
# ============================================================================

class DonationResponse(DecimalEncoder):
    """Response schema for donation records"""
    id: UUID4
    organization_id: UUID4
    donor_id: Optional[UUID4]
    campaign_id: Optional[UUID4]
    amount: Decimal
    currency: str = "USD"
    donation_date: datetime
    payment_method: Optional[str]
    payment_status: Optional[str]
    transaction_id: Optional[str]
    is_recurring: bool = False
    recurring_frequency: Optional[str]
    dedication_type: Optional[str]
    dedication_name: Optional[str]
    is_anonymous: bool = False
    tax_deductible_amount: Optional[Decimal]
    receipt_sent: bool = False
    thank_you_sent: bool = False
    designation: Optional[str]
    notes: Optional[str]
    gift_type: Optional[str]
    party_id: Optional[UUID4]
    pledge_id: Optional[UUID4]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DonorResponse(DecimalEncoder):
    """Response schema for donor records"""
    id: UUID4
    organization_id: Optional[UUID4]
    donor_type: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    postal_code: Optional[str]
    preferred_contact_method: Optional[str]
    total_donated: Decimal = Decimal("0")
    lifetime_value: Decimal = Decimal("0")
    last_donation_date: Optional[date]
    first_donation_date: Optional[date]
    donation_count: int = 0
    average_donation: Optional[Decimal]
    largest_donation: Optional[Decimal]
    donor_status: Optional[str]
    acquisition_source: Optional[str]
    wealth_rating: Optional[str]
    engagement_score: Optional[Decimal]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CampaignResponse(DecimalEncoder):
    """Response schema for campaign records"""
    id: UUID4
    organization_id: UUID4
    code: Optional[str]
    name: Optional[str]
    description: Optional[str]
    campaign_type: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    goal_amount: Optional[Decimal]
    raised_amount: Decimal = Decimal("0")
    status: Optional[str]
    is_active: bool = True
    is_public: bool = True
    is_featured: bool = False
    slug: Optional[str]
    story: Optional[str]
    allow_recurring: bool = True
    suggested_amounts: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    meta_title: Optional[str]
    meta_description: Optional[str]
    donor_count: int = 0
    donation_count: int = 0
    average_donation: float = 0.0
    view_count: int = 0
    share_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgramResponse(DecimalEncoder):
    """Response schema for program records"""
    id: UUID4
    organization_id: Optional[UUID4]
    name: str
    description: Optional[str]
    program_type: Optional[str]
    budget: Optional[Decimal]
    actual_spending: Decimal = Decimal("0")
    start_date: Optional[date]
    end_date: Optional[date]
    status: Optional[str]
    target_beneficiaries: Optional[int]
    current_beneficiaries: int = 0
    success_metrics: Optional[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BeneficiaryResponse(BaseModel):
    """Response schema for beneficiary records"""
    id: UUID4
    organization_id: Optional[UUID4]
    first_name: Optional[str]
    last_name: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    household_size: Optional[int]
    income_level: Optional[str]
    needs: Optional[List[str]]
    status: Optional[str]
    enrolled_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# AUTHENTICATION & AUTHORIZATION HELPER
# ============================================================================

def verify_organization_access(
        organization_id: UUID4,
        current_user: "CurrentUser"
) -> UUID4:
    """
    Verify that the current user has access to the specified organization.
    """
    if current_user.is_superadmin:
        return organization_id

    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        )

    return organization_id


# ============================================================================
# DONATION ENDPOINTS
# ============================================================================

@router.get(
    "/donations/",
    response_model=List[DonationResponse],
    summary="Get donations with filters",
    description="Retrieve donations filtered by organization, date range, and other criteria"
)
async def get_donations(
        organization_id: UUID4 = Query(..., description="Organization ID to filter donations"),
        start_date: Optional[str] = Query(None, description="Start date for donation filter (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date for donation filter (YYYY-MM-DD)"),
        donor_id: Optional[UUID4] = Query(None, description="Filter by specific donor"),
        campaign_id: Optional[UUID4] = Query(None, description="Filter by specific campaign"),
        payment_status: Optional[str] = Query(None, description="Filter by payment status"),
        min_amount: Optional[Decimal] = Query(None, description="Minimum donation amount"),
        max_amount: Optional[Decimal] = Query(None, description="Maximum donation amount"),
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get donations with comprehensive filtering options.
    """
    verify_organization_access(organization_id, current_user)
    start_datetime = None
    end_datetime = None
    if start_date:
        try:
            # Parse date string and set time to start of day
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
        # Parse date string and set time to end of day
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )
    try:
        query = db.query(Donation).filter(Donation.organization_id == organization_id)

        if start_datetime:
            query = query.filter(Donation.donation_date >= start_datetime)
        if end_datetime:
            query = query.filter(Donation.donation_date <= end_datetime)
        if donor_id:
            query = query.filter(Donation.donor_id == donor_id)
        if campaign_id:
            query = query.filter(Donation.campaign_id == campaign_id)
        if payment_status:
            query = query.filter(Donation.payment_status == payment_status)
        if min_amount:
            query = query.filter(Donation.amount >= min_amount)
        if max_amount:
            query = query.filter(Donation.amount <= max_amount)

        donations = (
            query.order_by(Donation.donation_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return donations

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving donations: {str(e)}"
        )


# ============================================================================
# DONOR ENDPOINTS
# ============================================================================

@router.get(
    "/donors/",
    response_model=List[DonorResponse],
    summary="Get donors",
    description="Retrieve all donors for a specific organization"
)
async def get_donors(
        organization_id: UUID4 = Query(..., description="Organization ID to filter donors"),
        donor_status: Optional[str] = Query(None, description="Filter by donor status"),
        donor_type: Optional[str] = Query(None, description="Filter by donor type"),
        min_total_donated: Optional[Decimal] = Query(None, description="Minimum total donated amount"),
        search: Optional[str] = Query(None, description="Search by name or email"),
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get all donors for an organization with optional filtering.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(Donor).filter(Donor.organization_id == organization_id)

        if donor_status:
            query = query.filter(Donor.donor_status == donor_status)
        if donor_type:
            query = query.filter(Donor.donor_type == donor_type)
        if min_total_donated:
            query = query.filter(Donor.total_donated >= min_total_donated)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Donor.first_name.ilike(search_pattern)) |
                (Donor.last_name.ilike(search_pattern)) |
                (Donor.email.ilike(search_pattern))
            )

        donors = (
            query.order_by(Donor.total_donated.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return donors

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving donors: {str(e)}"
        )


# ============================================================================
# CAMPAIGN ENDPOINTS
# ============================================================================

@router.get(
    "/campaigns/",
    response_model=List[CampaignResponse],
    summary="Get campaigns",
    description="Retrieve all campaigns for a specific organization"
)
async def get_campaigns(
        organization_id: UUID4 = Query(..., description="Organization ID to filter campaigns"),
        status: Optional[str] = Query(None, description="Filter by campaign status"),
        campaign_type: Optional[str] = Query(None, description="Filter by campaign type"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        is_featured: Optional[bool] = Query(None, description="Filter featured campaigns"),
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get all campaigns for an organization with optional filtering.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(Campaign).filter(Campaign.organization_id == organization_id)

        if status:
            query = query.filter(Campaign.status == status)
        if campaign_type:
            query = query.filter(Campaign.campaign_type == campaign_type)
        if is_active is not None:
            query = query.filter(Campaign.is_active == is_active)
        if is_featured is not None:
            query = query.filter(Campaign.is_featured == is_featured)

        campaigns = (
            query.order_by(Campaign.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return campaigns

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving campaigns: {str(e)}"
        )


# ============================================================================
# PROGRAM ENDPOINTS
# ============================================================================

@router.get(
    "/programs/",
    response_model=List[ProgramResponse],
    summary="Get programs",
    description="Retrieve all programs for a specific organization"
)
async def get_programs(
        organization_id: UUID4 = Query(..., description="Organization ID to filter programs"),
        status: Optional[str] = Query(None, description="Filter by program status"),
        program_type: Optional[str] = Query(None, description="Filter by program type"),
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get all programs for an organization with optional filtering.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(Program).filter(Program.organization_id == organization_id)

        if status:
            query = query.filter(Program.status == status)
        if program_type:
            query = query.filter(Program.program_type == program_type)

        programs = (
            query.order_by(Program.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return programs

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving programs: {str(e)}"
        )


# ============================================================================
# BENEFICIARY ENDPOINTS
# ============================================================================

@router.get(
    "/beneficiaries/",
    response_model=List[BeneficiaryResponse],
    summary="Get beneficiaries",
    description="Retrieve all beneficiaries for a specific organization"
)
async def get_beneficiaries(
        organization_id: UUID4 = Query(..., description="Organization ID to filter beneficiaries"),
        status: Optional[str] = Query(None, description="Filter by beneficiary status"),
        gender: Optional[str] = Query(None, description="Filter by gender"),
        income_level: Optional[str] = Query(None, description="Filter by income level"),
        city: Optional[str] = Query(None, description="Filter by city"),
        state: Optional[str] = Query(None, description="Filter by state"),
        search: Optional[str] = Query(None, description="Search by name or email"),
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of records to return"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get all beneficiaries for an organization with optional filtering.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(Beneficiary).filter(Beneficiary.organization_id == organization_id)

        if status:
            query = query.filter(Beneficiary.status == status)
        if gender:
            query = query.filter(Beneficiary.gender == gender)
        if income_level:
            query = query.filter(Beneficiary.income_level == income_level)
        if city:
            query = query.filter(Beneficiary.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Beneficiary.state.ilike(f"%{state}%"))
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Beneficiary.first_name.ilike(search_pattern)) |
                (Beneficiary.last_name.ilike(search_pattern)) |
                (Beneficiary.email.ilike(search_pattern))
            )

        beneficiaries = (
            query.order_by(Beneficiary.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return beneficiaries

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving beneficiaries: {str(e)}"
        )


# ============================================================================
# SUMMARY/AGGREGATE ENDPOINTS (BONUS)
# ============================================================================

@router.get(
    "/donations/summary",
    summary="Get donation summary statistics",
    description="Get aggregate statistics for donations"
)
async def get_donation_summary(
        organization_id: UUID4 = Query(..., description="Organization ID"),
        start_date: Optional[datetime] = Query(None, description="Start date for filter"),
        end_date: Optional[datetime] = Query(None, description="End date for filter"),
        db: Session = Depends(get_db),
        current_user: "CurrentUser" = Depends(get_current_user)
):
    """
    Get summary statistics for donations including total amount, count, and averages.
    """
    verify_organization_access(organization_id, current_user)

    try:
        query = db.query(
            func.count(Donation.id).label("total_count"),
            func.sum(Donation.amount).label("total_amount"),
            func.avg(Donation.amount).label("average_amount"),
            func.max(Donation.amount).label("max_amount"),
            func.min(Donation.amount).label("min_amount")
        ).filter(Donation.organization_id == organization_id)

        if start_date:
            query = query.filter(Donation.donation_date >= start_date)
        if end_date:
            query = query.filter(Donation.donation_date <= end_date)

        result = query.first()

        return {
            "organization_id": str(organization_id),
            "total_donations": result.total_count or 0,
            "total_amount": float(result.total_amount or 0),
            "average_donation": float(result.average_amount or 0),
            "largest_donation": float(result.max_amount or 0),
            "smallest_donation": float(result.min_amount or 0),
            "date_range": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating donation summary: {str(e)}"
        )