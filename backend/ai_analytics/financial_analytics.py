from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta
from uuid import UUID
from typing import Dict, List

from ..database import get_db
from ..models import Donation, Expense, Budget  # adjust imports per your schema

router = APIRouter(prefix="/analytics", tags=["Financial Analytics"])


# ==========================================================
# 1️⃣ Cash Flow
# ==========================================================
@router.get("/{organization_id}/cash-flow", response_model=Dict)
def cash_flow(
        organization_id: UUID,
        period: str = Query("month", description="Choose 'month' or 'year'"),
        db: Session = Depends(get_db)
):
    """Compute inflows (donations, grants) and outflows (expenses) for a given period."""
    today = date.today()

    if period == "year":
        start = date(today.year, 1, 1)
    else:
        start = today.replace(day=1)
    end = today

    inflows = (
        db.query(func.coalesce(func.sum(Donation.intent_amount), 0))
        .filter(Donation.organization_id == organization_id,
                Donation.received_date >= start,
                Donation.received_date <= end)
        .scalar()
    )

    outflows = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.organization_id == organization_id,
                Expense.date >= start,
                Expense.date <= end)
        .scalar()
    )

    net_flow = float(inflows or 0) - float(outflows or 0)

    return {
        "organization_id": str(organization_id),
        "period": period,
        "inflows": float(inflows or 0),
        "outflows": float(outflows or 0),
        "net_cash_flow": round(net_flow, 2)
    }


# ==========================================================
# 2️⃣ Burn Rate
# ==========================================================
@router.get("/{organization_id}/burn-rate", response_model=Dict)
def burn_rate(organization_id: UUID, db: Session = Depends(get_db)):
    """Average monthly expense over the last 6 months."""
    today = date.today()
    start = today - timedelta(days=180)

    total_expense = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.organization_id == organization_id,
                Expense.date >= start,
                Expense.date <= today)
        .scalar()
    )

    monthly_burn = (float(total_expense or 0)) / 6.0

    return {
        "organization_id": str(organization_id),
        "period_months": 6,
        "avg_monthly_burn_rate": round(monthly_burn, 2)
    }


# ==========================================================
# 3️⃣ Runway
# ==========================================================
@router.get("/{organization_id}/runway", response_model=Dict)
def runway(organization_id: UUID, db: Session = Depends(get_db)):
    """Estimate runway (months of operation left) based on cash on hand / burn rate."""
    # Simplified: assume a "cash_balance" field in Budget or Finance table
    cash_on_hand = (
        db.query(func.coalesce(func.sum(Budget.cash_balance), 0))
        .filter(Budget.organization_id == organization_id)
        .scalar()
    )

    today = date.today()
    start = today - timedelta(days=180)
    total_expense = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.organization_id == organization_id,
                Expense.date >= start)
        .scalar()
    )
    monthly_burn = (float(total_expense or 0)) / 6.0
    months_runway = (float(cash_on_hand or 0) / monthly_burn) if monthly_burn > 0 else None

    return {
        "organization_id": str(organization_id),
        "cash_on_hand": float(cash_on_hand or 0),
        "burn_rate": round(monthly_burn, 2),
        "runway_months": round(months_runway, 1) if months_runway else None
    }


# ==========================================================
# 4️⃣ Revenue Streams
# ==========================================================
@router.get("/{organization_id}/revenue-streams", response_model=Dict)
def revenue_streams(organization_id: UUID, db: Session = Depends(get_db)):
    """Break down revenue by source (e.g., donations, grants, events)."""
    categories = (
        db.query(
            Donation.source.label("category"),
            func.sum(Donation.intent_amount).label("amount")
        )
        .filter(Donation.organization_id == organization_id)
        .group_by(Donation.source)
        .all()
    )

    breakdown = {row.category or "unspecified": float(row.amount or 0) for row in categories}
    total = sum(breakdown.values())

    return {
        "organization_id": str(organization_id),
        "total_revenue": total,
        "streams": breakdown
    }


# ==========================================================
# 5️⃣ Expense Breakdown
# ==========================================================
@router.get("/{organization_id}/expense-breakdown", response_model=Dict)
def expense_breakdown(organization_id: UUID, db: Session = Depends(get_db)):
    """Categorize expenses (program, admin, fundraising)."""
    categories = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("amount")
        )
        .filter(Expense.organization_id == organization_id)
        .group_by(Expense.category)
        .all()
    )

    breakdown = {row.category or "uncategorized": float(row.amount or 0) for row in categories}
    total = sum(breakdown.values())

    return {
        "organization_id": str(organization_id),
        "total_expenses": total,
        "categories": breakdown
    }


