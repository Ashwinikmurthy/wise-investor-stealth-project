"""
Superadmin Schemas
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from slugify import slugify

class SuperadminLogin(BaseModel):
    """Schema for superadmin login"""
    username: str = Field(..., description="Superadmin username")
    password: str = Field(..., description="Superadmin password")


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 minutes in seconds


class OrganizationCreate(BaseModel):
    """Schema for creating an organization"""
    name: str = Field(..., min_length=2, max_length=200, description="Organization name")
    ein: Optional[str] = Field(None, max_length=50, description="Employer Identification Number")
    mission: Optional[str] = Field(None, max_length=1000, description="Organization mission statement")
    website: Optional[str] = Field(None, max_length=200, description="Organization website")
    address: Optional[str] = Field(None, max_length=500, description="Organization address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=50, description="State")
    zip_code: Optional[str] = Field(None, max_length=20, description="ZIP code")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    email: Optional[EmailStr] = Field(None, description="Organization email")
    fiscal_year_end: Optional[str] = Field(None, max_length=5, description="Fiscal year end (MM-DD)")
    annual_budget: Optional[float] = Field(None, ge=0, description="Annual budget")
    is_active: bool = Field(True, description="Organization active status")
    slug: Optional[str] = Field(None, max_length=255)
    @validator('slug', always=True)
    def generate_slug_if_not_provided(cls, v, values):
        """Auto-generate slug from name if not provided"""
        if v is None and 'name' in values:
            return slugify(values['name'])
        elif v:
            return slugify(v)  # Ensure provided slug is properly formatted
        return v

    @validator('fiscal_year_end')
    def validate_fiscal_year_end(cls, v):
        if v:
            try:
                month, day = v.split('-')
                month_int = int(month)
                day_int = int(day)
                if not (1 <= month_int <= 12) or not (1 <= day_int <= 31):
                    raise ValueError
            except:
                raise ValueError('Fiscal year end must be in MM-DD format')
        return v


class OrganizationResponse(BaseModel):
    """Schema for organization response"""
    id: UUID
    name: str
    ein: Optional[str]
    mission: Optional[str]
    website: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    fiscal_year_end: Optional[str]
    annual_budget: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserCreateBySuperadmin(BaseModel):
    """Schema for creating a user by superadmin"""
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., min_length=2, max_length=200, description="User full name")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    organization_id: UUID = Field(..., description="Organization UUID")
    role: str = Field(..., description="User role (admin, manager, staff)")
    is_active: bool = Field(True, description="User active status")
    is_superadmin: bool = Field(False, description="Superadmin flag")

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin','org_admin', 'ceo', 'executive', 'major_gifts','director_annual_giving','planned_giving','corporate_foundations','stewardship','membership','marketing_comms','digital_strategy','sales_team','event_organizer','donor']
        if v.lower() not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v.lower()

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserResponse(BaseModel):
    """Schema for user response"""
    id: UUID
    email: str
    full_name: str
    organization_id: UUID
    role: str
    is_active: bool
    is_superadmin: bool
    created_at: datetime
    last_login_at: Optional[datetime]= None

    class Config:
        from_attributes = True


class OrganizationWithUsers(OrganizationResponse):
    """Schema for organization with users list"""
    user_count: int = 0


class SuperadminDashboard(BaseModel):
    """Schema for superadmin dashboard statistics"""
    total_organizations: int
    active_organizations: int
    inactive_organizations: int
    total_users: int
    total_donors: int
    total_donations_amount: float
    organizations_created_this_month: int
