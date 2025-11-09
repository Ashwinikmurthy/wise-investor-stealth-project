from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from datetime import date, timedelta
from uuid import UUID
from typing import Dict, List

from database import get_db
from models_major_gifts import (
    GiftGoal, DonorMeeting, MajorGiftOfficer, MajorGiftPortfolio
)
from models import Donation, Party  # assuming these exist globally

router = APIRouter(prefix="/analytics", tags=["Donor Analytics"])


# ==========================================================
# 1️⃣ Donor Retention
# ==========================================================
@router.get("/{organization_id}/donor-retention", response_model=Dict)
def donor_retention(
        organization_id: UUID,
        period: str = Query("year", description="Choose 'month' or 'year'"),
        db: Session = Depends(get_db)
):
    """Calculate donor retention = (# repeat donors) / (# donors last period) * 100"""

    today = date.today()
    if period == "month":
        prev_start = today.replace(day=1) - timedelta(days=30)
        prev_end = today.replace(day=1)
        curr_start = today.replace(day=1)
        curr_end = today
    else:
        prev_start = date(today.year - 1, 1, 1)
        prev_end = date(today.year - 1, 12, 31)
        curr_start = date(today.year, 1, 1)
        curr_end = today

    prev_donors = db.query(func.distinct(Donation.party_id)).filter(
        Donation.organization_id == organization_id,
        Donation.received_date >= prev_start,
        Donation.received_date <= prev_end
    ).subquery()

    curr_donors = db.query(func.distinct(Donation.party_id)).filter(
        Donation.organization_id == organization_id,
        Donation.received_date >= curr_start,
        Donation.received_date <= curr_end
    ).subquery()

    retained = db.query(func.count(func.distinct(Donation.party_id))).filter(
        Donation.organization_id == organization_id,
        Donation.party_id.in_(prev_donors)
    ).filter(
        Donation.party_id.in_(curr_donors)
    ).scalar() or 0

    prev_total = db.query(func.count(func.distinct(Donation.party_id))).filter(
        Donation.organization_id == organization_id,
        Donation.received_date >= prev_start,
        Donation.received_date <= prev_end
    ).scalar() or 1

    retention_rate = (retained / prev_total) * 100

    return {
        "organization_id": str(organization_id),
        "period": period,
        "retained_donors": retained,
        "previous_donors": prev_total,
        "retention_rate": round(retention_rate, 2)
    }


# ==========================================================
# 2️⃣ Donor Cohorts
# ==========================================================
@router.get("/{organization_id}/donor-cohorts", response_model=Dict)
def donor_cohorts(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Return yearly donor acquisition and retention cohorts"""
    year_expr = extract('year', Donation.received_date)

    donors_by_year = db.query(
        year_expr.label('year'),
        func.count(func.distinct(Donation.party_id)).label('donor_count'),
        func.sum(Donation.intent_amount).label('total_amount')
    ).filter(
        Donation.organization_id == organization_id
    ).group_by(year_expr).order_by('year').all()

    cohorts = [
        {
            "year": int(r.year),
            "donor_count": r.donor_count,
            "total_amount": float(r.total_amount or 0)
        }
        for r in donors_by_year
    ]

    return {
        "organization_id": str(organization_id),
        "cohorts": cohorts
    }


# ==========================================================
# 3️⃣ Churn Prediction (simplified heuristic)
# ==========================================================
@router.get("/{organization_id}/churn-prediction", response_model=Dict)
def churn_prediction(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Predict donors at risk of churn.
    Simple heuristic: donors who haven't given in 12+ months.
    """

    today = date.today()
    cutoff = today - timedelta(days=365)

    donors_last_year = db.query(
        Party.id,
        Party.donor_level,
        func.max(Donation.received_date).label('last_donation_date')
    ).join(Donation, Party.id == Donation.party_id).filter(
        Donation.organization_id == organization_id
    ).group_by(Party.id, Party.donor_level).all()

    churn_risks = []
    for d in donors_last_year:
        if d.last_donation_date < cutoff:
            churn_risks.append({
                "party_id": str(d.id),
                "donor_level": d.donor_level,
                "last_donation_date": d.last_donation_date.isoformat(),
                "days_since_last_gift": (today - d.last_donation_date).days
            })

    return {
        "organization_id": str(organization_id),
        "cutoff_date": cutoff.isoformat(),
        "churn_risk_count": len(churn_risks),
        "churn_risks": churn_risks
    }


# ==========================================================
# 4️⃣ Donor Lifetime Value (LTV)
# ==========================================================
@router.get("/{organization_id}/donor-ltv", response_model=Dict)
def donor_ltv(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Compute Lifetime Value (LTV) per donor:
    total_donations / number_of_years_active
    """

    today = date.today()
    ltv_rows = db.query(
        Donation.party_id,
        func.min(Donation.received_date).label('first_gift'),
        func.max(Donation.received_date).label('last_gift'),
        func.sum(Donation.intent_amount).label('total_gift')
    ).filter(
        Donation.organization_id == organization_id
    ).group_by(Donation.party_id).all()

    donors = []
    for row in ltv_rows:
        years_active = max(1, (row.last_gift.year - row.first_gift.year + 1))
        ltv = float(row.total_gift or 0) / years_active
        donors.append({
            "party_id": str(row.party_id),
            "total_gift": float(row.total_gift or 0),
            "years_active": years_active,
            "ltv": round(ltv, 2)
        })

    avg_ltv = round(sum(d["ltv"] for d in donors) / len(donors), 2) if donors else 0

    return {
        "organization_id": str(organization_id),
        "average_ltv": avg_ltv,
        "donors": donors
    }


# ==========================================================
# 5️⃣ Reactivation Potential
# ==========================================================
@router.get("/{organization_id}/reactivation-potential", response_model=Dict)
def reactivation_potential(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """
    Identify lapsed donors with high reactivation potential.
    Criteria:
      - Gave 2+ gifts in past, but none in last 12 months
      - Total historical gifts > $500
    """

    today = date.today()
    cutoff = today - timedelta(days=365)

    donors = db.query(
        Donation.party_id,
        func.count(Donation.id).label('gift_count'),
        func.sum(Donation.intent_amount).label('total_amount'),
        func.max(Donation.received_date).label('last_gift_date')
    ).filter(
        Donation.organization_id == organization_id
    ).group_by(Donation.party_id).having(
        func.count(Donation.id) >= 2,
        func.sum(Donation.intent_amount) > 500
    ).all()

    reactivation_candidates = [
        {
            "party_id": str(d.party_id),
            "total_amount": float(d.total_amount or 0),
            "gift_count": d.gift_count,
            "last_gift_date": d.last_gift_date.isoformat(),
            "months_since_last_gift": round((today - d.last_gift_date).days / 30, 1)
        }
        for d in donors if d.last_gift_date < cutoff
    ]

    return {
        "organization_id": str(organization_id),
        "candidate_count": len(reactivation_candidates),
        "candidates": reactivation_candidates
    }