# ==========================================================
# 6️⃣ Financial Ratios
# ==========================================================
@router.get("/{organization_id}/financial-ratios", response_model=Dict)
def financial_ratios(organization_id: UUID, db: Session = Depends(get_db)):
    """Compute nonprofit financial health ratios (Program Expense Ratio, Fundraising Efficiency, etc.)."""

    total_expenses = (
                         db.query(func.sum(Expense.amount))
                         .filter(Expense.organization_id == organization_id)
                         .scalar()
                     ) or 0

    total_program = (
                        db.query(func.sum(Expense.amount))
                        .filter(Expense.organization_id == organization_id, Expense.category == "program")
                        .scalar()
                    ) or 0

    total_fundraising = (
                            db.query(func.sum(Expense.amount))
                            .filter(Expense.organization_id == organization_id, Expense.category == "fundraising")
                            .scalar()
                        ) or 0

    total_revenue = (
                        db.query(func.sum(Donation.intent_amount))
                        .filter(Donation.organization_id == organization_id)
                        .scalar()
                    ) or 0

    ratios = {
        "program_expense_ratio": round(total_program / total_expenses * 100, 2) if total_expenses else 0,
        "fundraising_efficiency": round(total_revenue / total_fundraising, 2) if total_fundraising else 0,
        "operating_margin": round((total_revenue - total_expenses) / total_revenue * 100, 2) if total_revenue else 0
    }

    return {
        "organization_id": str(organization_id),
        "ratios": ratios
    }


# ==========================================================
# 7️⃣ Budget Variance
# ==========================================================
@router.get("/{organization_id}/budget-variance", response_model=Dict)
def budget_variance(organization_id: UUID, db: Session = Depends(get_db)):
    """Compare actuals vs. budgeted for revenue and expenses."""
    budgets = db.query(Budget).filter(Budget.organization_id == organization_id).all()

    variance_data = []
    for b in budgets:
        actual_expenses = (
                              db.query(func.sum(Expense.amount))
                              .filter(Expense.organization_id == organization_id, Expense.category == b.category)
                              .scalar()
                          ) or 0

        actual_revenue = (
                             db.query(func.sum(Donation.intent_amount))
                             .filter(Donation.organization_id == organization_id, Donation.source == b.category)
                             .scalar()
                         ) or 0

        variance_data.append({
            "category": b.category,
            "budgeted_expense": float(b.expense_budget or 0),
            "actual_expense": float(actual_expenses),
            "budgeted_revenue": float(b.revenue_budget or 0),
            "actual_revenue": float(actual_revenue),
            "expense_variance": round(actual_expenses - float(b.expense_budget or 0), 2),
            "revenue_variance": round(actual_revenue - float(b.revenue_budget or 0), 2)
        })

    return {"organization_id": str(organization_id), "variance": variance_data}


# ==========================================================
# 8️⃣ Financial Forecast
# ==========================================================
@router.get("/{organization_id}/financial-forecast", response_model=Dict)
def financial_forecast(organization_id: UUID, db: Session = Depends(get_db)):
    """Simple linear projection of next quarter’s revenue and expenses."""
    year = date.today().year

    monthly = (
        db.query(
            extract('month', Donation.received_date).label('month'),
            func.sum(Donation.intent_amount).label('revenue'),
            func.coalesce(func.sum(Expense.amount), 0).label('expense')
        )
        .outerjoin(Expense, Expense.organization_id == Donation.organization_id)
        .filter(Donation.organization_id == organization_id,
                extract('year', Donation.received_date) == year)
        .group_by('month')
        .order_by('month')
        .all()
    )

    forecast = []
    for row in monthly:
        avg_growth = 1.05  # assume 5% month-over-month growth
        next_rev = float(row.revenue or 0) * avg_growth
        next_exp = float(row.expense or 0) * 1.02
        forecast.append({
            "month": int(row.month),
            "projected_revenue": round(next_rev, 2),
            "projected_expense": round(next_exp, 2)
        })

    return {
        "organization_id": str(organization_id),
        "forecast": forecast,
        "assumptions": {"growth_rate": 5, "expense_growth": 2}
    }
