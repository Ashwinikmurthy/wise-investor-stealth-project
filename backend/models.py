"""
SQLAlchemy Models - Fixed Version
Wise Investor Nonprofit Management Platform
Fixed: 2025-11-03 - All relationship issues resolved
"""
import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, BigInteger, Float, Boolean, UniqueConstraint, CheckConstraint, \
    func
from sqlalchemy import DateTime, Date, Time, ForeignKey, Numeric, JSON, ARRAY, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB,ENUM
from sqlalchemy.orm import relationship, declarative_base

# Create the declarative base - all models use this shared base
Base = declarative_base()

class MovesStageEnum(str, enum.Enum):
    identification = "identification"
    qualification = "qualification"
    cultivation = "cultivation"
    solicitation = "solicitation"
    stewardship = "stewardship"


class DonorLevelEnum(str, enum.Enum):
    mega_donor = "mega_donor"        # $100K+
    major_donor = "major_donor"      # $10K-99,999.99
    mid_level = "mid_level"          # $1K-9,999.99
    upper_donor = "upper_donor"      # $100-999.99
    lower_donor = "lower_donor"      # <$100


class PortfolioRoleEnum(str, enum.Enum):
    ceo = "ceo"
    cdo = "cdo"
    lead_officer = "lead_officer"
    portfolio_manager = "portfolio_manager"
    principal_gifts = "principal_gifts"
    major_gifts = "major_gifts"
    planned_giving = "planned_giving"
    corporate_relations  = "corporate_relations"


class PriorityLevelEnum(str, enum.Enum):
    priority_1 = "priority_1"  # $0 this yr with any gifts last year
    priority_2 = "priority_2"  # Last year's gifts > this year's gifts
    priority_3 = "priority_3"  # No gifts since 2023
    priority_4 = "priority_4"  # No gifts since 2022
    priority_5 = "priority_5"  # This year's gifts >= last year's gifts


class ExclusionTagEnum(str, enum.Enum):
    estate_gift = "estate_gift"
    bequest = "bequest"
    foundation_grant = "foundation_grant"
    planned_gift = "planned_gift"


class MeetingTypeEnum(str, enum.Enum):
    SUBSTANTIVE = "substantive"
    INFORMATIONAL = "informational"
    SOCIAL = "social"
    CULTIVATION = "cultivation"
    SOLICITATION = "solicitation"
    STEWARDSHIP = "stewardship"


class ProposalStatusEnum(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    under_review = "under_review"
    accepted = "accepted"
    declined = "declined"
    withdrawn = "withdrawn"


class Organizations(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    ein = Column(String(100))
    mission = Column(Text)
    founded_date = Column(Date)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(100))
    phone = Column(String(100))
    email = Column(String(255))
    website = Column(String(255))
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    fiscal_year_end = Column(String(5))
    annual_budget = Column(Numeric)
    slug = Column(String(255))

    # Relationships
    parties = relationship("Parties", back_populates="organization")
    addresses = relationship("Addresses", back_populates="organization")
    campaigns = relationship("Campaigns", back_populates="organization")
    appeals = relationship("Appeals", back_populates="organization")
    beneficiaries = relationship("Beneficiaries", back_populates="organization")
    consents = relationship("Consents", back_populates="organization")
    contact_points = relationship("ContactPoints", back_populates="organization")
    donation_campaigns = relationship("DonationCampaigns", back_populates="organization")
    donors = relationship("Donors", back_populates="organization")
    programs = relationship("Programs", back_populates="organization")
    funds = relationship("Funds", back_populates="organization")
    pledges = relationship("Pledges", back_populates="organization")
    donations = relationship("Donations", back_populates="organization")
    donation_lines = relationship("DonationLines", back_populates="organization")
    major_gift_officers = relationship("MajorGiftOfficer", back_populates="organization")
    donor_meetings = relationship("DonorMeetings", back_populates="organization")
    donor_scores = relationship("DonorScores", back_populates="organization")
    email_campaigns = relationship("EmailCampaigns", back_populates="organization")
    events = relationship("Events", back_populates="organization")
    expense_categories = relationship("ExpenseCategories", back_populates="organization")
    expenses = relationship("Expenses", back_populates="organization")
    gift_goals = relationship("GiftGoals", back_populates="organization")
    impact_metrics = relationship("ImpactMetrics", back_populates="organization")
    payments = relationship("Payments", back_populates="organization")
    matching_claims = relationship("MatchingClaims", back_populates="organization")
    officer_annual_targets = relationship("OfficerAnnualTargets", back_populates="organization")
    outcome_metrics = relationship("OutcomeMetrics", back_populates="organization")
    outcome_records = relationship("OutcomeRecords", back_populates="organization")
    packages = relationship("Packages", back_populates="organization")
    payment_methods = relationship("PaymentMethods", back_populates="organization")
    pledge_installments = relationship("PledgeInstallments", back_populates="organization")
    users = relationship("Users", back_populates="organization")
    projects = relationship("Projects", back_populates="organization")
    recurring_gifts = relationship("RecurringGifts", back_populates="organization")
    reports = relationship("Reports", back_populates="organization")
    sdg_alignment = relationship("SdgAlignment", back_populates="organization")
    service_events = relationship("ServiceEvents", back_populates="organization")
    soft_credits = relationship("SoftCredits", back_populates="organization")
    solicitation_proposals = relationship("SolicitationProposals", back_populates="organization")
    stories = relationship("Stories", back_populates="organization")
    tasks = relationship("Tasks", back_populates="organization")
    user_roles = relationship("UserRoles", back_populates="organization")
    volunteer_activities = relationship("VolunteerActivities", back_populates="organization")
    volunteer_events = relationship("VolunteerEvents", back_populates="organization")
    volunteer_skills = relationship("VolunteerSkills", back_populates="organization")
    moves_stages = relationship("MovesManagementStages", back_populates="organization")
    donor_priorities = relationship("DonorPriorityCache", back_populates="organization")
    donor_exclusions = relationship("DonorExclusionTags", back_populates="organization")
    portfolio_assignments = relationship("DonorPortfolioAssignment", back_populates="organization")
    registration_requests = relationship("UserRegistrationRequest", back_populates="organization")
    donor_giving_segments = relationship("DonorGivingSegments", back_populates="organization", cascade="all, delete-orphan")


class UserRegistrationRequest(Base):
    __tablename__ = "user_registration_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    job_title = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(String(20), default='pending', nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organizations", back_populates="registration_requests")
    reviewer = relationship("Users", foreign_keys=[reviewed_by])

