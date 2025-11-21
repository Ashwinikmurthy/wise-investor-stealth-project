"""
Financial Analytics API - Updated for New Schema
===============================================
Comprehensive financial health analytics for the Wise Investor platform.

Schema Adaptations:
- No Budget table: Uses Program expenses, Campaign goals, and DonationLines for budget tracking
- No age_group in Beneficiaries: Calculate from date_of_birth
- Uses OutcomeMetrics + OutcomeRecords instead of old Outcome model
- SdgAlignment and Stories remain similar

Author: Ashwini
Date: November 2025
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_, desc, asc, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field
from database import get_db
from models import (
    Organizations, Donations, DonationLines, Donors, Campaigns,
    Programs, Expenses, ExpenseCategories, Pledges, PledgeInstallments,
    RecurringGifts, Grants, GrantReports, Payments
)

router = APIRouter(prefix="/api/v1/financial-analytics", tags=["Financial Analytics"])


# ==========================================================
# PYDANTIC MODELS
# ==========================================================

class RevenueOverview(BaseModel):
    total_revenue: float
    yoy_change: float
    mtd_revenue: float
    ytd_revenue: float
    projected_annual: float
    revenue_by_source: Dict[str, float]

class ExpenseOverview(BaseModel):
    total_expenses: float
    yoy_change: float
    mtd_expenses: float
    ytd_expenses: float
    expenses_by_category: Dict[str, float]
    program_expense_ratio: float

class CashFlowItem(BaseModel):
    month: str
    inflows: float
    outflows: float
    net_flow: float
    cumulative: float

class FinancialRatios(BaseModel):
    program_expense_ratio: float
    admin_expense_ratio: float
    fundraising_efficiency: float
    operating_reserve_months: float
    debt_to_asset_ratio: float
    current_ratio: float

class BudgetVsActual(BaseModel):
    category: str
    budgeted: float
    actual: float
    variance: float
    variance_percentage: float
    status: str

class SustainabilityMetrics(BaseModel):
    recurring_revenue_ratio: float
    donor_dependency_index: float
    revenue_concentration: float
    months_of_reserves: float
    diversification_score: float

class FundingSource(BaseModel):
    source_type: str
    amount: float
    percentage: float
    donor_count: int
    trend: str

class MonthlyTrend(BaseModel):
    month: str
    revenue: float
    expenses: float
    net_income: float
    cumulative_net: float
class GrantBase(BaseModel):
    funder_name: str
    name: str
    description: Optional[str] = None
    funder_type: Optional[str] = None
    grant_type: Optional[str] = None
    amount_requested: Optional[float] = None
    deadline: Optional[date] = None
    status: str = "prospecting"
    probability: int = 50
    priority: str = "medium"
    program_id: Optional[UUID] = None


class GrantCreate(GrantBase):
    pass


class GrantUpdate(BaseModel):
    funder_name: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    amount_requested: Optional[float] = None
    amount_awarded: Optional[float] = None
    deadline: Optional[date] = None
    submission_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    probability: Optional[int] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None
    program_id: Optional[UUID] = None
    requirements: Optional[str] = None
    deliverables: Optional[str] = None
    notes: Optional[str] = None


class GrantResponse(GrantBase):
    id: UUID
    organization_id: UUID
    amount_awarded: Optional[float] = None
    submission_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GrantReportBase(BaseModel):
    report_type: str
    title: Optional[str] = None
    due_date: date
    status: str = "not_started"


class GrantReportCreate(GrantReportBase):
    grant_id: UUID


class GrantReportUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    narrative_content: Optional[str] = None
    challenges: Optional[str] = None
    next_steps: Optional[str] = None
    submitted_date: Optional[date] = None
    budget_spent: Optional[float] = None
    budget_remaining: Optional[float] = None


class GrantReportResponse(GrantReportBase):
    id: UUID
    grant_id: UUID
    organization_id: UUID
    submitted_date: Optional[date] = None
    accepted_date: Optional[date] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    budget_spent: Optional[float] = None
    budget_remaining: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# GRANT PIPELINE SUMMARY (for dashboard)
# ============================================================

class GrantPipelineSummary(BaseModel):
    total_grants: int
    total_requested: float
    total_awarded: float
    pipeline_value: float  # Sum of (amount_requested * probability/100)
    by_status: dict
    upcoming_deadlines: int
    overdue_reports: int
    success_rate: float


# ==========================================================
# HELPER FUNCTIONS
# ==========================================================

def safe_float(value, default=0.0):
    """Safely convert a value to float."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_divide(numerator, denominator, default=0.0):
    """Safely divide two numbers."""
    num = safe_float(numerator)
    den = safe_float(denominator)
    return num / den if den != 0 else default

