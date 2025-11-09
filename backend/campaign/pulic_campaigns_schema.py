"""
Public Campaigns and Donations Schemas - CORRECTED
Pydantic models for public-facing campaign and donation endpoints
Aligned with actual database schema
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


# ============================================================================
# PUBLIC CAMPAIGN SCHEMAS
# ============================================================================

class PublicCampaignBase(BaseModel):
    """Base schema for public campaign information"""
    name: str = Field(..., description="Campaign name")
    description: Optional[str] = Field(None, description="Campaign description")
    goal_amount: Decimal = Field(..., ge=0, description="Campaign goal amount")
    start_date: Optional[date] = Field(None, description="Campaign start date")
    end_date: Optional[date] = Field(None, description="Campaign end date")
    campaign_type: Optional[str] = Field(None, description="Type of campaign")


class PublicCampaignResponse(PublicCampaignBase):
    """Public campaign response with statistics"""
    id: UUID
    organization_id: UUID
    organization_name: str
    is_public: Optional[bool] = True
    status: Optional[str] = "active"

    # Calculated fields
    amount_raised: Decimal = Field(default=Decimal(0), description="Total amount raised")
    donor_count: int = Field(default=0, description="Number of donors")
    progress_percentage: float = Field(default=0.0, description="Progress towards goal")
    days_remaining: Optional[int] = Field(None, description="Days until campaign ends")

    # Organization info (optional, for display)
    organization_logo: Optional[str] = None
    organization_mission: Optional[str] = None

    # Additional campaign fields
    story: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    slug: Optional[str] = None
    is_featured: Optional[bool] = False
    allow_recurring: Optional[bool] = True
    suggested_amounts: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PublicCampaignListResponse(BaseModel):
    """Response for list of public campaigns"""
    campaigns: List[PublicCampaignResponse]
    total: int
    page: int = 1
    page_size: int = 10


class CampaignPublicToggle(BaseModel):
    """Schema for toggling campaign public status"""
    is_public: bool = Field(..., description="Set campaign as public or private")


# ============================================================================
# DONATION SCHEMAS
# ============================================================================

class DonationCreate(BaseModel):
    """Schema for creating a new donation"""
    campaign_id: UUID = Field(..., description="Campaign to donate to")
    amount: Decimal = Field(..., gt=0, description="Donation amount")

    # Donor information (will create/update party record)
    donor_email: EmailStr = Field(..., description="Donor email address")
    donor_full_name: str = Field(..., min_length=1, max_length=200, description="Donor full name")
    donor_phone: Optional[str] = Field(None, max_length=50, description="Donor phone number")

    # Address information (stored in parties table)
    address: Optional[str] = Field(None, max_length=255, description="Street address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State")
    postal_code: Optional[str] = Field(None, max_length=100, description="Postal code")
    country: Optional[str] = Field(None, max_length=100, description="Country")

    # Payment information
    payment_method: str = Field(default="credit_card", description="Payment method")
    currency: str = Field(default="USD", description="Currency code")

    # Optional fields
    is_anonymous: bool = Field(default=False, description="Make donation anonymous")
    recurring_frequency: Optional[str] = Field(None, description="monthly, quarterly, annually")
    dedication_type: Optional[str] = Field(None, description="in_honor_of, in_memory_of")
    dedication_name: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, description="Donor notes or comments")

    @validator('recurring_frequency')
    def validate_recurring_frequency(cls, v):
        if v and v not in ['monthly', 'quarterly', 'annually', 'annual']:
            raise ValueError('recurring_frequency must be monthly, quarterly, or annually')
        return v


class DonationResponse(BaseModel):
    """Response after creating a donation"""
    id: UUID
    campaign_id: Optional[UUID]
    campaign_name: str
    organization_id: Optional[UUID]
    organization_name: str

    amount: Decimal
    currency: Optional[str] = "USD"
    donor_email: EmailStr
    donor_full_name: str
    is_anonymous: Optional[bool] = False

    payment_status: Optional[str] = "completed"  # pending, completed, failed
    transaction_id: Optional[str] = None

    donation_date: datetime

    # Tax receipt information
    tax_deductible_amount: Optional[Decimal] = None
    receipt_sent: Optional[bool] = False
    thank_you_sent: Optional[bool] = False

    class Config:
        from_attributes = True


class DonationConfirmation(BaseModel):
    """Donation confirmation details"""
    success: bool
    donation_id: UUID
    amount: Decimal
    campaign_name: str
    organization_name: str
    transaction_id: str
    message: str
    confirmation_email: str


# ============================================================================
# DONOR PORTAL SCHEMAS (Simplified without authentication)
# ============================================================================

class DonorLookup(BaseModel):
    """Schema for looking up donor by email"""
    email: EmailStr = Field(..., description="Donor email address")


class DonorProfileResponse(BaseModel):
    """Donor profile information"""
    id: UUID
    email: Optional[str]
    full_name: str
    display_name: Optional[str]
    phone: Optional[str]

    # Donation statistics
    total_donated: Decimal = Field(default=Decimal(0))
    donation_count: int = Field(default=0)
    first_donation_date: Optional[datetime] = None
    last_donation_date: Optional[datetime] = None

    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonorDonationHistory(BaseModel):
    """Donor's donation history"""
    id: UUID
    campaign_id: Optional[UUID]
    campaign_name: str
    organization_name: str
    amount: Decimal
    donation_date: datetime
    payment_status: Optional[str]
    is_recurring: bool = False
    currency: Optional[str] = "USD"

    class Config:
        from_attributes = True


class DonorDashboardResponse(BaseModel):
    """Complete donor dashboard data"""
    profile: DonorProfileResponse
    recent_donations: List[DonorDonationHistory]
    total_impact: Decimal
    organizations_supported: int
    campaigns_supported: int


# ============================================================================
# CAMPAIGN STATISTICS
# ============================================================================

class CampaignStatistics(BaseModel):
    """Detailed campaign statistics for public view"""
    campaign_id: UUID
    campaign_name: str

    # Financial metrics
    goal_amount: Decimal
    amount_raised: Decimal
    progress_percentage: float
    average_donation: Decimal

    # Donor metrics
    total_donors: int
    new_donors: int = 0
    returning_donors: int = 0

    # Time metrics
    days_active: int
    days_remaining: Optional[int] = None

    # Recent activity
    recent_donation_count_24h: int = 0
    recent_donation_amount_24h: Decimal = Decimal(0)

    class Config:
        from_attributes = True


# ============================================================================
# PAYMENT INTEGRATION SCHEMAS
# ============================================================================

class PaymentIntent(BaseModel):
    """Payment intent for processing donation"""
    amount: Decimal
    currency: str = "USD"
    donor_email: EmailStr
    campaign_id: UUID
    return_url: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    """Payment intent response"""
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str


class PaymentConfirmation(BaseModel):
    """Payment confirmation from payment processor"""
    payment_intent_id: str
    status: str  # succeeded, failed, pending
    amount_received: Decimal
    receipt_url: Optional[str] = None