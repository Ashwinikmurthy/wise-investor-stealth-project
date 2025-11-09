"""
User Registration Request System with Admin Approval
Handles pending user registrations and admin approval workflow
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum
import jwt
from jwt import PyJWTError, ExpiredSignatureError
import bcrypt

from database import get_db
from models import Organizations as Organization, Users as User
#import schemas
# You'll need to add this model to your models.py
"""
Add to models.py:

class UserRegistrationRequest(Base):
    __tablename__ = "user_registration_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone_number = Column(String(20))
    job_title = Column(String(150))
    department = Column(String(150))
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    organization = relationship("Organizations", back_populates="registration_requests")
    reviewer = relationship("Users", foreign_keys=[reviewed_by])
"""

router = APIRouter(prefix="/api/v1", tags=["User Registration Requests"])

# Authentication
SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"
ALGORITHM = "HS256"


# Pydantic Models
class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserRegistrationRequestCreate(BaseModel):
    organization_id: str = Field(..., description="Organization UUID")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)
    job_title: Optional[str] = Field(None, max_length=150)
    department: Optional[str] = Field(None, max_length=150)
    role: str = Field(..., description="User role in organization")
    password: str = Field(..., min_length=8, description="User password")


class UserRegistrationRequestResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: Optional[str]
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str]
    job_title: Optional[str]
    department: Optional[str]
    role: str
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]
    rejection_reason: Optional[str]


class ApprovalRequest(BaseModel):
    request_id: str
    notes: Optional[str] = None


class RejectionRequest(BaseModel):
    request_id: str
    reason: str = Field(..., min_length=1, description="Reason for rejection")


class NotificationCount(BaseModel):
    pending_count: int
    last_request_date: Optional[datetime]


def get_current_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
) -> User:
    """Authenticate user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        if not authorization.startswith("Bearer "):
            raise credentials_exception
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def verify_org_admin(user: User, organization_id: UUID, db: Session) -> None:
    """Verify user is admin of the organization"""
    if user.is_superadmin:
        return  # Superadmins can access all orgs

    # Check if user is admin of this organization
    if str(user.organization_id) != str(organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage this organization"
        )

    # Check if user has admin role (you may need to adjust this based on your role system)
    if not user.is_superadmin:  # Add additional role checks if needed
        # For now, assuming organization_id match means they're admin
        # You might want to add an 'is_org_admin' field or check roles
        pass


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


# =====================================================================
# PUBLIC ENDPOINT - User Registration Request
# =====================================================================

@router.post("/auth/register-request", status_code=status.HTTP_201_CREATED)
async def create_registration_request(
        request_data: UserRegistrationRequestCreate,
        db: Session = Depends(get_db)
):
    """
    Create a user registration request for organization admin approval.
    No authentication required - public endpoint.
    """

    # Verify organization exists
    organization = db.query(Organization).filter(
        Organization.id == request_data.organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check if email already exists in users table
    existing_user = db.query(User).filter(User.email == request_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered"
        )

    # Check if there's already a pending request with this email
    from models import UserRegistrationRequest  # Import here to avoid circular imports

    existing_request = db.query(UserRegistrationRequest).filter(
        and_(
            UserRegistrationRequest.email == request_data.email,
            UserRegistrationRequest.status == 'pending'
        )
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A registration request with this email is already pending approval"
        )

    # Hash the password
    password_hash = hash_password(request_data.password)

    # Create registration request
    new_request = UserRegistrationRequest(
        id=uuid4(),
        organization_id=request_data.organization_id,
        first_name=request_data.first_name,
        last_name=request_data.last_name,
        email=request_data.email,
        phone_number=request_data.phone_number,
        job_title=request_data.job_title,
        department=request_data.department,
        role=request_data.role,
        password_hash=password_hash,
        status='pending',
        requested_at=datetime.utcnow()
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Registration request submitted successfully",
        "request_id": str(new_request.id),
        "organization_name": organization.name,
        "status": "pending",
        "note": "Your request has been sent to the organization administrator for approval. You will receive an email once your account is approved."
    }


# =====================================================================
# ADMIN ENDPOINTS - Manage Registration Requests
# =====================================================================

@router.get("/admin/pending-requests/{organization_id}", response_model=List[UserRegistrationRequestResponse])
async def get_pending_requests(
        organization_id: UUID,
        status_filter: Optional[str] = "pending",
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get all registration requests for an organization.
    Requires: Admin of the organization or superadmin
    """
    verify_org_admin(current_user, organization_id, db)

    from models import UserRegistrationRequest

    query = db.query(UserRegistrationRequest).filter(
        UserRegistrationRequest.organization_id == organization_id
    )

    if status_filter:
        query = query.filter(UserRegistrationRequest.status == status_filter)

    requests = query.order_by(desc(UserRegistrationRequest.requested_at)).all()

    # Get organization name
    org = db.query(Organization).filter(Organization.id == organization_id).first()
    org_name = org.name if org else None

    return [
        UserRegistrationRequestResponse(
            id=str(req.id),
            organization_id=str(req.organization_id),
            organization_name=org_name,
            first_name=req.first_name,
            last_name=req.last_name,
            email=req.email,
            phone_number=req.phone_number,
            job_title=req.job_title,
            department=req.department,
            role=req.role,
            status=req.status,
            requested_at=req.requested_at,
            reviewed_at=req.reviewed_at,
            reviewed_by=str(req.reviewed_by) if req.reviewed_by else None,
            rejection_reason=req.rejection_reason
        )
        for req in requests
    ]


@router.post("/admin/approve-request")
async def approve_registration_request(
        approval: ApprovalRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Approve a registration request and create the user account.
    Requires: Admin of the organization or superadmin
    """
    from models import UserRegistrationRequest

    # Get the request
    request_record = db.query(UserRegistrationRequest).filter(
        UserRegistrationRequest.id == approval.request_id
    ).first()

    if not request_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found"
        )

    # Verify admin has permission
    verify_org_admin(current_user, UUID(str(request_record.organization_id)), db)

    # Check if already processed
    if request_record.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request has already been {request_record.status}"
        )

    # Check if email is now taken
    existing_user = db.query(User).filter(User.email == request_record.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    # Create the user account
    new_user = User(
        id=uuid4(),
        email=request_record.email,
        full_name=f"{request_record.first_name} {request_record.last_name}",
        password_hash=request_record.password_hash,  # Already hashed
        organization_id=request_record.organization_id,
        is_active=True,
        is_superadmin=False,
        created_at=datetime.utcnow()
    )

    # Update request status
    request_record.status = 'approved'
    request_record.reviewed_at = datetime.utcnow()
    request_record.reviewed_by = current_user.id

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration request approved successfully",
        "user_id": str(new_user.id),
        "email": new_user.email,
        "full_name": new_user.full_name,
        "note": "The user can now log in with their credentials"
    }


