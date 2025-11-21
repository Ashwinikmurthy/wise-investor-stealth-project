"""
Predictive Analytics API for Executive Dashboard
Wise Investor Platform

These endpoints provide forward-looking metrics:
- Revenue forecasting with confidence intervals
- Donor churn risk prediction
- Campaign momentum tracking
- Goal attainment projection
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import UUID
import numpy as np
from statistics import mean, stdev

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import Organizations, Donors, Donations

router = APIRouter(prefix="/api/v1/analytics/predictive", tags=["Predictive Analytics"])


# ============================================================================
# REVENUE FORECASTING
# ============================================================================

@router.get("/revenue-forecast/{organization_id}")
async def get_revenue_forecast(
        organization_id: UUID,
        quarter: Optional[str] = Query(None, description="Specific quarter (Q1-Q4) or None for current"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Revenue Forecast with Confidence Interval

    Uses historical data patterns, seasonality, and trends to forecast revenue.
    Provides confidence intervals based on historical variance.
    """
    verify_organization_access(current_user, organization_id)

    current_date = datetime.now()
    current_quarter = (current_date.month - 1) // 3 + 1
    target_quarter = current_quarter if not quarter else int(quarter[1])

    # Calculate quarter dates
    if target_quarter <= current_quarter:
        year = current_date.year
    else:
        year = current_date.year if current_quarter < 4 else current_date.year + 1

    quarter_start = datetime(year, (target_quarter - 1) * 3 + 1, 1)
    if target_quarter == 4:
        quarter_end = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        quarter_end = datetime(year, target_quarter * 3 + 1, 1) - timedelta(days=1)

    # Get historical data for the same quarter in previous years
    historical_data = []
    for year_offset in range(1, 4):  # Look at past 3 years
        hist_year = current_date.year - year_offset
        hist_start = datetime(hist_year, (target_quarter - 1) * 3 + 1, 1)
        if target_quarter == 4:
            hist_end = datetime(hist_year + 1, 1, 1) - timedelta(days=1)
        else:
            hist_end = datetime(hist_year, target_quarter * 3 + 1, 1) - timedelta(days=1)

        quarter_revenue = db.query(func.sum(Donations.amount)).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(hist_start, hist_end)
        ).scalar() or 0

        historical_data.append(float(quarter_revenue))

    # Get year-to-date performance
    ytd_start = datetime(current_date.year, 1, 1)
    ytd_actual = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(ytd_start, current_date)
    ).scalar() or 0

    # Get current quarter progress
    current_q_start = datetime(current_date.year, (current_quarter - 1) * 3 + 1, 1)
    current_q_revenue = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(current_q_start, current_date)
    ).scalar() or 0

    # Calculate forecast
    if historical_data:
        # Calculate trend
        growth_rates = []
        for i in range(len(historical_data) - 1):
            if historical_data[i + 1] > 0:
                growth_rate = (historical_data[i] - historical_data[i + 1]) / historical_data[i + 1]
                growth_rates.append(growth_rate)

        avg_growth = mean(growth_rates) if growth_rates else 0.1

        # Base forecast on most recent year with growth adjustment
        base_forecast = historical_data[0] * (1 + avg_growth)

        # Adjust based on current year performance
        days_elapsed = (current_date - ytd_start).days
        days_in_year = 365
        expected_ytd = base_forecast * (days_elapsed / days_in_year)

        if expected_ytd > 0:
            performance_ratio = float(ytd_actual) / expected_ytd
            adjusted_forecast = base_forecast * performance_ratio
        else:
            adjusted_forecast = base_forecast

        # Calculate confidence interval
        if len(historical_data) > 1:
            std_dev = stdev(historical_data)
            confidence_margin = std_dev * 1.96 / (len(historical_data) ** 0.5)
        else:
            confidence_margin = adjusted_forecast * 0.15

        # Calculate confidence score (0-100)
        variance_coefficient = (std_dev / mean(historical_data)) if historical_data else 0.5
        confidence_score = max(0, min(100, (1 - variance_coefficient) * 100))

    else:
        # No historical data - use current run rate
        days_elapsed = (current_date - ytd_start).days
        if days_elapsed > 0:
            daily_rate = float(ytd_actual) / days_elapsed
            days_in_quarter = (quarter_end - quarter_start).days
            adjusted_forecast = daily_rate * days_in_quarter
            confidence_margin = adjusted_forecast * 0.25
            confidence_score = 50
        else:
            adjusted_forecast = 0
            confidence_margin = 0
            confidence_score = 0

    return {
        "quarter": f"Q{target_quarter} {year}",
        "forecast": {
            "amount": round(adjusted_forecast, 2),
            "lower_bound": round(max(0, adjusted_forecast - confidence_margin), 2),
            "upper_bound": round(adjusted_forecast + confidence_margin, 2),
            "confidence_score": round(confidence_score, 1),
            "confidence_label": get_confidence_label(confidence_score)
        },
        "current_progress": {
            "actual_to_date": round(float(current_q_revenue), 2),
            "days_remaining": (quarter_end - current_date).days,
            "percent_complete": round((current_date - quarter_start).days / (quarter_end - quarter_start).days * 100, 1)
        },
        "historical_comparison": {
            "same_quarter_last_year": round(historical_data[0], 2) if historical_data else 0,
            "average_past_3_years": round(mean(historical_data), 2) if historical_data else 0,
            "growth_trend": f"{round(avg_growth * 100, 1)}%" if historical_data else "N/A"
        }
    }


