"""
Donor Analytics Endpoints for Wise Investor Platform
Add these endpoints to your existing new_donor_analytics.py file

Focuses on:
- Second gift conversion tracking
- Revenue diversification analysis
- Donor acquisition metrics

Based on Bob's Feedback Implementation
Date: November 14, 2025
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc, distinct
from uuid import UUID
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List
from decimal import Decimal
import statistics

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import Donations as Donation, Donors as Donor, Organizations as Organization
from models import SecondGiftTracking

# Use your existing authentication
# from your_auth_module import get_current_user, verify_organization_access

router = APIRouter(prefix="/api/v1/analytics/donor", tags=["Donor Analytics"])


# =====================================================================
# SECOND GIFT CONVERSION TRACKING
# =====================================================================

@router.get("/acquisition/second-gift/{organization_id}")
async def get_second_gift_conversion(
    organization_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Track second gift conversion rates and breakeven analysis
    
    The second gift is the most important metric for donor lifetime value.
    This endpoint tracks:
    - Conversion rate (% of new donors who make a second gift)
    - Average days to second gift
    - Breakeven achievement (when cumulative value > acquisition cost)
    
    Industry Benchmarks:
    - 20% second gift conversion rate
    - 90 days to second gift target
    - 18 months to breakeven target
    
    Returns detailed metrics and donor-level data for analysis.
    """
    verify_organization_access(current_user, UUID(organization_id))
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get all first-time donors in the period
    # Find donors whose first donation was in this period
    first_gift_subquery = db.query(
        Donation.donor_id,
        func.min(Donation.donation_date).label('first_date')
    ).filter(
        Donation.organization_id == UUID(organization_id)
    ).group_by(Donation.donor_id).subquery()
    
    new_donors_in_period = db.query(Donor).join(
        first_gift_subquery,
        Donor.id == first_gift_subquery.c.donor_id
    ).filter(
        first_gift_subquery.c.first_date.between(start_date, end_date)
    ).all()
    
    conversion_data = []
    total_new_donors = len(new_donors_in_period)
    
    for donor in new_donors_in_period:
        # Get first two gifts for this donor
        gifts = db.query(Donation).filter(
            Donation.donor_id == donor.id,
            Donation.organization_id == UUID(organization_id)
        ).order_by(Donation.donation_date).limit(2).all()
        
        if len(gifts) >= 2:
            days_between = (gifts[1].donation_date - gifts[0].donation_date).days
            
            # Default acquisition cost (should be stored in campaigns or settings)
            acquisition_cost = Decimal('50.00')
            
            # Calculate cumulative value
            cumulative_value = sum(g.amount for g in gifts)
            breakeven_achieved = cumulative_value >= acquisition_cost
            
            # Calculate months to breakeven
            months_to_second = days_between / 30.0
            
            conversion_data.append({
                "donor_id": str(donor.id),
                "donor_name": f"{donor.first_name} {donor.last_name}",
                "first_gift_date": gifts[0].donation_date.isoformat(),
                "first_gift_amount": float(gifts[0].amount),
                "second_gift_date": gifts[1].donation_date.isoformat(),
                "second_gift_amount": float(gifts[1].amount),
                "days_to_second_gift": days_between,
                "months_to_second_gift": round(months_to_second, 1),
                "breakeven_achieved": breakeven_achieved,
                "cumulative_value": float(cumulative_value),
                "acquisition_cost": float(acquisition_cost)
            })
            
            # Save to tracking table
            tracking = SecondGiftTracking(
                organization_id=UUID(organization_id),
                donor_id=donor.id,
                first_gift_date=gifts[0].donation_date.date(),
                first_gift_amount=gifts[0].amount,
                acquisition_cost=acquisition_cost,
                acquisition_channel="Unknown",  # Should come from donation record
                second_gift_date=gifts[1].donation_date.date(),
                second_gift_amount=gifts[1].amount,
                days_to_second_gift=days_between,
                breakeven_date=gifts[1].donation_date.date() if breakeven_achieved else None,
                months_to_breakeven=int(months_to_second) if breakeven_achieved else None
            )
            
            # Check if record already exists
            existing = db.query(SecondGiftTracking).filter(
                SecondGiftTracking.donor_id == donor.id,
                SecondGiftTracking.organization_id == UUID(organization_id)
            ).first()
            
            if not existing:
                db.add(tracking)
    
    db.commit()
    
    # Calculate aggregate metrics
    converted_donors = len(conversion_data)
    conversion_rate = (converted_donors / total_new_donors * 100) if total_new_donors > 0 else 0
    
    avg_days_to_second = statistics.mean(
        [d["days_to_second_gift"] for d in conversion_data]
    ) if conversion_data else 0
    
    median_days_to_second = statistics.median(
        [d["days_to_second_gift"] for d in conversion_data]
    ) if conversion_data else 0
    
    breakeven_count = sum(1 for d in conversion_data if d["breakeven_achieved"])
    breakeven_rate = (breakeven_count / total_new_donors * 100) if total_new_donors > 0 else 0
    
    avg_cumulative_value = statistics.mean(
        [d["cumulative_value"] for d in conversion_data]
    ) if conversion_data else 0
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "summary_metrics": {
            "total_new_donors": total_new_donors,
            "second_gift_conversions": converted_donors,
            "conversion_rate_percent": round(conversion_rate, 2),
            "avg_days_to_second_gift": round(avg_days_to_second),
            "median_days_to_second_gift": round(median_days_to_second),
            "breakeven_achieved_count": breakeven_count,
            "breakeven_rate_percent": round(breakeven_rate, 2),
            "avg_cumulative_value": round(avg_cumulative_value, 2)
        },
        "benchmarks": {
            "conversion_rate_target": 20,
            "conversion_rate_excellent": 30,
            "days_to_second_gift_target": 90,
            "days_to_second_gift_excellent": 60,
            "breakeven_months_target": 18,
            "breakeven_months_excellent": 12
        },
        "performance_vs_benchmarks": {
            "conversion_rate_status": "Excellent" if conversion_rate > 30 else "Good" if conversion_rate > 20 else "Needs Improvement",
            "speed_to_second_status": "Excellent" if avg_days_to_second < 60 else "Good" if avg_days_to_second < 90 else "Needs Improvement",
            "breakeven_status": "Excellent" if breakeven_rate > 70 else "Good" if breakeven_rate > 50 else "Needs Improvement"
        },
        "details": conversion_data[:50],  # First 50 for performance
        "total_detail_records": len(conversion_data)
    }


