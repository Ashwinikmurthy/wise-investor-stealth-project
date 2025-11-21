"""
CEO Strategic Summary Endpoint
Add this endpoint to your FastAPI analytics router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta
from typing import Optional

# Import from your existing codebase
from database import get_db
from models import Donations as Donation, Donors as Donor, Campaigns as Campaign, Organizations as Organization
from user_management.auth_dependencies import get_current_user

router = APIRouter(prefix="/api/v1/analytics", tags=["Enhanced Analytics"])


@router.get("/strategic-summary/{organization_id}")
async def get_ceo_strategic_summary(
        organization_id: str,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    CEO Strategic Summary Panel - Analyzes organizational data to provide:
    - Strategic gaps
    - Strategic opportunities
    - Investment recommendations
    - Momentum vs stagnation scoring
    """
    try:
        current_year = datetime.now().year
        current_date = datetime.now()
        year_start = datetime(current_year, 1, 1)
        last_year_start = datetime(current_year - 1, 1, 1)

        # Days into current year for YoY comparison
        days_into_year = (current_date - year_start).days
        last_year_same_period = last_year_start + timedelta(days=days_into_year)

        # ---- CURRENT YEAR METRICS ----
        current_revenue = float(db.query(func.sum(Donation.amount)).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start
        ).scalar() or 0)

        current_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start
        ).scalar() or 0

        current_donations = db.query(func.count(Donation.id)).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start
        ).scalar() or 0

        # ---- LAST YEAR METRICS (same period) ----
        last_year_revenue = float(db.query(func.sum(Donation.amount)).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= last_year_start,
            Donation.donation_date <= last_year_same_period
        ).scalar() or 0)

        last_year_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= last_year_start,
            Donation.donation_date <= last_year_same_period
        ).scalar() or 0

        last_year_donations = db.query(func.count(Donation.id)).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= last_year_start,
            Donation.donation_date <= last_year_same_period
        ).scalar() or 0

        # ---- DONOR SEGMENTS ----
        major_threshold = 10000
        mid_threshold = 1000

        # Major donors ($10k+)
        major_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start,
            Donation.amount >= major_threshold
        ).scalar() or 0

        major_donors_last = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= last_year_start,
            Donation.donation_date <= last_year_same_period,
            Donation.amount >= major_threshold
        ).scalar() or 0

        # Mid-level donors ($1k-$10k)
        mid_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start,
            Donation.amount >= mid_threshold,
            Donation.amount < major_threshold
        ).scalar() or 0

        mid_donors_last = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= last_year_start,
            Donation.donation_date <= last_year_same_period,
            Donation.amount >= mid_threshold,
            Donation.amount < major_threshold
        ).scalar() or 0

        # New donors this year
        previous_donors_subq = db.query(Donation.donor_id).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date < year_start
        ).distinct().subquery()

        new_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
            Donation.organization_id == organization_id,
            Donation.donation_date >= year_start,
            ~Donation.donor_id.in_(db.query(previous_donors_subq.c.donor_id))
        ).scalar() or 0

        returning_donors = current_donors - new_donors

        # ---- CALCULATE GROWTH RATES ----
        revenue_growth = ((current_revenue - last_year_revenue) / last_year_revenue * 100) if last_year_revenue > 0 else 0
        donor_growth = ((current_donors - last_year_donors) / last_year_donors * 100) if last_year_donors > 0 else 0

        avg_gift_current = current_revenue / current_donations if current_donations > 0 else 0
        avg_gift_last = last_year_revenue / last_year_donations if last_year_donations > 0 else 0
        gift_growth = ((avg_gift_current - avg_gift_last) / avg_gift_last * 100) if avg_gift_last > 0 else 0

        major_donor_growth = ((major_donors - major_donors_last) / major_donors_last * 100) if major_donors_last > 0 else 0
        mid_donor_growth = ((mid_donors - mid_donors_last) / mid_donors_last * 100) if mid_donors_last > 0 else 0

        retention_rate = (returning_donors / last_year_donors * 100) if last_year_donors > 0 else 0

        # ---- MONTHLY TREND FOR MOMENTUM ----
        monthly_revenue = []
        for i in range(6):
            month_start = (current_date.replace(day=1) - timedelta(days=30*i)).replace(day=1)
            if i == 0:
                month_end = current_date
            else:
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            month_rev = db.query(func.sum(Donation.amount)).filter(
                Donation.organization_id == organization_id,
                Donation.donation_date >= month_start,
                Donation.donation_date <= month_end
            ).scalar() or 0
            monthly_revenue.append(float(month_rev))

        monthly_revenue.reverse()

        # Trend momentum
        if len(monthly_revenue) >= 6:
            recent_avg = sum(monthly_revenue[-3:]) / 3
            earlier_avg = sum(monthly_revenue[:3]) / 3
            trend_momentum = ((recent_avg - earlier_avg) / earlier_avg * 100) if earlier_avg > 0 else 0
        else:
            trend_momentum = 0

        # ---- CALCULATE MOMENTUM SCORE (0-100) ----
        momentum_score = min(100, max(0, 50 + (
                revenue_growth * 0.25 +
                donor_growth * 0.20 +
                gift_growth * 0.15 +
                trend_momentum * 0.20 +
                (retention_rate - 50) * 0.20
        )))

        # ---- IDENTIFY STRATEGIC GAPS ----
        strategic_gaps = []

        if retention_rate < 40:
            strategic_gaps.append({
                "area": "Donor Retention",
                "severity": "high",
                "description": f"Retention rate at {retention_rate:.1f}% is critically low",
                "benchmark": "Industry average: 45-50%",
                "impact": "High revenue leakage from donor churn"
            })
        elif retention_rate < 50:
            strategic_gaps.append({
                "area": "Donor Retention",
                "severity": "medium",
                "description": f"Retention rate at {retention_rate:.1f}% below benchmark",
                "benchmark": "Industry average: 45-50%",
                "impact": "Moderate revenue at risk"
            })

        if major_donor_growth < 0:
            strategic_gaps.append({
                "area": "Major Donor Pipeline",
                "severity": "high",
                "description": f"Major donor count declining ({major_donor_growth:.1f}%)",
                "benchmark": "Target: 5-10% annual growth",
                "impact": "Significant revenue concentration risk"
            })

        if new_donors < returning_donors * 0.3:
            strategic_gaps.append({
                "area": "Donor Acquisition",
                "severity": "medium",
                "description": "New donor acquisition below healthy ratio",
                "benchmark": "New donors should be 30%+ of base",
                "impact": "Long-term sustainability concern"
            })

        if mid_donor_growth < 0:
            strategic_gaps.append({
                "area": "Mid-Level Development",
                "severity": "medium",
                "description": f"Mid-level donor segment shrinking ({mid_donor_growth:.1f}%)",
                "benchmark": "This segment feeds major donor pipeline",
                "impact": "Future major donor pipeline at risk"
            })

        if revenue_growth < 0:
            strategic_gaps.append({
                "area": "Revenue Growth",
                "severity": "high",
                "description": f"Year-over-year revenue declining ({revenue_growth:.1f}%)",
                "benchmark": "Target: 5-15% annual growth",
                "impact": "Immediate operational concern"
            })

        # ---- IDENTIFY STRATEGIC OPPORTUNITIES ----
        strategic_opportunities = []

        if mid_donors > 0 and major_donors < mid_donors * 0.15:
            upgrade_potential = int(mid_donors * 0.10)
            strategic_opportunities.append({
                "area": "Major Gift Upgrades",
                "potential": "high",
                "description": f"~{upgrade_potential} mid-level donors ready for upgrade cultivation",
                "action": "Implement personalized upgrade paths",
                "projected_impact": f"Potential ${upgrade_potential * 15000:,.0f} in new major gifts"
            })

        if new_donors > 0:
            strategic_opportunities.append({
                "area": "New Donor Conversion",
                "potential": "medium",
                "description": f"{new_donors} new donors to convert to recurring",
                "action": "Launch 60-day new donor welcome series",
                "projected_impact": f"Target 25% conversion = {int(new_donors * 0.25)} recurring donors"
            })

        if retention_rate > 50:
            strategic_opportunities.append({
                "area": "Retention Excellence",
                "potential": "high",
                "description": f"Strong {retention_rate:.1f}% retention creates upgrade opportunity",
                "action": "Focus on increasing gift frequency and amount",
                "projected_impact": "10% gift increase = significant revenue lift"
            })

        if gift_growth > 5:
            strategic_opportunities.append({
                "area": "Gift Size Momentum",
                "potential": "medium",
                "description": f"Average gift growing {gift_growth:.1f}% YoY",
                "action": "Expand suggested gift arrays and matching campaigns",
                "projected_impact": "Accelerate gift size growth trajectory"
            })

        if trend_momentum > 10:
            strategic_opportunities.append({
                "area": "Revenue Momentum",
                "potential": "high",
                "description": "Strong upward trend in recent months",
                "action": "Double down on current successful strategies",
                "projected_impact": "Capitalize on positive momentum"
            })

        # ---- INVESTMENT RECOMMENDATIONS ----
        investment_recommendations = []

        # Prioritize based on gaps and opportunities
        if any(gap["area"] == "Donor Retention" for gap in strategic_gaps):
            investment_recommendations.append({
                "priority": 1,
                "area": "Retention & Stewardship",
                "recommendation": "Increase stewardship touchpoints and personalization",
                "investment_level": "high",
                "expected_roi": "3-5x within 12 months",
                "timeline": "Immediate"
            })

        if any(gap["area"] == "Major Donor Pipeline" for gap in strategic_gaps):
            investment_recommendations.append({
                "priority": 2,
                "area": "Major Gift Officer Capacity",
                "recommendation": "Add MGO capacity or tools for portfolio management",
                "investment_level": "high",
                "expected_roi": "5-10x within 18 months",
                "timeline": "Q1 priority"
            })

        if any(gap["area"] == "Donor Acquisition" for gap in strategic_gaps):
            investment_recommendations.append({
                "priority": 3,
                "area": "Acquisition Channels",
                "recommendation": "Diversify acquisition channels, test digital strategies",
                "investment_level": "medium",
                "expected_roi": "2-3x within 12 months",
                "timeline": "Q1-Q2"
            })

        if any(opp["area"] == "Mid-Level Development" for opp in strategic_opportunities) or \
                any(gap["area"] == "Mid-Level Development" for gap in strategic_gaps):
            investment_recommendations.append({
                "priority": 2,
                "area": "Mid-Level Program",
                "recommendation": "Launch dedicated mid-level donor program",
                "investment_level": "medium",
                "expected_roi": "4-6x within 24 months",
                "timeline": "Q2"
            })

        # Always recommend data/analytics investment
        investment_recommendations.append({
            "priority": 4,
            "area": "Data & Analytics",
            "recommendation": "Enhance donor scoring and predictive modeling",
            "investment_level": "low",
            "expected_roi": "Efficiency gains across all programs",
            "timeline": "Ongoing"
        })

        # Sort by priority
        investment_recommendations.sort(key=lambda x: x["priority"])

        # ---- MOMENTUM VS STAGNATION ANALYSIS ----
        momentum_indicators = {
            "score": round(momentum_score, 1),
            "status": "Strong Momentum" if momentum_score >= 65 else "Moderate Growth" if momentum_score >= 45 else "Stagnation Risk",
            "trend": "accelerating" if trend_momentum > 5 else "stable" if trend_momentum > -5 else "decelerating",
            "factors": {
                "revenue_growth": {
                    "value": round(revenue_growth, 1),
                    "status": "positive" if revenue_growth > 0 else "negative",
                    "weight": "25%"
                },
                "donor_growth": {
                    "value": round(donor_growth, 1),
                    "status": "positive" if donor_growth > 0 else "negative",
                    "weight": "20%"
                },
                "gift_size_growth": {
                    "value": round(gift_growth, 1),
                    "status": "positive" if gift_growth > 0 else "negative",
                    "weight": "15%"
                },
                "trend_momentum": {
                    "value": round(trend_momentum, 1),
                    "status": "positive" if trend_momentum > 0 else "negative",
                    "weight": "20%"
                },
                "retention": {
                    "value": round(retention_rate, 1),
                    "status": "positive" if retention_rate >= 45 else "negative",
                    "weight": "20%"
                }
            },
            "monthly_trend": monthly_revenue
        }

        return {
            "organization_id": organization_id,
            "generated_at": datetime.now().isoformat(),
            "period": f"YTD {current_year}",
            "strategic_gaps": strategic_gaps,
            "strategic_opportunities": strategic_opportunities,
            "investment_recommendations": investment_recommendations,
            "momentum_analysis": momentum_indicators,
            "key_metrics": {
                "current_revenue": float(current_revenue),
                "revenue_growth": round(revenue_growth, 1),
                "current_donors": current_donors,
                "donor_growth": round(donor_growth, 1),
                "retention_rate": round(retention_rate, 1),
                "avg_gift": round(avg_gift_current, 2),
                "major_donors": major_donors,
                "mid_donors": mid_donors,
                "new_donors": new_donors
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))