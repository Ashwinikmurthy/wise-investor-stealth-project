# user_management_api.py - User Management API Endpoints
"""
API endpoints for user management with role-based authorization.
ORG_ADMIN can create and manage users within their organization.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime
import hashlib
from passlib.context import CryptContext

from user_management.auth_dependencies import (
    get_current_user,
    require_user_management_permission,
    require_permission,
    CurrentUser
)
from user_management.rbac_extra_roles import RoleType, Permission, can_assign_role
from database import get_db
from models import Users as User, Organizations as Organization
from user_management.schemas_enhanced import (
    UserCreateByOrgAdmin,
    UserResponse,
    UserListResponse,
    RoleAssignmentRequest,
    AvailableRolesResponse
)

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])

# Password hashing with SHA256 pre-hash
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__ident="2b",
)

def hash_password(password: str) -> str:
    """Hash a password with SHA256 pre-hash"""
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password_hash)


# =====================================================================
# USER CREATION - For ORG_ADMIN and SUPERADMIN
# =====================================================================

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
        user_data: UserCreateByOrgAdmin,
        current_user: CurrentUser = Depends(require_user_management_permission),
        db: Session = Depends(get_db)
):
    """
    Create a new user within an organization.

    Permissions:
    - SUPERADMIN: Can create users in any organization with any role
    - ORG_ADMIN: Can create users in their own organization (except SUPERADMIN and ORG_ADMIN roles)
    - CEO: Can create users with limited roles
    """

    # Verify role assignment permission
    try:
        target_role = RoleType(user_data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {user_data.role}"
        )

    if not can_assign_role(current_user.role_type, target_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You cannot assign the role: {user_data.role}"
        )

    # Verify organization access
    if current_user.role_type != RoleType.SUPERADMIN:
        if current_user.organization_id != user_data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create users in your own organization"
            )

    # Check if organization exists
    organization = db.query(Organization).filter(
        Organization.id == user_data.organization_id
    ).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create new user
    import uuid
    new_user = User(
        id=uuid.uuid4(),
        organization_id=user_data.organization_id,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=f"{user_data.first_name} {user_data.last_name}",
        role=user_data.role,
        is_active=True,
        is_superadmin=False,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =====================================================================
# GET USERS - List users in organization
# =====================================================================

@router.get("/", response_model=UserListResponse)
async def list_users(
        organization_id: Optional[UUID] = Query(None, description="Filter by organization"),
        role: Optional[str] = Query(None, description="Filter by role"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100),
        current_user: CurrentUser = Depends(require_permission(Permission.READ_USER)),
        db: Session = Depends(get_db)
):
    """
    List users with filtering options.

    Permissions:
    - SUPERADMIN: Can list users from all organizations
    - ORG_ADMIN, CEO: Can list users from their organization
    - Other roles: Can view limited user info from their organization
    """

    # Determine which organization to query
    if organization_id:
        # Verify access to specified organization
        if current_user.role_type != RoleType.SUPERADMIN:
            if current_user.organization_id != organization_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view users in your own organization"
                )
        target_org_id = organization_id
    else:
        # If no org specified, use current user's org (unless superadmin)
        if current_user.role_type == RoleType.SUPERADMIN:
            target_org_id = None  # Can see all
        else:
            target_org_id = current_user.organization_id

    # Query users from database
    query = db.query(User)
    if target_org_id:
        query = query.filter(User.organization_id == target_org_id)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return UserListResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit,
        filters={
            "organization_id": str(target_org_id) if target_org_id else None,
            "role": role,
            "is_active": is_active
        }
    )


# =====================================================================
# GET USER BY ID
# =====================================================================

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
        user_id: UUID,
        current_user: CurrentUser = Depends(require_permission(Permission.READ_USER)),
        db: Session = Depends(get_db)
):
    """
    Get a specific user by ID.

    Permissions:
    - SUPERADMIN: Can view any user
    - ORG_ADMIN, CEO: Can view users in their organization
    - Others: Can view users in their organization
    """

    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify organization access
    if current_user.role_type != RoleType.SUPERADMIN:
        if current_user.organization_id != user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view users in your own organization"
            )

    return user


# =====================================================================
# UPDATE USER
# =====================================================================

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
        user_id: UUID,
        update_data: dict,  # You can create a UserUpdate schema
        current_user: CurrentUser = Depends(require_permission(Permission.UPDATE_USER)),
        db: Session = Depends(get_db)
):
    """
    Update user information.

    Permissions:
    - SUPERADMIN: Can update any user
    - ORG_ADMIN: Can update users in their organization (except role changes to SUPERADMIN/ORG_ADMIN)
    - CEO: Can update certain users in their organization
    """

    # Fetch user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify organization access
    if current_user.role_type != RoleType.SUPERADMIN:
        if current_user.organization_id != user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update users in your own organization"
            )

    # If role is being changed, verify permission
    if "role" in update_data:
        new_role = update_data["role"]
        try:
            target_role = RoleType(new_role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {new_role}"
            )

        if not can_assign_role(current_user.role_type, target_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You cannot assign the role: {new_role}"
            )

    # Update user fields
    for field, value in update_data.items():
        if hasattr(user, field) and field not in ['id', 'password_hash', 'created_at']:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


# =====================================================================
# DELETE/DEACTIVATE USER
# =====================================================================

@router.delete("/{user_id}")
async def delete_user(
        user_id: UUID,
        hard_delete: bool = Query(False, description="Permanently delete (true) or deactivate (false)"),
        current_user: CurrentUser = Depends(require_permission(Permission.DELETE_USER)),
        db: Session = Depends(get_db)
):
    """
    Delete or deactivate a user.

    Permissions:
    - SUPERADMIN: Can delete any user
    - ORG_ADMIN: Can delete users in their organization
    - CEO: Can delete certain users
    """

    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    # Fetch user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify organization access
    if current_user.role_type != RoleType.SUPERADMIN:
        if current_user.organization_id != user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete users in your own organization"
            )

    if hard_delete:
        # Permanent deletion
        db.delete(user)
        message = "User permanently deleted"
    else:
        # Soft delete (deactivate)
        user.is_active = False
        message = "User deactivated"

    db.commit()

    return {
        "message": message,
        "user_id": str(user_id)
    }


# =====================================================================
# ASSIGN ROLE TO USER
# =====================================================================

@router.post("/{user_id}/assign-role", response_model=UserResponse)
async def assign_role_to_user(
        user_id: UUID,
        role_data: RoleAssignmentRequest,
        current_user: CurrentUser = Depends(require_permission(Permission.ASSIGN_ROLES)),
        db: Session = Depends(get_db)
):
    """
    Assign a role to a user.

    Permissions:
    - SUPERADMIN: Can assign any role
    - ORG_ADMIN: Can assign roles except SUPERADMIN and ORG_ADMIN
    - CEO: Can assign limited roles
    """

    # Validate role
    try:
        target_role = RoleType(role_data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role_data.role}"
        )

    # Check if user can assign this role
    if not can_assign_role(current_user.role_type, target_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You cannot assign the role: {role_data.role}"
        )

    # Fetch user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify organization access
    if current_user.role_type != RoleType.SUPERADMIN:
        if current_user.organization_id != user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign roles to users in your own organization"
            )

    # Update role
    user.role = role_data.role
    db.commit()
    db.refresh(user)

    return user


# =====================================================================
# GET AVAILABLE ROLES
# =====================================================================

@router.get("/roles/available", response_model=AvailableRolesResponse)
async def get_available_roles(
        current_user: CurrentUser = Depends(get_current_user)
):
    """
    Get list of roles that the current user can assign.

    Returns different role lists based on user's role:
    - SUPERADMIN: All roles
    - ORG_ADMIN: All except SUPERADMIN and ORG_ADMIN
    - CEO: Limited operational roles
    """

    available_roles = []
    descriptions = {}

    if current_user.role_type == RoleType.SUPERADMIN:
        available_roles = [role.value for role in RoleType]
        descriptions = {role.value: f"{role.value} role" for role in RoleType}
    elif current_user.role_type == RoleType.ORG_ADMIN:
        available_roles = [
            RoleType.CEO.value,
            RoleType.EXECUTIVE.value,
            RoleType.MARKETING.value,
            RoleType.SALES.value,
            RoleType.EVENT_ORGANIZER.value,
            RoleType.DONOR.value,
        ]
        descriptions = {role: f"{role} role" for role in available_roles}
    elif current_user.role_type == RoleType.CEO:
        available_roles = [
            RoleType.EXECUTIVE.value,
            RoleType.MARKETING.value,
            RoleType.SALES.value,
            RoleType.EVENT_ORGANIZER.value,
            RoleType.DONOR.value,
        ]
        descriptions = {role: f"{role} role" for role in available_roles}

    return AvailableRolesResponse(
        available_roles=available_roles,
        your_role=current_user.role,
        descriptions=descriptions
    )
