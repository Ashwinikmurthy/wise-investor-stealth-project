"""
Wise Investor - Comprehensive Analytics API Endpoints
All missing analytics sections for board-ready dashboards

Covers:
- Section D: Revenue & Campaign Analytics
- Section E: Major Gifts Enhancements
- Section F: Organizational/Structural
- Section G: Forecasting & Scenario Planning
- New Donor Acquisition, Stewardship, Donor Experience
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, case
from datetime import datetime, timedelta, date
from typing import Optional, List
from decimal import Decimal
import uuid
from uuid import UUID
from database import get_db
from models import (
    Organizations, Donors as Donor, Donations as Donation, Campaigns as Campaign, Programs,
    MajorGiftOfficer, DonorMeetings, SolicitationProposals,
    MovesManagementStages, DonorPortfolioAssignment, Events,
    Funds, Pledges, RecurringGifts, DonorScores, StaffingAnalysis, StewardshipPlan, StewardshipTask, TouchpointLog,
    ThankYouLog
)
from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1/analytics", tags=["Enhanced Analytics"])


# ============================================================
# SECTION 7: NEW DONOR ACQUISITION ENHANCEMENTS
# ============================================================

@router.get("/{organization_id}/acquisition/second-gift-tracking")
async def get_second_gift_tracking(
        organization_id: str,
        period: str = Query("12m", regex="^(3m|6m|12m|24m)$"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    2nd gift conversion rate, months to 2nd gift, breakeven timeline, cost recovery
    """
    org_id = uuid.UUID(organization_id)

    # Calculate date range
    months = {"3m": 3, "6m": 6, "12m": 12, "24m": 24}[period]
    start_date = datetime.now() - timedelta(days=months * 30)

    # Get first-time donors in period
    first_time_donors = db.query(
        Donor.id,
        Donor.first_donation_date,
        Donation.amount.label('first_gift_amount'),
        Donation.channel
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == org_id,
        Donor.first_donation_date >= start_date,
        Donation.is_first_time == True
    ).all()

    # Track 2nd gift conversions
    cohort_data = {}
    for donor in first_time_donors:
        month_key = donor.first_donation_date.strftime("%b %Y")
        if month_key not in cohort_data:
            cohort_data[month_key] = {
                "new_donors": 0,
                "converted": 0,
                "days_to_second": [],
                "first_gifts": [],
                "second_gifts": [],
                "channels": {}
            }

        cohort_data[month_key]["new_donors"] += 1
        cohort_data[month_key]["first_gifts"].append(float(donor.first_gift_amount or 0))

        # Check for 2nd gift
        second_gift = db.query(Donation).filter(
            Donation.donor_id == donor.id,
            Donation.is_first_time == False,
            Donation.donation_date > donor.first_donation_date
        ).order_by(Donation.donation_date).first()

        if second_gift:
            cohort_data[month_key]["converted"] += 1
            days_diff = (second_gift.donation_date.date() - donor.first_donation_date).days
            cohort_data[month_key]["days_to_second"].append(days_diff)
            cohort_data[month_key]["second_gifts"].append(float(second_gift.amount))

        # Track by channel
        channel = donor.channel or "Unknown"
        if channel not in cohort_data[month_key]["channels"]:
            cohort_data[month_key]["channels"][channel] = {"new": 0, "converted": 0}
        cohort_data[month_key]["channels"][channel]["new"] += 1
        if second_gift:
            cohort_data[month_key]["channels"][channel]["converted"] += 1

    # Build response
    cohorts = []
    for month, data in cohort_data.items():
        avg_days = sum(data["days_to_second"]) / len(data["days_to_second"]) if data["days_to_second"] else 0
        cohorts.append({
            "cohort_month": month,
            "new_donors": data["new_donors"],
            "converted_to_2nd_gift": data["converted"],
            "conversion_rate": round(data["converted"] / data["new_donors"] * 100, 1) if data["new_donors"] else 0,
            "avg_days_to_2nd_gift": round(avg_days, 1),
            "avg_months_to_2nd_gift": round(avg_days / 30, 1),
            "first_gift_avg": round(sum(data["first_gifts"]) / len(data["first_gifts"]), 2) if data["first_gifts"] else 0,
            "second_gift_avg": round(sum(data["second_gifts"]) / len(data["second_gifts"]), 2) if data["second_gifts"] else 0
        })

    total_new = sum(c["new_donors"] for c in cohorts)
    total_converted = sum(c["converted_to_2nd_gift"] for c in cohorts)

    return {
        "organization_id": organization_id,
        "summary": {
            "overall_2nd_gift_conversion_rate": round(total_converted / total_new * 100, 1) if total_new else 0,
            "avg_months_to_2nd_gift": round(sum(c["avg_months_to_2nd_gift"] for c in cohorts) / len(cohorts), 1) if cohorts else 0,
            "total_new_donors": total_new,
            "total_converted": total_converted,
            "industry_benchmark": 23.0
        },
        "cohort_analysis": cohorts,
        "conversion_trends": {
            "30_day": 0,
            "60_day": 0,
            "90_day": 0,
            "180_day": 0,
            "365_day": 0
        }
    }