def safe_round(value, decimals=2) -> float:
    """Safely round a value."""
    return round(safe_float(value), decimals)


def get_date_range(period: str) -> datetime:
    """Convert period string to start date."""
    months = {"3m": 3, "6m": 6, "12m": 12, "24m": 24}.get(period, 12)
    return datetime.now() - timedelta(days=months * 30)

def get_fiscal_year_start(org_fiscal_year_end: int = 12) -> date:
    """Get the start of the current fiscal year."""
    today = date.today()
    if today.month > org_fiscal_year_end:
        return date(today.year, org_fiscal_year_end + 1, 1)
    else:
        return date(today.year - 1, org_fiscal_year_end + 1, 1)

@router.get("/{organization_id}/cash-flow")
def get_cash_flow(
        organization_id: UUID,
        period: str = Query("12m", description="Period: 3m, 6m, 12m, 24m"),
        db: Session = Depends(get_db)
):
    """Get monthly cash flow data (inflows and outflows)."""

    # Determine date range
    months = {"3m": 3, "6m": 6, "12m": 12, "24m": 24}.get(period, 12)
    start_date = datetime.now() - timedelta(days=months * 30)

    # Monthly inflows (donations)
    inflows = (
        db.query(
            extract('year', Donations.donation_date).label('year'),
            extract('month', Donations.donation_date).label('month'),
            func.sum(Donations.amount).label('amount')
        )
        .filter(
            Donations.organization_id == organization_id,
            Donations.donation_date >= start_date
        )
        .group_by(
            extract('year', Donations.donation_date),
            extract('month', Donations.donation_date)
        )
        .all()
    )

    # Monthly outflows (expenses)
    outflows = (
        db.query(
            extract('year', Expenses.expense_date).label('year'),
            extract('month', Expenses.expense_date).label('month'),
            func.sum(Expenses.amount).label('amount')
        )
        .filter(
            Expenses.organization_id == organization_id,
            Expenses.expense_date >= start_date
        )
        .group_by(
            extract('year', Expenses.expense_date),
            extract('month', Expenses.expense_date)
        )
        .all()
    )

    # Create month-by-month data
    inflow_map = {(int(r.year), int(r.month)): safe_float(r.amount) for r in inflows}
    outflow_map = {(int(r.year), int(r.month)): safe_float(r.amount) for r in outflows}

    monthly_data = []
    current = datetime.now()
    for i in range(months):
        month_date = current - timedelta(days=i * 30)
        key = (month_date.year, month_date.month)
        inflow = inflow_map.get(key, 0)
        outflow = outflow_map.get(key, 0)
        monthly_data.append({
            "month": month_date.strftime("%Y-%m"),
            "month_name": month_date.strftime("%B %Y"),
            "inflow": safe_round(inflow),
            "outflow": safe_round(outflow),
            "net_flow": safe_round(inflow - outflow)
        })

    monthly_data.reverse()

    total_inflow = sum(d["inflow"] for d in monthly_data)
    total_outflow = sum(d["outflow"] for d in monthly_data)

    return {
        "organization_id": str(organization_id),
        "period": period,
        "monthly_data": monthly_data,
        "summary": {
            "total_inflow": safe_round(total_inflow),
            "total_outflow": safe_round(total_outflow),
            "net_cash_flow": safe_round(total_inflow - total_outflow),
            "avg_monthly_inflow": safe_round(safe_divide(total_inflow, len(monthly_data))),
            "avg_monthly_outflow": safe_round(safe_divide(total_outflow, len(monthly_data)))
        }
    }


