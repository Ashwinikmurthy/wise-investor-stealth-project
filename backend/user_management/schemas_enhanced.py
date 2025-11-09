# schemas_enhanced.py - Enhanced Pydantic Schemas with New Roles
"""
Enhanced Pydantic schemas including new roles and event management
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import Optional, List, Literal
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# =====================================================================
# ENHANCED USER SCHEMAS WITH NEW ROLES
# =====================================================================

# Define valid roles
ValidRoles = Literal[
    "superadmin",
    "org_admin",
    "ceo",
    "executive",
    "marketing",
    "sales",
    "event_organizer",
    "donor"
]


class UserCreateByOrgAdmin(BaseModel):
    """User creation by Org Admin - Cannot create SUPERADMIN or ORG_ADMIN"""
    organization_id: UUID
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    role: Literal["ceo", "executive", "marketing", "sales", "event_organizer", "donor"]


class UserCreateBySuperadmin(BaseModel):
    """User creation by Superadmin - Can create any role including ORG_ADMIN"""
    organization_id: Optional[UUID] = None  # Can be None for superadmin
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: ValidRoles
    is_superadmin: bool = False


class UserResponse(BaseModel):
    """Enhanced user response with role"""
    id: UUID
    organization_id: Optional[UUID] = None
    email: str
    full_name: str
    #first_name: str
    #last_name: str
    phone: Optional[str] = None
    role: str
    is_superadmin: bool = False
    #status: str
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated user list response"""
    users: List[UserResponse]
    total: int
    skip: int
    limit: int
    filters: dict


class RoleAssignmentRequest(BaseModel):
    """Request to assign/change a user's role"""
    role: ValidRoles


class BulkUserInvite(BaseModel):
    """Bulk user invitation"""
    users: List[UserCreateByOrgAdmin]


class BulkInviteResponse(BaseModel):
    """Bulk invitation response"""
    message: str
    invited_count: int
    failed_count: int
    failed_emails: List[dict] = []


# =====================================================================
# ORGANIZATION REGISTRATION WITH ORG_ADMIN
# =====================================================================

class RegisterOrganizationWithAdmin(BaseModel):
    """Register organization with initial org admin user"""
    # Organization details
    organization_name: str
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    ein: Optional[str] = None
    website: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    timezone: Optional[str] = "America/New_York"
    currency: Optional[str] = "USD"

    # Org Admin user details
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    admin_first_name: str
    admin_last_name: str
    admin_phone: Optional[str] = None


class OrganizationRegistrationResponse(BaseModel):
    """Response after organization registration"""
    message: str
    organization_id: UUID
    organization_name: str
    admin_user_id: UUID
    admin_email: str
    access_token: str
    token_type: str = "bearer"


# =====================================================================
# EVENT SCHEMAS
# =====================================================================

class EventBase(BaseModel):
    """Base event schema"""
    organization_id: UUID
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    event_date: datetime
    location: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    registration_deadline: Optional[datetime] = None
    event_type: Optional[str] = Field(None, description="gala, workshop, fundraiser, etc")


class EventCreate(EventBase):
    """Event creation schema"""
    pass


class EventUpdate(BaseModel):
    """Event update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    event_type: Optional[str] = None
    status: Optional[str] = None


class Event(EventBase):
    """Event response model"""
    id: UUID
    status: str = "active"
    created_at: datetime
    updated_at: Optional[datetime] = None
    registered_count: int = 0
    checked_in_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    """Event list response"""
    events: List[Event]
    total: int
    skip: int
    limit: int


# =====================================================================
# EVENT REGISTRATION SCHEMAS
# =====================================================================

class EventRegistrationCreate(BaseModel):
    """Event registration creation"""
    event_id: UUID
    party_id: UUID
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    ticket_type: Optional[str] = None
    notes: Optional[str] = None


class EventRegistration(BaseModel):
    """Event registration response"""
    id: UUID
    event_id: UUID
    party_id: UUID
    registration_date: datetime
    checked_in: bool = False
    check_in_time: Optional[datetime] = None
    ticket_type: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EventCheckInRequest(BaseModel):
    """Check-in request"""
    registration_id: UUID


class EventCheckInResponse(BaseModel):
    """Check-in response"""
    message: str
    registration_id: UUID
    party_id: UUID
    check_in_time: datetime


class EventAttendeesResponse(BaseModel):
    """Event attendees list"""
    event_id: UUID
    event_name: str
    total_registered: int
    total_checked_in: int
    attendees: List[dict]


# =====================================================================
# PERMISSION AND ROLE INFO SCHEMAS
# =====================================================================

class PermissionInfo(BaseModel):
    """Information about a permission"""
    code: str
    name: str
    category: str


class RoleInfo(BaseModel):
    """Information about a role"""
    code: str
    name: str
    description: str
    permissions: List[str]
    can_assign_roles: List[str]


class CurrentUserPermissions(BaseModel):
    """Current user's permissions"""
    role: str
    role_description: str
    permissions: List[PermissionInfo]
    total_permissions: int
    can_manage_users: bool
    can_assign_roles: List[str]


