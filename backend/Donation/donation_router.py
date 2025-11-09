"""
Donations API Router
Handles CRUD operations for donations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from uuid import UUID
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field
from decimal import Decimal
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from database import get_db
from models import Donations as Donation, Donors as Donor, Organizations as Organization, Users as User

router = APIRouter(prefix="/api/donations", tags=["Donations"])

# Production Authentication
SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"
ALGORITHM = "HS256"


def get_current_user(
        authorization: str = Header(..., description="Bearer token"),
        db: Session = Depends(get_db)
) -> User:
    """Production JWT authentication"""
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


def verify_organization_access(user: User, organization_id: UUID) -> None:
    """Verify user has access to the requested organization"""
    if user.is_superadmin:
        return
    if user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this organization's data"
        )


# Pydantic Schemas
class DonationBase(BaseModel):
    amount: float = Field(..., description="Donation amount", gt=0)
    donation_date: str = Field(..., description="Date of donation (ISO format)")
    payment_method: Optional[str] = None
    campaign_id: Optional[str] = None
    is_recurring: bool = False
    notes: Optional[str] = None


class DonationCreate(DonationBase):
    donor_id: str = Field(..., description="Donor UUID")


class DonationUpdate(BaseModel):
    amount: Optional[float] = None
    donation_date: Optional[str] = None
    payment_method: Optional[str] = None
    campaign_id: Optional[str] = None
    is_recurring: Optional[bool] = None
    notes: Optional[str] = None


class DonationResponse(BaseModel):
    id: str
    organization_id: str
    donor_id: str
    donor_name: Optional[str] = None
    amount: float
    donation_date: str
    payment_method: Optional[str] = None
    campaign_id: Optional[str] = None
    is_recurring: bool = False
    notes: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# =====================================================================
# GET ALL DONATIONS
# =====================================================================

@router.get("/", response_model=List[DonationResponse])
async def get_donations(
        organization_id: Optional[UUID] = Query(None, description="Filter by organization ID"),
        donor_id: Optional[UUID] = Query(None, description="Filter by donor ID"),
        campaign_id: Optional[UUID] = Query(None, description="Filter by campaign ID"),
        payment_method: Optional[str] = Query(None, description="Filter by payment method"),
        min_amount: Optional[float] = Query(None, description="Minimum donation amount"),
        max_amount: Optional[float] = Query(None, description="Maximum donation amount"),
        start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
        end_date: Optional[str] = Query(None, description="End date (ISO format)"),
        is_recurring: Optional[bool] = Query(None, description="Filter recurring donations"),
        limit: Optional[int] = Query(None, description="Limit number of results"),
        skip: int = Query(0, description="Number of records to skip"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get all donations with optional filtering

    Examples:
    - All donations for org: ?organization_id={uuid}
    - Recent donations: ?organization_id={uuid}&limit=10
    - By donor: ?organization_id={uuid}&donor_id={uuid}
    - By campaign: ?organization_id={uuid}&campaign_id={uuid}
    - Date range: ?organization_id={uuid}&start_date=2025-01-01&end_date=2025-12-31
    - Amount range: ?min_amount=100&max_amount=1000
    """

    # Build query with donor join to get donor name
    query = db.query(Donation, Donor).outerjoin(
        Donor, Donation.donor_id == Donor.id
    )

    # Filter by organization
    if organization_id:
        verify_organization_access(current_user, organization_id)
        query = query.filter(Donation.organization_id == organization_id)
    elif not current_user.is_superadmin:
        # Non-superadmins can only see their org's donations
        query = query.filter(Donation.organization_id == current_user.organization_id)

    # Additional filters
    if donor_id:
        query = query.filter(Donation.donor_id == donor_id)

    if campaign_id:
        query = query.filter(Donation.campaign_id == campaign_id)

    if payment_method:
        query = query.filter(Donation.payment_method == payment_method)

    if min_amount is not None:
        query = query.filter(Donation.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Donation.amount <= max_amount)

    if start_date:
        query = query.filter(Donation.donation_date >= start_date)

    if end_date:
        query = query.filter(Donation.donation_date <= end_date)

    if is_recurring is not None:
        query = query.filter(Donation.is_recurring == is_recurring)

    # Order by donation_date descending (most recent first)
    query = query.order_by(Donation.donation_date.desc())

    # Apply pagination
    if skip:
        query = query.offset(skip)

    if limit:
        query = query.limit(limit)

    results = query.all()

    # Convert to response format
    donations = []
    for donation, donor in results:
        donor_name = None
        if donor:
            # Build donor name from first and last name
            if donor.first_name and donor.last_name:
                donor_name = f"{donor.first_name} {donor.last_name}"
            elif donor.first_name:
                donor_name = donor.first_name
            elif donor.last_name:
                donor_name = donor.last_name
            # Fallback to organization name if individual donor
            #elif donor.organization_id:
             #   donor_name = donor.organization_id

        donations.append(
            DonationResponse(
                id=str(donation.id),
                organization_id=str(donation.organization_id),
                donor_id=str(donation.donor_id),
                donor_name=donor_name or "Anonymous",
                amount=float(donation.amount),
                donation_date=donation.donation_date.isoformat() if isinstance(donation.donation_date, (date, datetime)) else donation.donation_date,
                payment_method=donation.payment_method,
                campaign_id=str(donation.campaign_id) if donation.campaign_id else None,
                is_recurring=donation.is_recurring or False,
                notes=donation.notes,
                created_at=donation.created_at.isoformat() if donation.created_at else datetime.utcnow().isoformat(),
                updated_at=donation.updated_at.isoformat() if donation.updated_at else datetime.utcnow().isoformat()
            )
        )

    return donations