# ==========================================================
# 2. BURN RATE
# ==========================================================
@router.get("/{organization_id}/burn-rate")
def get_burn_rate(
        organization_id: UUID,

        db: Session = Depends(get_db)
):
    """Calculate monthly burn rate based on expenses."""

    # Get last 6 months of expenses
    six_months_ago = datetime.now() - timedelta(days=180)

    monthly_expenses = (
        db.query(
            extract('year', Expenses.expense_date).label('year'),
            extract('month', Expenses.expense_date).label('month'),
            func.sum(Expenses.amount).label('amount')
        )
        .filter(
            Expenses.organization_id == organization_id,
            Expenses.expense_date >= six_months_ago
        )
        .group_by(
            extract('year', Expenses.expense_date),
            extract('month', Expenses.expense_date)
        )
        .order_by(
            extract('year', Expenses.expense_date),
            extract('month', Expenses.expense_date)
        )
        .all()
    )

    if not monthly_expenses:
        return {
            "organization_id": str(organization_id),
            "average_burn_rate": 0,
            "current_month_burn": 0,
            "previous_month_burn": 0,
            "burn_trend": 0,
            "monthly_data": []
        }

    monthly_data = []
    for exp in monthly_expenses:
        monthly_data.append({
            "year": int(exp.year),
            "month": int(exp.month),
            "amount": safe_round(exp.amount)
        })

    avg_burn = sum(d["amount"] for d in monthly_data) / len(monthly_data) if monthly_data else 0
    current_burn = monthly_data[-1]["amount"] if monthly_data else 0
    prev_burn = monthly_data[-2]["amount"] if len(monthly_data) > 1 else current_burn
    burn_trend = safe_divide(current_burn - prev_burn, prev_burn) * 100 if prev_burn else 0

    return {
        "organization_id": str(organization_id),
        "average_burn_rate": safe_round(avg_burn),
        "current_month_burn": safe_round(current_burn),
        "previous_month_burn": safe_round(prev_burn),
        "burn_trend": safe_round(burn_trend),
        "monthly_data": monthly_data
    }