# ============================================================================
# DONOR CHURN RISK PREDICTION
# ============================================================================

@router.get("/donor-churn-risk/{organization_id}")
async def get_donor_churn_risk(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Donor Churn Risk Prediction

    Identifies at-risk donors and predicts churn rate for next month.
    Based on giving patterns, engagement metrics, and historical behavior.
    """
    verify_organization_access(current_user, organization_id)

    current_date = datetime.now()

    # Define risk periods
    days_30 = current_date - timedelta(days=30)
    days_60 = current_date - timedelta(days=60)
    days_90 = current_date - timedelta(days=90)
    days_180 = current_date - timedelta(days=180)
    days_365 = current_date - timedelta(days=365)

    # Get active donors (gave in last 12 months)
    active_donors = db.query(Donors.id).join(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= days_365
    ).distinct().count()

    # Categorize donors by risk level
    high_risk = db.query(Donors.id).join(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(days_180, days_90),
        ~Donors.id.in_(
            db.query(Donations.donor_id).filter(
                Donations.organization_id == organization_id,
                Donations.donation_date > days_90
            )
        )
    ).distinct().count()

    medium_risk = db.query(Donors.id).join(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(days_90, days_60),
        ~Donors.id.in_(
            db.query(Donations.donor_id).filter(
                Donations.organization_id == organization_id,
                Donations.donation_date > days_60
            )
        )
    ).distinct().count()

    low_risk = db.query(Donors.id).join(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= days_30
    ).distinct().count()

    # Calculate predicted churn
    historical_churn_rate = 0.082  # Industry average monthly churn

    # Get organization's actual churn rate from last 3 months
    three_months_ago = current_date - timedelta(days=90)
    donors_3m_ago = db.query(Donors.id).join(Donations).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(days_365, three_months_ago)
    ).distinct().count()

    if donors_3m_ago > 0:
        retained = db.query(Donors.id).join(Donations).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date >= three_months_ago,
            Donors.id.in_(
                db.query(Donations.donor_id).filter(
                    Donations.organization_id == organization_id,
                    Donations.donation_date.between(days_365, three_months_ago)
                )
            )
        ).distinct().count()

        actual_churn_rate = 1 - (retained / donors_3m_ago)
        # Blend actual with industry average
        predicted_churn_rate = (actual_churn_rate * 0.7 + historical_churn_rate * 0.3)
    else:
        predicted_churn_rate = historical_churn_rate

    predicted_churn_count = int(active_donors * predicted_churn_rate / 3)  # Monthly

    # Get value at risk
    at_risk_value = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        Donations.donor_id.in_(
            db.query(Donors.id).join(Donations).filter(
                Donations.organization_id == organization_id,
                Donations.donation_date.between(days_180, days_90),
                ~Donors.id.in_(
                    db.query(Donations.donor_id).filter(
                        Donations.organization_id == organization_id,
                        Donations.donation_date > days_90
                    )
                )
            )
        ),
        Donations.donation_date >= days_365
    ).scalar() or 0

    return {
        "risk_metrics": {
            "predicted_rate": round(predicted_churn_rate * 100, 1),
            "predicted_count": predicted_churn_count,
            "confidence": "Medium",
            "next_month_label": f"{predicted_churn_count} donors"
        },
        "risk_breakdown": {
            "high_risk": {
                "count": high_risk,
                "description": "No gift in 90-180 days",
                "action": "Immediate reactivation needed"
            },
            "medium_risk": {
                "count": medium_risk,
                "description": "No gift in 60-90 days",
                "action": "Engagement campaign recommended"
            },
            "low_risk": {
                "count": low_risk,
                "description": "Gave within 30 days",
                "action": "Continue stewardship"
            }
        },
        "financial_impact": {
            "at_risk_value": round(float(at_risk_value), 2),
            "monthly_impact": round(float(at_risk_value) / 12, 2)
        },
        "trend": "increasing" if predicted_churn_rate > historical_churn_rate else "decreasing"
    }


# ============================================================================
# CAMPAIGN MOMENTUM
# ============================================================================

@router.get("/campaign-momentum/{organization_id}")
async def get_campaign_momentum(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Campaign Momentum Analysis

    Measures velocity and acceleration of fundraising efforts.
    Compares current period to previous periods to identify trends.
    """
    verify_organization_access(current_user, organization_id)

    current_date = datetime.now()

    # Define periods for comparison
    periods = []
    for weeks_back in [0, 1, 2, 3, 4]:
        period_end = current_date - timedelta(weeks=weeks_back)
        period_start = period_end - timedelta(weeks=1)

        revenue = db.query(func.sum(Donations.amount)).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(period_start, period_end)
        ).scalar() or 0

        donor_count = db.query(func.count(func.distinct(Donations.donor_id))).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(period_start, period_end)
        ).scalar() or 0

        gift_count = db.query(func.count(Donations.id)).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(period_start, period_end)
        ).scalar() or 0

        periods.append({
            "week": weeks_back,
            "revenue": float(revenue),
            "donors": donor_count,
            "gifts": gift_count
        })

    # Calculate momentum (week over week change)
    if len(periods) >= 2:
        current_week = periods[0]
        last_week = periods[1]

        if last_week["revenue"] > 0:
            revenue_momentum = ((current_week["revenue"] - last_week["revenue"]) / last_week["revenue"]) * 100
        else:
            revenue_momentum = 100 if current_week["revenue"] > 0 else 0

        if last_week["donors"] > 0:
            donor_momentum = ((current_week["donors"] - last_week["donors"]) / last_week["donors"]) * 100
        else:
            donor_momentum = 100 if current_week["donors"] > 0 else 0

        # Calculate acceleration (change in momentum)
        if len(periods) >= 3:
            week_2 = periods[2]
            if week_2["revenue"] > 0:
                prev_momentum = ((last_week["revenue"] - week_2["revenue"]) / week_2["revenue"]) * 100
                acceleration = revenue_momentum - prev_momentum
                velocity_label = "Accelerating" if acceleration > 5 else "Decelerating" if acceleration < -5 else "Steady"
            else:
                acceleration = revenue_momentum
                velocity_label = "Accelerating" if acceleration > 0 else "Starting"
        else:
            acceleration = 0
            velocity_label = "Building"

        # Calculate average over 4 weeks
        four_week_avg = mean([p["revenue"] for p in periods[:4]]) if len(periods) >= 4 else current_week["revenue"]

        momentum_score = revenue_momentum
    else:
        momentum_score = 0
        velocity_label = "Insufficient Data"
        revenue_momentum = 0
        donor_momentum = 0
        four_week_avg = 0

    return {
        "momentum": {
            "score": round(momentum_score, 1),
            "velocity": velocity_label,
            "revenue_change": f"+{round(revenue_momentum, 1)}%" if revenue_momentum > 0 else f"{round(revenue_momentum, 1)}%",
            "donor_change": f"+{round(donor_momentum, 1)}%" if donor_momentum > 0 else f"{round(donor_momentum, 1)}%"
        },
        "weekly_trend": [
            {
                "period": f"Week {-p['week']}" if p['week'] != 0 else "This Week",
                "revenue": round(p["revenue"], 2),
                "donors": p["donors"],
                "gifts": p["gifts"]
            }
            for p in periods
        ],
        "indicators": {
            "four_week_average": round(four_week_avg, 2),
            "current_vs_average": round(((periods[0]["revenue"] - four_week_avg) / four_week_avg * 100) if four_week_avg > 0 else 0, 1),
            "trend_direction": "up" if revenue_momentum > 10 else "down" if revenue_momentum < -10 else "flat"
        }
    }


