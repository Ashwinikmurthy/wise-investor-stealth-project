"""
Superadmin API Routes
Endpoints for superadmin to manage organizations and users
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uuid
import hashlib
from database import get_db
from models import Organizations as Organization, Users as User, Donations as Donation, Donors as Donor
#from new_models import Donor
from user_management.superadmin_schemas import (
    SuperadminLogin,
    TokenResponse,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationWithUsers,
    UserCreateBySuperadmin,
    UserResponse,
    SuperadminDashboard
)
from user_management.superadmin_auth import (
    get_current_superadmin,
    verify_superadmin_credentials,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(
    prefix="/api/v1/superadmin",
    tags=["Superadmin"]
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__ident="2b",)


def hash_password(password: str) -> str:
    """Hash a password"""
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return pwd_context.hash(password_hash)
    #return pwd_context.hash(password)


@router.post("/login", response_model=TokenResponse, summary="Superadmin Login")
async def superadmin_login(
        credentials: SuperadminLogin,
        db: Session = Depends(get_db)
):
    """
    Authenticate superadmin and return JWT token

    - **username**: Superadmin username
    - **password**: Superadmin password

    Returns JWT token for subsequent requests
    """
    # Verify credentials
    if not verify_superadmin_credentials(credentials.username, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    user = db.query(User).filter(User.email == credentials.username).first()
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "is_superadmin": True,
            "username": credentials.username
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
        organization: OrganizationCreate,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Create a new organization (Superadmin only)

    - **name**: Organization name (required)
    - **ein**: Employer Identification Number
    - **mission**: Organization mission
    - **website**: Organization website URL
    - **address, city, state, zip_code, country**: Organization location
    - **phone**: Contact phone number
    - **email**: Organization email
    - **fiscal_year_end**: Fiscal year end date (MM-DD format)
    - **annual_budget**: Annual budget amount
    - **is_active**: Organization active status (default: True)
    """
    # Check if organization with same name already exists
    existing_org = db.query(Organization).filter(
        Organization.legal_name == organization.name
    ).first()

    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization with name '{organization.name}' already exists"
        )

    # Check if EIN already exists (if provided)
    if organization.ein:
        existing_ein = db.query(Organization).filter(
            Organization.ein == organization.ein
        ).first()
        if existing_ein:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization with EIN '{organization.ein}' already exists"
            )

    # Create new organization
    db_organization = Organization(
        id=uuid.uuid4(),
        **organization.dict(),
        created_at=datetime.utcnow()
    )

    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)

    return db_organization


@router.get("/organizations", response_model=List[OrganizationWithUsers])
async def list_organizations(
        skip: int = 0,
        limit: int = 100,
        is_active: bool = None,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    List all organizations with user counts (Superadmin only)

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **is_active**: Filter by active status (optional)
    """
    query = db.query(Organization)

    if is_active is not None:
        query = query.filter(Organization.is_active == is_active)

    organizations = query.offset(skip).limit(limit).all()

    # Add user count to each organization
    result = []
    for org in organizations:
        user_count = db.query(User).filter(User.organization_id == org.id).count()
        org_dict = org.__dict__.copy()
        org_dict['user_count'] = user_count
        result.append(org_dict)

    return result


@router.get("/organizations/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
        organization_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Get organization details by ID (Superadmin only)
    """
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    return organization


@router.put("/organizations/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
        organization_id: uuid.UUID,
        organization_update: OrganizationCreate,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Update organization details (Superadmin only)
    """
    db_organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check for duplicate name (excluding current organization)
    if organization_update.name != db_organization.name:
        existing_name = db.query(Organization).filter(
            Organization.name == organization_update.name,
            Organization.id != organization_id
        ).first()
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization with name '{organization_update.name}' already exists"
            )

    # Update fields
    for field, value in organization_update.dict(exclude_unset=True).items():
        setattr(db_organization, field, value)

    db_organization.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_organization)

    return db_organization


@router.delete("/organizations/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
        organization_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Delete an organization (Superadmin only)

    Warning: This will delete all associated users, donors, and data!
    """
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check if organization has users
    user_count = db.query(User).filter(User.organization_id == organization_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete organization with {user_count} users. Delete users first or deactivate the organization."
        )

    db.delete(organization)
    db.commit()

    return None


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
        user: UserCreateBySuperadmin,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Create a new user for an organization (Superadmin only)

    - **email**: User email address (must be unique)
    - **full_name**: User's full name
    - **password**: User password (min 8 chars, must include uppercase, lowercase, and digit)
    - **organization_id**: UUID of the organization
    - **role**: User role (admin, manager, staff)
    - **is_active**: User active status
    - **is_superadmin**: Superadmin flag (use with caution)
    """
    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == user.organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check if user with email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Hash password
    hashed_password = hash_password(user.password)

    # Create new user
    db_user = User(
        id=uuid.uuid4(),
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        organization_id=user.organization_id,
        role=user.role,
        is_active=user.is_active,
        is_superadmin=user.is_superadmin,
        created_at=datetime.utcnow()
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
        organization_id: uuid.UUID = None,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    List all users across all organizations (Superadmin only)

    - **organization_id**: Filter by organization (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = db.query(User)

    if organization_id:
        query = query.filter(User.organization_id == organization_id)

    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
        user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Get user details by ID (Superadmin only)
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
        user_id: uuid.UUID,
        user_update: UserCreateBySuperadmin,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Update user details (Superadmin only)
    """
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check for duplicate email (excluding current user)
    if user_update.email != db_user.email:
        existing_email = db.query(User).filter(
            User.email == user_update.email,
            User.id != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

    # Update fields
    db_user.email = user_update.email
    db_user.full_name = user_update.full_name
    db_user.organization_id = user_update.organization_id
    db_user.role = user_update.role
    db_user.is_active = user_update.is_active
    db_user.is_superadmin = user_update.is_superadmin

    # Update password if provided
    if user_update.password:
        db_user.hashed_password = hash_password(user_update.password)

    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
        user_id: uuid.UUID,
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Delete a user (Superadmin only)
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return None


@router.get("/dashboard", response_model=SuperadminDashboard)
async def get_dashboard_stats(
        db: Session = Depends(get_db),
        current_superadmin: User = Depends(get_current_superadmin)
):
    """
    Get superadmin dashboard statistics (Superadmin only)

    Returns:
    - Total organizations (active and inactive)
    - Total users across all organizations
    - Total donors
    - Total donations amount
    - Organizations created this month
    """
    # Organization stats
    total_orgs = db.query(Organization).count()
    active_orgs = db.query(Organization).filter(Organization.is_active == True).count()
    inactive_orgs = total_orgs - active_orgs

    # Organizations created this month
    current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    orgs_this_month = db.query(Organization).filter(
        Organization.created_at >= current_month_start
    ).count()

    # User stats
    total_users = db.query(User).count()

    # Donor stats
    total_donors = db.query(Donor).count()

    # Donation stats
    total_donations = db.query(func.sum(Donation.amount)).scalar() or 0.0

    return {
        "total_organizations": total_orgs,
        "active_organizations": active_orgs,
        "inactive_organizations": inactive_orgs,
        "total_users": total_users,
        "total_donors": total_donors,
        "total_donations_amount": float(total_donations),
        "organizations_created_this_month": orgs_this_month
    }