class Parties(Base):
    __tablename__ = "parties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(200), nullable=False)
    display_name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(100))
    country = Column(String(100))
    donor_type = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="parties")
    addresses = relationship("Addresses", back_populates="party")
    consents = relationship("Consents", back_populates="party")
    contact_points = relationship("ContactPoints", back_populates="party")
    donors = relationship("Donors", back_populates="party")
    pledges = relationship("Pledges", back_populates="party")
    donations = relationship("Donations", back_populates="party")
    matching_claims = relationship("MatchingClaims", back_populates="matcher_party")
    party_roles = relationship("PartyRoles", back_populates="party")
    payment_methods = relationship("PaymentMethods", back_populates="party")
    recurring_gifts = relationship("RecurringGifts", back_populates="party")
    soft_credits = relationship("SoftCredits", back_populates="influencer_party")

class Addresses(Base):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    addr_lines = Column(Text)
    city_region = Column(String(200))
    postal_country = Column(String(100))
    is_primary = Column(Boolean)
    valid_from_to = Column(String(100))

    # Relationships
    organization = relationship("Organizations", back_populates="addresses")
    party = relationship("Parties", back_populates="addresses")


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"
    archived = "archived"


class CampaignType(str, enum.Enum):
    general = "general"
    project = "project"
    emergency = "emergency"
    capital = "capital"
    endowment = "endowment"
    annual = "annual"
    monthly_giving = "monthly_giving"


class Campaigns(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)

    # Basic Information
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    story = Column(Text)  # Rich text campaign story

    # Campaign Details
    campaign_type = Column(
             SQLEnum(
                CampaignType,
                name="campaigntype",          # tell SQLAlchemy to bind to your existing lowercase enum
                native_enum=True,             # use Postgres ENUM type directly
                create_constraint=False,      # prevent redefinition
                validate_strings=True
             ),
           default=CampaignType.general,     # safe lowercase default
             nullable=False
          )
    status = Column(
        SQLEnum(
            CampaignStatus,
            name="campaignstatus",
            native_enum=True,
            create_constraint=False,
            validate_strings=True
             ),
                default=CampaignStatus.draft,
                nullable=False
            )

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
    code = Column(String, unique=True, nullable=True)
    
    # Relationships
    organization = relationship("Organizations", back_populates="campaigns")
    campaign_updates = relationship("CampaignUpdates", back_populates="campaign", cascade="all, delete-orphan")
    appeals = relationship("Appeals", back_populates="campaign")
    gift_goals = relationship("GiftGoals", back_populates="campaign")
    proposals = relationship("SolicitationProposals", back_populates="campaign")


class Appeals(Base):
    __tablename__ = "appeals"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    code = Column(String(100), nullable=False)
    channel = Column(String(100))
    start_end = Column(String(100))

    # Relationships
    organization = relationship("Organizations", back_populates="appeals")
    campaign = relationship("Campaigns", back_populates="appeals")
    packages = relationship("Packages", back_populates="appeal")

class AuditLogs(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True))
    action = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(UUID(as_uuid=True))
    changes = Column(JSONB, default=dict)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Beneficiaries(Base):
    __tablename__ = "beneficiaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(Date)
    gender = Column(String(100))
    email = Column(String(255))
    phone = Column(String(100))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    household_size = Column(Integer)
    income_level = Column(String(50))
    needs = Column(ARRAY(String))
    status = Column(String(100))
    enrolled_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="beneficiaries")
    program_enrollments = relationship("ProgramEnrollments", back_populates="beneficiary")
    service_beneficiaries = relationship("ServiceBeneficiaries", back_populates="beneficiary")

class CampaignUpdates(Base):
    __tablename__ = "campaign_updates"

    id = Column(UUID(as_uuid=True), primary_key=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500))
    is_public = Column(Boolean)
    created_at = Column(DateTime)

    # Relationships
    campaign = relationship("Campaigns", back_populates="campaign_updates")

class Consents(Base):
    __tablename__ = "consents"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    channel = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    opt_in_basis = Column(String(100))
    captured_at_by = Column(String(200))
    source = Column(String(200))

    # Relationships
    organization = relationship("Organizations", back_populates="consents")
    party = relationship("Parties", back_populates="consents")

class ContactPoints(Base):
    __tablename__ = "contact_points"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    channel = Column(String(50))
    value = Column(String(255))
    is_primary = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True))

    # Relationships
    organization = relationship("Organizations", back_populates="contact_points")
    party = relationship("Parties", back_populates="contact_points")

class DonationCampaigns(Base):
    __tablename__ = "donation_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    goal_amount = Column(Numeric)
    current_amount = Column(Numeric, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(100))
    campaign_type = Column(String(50))
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="donation_campaigns")

