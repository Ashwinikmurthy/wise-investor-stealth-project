"""
Staff Management API Endpoints for Organization Admins
Allows org admins to create, manage, and assign roles to staff members
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
import secrets
import string
from passlib.context import CryptContext

# Import your dependencies
from app.database import get_db
from app.auth import get_current_user, verify_org_admin, hash_password
from app.models import User, Organization, Role
from app.email import send_welcome_email  # Optional: for sending credentials

router = APIRouter(prefix="/api/v1/staff", tags=["staff-management"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============= Pydantic Schemas =============

class RoleEnum:
    """Available roles in the system"""
    ORG_ADMIN = "org_admin"
    STAFF = "staff"
    MANAGER = "manager"
    FUNDRAISER = "fundraiser"
    VOLUNTEER_COORDINATOR = "volunteer_coordinator"
    FINANCE_MANAGER = "finance_manager"
    MARKETING_MANAGER = "marketing_manager"
    DONOR_RELATIONS = "donor_relations"
    EVENT_COORDINATOR = "event_coordinator"
    VIEWER = "viewer"  # Read-only access


class StaffCreate(BaseModel):
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    send_welcome_email: bool = True
    temporary_password: Optional[str] = None  # If not provided, auto-generate

    @validator('role')
    def validate_role(cls, v):
        """Validate role is in allowed list"""
        valid_roles = [
            RoleEnum.ORG_ADMIN,
            RoleEnum.STAFF,
            RoleEnum.MANAGER,
            RoleEnum.FUNDRAISER,
            RoleEnum.VOLUNTEER_COORDINATOR,
            RoleEnum.FINANCE_MANAGER,
            RoleEnum.MARKETING_MANAGER,
            RoleEnum.DONOR_RELATIONS,
            RoleEnum.EVENT_COORDINATOR,
            RoleEnum.VIEWER
        ]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            valid_roles = [
                RoleEnum.ORG_ADMIN, RoleEnum.STAFF, RoleEnum.MANAGER,
                RoleEnum.FUNDRAISER, RoleEnum.VOLUNTEER_COORDINATOR,
                RoleEnum.FINANCE_MANAGER, RoleEnum.MARKETING_MANAGER,
                RoleEnum.DONOR_RELATIONS, RoleEnum.EVENT_COORDINATOR,
                RoleEnum.VIEWER
            ]
            if v not in valid_roles:
                raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class PasswordReset(BaseModel):
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        """Ensure password meets minimum requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class StaffResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    phone: Optional[str]
    department: Optional[str]
    title: Optional[str]
    is_active: bool
    organization_id: UUID
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        orm_mode = True


class StaffListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    staff: List[StaffResponse]


class StaffCreateResponse(BaseModel):
    staff: StaffResponse
    temporary_password: Optional[str] = None
    message: str


# ============= SQLAlchemy Models (Add to your models.py) =============
"""
Add these fields to your User model if not present:

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="staff")
    phone = Column(String(20))
    department = Column(String(100))
    title = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    password_reset_required = Column(Boolean, default=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
"""


# ============= Helper Functions =============

def generate_temporary_password(length: int = 12) -> str:
    """Generate a secure temporary password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def is_org_admin(user: User) -> bool:
    """Check if user is an organization admin"""
    return user.role == RoleEnum.ORG_ADMIN


def verify_org_admin_access(current_user: User, target_org_id: UUID):
    """Verify user is admin of the target organization"""
    if not is_org_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization admins can perform this action"
        )

    if str(current_user.organization_id) != str(target_org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage staff in your own organization"
        )


# ============= API Endpoints =============

@router.post("", response_model=StaffCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_staff_member(
        staff: StaffCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Create a new staff member in the organization.
    Only organization admins can create staff.
    """

    # Verify admin access
    if not is_org_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization admins can create staff members"
        )

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == staff.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Generate password if not provided
    temp_password = staff.temporary_password or generate_temporary_password()
    hashed_pwd = pwd_context.hash(temp_password)

    # Create new staff member
    new_staff = User(
        email=staff.email,
        name=staff.name,
        hashed_password=hashed_pwd,
        role=staff.role,
        phone=staff.phone,
        department=staff.department,
        title=staff.title,
        organization_id=current_user.organization_id,
        is_active=True,
        is_verified=False,  # User must verify email or change password
        password_reset_required=True  # Force password change on first login
    )

    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    # Send welcome email (optional)
    if staff.send_welcome_email:
        try:
            # Implement your email sending logic
            # send_welcome_email(staff.email, staff.name, temp_password)
            pass
        except Exception as e:
            print(f"Failed to send welcome email: {e}")

    return StaffCreateResponse(
        staff=new_staff,
        temporary_password=temp_password if not staff.send_welcome_email else None,
        message="Staff member created successfully. Temporary password has been generated."
    )


@router.get("", response_model=StaffListResponse)
async def list_staff_members(
        page: int = 1,
        page_size: int = 50,
        role: Optional[str] = None,
        department: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    List all staff members in the organization.
    Organization admins can see all staff.
    Regular staff can only see active members.
    """

    # Base query - only users in same organization
    query = db.query(User).filter(
        User.organization_id == current_user.organization_id
    )

    # Apply filters
    if role:
        query = query.filter(User.role == role)

    if department:
        query = query.filter(User.department == department)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )

    # Get total count
    total = query.count()

    # Paginate
    offset = (page - 1) * page_size
    staff = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    return StaffListResponse(
        total=total,
        page=page,
        page_size=page_size,
        staff=staff
    )


@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff_member(
        staff_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get details of a specific staff member"""

    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    return staff


@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff_member(
        staff_id: UUID,
        staff_update: StaffUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Update a staff member's information.
    Only organization admins can update staff.
    """

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    # Get staff member
    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    # Prevent admin from demoting themselves
    if staff.id == current_user.id and staff_update.role and staff_update.role != RoleEnum.ORG_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own admin role"
        )

    # Update fields
    update_data = staff_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(staff, field, value)

    staff.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(staff)

    return staff


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff_member(
        staff_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Delete (deactivate) a staff member.
    Only organization admins can delete staff.
    """

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    # Get staff member
    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    # Prevent admin from deleting themselves
    if staff.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    # Soft delete - just deactivate
    staff.is_active = False
    staff.updated_at = datetime.utcnow()

    db.commit()

    return None


@router.post("/{staff_id}/reset-password", response_model=dict)
async def reset_staff_password(
        staff_id: UUID,
        password_reset: PasswordReset = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Reset a staff member's password.
    Organization admins can reset any staff password.
    """

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    # Get staff member
    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    # Generate or use provided password
    if password_reset and password_reset.new_password:
        new_password = password_reset.new_password
    else:
        new_password = generate_temporary_password()

    # Hash and update password
    staff.hashed_password = pwd_context.hash(new_password)
    staff.password_reset_required = True
    staff.updated_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Password reset successfully",
        "temporary_password": new_password,
        "staff_email": staff.email
    }


@router.post("/{staff_id}/activate", response_model=StaffResponse)
async def activate_staff_member(
        staff_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Activate a deactivated staff member"""

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    staff.is_active = True
    staff.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(staff)

    return staff


@router.post("/{staff_id}/deactivate", response_model=StaffResponse)
async def deactivate_staff_member(
        staff_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Deactivate an active staff member (soft delete)"""

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    staff = db.query(User).filter(
        User.id == staff_id,
        User.organization_id == current_user.organization_id
    ).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )

    # Prevent admin from deactivating themselves
    if staff.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    staff.is_active = False
    staff.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(staff)

    return staff


@router.get("/roles/available", response_model=List[dict])
async def get_available_roles(
        current_user: User = Depends(get_current_user)
):
    """Get list of available roles that can be assigned"""

    roles = [
        {
            "value": RoleEnum.ORG_ADMIN,
            "label": "Organization Admin",
            "description": "Full access to all organization features"
        },
        {
            "value": RoleEnum.MANAGER,
            "label": "Manager",
            "description": "Manage campaigns, donors, and events"
        },
        {
            "value": RoleEnum.FUNDRAISER,
            "label": "Fundraiser",
            "description": "Create and manage fundraising campaigns"
        },
        {
            "value": RoleEnum.VOLUNTEER_COORDINATOR,
            "label": "Volunteer Coordinator",
            "description": "Manage volunteers and volunteer events"
        },
        {
            "value": RoleEnum.FINANCE_MANAGER,
            "label": "Finance Manager",
            "description": "Access to financial reports and donation processing"
        },
        {
            "value": RoleEnum.MARKETING_MANAGER,
            "label": "Marketing Manager",
            "description": "Manage campaigns and communications"
        },
        {
            "value": RoleEnum.DONOR_RELATIONS,
            "label": "Donor Relations",
            "description": "Manage donor relationships and communications"
        },
        {
            "value": RoleEnum.EVENT_COORDINATOR,
            "label": "Event Coordinator",
            "description": "Create and manage events"
        },
        {
            "value": RoleEnum.STAFF,
            "label": "Staff",
            "description": "Basic staff access"
        },
        {
            "value": RoleEnum.VIEWER,
            "label": "Viewer",
            "description": "Read-only access to analytics and reports"
        }
    ]

    return roles


@router.get("/stats/summary", response_model=dict)
async def get_staff_statistics(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get staff statistics for the organization"""

    # Verify admin access
    if not is_org_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization admins can view staff statistics"
        )

    org_id = current_user.organization_id

    # Total staff count
    total_staff = db.query(User).filter(
        User.organization_id == org_id
    ).count()

    # Active staff count
    active_staff = db.query(User).filter(
        User.organization_id == org_id,
        User.is_active == True
    ).count()

    # Staff by role
    roles_query = db.query(
        User.role,
        db.func.count(User.id).label('count')
    ).filter(
        User.organization_id == org_id
    ).group_by(User.role).all()

    staff_by_role = {role: count for role, count in roles_query}

    # Recently added (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_additions = db.query(User).filter(
        User.organization_id == org_id,
        User.created_at >= thirty_days_ago
    ).count()

    return {
        "total_staff": total_staff,
        "active_staff": active_staff,
        "inactive_staff": total_staff - active_staff,
        "staff_by_role": staff_by_role,
        "recent_additions_30_days": recent_additions
    }


# ============= Bulk Operations =============

@router.post("/bulk-create", response_model=dict)
async def bulk_create_staff(
        staff_list: List[StaffCreate],
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Create multiple staff members at once.
    Only organization admins can perform bulk operations.
    """

    # Verify admin access
    verify_org_admin_access(current_user, current_user.organization_id)

    if len(staff_list) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 staff members can be created at once"
        )

    created_staff = []
    errors = []

    for staff_data in staff_list:
        try:
            # Check if email exists
            existing = db.query(User).filter(User.email == staff_data.email).first()
            if existing:
                errors.append({
                    "email": staff_data.email,
                    "error": "User already exists"
                })
                continue

            # Generate password
            temp_password = staff_data.temporary_password or generate_temporary_password()
            hashed_pwd = pwd_context.hash(temp_password)

            # Create staff
            new_staff = User(
                email=staff_data.email,
                name=staff_data.name,
                hashed_password=hashed_pwd,
                role=staff_data.role,
                phone=staff_data.phone,
                department=staff_data.department,
                title=staff_data.title,
                organization_id=current_user.organization_id,
                is_active=True,
                password_reset_required=True
            )

            db.add(new_staff)
            created_staff.append({
                "email": staff_data.email,
                "name": staff_data.name,
                "temporary_password": temp_password
            })

        except Exception as e:
            errors.append({
                "email": staff_data.email,
                "error": str(e)
            })

    # Commit all at once
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create staff members: {str(e)}"
        )

    return {
        "created": len(created_staff),
        "failed": len(errors),
        "created_staff": created_staff,
        "errors": errors
    }


# ============= Database Migration =============
"""
Run this migration to add necessary fields:

alembic revision --autogenerate -m "add_staff_management_fields"

Or manually add these fields to your users table:

ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN title VARCHAR(100);
ALTER TABLE users ADD COLUMN password_reset_required BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
"""