"""
Event Schemas - Pydantic Models
Wise Investor Nonprofit Management Platform
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid
from enum import Enum


class EventStatus(str, Enum):
    published = "published"
    completed = "completed"


class EventType(str, Enum):
    fundraising_gala = "Fundraising Gala"
    capacity_building = "Capacity Building"
    community_service = "Community Service"
    charity_run_walk = "Charity Run/Walk"
    youth_program = "Youth Program"
    training_program = "Training Program"
    community_outreach = "Community Outreach"
    donor_appreciation = "Donor Appreciation"
    community_event = "Community Event"
    virtual_fundraiser = "Virtual Fundraiser"
    volunteer_event = "Volunteer Event"
    volunteer_training = "Volunteer Training"
    fundraising_auction = "Fundraising Auction"
    donor_engagement = "Donor Engagement"
    donor_stewardship = "Donor Stewardship"
    board_meeting = "Board Meeting"
    educational_seminar = "Educational Seminar"
    staff_training = "Staff Training"
    workshop = "Workshop"


# ==================== EVENT SCHEMAS ====================

class EventBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=255)
    venue_address: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    registration_fee: Optional[Decimal] = Field(None, ge=0)
    status: EventStatus = EventStatus.published
    is_public: bool = True
    registration_deadline: Optional[datetime] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=255)
    venue_address: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    registration_fee: Optional[Decimal] = Field(None, ge=0)
    status: Optional[EventStatus] = None
    is_public: Optional[bool] = None
    registration_deadline: Optional[datetime] = None


class EventResponse(EventBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    registered_count: int
    created_at: datetime
    updated_at: datetime

    # Computed fields
    is_registration_open: bool = False
    days_until_event: Optional[int] = None
    capacity_remaining: Optional[int] = None
    occupancy_percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ==================== EVENT PERFORMANCE SCHEMAS ====================

class EventPerformance(BaseModel):
    event_id: uuid.UUID
    event_name: str
    event_type: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    status: str

    # Registration metrics
    capacity: Optional[int]
    registered_count: int
    capacity_remaining: Optional[int]
    occupancy_percentage: float

    # Financial metrics
    registration_fee: Optional[Decimal]
    total_revenue: Decimal

    # Ticket breakdown
    ticket_types_count: int
    total_tickets_available: Optional[int]
    total_tickets_sold: int

    # Time metrics
    days_until_event: Optional[int]
    is_past_event: bool
    is_registration_open: bool


# ==================== EVENT REGISTRATION SCHEMAS ====================

class EventRegistrationBase(BaseModel):
    participant_name: str = Field(..., min_length=1, max_length=255)
    participant_email: str = Field(..., max_length=255)
    participant_phone: Optional[str] = Field(None, max_length=100)
    number_of_tickets: int = Field(1, ge=1)
    special_requirements: Optional[str] = None


class EventRegistrationCreate(EventRegistrationBase):
    pass


class EventRegistrationUpdate(BaseModel):
    registration_status: Optional[str] = None
    payment_status: Optional[str] = None
    checked_in: Optional[bool] = None
    special_requirements: Optional[str] = None


class EventRegistrationResponse(EventRegistrationBase):
    id: uuid.UUID
    event_id: uuid.UUID
    total_amount: Optional[Decimal]
    payment_status: Optional[str]
    registration_status: Optional[str]
    checked_in: bool
    checked_in_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== EVENT TICKET SCHEMAS ====================

class EventTicketBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    quantity_available: Optional[int] = Field(None, ge=0)
    is_active: bool = True
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None


class EventTicketCreate(EventTicketBase):
    pass


class EventTicketUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    quantity_available: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    sale_start: Optional[datetime] = None
    sale_end: Optional[datetime] = None


class EventTicketResponse(EventTicketBase):
    id: uuid.UUID
    event_id: uuid.UUID
    quantity_sold: Optional[int]

    # Computed fields
    tickets_remaining: Optional[int] = None
    is_sold_out: bool = False
    is_sale_active: bool = False

    model_config = ConfigDict(from_attributes=True)


# ==================== PUBLIC EVENT SCHEMAS ====================

class PublicEventSummary(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    event_type: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    location: Optional[str]
    venue_address: Optional[str]
    capacity: Optional[int]
    registered_count: int
    registration_fee: Optional[Decimal]
    is_registration_open: bool
    days_until_event: Optional[int]
    capacity_remaining: Optional[int]
    occupancy_percentage: float
    organization_name: str

    model_config = ConfigDict(from_attributes=True)