class Donors(Base):
    __tablename__ = "donors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    donor_type = Column(String(50))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    phone = Column(String(100))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(100))
    preferred_contact_method = Column(String(50))
    total_donated = Column(Numeric, default=0)
    lifetime_value = Column(Numeric, default=0)
    last_donation_date = Column(Date)
    first_donation_date = Column(Date)
    donation_count = Column(Integer, default=0)
    average_donation = Column(Numeric)
    largest_donation = Column(Numeric)
    donor_status = Column(String(50))
    acquisition_source = Column(String(100))
    wealth_rating = Column(String(50))
    engagement_score = Column(Numeric)
    communication_preferences = Column(JSONB, default=dict)
    tags = Column(ARRAY(String))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"))
    donor_level = Column(String(50))
    giving_capacity = Column(Numeric)
    loyalty_segment = Column(String(50))
    planned_giving = Column(Boolean, default=False)

    # Relationships
    organization = relationship("Organizations", back_populates="donors")
    party = relationship("Parties", back_populates="donors")
    moves_stage = relationship("MovesManagementStages", back_populates="donor", uselist=False)
    donations = relationship("Donations", back_populates="donor")
    priority_cache = relationship("DonorPriorityCache", back_populates="donor", uselist=False)
    exclusion_tags = relationship("DonorExclusionTags", back_populates="donor")
    solicitation_proposals = relationship("SolicitationProposals", back_populates="donor", foreign_keys="SolicitationProposals.donor_id")
    donor_meetings = relationship("DonorMeetings", back_populates="donor", foreign_keys="DonorMeetings.donor_id")
    donor_scores = relationship("DonorScores", back_populates="donor")
    email_campaign_recipients = relationship("EmailCampaignRecipients", back_populates="donor")
    gift_goals = relationship("GiftGoals", back_populates="donor", foreign_keys="GiftGoals.donor_id")
    portfolio_assignments = relationship("DonorPortfolioAssignment", back_populates="donor")

class Programs(Base):
    __tablename__ = "programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    program_type = Column(String(50))
    budget = Column(Numeric)
    actual_spending = Column(Numeric, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(100))
    target_beneficiaries = Column(Integer)
    current_beneficiaries = Column(Integer, default=0)
    success_metrics = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="programs")
    funds = relationship("Funds", back_populates="program")
    donation_lines = relationship("DonationLines", back_populates="program")
    expenses = relationship("Expenses", back_populates="program")
    impact_metrics = relationship("ImpactMetrics", back_populates="program")
    outcome_metrics = relationship("OutcomeMetrics", back_populates="program")
    program_enrollments = relationship("ProgramEnrollments", back_populates="program")
    projects = relationship("Projects", back_populates="program")
    sdg_alignment = relationship("SdgAlignment", back_populates="program")
    service_events = relationship("ServiceEvents", back_populates="program")
    stories = relationship("Stories", back_populates="program")
    gift_goals = relationship("GiftGoals", back_populates="program")
    proposals = relationship("SolicitationProposals", back_populates="program")


class MovesManagementStages(Base):
    """Tracks donor progression through moves management stages"""
    __tablename__ = "moves_management_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Stage information
    current_stage = Column(ENUM(MovesStageEnum, name="moves_stage_enum"), nullable=False)
    previous_stage = Column(ENUM(MovesStageEnum, name="moves_stage_enum"), nullable=True)

    # Dates
    stage_entered_date = Column(Date, nullable=False, server_default=func.current_date())
    expected_next_stage_date = Column(Date)
    last_stage_change_date = Column(Date)

    # Engagement metrics
    total_interactions = Column(Integer, default=0)
    last_interaction_date = Column(Date)

    # Notes
    stage_notes = Column(Text)
    next_steps = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="moves_stages")
    donor = relationship("Donors", back_populates="moves_stage")
    officer = relationship("MajorGiftOfficer")

    __table_args__ = (
        UniqueConstraint('organization_id', 'donor_id', name='unique_donor_moves_stage'),
    )


class DonorPriorityCache(Base):
    """Cached priority classifications for reporting performance"""
    __tablename__ = "donor_priority_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)

    # Current classification
    current_donor_level = Column(ENUM(DonorLevelEnum, name="donor_level_enum"))
    priority_level = Column(ENUM(PriorityLevelEnum, name="priority_level_enum"))

    # Giving history (12-month rolling)
    current_year_total = Column(Numeric(15, 2), default=0)
    last_year_total = Column(Numeric(15, 2), default=0)
    two_years_ago_total = Column(Numeric(15, 2), default=0)
    year_2023_total = Column(Numeric(15, 2), default=0)
    year_2022_total = Column(Numeric(15, 2), default=0)

    # Largest single gift
    largest_gift_amount = Column(Numeric(15, 2), default=0)
    largest_gift_date = Column(Date)

    # Opportunity calculation
    opportunity_amount = Column(Numeric(15, 2), default=0)
    opportunity_basis = Column(Text)

    # YoY Metrics
    yoy_dollar_change = Column(Numeric(15, 2), default=0)
    yoy_percentage_change = Column(Numeric(10, 2))

    # Donor counts
    gift_count_current_year = Column(Integer, default=0)
    gift_count_last_year = Column(Integer, default=0)
    gift_count_two_years_ago = Column(Integer, default=0)

    # Last gift date
    last_gift_date = Column(Date)
    days_since_last_gift = Column(Integer)

    # Portfolio assignment
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="SET NULL"))
    portfolio_role = Column(ENUM(PortfolioRoleEnum, name="portfolio_role_enum"))

    # Exclusion flags
    has_exclusion_tag = Column(Boolean, default=False)
    exclusion_tags = Column(ARRAY(Text))

    # Cache metadata
    calculation_date = Column(Date, nullable=False, server_default=func.current_date())
    is_current = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="donor_priorities")
    donor = relationship("Donors", back_populates="priority_cache")
    assigned_officer = relationship("MajorGiftOfficer")

    __table_args__ = (
        UniqueConstraint('organization_id', 'donor_id', 'is_current', name='unique_current_donor_priority'),
    )


