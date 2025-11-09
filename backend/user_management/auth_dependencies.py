# auth_dependencies.py - FastAPI Authorization Dependencies
"""
FastAPI dependencies for JWT authentication and role-based authorization
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from database import get_db
from user_management.rbac_extra_roles import RoleType, Permission, has_permission, can_access_organization, can_assign_role
# from database import get_db  # Your database dependency
# from models import User  # Your User model

# JWT Configuration (move these to config/env)
SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"  # Use environment variable
ALGORITHM = "HS256"

security = HTTPBearer()


class CurrentUser:
    """Current authenticated user"""
    def __init__(self, id: UUID, email: str, organization_id: Optional[UUID],
                 role: str, is_superadmin: bool = False):
        self.id = id
        self.email = email
        self.organization_id = organization_id
        self.role = role
        self.is_superadmin = is_superadmin
        #self.role_type = RoleType(role) if not is_superadmin else RoleType.SUPERADMIN
    @property
    def role_type(self) -> RoleType:
        """Map database roles to RoleType enum with backward compatibility"""
        if self.is_superadmin:
            return RoleType.SUPERADMIN

        # Map old database roles to new RoleType enum values
        role_map = {
            "admin": "org_admin",
            "manager": "executive",
            "staff": "marketing",
            "volunteer": "donor",
            "board_member": "ceo",
            'org_admin':'org_admin',
            'ceo':'ceo',
            'executive':'executive',
            'major_gifts':'major_gifts',
            'director_annual_giving':'director_annual_giving',
            'planned_giving':'planned_giving',
            'corporate_foundations':'corporate_foundations',
            'stewardship':'stewardship',
            'membership':'membership',
            'marketing_comms':'marketing_comms',
            'digital_strategy':'digital_strategy','sales_team':'sales_team','event_organizer':'event_organizer','donor':'donor'
        }

        # Get mapped role or use original if no mapping exists
        mapped_role = role_map.get(self.role, self.role)

        try:
            return RoleType(mapped_role)
        except ValueError:
            # Fallback if role is still invalid
            return RoleType.DONOR


def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)  # Uncomment when database is configured
) -> CurrentUser:
    """
    Dependency to get the current authenticated user from JWT token
    """
    token = credentials.credentials
    payload = decode_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    # In production, fetch user from database
    # user = db.query(User).filter(User.id == user_id).first()
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")

    # For now, return user from token payload
    return CurrentUser(
        id=UUID(user_id),
        email=payload.get("email"),
        organization_id=UUID(payload.get("organization_id")) if payload.get("organization_id") else None,
        role=payload.get("role"),
        is_superadmin=payload.get("is_superadmin", False)
    )


def require_permission(required_permission: Permission):
    """
    Dependency factory to check if user has a specific permission

    Usage:
        @app.get("/protected")
        async def protected_route(
            current_user: CurrentUser = Depends(require_permission(Permission.READ_ANALYTICS))
        ):
            return {"message": "You have access"}
    """
    async def permission_checker(
            current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if not has_permission(current_user.role_type, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission: {required_permission.value}"
            )
        return current_user

    return permission_checker


def require_any_permission(*required_permissions: Permission):
    """
    Dependency factory to check if user has ANY of the specified permissions

    Usage:
        @app.get("/protected")
        async def protected_route(
            current_user: CurrentUser = Depends(
                require_any_permission(Permission.READ_ANALYTICS, Permission.READ_FINANCIALS)
            )
        ):
            return {"message": "You have access"}
    """
    async def permission_checker(
            current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        has_any = any(
            has_permission(current_user.role_type, perm)
            for perm in required_permissions
        )

        if not has_any:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You need one of these permissions: {[p.value for p in required_permissions]}"
            )
        return current_user

    return permission_checker


def require_role(*allowed_roles: RoleType):
    """
    Dependency factory to check if user has one of the allowed roles

    Usage:
        @app.get("/admin-only")
        async def admin_route(
            current_user: CurrentUser = Depends(require_role(RoleType.SUPERADMIN, RoleType.ORG_ADMIN))
        ):
            return {"message": "Admin access granted"}
    """
    async def role_checker(
            current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if current_user.role_type not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of these roles: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker


def require_organization_access(target_org_id: UUID):
    """
    Dependency factory to check if user can access a specific organization

    Usage:
        @app.get("/organizations/{org_id}/data")
        async def get_org_data(
            org_id: UUID,
            current_user: CurrentUser = Depends(require_organization_access(org_id))
        ):
            return {"message": "Access granted"}
    """
    async def org_access_checker(
            current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if not can_access_organization(
                current_user.role_type,
                str(current_user.organization_id) if current_user.organization_id else None,
                str(target_org_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this organization"
            )
        return current_user

    return org_access_checker


async def require_superadmin(
        current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency to require superadmin access"""
    if current_user.role_type != RoleType.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user


async def require_org_admin(
        current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency to require org admin or higher access"""
    if current_user.role_type not in [RoleType.SUPERADMIN, RoleType.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator access required"
        )
    return current_user


async def require_user_management_permission(
        current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency specifically for user management operations"""
    if not has_permission(current_user.role_type, Permission.CREATE_USER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User management permission required"
        )
    return current_user


def verify_role_assignment(target_role: str):
    """
    Dependency factory to verify if current user can assign a specific role

    Usage:
        @app.post("/users")
        async def create_user(
            user_data: UserCreate,
            current_user: CurrentUser = Depends(verify_role_assignment(user_data.role))
        ):
            # Create user logic
    """
    async def role_assignment_checker(
            current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        try:
            target_role_type = RoleType(target_role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {target_role}"
            )

        if not can_assign_role(current_user.role_type, target_role_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to assign the role: {target_role}"
            )
        return current_user

    return role_assignment_checker


# Utility function to check organization match
def verify_organization_match(
        current_user: CurrentUser,
        resource_org_id: UUID,
        resource_name: str = "resource"
):
    """
    Verify that a user has access to a resource in a specific organization

    Args:
        current_user: The current authenticated user
        resource_org_id: The organization ID of the resource
        resource_name: Name of the resource for error message

    Raises:
        HTTPException: If user doesn't have access
    """
    if current_user.role_type == RoleType.SUPERADMIN:
        return  # Superadmin can access all

    if current_user.organization_id != resource_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have access to this {resource_name}"
        )