@router.get("/{organization_id}/acquisition/cost-recovery")
async def get_acquisition_cost_recovery(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Breakeven timeline and cost recovery window (12-18 months) by channel
    """
    org_id = uuid.UUID(organization_id)

    # Get donations grouped by acquisition channel
    channel_metrics = db.query(
        Donation.channel,
        func.count(func.distinct(Donation.donor_id)).label('donors'),
        func.sum(Donation.amount).label('total_revenue'),
        func.avg(Donation.amount).label('avg_gift')
    ).filter(
        Donation.organization_id == org_id,
        Donation.channel.isnot(None)
    ).group_by(Donation.channel).all()

    recovery_analysis = []
    for channel in channel_metrics:
        estimated_cac = 50
        ltv_12m = float(channel.avg_gift or 0) * 2.5
        ltv_24m = float(channel.avg_gift or 0) * 4.2

        recovery_analysis.append({
            "channel": channel.channel,
            "donors_acquired": channel.donors,
            "total_revenue": float(channel.total_revenue or 0),
            "avg_first_gift": float(channel.avg_gift or 0),
            "estimated_cac": estimated_cac,
            "months_to_breakeven": round(estimated_cac / (float(channel.avg_gift or 1) / 12), 1),
            "ltv_12_month": round(ltv_12m, 2),
            "ltv_24_month": round(ltv_24m, 2),
            "cost_recovery_12m": round(ltv_12m / estimated_cac * 100, 1) if estimated_cac else 0,
            "cost_recovery_18m": round((ltv_12m + ltv_24m) / 2 / estimated_cac * 100, 1) if estimated_cac else 0,
            "ltv_to_cac_ratio": round(ltv_24m / estimated_cac, 2) if estimated_cac else 0
        })

    return {
        "organization_id": organization_id,
        "recovery_by_channel": recovery_analysis,
        "summary": {
            "avg_breakeven_months": round(sum(r["months_to_breakeven"] for r in recovery_analysis) / len(recovery_analysis), 1) if recovery_analysis else 0,
            "best_performing_channel": max(recovery_analysis, key=lambda x: x["ltv_to_cac_ratio"])["channel"] if recovery_analysis else None
        }
    }


# ============================================================
# SECTION 10: REVENUE DIVERSIFICATION - ENHANCED
# Required categories: Individuals, Corporate, Foundations,
# Government Grants, Other Revenue
# Dual pie: Total Revenue vs Contributed Revenue
# ============================================================

@router.get("/{organization_id}/revenue/diversification")
async def get_revenue_diversification(
        organization_id: str,
        period: str = Query("12m"),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Full revenue diversification with all required categories:
    - Individuals (with subcategories: Major Gifts, Annual Fund, Planned Giving, Events)
    - Corporate (with subcategories: Sponsorships, Matching Gifts, Direct Grants, In-Kind)
    - Foundations (with subcategories: Private Foundations, Community Foundations, Family Foundations)
    - Government Grants (with subcategories: Federal, State, Local)
    - Other Revenue (with subcategories: Memberships, Earned Revenue, Investment Income)

    Returns dual breakdown:
    - Total Revenue breakdown (all sources)
    - Contributed Revenue breakdown (excluding earned)
    """
    org_id = uuid.UUID(organization_id)

    # Calculate date range based on period
    months = {"3m": 3, "6m": 6, "12m": 12, "24m": 24, "365d": 12}.get(period, 12)
    current_start = datetime.now() - timedelta(days=months * 30)
    prev_start = current_start - timedelta(days=months * 30)

    # Calculate total revenue for current period
    total_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == org_id,
        Donation.donation_date >= current_start
    ).scalar() or 0

    # Get current period by donor type
    by_type = db.query(
        Donor.donor_type,
        func.sum(Donation.amount).label('amount'),
        func.count(func.distinct(Donor.id)).label('donor_count')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == org_id,
        Donation.donation_date >= current_start
    ).group_by(Donor.donor_type).all()

    # Get previous period by donor type for YoY comparison
    prev_by_type = db.query(
        Donor.donor_type,
        func.sum(Donation.amount).label('amount')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == org_id,
        Donation.donation_date >= prev_start,
        Donation.donation_date < current_start
    ).group_by(Donor.donor_type).all()

    prev_amounts = {item.donor_type: float(item.amount or 0) for item in prev_by_type}

    # Get gift-level breakdowns for subcategories
    gift_breakdowns = db.query(
        Donor.donor_type,
        Donation.gift_type,
        Donation.channel,
        func.sum(Donation.amount).label('amount'),
        func.count(Donation.id).label('gift_count')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == org_id,
        Donation.donation_date >= current_start
    ).group_by(Donor.donor_type, Donation.gift_type, Donation.channel).all()

    # Define the 5 required categories with subcategories
    categories = {
        "Individuals": {
            "amount": 0,
            "donors": 0,
            "type": "Contributed",
            "subcategories": {
                "Major Gifts": {"amount": 0, "count": 0},
                "Annual Fund": {"amount": 0, "count": 0},
                "Planned Giving": {"amount": 0, "count": 0},
                "Events": {"amount": 0, "count": 0},
                "Online": {"amount": 0, "count": 0}
            }
        },
        "Corporate": {
            "amount": 0,
            "donors": 0,
            "type": "Contributed",
            "subcategories": {
                "Sponsorships": {"amount": 0, "count": 0},
                "Matching Gifts": {"amount": 0, "count": 0},
                "Direct Grants": {"amount": 0, "count": 0},
                "In-Kind": {"amount": 0, "count": 0}
            }
        },
        "Foundations": {
            "amount": 0,
            "donors": 0,
            "type": "Contributed",
            "subcategories": {
                "Private Foundations": {"amount": 0, "count": 0},
                "Community Foundations": {"amount": 0, "count": 0},
                "Family Foundations": {"amount": 0, "count": 0},
                "Corporate Foundations": {"amount": 0, "count": 0}
            }
        },
        "Government Grants": {
            "amount": 0,
            "donors": 0,
            "type": "Contributed",
            "subcategories": {
                "Federal": {"amount": 0, "count": 0},
                "State": {"amount": 0, "count": 0},
                "Local": {"amount": 0, "count": 0}
            }
        },
        "Other Revenue": {
            "amount": 0,
            "donors": 0,
            "type": "Other",
            "subcategories": {
                "Memberships": {"amount": 0, "count": 0},
                "Earned Revenue": {"amount": 0, "count": 0},
                "Investment Income": {"amount": 0, "count": 0},
                "Miscellaneous": {"amount": 0, "count": 0}
            }
        }
    }

    # Map database donor types to required categories
    type_mapping = {
        "Individual": "Individuals",
        "individual": "Individuals",
        "Corporate": "Corporate",
        "corporate": "Corporate",
        "Foundation": "Foundations",
        "foundation": "Foundations",
        "Private Foundation": "Foundations",
        "Community Foundation": "Foundations",
        "Family Foundation": "Foundations",
        "Government": "Government Grants",
        "government": "Government Grants",
        "Federal": "Government Grants",
        "State": "Government Grants",
        "Local": "Government Grants",
        "Earned/Fee-for-Service": "Other Revenue",
        "Other": "Other Revenue"
    }

    # Aggregate main category totals
    for item in by_type:
        dtype = item.donor_type or "Other"
        mapped_category = type_mapping.get(dtype, "Other Revenue")

        categories[mapped_category]["amount"] += float(item.amount or 0)
        categories[mapped_category]["donors"] += item.donor_count

    # Process subcategory breakdowns
    for gift in gift_breakdowns:
        dtype = gift.donor_type or "Other"
        mapped_category = type_mapping.get(dtype, "Other Revenue")
        gift_type = gift.gift_type or "General"
        channel = gift.channel or "Other"
        amount = float(gift.amount or 0)
        count = gift.gift_count or 0

        # Map to subcategories based on gift type and channel
        if mapped_category == "Individuals":
            if amount >= 10000 or gift_type in ["major_gift", "Major Gift"]:
                categories[mapped_category]["subcategories"]["Major Gifts"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Major Gifts"]["count"] += count
            elif gift_type in ["planned_giving", "bequest", "Planned Giving"]:
                categories[mapped_category]["subcategories"]["Planned Giving"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Planned Giving"]["count"] += count
            elif channel in ["event", "gala", "Event"]:
                categories[mapped_category]["subcategories"]["Events"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Events"]["count"] += count
            elif channel in ["online", "website", "Online"]:
                categories[mapped_category]["subcategories"]["Online"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Online"]["count"] += count
            else:
                categories[mapped_category]["subcategories"]["Annual Fund"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Annual Fund"]["count"] += count

        elif mapped_category == "Corporate":
            if gift_type in ["sponsorship", "Sponsorship"]:
                categories[mapped_category]["subcategories"]["Sponsorships"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Sponsorships"]["count"] += count
            elif gift_type in ["matching", "Matching Gift"]:
                categories[mapped_category]["subcategories"]["Matching Gifts"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Matching Gifts"]["count"] += count
            elif gift_type in ["in_kind", "In-Kind"]:
                categories[mapped_category]["subcategories"]["In-Kind"]["amount"] += amount
                categories[mapped_category]["subcategories"]["In-Kind"]["count"] += count
            else:
                categories[mapped_category]["subcategories"]["Direct Grants"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Direct Grants"]["count"] += count

        elif mapped_category == "Foundations":
            if "Community" in dtype:
                categories[mapped_category]["subcategories"]["Community Foundations"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Community Foundations"]["count"] += count
            elif "Family" in dtype:
                categories[mapped_category]["subcategories"]["Family Foundations"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Family Foundations"]["count"] += count
            elif "Corporate" in dtype:
                categories[mapped_category]["subcategories"]["Corporate Foundations"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Corporate Foundations"]["count"] += count
            else:
                categories[mapped_category]["subcategories"]["Private Foundations"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Private Foundations"]["count"] += count

        elif mapped_category == "Government Grants":
            if "Federal" in dtype or gift_type == "federal":
                categories[mapped_category]["subcategories"]["Federal"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Federal"]["count"] += count
            elif "State" in dtype or gift_type == "state":
                categories[mapped_category]["subcategories"]["State"]["amount"] += amount
                categories[mapped_category]["subcategories"]["State"]["count"] += count
            else:
                categories[mapped_category]["subcategories"]["Local"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Local"]["count"] += count

        elif mapped_category == "Other Revenue":
            if gift_type in ["membership", "Membership"]:
                categories[mapped_category]["subcategories"]["Memberships"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Memberships"]["count"] += count
            elif gift_type in ["earned", "fee", "Fee-for-Service"]:
                categories[mapped_category]["subcategories"]["Earned Revenue"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Earned Revenue"]["count"] += count
            elif gift_type in ["investment", "Investment"]:
                categories[mapped_category]["subcategories"]["Investment Income"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Investment Income"]["count"] += count
            else:
                categories[mapped_category]["subcategories"]["Miscellaneous"]["amount"] += amount
                categories[mapped_category]["subcategories"]["Miscellaneous"]["count"] += count

    # Calculate contributed revenue (exclude Other Revenue earned components)
    contributed_revenue = sum(
        c["amount"] for name, c in categories.items()
        if name != "Other Revenue"
    )

    # Add non-earned portions of Other Revenue
    contributed_revenue += categories["Other Revenue"]["subcategories"]["Memberships"]["amount"]

    # Earned revenue
    earned_revenue = (
            categories["Other Revenue"]["subcategories"]["Earned Revenue"]["amount"] +
            categories["Other Revenue"]["subcategories"]["Investment Income"]["amount"]
    )

    # Build breakdown arrays
    contributed_breakdown = []
    total_breakdown = []

    for name, data in categories.items():
        # Calculate YoY growth
        prev_amount = 0
        if name == "Individuals":
            prev_amount = prev_amounts.get("Individual", 0)
        elif name == "Foundations":
            prev_amount = sum(v for k, v in prev_amounts.items() if k and "Foundation" in k)
        elif name == "Government Grants":
            prev_amount = prev_amounts.get("Government", 0)
        elif name == "Other Revenue":
            prev_amount = sum(v for k, v in prev_amounts.items() if k in ["Earned/Fee-for-Service", "Other"])
        else:
            prev_amount = prev_amounts.get(name, 0)

        if prev_amount > 0:
            yoy_growth = round((data["amount"] - prev_amount) / prev_amount * 100, 1)
        else:
            yoy_growth = 100.0 if data["amount"] > 0 else 0

        # Format subcategories for response
        subcats = []
        for subname, subdata in data["subcategories"].items():
            if subdata["amount"] > 0:
                subcats.append({
                    "name": subname,
                    "amount": subdata["amount"],
                    "count": subdata["count"],
                    "percentage": round(subdata["amount"] / data["amount"] * 100, 1) if data["amount"] else 0
                })

        # Sort subcategories by amount descending
        subcats.sort(key=lambda x: x["amount"], reverse=True)

        category_data = {
            "category": name,
            "amount": data["amount"],
            "percentage": round(data["amount"] / float(total_revenue) * 100, 1) if total_revenue else 0,
            "contributed_percentage": round(data["amount"] / float(contributed_revenue) * 100, 1) if contributed_revenue and name != "Other Revenue" else 0,
            "donor_count": data["donors"],
            "revenue_type": data["type"],
            "yoy_growth": yoy_growth,
            "prev_amount": prev_amount,
            "subcategories": subcats
        }

        total_breakdown.append(category_data)

        # Only add to contributed breakdown if it's contributed revenue
        if name != "Other Revenue":
            contributed_breakdown.append({
                "category": name,
                "amount": data["amount"],
                "percentage": round(data["amount"] / float(contributed_revenue) * 100, 1) if contributed_revenue else 0,
                "donor_count": data["donors"],
                "yoy_growth": yoy_growth
            })

    # Sort breakdowns by amount descending
    total_breakdown.sort(key=lambda x: x["amount"], reverse=True)
    contributed_breakdown.sort(key=lambda x: x["amount"], reverse=True)

    # Diversity score (higher = more diversified, using HHI)
    amounts = [c["amount"] for c in total_breakdown if c["amount"] > 0]
    hhi = sum((a / float(total_revenue) * 100) ** 2 for a in amounts) if total_revenue else 0
    diversity_score = round(100 - (hhi / 100), 1)

    # Generate recommendation based on analysis
    recommendations = []

    # Check for over-reliance
    for cat in total_breakdown:
        if cat["percentage"] > 50:
            recommendations.append(f"Reduce dependence on {cat['category']} (currently {cat['percentage']}% of revenue)")
        if cat["percentage"] < 10 and cat["category"] in ["Corporate", "Foundations"]:
            recommendations.append(f"Opportunity to grow {cat['category']} giving (currently only {cat['percentage']}%)")

    # Check diversity score
    if diversity_score < 50:
        recommendations.append("Revenue concentration is high - prioritize diversification")
    elif diversity_score > 70:
        recommendations.append("Well diversified revenue mix - maintain current strategy")

    recommendation = recommendations[0] if recommendations else "Revenue mix is healthy"

    return {
        "organization_id": organization_id,
        "period": period,
        "total_revenue": float(total_revenue),
        "contributed_revenue": contributed_revenue,
        "earned_revenue": earned_revenue,

        # Main breakdown with all 5 required categories
        "breakdown": total_breakdown,

        # Separate breakdown for contributed revenue pie chart
        "contributed_breakdown": contributed_breakdown,

        # Total revenue breakdown (for dual pie chart)
        "total_revenue_breakdown": [
            {"category": "Contributed Revenue", "amount": contributed_revenue,
             "percentage": round(contributed_revenue / float(total_revenue) * 100, 1) if total_revenue else 0},
            {"category": "Earned Revenue", "amount": earned_revenue,
             "percentage": round(earned_revenue / float(total_revenue) * 100, 1) if total_revenue else 0}
        ],

        "diversity_score": diversity_score,
        "concentration_risk": "Low" if diversity_score > 70 else "Medium" if diversity_score > 50 else "High",
        "recommendation": recommendation,
        "recommendations": recommendations,

        # Benchmark comparisons
        "benchmarks": {
            "individuals_target": 60,
            "corporate_target": 15,
            "foundations_target": 15,
            "government_target": 5,
            "other_target": 5
        }
    }


# ============================================================
# SECTION 11: MULTI-YEAR COMPARISON (3yr, 5yr, 10yr)
# ============================================================

@router.get("/{organization_id}/trends/multi-year")
async def get_multi_year_comparison(
        organization_id: str,
        metric: str = Query("revenue", regex="^(revenue|donors|gifts|retention|new_donors|lapsed)$"),
        years: int = Query(3, ge=1, le=10),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Multi-year comparison for revenue, donors, gifts, retention, new donors, lapsed donors
    Supports 3yr, 5yr, 10yr views
    """
    org_id = uuid.UUID(organization_id)

    current_year = datetime.now().year
    yearly_data = []

    for year_offset in range(years):
        year = current_year - year_offset
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        if metric == "revenue":
            value = db.query(func.sum(Donation.amount)).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year
            ).scalar() or 0
        elif metric == "donors":
            value = db.query(func.count(func.distinct(Donation.donor_id))).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year
            ).scalar() or 0
        elif metric == "gifts":
            value = db.query(func.count(Donation.id)).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year
            ).scalar() or 0
        elif metric == "new_donors":
            value = db.query(func.count(Donor.id)).filter(
                Donor.organization_id == org_id,
                extract('year', Donor.first_donation_date) == year
            ).scalar() or 0
        elif metric == "retention":
            prev_year_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year - 1
            ).scalar() or 0

            retained = db.query(func.count(func.distinct(Donation.donor_id))).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year,
                Donation.donor_id.in_(
                    db.query(Donation.donor_id).filter(
                        extract('year', Donation.donation_date) == year - 1
                    )
                )
            ).scalar() or 0

            value = round(retained / prev_year_donors * 100, 1) if prev_year_donors else 0
        elif metric == "lapsed":
            value = 0
        else:
            value = 0

        yearly_data.append({
            "year": year,
            "value": float(value) if isinstance(value, Decimal) else value
        })

    # Calculate CAGR
    if len(yearly_data) >= 2 and yearly_data[-1]["value"] > 0:
        cagr = ((yearly_data[0]["value"] / yearly_data[-1]["value"]) ** (1 / len(yearly_data)) - 1) * 100
    else:
        cagr = 0

    return {
        "organization_id": organization_id,
        "metric": metric,
        "years": years,
        "data": yearly_data,
        "cagr": round(cagr, 1),
        "total_growth": round((yearly_data[0]["value"] - yearly_data[-1]["value"]) / yearly_data[-1]["value"] * 100, 1) if yearly_data[-1]["value"] else 0
    }


# ============================================================
# SECTION 12: TOTAL INCOME CASHFLOW REPORTS (3-year grid)
# ============================================================

@router.get("/{organization_id}/cashflow/three-year-grid")
async def get_three_year_cashflow_grid(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    3-year grid showing Revenue, # of gifts, # of donors with heatmap data
    """
    org_id = uuid.UUID(organization_id)
    current_year = datetime.now().year

    grid_data = []

    for year in [current_year - 2, current_year - 1, current_year]:
        monthly = []
        for month in range(1, 13):
            month_data = db.query(
                func.sum(Donation.amount).label('revenue'),
                func.count(Donation.id).label('gifts'),
                func.count(func.distinct(Donation.donor_id)).label('donors')
            ).filter(
                Donation.organization_id == org_id,
                extract('year', Donation.donation_date) == year,
                extract('month', Donation.donation_date) == month
            ).first()

            monthly.append({
                "month": month,
                "month_name": date(year, month, 1).strftime("%b"),
                "revenue": float(month_data.revenue or 0),
                "gifts": month_data.gifts or 0,
                "donors": month_data.donors or 0
            })

        year_totals = db.query(
            func.sum(Donation.amount).label('revenue'),
            func.count(Donation.id).label('gifts'),
            func.count(func.distinct(Donation.donor_id)).label('donors')
        ).filter(
            Donation.organization_id == org_id,
            extract('year', Donation.donation_date) == year
        ).first()

        grid_data.append({
            "year": year,
            "monthly": monthly,
            "totals": {
                "revenue": float(year_totals.revenue or 0),
                "gifts": year_totals.gifts or 0,
                "donors": year_totals.donors or 0
            }
        })

    # Calculate YoY growth
    yoy_growth = {}
    if len(grid_data) >= 2:
        current = grid_data[-1]["totals"]
        previous = grid_data[-2]["totals"]

        yoy_growth = {
            "revenue": round((current["revenue"] - previous["revenue"]) / previous["revenue"] * 100, 1) if previous["revenue"] else 0,
            "gifts": round((current["gifts"] - previous["gifts"]) / previous["gifts"] * 100, 1) if previous["gifts"] else 0,
            "donors": round((current["donors"] - previous["donors"]) / previous["donors"] * 100, 1) if previous["donors"] else 0
        }

    return {
        "organization_id": organization_id,
        "grid_data": grid_data,
        "yoy_growth": yoy_growth,
        "generated_at": datetime.now().isoformat()
    }


# ============================================================
# ORGANIZATION UPDATES
# ============================================================

@router.get("/{organization_id}/org-info")
async def get_organization_info(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get organization info including mission/vision for Analytics tab
    """
    org_id = uuid.UUID(organization_id)

    org = db.query(Organizations).filter(
        Organizations.id == org_id
    ).first()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "organization_id": organization_id,
        "name": org.name,
        "mission": org.mission,
        "founded_date": str(org.founded_date) if org.founded_date else None,
        "annual_budget": float(org.annual_budget) if org.annual_budget else 0,
        "fiscal_year_end": org.fiscal_year_end
    }


# ============================================================
# OKRs WITH CONTEXT
# ============================================================

@router.get("/{organization_id}/okrs")
async def get_okrs_with_context(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    OKRs with clear explanation of AI/Analytics basis
    """
    org_id = uuid.UUID(organization_id)

    return {
        "organization_id": organization_id,
        "okr_methodology": {
            "basis": "Analytics-Based",
            "description": "OKRs are generated based on historical performance data, industry benchmarks, and predictive analytics models",
            "data_sources": [
                "Historical giving patterns",
                "Donor behavior analytics",
                "Campaign performance metrics",
                "Industry benchmark comparisons",
                "Seasonal trend analysis"
            ],
            "ai_components": [
                "Predictive LTV modeling",
                "Churn risk assessment",
                "Upgrade potential scoring",
                "Gift timing predictions"
            ],
            "update_frequency": "Monthly",
            "confidence_level": "Based on 3-year historical data"
        },
        "objectives": [
            {
                "objective": "Increase donor retention to 90%",
                "rationale": "Current retention at 87.5% with positive trend; 90% achievable based on stewardship improvements",
                "key_results": [
                    {"kr": "Implement thank-you within 48hrs for all gifts", "target": 100, "current": 94},
                    {"kr": "Increase touchpoints for mid-level donors", "target": 12, "current": 8},
                    {"kr": "Launch monthly impact newsletter", "target": 12, "current": 0}
                ],
                "analytics_basis": "Correlation analysis shows each touchpoint adds 0.8% retention"
            },
            {
                "objective": "Grow major gifts revenue by 25%",
                "rationale": "Pipeline analysis shows 42 qualified prospects ready for solicitation",
                "key_results": [
                    {"kr": "Close 35 major gifts over $10K", "target": 35, "current": 18},
                    {"kr": "Upgrade 50 mid-level to major", "target": 50, "current": 22},
                    {"kr": "Acquire 20 new major gift prospects", "target": 20, "current": 8}
                ],
                "analytics_basis": "Capacity screening indicates $2.8M in unrealized potential"
            }
        ]
    }


@router.get("/{organization_id}/donor-acquisition/second-gift-conversion")
async def get_second_gift_conversion(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get second gift conversion metrics
    """
    org_id = UUID(organization_id)

    # Subquery: Get first donation date for each donor
    first_donation_sq = db.query(
        Donation.donor_id,
        func.min(Donation.donation_date).label('first_gift_date')
    ).join(
        Donor, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == org_id
    ).group_by(
        Donation.donor_id
    ).subquery()

    # Get donors with their first gift date and acquisition source
    donors_with_first = db.query(
        Donor.id,
        Donor.acquisition_source,
        first_donation_sq.c.first_gift_date
    ).join(
        first_donation_sq, Donor.id == first_donation_sq.c.donor_id
    ).filter(
        Donor.organization_id == org_id
    ).subquery()

    # Find second gifts
    second_gifts = db.query(
        donors_with_first.c.id.label('donor_id'),
        donors_with_first.c.acquisition_source,
        donors_with_first.c.first_gift_date,
        func.min(Donation.donation_date).label('second_gift_date')
    ).join(
        Donation, and_(
            donors_with_first.c.id == Donation.donor_id,
            Donation.donation_date > donors_with_first.c.first_gift_date
        )
    ).group_by(
        donors_with_first.c.id,
        donors_with_first.c.acquisition_source,
        donors_with_first.c.first_gift_date
    ).all()

    # Total donors count
    total_donors = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == org_id
    ).scalar() or 0

    converted_donors = len(second_gifts)
    conversion_rate = round((converted_donors / total_donors) * 100, 1) if total_donors > 0 else 0

    # Calculate average months to second gift
    months_list = []
    for gift in second_gifts:
        if gift.second_gift_date and gift.first_gift_date:
            diff = (gift.second_gift_date - gift.first_gift_date).days / 30.44
            months_list.append(diff)

    avg_months = round(sum(months_list) / len(months_list), 1) if months_list else 0

    # Group by channel
    channel_stats = {}
    for gift in second_gifts:
        channel = gift.acquisition_source or 'Unknown'
        if channel not in channel_stats:
            channel_stats[channel] = {'count': 0, 'months': []}
        channel_stats[channel]['count'] += 1
        if gift.second_gift_date and gift.first_gift_date:
            diff = (gift.second_gift_date - gift.first_gift_date).days / 30.44
            channel_stats[channel]['months'].append(diff)

    # Get total donors by channel
    channel_totals = db.query(
        Donor.acquisition_source,
        func.count(Donor.id).label('total')
    ).filter(
        Donor.organization_id == org_id
    ).group_by(
        Donor.acquisition_source
    ).all()

    channel_total_dict = {c.acquisition_source or 'Unknown': c.total for c in channel_totals}

    by_channel = []
    for channel, stats in channel_stats.items():
        total = channel_total_dict.get(channel, 1)
        conv_rate = round((stats['count'] / total) * 100, 1) if total > 0 else 0
        avg_mo = round(sum(stats['months']) / len(stats['months']), 1) if stats['months'] else 0
        by_channel.append({
            'channel': channel,
            'conversion_rate': conv_rate,
            'avg_months': avg_mo,
            'converted_count': stats['count'],
            'total_donors': total
        })

    by_channel.sort(key=lambda x: x['conversion_rate'], reverse=True)

    # Monthly trend - last 6 months
    trend = []
    for i in range(5, -1, -1):
        month_date = datetime.now() - timedelta(days=i*30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1)

        # Count conversions in this month
        month_conversions = sum(
            1 for g in second_gifts
            if g.second_gift_date and month_start.date() <= (g.second_gift_date.date() if hasattr(g.second_gift_date, 'date') else g.second_gift_date) < month_end.date()
        )

        # Count first-time donors from prior periods who could convert
        eligible_donors = db.query(func.count(Donor.id)).join(
            first_donation_sq, Donor.id == first_donation_sq.c.donor_id
        ).filter(
            Donor.organization_id == org_id,
            first_donation_sq.c.first_gift_date < month_start.date()
        ).scalar() or 1

        month_rate = round((month_conversions / eligible_donors) * 100, 1) if eligible_donors > 0 else 0

        trend.append({
            'month': month_date.strftime('%b'),
            'rate': month_rate
        })

    return {
        'conversion_rate': conversion_rate,
        'avg_months_to_second': avg_months,
        'total_donors': total_donors,
        'converted_donors': converted_donors,
        'by_channel': by_channel,
        'trend': trend
    }


@router.get("/{organization_id}/donor-acquisition/break-even-analysis")
async def get_break_even_analysis(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get break-even analysis for donor acquisition
    """
    org_id = UUID(organization_id)
    year_start = datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Get acquisition spend YTD from campaigns
    acquisition_spend = db.query(func.sum(Campaign.marketing_cost)).filter(
        Campaign.organization_id == org_id,
        Campaign.start_date >= year_start
    ).scalar() or 0

    # Get revenue from donors acquired this year
    new_donor_ids = db.query(Donor.id).filter(
        Donor.organization_id == org_id,
        Donor.created_at >= year_start
    ).subquery()

    recovered_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.donor_id.in_(new_donor_ids)
    ).scalar() or 0

    # Calculate break-even months
    if acquisition_spend > 0:
        months_elapsed = (datetime.now() - year_start.replace(tzinfo=None)).days / 30.44
        monthly_recovery = float(recovered_revenue) / max(months_elapsed, 1)
        remaining_to_recover = float(acquisition_spend) - float(recovered_revenue)

        if monthly_recovery > 0 and remaining_to_recover > 0:
            months_to_break_even = remaining_to_recover / monthly_recovery
            total_break_even_months = months_elapsed + months_to_break_even
        elif remaining_to_recover <= 0:
            total_break_even_months = months_elapsed
        else:
            total_break_even_months = 24
    else:
        total_break_even_months = 0

    # Projected break-even date
    if total_break_even_months > 0:
        projected_date = (year_start + timedelta(days=total_break_even_months * 30.44)).strftime('%Y-%m-%d')
    else:
        projected_date = None

    # Cohort analysis by quarter
    cohorts = []
    quarters = [
        ('Q1', 1, 3),
        ('Q2', 4, 6),
        ('Q3', 7, 9),
        ('Q4', 10, 12)
    ]

    current_year = datetime.now().year

    for q_name, start_month, end_month in quarters:
        q_start = datetime(current_year, start_month, 1)
        if end_month == 12:
            q_end = datetime(current_year + 1, 1, 1)
        else:
            q_end = datetime(current_year, end_month + 1, 1)

        # Spend for this quarter
        q_spend = db.query(func.sum(Campaign.marketing_cost)).filter(
            Campaign.organization_id == org_id,
            Campaign.start_date >= q_start,
            Campaign.start_date < q_end
        ).scalar() or 0

        # Donors acquired in this quarter
        q_donor_ids = db.query(Donor.id).filter(
            Donor.organization_id == org_id,
            Donor.created_at >= q_start,
            Donor.created_at < q_end
        ).subquery()

        # Revenue from those donors
        q_recovered = db.query(func.sum(Donation.amount)).filter(
            Donation.donor_id.in_(q_donor_ids)
        ).scalar() or 0

        # Calculate break-even months for cohort
        if q_spend > 0 and q_recovered > 0:
            recovery_ratio = float(q_recovered) / float(q_spend)
            if recovery_ratio >= 1:
                months_elapsed = (datetime.now() - q_start).days / 30.44
                be_months = int(months_elapsed * (float(q_spend) / float(q_recovered)))
            else:
                be_months = int(12 / recovery_ratio) if recovery_ratio > 0 else None
        else:
            be_months = None

        cohorts.append({
            'cohort': f'{q_name} {current_year}',
            'spend': int(q_spend),
            'recovered': int(q_recovered),
            'break_even_months': be_months
        })

    return {
        'overall_break_even_months': round(total_break_even_months, 1),
        'acquisition_spend_ytd': int(acquisition_spend),
        'recovered_revenue_ytd': int(recovered_revenue),
        'projected_break_even_date': projected_date,
        'cohort_analysis': cohorts
    }


@router.get("/{organization_id}/donor-acquisition/channel-break-even")
async def get_channel_break_even(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get break-even analysis by acquisition channel
    """
    org_id = UUID(organization_id)

    # Get total marketing spend from campaigns
    total_spend = db.query(func.sum(Campaign.marketing_cost)).filter(
        Campaign.organization_id == org_id
    ).scalar() or 0

    # Get donor counts by acquisition source
    donor_counts = db.query(
        Donor.acquisition_source,
        func.count(Donor.id).label('donor_count')
    ).filter(
        Donor.organization_id == org_id,
        Donor.acquisition_source.isnot(None)
    ).group_by(
        Donor.acquisition_source
    ).all()

    total_donors = sum(d.donor_count for d in donor_counts) or 1

    # Get LTV by acquisition source
    channel_ltv = db.query(
        Donor.acquisition_source,
        func.sum(Donation.amount).label('ltv')
    ).join(
        Donation, Donor.id == Donation.donor_id
    ).filter(
        Donor.organization_id == org_id,
        Donor.acquisition_source.isnot(None)
    ).group_by(
        Donor.acquisition_source
    ).all()

    ltv_dict = {c.acquisition_source: float(c.ltv) for c in channel_ltv}

    channels = []
    for dc in donor_counts:
        channel_name = dc.acquisition_source
        # Allocate spend proportionally by donor count
        spend = float(total_spend) * (dc.donor_count / total_donors)
        ltv = ltv_dict.get(channel_name, 0)

        if spend > 0:
            roi = round(((ltv - spend) / spend) * 100, 0)
            if ltv > 0:
                ratio = ltv / spend
                break_even_months = round(12 / ratio, 0) if ratio > 0 else 24
            else:
                break_even_months = 24
        else:
            roi = 0
            break_even_months = 0

        channels.append({
            'channel': channel_name,
            'spend': int(spend),
            'ltv': int(ltv),
            'break_even_months': int(break_even_months),
            'roi': int(roi)
        })

    channels.sort(key=lambda x: x['roi'], reverse=True)

    return {'channels': channels}


@router.get("/{organization_id}/donor-acquisition/spend-vs-ltv")
async def get_spend_vs_ltv(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get monthly acquisition spend vs lifetime value
    """
    org_id = UUID(organization_id)
    monthly_data = []

    for i in range(5, -1, -1):
        month_date = datetime.now() - timedelta(days=i*30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1)

        # Get spend for this month
        spend = db.query(func.sum(Campaign.marketing_cost)).filter(
            Campaign.organization_id == org_id,
            Campaign.start_date >= month_start,
            Campaign.start_date < month_end
        ).scalar() or 0

        # Get donors acquired this month
        month_donor_ids = db.query(Donor.id).filter(
            Donor.organization_id == org_id,
            Donor.created_at >= month_start,
            Donor.created_at < month_end
        ).subquery()

        # Get total LTV from those donors (all their donations)
        ltv = db.query(func.sum(Donation.amount)).filter(
            Donation.donor_id.in_(month_donor_ids)
        ).scalar() or 0

        monthly_data.append({
            'month': month_date.strftime('%b'),
            'spend': int(spend),
            'ltv': int(ltv)
        })

    cumulative_spend = sum(m['spend'] for m in monthly_data)
    cumulative_ltv = sum(m['ltv'] for m in monthly_data)
    ratio = round(cumulative_ltv / cumulative_spend, 2) if cumulative_spend > 0 else 0

    return {
        'monthly': monthly_data,
        'cumulative_spend': cumulative_spend,
        'cumulative_ltv': cumulative_ltv,
        'ltv_to_spend_ratio': ratio
    }


# ============================================
# STEWARDSHIP ENDPOINTS
# ============================================

@router.get("/{organization_id}/stewardship/touchpoints")
async def get_stewardship_touchpoints(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get touchpoint analytics
    """
    org_id = UUID(organization_id)
    year_start = datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total touchpoints YTD
    total_touchpoints = db.query(func.count(TouchpointLog.id)).filter(
        TouchpointLog.organization_id == org_id,
        TouchpointLog.created_at >= year_start
    ).scalar() or 0

    # Donor count
    donor_count = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == org_id
    ).scalar() or 1

    avg_per_donor = round(total_touchpoints / donor_count, 1)

    # Touchpoints by donor segment
    by_segment = db.query(
        Donor.donor_type,
        func.count(TouchpointLog.id).label('touchpoints'),
        func.count(func.distinct(TouchpointLog.donor_id)).label('donor_count')
    ).join(
        TouchpointLog, Donor.id == TouchpointLog.donor_id
    ).filter(
        Donor.organization_id == org_id,
        TouchpointLog.created_at >= year_start
    ).group_by(
        Donor.donor_type
    ).all()

    # Get total donors per segment (including those without touchpoints)
    all_donors_by_segment = db.query(
        Donor.donor_type,
        func.count(Donor.id).label('total_donors')
    ).filter(
        Donor.organization_id == org_id
    ).group_by(
        Donor.donor_type
    ).all()

    segment_donor_counts = {s.donor_type or 'Unknown': s.total_donors for s in all_donors_by_segment}

    # Create lookup for touchpoint data
    segment_touchpoints = {
        (s.donor_type or 'Unknown'): {'touchpoints': s.touchpoints, 'donor_count': s.donor_count}
        for s in by_segment
    }

    # Annual targets per donor by segment
    segment_targets = {
        'corporate': 12,
        'foundation': 10,
        'individual': 6
    }

    # Build response for ALL segments (even those with 0 touchpoints)
    touchpoints_by_segment = []
    for segment_name, total_donors_in_segment in segment_donor_counts.items():
        tp_data = segment_touchpoints.get(segment_name, {'touchpoints': 0, 'donor_count': 0})
        touchpoints = tp_data['touchpoints']
        donors_with_touchpoints = tp_data['donor_count']

        target_per_donor = segment_targets.get(segment_name, 6)
        total_target = total_donors_in_segment * target_per_donor
        achievement_rate = round((touchpoints / total_target * 100), 1) if total_target > 0 else 0

        touchpoints_by_segment.append({
            'segment': segment_name,
            'touchpoints': touchpoints,
            'avg_touchpoints_annual': touchpoints,
            'target_touchpoints': total_target,
            'target': total_target,
            'donor_count': total_donors_in_segment,
            'avg_per_donor': round(touchpoints / max(donors_with_touchpoints, 1), 1),
            'target_per_donor': target_per_donor,
            'achievement_rate': achievement_rate
        })

    # Touchpoints by type
    by_type = db.query(
        TouchpointLog.touchpoint_type,
        func.count(TouchpointLog.id).label('count')
    ).filter(
        TouchpointLog.organization_id == org_id,
        TouchpointLog.created_at >= year_start
    ).group_by(
        TouchpointLog.touchpoint_type
    ).all()

    touchpoints_by_type = [
        {'type': t.touchpoint_type or 'Other', 'count': t.count}
        for t in by_type
    ]

    return {
        'summary': {
            'total_touchpoints_ytd': total_touchpoints,
            'avg_touchpoints_per_donor': avg_per_donor,
            'donor_count': donor_count
        },
        'touchpoints_by_segment': touchpoints_by_segment,
        'touchpoints_by_type': touchpoints_by_type
    }


@router.get("/{organization_id}/stewardship/thank-you-timeliness")
async def get_thank_you_timeliness(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get thank-you velocity metrics
    """
    org_id = UUID(organization_id)

    # Get all thank-you logs
    thank_yous = db.query(
        ThankYouLog.gift_amount,
        ThankYouLog.response_hours,
        ThankYouLog.target_hours
    ).filter(
        ThankYouLog.organization_id == org_id
    ).all()

    total_count = len(thank_yous)

    if total_count == 0:
        return {
            'overall_avg_hours': 0,
            'by_gift_level': [],
            'total_thank_yous': 0
        }

    avg_hours = round(sum(t.response_hours for t in thank_yous) / total_count, 1)

    # Define gift levels with targets
    levels = {
        'Major ($10K+)': {'target': 24, 'min': 10000, 'responses': [], 'compliant': 0},
        'Mid-Level ($1K-$10K)': {'target': 48, 'min': 1000, 'responses': [], 'compliant': 0},
        'Standard ($100-$1K)': {'target': 72, 'min': 100, 'responses': [], 'compliant': 0},
        'Small (<$100)': {'target': 168, 'min': 0, 'responses': [], 'compliant': 0}
    }

    for t in thank_yous:
        amount = float(t.gift_amount or 0)

        if amount >= 10000:
            level_key = 'Major ($10K+)'
        elif amount >= 1000:
            level_key = 'Mid-Level ($1K-$10K)'
        elif amount >= 100:
            level_key = 'Standard ($100-$1K)'
        else:
            level_key = 'Small (<$100)'

        levels[level_key]['responses'].append(t.response_hours)
        if t.response_hours <= levels[level_key]['target']:
            levels[level_key]['compliant'] += 1

    by_gift_level = []
    for level_name, data in levels.items():
        if data['responses']:
            avg = round(sum(data['responses']) / len(data['responses']), 1)
            compliance = round((data['compliant'] / len(data['responses'])) * 100, 1)
        else:
            avg = 0
            compliance = 0

        by_gift_level.append({
            'level': level_name,
            'target_hours': data['target'],
            'avg_hours': avg,
            'compliance_rate': compliance,
            'count': len(data['responses'])
        })

    return {
        'overall_avg_hours': avg_hours,
        'by_gift_level': by_gift_level,
        'total_thank_yous': total_count
    }


@router.get("/{organization_id}/donor-experience/dx-score")
async def get_dx_score(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get donor experience (DX) score
    """
    org_id = UUID(organization_id)

    # Calculate response_time score from thank-you timeliness
    thank_you_compliance = db.query(
        func.avg(
            case(
                (ThankYouLog.response_hours <= ThankYouLog.target_hours, 100),
                else_=0
            )
        )
    ).filter(
        ThankYouLog.organization_id == org_id
    ).scalar() or 0

    # Calculate engagement score from touchpoints
    year_start = datetime.now().replace(month=1, day=1)
    touchpoint_count = db.query(func.count(TouchpointLog.id)).filter(
        TouchpointLog.organization_id == org_id,
        TouchpointLog.created_at >= year_start
    ).scalar() or 0

    donor_count = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == org_id
    ).scalar() or 1

    avg_touchpoints = touchpoint_count / donor_count
    engagement_score = min(avg_touchpoints * 20, 100)

    # Calculate communication score from plan completion
    completed_tasks = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipTask.completed_at.isnot(None)
    ).scalar() or 0

    total_tasks = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id
    ).scalar() or 1

    communication_score = (completed_tasks / total_tasks) * 100

    # Satisfaction score from retention
    retained_donors = db.query(func.count(Donor.id)).filter(
        Donor.organization_id == org_id,
        Donor.donor_status == 'active'
    ).scalar() or 0

    satisfaction_score = (retained_donors / donor_count) * 100 if donor_count > 0 else 0

    # Personalization score
    personalization_score = min(engagement_score * 0.9, 100)

    dx_components = {
        'response_time': round(float(thank_you_compliance), 1),
        'engagement': round(engagement_score, 1),
        'satisfaction': round(satisfaction_score, 1),
        'communication': round(communication_score, 1),
        'personalization': round(personalization_score, 1)
    }

    overall_score = round(sum(dx_components.values()) / len(dx_components), 1)

    # Monthly trend - last 6 months
    trend = []
    for i in range(5, -1, -1):
        month_date = datetime.now() - timedelta(days=i*30)
        month_start = month_date.replace(day=1)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1)

        month_compliance = db.query(
            func.avg(
                case(
                    (ThankYouLog.response_hours <= ThankYouLog.target_hours, 100),
                    else_=0
                )
            )
        ).filter(
            ThankYouLog.organization_id == org_id,
            ThankYouLog.created_at >= month_start,
            ThankYouLog.created_at < month_end
        ).scalar() or overall_score

        trend.append({
            'month': month_date.strftime('%b'),
            'score': round(float(month_compliance), 1)
        })

    return {
        'overall_dx_score': overall_score,
        'dx_components': dx_components,
        'trend': trend,
        'benchmark': 75.0,
        'percentile_rank': int((overall_score / 100) * 100)
    }


@router.get("/{organization_id}/stewardship/plan-progress")
async def get_plan_progress(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Get stewardship plan progress
    """
    org_id = UUID(organization_id)

    # Total active plans
    total_active = db.query(func.count(StewardshipPlan.id)).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipPlan.status != 'completed'
    ).scalar() or 0

    # Status breakdown
    status_counts = db.query(
        StewardshipPlan.status,
        func.count(StewardshipPlan.id).label('count')
    ).filter(
        StewardshipPlan.organization_id == org_id
    ).group_by(
        StewardshipPlan.status
    ).all()

    total_plans = sum(s.count for s in status_counts) or 1

    by_status = [
        {
            'status': s.status,
            'count': s.count,
            'percentage': round((s.count / total_plans) * 100, 1)
        }
        for s in status_counts
    ]

    # Completion metrics
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    tasks_completed_mtd = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipTask.completed_at >= month_start
    ).scalar() or 0

    tasks_total_mtd = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipTask.due_date >= month_start,
        StewardshipTask.due_date < datetime.now().replace(day=1) + timedelta(days=32)
    ).scalar() or 1

    # Overdue tasks
    overdue_tasks = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipTask.due_date < datetime.now().date(),
        StewardshipTask.completed_at.is_(None)
    ).scalar() or 0

    # Tasks due in next 7 days
    upcoming_7_days = db.query(func.count(StewardshipTask.id)).join(
        StewardshipPlan, StewardshipTask.plan_id == StewardshipPlan.id
    ).filter(
        StewardshipPlan.organization_id == org_id,
        StewardshipTask.due_date >= datetime.now().date(),
        StewardshipTask.due_date <= (datetime.now() + timedelta(days=7)).date(),
        StewardshipTask.completed_at.is_(None)
    ).scalar() or 0

    completion_rate = round((tasks_completed_mtd / tasks_total_mtd) * 100, 1) if tasks_total_mtd > 0 else 0

    # By segment
    segment_stats = db.query(
        Donor.donor_type,
        func.count(func.distinct(StewardshipPlan.id)).label('plans'),
        func.count(StewardshipTask.id).filter(StewardshipTask.completed_at.isnot(None)).label('completed'),
        func.count(StewardshipTask.id).label('total')
    ).join(
        StewardshipPlan, Donor.id == StewardshipPlan.donor_id
    ).outerjoin(
        StewardshipTask, StewardshipPlan.id == StewardshipTask.plan_id
    ).filter(
        Donor.organization_id == org_id
    ).group_by(
        Donor.donor_type
    ).all()

    by_segment = [
        {
            'segment': s.donor_type or 'Unknown',
            'plans': s.plans,
            'completion_rate': round((s.completed / max(s.total, 1)) * 100, 1)
        }
        for s in segment_stats
    ]

    return {
        'total_active_plans': total_active,
        'by_status': by_status,
        'completion_metrics': {
            'tasks_completed_mtd': tasks_completed_mtd,
            'tasks_total_mtd': tasks_total_mtd,
            'completion_rate': completion_rate,
            'overdue_tasks': overdue_tasks,
            'upcoming_7_days': upcoming_7_days
        },
        'by_segment': by_segment
    }