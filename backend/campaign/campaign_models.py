from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from database import Base

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class CampaignType(str, enum.Enum):
    GENERAL = "general"
    PROJECT = "project"
    EMERGENCY = "emergency"
    CAPITAL = "capital"
    ENDOWMENT = "endowment"
    ANNUAL = "annual"

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    # Basic Information
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    story = Column(Text)  # Rich text campaign story

    # Campaign Details
    campaign_type = Column(SQLEnum(CampaignType), default=CampaignType.GENERAL)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT)

    # Financial Goals
    goal_amount = Column(Float, nullable=False)
    raised_amount = Column(Float, default=0.0)

    # Timing
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    # Visibility & Settings
    is_public = Column(Boolean, default=True)  # Show on public landing page
    is_featured = Column(Boolean, default=False)  # Featured campaign
    allow_recurring = Column(Boolean, default=True)
    suggested_amounts = Column(String(255))  # Comma-separated amounts: "25,50,100,250"

    # Media
    image_url = Column(String(500))
    video_url = Column(String(500))

    # SEO & Marketing
    meta_title = Column(String(255))
    meta_description = Column(Text)

    # Statistics
    donor_count = Column(Integer, default=0)
    donation_count = Column(Integer, default=0)
    average_donation = Column(Float, default=0.0)
    view_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="campaigns")
    donations = relationship("Donation", back_populates="campaign")
    campaign_updates = relationship("CampaignUpdate", back_populates="campaign", cascade="all, delete-orphan")


class CampaignUpdate(Base):
    __tablename__ = "campaign_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500))

    is_public = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="campaign_updates")


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class RecurringFrequency(enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventType(str, enum.Enum):
    GALA = "gala"
    AUCTION = "auction"
    CONFERENCE = "conference"
    WORKSHOP = "workshop"
    FUNDRAISER = "fundraiser"
    COMMUNITY = "community"
    SPORTS = "sports"
    NETWORKING = "networking"
    OTHER = "other"

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    # Basic Information
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text)

    # Event Details
    event_type = Column(SQLEnum(EventType), default=EventType.FUNDRAISER)
    status = Column(SQLEnum(EventStatus), default=EventStatus.DRAFT)

    # Date & Time
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    timezone = Column(String(50), default="UTC")

    # Location
    is_virtual = Column(Boolean, default=False)
    location_name = Column(String(255))
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    postal_code = Column(String(20))
    country = Column(String(100))
    virtual_link = Column(String(500))

    # Capacity & Ticketing
    capacity = Column(Integer)
    tickets_sold = Column(Integer, default=0)
    ticket_price = Column(Float, default=0.0)
    has_multiple_tickets = Column(Boolean, default=False)

    # Financial
    revenue_goal = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)

    # Visibility & Settings
    is_public = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    requires_approval = Column(Boolean, default=False)

    # Media
    image_url = Column(String(500))
    video_url = Column(String(500))

    # Registration
    registration_start = Column(DateTime)
    registration_end = Column(DateTime)

    # Statistics
    attendee_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="events")
    ticket_types = relationship("EventTicket", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event")


class EventTicket(Base):
    __tablename__ = "event_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)

    name = Column(String(255), nullable=False)  # e.g., "General Admission", "VIP", "Early Bird"
    description = Column(Text)
    price = Column(Float, nullable=False)
    quantity_available = Column(Integer)
    quantity_sold = Column(Integer, default=0)

    # Settings
    is_active = Column(Boolean, default=True)
    sale_start = Column(DateTime)
    sale_end = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="ticket_types")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("event_tickets.id"), nullable=True)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id"), nullable=True)

    # Attendee Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))

    # Registration Details
    ticket_quantity = Column(Integer, default=1)
    total_amount = Column(Float, nullable=False)

    status = Column(String(50), default="confirmed")  # confirmed, cancelled, attended

    # Additional
    notes = Column(Text)
    checked_in_at = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    donor = relationship("Donor")


# Add to Organization model (add to existing organization model)
# organization.campaigns = relationship("Campaign", back_populates="organization")
# organization.events = relationship("Event", back_populates="organization")
