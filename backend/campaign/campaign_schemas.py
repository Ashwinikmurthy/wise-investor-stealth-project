from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

# Enums
class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class CampaignType(str, Enum):
    GENERAL = "general"
    PROJECT = "project"
    EMERGENCY = "emergency"
    CAPITAL = "capital"
    ENDOWMENT = "endowment"
    ANNUAL = "annual"
    MONTHLY_GIVING = "monthly_giving"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventType(str, Enum):
    GALA = "gala"
    AUCTION = "auction"
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    FUNDRAISER = "fundraiser"
    COMMUNITY = "community"
    SPORTS = "sports"
    NETWORKING = "networking"
    OTHER = "other"

# ==================== CAMPAIGN SCHEMAS ====================

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    story: Optional[str] = None
    campaign_type: CampaignType = CampaignType.GENERAL
    status: CampaignStatus = CampaignStatus.DRAFT
    goal_amount: float = Field(..., gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: bool = True
    is_featured: bool = False
    allow_recurring: bool = True
    suggested_amounts: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    story: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    status: Optional[CampaignStatus] = None
    goal_amount: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    allow_recurring: Optional[bool] = None
    suggested_amounts: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: UUID
    organization_id: UUID
    slug: str
    raised_amount: float
    donor_count: int
    donation_count: int
    average_donation: float
    view_count: int
    share_count: int
    created_at: datetime
    updated_at: datetime

    # Computed fields
    progress_percentage: Optional[float] = None
    days_remaining: Optional[int] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True

class CampaignPerformance(BaseModel):
    campaign_id: UUID
    campaign_name: str
    goal_amount: float
    raised_amount: float
    progress_percentage: float
    donor_count: int
    donation_count: int
    average_donation: float
    days_active: int
    days_remaining: Optional[int]
    status: CampaignStatus
    daily_average: float
    projected_total: Optional[float]
    is_on_track: bool

class CampaignUpdateBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    image_url: Optional[str] = None
    is_public: bool = True

class CampaignUpdateCreate(CampaignUpdateBase):
    pass

class CampaignUpdateResponse(CampaignUpdateBase):
    id: UUID
    campaign_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== EVENT SCHEMAS ====================

class EventBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: EventType = EventType.FUNDRAISER
    status: EventStatus = EventStatus.DRAFT
    start_datetime: datetime
    end_datetime: datetime
    timezone: str = "UTC"
    is_virtual: bool = False
    location_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    virtual_link: Optional[str] = None
    capacity: Optional[int] = None
    ticket_price: float = 0.0
    has_multiple_tickets: bool = False
    revenue_goal: float = 0.0
    is_public: bool = True
    is_featured: bool = False
    requires_approval: bool = False
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    timezone: Optional[str] = None
    is_virtual: Optional[bool] = None
    location_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    virtual_link: Optional[str] = None
    capacity: Optional[int] = None
    ticket_price: Optional[float] = None
    has_multiple_tickets: Optional[bool] = None
    revenue_goal: Optional[float] = None
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    requires_approval: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None

class EventResponse(EventBase):
    id: UUID
    organization_id: UUID
    slug: str
    tickets_sold: int
    total_revenue: float
    attendee_count: int
    view_count: int
    share_count: int
    created_at: datetime
    updated_at: datetime

    # Computed fields
    is_upcoming: Optional[bool] = None
    is_ongoing: Optional[bool] = None
    is_past: Optional[bool] = None
    days_until_event: Optional[int] = None
    capacity_percentage: Optional[float] = None

    class Config:
        from_attributes = True

class EventPerformance(BaseModel):
    event_id: UUID
    event_name: str
    event_type: EventType
    start_datetime: datetime
    status: EventStatus
    capacity: Optional[int]
    tickets_sold: int
    capacity_percentage: Optional[float]
    revenue_goal: float
    total_revenue: float
    revenue_percentage: float
    attendee_count: int
    average_ticket_price: float
    days_until_event: Optional[int]
    registration_status: str

class EventTicketBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    quantity_available: Optional[int] = None
    is_active: bool = True
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None

class EventTicketCreate(EventTicketBase):
    pass

class EventTicketResponse(EventTicketBase):
    id: UUID
    event_id: UUID
    quantity_sold: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventRegistrationBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None
    ticket_quantity: int = Field(default=1, ge=1)
    notes: Optional[str] = None

class EventRegistrationCreate(EventRegistrationBase):
    ticket_id: Optional[UUID] = None

class EventRegistrationResponse(EventRegistrationBase):
    id: UUID
    event_id: UUID
    ticket_id: Optional[UUID]
    donor_id: Optional[UUID]
    total_amount: float
    status: str
    checked_in_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== PUBLIC SCHEMAS ====================

class PublicCampaignSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    campaign_type: CampaignType
    goal_amount: float
    raised_amount: float
    progress_percentage: float
    donor_count: int
    image_url: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    days_remaining: Optional[int]
    organization_name: str
    is_featured: bool

    class Config:
        from_attributes = True

class PublicEventSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    event_type: EventType
    start_datetime: datetime
    end_datetime: datetime
    is_virtual: bool
    location_name: Optional[str]
    city: Optional[str]
    state: Optional[str]
    image_url: Optional[str]
    ticket_price: float
    capacity: Optional[int]
    tickets_sold: int
    organization_name: str
    is_featured: bool
    days_until_event: Optional[int]

    class Config:
        from_attributes = True