# ============================================================================
# GOAL ATTAINMENT PROJECTION
# ============================================================================

@router.get("/goal-attainment/{organization_id}")
async def get_goal_attainment(
        organization_id: UUID,
        annual_goal: Optional[float] = Query(None, description="Annual fundraising goal"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Goal Attainment Projection

    Projects year-end achievement based on current performance and trends.
    Provides confidence intervals and recommendations.
    """
    verify_organization_access(current_user, organization_id)

    current_date = datetime.now()
    year_start = datetime(current_date.year, 1, 1)
    year_end = datetime(current_date.year, 12, 31)

    # Get actual YTD
    ytd_actual = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date.between(year_start, current_date)
    ).scalar() or 0

    # If no goal provided, estimate based on last year + 10%
    if not annual_goal:
        last_year_total = db.query(func.sum(Donations.amount)).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(
                datetime(current_date.year - 1, 1, 1),
                datetime(current_date.year - 1, 12, 31)
            )
        ).scalar() or 0
        annual_goal = float(last_year_total) * 1.1 if last_year_total else 1000000

    # Calculate days elapsed and remaining
    days_elapsed = (current_date - year_start).days
    days_total = (year_end - year_start).days + 1
    days_remaining = days_total - days_elapsed
    percent_year_complete = (days_elapsed / days_total) * 100

    # Current progress
    current_attainment = (float(ytd_actual) / annual_goal * 100) if annual_goal > 0 else 0

    # Calculate run rate projection
    if days_elapsed > 0:
        daily_rate = float(ytd_actual) / days_elapsed
        simple_projection = daily_rate * days_total
        simple_attainment = (simple_projection / annual_goal * 100) if annual_goal > 0 else 0
    else:
        simple_projection = 0
        simple_attainment = 0

    # Get monthly performance for trend analysis
    monthly_totals = []
    for month in range(1, current_date.month + 1):
        month_start = datetime(current_date.year, month, 1)
        if month == current_date.month:
            month_end = current_date
        else:
            if month == 12:
                month_end = datetime(current_date.year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = datetime(current_date.year, month + 1, 1) - timedelta(days=1)

        month_total = db.query(func.sum(Donations.amount)).filter(
            Donations.organization_id == organization_id,
            Donations.donation_date.between(month_start, month_end)
        ).scalar() or 0
        monthly_totals.append(float(month_total))

    # Calculate trend-based projection
    if len(monthly_totals) >= 3:
        # Calculate average monthly growth
        growth_rates = []
        for i in range(1, len(monthly_totals)):
            if monthly_totals[i-1] > 0:
                growth = (monthly_totals[i] - monthly_totals[i-1]) / monthly_totals[i-1]
                growth_rates.append(growth)

        avg_growth = mean(growth_rates) if growth_rates else 0

        # Project remaining months
        last_month_avg = mean(monthly_totals[-3:]) if len(monthly_totals) >= 3 else monthly_totals[-1]
        remaining_months = 12 - current_date.month

        projected_remaining = 0
        for month_offset in range(1, remaining_months + 1):
            projected_month = last_month_avg * ((1 + avg_growth) ** month_offset)
            projected_remaining += projected_month

        trend_projection = float(ytd_actual) + projected_remaining
        trend_attainment = (trend_projection / annual_goal * 100) if annual_goal > 0 else 0
    else:
        trend_projection = simple_projection
        trend_attainment = simple_attainment

    # Determine final projection (weighted average)
    final_projection = trend_projection * 0.7 + simple_projection * 0.3
    final_attainment = (final_projection / annual_goal * 100) if annual_goal > 0 else 0

    # Calculate required daily rate to meet goal
    remaining_needed = max(0, annual_goal - float(ytd_actual))
    required_daily_rate = remaining_needed / days_remaining if days_remaining > 0 else 0
    current_daily_rate = float(ytd_actual) / days_elapsed if days_elapsed > 0 else 0

    return {
        "current_status": {
            "percent_complete": round(current_attainment, 1),
            "actual_ytd": round(float(ytd_actual), 2),
            "goal": round(annual_goal, 2),
            "remaining_needed": round(remaining_needed, 2)
        },
        "projection": {
            "projected_total": round(final_projection, 2),
            "projected_attainment": round(final_attainment, 1),
            "confidence": "High" if len(monthly_totals) >= 6 else "Medium" if len(monthly_totals) >= 3 else "Low",
            "method": "Trend-based" if len(monthly_totals) >= 3 else "Run-rate"
        },
        "time_analysis": {
            "percent_year_elapsed": round(percent_year_complete, 1),
            "days_remaining": days_remaining,
            "months_remaining": 12 - current_date.month
        },
        "required_performance": {
            "daily_rate_needed": round(required_daily_rate, 2),
            "current_daily_rate": round(current_daily_rate, 2),
            "increase_needed": round(((required_daily_rate - current_daily_rate) / current_daily_rate * 100) if current_daily_rate > 0 else 0, 1)
        },
        "achievement_likelihood": get_achievement_likelihood(final_attainment, percent_year_complete)
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_confidence_label(score: float) -> str:
    """Convert confidence score to label"""
    if score >= 80:
        return "High"
    elif score >= 60:
        return "Medium-High"
    elif score >= 40:
        return "Medium"
    elif score >= 20:
        return "Low-Medium"
    else:
        return "Low"


def get_achievement_likelihood(projected_attainment: float, percent_elapsed: float) -> str:
    """Determine likelihood of achieving goal"""

    # Expected progress ratio
    if percent_elapsed > 0:
        progress_ratio = projected_attainment / percent_elapsed
    else:
        progress_ratio = 0

    if projected_attainment >= 100:
        return "Very Likely - On track to exceed goal"
    elif projected_attainment >= 90:
        return "Likely - Strong performance expected"
    elif projected_attainment >= 75:
        return "Possible - Increased effort needed"
    elif projected_attainment >= 50:
        return "Challenging - Significant acceleration required"
    else:
        return "Unlikely - Major intervention needed"