# =====================================================================
# GET SINGLE DONATION
# =====================================================================

@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(
        donation_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get a specific donation by ID"""

    result = db.query(Donation, Donor).outerjoin(
        Donor, Donation.donor_id == Donor.id
    ).filter(Donation.id == donation_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Donation not found")

    donation, donor = result

    # Verify access
    verify_organization_access(current_user, donation.organization_id)

    donor_name = None
    if donor:
        if donor.first_name and donor.last_name:
            donor_name = f"{donor.first_name} {donor.last_name}"
        elif donor.first_name:
            donor_name = donor.first_name
        elif donor.last_name:
            donor_name = donor.last_name
        elif donor.organization_name:
            donor_name = donor.organization_name

    return DonationResponse(
        id=str(donation.id),
        organization_id=str(donation.organization_id),
        donor_id=str(donation.donor_id),
        donor_name=donor_name or "Anonymous",
        amount=float(donation.amount),
        donation_date=donation.donation_date.isoformat() if isinstance(donation.donation_date, (date, datetime)) else donation.donation_date,
        payment_method=donation.payment_method,
        campaign_id=str(donation.campaign_id) if donation.campaign_id else None,
        is_recurring=donation.is_recurring or False,
        notes=donation.notes,
        created_at=donation.created_at.isoformat() if donation.created_at else datetime.utcnow().isoformat(),
        updated_at=donation.updated_at.isoformat() if donation.updated_at else datetime.utcnow().isoformat()
    )


# =====================================================================
# CREATE DONATION
# =====================================================================

@router.post("/", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
        donation: DonationCreate,
        organization_id: UUID = Query(..., description="Organization ID"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new donation"""

    # Verify access
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Verify donor exists
    donor = db.query(Donor).filter(
        Donor.id == donation.donor_id,
        Donor.organization_id == organization_id
    ).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    # Create donation
    db_donation = Donation(
        organization_id=organization_id,
        donor_id=donation.donor_id,
        amount=donation.amount,
        donation_date=donation.donation_date,
        payment_method=donation.payment_method,
        campaign_id=donation.campaign_id,
        is_recurring=donation.is_recurring,
        notes=donation.notes
    )

    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)

    # Get donor name
    donor_name = None
    if donor.first_name and donor.last_name:
        donor_name = f"{donor.first_name} {donor.last_name}"
    elif donor.first_name:
        donor_name = donor.first_name
    elif donor.last_name:
        donor_name = donor.last_name
    elif donor.organization_name:
        donor_name = donor.organization_name

    return DonationResponse(
        id=str(db_donation.id),
        organization_id=str(db_donation.organization_id),
        donor_id=str(db_donation.donor_id),
        donor_name=donor_name or "Anonymous",
        amount=float(db_donation.amount),
        donation_date=db_donation.donation_date.isoformat() if isinstance(db_donation.donation_date, (date, datetime)) else db_donation.donation_date,
        payment_method=db_donation.payment_method,
        campaign_id=str(db_donation.campaign_id) if db_donation.campaign_id else None,
        is_recurring=db_donation.is_recurring or False,
        notes=db_donation.notes,
        created_at=db_donation.created_at.isoformat() if db_donation.created_at else datetime.utcnow().isoformat(),
        updated_at=db_donation.updated_at.isoformat() if db_donation.updated_at else datetime.utcnow().isoformat()
    )


# =====================================================================
# UPDATE DONATION
# =====================================================================

@router.patch("/{donation_id}", response_model=DonationResponse)
async def update_donation(
        donation_id: UUID,
        donation_update: DonationUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update a donation"""

    result = db.query(Donation, Donor).outerjoin(
        Donor, Donation.donor_id == Donor.id
    ).filter(Donation.id == donation_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Donation not found")

    db_donation, donor = result

    # Verify access
    verify_organization_access(current_user, db_donation.organization_id)

    # Update fields
    update_data = donation_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_donation, field, value)

    db_donation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_donation)

    donor_name = None
    if donor:
        if donor.first_name and donor.last_name:
            donor_name = f"{donor.first_name} {donor.last_name}"
        elif donor.first_name:
            donor_name = donor.first_name
        elif donor.last_name:
            donor_name = donor.last_name
        elif donor.organization_name:
            donor_name = donor.organization_name

    return DonationResponse(
        id=str(db_donation.id),
        organization_id=str(db_donation.organization_id),
        donor_id=str(db_donation.donor_id),
        donor_name=donor_name or "Anonymous",
        amount=float(db_donation.amount),
        donation_date=db_donation.donation_date.isoformat() if isinstance(db_donation.donation_date, (date, datetime)) else db_donation.donation_date,
        payment_method=db_donation.payment_method,
        campaign_id=str(db_donation.campaign_id) if db_donation.campaign_id else None,
        is_recurring=db_donation.is_recurring or False,
        notes=db_donation.notes,
        created_at=db_donation.created_at.isoformat() if db_donation.created_at else datetime.utcnow().isoformat(),
        updated_at=db_donation.updated_at.isoformat()
    )


# =====================================================================
# DELETE DONATION
# =====================================================================

@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donation(
        donation_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete a donation"""

    db_donation = db.query(Donation).filter(Donation.id == donation_id).first()

    if not db_donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    # Verify access
    verify_organization_access(current_user, db_donation.organization_id)

    db.delete(db_donation)
    db.commit()

    return None


# =====================================================================
# DONATION STATISTICS
# =====================================================================

@router.get("/stats/summary")
async def get_donation_statistics(
        organization_id: UUID = Query(..., description="Organization ID"),
        start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
        end_date: Optional[str] = Query(None, description="End date (ISO format)"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get summary statistics for donations"""

    verify_organization_access(current_user, organization_id)

    # Build base query
    query = db.query(Donation).filter(Donation.organization_id == organization_id)

    if start_date:
        query = query.filter(Donation.donation_date >= start_date)

    if end_date:
        query = query.filter(Donation.donation_date <= end_date)

    # Total donations
    total_donations = query.count()

    # Total amount
    total_amount = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id
    )
    if start_date:
        total_amount = total_amount.filter(Donation.donation_date >= start_date)
    if end_date:
        total_amount = total_amount.filter(Donation.donation_date <= end_date)
    total_amount = total_amount.scalar() or 0

    # Average donation
    avg_donation = total_amount / total_donations if total_donations > 0 else 0

    # Unique donors
    unique_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id
    )
    if start_date:
        unique_donors = unique_donors.filter(Donation.donation_date >= start_date)
    if end_date:
        unique_donors = unique_donors.filter(Donation.donation_date <= end_date)
    unique_donors = unique_donors.scalar() or 0

    # Recurring donations
    recurring_donations = query.filter(Donation.is_recurring == True).count()

    # By payment method
    by_payment_method = db.query(
        Donation.payment_method,
        func.count(Donation.id).label('count'),
        func.sum(Donation.amount).label('total')
    ).filter(
        Donation.organization_id == organization_id
    )
    if start_date:
        by_payment_method = by_payment_method.filter(Donation.donation_date >= start_date)
    if end_date:
        by_payment_method = by_payment_method.filter(Donation.donation_date <= end_date)
    by_payment_method = by_payment_method.group_by(Donation.payment_method).all()

    return {
        "organization_id": str(organization_id),
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "total_donations": total_donations,
        "total_amount": float(total_amount),
        "average_donation": round(float(avg_donation), 2),
        "unique_donors": unique_donors,
        "recurring_donations": recurring_donations,
        "recurring_percentage": round((recurring_donations / total_donations * 100) if total_donations > 0 else 0, 2),
        "by_payment_method": [
            {
                "method": method or "unspecified",
                "count": count,
                "total": float(total)
            }
            for method, count, total in by_payment_method
        ]
    }