# ==========================================================
# 3. RUNWAY
# ==========================================================
@router.get("/{organization_id}/runway")
def get_runway(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Calculate financial runway based on current cash and burn rate."""

    # Get total available cash (simplify: sum of donations - expenses)
    total_donations = (
                          db.query(func.sum(Donations.amount))
                          .filter(Donations.organization_id == organization_id)
                          .scalar()
                      ) or 0

    total_expenses = (
                         db.query(func.sum(Expenses.amount))
                         .filter(Expenses.organization_id == organization_id)
                         .scalar()
                     ) or 0

    available_cash = safe_float(total_donations) - safe_float(total_expenses)

    # Get average monthly burn rate (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    recent_expenses = (
                          db.query(func.sum(Expenses.amount))
                          .filter(
                              Expenses.organization_id == organization_id,
                              Expenses.expense_date >= six_months_ago
                          )
                          .scalar()
                      ) or 0

    avg_monthly_burn = safe_float(recent_expenses) / 6

    # Calculate runway in months
    runway_months = safe_divide(available_cash, avg_monthly_burn) if avg_monthly_burn > 0 else float('inf')

    # Get expected recurring revenue
    recurring_monthly = (
                            db.query(func.sum(RecurringGifts.amount))
                            .filter(
                                RecurringGifts.organization_id == organization_id

                            )
                            .scalar()
                        ) or 0

    # Adjusted runway with recurring income
    net_monthly_burn = avg_monthly_burn - safe_float(recurring_monthly)
    adjusted_runway = safe_divide(available_cash, net_monthly_burn) if net_monthly_burn > 0 else float('inf')

    # Cap infinity for JSON
    if runway_months == float('inf'):
        runway_months = 999
    if adjusted_runway == float('inf'):
        adjusted_runway = 999

    return {
        "organization_id": str(organization_id),
        "available_cash": safe_round(available_cash),
        "average_monthly_burn": safe_round(avg_monthly_burn),
        "recurring_monthly_income": safe_round(recurring_monthly),
        "runway_months": safe_round(runway_months),
        "adjusted_runway_months": safe_round(adjusted_runway),
        "status": "healthy" if runway_months > 6 else "caution" if runway_months > 3 else "critical"
    }


# ==========================================================
# 4. REVENUE STREAMS
# ==========================================================
@router.get("/{organization_id}/revenue-streams")
def get_revenue_streams(
        organization_id: UUID,
        period: str = Query("12m", description="Period: 3m, 6m, 12m, 24m"),
        db: Session = Depends(get_db)
):
    """Break down revenue by source/type."""
    start_date = get_date_range(period)
    # One-time donations
    one_time = (
                   db.query(func.sum(Donations.amount))
                   .filter(
                       Donations.organization_id == organization_id,
                       Donations.donation_date >= start_date,
                       or_(Donations.is_recurring == False, Donations.is_recurring == None)
                   )
                   .scalar()
               ) or 0

    # Recurring donations
    recurring = (
                    db.query(func.sum(Donations.amount))
                    .filter(
                        Donations.organization_id == organization_id,
                        Donations.donation_date >= start_date,
                        Donations.is_recurring == True
                    )
                    .scalar()
                ) or 0

    # Grants
    grants = (
                 db.query(func.sum(Grants.amount_awarded))
                 .filter(
                     Grants.organization_id == organization_id,
                     Grants.status == 'awarded'
                 )
                 .scalar()
             ) or 0

    # Major gifts (donations > $10,000)
    major_gifts = (
                      db.query(func.sum(Donations.amount))
                      .filter(
                          Donations.organization_id == organization_id,
                          Donations.donation_date >= start_date,
                          Donations.amount >= 10000
                      )
                      .scalar()
                  ) or 0

    total = safe_float(one_time) + safe_float(recurring) + safe_float(grants)

    streams = [
        {
            "name": "One-Time Donations",
            "amount": safe_round(one_time),
            "percentage": safe_round(safe_divide(one_time, total) * 100)
        },
        {
            "name": "Recurring Donations",
            "amount": safe_round(recurring),
            "percentage": safe_round(safe_divide(recurring, total) * 100)
        },
        {
            "name": "Grants",
            "amount": safe_round(grants),
            "percentage": safe_round(safe_divide(grants, total) * 100)
        }
    ]

    return {
        "organization_id": str(organization_id),
        "total_revenue": safe_round(total),
        "streams": streams,
        "major_gifts_total": safe_round(major_gifts),
        "diversification_score": safe_round(
            100 - sum((s["percentage"] ** 2) for s in streams) / 100
        )
    }


# ==========================================================
# 5. EXPENSE BREAKDOWN
# ==========================================================
@router.get("/{organization_id}/expense-breakdown")
def get_expense_breakdown(
        organization_id: UUID,
        period: str = Query("12m", description="Period: 3m, 6m, 12m, 24m"),
        db: Session = Depends(get_db)
):
    """Break down expenses by category."""
    start_date = get_date_range(period)
    # Get expenses by category
    by_category = (
        db.query(
            ExpenseCategories.name.label('category'),
            func.sum(Expenses.amount).label('amount')
        )
        .join(ExpenseCategories, Expenses.category_id == ExpenseCategories.id)
        .filter(Expenses.organization_id == organization_id,
                Expenses.expense_date >= start_date)
        .group_by(ExpenseCategories.name)
        .all()
    )

    total_expenses = sum(safe_float(c.amount) for c in by_category)

    categories = []
    for cat in by_category:
        amount = safe_float(cat.amount)
        categories.append({
            "category": cat.category,
            "amount": safe_round(amount),
            "percentage": safe_round(safe_divide(amount, total_expenses) * 100)
        })

    # Sort by amount descending
    categories.sort(key=lambda x: x["amount"], reverse=True)

    # Calculate program vs admin ratio
    program_categories = ['Programs', 'Program Services', 'Direct Services']
    admin_categories = ['Administrative', 'Management', 'General']

    program_expenses = sum(c["amount"] for c in categories if any(p in c["category"] for p in program_categories))
    admin_expenses = sum(c["amount"] for c in categories if any(a in c["category"] for a in admin_categories))

    return {
        "organization_id": str(organization_id),
        "total_expenses": safe_round(total_expenses),
        "categories": categories,
        "program_expenses": safe_round(program_expenses),
        "admin_expenses": safe_round(admin_expenses),
        "program_ratio": safe_round(safe_divide(program_expenses, total_expenses) * 100),
        "efficiency_score": safe_round(safe_divide(program_expenses, total_expenses) * 100)
    }


# ==========================================================
# 6. FINANCIAL RATIOS
# ==========================================================
@router.get("/{organization_id}/financial-ratios")
def get_financial_ratios(
        organization_id: UUID,
        period: str = Query("12m", description="Period: 3m, 6m, 12m, 24m"),
        db: Session = Depends(get_db)
):
    """Calculate key financial health ratios."""
    start_date = get_date_range(period)
    # Get totals
    total_revenue = (
                        db.query(func.sum(Donations.amount))
                        .filter(Donations.organization_id == organization_id,
                                Donations.donation_date >= start_date)
                        .scalar()
                    ) or 0

    total_expenses = (
                         db.query(func.sum(Expenses.amount))
                         .filter(Expenses.organization_id == organization_id,
                                 Expenses.expense_date >= start_date)
                         .scalar()
                     ) or 0

    # Get fundraising expenses
    fundraising_expenses = (
                               db.query(func.sum(Expenses.amount))
                               .join(ExpenseCategories, Expenses.category_id == ExpenseCategories.id)
                               .filter(
                                   Expenses.organization_id == organization_id,
                                   ExpenseCategories.name.ilike('%fundrais%')
                               )
                               .scalar()
                           ) or 0

    # Get program expenses
    program_expenses = (
                           db.query(func.sum(Expenses.amount))
                           .join(ExpenseCategories, Expenses.category_id == ExpenseCategories.id)
                           .filter(
                               Expenses.organization_id == organization_id,
                               or_(
                                   ExpenseCategories.name.ilike('%program%'),
                                   ExpenseCategories.name.ilike('%service%')
                               )
                           )
                           .scalar()
                       ) or 0

    revenue = safe_float(total_revenue)
    expenses = safe_float(total_expenses)
    fundraising = safe_float(fundraising_expenses)
    programs = safe_float(program_expenses)

    return {
        "organization_id": str(organization_id),
        "ratios": {
            "program_expense_ratio": safe_round(safe_divide(programs, expenses) * 100),
            "fundraising_efficiency": safe_round(safe_divide(revenue, fundraising)),
            "operating_reserve_ratio": safe_round(safe_divide(revenue - expenses, expenses / 12)),
            "revenue_growth": safe_round(0),  # Would need YoY data
            "expense_coverage": safe_round(safe_divide(revenue, expenses)),
            "current_ratio": safe_round(safe_divide(revenue, expenses))
        },
        "benchmarks": {
            "program_expense_ratio": {"target": 75, "industry_avg": 70},
            "fundraising_efficiency": {"target": 4.0, "industry_avg": 3.0},
            "operating_reserve_ratio": {"target": 6, "industry_avg": 3},
            "expense_coverage": {"target": 1.2, "industry_avg": 1.0}
        }
    }


# ==========================================================
# 7. BUDGET VARIANCE
# ==========================================================
@router.get("/{organization_id}/budget-variance")
def get_budget_variance(
        organization_id: UUID,
        period: str = Query("12m", description="Period: 3m, 6m, 12m, 24m"),
        db: Session = Depends(get_db)
):
    """Compare budget to actual spending by program."""
    start_date = get_date_range(period)
    # Get programs with their budgets and actual spending
    programs = (
        db.query(
            Programs.id,
            Programs.name,
            Programs.budget,
            func.coalesce(func.sum(Expenses.amount), 0).label('actual')
        )
        .outerjoin(Expenses, and_(
            Expenses.program_id == Programs.id,
            Expenses.organization_id == organization_id,
            Expenses.expense_date >= start_date
        ))
        .filter(Programs.organization_id == organization_id)
        .group_by(Programs.id, Programs.name, Programs.budget)
        .all()
    )

    variance_data = []
    total_budget = 0
    total_actual = 0

    for prog in programs:
        budget = safe_float(prog.budget)
        actual = safe_float(prog.actual)
        variance = budget - actual
        variance_pct = safe_divide(variance, budget) * 100 if budget else 0

        total_budget += budget
        total_actual += actual

        variance_data.append({
            "program_id": str(prog.id),
            "program_name": prog.name,
            "budget": safe_round(budget),
            "actual": safe_round(actual),
            "variance": safe_round(variance),
            "variance_percentage": safe_round(variance_pct),
            "status": "under" if variance > 0 else "over" if variance < 0 else "on_track"
        })

    # Sort by variance (most over budget first)
    variance_data.sort(key=lambda x: x["variance"])

    return {
        "organization_id": str(organization_id),
        "programs": variance_data,
        "summary": {
            "total_budget": safe_round(total_budget),
            "total_actual": safe_round(total_actual),
            "total_variance": safe_round(total_budget - total_actual),
            "variance_percentage": safe_round(safe_divide(total_budget - total_actual, total_budget) * 100),
            "programs_over_budget": sum(1 for p in variance_data if p["status"] == "over"),
            "programs_under_budget": sum(1 for p in variance_data if p["status"] == "under")
        }
    }


# ==========================================================
# 8. FINANCIAL FORECAST
# ==========================================================
@router.get("/{organization_id}/financial-forecast")
def get_financial_forecast(
        organization_id: UUID,
        months: int = Query(6, description="Number of months to forecast"),
        db: Session = Depends(get_db)
):
    """Project revenue and expenses for coming months."""

    # Get historical monthly data (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)

    # Monthly revenue
    monthly_revenue = (
        db.query(
            extract('month', Donations.donation_date).label('month'),
            func.sum(Donations.amount).label('amount')
        )
        .filter(
            Donations.organization_id == organization_id,
            Donations.donation_date >= six_months_ago
        )
        .group_by(extract('month', Donations.donation_date))
        .all()
    )

    # Monthly expenses
    monthly_expenses = (
        db.query(
            extract('month', Expenses.expense_date).label('month'),
            func.sum(Expenses.amount).label('amount')
        )
        .filter(
            Expenses.organization_id == organization_id,
            Expenses.expense_date >= six_months_ago
        )
        .group_by(extract('month', Expenses.expense_date))
        .all()
    )

    # Calculate averages
    avg_revenue = sum(safe_float(r.amount) for r in monthly_revenue) / max(len(monthly_revenue), 1)
    avg_expenses = sum(safe_float(e.amount) for e in monthly_expenses) / max(len(monthly_expenses), 1)

    # Get recurring revenue
    recurring = (
                db.query(func.sum(RecurringGifts.amount))
                .filter(
                    RecurringGifts.organization_id == organization_id,
                    RecurringGifts.next_charge_on >= date.today()  # Consider active if next charge is scheduled
                )
                .scalar()
            ) or 0

    recurring_monthly = safe_float(recurring)

    # Generate forecast
    forecast = []
    current = datetime.now()
    cumulative_balance = 0

    for i in range(1, months + 1):
        month_date = current + timedelta(days=i * 30)

        # Simple forecast: average + recurring
        projected_revenue = avg_revenue + recurring_monthly
        projected_expenses = avg_expenses
        net = projected_revenue - projected_expenses
        cumulative_balance += net

        forecast.append({
            "month": month_date.strftime("%Y-%m"),
            "month_name": month_date.strftime("%B %Y"),
            "projected_revenue": safe_round(projected_revenue),
            "projected_expenses": safe_round(projected_expenses),
            "projected_net": safe_round(net),
            "cumulative_balance": safe_round(cumulative_balance)
        })

    return {
        "organization_id": str(organization_id),
        "forecast_months": months,
        "forecast": forecast,
        "assumptions": {
            "base_monthly_revenue": safe_round(avg_revenue),
            "recurring_monthly": safe_round(recurring_monthly),
            "base_monthly_expenses": safe_round(avg_expenses)
        },
        "projected_year_end": {
            "total_revenue": safe_round(sum(f["projected_revenue"] for f in forecast)),
            "total_expenses": safe_round(sum(f["projected_expenses"] for f in forecast)),
            "net_position": safe_round(cumulative_balance)
        }
    }


# ==========================================================
# 9. DONOR CONCENTRATION
# ==========================================================
@router.get("/{organization_id}/donor-concentration")
def get_donor_concentration(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Calculate donor concentration using HHI."""

    # Get total donations per donor
    donor_totals = (
        db.query(
            Donations.donor_id,
            func.sum(Donations.amount).label('total')
        )
        .filter(Donations.organization_id == organization_id)
        .group_by(Donations.donor_id)
        .order_by(desc(func.sum(Donations.amount)))
        .all()
    )

    if not donor_totals:
        return {
            "organization_id": str(organization_id),
            "hhi_score": 0,
            "concentration_level": "unknown",
            "top_10_percentage": 0,
            "recommendations": ["Start tracking donations to build concentration metrics"]
        }

    total_revenue = sum(safe_float(d.total) for d in donor_totals)

    # Calculate HHI (Herfindahl-Hirschman Index)
    hhi = sum(
        (safe_float(d.total) / total_revenue * 100) ** 2
        for d in donor_totals
    ) if total_revenue > 0 else 0

    # Top 10 donors percentage
    top_10 = donor_totals[:10]
    top_10_total = sum(safe_float(d.total) for d in top_10)
    top_10_pct = safe_divide(top_10_total, total_revenue) * 100

    # Concentration level
    if hhi > 2500:
        level = "highly_concentrated"
    elif hhi > 1500:
        level = "moderately_concentrated"
    else:
        level = "diversified"

    # Generate recommendations
    recommendations = []
    if top_10_pct > 50:
        recommendations.append("Diversify donor base - top 10 donors contribute >50% of revenue")
    if hhi > 2500:
        recommendations.append("High concentration risk - develop mid-level donor programs")
    if len(donor_totals) < 100:
        recommendations.append("Expand donor acquisition efforts")

    return {
        "organization_id": str(organization_id),
        "total_donors": len(donor_totals),
        "total_revenue": safe_round(total_revenue),
        "hhi_score": safe_round(hhi),
        "concentration_level": level,
        "top_10_percentage": safe_round(top_10_pct),
        "top_10_donors": [
            {
                "donor_id": str(d.donor_id),
                "total": safe_round(d.total),
                "percentage": safe_round(safe_divide(d.total, total_revenue) * 100)
            }
            for d in top_10
        ],
        "recommendations": recommendations
    }


# ==========================================================
# 10. RECEIVABLES (Pledge Aging)
# ==========================================================
@router.get("/{organization_id}/receivables")
def get_receivables(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Analyze outstanding pledges and aging receivables."""

    today = date.today()

    # Get all pending pledge installments
    installments = (
        db.query(
            PledgeInstallments.due_date,
            PledgeInstallments.due_amount,
            PledgeInstallments.status
        )
        .join(Pledges, PledgeInstallments.pledge_id == Pledges.id)
        .filter(
            Pledges.organization_id == organization_id,
            PledgeInstallments.status.in_(['pending', 'overdue'])
        )
        .all()
    )

    # Aging buckets
    aging_buckets = {
        "current": 0,
        "1_30_days": 0,
        "31_60_days": 0,
        "61_90_days": 0,
        "over_90_days": 0
    }

    upcoming = Decimal('0')

    for inst in installments:
        amount = safe_float(inst.due_amount)
        if inst.due_date > today:
            upcoming += Decimal(str(amount))
        else:
            days_overdue = (today - inst.due_date).days
            if days_overdue <= 0:
                aging_buckets["current"] += amount
            elif days_overdue <= 30:
                aging_buckets["1_30_days"] += amount
            elif days_overdue <= 60:
                aging_buckets["31_60_days"] += amount
            elif days_overdue <= 90:
                aging_buckets["61_90_days"] += amount
            else:
                aging_buckets["over_90_days"] += amount

    total_receivables = safe_float(upcoming) + sum(aging_buckets.values())
    total_overdue = sum(aging_buckets.values()) - aging_buckets["current"]

    return {
        "organization_id": str(organization_id),
        "total_receivables": safe_round(total_receivables),
        "upcoming": safe_round(upcoming),
        "aging_buckets": {k: safe_round(v) for k, v in aging_buckets.items()},
        "total_overdue": safe_round(total_overdue),
        "overdue_percentage": safe_round(safe_divide(total_overdue, total_receivables) * 100),
        "collection_rate": safe_round(
            100 - safe_divide(sum(aging_buckets.values()), safe_float(upcoming) + sum(aging_buckets.values())) * 100, 1
        ) if (safe_float(upcoming) + sum(aging_buckets.values())) > 0 else 100
    }


# ==========================================================
# 11. DONOR FINANCIAL SUMMARY
# ==========================================================
@router.get("/{organization_id}/donor-financial-summary")
def get_donor_financial_summary(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Summary of donor financial contributions."""

    # Get summary statistics
    summary = (
        db.query(
            func.count(func.distinct(Donations.donor_id)).label("total_donors"),
            func.sum(Donations.amount).label("total_amount"),
            func.avg(Donations.amount).label("avg_donation"),
            func.max(Donations.amount).label("largest_donation")
        )
        .filter(Donations.organization_id == organization_id)
        .first()
    )

    # Recurring vs one-time
    recurring = (
                    db.query(func.sum(Donations.amount))
                    .filter(
                        Donations.organization_id == organization_id,
                        Donations.is_recurring == True
                    )
                    .scalar()
                ) or 0

    return {
        "organization_id": str(organization_id),
        "total_donors": summary.total_donors or 0,
        "total_donations": safe_round(summary.total_amount),
        "average_donation": safe_round(summary.avg_donation),
        "largest_donation": safe_round(summary.largest_donation),
        "recurring_revenue": safe_round(recurring),
        "one_time_revenue": safe_round(safe_float(summary.total_amount) - safe_float(recurring))
    }


# ==========================================================
# 12. CAMPAIGN ROI
# ==========================================================
@router.get("/{organization_id}/campaign-roi")
def get_campaign_roi(
        organization_id: UUID,
        db: Session = Depends(get_db)
):
    """Calculate ROI for campaigns."""

    campaigns = (
        db.query(
            Campaigns.id,
            Campaigns.name,
            Campaigns.goal_amount,
            func.sum(Donations.amount).label('raised_amount'),
            Campaigns.marketing_cost,
            func.count(func.distinct(Donations.donor_id)).label('donor_count')
        )
        .outerjoin(Donations, Donations.campaign_id == Campaigns.id)
        .filter(Campaigns.organization_id == organization_id)
        .group_by(
            Campaigns.id,
            Campaigns.name,
            Campaigns.goal_amount,
            Campaigns.marketing_cost
        )
        .all()
    )

    results = []
    for campaign in campaigns:
        raised = safe_float(campaign.raised_amount)
        cost = safe_float(campaign.marketing_cost)
        roi = safe_divide(raised - cost, cost) * 100 if cost > 0 else 0

        results.append({
            "campaign_id": str(campaign.id),
            "campaign_name": campaign.name or "Unnamed Campaign",
            "goal_amount": safe_round(campaign.goal_amount),
            "raised_amount": safe_round(raised),
            "marketing_cost": safe_round(cost),
            "roi_percentage": safe_round(roi),
            "progress_percentage": safe_round(safe_divide(raised, campaign.goal_amount) * 100) if campaign.goal_amount else 0,
            "donor_count": campaign.donor_count or 0
        })

    # Sort by ROI descending
    results.sort(key=lambda x: x["roi_percentage"], reverse=True)

    return {
        "organization_id": str(organization_id),
        "campaigns": results,
        "total_raised": safe_round(sum(r["raised_amount"] for r in results)),
        "total_cost": safe_round(sum(r["marketing_cost"] for r in results)),
        "average_roi": safe_round(
            sum(r["roi_percentage"] for r in results) / len(results) if results else 0
        )
    }
