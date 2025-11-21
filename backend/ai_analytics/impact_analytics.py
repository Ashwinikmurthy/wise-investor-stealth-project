from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from datetime import date
from uuid import UUID
from typing import Dict, List

from database import get_db
from models import (
    Programs,
    OutcomeMetrics,
    OutcomeRecords,
    Beneficiaries,
    Stories,
    SdgAlignment,
    ImpactMetrics,
    ProgramEnrollments
)

router = APIRouter(prefix="/api/v1/analytics", tags=["Impact Analytics"])


# ==========================================================
# 1️⃣ Program List
# ==========================================================
@router.get("/{organization_id}/programs/list", response_model=Dict)
def list_programs(organization_id: UUID, db: Session = Depends(get_db)):
    """List all active programs for an organization."""
    programs = (
        db.query(Programs.id, Programs.name, Programs.description, Programs.budget, Programs.status)
        .filter(
            Programs.organization_id == organization_id,
            Programs.status.in_(['active', 'Active', None])  # Filter by status instead of is_active
        )
        .order_by(Programs.name)
        .all()
    )
    return {
        "organization_id": str(organization_id),
        "programs": [
            {
                "program_id": str(p.id),
                "name": p.name,
                "description": p.description,
                "budget": float(p.budget or 0),
                "status": p.status
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
    """Return key outcome metrics by period."""
    today = date.today()
    year = today.year

    # Join OutcomeMetrics with OutcomeRecords to get actual values
    outcomes = (
        db.query(
            OutcomeMetrics.name.label("metric_name"),
            func.avg(OutcomeRecords.value).label("avg_value"),
            OutcomeMetrics.unit,
            OutcomeMetrics.target_value
        )
        .join(OutcomeRecords, OutcomeRecords.outcome_metric_id == OutcomeMetrics.id)
        .filter(
            OutcomeMetrics.organization_id == organization_id,
            OutcomeMetrics.program_id == program
        )
        .filter(extract("year", OutcomeRecords.recorded_at) == year)
        .group_by(OutcomeMetrics.name, OutcomeMetrics.unit, OutcomeMetrics.target_value)
        .all()
    )

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "period": period,
        "year": year,
        "metrics": [
            {
                "name": o.metric_name,
                "value": round(float(o.avg_value or 0), 2),
                "unit": o.unit,
                "target": float(o.target_value or 0) if o.target_value else None,
                "progress": round((float(o.avg_value or 0) / float(o.target_value)) * 100, 1) if o.target_value and o.target_value > 0 else None
            }
            for o in outcomes
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
    """Aggregate total beneficiaries served, by gender and calculated age group."""

    # Calculate age group from date_of_birth
    today = date.today()

    # Join Beneficiaries with ProgramEnrollments to filter by program
    rows = (
        db.query(
            Beneficiaries.gender,
            case(
                (Beneficiaries.date_of_birth == None, "Unknown"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 18, "Under 18"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 25, "18-24"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 35, "25-34"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 45, "35-44"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 55, "45-54"),
                (func.extract('year', func.age(Beneficiaries.date_of_birth)) < 65, "55-64"),
                else_="65+"
            ).label("age_group"),
            func.count(Beneficiaries.id).label("count")
        )
        .join(ProgramEnrollments, ProgramEnrollments.beneficiary_id == Beneficiaries.id)
        .filter(
            Beneficiaries.organization_id == organization_id,
            ProgramEnrollments.program_id == program
        )
        .group_by(Beneficiaries.gender, "age_group")
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

    # Calculate gender distribution
    gender_dist = {}
    for r in summary:
        gender = r["gender"]
        gender_dist[gender] = gender_dist.get(gender, 0) + r["count"]

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "total_beneficiaries": total,
        "breakdown": summary,
        "gender_distribution": gender_dist
    }


# ==========================================================
# 4️⃣ SDG Alignment
# ==========================================================
@router.get("/{organization_id}/impact/sdg-alignment", response_model=Dict)
def sdg_alignment(organization_id: UUID, db: Session = Depends(get_db)):
    """List Sustainable Development Goals aligned with programs."""
    alignments = (
        db.query(
            SdgAlignment.program_id,
            SdgAlignment.sdg_goal,
            SdgAlignment.contribution_score,
            Programs.name.label("program_name")
        )
        .join(Programs, Programs.id == SdgAlignment.program_id, isouter=True)
        .filter(SdgAlignment.organization_id == organization_id)
        .all()
    )

    sdg_map: Dict[str, List[Dict]] = {}
    for a in alignments:
        sdg_map.setdefault(a.sdg_goal, []).append({
            "program_id": str(a.program_id),
            "program_name": a.program_name,
            "score": float(a.contribution_score or 0)
        })

    # Calculate total alignment score per SDG
    sdg_totals = {
        goal: sum(p["score"] for p in programs)
        for goal, programs in sdg_map.items()
    }

    return {
        "organization_id": str(organization_id),
        "sdg_alignment": sdg_map,
        "sdg_totals": sdg_totals,
        "total_sdgs_aligned": len(sdg_map)
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
    # Get program budget
    program_data = (
        db.query(Programs.budget, Programs.name, Programs.actual_spending)
        .filter(Programs.organization_id == organization_id, Programs.id == program)
        .first()
    )

    program_budget = float(program_data.budget or 0) if program_data else 0
    actual_spending = float(program_data.actual_spending or 0) if program_data else 0
    program_name = program_data.name if program_data else "Unknown"

    # Count beneficiaries through ProgramEnrollments
    beneficiaries = (
                        db.query(func.count(ProgramEnrollments.beneficiary_id.distinct()))
                        .filter(ProgramEnrollments.program_id == program)
                        .scalar()
                    ) or 1

    cost_per_beneficiary = actual_spending / beneficiaries if actual_spending > 0 else program_budget / beneficiaries
    budget_utilization = (actual_spending / program_budget * 100) if program_budget > 0 else 0

    return {
        "organization_id": str(organization_id),
        "program_id": str(program),
        "program_name": program_name,
        "beneficiaries": beneficiaries,
        "program_budget": program_budget,
        "actual_spending": actual_spending,
        "cost_per_beneficiary": round(cost_per_beneficiary, 2),
        "budget_utilization": round(budget_utilization, 1)
    }


# ==========================================================
# 6️⃣ Social Return on Investment (SROI)
# ==========================================================
@router.get("/{organization_id}/impact/social-return", response_model=Dict)
def social_return(organization_id: UUID, db: Session = Depends(get_db)):
    """Estimate SROI = Social value created / investment."""
    impacts = (
        db.query(
            ImpactMetrics.program_id,
            Programs.name.label("program_name"),
            func.sum(ImpactMetrics.social_value).label("value"),
            func.sum(ImpactMetrics.investment).label("investment")
        )
        .join(Programs, Programs.id == ImpactMetrics.program_id, isouter=True)
        .filter(ImpactMetrics.organization_id == organization_id)
        .group_by(ImpactMetrics.program_id, Programs.name)
        .all()
    )

    results = []
    total_value = 0
    total_investment = 0

    for i in impacts:
        value = float(i.value or 0)
        investment = float(i.investment or 1)
        sroi = value / investment if investment > 0 else 0

        total_value += value
        total_investment += investment

        results.append({
            "program_id": str(i.program_id),
            "program_name": i.program_name,
            "social_value": value,
            "investment": investment,
            "sroi": round(sroi, 2)
        })

    avg_sroi = round(sum(r["sroi"] for r in results) / len(results), 2) if results else 0
    overall_sroi = round(total_value / total_investment, 2) if total_investment > 0 else 0

    return {
        "organization_id": str(organization_id),
        "average_sroi": avg_sroi,
        "overall_sroi": overall_sroi,
        "total_social_value": total_value,
        "total_investment": total_investment,
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
        db.query(
            Stories.id,
            Stories.program_id,
            Stories.title,
            Stories.summary,
            Stories.story_date,
            Programs.name.label("program_name")
        )
        .join(Programs, Programs.id == Stories.program_id, isouter=True)
        .filter(Stories.organization_id == organization_id)
        .order_by(Stories.story_date.desc())
        .limit(limit)
        .all()
    )

    return {
        "organization_id": str(organization_id),
        "count": len(stories),
        "stories": [
            {
                "story_id": str(s.id),
                "program_id": str(s.program_id) if s.program_id else None,
                "program_name": s.program_name,
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
            Beneficiaries.country,
            Beneficiaries.state,
            Beneficiaries.city,
            func.count(Beneficiaries.id).label("count")
        )
        .filter(Beneficiaries.organization_id == organization_id)
        .group_by(Beneficiaries.country, Beneficiaries.state, Beneficiaries.city)
        .all()
    )

    regions = {}
    for r in rows:
        country = r.country or "Unknown"
        state = r.state or "N/A"
        city = r.city or "N/A"

        if country not in regions:
            regions[country] = {"states": {}, "total": 0}

        if state not in regions[country]["states"]:
            regions[country]["states"][state] = {"cities": [], "total": 0}

        regions[country]["states"][state]["cities"].append({
            "city": city,
            "beneficiaries": r.count
        })
        regions[country]["states"][state]["total"] += r.count
        regions[country]["total"] += r.count

    total = sum(data["total"] for data in regions.values())

    # Simplified view for backward compatibility
    simple_regions = {}
    for country, data in regions.items():
        simple_regions[country] = [
            {"state": state, "beneficiaries": state_data["total"]}
            for state, state_data in data["states"].items()
        ]

    return {
        "organization_id": str(organization_id),
        "total_beneficiaries": total,
        "regions": simple_regions,
        "detailed_regions": regions,
        "countries_served": len(regions)
    }


# ==========================================================
# 9️⃣ Program Summary (NEW)
# ==========================================================
@router.get("/{organization_id}/impact/program-summary/{program_id}", response_model=Dict)
def program_summary(
        organization_id: UUID,
        program_id: UUID,
        db: Session = Depends(get_db)
):
    """Get comprehensive summary for a single program."""

    # Get program details
    program = (
        db.query(Programs)
        .filter(Programs.organization_id == organization_id, Programs.id == program_id)
        .first()
    )

    if not program:
        return {"error": "Program not found"}

    # Count beneficiaries
    beneficiary_count = (
                            db.query(func.count(ProgramEnrollments.beneficiary_id.distinct()))
                            .filter(ProgramEnrollments.program_id == program_id)
                            .scalar()
                        ) or 0

    # Get SROI
    sroi_data = (
        db.query(
            func.sum(ImpactMetrics.social_value).label("value"),
            func.sum(ImpactMetrics.investment).label("investment")
        )
        .filter(ImpactMetrics.program_id == program_id)
        .first()
    )

    social_value = float(sroi_data.value or 0) if sroi_data else 0
    investment = float(sroi_data.investment or 1) if sroi_data else 1
    sroi = social_value / investment if investment > 0 else 0

    # Get outcome count
    outcome_count = (
                        db.query(func.count(OutcomeMetrics.id))
                        .filter(OutcomeMetrics.program_id == program_id)
                        .scalar()
                    ) or 0

    # Get story count
    story_count = (
                      db.query(func.count(Stories.id))
                      .filter(Stories.program_id == program_id)
                      .scalar()
                  ) or 0

    budget = float(program.budget or 0)
    actual_spending = float(program.actual_spending or 0)

    return {
        "organization_id": str(organization_id),
        "program": {
            "id": str(program.id),
            "name": program.name,
            "description": program.description,
            "status": program.status,
            "program_type": program.program_type,
            "start_date": program.start_date.isoformat() if program.start_date else None,
            "end_date": program.end_date.isoformat() if program.end_date else None
        },
        "metrics": {
            "beneficiaries": beneficiary_count,
            "target_beneficiaries": program.target_beneficiaries or 0,
            "budget": budget,
            "actual_spending": actual_spending,
            "budget_utilization": round((actual_spending / budget * 100), 1) if budget > 0 else 0,
            "cost_per_beneficiary": round(actual_spending / beneficiary_count, 2) if beneficiary_count > 0 else 0,
            "social_value": social_value,
            "investment": investment,
            "sroi": round(sroi, 2),
            "outcome_metrics_count": outcome_count,
            "stories_count": story_count
        }
    }