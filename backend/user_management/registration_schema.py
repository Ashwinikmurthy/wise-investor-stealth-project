# registration_schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class RoleType(str, Enum):
    """Available roles in the nonprofit system"""
    # System & Organization Admin
    SUPERADMIN = "superadmin"
    ORG_ADMIN = "org_admin"

    # Executive Leadership
    CEO = "ceo"
    EXECUTIVE = "executive"

    # Fundraising Teams
    MAJOR_GIFTS = "major_gifts"
    DIRECTOR_ANNUAL_GIVING = "director_annual_giving"
    PLANNED_GIVING = "planned_giving"
    CORPORATE_FOUNDATIONS = "corporate_foundations"

    # Donor Engagement
    STEWARDSHIP = "stewardship"
    MEMBERSHIP = "membership"

    # Marketing & Communications
    MARKETING_COMMS = "marketing_comms"
    DIGITAL_STRATEGY = "digital_strategy"

    # Sales & Operations
    SALES_TEAM = "sales_team"
    EVENT_ORGANIZER = "event_organizer"

    # Basic Access
    DONOR = "donor"


# Role hierarchies and permissions
ROLE_HIERARCHY = {
    "superadmin": 100,
    "org_admin": 90,
    "ceo": 85,
    "executive": 80,
    "director_annual_giving": 70,
    "major_gifts": 65,
    "planned_giving": 65,
    "corporate_foundations": 65,
    "stewardship": 60,
    "membership": 60,
    "marketing_comms": 55,
    "digital_strategy": 55,
    "sales_team": 50,
    "event_organizer": 50,
    "donor": 10,
}

# Roles that can be self-registered
SELF_REGISTERABLE_ROLES = [RoleType.DONOR]

# Roles that require admin invitation
ADMIN_ONLY_ROLES = [
    RoleType.SUPERADMIN,
    RoleType.ORG_ADMIN,
    RoleType.CEO,
    RoleType.EXECUTIVE,
]


class DonorRegistrationRequest(BaseModel):
    """Simplified registration for donors - no password initially"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    display_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)

    # Address (optional)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field(default="USA", max_length=100)

    # Preferences
    email_opt_in: bool = Field(default=True)
    sms_opt_in: bool = Field(default=False)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "donor@example.com",
                "full_name": "John Doe",
                "display_name": "John",
                "phone": "(555) 123-4567",
                "address_line1": "123 Main St",
                "city": "New York",
                "state": "NY",
                "postal_code": "10001",
                "country": "USA",
                "email_opt_in": True,
                "sms_opt_in": False
            }
        }


class StaffRegistrationRequest(BaseModel):
    """Registration for staff members with organization access"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: RoleType = Field(..., description="User role in the organization")

    # Optional fields
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)

    @validator('password')
    def validate_password_strength(cls, v):
        """Ensure password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

    @validator('role')
    def validate_self_registerable_role(cls, v):
        """Check if role can be self-registered"""
        if v not in SELF_REGISTERABLE_ROLES and v != RoleType.DONOR:
            raise ValueError(
                f'Role {v} requires an admin invitation. '
                f'Self-registration is only available for: {", ".join([r.value for r in SELF_REGISTERABLE_ROLES])}'
            )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "email": "staff@example.com",
                "password": "SecurePass123!",
                "first_name": "Jane",
                "last_name": "Smith",
                "role": "major_gifts",
                "phone": "(555) 987-6543",
                "department": "Development",
                "job_title": "Major Gifts Officer"
            }
        }


class UserInvitationRequest(BaseModel):
    """Admin invitation for users with specific roles"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: RoleType = Field(..., description="Role to assign to the user")

    # Optional fields
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    send_invitation_email: bool = Field(default=True)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "executive@example.com",
                "first_name": "Robert",
                "last_name": "Johnson",
                "role": "ceo",
                "phone": "(555) 111-2222",
                "department": "Executive",
                "job_title": "Chief Executive Officer",
                "send_invitation_email": True
            }
        }


class CompleteInvitationRequest(BaseModel):
    """Complete invitation by setting password"""
    invitation_token: str = Field(..., description="Invitation token from email")
    password: str = Field(..., min_length=8, max_length=100)

    @validator('password')
    def validate_password_strength(cls, v):
        """Ensure password meets security requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "invitation_token": "abc123-def456-ghi789",
                "password": "NewSecurePass123!"
            }
        }


class UserRegistrationResponse(BaseModel):
    """Response after successful registration"""
    id: str
    email: str
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    is_active: bool
    organization_id: Optional[str] = None
    created_at: datetime

    # For donors who may not have password initially
    requires_password_setup: bool = Field(default=False)

    class Config:
        from_attributes = True


class InvitationResponse(BaseModel):
    """Response after sending invitation"""
    id: str
    email: str
    role: str
    invitation_sent: bool
    invitation_token: Optional[str] = None  # Only in response, not stored in plain
    expires_at: datetime

    class Config:
        from_attributes = True


class RoleInfo(BaseModel):
    """Information about a role"""
    role: str
    display_name: str
    description: str
    level: int
    can_self_register: bool
    requires_invitation: bool


class AvailableRolesResponse(BaseModel):
    """List of available roles with descriptions"""
    roles: list[RoleInfo]


# Role descriptions for documentation
ROLE_DESCRIPTIONS = {
    RoleType.SUPERADMIN: {
        "display_name": "System Administrator",
        "description": "Full system access across all organizations"
    },
    RoleType.ORG_ADMIN: {
        "display_name": "Organization Administrator",
        "description": "Full access within their organization"
    },
    RoleType.CEO: {
        "display_name": "Chief Executive Officer",
        "description": "Executive leadership with strategic oversight"
    },
    RoleType.EXECUTIVE: {
        "display_name": "Executive",
        "description": "Senior leadership team member"
    },
    RoleType.MAJOR_GIFTS: {
        "display_name": "Major Gifts Officer",
        "description": "Frontline fundraiser managing major gift relationships"
    },
    RoleType.DIRECTOR_ANNUAL_GIVING: {
        "display_name": "Director of Annual Giving",
        "description": "Manages annual fund and direct response campaigns"
    },
    RoleType.PLANNED_GIVING: {
        "display_name": "Planned Giving Officer",
        "description": "Manages planned giving and legacy programs"
    },
    RoleType.CORPORATE_FOUNDATIONS: {
        "display_name": "Corporate & Foundation Relations",
        "description": "Manages corporate and foundation partnerships"
    },
    RoleType.STEWARDSHIP: {
        "display_name": "Donor Relations / Stewardship",
        "description": "Manages donor recognition and stewardship programs"
    },
    RoleType.MEMBERSHIP: {
        "display_name": "Membership Manager",
        "description": "Manages membership programs and benefits"
    },
    RoleType.MARKETING_COMMS: {
        "display_name": "Marketing & Communications",
        "description": "Manages marketing and communications initiatives"
    },
    RoleType.DIGITAL_STRATEGY: {
        "display_name": "Digital Strategy",
        "description": "Manages digital presence and online fundraising"
    },
    RoleType.SALES_TEAM: {
        "display_name": "Sales Team",
        "description": "Sales and business development"
    },
    RoleType.EVENT_ORGANIZER: {
        "display_name": "Event Organizer",
        "description": "Plans and manages fundraising events"
    },
    RoleType.DONOR: {
        "display_name": "Donor",
        "description": "Individual donor with portal access"
    },
}