class DonorExclusionTags(Base):
    """Tags to exclude donor types from analyses"""
    __tablename__ = "donor_exclusion_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)

    # Tag details
    exclusion_tag = Column(ENUM(ExclusionTagEnum, name="exclusion_tag_enum"), nullable=False)

    # Dates
    tag_applied_date = Column(Date, nullable=False, server_default=func.current_date())
    tag_removed_date = Column(Date)
    is_active = Column(Boolean, default=True)

    # Notes
    notes = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="donor_exclusions")
    donor = relationship("Donors", back_populates="exclusion_tags")

    __table_args__ = (
        UniqueConstraint('organization_id', 'donor_id', 'exclusion_tag', 'is_active', name='unique_active_exclusion_tag'),
    )


class Funds(Base):
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    restriction = Column(String(100))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    fund_code = Column(String(50))
    fund_type = Column(String(50))
    target_amount = Column(Numeric)

    # Relationships
    organization = relationship("Organizations", back_populates="funds")
    program = relationship("Programs", back_populates="funds")
    pledges = relationship("Pledges", back_populates="goal_fund")

class Pledges(Base):
    __tablename__ = "pledges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    pledge_date = Column(Date, nullable=False)
    total_amount = Column(Numeric, nullable=False)
    frequency = Column(String(50))
    schedule = Column(String(50))
    start_end = Column(String(100))
    goal_fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="SET NULL"))
    status = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="pledges")
    party = relationship("Parties", back_populates="pledges")
    goal_fund = relationship("Funds", back_populates="pledges")
    donations = relationship("Donations", back_populates="pledge")
    pledge_installments = relationship("PledgeInstallments", back_populates="pledge")

class Donations(Base):
    __tablename__ = "donations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="SET NULL"))
    campaign_id = Column(UUID(as_uuid=True))
    amount = Column(Numeric, nullable=False)
    currency = Column(String(3))
    donation_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    payment_method = Column(String(50))
    payment_status = Column(String(100))
    transaction_id = Column(String(255))
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String(100))
    dedication_type = Column(String(50))
    dedication_name = Column(String(255))
    is_anonymous = Column(Boolean, default=False)
    tax_deductible_amount = Column(Numeric)
    receipt_sent = Column(Boolean, default=False)
    thank_you_sent = Column(Boolean, default=False)
    designation = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    gift_type = Column(String(50))
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="SET NULL"))
    pledge_id = Column(UUID(as_uuid=True), ForeignKey("pledges.id", ondelete="SET NULL"))

    # Relationships
    organization = relationship("Organizations", back_populates="donations")
    donor = relationship("Donors", back_populates="donations")
    party = relationship("Parties", back_populates="donations")
    pledge = relationship("Pledges", back_populates="donations")
    donation_lines = relationship("DonationLines", back_populates="donation")
    payments = relationship("Payments", back_populates="donation")
    matching_claims = relationship("MatchingClaims", back_populates="donation")
    soft_credits = relationship("SoftCredits", back_populates="donation")

class DonationLines(Base):
    __tablename__ = "donation_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    amount = Column(Numeric, nullable=False)

    # Relationships
    organization = relationship("Organizations", back_populates="donation_lines")
    donation = relationship("Donations", back_populates="donation_lines")
    program = relationship("Programs", back_populates="donation_lines")




class MajorGiftOfficer(Base):
    """Frontline fundraisers and relationship managers"""
    __tablename__ = "major_gift_officers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Officer details
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100))

    # Portfolio assignment
    portfolio_role = Column(ENUM(PortfolioRoleEnum, name="portfolio_role_enum"), nullable=False)

    # Status
    is_active = Column(Boolean, default=True)
    hire_date = Column(Date)
    departure_date = Column(Date)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="major_gift_officers")
    user = relationship("Users", back_populates="major_gift_officer")
    annual_targets = relationship("OfficerAnnualTargets", back_populates="officer", cascade="all, delete-orphan")
    gift_goals = relationship("GiftGoals", back_populates="officer", cascade="all, delete-orphan")
    proposals = relationship("SolicitationProposals", back_populates="officer", cascade="all, delete-orphan")
    meetings = relationship("DonorMeetings", back_populates="officer", cascade="all, delete-orphan")
    portfolio_assignments = relationship("DonorPortfolioAssignment", back_populates="officer", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('organization_id', 'email', name='unique_officer_email_org'),
    )

class DonorMeetings(Base):
    """All meetings with major donors"""
    __tablename__ = "donor_meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Meeting details
    meeting_title = Column(String(255), nullable=False)
    meeting_type = Column(ENUM(MeetingTypeEnum, name="meeting_type_enum"), nullable=False, default=MeetingTypeEnum.SUBSTANTIVE)

    # Scheduling
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time)
    duration_minutes = Column(Integer)

    # Location
    location = Column(String(255))
    is_virtual = Column(Boolean, default=False)
    meeting_link = Column(Text)

    # Status
    status = Column(String(50), default='scheduled')
    is_completed = Column(Boolean, default=False)
    actual_date = Column(Date)

    # Meeting details
    attendees = Column(ARRAY(Text))
    agenda = Column(Text)
    meeting_notes = Column(Text)
    follow_up_actions = Column(Text)

    # Impact
    moves_stage_advanced = Column(Boolean, default=False)
    gift_discussed = Column(Boolean, default=False)
    proposal_presented = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="donor_meetings")
    donor = relationship("Donors", back_populates="donor_meetings", foreign_keys=[donor_id])
    officer = relationship("MajorGiftOfficer", back_populates="meetings")