class AvailableRolesResponse(BaseModel):
    """Available roles that current user can assign"""
    available_roles: List[str]
    your_role: str
    descriptions: dict


# =====================================================================
# CAMPAIGN SCHEMAS (Enhanced)
# =====================================================================

class CampaignBase(BaseModel):
    """Base campaign schema"""
    organization_id: UUID
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    goal_amount: Optional[Decimal] = None
    campaign_type: Optional[str] = Field(None, description="email, social, event, etc")


class CampaignCreate(CampaignBase):
    """Campaign creation schema"""
    pass


class CampaignUpdate(BaseModel):
    """Campaign update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal_amount: Optional[Decimal] = None
    campaign_type: Optional[str] = None
    status: Optional[str] = None


class Campaign(CampaignBase):
    """Campaign response model"""
    id: UUID
    status: str
    total_raised: Decimal = Decimal('0.00')
    donation_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CampaignPerformance(BaseModel):
    """Campaign performance metrics"""
    campaign_id: UUID
    campaign_name: str
    emails_sent: int = 0
    open_rate: float = 0.0
    click_rate: float = 0.0
    donation_count: int = 0
    total_revenue: Decimal = Decimal('0.00')
    goal_amount: Optional[Decimal] = None
    percentage_to_goal: float = 0.0


# =====================================================================
# ANALYTICS SCHEMAS (Enhanced)
# =====================================================================

class DashboardMetrics(BaseModel):
    """Dashboard overview metrics"""
    organization_id: UUID
    period_start: date
    period_end: date
    total_donations: int
    total_revenue: Decimal
    donor_count: int
    new_donors: int
    active_programs: int
    active_campaigns: int
    upcoming_events: int


class DonorLifecycleMetrics(BaseModel):
    """Donor lifecycle analytics"""
    organization_id: UUID
    new_donors: int
    retained_donors: int
    lapsed_donors: int
    reactivated_donors: int
    retention_rate: float
    lapsed_rate: float
    average_donor_lifetime: float  # in months


class SalesPipelineMetrics(BaseModel):
    """Sales pipeline metrics"""
    organization_id: UUID
    stages: dict  # {"qualification": 10, "cultivation": 20, ...}
    total_pipeline_value: Decimal
    conversion_rate: float
    average_deal_size: Decimal


# =====================================================================
# FINANCIAL SCHEMAS (Enhanced)
# =====================================================================

class FinancialSummary(BaseModel):
    """Financial summary"""
    organization_id: UUID
    fiscal_year: int
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal
    operating_margin: float
    fund_balances: List[dict]


class FundBalance(BaseModel):
    """Fund balance information"""
    fund_id: UUID
    fund_name: str
    balance: Decimal
    restricted: bool
    description: Optional[str] = None


# =====================================================================
# VALIDATION EXAMPLES
# =====================================================================

class ValidatedUserCreate(BaseModel):
    """User creation with validation"""
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: ValidRoles
    organization_id: UUID

    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

    @validator('first_name', 'last_name')
    def name_not_empty(cls, v):
        """Validate names are not empty"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


# Example usage comments
"""
EXAMPLE USAGE:

# Creating a user as Org Admin
user_data = UserCreateByOrgAdmin(
    organization_id=UUID('...'),
    email='newuser@example.com',
    password='SecurePass123',
    first_name='John',
    last_name='Doe',
    role='marketing'
)

# Registering organization with admin
org_reg = RegisterOrganizationWithAdmin(
    organization_name='Hope Foundation',
    admin_email='admin@hope.org',
    admin_password='AdminPass123',
    admin_first_name='Jane',
    admin_last_name='Smith',
    timezone='America/New_York'
)

# Creating an event
event_data = EventCreate(
    organization_id=UUID('...'),
    name='Annual Gala',
    description='Our biggest fundraising event of the year',
    event_date=datetime(2025, 11, 15, 18, 0),
    location='Grand Ballroom',
    capacity=200,
    event_type='gala'
)
"""
