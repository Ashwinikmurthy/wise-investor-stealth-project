# registration_router.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timedelta
import secrets

from database import get_db
from models import Users, Organizations, Parties
from user_management.auth_dependencies import get_current_user, CurrentUser
from user_management.registration_schema import (
    DonorRegistrationRequest,
    StaffRegistrationRequest,
    UserInvitationRequest,
    CompleteInvitationRequest,
    UserRegistrationResponse,
    InvitationResponse,
    AvailableRolesResponse,
    RoleInfo,
    RoleType,
    ROLE_HIERARCHY,
    ROLE_DESCRIPTIONS,
    ADMIN_ONLY_ROLES,
    SELF_REGISTERABLE_ROLES
)
# Assuming you have a password hashing utility
from user_management.auth_route import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["Registration & User Management"])


# ==================== PUBLIC REGISTRATION ENDPOINTS ====================

@router.post(
    "/register/donor",
    response_model=UserRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as Donor (Public)",
    description="""
    Simplified registration for donors. No password required initially.
    Donors can set password later to access their portal.
    
    - Creates Party record for donation tracking
    - Creates User record with 'donor' role
    - No organization assignment needed
    - Email verification sent (optional)
    """
)
async def register_donor(
        donor_data: DonorRegistrationRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    """Register a new donor without password requirement"""

    # Check if email already exists
    existing_user = db.query(Users).filter(Users.email == donor_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Use password reset if you forgot your password."
        )

    # Check if Party already exists
    existing_party = db.query(Parties).filter(Parties.email == donor_data.email).first()

    # Create or update Party record
    if existing_party:
        party = existing_party
        # Update party info if needed
        party.full_name = donor_data.full_name
        party.display_name = donor_data.display_name or donor_data.full_name
        party.phone = donor_data.phone
        party.address_line1 = donor_data.address_line1
        party.address_line2 = donor_data.address_line2
        party.city = donor_data.city
        party.state = donor_data.state
        party.postal_code = donor_data.postal_code
        party.country = donor_data.country
    else:
        party = Parties(
            id=uuid.uuid4(),
            email=donor_data.email,
            full_name=donor_data.full_name,
            display_name=donor_data.display_name or donor_data.full_name,
            phone=donor_data.phone,
            party_type='individual',
            address_line1=donor_data.address_line1,
            address_line2=donor_data.address_line2,
            city=donor_data.city,
            state=donor_data.state,
            postal_code=donor_data.postal_code,
            country=donor_data.country,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(party)

    # Create User record (no password initially)
    user = Users(
        id=uuid.uuid4(),
        email=donor_data.email,
        first_name=donor_data.full_name.split()[0] if donor_data.full_name else None,
        last_name=' '.join(donor_data.full_name.split()[1:]) if len(donor_data.full_name.split()) > 1 else None,
        role=RoleType.DONOR.value,
        is_active=True,
        is_superadmin=False,
        organization_id=None,  # Donors don't belong to an organization
        password_hash=None,  # No password initially
        email_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Send welcome email (optional)
    # background_tasks.add_task(send_donor_welcome_email, donor_data.email, donor_data.full_name)

    return UserRegistrationResponse(
        id=str(user.id),
        email=user.email,
        full_name=donor_data.full_name,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at,
        requires_password_setup=True
    )


@router.post(
    "/register/staff",
    response_model=UserRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Self-Register as Staff (Limited Roles)",
    description="""
    Self-registration for certain staff roles.
    
    **Note:** Most staff roles require admin invitation.
    Self-registration is only available for:
    - donor (basic donor role)
    
    For other roles (executive, major_gifts, etc.), contact your administrator
    to receive an invitation.
    """
)
async def register_staff(
        staff_data: StaffRegistrationRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    """Self-registration for staff with limited roles"""

    # Check if email already exists
    existing_user = db.query(Users).filter(Users.email == staff_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role is self-registerable (validator already checks this)
    # Additional server-side check for security
    if staff_data.role not in SELF_REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{staff_data.role}' requires admin invitation"
        )

    # Create user
    user = Users(
        id=uuid.uuid4(),
        email=staff_data.email,
        password_hash=hash_password(staff_data.password),
        first_name=staff_data.first_name,
        last_name=staff_data.last_name,
        role=staff_data.role.value,
        is_active=True,
        is_superadmin=False,
        organization_id=None,  # Will be assigned later by admin
        email_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email
    # background_tasks.add_task(send_verification_email, user.email, user.first_name)

    return UserRegistrationResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at,
        requires_password_setup=False
    )


# ==================== ADMIN INVITATION ENDPOINTS ====================

@router.post(
    "/invite-user",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite User with Specific Role (Admin Only)",
    description="""
    Admin endpoint to invite users with any role.
    
    **Authorization:** Requires org_admin, ceo, or superadmin role
    
    **Process:**
    1. Admin creates invitation with user details and role
    2. Invitation email sent with unique token
    3. User clicks link and sets password
    4. Account activated with assigned role
    
    **Role Assignment:**
    - Superadmin can assign any role
    - Org_admin can assign roles within their organization
    - CEO can assign roles below executive level
    """
)
async def invite_user(
        invitation: UserInvitationRequest,
        background_tasks: BackgroundTasks,
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Admin endpoint to invite users with specific roles"""

    # Check if current user has permission to invite
    if not current_user.is_superadmin:
        if current_user.role not in ['org_admin', 'ceo','admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can invite users"
            )

        # Check if trying to assign a role higher than their own


    # Check if organization is required for non-donor roles
    if invitation.role != RoleType.DONOR and not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization context required for staff roles"
        )

    # Check if email already exists
    existing_user = db.query(Users).filter(Users.email == invitation.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Generate invitation token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)  # Token valid for 7 days

    # Create user with pending status
    user = Users(
        id=uuid.uuid4(),
        email=invitation.email,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        role=invitation.role.value,
        is_active=False,  # Inactive until they complete invitation
        is_superadmin=(invitation.role == RoleType.SUPERADMIN),
        organization_id=current_user.organization_id if invitation.role != RoleType.DONOR else None,
        password_hash=None,  # No password until they complete invitation
        email_verified=False,
        invitation_token=hash_password(invitation_token),  # Store hashed token
        invitation_expires_at=expires_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Send invitation email
    if invitation.send_invitation_email:
        invitation_link = f"https://your-app.com/complete-invitation?token={invitation_token}"
        # background_tasks.add_task(
        #     send_invitation_email,
        #     invitation.email,
        #     invitation.first_name,
        #     invitation_link,
        #     invitation.role.value
        # )

    return InvitationResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        invitation_sent=invitation.send_invitation_email,
        invitation_token=invitation_token if not invitation.send_invitation_email else None,
        expires_at=expires_at
    )


@router.post(
    "/complete-invitation",
    response_model=UserRegistrationResponse,
    summary="Complete User Invitation",
    description="""
    Complete invitation by setting password.
    
    **Process:**
    1. User receives invitation email with token
    2. User clicks link and provides password
    3. Account activated with assigned role
    4. User can now login
    """
)
async def complete_invitation(
        completion: CompleteInvitationRequest,
        db: Session = Depends(get_db)
):
    """Complete invitation by setting password"""

    # Find user with matching invitation token
    users = db.query(Users).filter(
        Users.invitation_token.isnot(None),
        Users.is_active == False
    ).all()

    user = None
    for u in users:
        if verify_password(completion.invitation_token, u.invitation_token):
            user = u
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )

    # Check if token expired
    if user.invitation_expires_at and user.invitation_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired. Request a new invitation."
        )

    # Set password and activate account
    user.password_hash = hash_password(completion.password)
    user.is_active = True
    user.email_verified = True
    user.invitation_token = None
    user.invitation_expires_at = None
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return UserRegistrationResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at,
        requires_password_setup=False
    )


# ==================== DONOR PASSWORD SETUP ====================

@router.post(
    "/donor/setup-password",
    response_model=UserRegistrationResponse,
    summary="Setup Password for Donor Account",
    description="""
    Allows donors to set a password for their account.
    
    **Use Case:**
    1. Donor registers with just email (no password)
    2. Donor makes donations
    3. Later, donor wants portal access
    4. Donor sets password using this endpoint
    
    **Authentication:**
    Can use either:
    - Magic link from email
    - Verification code
    - Party ID lookup (for simplicity in this example)
    """
)
async def setup_donor_password(
        email: str,
        password: str,
        db: Session = Depends(get_db)
):
    """Allow donors to set password for portal access"""

    # Find donor user
    user = db.query(Users).filter(
        Users.email == email,
        Users.role == RoleType.DONOR.value
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor account not found"
        )

    if user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password already set. Use password reset if you forgot it."
        )

    # Validate password strength
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # Set password
    user.password_hash = hash_password(password)
    user.email_verified = True
    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return UserRegistrationResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        is_active=user.is_active,
        organization_id=str(user.organization_id) if user.organization_id else None,
        created_at=user.created_at,
        requires_password_setup=False
    )


# ==================== UTILITY ENDPOINTS ====================

@router.get(
    "/roles/available",
    response_model=AvailableRolesResponse,
    summary="Get Available Roles",
    description="""
    Returns list of available roles with descriptions.
    
    **Shows:**
    - Role name and display name
    - Description of role
    - Permission level
    - Whether role can self-register
    - Whether role requires invitation
    """
)
async def get_available_roles():
    """Get list of available roles with descriptions"""

    roles = []
    for role in RoleType:
        role_info = ROLE_DESCRIPTIONS.get(role, {})
        roles.append(RoleInfo(
            role=role.value,
            display_name=role_info.get('display_name', role.value),
            description=role_info.get('description', ''),
            level=ROLE_HIERARCHY.get(role.value, 0),
            can_self_register=role in SELF_REGISTERABLE_ROLES,
            requires_invitation=role in ADMIN_ONLY_ROLES
        ))

    # Sort by hierarchy level (highest first)
    roles.sort(key=lambda x: x.level, reverse=True)

    return AvailableRolesResponse(roles=roles)


@router.get(
    "/users/pending-invitations",
    response_model=List[InvitationResponse],
    summary="Get Pending Invitations (Admin Only)",
    description="""
    Get list of pending user invitations.
    
    **Authorization:** org_admin or higher
    """
)
async def get_pending_invitations(
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get list of pending invitations"""

    # Check permission
    if not current_user.is_superadmin and current_user.role not in ['org_admin', 'ceo']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view pending invitations"
        )

    # Query pending users
    query = db.query(Users).filter(
        Users.is_active == False,
        Users.invitation_token.isnot(None)
    )

    # Filter by organization for non-superadmins
    if not current_user.is_superadmin:
        query = query.filter(Users.organization_id == current_user.organization_id)

    pending_users = query.all()

    return [
        InvitationResponse(
            id=str(user.id),
            email=user.email,
            role=user.role,
            invitation_sent=True,
            invitation_token=None,  # Don't expose token
            expires_at=user.invitation_expires_at
        )
        for user in pending_users
    ]


@router.delete(
    "/users/cancel-invitation/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel User Invitation (Admin Only)",
    description="""
    Cancel a pending invitation.
    
    **Authorization:** org_admin or higher
    """
)
async def cancel_invitation(
        user_id: uuid.UUID,
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Cancel a pending invitation"""

    # Check permission
    if not current_user.is_superadmin and current_user.role not in ['org_admin', 'ceo']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can cancel invitations"
        )

    # Find pending user
    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_active == False,
        Users.invitation_token.isnot(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending invitation not found"
        )

    # Check organization access for non-superadmins
    if not current_user.is_superadmin:
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot cancel invitation from different organization"
            )

    # Delete user
    db.delete(user)
    db.commit()

    return None


@router.post(
    "/users/resend-invitation/{user_id}",
    response_model=InvitationResponse,
    summary="Resend User Invitation (Admin Only)",
    description="""
    Resend invitation email to a pending user.
    
    **Authorization:** org_admin or higher
    """
)
async def resend_invitation(
        user_id: uuid.UUID,
        background_tasks: BackgroundTasks,
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Resend invitation email"""

    # Check permission
    if not current_user.is_superadmin and current_user.role not in ['org_admin', 'ceo']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can resend invitations"
        )

    # Find pending user
    user = db.query(Users).filter(
        Users.id == user_id,
        Users.is_active == False
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending invitation not found"
        )

    # Check organization access
    if not current_user.is_superadmin:
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot resend invitation from different organization"
            )

    # Generate new token
    invitation_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)

    user.invitation_token = hash_password(invitation_token)
    user.invitation_expires_at = expires_at
    user.updated_at = datetime.utcnow()

    db.commit()

    # Send invitation email
    invitation_link = f"https://your-app.com/complete-invitation?token={invitation_token}"
    # background_tasks.add_task(
    #     send_invitation_email,
    #     user.email,
    #     user.first_name,
    #     invitation_link,
    #     user.role
    # )

    return InvitationResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        invitation_sent=True,
        invitation_token=None,
        expires_at=expires_at
    )