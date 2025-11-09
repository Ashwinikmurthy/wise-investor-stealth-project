from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from uuid import UUID
from typing import Dict, List

from ..database import get_db
from ..models import Program, Outcome, Beneficiary, Story, SDGAlignment, ImpactMetric  # adjust per schema

router = APIRouter(prefix="/analytics", tags=["Impact Analytics"])


# ==========================================================
# 1️⃣ Program List
# ==========================================================
@router.get("/{organization_id}/programs/list", response_model=Dict)
def list_programs(organization_id: UUID, db: Session = Depends(get_db)):
    """List all active programs for an organization."""
    programs = (
        db.query(Program.id, Program.name, Program.description, Program.budget)
        .filter(Program.organization_id == organization_id, Program.is_active == True)
        .order_by(Program.name)
        .all()
    )
    return {
        "organization_id": str(organization_id),
        "programs": [
            {
                "program_id": str(p.id),
                "name": p.name,
                "description": p.description,
                "budget": float(p.budget or 0)
            }
            for p in programs
        ]
    }


# ==========================================================
# 2️⃣ Outcomes
# ==========================================================
@router.get("/{organization_id}/impact/outcomes", response_model=Dict)
def impact_outcomes(
        organization_id: UUID,
        program: UUID = Query(..., description="Program ID"),
        period: str = Query("year", description="Time period (month, quarter, year)"),
        db: Session = Depends(get_db)
):
    """Return key outcome metrics (graduation rate, adoption rate, success %) by period."""
    today = date.today()
    year = today.year

    outcomes = (
        db.query(
            Outcome.metric_name,
            func.avg(Outcome.metric_value).label("avg_value")
        )
        .filter(Outcome.organization_id == organization_id, Outcome.program_id == program)
        .filter(extract("year", Outcome.record_date) == year)
        .group_by(Outcome.metric_name)
        .all()
    )

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "period": period,
        "metrics": [
            {"name": o.metric_name, "value": round(float(o.avg_value or 0), 2)} for o in outcomes
        ]
    }


# ==========================================================
# 3️⃣ Beneficiaries
# ==========================================================
@router.get("/{organization_id}/impact/beneficiaries", response_model=Dict)
def impact_beneficiaries(
        organization_id: UUID,
        program: UUID = Query(..., description="Program ID"),
        db: Session = Depends(get_db)
):
    """Aggregate total beneficiaries served, by gender/age group."""
    rows = (
        db.query(
            Beneficiary.gender,
            Beneficiary.age_group,
            func.count(Beneficiary.id).label("count")
        )
        .filter(Beneficiary.organization_id == organization_id, Beneficiary.program_id == program)
        .group_by(Beneficiary.gender, Beneficiary.age_group)
        .all()
    )

    summary = [
        {
            "gender": r.gender or "Unspecified",
            "age_group": r.age_group or "Unknown",
            "count": r.count
        }
        for r in rows
    ]

    total = sum(r["count"] for r in summary)

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "total_beneficiaries": total,
        "breakdown": summary
    }


# ==========================================================
# 4️⃣ SDG Alignment
# ==========================================================
@router.get("/{organization_id}/impact/sdg-alignment", response_model=Dict)
def sdg_alignment(organization_id: UUID, db: Session = Depends(get_db)):
    """List Sustainable Development Goals aligned with programs."""
    alignments = (
        db.query(SDGAlignment.program_id, SDGAlignment.sdg_goal, SDGAlignment.contribution_score)
        .filter(SDGAlignment.organization_id == organization_id)
        .all()
    )

    sdg_map: Dict[str, List[Dict]] = {}
    for a in alignments:
        sdg_map.setdefault(a.sdg_goal, []).append({
            "program_id": str(a.program_id),
            "score": float(a.contribution_score or 0)
        })

    return {
        "organization_id": str(organization_id),
        "sdg_alignment": sdg_map
    }