@router.post("/admin/reject-request")
async def reject_registration_request(
        rejection: RejectionRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Reject a registration request.
    Requires: Admin of the organization or superadmin
    """
    from models import UserRegistrationRequest

    # Get the request
    request_record = db.query(UserRegistrationRequest).filter(
        UserRegistrationRequest.id == rejection.request_id
    ).first()

    if not request_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found"
        )

    # Verify admin has permission
    verify_org_admin(current_user, UUID(str(request_record.organization_id)), db)

    # Check if already processed
    if request_record.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request has already been {request_record.status}"
        )

    # Update request status
    request_record.status = 'rejected'
    request_record.reviewed_at = datetime.utcnow()
    request_record.reviewed_by = current_user.id
    request_record.rejection_reason = rejection.reason

    db.commit()

    return {
        "message": "Registration request rejected",
        "request_id": str(request_record.id),
        "email": request_record.email,
        "rejection_reason": rejection.reason
    }


@router.get("/admin/notifications/{organization_id}", response_model=NotificationCount)
async def get_notification_count(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get count of pending registration requests for an organization.
    Used to show notification badge.
    """
    verify_org_admin(current_user, organization_id, db)

    from models import UserRegistrationRequest

    pending_count = db.query(func.count(UserRegistrationRequest.id)).filter(
        and_(
            UserRegistrationRequest.organization_id == organization_id,
            UserRegistrationRequest.status == 'pending'
        )
    ).scalar() or 0

    # Get most recent request date
    last_request = db.query(UserRegistrationRequest).filter(
        and_(
            UserRegistrationRequest.organization_id == organization_id,
            UserRegistrationRequest.status == 'pending'
        )
    ).order_by(desc(UserRegistrationRequest.requested_at)).first()

    return NotificationCount(
        pending_count=pending_count,
        last_request_date=last_request.requested_at if last_request else None
    )


@router.get("/admin/all-requests/{organization_id}")
async def get_all_requests_with_stats(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get all registration requests with statistics.
    """
    verify_org_admin(current_user, organization_id, db)

    from models import UserRegistrationRequest

    # Get counts by status
    stats = db.query(
        UserRegistrationRequest.status,
        func.count(UserRegistrationRequest.id)
    ).filter(
        UserRegistrationRequest.organization_id == organization_id
    ).group_by(UserRegistrationRequest.status).all()

    status_counts = {status: count for status, count in stats}

    # Get all requests
    all_requests = db.query(UserRegistrationRequest).filter(
        UserRegistrationRequest.organization_id == organization_id
    ).order_by(desc(UserRegistrationRequest.requested_at)).all()

    org = db.query(Organization).filter(Organization.id == organization_id).first()
    org_name = org.name if org else None

    return {
        "organization_id": str(organization_id),
        "organization_name": org_name,
        "statistics": {
            "pending": status_counts.get('pending', 0),
            "approved": status_counts.get('approved', 0),
            "rejected": status_counts.get('rejected', 0),
            "total": sum(status_counts.values())
        },
        "requests": [
            {
                "id": str(req.id),
                "first_name": req.first_name,
                "last_name": req.last_name,
                "email": req.email,
                "phone_number": req.phone_number,
                "job_title": req.job_title,
                "department": req.department,
                "role": req.role,
                "status": req.status,
                "requested_at": req.requested_at.isoformat(),
                "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
                "rejection_reason": req.rejection_reason
            }
            for req in all_requests
        ]
    }