# =====================================================================
# REVENUE DIVERSIFICATION ANALYSIS
# =====================================================================

@router.get("/revenue/diversification/{organization_id}")
async def get_revenue_diversification(
    organization_id: str,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Revenue diversification analysis including all revenue sources
    
    Analyzes revenue concentration across different sources:
    - Individual giving
    - Corporate donations
    - Foundation grants
    - Government grants
    - Other revenue (fees, services, etc.)
    
    Calculates Herfindahl-Hirschman Index (HHI) to measure concentration:
    - 0-25: Highly diversified (low risk)
    - 26-50: Moderately diversified
    - 51-75: Moderately concentrated
    - 76-100: Highly concentrated (high risk)
    
    Lower HHI = more diversified = lower risk
    """
    verify_organization_access(current_user, UUID(organization_id))
    
    if not year:
        year = datetime.now().year
    
    # Assuming your Donation model has a 'dedication_type' or similar field
    # If not, you'll need to determine this from donor type or campaign type
    
    # Get contributed revenue by source
    revenue_by_type = db.query(
        Donation.dedication_type,  # or another field that categorizes donations
        func.sum(Donation.amount).label('total')
    ).filter(
        Donation.organization_id == UUID(organization_id),
        extract('year', Donation.donation_date) == year
    ).group_by(Donation.dedication_type).all()
    
    # If dedication_type doesn't exist, use a default breakdown
    # This is a fallback - adjust based on your actual schema
    if not revenue_by_type:
        # Fallback: all revenue as "individual"
        total_donations = db.query(func.sum(Donation.amount)).filter(
            Donation.organization_id == UUID(organization_id),
            extract('year', Donation.donation_date) == year
        ).scalar() or 0
        
        revenue_by_type = [("individual", total_donations)]
    
    # Map to standard categories
    category_mapping = {
        "individual": "individuals",
        "corporate": "corporate",
        "foundation": "foundations",
        "government": "government_grants",
        "other": "other_revenue"
    }
    
    revenue_breakdown = {
        "individuals": Decimal('0'),
        "corporate": Decimal('0'),
        "foundations": Decimal('0'),
        "government_grants": Decimal('0'),
        "other_revenue": Decimal('0')
    }
    
    for dedication_type, total in revenue_by_type:
        category = category_mapping.get(dedication_type, "other_revenue")
        revenue_breakdown[category] += total
    
    # Calculate totals
    total_contributed = sum(revenue_breakdown.values())
    total_revenue = total_contributed  # Could add other revenue sources
    
    # Calculate percentages and build response
    sources_detail = {}
    revenue_list = []
    
    for source, amount in revenue_breakdown.items():
        percentage = (float(amount) / float(total_revenue) * 100) if total_revenue > 0 else 0
        sources_detail[source] = {
            "amount": float(amount),
            "percentage": round(percentage, 2)
        }
        revenue_list.append(float(amount))
    
    # Calculate diversification score (inverse HHI)
    diversification_score = calculate_diversification_score(revenue_list)
    
    # Determine risk level
    if diversification_score > 75:
        risk_level = "Low - Highly diversified"
        recommendation = "Excellent revenue diversification. Maintain current mix."
    elif diversification_score > 50:
        risk_level = "Moderate - Good diversification"
        recommendation = "Good diversification. Consider expanding smaller categories."
    elif diversification_score > 25:
        risk_level = "Moderate-High - Some concentration"
        recommendation = "Revenue concentrated in few sources. Develop diversification strategy."
    else:
        risk_level = "High - Heavy concentration"
        recommendation = "Critical: Over-reliance on single source. Immediate diversification needed."
    
    return {
        "organization_id": organization_id,
        "year": year,
        "revenue_summary": {
            "total_revenue": float(total_revenue),
            "contributed_revenue": float(total_contributed),
            "other_revenue": 0.0  # Placeholder for non-donation revenue
        },
        "revenue_by_source": sources_detail,
        "diversification_analysis": {
            "diversification_score": diversification_score,
            "risk_level": risk_level,
            "interpretation": get_diversification_interpretation(diversification_score),
            "recommendation": recommendation
        },
        "benchmarks": {
            "ideal_individual_percent": "40-60%",
            "ideal_foundation_percent": "15-25%",
            "ideal_corporate_percent": "10-20%",
            "ideal_government_percent": "10-20%",
            "max_single_source": "60%"
        }
    }


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

def calculate_diversification_score(revenues: List[float]) -> float:
    """
    Calculate diversification score using Herfindahl-Hirschman Index (HHI)
    
    HHI = sum of squared market shares
    Diversification Score = (1 - HHI) * 100
    
    Returns: 0-100 where higher = more diversified
    """
    total = sum(revenues)
    if total == 0:
        return 0
    
    # Calculate market shares
    shares = [r / total for r in revenues]
    
    # Calculate HHI
    hhi = sum(s ** 2 for s in shares)
    
    # Convert to 0-100 scale where higher = more diversified
    diversification_score = (1 - hhi) * 100
    
    return round(diversification_score, 2)


def get_diversification_interpretation(score: float) -> str:
    """Get human-readable interpretation of diversification score"""
    if score > 75:
        return "Highly diversified - Low risk of revenue disruption"
    elif score > 50:
        return "Moderately diversified - Acceptable risk level"
    elif score > 25:
        return "Moderately concentrated - Elevated risk"
    else:
        return "Highly concentrated - High risk of revenue loss if primary source affected"


# =====================================================================
# DONOR ACQUISITION COST ANALYSIS
# =====================================================================

@router.get("/acquisition/cost-analysis/{organization_id}")
async def get_donor_acquisition_cost(
    organization_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    by_channel: bool = Query(False, description="Break down by acquisition channel"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Donor acquisition cost analysis
    
    Calculates cost per acquired donor and ROI on acquisition spending.
    Can be broken down by channel (email, social, direct mail, etc.)
    
    Key metrics:
    - Total acquisition cost
    - Donors acquired
    - Cost per donor
    - First-year value
    - Projected lifetime value
    - ROI calculation
    """
    verify_organization_access(current_user, UUID(organization_id))
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get new donors in period (same logic as second gift tracking)
    first_gift_subquery = db.query(
        Donation.donor_id,
        func.min(Donation.donation_date).label('first_date')
    ).filter(
        Donation.organization_id == UUID(organization_id)
    ).group_by(Donation.donor_id).subquery()
    
    donors_acquired = db.query(func.count(distinct(Donor.id))).join(
        first_gift_subquery,
        Donor.id == first_gift_subquery.c.donor_id
    ).filter(
        first_gift_subquery.c.first_date.between(start_date, end_date)
    ).scalar() or 0
    
    # Calculate first year value from these donors
    first_year_value = db.query(func.sum(Donation.amount)).join(
        first_gift_subquery,
        Donation.donor_id == first_gift_subquery.c.donor_id
    ).filter(
        first_gift_subquery.c.first_date.between(start_date, end_date),
        Donation.donation_date.between(start_date, end_date)
    ).scalar() or 0
    
    # Placeholder for acquisition expenses (should come from campaign expenses)
    acquisition_expenses = Decimal('5000')  # Default
    
    # Calculate metrics
    cost_per_donor = float(acquisition_expenses) / donors_acquired if donors_acquired > 0 else 0
    roi_first_year = ((float(first_year_value) - float(acquisition_expenses)) / float(acquisition_expenses) * 100) if acquisition_expenses > 0 else 0
    
    # Projected lifetime value (using industry average multiplier)
    projected_ltv_multiplier = 5  # Average donor gives for 5 years
    avg_gift = float(first_year_value) / donors_acquired if donors_acquired > 0 else 0
    projected_ltv = avg_gift * projected_ltv_multiplier
    
    roi_lifetime = ((projected_ltv - cost_per_donor) / cost_per_donor * 100) if cost_per_donor > 0 else 0
    
    return {
        "organization_id": organization_id,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "acquisition_metrics": {
            "total_acquisition_cost": float(acquisition_expenses),
            "donors_acquired": donors_acquired,
            "cost_per_donor": round(cost_per_donor, 2),
            "first_year_value": float(first_year_value),
            "avg_first_gift": round(avg_gift, 2)
        },
        "roi_analysis": {
            "first_year_roi_percent": round(roi_first_year, 2),
            "projected_lifetime_value": round(projected_ltv, 2),
            "projected_lifetime_roi_percent": round(roi_lifetime, 2),
            "months_to_breakeven": round(12 / (float(first_year_value) / float(acquisition_expenses))) if first_year_value > 0 else None
        },
        "benchmarks": {
            "cost_per_donor_target": "$25-75",
            "first_year_roi_target": "0-50%",
            "lifetime_roi_target": "300-500%",
            "months_to_breakeven_target": 18
        },
        "status": {
            "cost_efficiency": "Excellent" if cost_per_donor < 50 else "Good" if cost_per_donor < 75 else "Needs Improvement",
            "roi_health": "Strong" if roi_first_year > 0 else "Investment Phase"
        }
    }
