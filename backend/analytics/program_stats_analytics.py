"""
Program Impact Stats API Router
Endpoints for managing and displaying program impact statistics
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field
from enum import Enum

from database import get_db
from user_management.auth_dependencies import get_current_user
# Import your models - adjust path as needed
from models import ProgramImpactStats, OrganizationImpactSummary, Programs, Organizations, Users

router = APIRouter(prefix="/api/v1/impact-stats", tags=["Impact Statistics"])


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class ImpactCategoryEnum(str, Enum):
    food_security = "food_security"
    education = "education"
    healthcare = "healthcare"
    housing = "housing"
    employment = "employment"
    environment = "environment"
    community = "community"
    financial = "financial"
    children = "children"
    elderly = "elderly"
    disaster_relief = "disaster_relief"
    mental_health = "mental_health"
    custom = "custom"


class ImpactStatCreate(BaseModel):
    program_id: UUID
    category: str
    metric_name: str
    metric_value: int
    metric_unit: str = "people"
    display_label: Optional[str] = None
    icon_name: Optional[str] = None
    display_order: int = 0
    is_featured: bool = False
    is_public: bool = True
    period_type: Optional[str] = "all_time"
    target_value: Optional[int] = None
    description: Optional[str] = None


class ImpactStatUpdate(BaseModel):
    metric_name: Optional[str] = None
    metric_value: Optional[int] = None
    metric_unit: Optional[str] = None
    display_label: Optional[str] = None
    icon_name: Optional[str] = None
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_public: Optional[bool] = None
    target_value: Optional[int] = None
    description: Optional[str] = None


class ImpactStatResponse(BaseModel):
    id: UUID
    program_id: UUID
    program_name: Optional[str] = None
    category: str
    metric_name: str
    metric_value: int
    metric_unit: str
    display_label: Optional[str]
    icon_name: Optional[str]
    is_featured: bool
    is_public: bool
    target_value: Optional[int]
    progress_percentage: Optional[float]
    formatted_value: str
    impact_statement: str

    class Config:
        from_attributes = True


class FeaturedImpactItem(BaseModel):
    """Single featured impact for dashboard display"""
    program_id: UUID
    program_name: str
    category: str
    metric_name: str
    value: int
    formatted_value: str
    unit: str
    icon: Optional[str]
    display_label: Optional[str]
    impact_statement: str
    target: Optional[int] = None
    progress: Optional[float] = None


class OrganizationImpactDashboard(BaseModel):
    """Complete impact dashboard for an organization"""
    organization_id: UUID
    organization_name: str
    total_beneficiaries: int
    total_programs: int
    featured_impacts: List[FeaturedImpactItem]
    impact_by_category: dict
    impact_by_program: List[dict]
    last_updated: Optional[datetime]


class BulkImpactUpdate(BaseModel):
    """For updating multiple impact stats at once"""
    updates: List[dict]  # [{"id": uuid, "metric_value": 500}, ...]


# ============================================================
# ICON MAPPING FOR CATEGORIES
# ============================================================
CATEGORY_ICONS = {
    "food_security": "utensils",
    "education": "graduation-cap",
    "healthcare": "heart-pulse",
    "housing": "home",
    "employment": "briefcase",
    "environment": "leaf",
    "community": "users",
    "financial": "dollar-sign",
    "children": "baby",
    "elderly": "user",
    "disaster_relief": "shield",
    "mental_health": "brain",
    "custom": "star"
}

CATEGORY_LABELS = {
    "food_security": "Food Security",
    "education": "Education",
    "healthcare": "Healthcare",
    "housing": "Housing",
    "employment": "Employment",
    "environment": "Environment",
    "community": "Community",
    "financial": "Financial Aid",
    "children": "Children & Youth",
    "elderly": "Senior Services",
    "disaster_relief": "Disaster Relief",
    "mental_health": "Mental Health",
    "custom": "Other Impact"
}


# ============================================================
# API ENDPOINTS
# ============================================================

@router.post("/{organization_id}", response_model=ImpactStatResponse)
async def create_impact_stat(
    organization_id: UUID,
    stat: ImpactStatCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new program impact statistic"""
    from models import ProgramImpactStats, Programs
    
    # Verify program belongs to organization
    program = db.query(Programs).filter(
        Programs.id == stat.program_id,
        Programs.organization_id == organization_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Set default icon if not provided
    icon = stat.icon_name or CATEGORY_ICONS.get(stat.category, "star")
    
    new_stat = ProgramImpactStats(
        organization_id=organization_id,
        program_id=stat.program_id,
        category=stat.category,
        metric_name=stat.metric_name,
        metric_value=stat.metric_value,
        metric_unit=stat.metric_unit,
        display_label=stat.display_label,
        icon_name=icon,
        display_order=stat.display_order,
        is_featured=stat.is_featured,
        is_public=stat.is_public,
        period_type=stat.period_type,
        target_value=stat.target_value,
        description=stat.description,
        created_by=current_user.id
    )
    
    db.add(new_stat)
    db.commit()
    db.refresh(new_stat)
    
    return _stat_to_response(new_stat, program.name)


@router.get("/{organization_id}", response_model=List[ImpactStatResponse])
async def get_all_impact_stats(
    organization_id: UUID,
    program_id: Optional[UUID] = None,
    category: Optional[str] = None,
    featured_only: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all impact stats for an organization with optional filters"""
    from models import ProgramImpactStats, Programs
    
    query = db.query(ProgramImpactStats, Programs.name).join(
        Programs, ProgramImpactStats.program_id == Programs.id
    ).filter(ProgramImpactStats.organization_id == organization_id)
    
    if program_id:
        query = query.filter(ProgramImpactStats.program_id == program_id)
    if category:
        query = query.filter(ProgramImpactStats.category == category)
    if featured_only:
        query = query.filter(ProgramImpactStats.is_featured == True)
    
    query = query.order_by(ProgramImpactStats.display_order, ProgramImpactStats.metric_value.desc())
    
    results = query.all()
    
    return [_stat_to_response(stat, program_name) for stat, program_name in results]


@router.get("/{organization_id}/featured", response_model=List[FeaturedImpactItem])
async def get_featured_impacts(
    organization_id: UUID,
    limit: int = Query(default=6, le=20),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get featured impact stats for dashboard display - CEO view"""
    from models import ProgramImpactStats, Programs
    
    results = db.query(ProgramImpactStats, Programs.name).join(
        Programs, ProgramImpactStats.program_id == Programs.id
    ).filter(
        ProgramImpactStats.organization_id == organization_id,
        ProgramImpactStats.is_featured == True
    ).order_by(
        ProgramImpactStats.display_order,
        ProgramImpactStats.metric_value.desc()
    ).limit(limit).all()
    
    return [_stat_to_featured_item(stat, program_name) for stat, program_name in results]


@router.get("/{organization_id}/dashboard", response_model=OrganizationImpactDashboard)
async def get_impact_dashboard(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get complete impact dashboard for organization - Main CEO Dashboard"""
    from models import ProgramImpactStats, Programs, Organizations, Beneficiaries
    
    # Get organization
    org = db.query(Organizations).filter(Organizations.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get all impact stats
    stats_query = db.query(ProgramImpactStats, Programs.name).join(
        Programs, ProgramImpactStats.program_id == Programs.id
    ).filter(ProgramImpactStats.organization_id == organization_id)
    
    all_stats = stats_query.all()
    
    # Get featured impacts
    featured = [_stat_to_featured_item(stat, name) for stat, name in all_stats if stat.is_featured]
    
    # If no featured, get top 6 by value
    if not featured:
        sorted_stats = sorted(all_stats, key=lambda x: x[0].metric_value, reverse=True)[:6]
        featured = [_stat_to_featured_item(stat, name) for stat, name in sorted_stats]
    
    # Aggregate by category
    impact_by_category = {}
    for stat, _ in all_stats:
        cat_label = CATEGORY_LABELS.get(stat.category, stat.category)
        if cat_label not in impact_by_category:
            impact_by_category[cat_label] = 0
        impact_by_category[cat_label] += stat.metric_value
    
    # Aggregate by program
    program_impacts = {}
    for stat, program_name in all_stats:
        if program_name not in program_impacts:
            program_impacts[program_name] = {
                "program_name": program_name,
                "program_id": str(stat.program_id),
                "total_impact": 0,
                "metrics": []
            }
        program_impacts[program_name]["total_impact"] += stat.metric_value
        program_impacts[program_name]["metrics"].append({
            "name": stat.metric_name,
            "value": stat.metric_value,
            "unit": stat.metric_unit
        })
    
    # Calculate totals
    total_beneficiaries = sum(
        stat.metric_value for stat, _ in all_stats 
        if stat.metric_unit in ["people", "individuals", "families", "students", "patients"]
    )
    
    # Count active programs
    total_programs = db.query(Programs).filter(
        Programs.organization_id == organization_id,
        Programs.status == "active"
    ).count()
    
    return OrganizationImpactDashboard(
        organization_id=organization_id,
        organization_name=org.name,
        total_beneficiaries=total_beneficiaries,
        total_programs=total_programs,
        featured_impacts=featured,
        impact_by_category=impact_by_category,
        impact_by_program=list(program_impacts.values()),
        last_updated=datetime.utcnow()
    )


@router.get("/{organization_id}/program/{program_id}", response_model=List[ImpactStatResponse])
async def get_program_impacts(
    organization_id: UUID,
    program_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all impact stats for a specific program"""
    from models import ProgramImpactStats, Programs
    
    program = db.query(Programs).filter(
        Programs.id == program_id,
        Programs.organization_id == organization_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    stats = db.query(ProgramImpactStats).filter(
        ProgramImpactStats.program_id == program_id
    ).order_by(ProgramImpactStats.display_order).all()
    
    return [_stat_to_response(stat, program.name) for stat in stats]


@router.put("/{organization_id}/{stat_id}", response_model=ImpactStatResponse)
async def update_impact_stat(
    organization_id: UUID,
    stat_id: UUID,
    update: ImpactStatUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an impact statistic"""
    from models import ProgramImpactStats, Programs
    
    stat = db.query(ProgramImpactStats).filter(
        ProgramImpactStats.id == stat_id,
        ProgramImpactStats.organization_id == organization_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Impact stat not found")
    
    # Update fields
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stat, field, value)
    
    stat.updated_at = datetime.utcnow()
    stat.updated_by = current_user.id
    
    db.commit()
    db.refresh(stat)
    
    program = db.query(Programs).filter(Programs.id == stat.program_id).first()
    
    return _stat_to_response(stat, program.name if program else None)


@router.patch("/{organization_id}/{stat_id}/increment")
async def increment_impact_value(
    organization_id: UUID,
    stat_id: UUID,
    amount: int = Query(default=1, description="Amount to increment by"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Increment an impact stat value (useful for real-time updates)"""
    from models import ProgramImpactStats
    
    stat = db.query(ProgramImpactStats).filter(
        ProgramImpactStats.id == stat_id,
        ProgramImpactStats.organization_id == organization_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Impact stat not found")
    
    stat.metric_value += amount
    stat.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "id": str(stat.id),
        "new_value": stat.metric_value,
        "formatted_value": stat.formatted_value
    }


@router.delete("/{organization_id}/{stat_id}")
async def delete_impact_stat(
    organization_id: UUID,
    stat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an impact statistic"""
    from models import ProgramImpactStats
    
    stat = db.query(ProgramImpactStats).filter(
        ProgramImpactStats.id == stat_id,
        ProgramImpactStats.organization_id == organization_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Impact stat not found")
    
    db.delete(stat)
    db.commit()
    
    return {"message": "Impact stat deleted successfully"}


@router.post("/{organization_id}/bulk-update")
async def bulk_update_impacts(
    organization_id: UUID,
    bulk: BulkImpactUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bulk update multiple impact stats (useful for monthly reporting)"""
    from models import ProgramImpactStats
    
    updated = []
    for item in bulk.updates:
        stat = db.query(ProgramImpactStats).filter(
            ProgramImpactStats.id == item.get("id"),
            ProgramImpactStats.organization_id == organization_id
        ).first()
        
        if stat:
            if "metric_value" in item:
                stat.metric_value = item["metric_value"]
            stat.updated_at = datetime.utcnow()
            stat.updated_by = current_user.id
            updated.append(str(stat.id))
    
    db.commit()
    
    return {"updated_count": len(updated), "updated_ids": updated}


@router.get("/{organization_id}/public")
async def get_public_impacts(
    organization_id: UUID,
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db)
):
    """Get public impact stats (no auth required - for public pages/campaigns)"""
    from models import ProgramImpactStats, Programs, Organizations
    
    org = db.query(Organizations).filter(
        Organizations.id == organization_id,
        Organizations.is_active == True
    ).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    results = db.query(ProgramImpactStats, Programs.name).join(
        Programs, ProgramImpactStats.program_id == Programs.id
    ).filter(
        ProgramImpactStats.organization_id == organization_id,
        ProgramImpactStats.is_public == True
    ).order_by(
        ProgramImpactStats.is_featured.desc(),
        ProgramImpactStats.display_order,
        ProgramImpactStats.metric_value.desc()
    ).limit(limit).all()
    
    return {
        "organization_name": org.name,
        "impacts": [
            {
                "program": program_name,
                "metric": stat.metric_name,
                "value": stat.metric_value,
                "formatted_value": stat.formatted_value,
                "unit": stat.metric_unit,
                "statement": stat.impact_statement,
                "icon": stat.icon_name,
                "category": CATEGORY_LABELS.get(stat.category, stat.category)
            }
            for stat, program_name in results
        ]
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _format_value(value: int) -> str:
    """Format large numbers for display"""
    if value >= 1000000:
        return f"{value / 1000000:.1f}M"
    elif value >= 1000:
        return f"{value / 1000:.1f}K"
    return str(value)


def _stat_to_response(stat, program_name: str = None) -> ImpactStatResponse:
    """Convert a stat model to response schema"""
    progress = None
    if stat.target_value and stat.target_value > 0:
        progress = min(100, (stat.metric_value / stat.target_value) * 100)
    
    formatted = _format_value(stat.metric_value)
    
    # Generate impact statement
    if stat.display_label:
        statement = f"{formatted} {stat.display_label}"
    else:
        statement = f"{formatted} {stat.metric_unit} {stat.metric_name.lower()}"
    
    return ImpactStatResponse(
        id=stat.id,
        program_id=stat.program_id,
        program_name=program_name,
        category=stat.category,
        metric_name=stat.metric_name,
        metric_value=stat.metric_value,
        metric_unit=stat.metric_unit,
        display_label=stat.display_label,
        icon_name=stat.icon_name,
        is_featured=stat.is_featured,
        is_public=stat.is_public,
        target_value=stat.target_value,
        progress_percentage=progress,
        formatted_value=formatted,
        impact_statement=statement
    )


def _stat_to_featured_item(stat, program_name: str) -> FeaturedImpactItem:
    """Convert to featured dashboard item"""
    formatted = _format_value(stat.metric_value)
    progress = None
    if stat.target_value and stat.target_value > 0:
        progress = min(100, (stat.metric_value / stat.target_value) * 100)
    
    if stat.display_label:
        statement = f"{formatted} {stat.display_label}"
    else:
        statement = f"{formatted} {stat.metric_unit} {stat.metric_name.lower()}"
    
    return FeaturedImpactItem(
        program_id=stat.program_id,
        program_name=program_name,
        category=stat.category,
        metric_name=stat.metric_name,
        value=stat.metric_value,
        formatted_value=formatted,
        unit=stat.metric_unit,
        icon=stat.icon_name,
        display_label=stat.display_label,
        impact_statement=statement,
        target=stat.target_value,
        progress=progress
    )