class DonorPortfolioAssignment(Base):
    """Assignment of major donors to officer portfolios"""
    __tablename__ = "donor_portfolio_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Assignment details
    assignment_date = Column(Date, nullable=False, server_default=func.current_date())
    is_primary = Column(Boolean, default=True)

    # Status
    is_active = Column(Boolean, default=True)
    deactivation_date = Column(Date)
    deactivation_reason = Column(Text)

    # Notes
    assignment_notes = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="portfolio_assignments")
    donor = relationship("Donors", back_populates="portfolio_assignments")
    officer = relationship("MajorGiftOfficer", back_populates="portfolio_assignments")



class DonorScores(Base):
    __tablename__ = "donor_scores"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"))
    rfm_score = Column(Float)
    engagement_score = Column(Float)
    loyalty_score = Column(Float)
    influence_score = Column(Float)
    churn_risk_score = Column(Float)
    donor_segment = Column(String(50))
    lifecycle_stage = Column(String(50))
    score_components = Column(JSONB)
    calculated_at = Column(DateTime)

    # Relationships
    organization = relationship("Organizations", back_populates="donor_scores")
    donor = relationship("Donors", back_populates="donor_scores")

class DonorsBackup(Base):
    __tablename__ = "donors_backup"

    # Note: This table has no primary key in database
    # Setting 'id' column as primary key for ORM mapping

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True))
    donor_type = Column(String(100))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    phone = Column(String(100))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(100))
    preferred_contact_method = Column(String(100))
    total_donated = Column(Numeric)
    lifetime_value = Column(Numeric)
    last_donation_date = Column(Date)
    first_donation_date = Column(Date)
    donation_count = Column(Integer)
    average_donation = Column(Numeric)
    largest_donation = Column(Numeric)
    donor_status = Column(String(100))
    acquisition_source = Column(String(100))
    wealth_rating = Column(String(100))
    engagement_score = Column(Numeric)
    communication_preferences = Column(JSONB)
    tags = Column(ARRAY(String))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))

class EmailCampaigns(Base):
    __tablename__ = "email_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text)
    template_id = Column(UUID(as_uuid=True))
    status = Column(String(100))
    scheduled_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    sender_email = Column(String(255))
    sender_name = Column(String(255))
    reply_to_email = Column(String(255))
    segment_criteria = Column(JSONB, default=dict)
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    bounced_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="email_campaigns")
    email_campaign_recipients = relationship("EmailCampaignRecipients", back_populates="campaign")

class EmailCampaignRecipients(Base):
    __tablename__ = "email_campaign_recipients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("email_campaigns.id", ondelete="CASCADE"))
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"))
    email = Column(String(255), nullable=False)
    status = Column(String(100))
    sent_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    bounced_at = Column(DateTime(timezone=True))
    bounce_reason = Column(Text)
    unsubscribed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    campaign = relationship("EmailCampaigns", back_populates="email_campaign_recipients")
    donor = relationship("Donors", back_populates="email_campaign_recipients")

class Events(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(50))
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    location = Column(String(255))
    venue_address = Column(Text)
    capacity = Column(Integer)
    registered_count = Column(Integer, default=0)
    registration_fee = Column(Numeric)
    status = Column(String(100))
    is_public = Column(Boolean, default=True)
    registration_deadline = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="events")
    event_registrations = relationship("EventRegistrations", back_populates="event")
    event_tickets = relationship("EventTickets", back_populates="event")
    volunteer_assignments = relationship("VolunteerAssignments", back_populates="event")

class EventRegistrations(Base):
    __tablename__ = "event_registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"))
    participant_name = Column(String(255), nullable=False)
    participant_email = Column(String(255), nullable=False)
    participant_phone = Column(String(100))
    number_of_tickets = Column(Integer, default=1)
    total_amount = Column(Numeric)
    payment_status = Column(String(100))
    registration_status = Column(String(100))
    special_requirements = Column(Text)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    event = relationship("Events", back_populates="event_registrations")

class EventTickets(Base):
    __tablename__ = "event_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    quantity_available = Column(Integer)
    quantity_sold = Column(Integer)
    is_active = Column(Boolean)
    sale_start = Column(DateTime)
    sale_end = Column(DateTime)
    created_at = Column(DateTime)

    # Relationships
    event = relationship("Events", back_populates="event_tickets")

class ExpenseCategories(Base):
    __tablename__ = "expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category_type = Column(String(50))
    parent_category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.id", ondelete="SET NULL"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="expense_categories")
    parent_category = relationship("ExpenseCategories", remote_side=[id], back_populates="children")
    children = relationship("ExpenseCategories", foreign_keys=[parent_category_id], back_populates="parent_category")
    expenses = relationship("Expenses", back_populates="expense_category")

class Expenses(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    category_id = Column(UUID(as_uuid=True), ForeignKey("expense_categories.id", ondelete="SET NULL"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    amount = Column(Numeric, nullable=False)
    expense_date = Column(Date, nullable=False)
    vendor = Column(String(255))
    description = Column(Text)
    receipt_url = Column(String(500))
    payment_method = Column(String(50))
    status = Column(String(100))
    approved_by = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    category = Column(String(100))  # This is a text field, not the relationship
    subcategory = Column(String(100))

    # Relationships
    organization = relationship("Organizations", back_populates="expenses")
    expense_category = relationship("ExpenseCategories", back_populates="expenses")  # Renamed to avoid conflict
    program = relationship("Programs", back_populates="expenses")

class GiftGoals(Base):
    """Specific fundraising goals for individual major donors"""
    __tablename__ = "gift_goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Goal details
    goal_description = Column(Text, nullable=False)
    goal_amount = Column(Numeric(15, 2), nullable=False)

    # Campaign/project association
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))

    # Timeline
    target_date = Column(Date)
    target_fiscal_year = Column(Integer)

    # Progress
    current_committed_amount = Column(Numeric(15, 2), default=0)
    current_received_amount = Column(Numeric(15, 2), default=0)
    probability_percentage = Column(Integer, default=50)

    # Status
    status = Column(String(50), default='active')
    is_realized = Column(Boolean, default=False)
    date_realized = Column(Date)

    # Notes
    notes = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="gift_goals")
    donor = relationship("Donors", back_populates="gift_goals", foreign_keys=[donor_id])
    officer = relationship("MajorGiftOfficer", back_populates="gift_goals")
    campaign = relationship("Campaigns", back_populates="gift_goals")
    project = relationship("Projects", back_populates="gift_goals")
    program = relationship("Programs", back_populates="gift_goals")

    __table_args__ = (
        CheckConstraint('probability_percentage >= 0 AND probability_percentage <= 100', name='check_probability_range'),
    )


