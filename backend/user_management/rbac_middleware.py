# rbac_middleware.py - RBAC Implementation for FastAPI
"""
RBAC middleware and decorators for enforcing permissions in FastAPI endpoints
"""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import jwt
from jwt import PyJWTError, ExpiredSignatureError
from uuid import UUID
from functools import wraps

from database import get_db
from models import Users as User
from rbac_nonprofit_enhanced import (
    RoleType,
    Permission,
    has_permission,
    can_access_organization,
    can_access_analytics
)


# JWT Configuration (should match your auth.py)
SECRET_KEY = "Ka9-vewwbRsuH6SKtdVVz_W1YLxLOjBsKHP165frUNU1peeFoaihU5BcWpTmz3YE4VxDjWk5oUME7kD1JEZGuA"
ALGORITHM = "HS256"


# =====================================================================
# AUTHENTICATION - Get Current User
# =====================================================================

def get_current_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
) -> User:
    """
    Extract and validate JWT token, return current user
    This is the base authentication function
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise credentials_exception

        token = authorization.replace("Bearer ", "")

        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


# =====================================================================
# AUTHORIZATION - Permission Checking
# =====================================================================

def verify_organization_access(user: User, organization_id: UUID) -> None:
    """
    Verify user has access to the requested organization
    Raises HTTPException if access denied
    """
    if user.is_superadmin:
        return  # Superadmins have access to all orgs

    if str(user.organization_id) != str(organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this organization's data"
        )


def require_permission(required_permission: Permission):
    """
    Dependency that checks if current user has required permission

    Usage in endpoint:
        @router.get("/endpoint")
        async def my_endpoint(
            current_user: User = Depends(require_permission(Permission.READ_DONATIONS))
        ):
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = RoleType(current_user.role)

        if not has_permission(user_role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required permission: {required_permission.value}"
            )

        return current_user

    return permission_checker


def require_any_permission(required_permissions: List[Permission]):
    """
    Dependency that checks if user has ANY of the required permissions

    Usage:
        @router.get("/endpoint")
        async def my_endpoint(
            current_user: User = Depends(
                require_any_permission([Permission.READ_ANALYTICS, Permission.READ_EXECUTIVE_DASHBOARD])
            )
        ):
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = RoleType(current_user.role)

        has_any = any(has_permission(user_role, perm) for perm in required_permissions)

        if not has_any:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required one of: {[p.value for p in required_permissions]}"
            )

        return current_user

    return permission_checker


def require_all_permissions(required_permissions: List[Permission]):
    """
    Dependency that checks if user has ALL of the required permissions
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = RoleType(current_user.role)

        has_all = all(has_permission(user_role, perm) for perm in required_permissions)

        if not has_all:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required all of: {[p.value for p in required_permissions]}"
            )

        return current_user

    return permission_checker


def require_role(allowed_roles: List[RoleType]):
    """
    Dependency that checks if user has one of the allowed roles

    Usage:
        @router.get("/endpoint")
        async def my_endpoint(
            current_user: User = Depends(
                require_role([RoleType.CEO, RoleType.EXECUTIVE, RoleType.ORG_ADMIN])
            )
        ):
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = RoleType(current_user.role)

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {[r.value for r in allowed_roles]}"
            )

        return current_user

    return role_checker


# =====================================================================
# COMBINED CHECKS - Organization + Permission
# =====================================================================

class OrganizationAccessChecker:
    """
    Dependency class that checks both organization access and permissions

    Usage:
        @router.get("/analytics/{organization_id}")
        async def get_analytics(
            organization_id: UUID,
            current_user: User = Depends(
                OrganizationAccessChecker(Permission.READ_ANALYTICS)
            )
        ):
    """

    def __init__(self, required_permission: Optional[Permission] = None):
        self.required_permission = required_permission

    def __call__(
            self,
            organization_id: UUID,
            current_user: User = Depends(get_current_user)
    ) -> User:
        # Check organization access
        verify_organization_access(current_user, organization_id)

        # Check permission if specified
        if self.required_permission:
            user_role = RoleType(current_user.role)
            if not has_permission(user_role, self.required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {self.required_permission.value}"
                )

        return current_user


# =====================================================================
# ANALYTICS-SPECIFIC CHECKS
# =====================================================================

def require_analytics_access(analytics_type: str = "general"):
    """
    Dependency for analytics endpoints with specific type checking

    Usage:
        @router.get("/analytics/executive-dashboard/{organization_id}")
        async def get_executive_dashboard(
            organization_id: UUID,
            current_user: User = Depends(require_analytics_access("executive"))
        ):
    """
    def analytics_checker(
            organization_id: UUID,
            current_user: User = Depends(get_current_user)
    ) -> User:
        # Check organization access
        verify_organization_access(current_user, organization_id)

        # Check analytics permission
        user_role = RoleType(current_user.role)
        if not can_access_analytics(user_role, analytics_type):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied to {analytics_type} analytics"
            )

        return current_user

    return analytics_checker


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

def can_user_edit_resource(
        user: User,
        resource_org_id: UUID,
        required_permission: Permission
) -> bool:
    """
    Check if user can edit a specific resource
    Returns True if user has permission and organization access
    """
    # Check organization access
    if not user.is_superadmin:
        if str(user.organization_id) != str(resource_org_id):
            return False

    # Check permission
    user_role = RoleType(user.role)
    return has_permission(user_role, required_permission)


def filter_by_organization_access(
        user: User,
        query,
        organization_field
):
    """
    Add organization filter to query based on user's access

    Usage:
        query = db.query(Donation)
        query = filter_by_organization_access(user, query, Donation.organization_id)
    """
    if user.is_superadmin:
        return query  # Superadmins see everything

    return query.filter(organization_field == user.organization_id)


def get_accessible_organization_ids(user: User, db: Session) -> List[UUID]:
    """
    Get list of organization IDs the user can access
    For superadmins, returns all org IDs
    For regular users, returns only their org ID
    """
    if user.is_superadmin:
        from models_bkp import Organization
        orgs = db.query(Organization.id).all()
        return [org.id for org in orgs]

    return [user.organization_id]


# =====================================================================
# LOGGING & AUDIT
# =====================================================================

def log_access_attempt(
        user: User,
        endpoint: str,
        permission: Permission,
        success: bool,
        organization_id: Optional[UUID] = None
):
    """
    Log access attempts for audit trail
    This should write to your audit_logs table
    """
    # TODO: Implement audit logging
    pass


# =====================================================================
# DECORATOR STYLE (Alternative approach)
# =====================================================================

def check_permission(permission: Permission):
    """
    Decorator for checking permissions

    Usage:
        @check_permission(Permission.READ_ANALYTICS)
        async def my_function(user: User, ...):
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found in context"
                )

            user_role = RoleType(user.role)
            if not has_permission(user_role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission.value}"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator