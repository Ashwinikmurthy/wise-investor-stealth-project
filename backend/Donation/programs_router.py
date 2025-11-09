"""
Programs API Router
Handles CRUD operations for programs
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from database import get_db
from models import Programs as Program, Organizations as Organization, Users as User

router = APIRouter(prefix="/api/programs", tags=["Programs"])

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
class ProgramBase(BaseModel):
    name: str = Field(..., description="Program name")
    description: Optional[str] = None
    program_type: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    target_beneficiaries: Optional[int] = None


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    program_type: Optional[str] = None
    budget: Optional[float] = None
    actual_spending: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    target_beneficiaries: Optional[int] = None
    current_beneficiaries: Optional[int] = None


class ProgramResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    program_type: Optional[str] = None
    budget: Optional[float] = None
    actual_spending: float = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    target_beneficiaries: Optional[int] = None
    current_beneficiaries: int = 0
    success_metrics: Optional[dict] = {}
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# =====================================================================
# GET ALL PROGRAMS
# =====================================================================

@router.get("/", response_model=List[ProgramResponse])
async def get_programs(
        organization_id: Optional[UUID] = Query(None, description="Filter by organization ID"),
        limit: Optional[int] = Query(None, description="Limit number of results"),
        skip: int = Query(0, description="Number of records to skip"),
        status: Optional[str] = Query(None, description="Filter by status"),
        program_type: Optional[str] = Query(None, description="Filter by program type"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get all programs with optional filtering

    Examples:
    - All programs for org: ?organization_id={uuid}
    - Limited results: ?organization_id={uuid}&limit=10
    - By status: ?organization_id={uuid}&status=active
    - By type: ?organization_id={uuid}&program_type=education
    """

    # Build query
    query = db.query(Program)

    # Filter by organization
    if organization_id:
        verify_organization_access(current_user, organization_id)
        query = query.filter(Program.organization_id == organization_id)
    elif not current_user.is_superadmin:
        # Non-superadmins can only see their org's programs
        query = query.filter(Program.organization_id == current_user.organization_id)

    # Additional filters
    if status:
        query = query.filter(Program.status == status)

    if program_type:
        query = query.filter(Program.program_type == program_type)

    # Order by updated_at descending (most recent first)
    query = query.order_by(Program.updated_at.desc())

    # Apply pagination
    if skip:
        query = query.offset(skip)

    if limit:
        query = query.limit(limit)

    programs = query.all()

    # Convert to response format
    return [
        ProgramResponse(
            id=str(program.id),
            organization_id=str(program.organization_id),
            name=program.name,
            description=program.description,
            program_type=program.program_type,
            budget=float(program.budget) if program.budget else None,
            actual_spending=float(program.actual_spending) if program.actual_spending else 0,
            start_date=program.start_date.isoformat() if program.start_date else None,
            end_date=program.end_date.isoformat() if program.end_date else None,
            status=program.status,
            target_beneficiaries=program.target_beneficiaries,
            current_beneficiaries=program.current_beneficiaries or 0,
            success_metrics=program.success_metrics or {},
            created_at=program.created_at.isoformat() if program.created_at else datetime.utcnow().isoformat(),
            updated_at=program.updated_at.isoformat() if program.updated_at else datetime.utcnow().isoformat()
        )
        for program in programs
    ]


# =====================================================================
# GET SINGLE PROGRAM
# =====================================================================

@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(
        program_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get a specific program by ID"""

    program = db.query(Program).filter(Program.id == program_id).first()

    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Verify access
    verify_organization_access(current_user, program.organization_id)

    return ProgramResponse(
        id=str(program.id),
        organization_id=str(program.organization_id),
        name=program.name,
        description=program.description,
        program_type=program.program_type,
        budget=float(program.budget) if program.budget else None,
        actual_spending=float(program.actual_spending) if program.actual_spending else 0,
        start_date=program.start_date.isoformat() if program.start_date else None,
        end_date=program.end_date.isoformat() if program.end_date else None,
        status=program.status,
        target_beneficiaries=program.target_beneficiaries,
        current_beneficiaries=program.current_beneficiaries or 0,
        success_metrics=program.success_metrics or {},
        created_at=program.created_at.isoformat() if program.created_at else datetime.utcnow().isoformat(),
        updated_at=program.updated_at.isoformat() if program.updated_at else datetime.utcnow().isoformat()
    )


# =====================================================================
# CREATE PROGRAM
# =====================================================================

@router.post("/", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
        program: ProgramCreate,
        organization_id: UUID = Query(..., description="Organization ID"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Create a new program"""

    # Verify access
    verify_organization_access(current_user, organization_id)

    # Verify organization exists
    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Create program
    db_program = Program(
        organization_id=organization_id,
        name=program.name,
        description=program.description,
        program_type=program.program_type,
        budget=program.budget,
        start_date=program.start_date,
        end_date=program.end_date,
        status=program.status or "active",
        target_beneficiaries=program.target_beneficiaries,
        current_beneficiaries=0,
        actual_spending=0,
        success_metrics={}
    )

    db.add(db_program)
    db.commit()
    db.refresh(db_program)

    return ProgramResponse(
        id=str(db_program.id),
        organization_id=str(db_program.organization_id),
        name=db_program.name,
        description=db_program.description,
        program_type=db_program.program_type,
        budget=float(db_program.budget) if db_program.budget else None,
        actual_spending=float(db_program.actual_spending) if db_program.actual_spending else 0,
        start_date=db_program.start_date.isoformat() if db_program.start_date else None,
        end_date=db_program.end_date.isoformat() if db_program.end_date else None,
        status=db_program.status,
        target_beneficiaries=db_program.target_beneficiaries,
        current_beneficiaries=db_program.current_beneficiaries or 0,
        success_metrics=db_program.success_metrics or {},
        created_at=db_program.created_at.isoformat() if db_program.created_at else datetime.utcnow().isoformat(),
        updated_at=db_program.updated_at.isoformat() if db_program.updated_at else datetime.utcnow().isoformat()
    )


# =====================================================================
# UPDATE PROGRAM
# =====================================================================

@router.patch("/{program_id}", response_model=ProgramResponse)
async def update_program(
        program_id: UUID,
        program_update: ProgramUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update a program"""

    db_program = db.query(Program).filter(Program.id == program_id).first()

    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Verify access
    verify_organization_access(current_user, db_program.organization_id)

    # Update fields
    update_data = program_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_program, field, value)

    db_program.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_program)

    return ProgramResponse(
        id=str(db_program.id),
        organization_id=str(db_program.organization_id),
        name=db_program.name,
        description=db_program.description,
        program_type=db_program.program_type,
        budget=float(db_program.budget) if db_program.budget else None,
        actual_spending=float(db_program.actual_spending) if db_program.actual_spending else 0,
        start_date=db_program.start_date.isoformat() if db_program.start_date else None,
        end_date=db_program.end_date.isoformat() if db_program.end_date else None,
        status=db_program.status,
        target_beneficiaries=db_program.target_beneficiaries,
        current_beneficiaries=db_program.current_beneficiaries or 0,
        success_metrics=db_program.success_metrics or {},
        created_at=db_program.created_at.isoformat() if db_program.created_at else datetime.utcnow().isoformat(),
        updated_at=db_program.updated_at.isoformat()
    )


# =====================================================================
# DELETE PROGRAM
# =====================================================================

@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
        program_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Delete a program"""

    db_program = db.query(Program).filter(Program.id == program_id).first()

    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Verify access
    verify_organization_access(current_user, db_program.organization_id)

    db.delete(db_program)
    db.commit()

    return None


# =====================================================================
# PROGRAM STATISTICS
# =====================================================================

@router.get("/stats/summary")
async def get_program_statistics(
        organization_id: UUID = Query(..., description="Organization ID"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Get summary statistics for programs"""

    verify_organization_access(current_user, organization_id)

    # Total programs
    total_programs = db.query(func.count(Program.id)).filter(
        Program.organization_id == organization_id
    ).scalar() or 0

    # Active programs
    active_programs = db.query(func.count(Program.id)).filter(
        Program.organization_id == organization_id,
        Program.status == 'active'
    ).scalar() or 0

    # Total budget
    total_budget = db.query(func.sum(Program.budget)).filter(
        Program.organization_id == organization_id
    ).scalar() or 0

    # Total spending
    total_spending = db.query(func.sum(Program.actual_spending)).filter(
        Program.organization_id == organization_id
    ).scalar() or 0

    # Total beneficiaries
    total_beneficiaries = db.query(func.sum(Program.current_beneficiaries)).filter(
        Program.organization_id == organization_id
    ).scalar() or 0

    # Programs by type
    programs_by_type = db.query(
        Program.program_type,
        func.count(Program.id).label('count')
    ).filter(
        Program.organization_id == organization_id
    ).group_by(Program.program_type).all()

    return {
        "organization_id": str(organization_id),
        "total_programs": total_programs,
        "active_programs": active_programs,
        "total_budget": float(total_budget),
        "total_spending": float(total_spending),
        "total_beneficiaries": total_beneficiaries,
        "budget_utilization": round((total_spending / total_budget * 100) if total_budget > 0 else 0, 2),
        "programs_by_type": [
            {"type": ptype or "unspecified", "count": count}
            for ptype, count in programs_by_type
        ]
    }