# ==========================================================
# 5️⃣ Cost Effectiveness
# ==========================================================
@router.get("/{organization_id}/impact/cost-effectiveness", response_model=Dict)
def cost_effectiveness(
        organization_id: UUID,
        program: UUID = Query(..., description="Program ID"),
        db: Session = Depends(get_db)
):
    """Cost per beneficiary (program efficiency)."""
    program_budget = (
        db.query(func.coalesce(func.sum(Program.budget), 0))
        .filter(Program.organization_id == organization_id, Program.id == program)
        .scalar()
    )

    beneficiaries = (
                        db.query(func.count(Beneficiary.id))
                        .filter(Beneficiary.organization_id == organization_id, Beneficiary.program_id == program)
                        .scalar()
                    ) or 1

    cost_per_beneficiary = float(program_budget or 0) / beneficiaries

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "beneficiaries": beneficiaries,
        "program_budget": float(program_budget or 0),
        "cost_per_beneficiary": round(cost_per_beneficiary, 2)
    }


# ==========================================================
# 6️⃣ Social Return on Investment (SROI)
# ==========================================================
@router.get("/{organization_id}/impact/social-return", response_model=Dict)
def social_return(organization_id: UUID, db: Session = Depends(get_db)):
    """Estimate SROI = Social value created / investment."""
    impacts = (
        db.query(
            ImpactMetric.program_id,
            func.sum(ImpactMetric.social_value).label("value"),
            func.sum(ImpactMetric.investment).label("investment")
        )
        .filter(ImpactMetric.organization_id == organization_id)
        .group_by(ImpactMetric.program_id)
        .all()
    )

    results = []
    for i in impacts:
        sroi = (float(i.value or 0) / float(i.investment or 1))
        results.append({
            "program_id": str(i.program_id),
            "social_value": float(i.value or 0),
            "investment": float(i.investment or 0),
            "sroi": round(sroi, 2)
        })

    avg_sroi = round(sum(r["sroi"] for r in results) / len(results), 2) if results else 0

    return {
        "organization_id": str(organization_id),
        "average_sroi": avg_sroi,
        "programs": results
    }


# ==========================================================
# 7️⃣ Stories
# ==========================================================
@router.get("/{organization_id}/impact/stories", response_model=Dict)
def impact_stories(
        organization_id: UUID,
        limit: int = Query(5, ge=1, le=20),
        db: Session = Depends(get_db)
):
    """Fetch qualitative impact stories (latest success stories/testimonials)."""
    stories = (
        db.query(Story.id, Story.program_id, Story.title, Story.summary, Story.story_date)
        .filter(Story.organization_id == organization_id)
        .order_by(Story.story_date.desc())
        .limit(limit)
        .all()
    )

    return {
        "organization_id": str(organization_id),
        "count": len(stories),
        "stories": [
            {
                "story_id": str(s.id),
                "program_id": str(s.program_id),
                "title": s.title,
                "summary": s.summary,
                "date": s.story_date.isoformat() if s.story_date else None
            }
            for s in stories
        ]
    }


# ==========================================================
# 8️⃣ Geographic Reach
# ==========================================================
@router.get("/{organization_id}/impact/geographic-reach", response_model=Dict)
def geographic_reach(organization_id: UUID, db: Session = Depends(get_db)):
    """Summarize impact by geography (state, country, region)."""
    rows = (
        db.query(
            Beneficiary.country,
            Beneficiary.state,
            func.count(Beneficiary.id).label("count")
        )
        .filter(Beneficiary.organization_id == organization_id)
        .group_by(Beneficiary.country, Beneficiary.state)
        .all()
    )

    regions = {}
    for r in rows:
        country = r.country or "Unknown"
        state = r.state or "N/A"
        regions.setdefault(country, []).append({"state": state, "beneficiaries": r.count})

    total = sum(sum(s["beneficiaries"] for s in v) for v in regions.values())

    return {
        "organization_id": str(organization_id),
        "total_beneficiaries": total,
        "regions": regions
    }