class ImpactMetrics(Base):
    __tablename__ = "impact_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    metric_name = Column(String(255))
    social_value = Column(Numeric)
    investment = Column(Numeric)
    sroi = Column(Numeric)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="impact_metrics")
    program = relationship("Programs", back_populates="impact_metrics")

class Payments(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id", ondelete="CASCADE"), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)
    method = Column(String(50), nullable=False)
    reference_no = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="payments")
    donation = relationship("Donations", back_populates="payments")
    matching_claims = relationship("MatchingClaims", back_populates="paid_payment")
    pledge_installments = relationship("PledgeInstallments", back_populates="paid_payment")

class MatchingClaims(Base):
    __tablename__ = "matching_claims"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id"), nullable=False)
    matcher_party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    submitted_at = Column(DateTime)
    status = Column(String(50))
    paid_payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"))

    # Relationships
    organization = relationship("Organizations", back_populates="matching_claims")
    donation = relationship("Donations", back_populates="matching_claims")
    matcher_party = relationship("Parties", back_populates="matching_claims")
    paid_payment = relationship("Payments", back_populates="matching_claims")

class OfficerAnnualTargets(Base):
    """Annual performance targets and actuals for officers"""
    __tablename__ = "officer_annual_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Fiscal year
    fiscal_year = Column(Integer, nullable=False)

    # Targets
    target_dollars = Column(Numeric(15, 2), nullable=False, default=0)
    target_gift_count = Column(Integer, nullable=False, default=0)
    target_new_donors = Column(Integer, default=0)
    target_meetings = Column(Integer, default=0)
    target_proposals = Column(Integer, default=0)

    # Actuals
    actual_dollars = Column(Numeric(15, 2), default=0)
    actual_gift_count = Column(Integer, default=0)
    actual_new_donors = Column(Integer, default=0)
    actual_meetings = Column(Integer, default=0)
    actual_proposals = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="officer_annual_targets")
    officer = relationship("MajorGiftOfficer", back_populates="annual_targets")

    __table_args__ = (
        UniqueConstraint('officer_id', 'fiscal_year', name='unique_officer_year'),
    )

class OutcomeMetrics(Base):
    __tablename__ = "outcome_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    unit = Column(String(50))
    direction = Column(String(50))
    target_value = Column(Float)

    # Relationships
    organization = relationship("Organizations", back_populates="outcome_metrics")
    program = relationship("Programs", back_populates="outcome_metrics")
    outcome_records = relationship("OutcomeRecords", back_populates="outcome_metric")

class OutcomeRecords(Base):
    __tablename__ = "outcome_records"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    outcome_metric_id = Column(UUID(as_uuid=True), ForeignKey("outcome_metrics.id"), nullable=False)
    value = Column(Float, nullable=False)
    source = Column(String(200))
    recorded_at = Column(DateTime)

    # Relationships
    organization = relationship("Organizations", back_populates="outcome_records")
    outcome_metric = relationship("OutcomeMetrics", back_populates="outcome_records")

class Packages(Base):
    __tablename__ = "packages"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    appeal_id = Column(UUID(as_uuid=True), ForeignKey("appeals.id"), nullable=False)
    code = Column(String(100), nullable=False)
    cost_per_unit = Column(Float)
    audience_size = Column(Integer)

    # Relationships
    organization = relationship("Organizations", back_populates="packages")
    appeal = relationship("Appeals", back_populates="packages")

class PartyRoles(Base):
    __tablename__ = "party_roles"

    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), primary_key=True)
    role_code = Column(String(50), primary_key=True)
    start_date = Column(Date)
    end_date = Column(Date)

    # Relationships
    party = relationship("Parties", back_populates="party_roles")

class PaymentMethods(Base):
    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    method = Column(String(50), nullable=False)
    token_ref = Column(String(255))
    exp_mo_yr = Column(String(7))
    is_default = Column(Boolean)

    # Relationships
    organization = relationship("Organizations", back_populates="payment_methods")
    party = relationship("Parties", back_populates="payment_methods")
    recurring_gifts = relationship("RecurringGifts", back_populates="payment_method")

class Permissions(Base):
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    resource = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    role_permissions = relationship("RolePermissions", back_populates="permission")

class PledgeInstallments(Base):
    __tablename__ = "pledge_installments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    pledge_id = Column(UUID(as_uuid=True), ForeignKey("pledges.id", ondelete="CASCADE"), nullable=False)
    due_date = Column(Date, nullable=False)
    due_amount = Column(Numeric, nullable=False)
    paid_payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id", ondelete="SET NULL"))
    status = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="pledge_installments")
    pledge = relationship("Pledges", back_populates="pledge_installments")
    paid_payment = relationship("Payments", back_populates="pledge_installments")

class ProgramEnrollments(Base):
    __tablename__ = "program_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiaries.id", ondelete="CASCADE"))
    enrollment_date = Column(Date)
    completion_date = Column(Date)
    status = Column(String(100))
    progress_percentage = Column(Numeric)
    outcome_metrics = Column(JSONB, default=dict)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    program = relationship("Programs", back_populates="program_enrollments")
    beneficiary = relationship("Beneficiaries", back_populates="program_enrollments")

class Users(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_superadmin = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    full_name = Column(String(200))
    role = Column(String(100))
    email_verified = Column(Boolean, default=False)
    invitation_token = Column(String(100))
    invitation_expires_at=Column(DateTime(timezone=True))
    # Relationships
    organization = relationship("Organizations", back_populates="users")
    project_team = relationship("ProjectTeam", back_populates="user")
    reports = relationship("Reports", back_populates="user")
    tasks = relationship("Tasks", back_populates="user")
    user_roles = relationship("UserRoles", back_populates="user")
    major_gift_officer = relationship("MajorGiftOfficer", back_populates="user", uselist=False)

class Projects(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_type = Column(String(50))
    status = Column(String(100))
    priority = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Numeric)
    actual_cost = Column(Numeric, default=0)
    completion_percentage = Column(Numeric, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="projects")
    program = relationship("Programs", back_populates="projects")
    project_team = relationship("ProjectTeam", back_populates="project")
    tasks = relationship("Tasks", back_populates="project")
    volunteer_assignments = relationship("VolunteerAssignments", back_populates="project")
    gift_goals = relationship("GiftGoals", back_populates="project")
    proposals = relationship("SolicitationProposals", back_populates="project")

class ProjectTeam(Base):
    __tablename__ = "project_team"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(50))
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    project = relationship("Projects", back_populates="project_team")
    user = relationship("Users", back_populates="project_team")

class RecurringGifts(Base):
    __tablename__ = "recurring_gifts"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False)
    frequency = Column(String)
    frequency_amount_count = Column(Integer)
    next_charge_on = Column(Date)
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("payment_methods.id"))

    # Relationships
    organization = relationship("Organizations", back_populates="recurring_gifts")
    party = relationship("Parties", back_populates="recurring_gifts")
    payment_method = relationship("PaymentMethods", back_populates="recurring_gifts")

class Reports(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    report_type = Column(String(50))
    parameters = Column(JSONB, default=dict)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    file_url = Column(String(500))
    status = Column(String(100))
    generated_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="reports")
    user = relationship("Users", back_populates="reports")

class Roles(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    role_permissions = relationship("RolePermissions", back_populates="role")
    user_roles = relationship("UserRoles", back_populates="role")

class RolePermissions(Base):
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"))
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    role = relationship("Roles", back_populates="role_permissions")
    permission = relationship("Permissions", back_populates="role_permissions")

class SdgAlignment(Base):
    __tablename__ = "sdg_alignment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    sdg_goal = Column(String(255))
    contribution_score = Column(Numeric)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="sdg_alignment")
    program = relationship("Programs", back_populates="sdg_alignment")

class ServiceEvents(Base):
    __tablename__ = "service_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    location = Column(String(255))
    units_delivered = Column(Numeric)
    notes = Column(Text)

    # Relationships
    organization = relationship("Organizations", back_populates="service_events")
    program = relationship("Programs", back_populates="service_events")
    service_beneficiaries = relationship("ServiceBeneficiaries", back_populates="service_event")

class ServiceBeneficiaries(Base):
    __tablename__ = "service_beneficiaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_event_id = Column(UUID(as_uuid=True), ForeignKey("service_events.id", ondelete="CASCADE"), nullable=False)
    beneficiary_id = Column(UUID(as_uuid=True), ForeignKey("beneficiaries.id", ondelete="CASCADE"), nullable=False)
    participation_status = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    service_event = relationship("ServiceEvents", back_populates="service_beneficiaries")
    beneficiary = relationship("Beneficiaries", back_populates="service_beneficiaries")

class SoftCredits(Base):
    __tablename__ = "soft_credits"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.id"), nullable=False)
    influencer_party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(200))
    notes = Column(Text)

    # Relationships
    organization = relationship("Organizations", back_populates="soft_credits")
    donation = relationship("Donations", back_populates="soft_credits")
    influencer_party = relationship("Parties", back_populates="soft_credits")

class SolicitationProposals(Base):
    """Major gift proposals sent to donors"""
    __tablename__ = "solicitation_proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("major_gift_officers.id", ondelete="CASCADE"), nullable=False)

    # Proposal details
    proposal_title = Column(String(255), nullable=False)
    proposal_description = Column(Text)
    requested_amount = Column(Numeric(15, 2), nullable=False)

    # Campaign/project association
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"))
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))

    # Status tracking
    status = Column(ENUM(ProposalStatusEnum, name="proposal_status_enum"), nullable=False, default=ProposalStatusEnum.draft)

    # Key dates
    date_sent = Column(Date)
    expected_decision_date = Column(Date)
    date_responded = Column(Date)

    # Response tracking
    response_notes = Column(Text)
    committed_amount = Column(Numeric(15, 2), default=0)
    received_amount = Column(Numeric(15, 2), default=0)

    # Attachments
    proposal_document_url = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organizations", back_populates="solicitation_proposals")
    donor = relationship("Donors", back_populates="solicitation_proposals", foreign_keys=[donor_id])
    officer = relationship("MajorGiftOfficer", back_populates="proposals")
    campaign = relationship("Campaigns", back_populates="proposals")
    project = relationship("Projects", back_populates="proposals")
    program = relationship("Programs", back_populates="proposals")



class Stories(Base):
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    summary = Column(Text)
    story_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="stories")
    program = relationship("Programs", back_populates="stories")

class Tasks(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(100))
    priority = Column(String(100))
    due_date = Column(Date)
    completed_at = Column(DateTime(timezone=True))
    estimated_hours = Column(Numeric)
    actual_hours = Column(Numeric)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organization = relationship("Organizations", back_populates="tasks")
    project = relationship("Projects", back_populates="tasks")
    user = relationship("Users", back_populates="tasks")

class UserRoles(Base):
    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    assigned_by = Column(UUID(as_uuid=True))

    # Relationships
    user = relationship("Users", back_populates="user_roles")
    role = relationship("Roles", back_populates="user_roles")
    organization = relationship("Organizations", back_populates="user_roles")

class Volunteers(Base):
    __tablename__ = "volunteers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True))
    user_id = Column(UUID(as_uuid=True))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    skills = Column(ARRAY(String))
    availability = Column(JSONB, default=dict)
    total_hours = Column(Numeric, default=0)
    status = Column(String(100))
    background_check_status = Column(String(100))
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    volunteer_activities = relationship("VolunteerActivities", back_populates="volunteer")
    volunteer_assignments = relationship("VolunteerAssignments", back_populates="volunteer")
    volunteer_skills = relationship("VolunteerSkills", back_populates="volunteer")

class VolunteerActivities(Base):
    __tablename__ = "volunteer_activities"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE"))
    activity_type = Column(String(100))
    date = Column(Date)
    hours = Column(Float)
    notes = Column(Text)

    # Relationships
    organization = relationship("Organizations", back_populates="volunteer_activities")
    volunteer = relationship("Volunteers", back_populates="volunteer_activities")

class VolunteerAssignments(Base):
    __tablename__ = "volunteer_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE"))
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    assignment_date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    hours = Column(Numeric)
    role = Column(String(100))
    status = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    volunteer = relationship("Volunteers", back_populates="volunteer_assignments")
    event = relationship("Events", back_populates="volunteer_assignments")
    project = relationship("Projects", back_populates="volunteer_assignments")

class VolunteerEvents(Base):
    __tablename__ = "volunteer_events"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    name = Column(String(200))
    date = Column(Date)
    attendance_status = Column(String(50))
    location = Column(String(200))
    created_at = Column(DateTime)

    # Relationships
    organization = relationship("Organizations", back_populates="volunteer_events")

class VolunteerSkills(Base):
    __tablename__ = "volunteer_skills"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"))
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE"))
    skill_name = Column(String(100))
    proficiency_level = Column(String(50))

    # Relationships
    organization = relationship("Organizations", back_populates="volunteer_skills")
    volunteer = relationship("Volunteers", back_populates="volunteer_skills")


class DonorGivingSegments(Base):
    """
    Donor Segmentation Analytics Table

    Tracks giving metrics by donor level (mega, major, mid-level) over time.
    Stores year-to-date (YTD), last year (LY), and 2 years ago (2YA) metrics
    for amounts and counts, plus year-over-year variance percentages.

    This table is typically populated by analytics jobs or triggers that
    aggregate donation data by fiscal year and donor classification.
    """
    __tablename__ = "donor_giving_segments"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Time dimensions
    fiscal_year = Column(Integer, nullable=False)
    reporting_date = Column(Date, nullable=False, server_default=func.current_date())

    # Mega Donor Metrics ($100K+)
    mega_donor_ytd_amount = Column(Numeric, default=0)
    mega_donor_ytd_count = Column(Integer, default=0)
    mega_donor_ly_amount = Column(Numeric, default=0)
    mega_donor_ly_count = Column(Integer, default=0)
    mega_donor_2ya_amount = Column(Numeric, default=0)
    mega_donor_2ya_count = Column(Integer, default=0)
    mega_donor_yoy_variance_pct = Column(Numeric)

    # Major Donor Metrics ($10K-99,999)
    major_donor_ytd_amount = Column(Numeric, default=0)
    major_donor_ytd_count = Column(Integer, default=0)
    major_donor_ly_amount = Column(Numeric, default=0)
    major_donor_ly_count = Column(Integer, default=0)
    major_donor_2ya_amount = Column(Numeric, default=0)
    major_donor_2ya_count = Column(Integer, default=0)
    major_donor_yoy_variance_pct = Column(Numeric)

    # Mid-Level Donor Metrics ($1K-9,999)
    mid_level_ytd_amount = Column(Numeric, default=0)
    mid_level_ytd_count = Column(Integer, default=0)
    mid_level_ly_amount = Column(Numeric, default=0)
    mid_level_ly_count = Column(Integer, default=0)
    mid_level_2ya_amount = Column(Numeric, default=0)
    mid_level_2ya_count = Column(Integer, default=0)
    mid_level_yoy_variance_pct = Column(Numeric)

    # Total Metrics (All Donors)
    total_ytd_amount = Column(Numeric, default=0)
    total_ytd_count = Column(Integer, default=0)
    total_ly_amount = Column(Numeric, default=0)
    total_ly_count = Column(Integer, default=0)
    total_2ya_amount = Column(Numeric, default=0)
    total_2ya_count = Column(Integer, default=0)
    total_yoy_variance_pct = Column(Numeric)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    organization = relationship("Organizations", back_populates="donor_giving_segments")

    # Constraints
    __table_args__ = (
        UniqueConstraint('organization_id', 'fiscal_year', 'reporting_date',
                         name='unique_segment_year_date'),
        CheckConstraint('fiscal_year >= 2000 AND fiscal_year <= 2100',
                        name='valid_fiscal_year'),
    )

    def __repr__(self):
        return (f"<DonorGivingSegments(org={self.organization_id}, "
                f"fy={self.fiscal_year}, date={self.reporting_date})>")


