"""
Second Gift Tracking & Revenue Diversification Analytics API
Wise Investor Platform

These endpoints provide:
- Second gift conversion tracking with breakeven analysis
- Revenue diversification scoring
- Acquisition channel performance

Add to your analytics.py or create a new donor analytics router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import UUID
import statistics

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import SecondGiftTracking
from models import (
    Organizations, Donors, Donations

)

router = APIRouter(prefix="/api/v1/analytics/acquisition", tags=["Donor Acquisition"])


# ============================================================================
# SECOND GIFT CONVERSION TRACKING
# ============================================================================

@router.get("/second-gift/{organization_id}")
async def get_second_gift_conversion(
    organization_id: UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Track Second Gift Conversion Rates and Breakeven Analysis
    
    Analyzes:
    - Percentage of new donors who give a second gift
    - Average time to second gift
    - Breakeven analysis (when cumulative value exceeds acquisition cost)
    
    Industry Benchmarks:
    - Conversion Rate: 20% (target)
    - Days to Second Gift: 90 days (target)
    - Breakeven: 18 months (target)
    
    Args:
        organization_id: Organization UUID
        start_date: Start of analysis period (default: 1 year ago)
        end_date: End of analysis period (default: today)
    """
    verify_organization_access(current_user, organization_id)
    
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=365)
    
    # Get all donors who made their first gift in the period
    first_gifts_query = db.query(
        Donations.donor_id,
        func.min(Donations.donation_date).label('first_gift_date'),
        func.min(Donations.amount).label('first_gift_amount')
    ).filter(
        Donations.organization_id == organization_id
    ).group_by(Donations.donor_id).subquery()
    
    new_donors = db.query(
        Donors.id,
        Donors.first_name,
        Donors.last_name,
        first_gifts_query.c.first_gift_date,
        first_gifts_query.c.first_gift_amount
    ).join(
        first_gifts_query,
        Donors.id == first_gifts_query.c.donor_id
    ).filter(
        Donors.organization_id == organization_id,
        first_gifts_query.c.first_gift_date >= start_date,
        first_gifts_query.c.first_gift_date <= end_date
    ).all()
    
    conversion_data = []
    total_new_donors = len(new_donors)
    
    # Default acquisition cost (should be configurable per organization)
    default_acquisition_cost = Decimal('50.00')
    
    for donor in new_donors:
        # Get all gifts for this donor
        gifts = db.query(Donations).filter(
            Donations.donor_id == donor.id,
            Donations.organization_id == organization_id
        ).order_by(Donations.donation_date).all()
        
        if len(gifts) >= 2:
            # Donor has made second gift
            first_gift = gifts[0]
            second_gift = gifts[1]
            
            days_between = (second_gift.donation_date - first_gift.donation_date).days
            
            # Calculate cumulative value and breakeven
            acquisition_cost = default_acquisition_cost  # Can be customized
            cumulative_value = sum(g.amount for g in gifts[:2])
            breakeven_achieved = cumulative_value >= acquisition_cost
            
            # Find when breakeven was achieved
            breakeven_date = None
            months_to_breakeven = None
            running_total = Decimal('0')
            
            for i, gift in enumerate(gifts):
                running_total += gift.amount
                if running_total >= acquisition_cost and not breakeven_date:
                    breakeven_date = gift.donation_date
                    months_to_breakeven = (
                        (breakeven_date.year - first_gift.donation_date.year) * 12 +
                        (breakeven_date.month - first_gift.donation_date.month)
                    )
                    break
            
            conversion_data.append({
                "donor_id": str(donor.id),
                "donor_name": f"{donor.first_name} {donor.last_name}",
                "first_gift_date": first_gift.donation_date.isoformat(),
                "first_gift_amount": float(first_gift.amount),
                "second_gift_date": second_gift.donation_date.isoformat(),
                "second_gift_amount": float(second_gift.amount),
                "days_to_second_gift": days_between,
                "breakeven_achieved": breakeven_achieved,
                "breakeven_date": breakeven_date.isoformat() if breakeven_date else None,
                "months_to_breakeven": months_to_breakeven,
                "cumulative_value": float(cumulative_value),
                "acquisition_cost": float(acquisition_cost)
            })
            
            # Save to tracking table
            tracking = SecondGiftTracking(
                organization_id=organization_id,
                donor_id=donor.id,
                first_gift_date=first_gift.donation_date,
                first_gift_amount=first_gift.amount,
                acquisition_cost=acquisition_cost,
                second_gift_date=second_gift.donation_date,
                second_gift_amount=second_gift.amount,
                days_to_second_gift=days_between,
                breakeven_date=breakeven_date,
                months_to_breakeven=months_to_breakeven,
                acquisition_channel="unknown"  # Can be enhanced with channel tracking
            )
            db.add(tracking)
    
    db.commit()
    
    # Calculate metrics
    converted_donors = len(conversion_data)
    conversion_rate = (converted_donors / total_new_donors * 100) if total_new_donors > 0 else 0
    
    avg_days_to_second = (
        statistics.mean([d["days_to_second_gift"] for d in conversion_data])
        if conversion_data else 0
    )
    
    breakeven_count = sum(1 for d in conversion_data if d["breakeven_achieved"])
    breakeven_rate = (breakeven_count / total_new_donors * 100) if total_new_donors > 0 else 0
    
    avg_months_to_breakeven = (
        statistics.mean([d["months_to_breakeven"] for d in conversion_data if d["months_to_breakeven"]])
        if any(d["months_to_breakeven"] for d in conversion_data) else 0
    )
    
    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "metrics": {
            "total_new_donors": total_new_donors,
            "second_gift_conversions": converted_donors,
            "conversion_rate_percent": round(conversion_rate, 2),
            "avg_days_to_second_gift": round(avg_days_to_second, 0),
            "breakeven_achieved_count": breakeven_count,
            "breakeven_rate_percent": round(breakeven_rate, 2),
            "avg_months_to_breakeven": round(avg_months_to_breakeven, 1)
        },
        "target_benchmarks": {
            "conversion_rate_target": 20,  # Industry benchmark
            "days_to_second_gift_target": 90,
            "breakeven_months_target": 18
        },
        "performance_vs_target": {
            "conversion_rate": "above" if conversion_rate >= 20 else "below",
            "days_to_second": "above" if avg_days_to_second <= 90 else "below",
            "breakeven_months": "above" if avg_months_to_breakeven <= 18 else "below"
        },
        "details": conversion_data[:50],  # First 50 for preview
        "total_detail_count": len(conversion_data),
        "recommendations": get_second_gift_recommendations(
            conversion_rate, avg_days_to_second, breakeven_rate
        )
    }


@router.get("/second-gift/{organization_id}/by-channel")
async def get_second_gift_by_channel(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Second gift conversion rates by acquisition channel
    
    Compares performance across different donor acquisition channels
    """
    verify_organization_access(current_user, organization_id)
    
    # Get second gift tracking grouped by channel
    channel_data = db.query(
        SecondGiftTracking.acquisition_channel,
        func.count(SecondGiftTracking.id).label('total_donors'),
        func.count(SecondGiftTracking.second_gift_date).label('converted'),
        func.avg(SecondGiftTracking.days_to_second_gift).label('avg_days'),
        func.avg(SecondGiftTracking.months_to_breakeven).label('avg_months_breakeven')
    ).filter(
        SecondGiftTracking.organization_id == organization_id
    ).group_by(
        SecondGiftTracking.acquisition_channel
    ).all()
    
    channels = []
    for channel in channel_data:
        conversion_rate = (channel.converted / channel.total_donors * 100) if channel.total_donors > 0 else 0
        
        channels.append({
            "channel": channel.acquisition_channel,
            "total_donors": channel.total_donors,
            "converted_donors": channel.converted,
            "conversion_rate_percent": round(conversion_rate, 2),
            "avg_days_to_second_gift": round(float(channel.avg_days or 0), 0),
            "avg_months_to_breakeven": round(float(channel.avg_months_breakeven or 0), 1)
        })
    
    # Sort by conversion rate
    channels.sort(key=lambda x: x['conversion_rate_percent'], reverse=True)
    
    return {
        "channels": channels,
        "best_performer": channels[0] if channels else None,
        "worst_performer": channels[-1] if channels else None
    }


# ============================================================================
# REVENUE DIVERSIFICATION ANALYSIS
# ============================================================================

@router.get("/revenue/diversification/{organization_id}")
async def get_revenue_diversification(
    organization_id: UUID,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Revenue Diversification Analysis
    
    Analyzes revenue sources including:
    - Individuals
    - Corporations
    - Foundations
    - Government grants
    - Other revenue (fees, services, etc.)
    
    Returns Herfindahl-Hirschman Index (HHI) for revenue concentration:
    - 0-25: Highly diversified
    - 25-50: Moderately diversified
    - 50-75: Moderately concentrated
    - 75-100: Highly concentrated
    
    Args:
        organization_id: Organization UUID
        year: Fiscal year (default: current year)
    """
    verify_organization_access(current_user, organization_id)
    
    if not year:
        year = datetime.now().year
    
    # Get contributed revenue by source
    # Note: This assumes you have a donation_type or similar field
    # Adjust the field name based on your schema
    
    # Individual giving
    individual_revenue = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == year,
        # Add filter for individual donations if you have categorization
        # For now, we'll use all donations as individual
    ).scalar() or Decimal('0')
    
    # For a more accurate implementation, you would need:
    # - donation_type field in Donations table
    # - or donor_type field in Donors table
    # - or separate tables for different revenue sources
    
    # Placeholder calculations (replace with actual categorization)
    total_revenue = float(individual_revenue)
    
    # Example breakdown (you should replace with actual data)
    revenue_sources = {
        "individuals": float(individual_revenue) * 0.6,  # Placeholder: 60%
        "corporate": float(individual_revenue) * 0.2,    # Placeholder: 20%
        "foundations": float(individual_revenue) * 0.15,  # Placeholder: 15%
        "government": float(individual_revenue) * 0.05,   # Placeholder: 5%
        "other": 0  # Placeholder
    }
    
    # Calculate diversification score (HHI)
    diversification_score = calculate_diversification_score(list(revenue_sources.values()))
    
    return {
        "year": year,
        "revenue_breakdown": {
            "total_revenue": total_revenue,
            "contributed_revenue": total_revenue,  # Update when you have other revenue
            "other_revenue": 0
        },
        "contributed_sources": {
            "individuals": {
                "amount": revenue_sources["individuals"],
                "percentage": round((revenue_sources["individuals"] / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "corporate": {
                "amount": revenue_sources["corporate"],
                "percentage": round((revenue_sources["corporate"] / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "foundations": {
                "amount": revenue_sources["foundations"],
                "percentage": round((revenue_sources["foundations"] / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "government_grants": {
                "amount": revenue_sources["government"],
                "percentage": round((revenue_sources["government"] / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            "other": {
                "amount": revenue_sources["other"],
                "percentage": 0
            }
        },
        "diversification_score": diversification_score,
        "diversification_rating": get_diversification_rating(diversification_score),
        "recommendations": get_diversification_recommendations(revenue_sources, total_revenue),
        "note": "Revenue categorization requires donor_type or donation_type field implementation"
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_diversification_score(revenues: List[float]) -> float:
    """
    Calculate Herfindahl-Hirschman Index for revenue concentration
    
    Returns a score from 0-100 where:
    - 0 = perfectly diversified
    - 100 = completely concentrated in one source
    """
    total = sum(revenues)
    if total == 0:
        return 0
    
    shares = [r / total for r in revenues]
    hhi = sum(s ** 2 for s in shares)
    
    # Convert to 0-100 scale where higher = more diversified
    # Invert so lower concentration = higher score
    return round((1 - hhi) * 100, 2)


def get_diversification_rating(score: float) -> str:
    """Get rating based on diversification score"""
    if score >= 75:
        return "Highly Diversified - Excellent"
    elif score >= 50:
        return "Moderately Diversified - Good"
    elif score >= 25:
        return "Moderately Concentrated - Fair"
    else:
        return "Highly Concentrated - At Risk"


def get_diversification_recommendations(sources: Dict[str, float], total: float) -> List[str]:
    """Generate recommendations based on revenue mix"""
    recommendations = []
    
    # Check each source
    for source, amount in sources.items():
        percentage = (amount / total * 100) if total > 0 else 0
        
        if percentage > 60:
            recommendations.append(
                f"WARNING: {source.title()} represents {percentage:.1f}% of revenue. "
                f"Diversify to reduce risk."
            )
        elif percentage < 5 and source in ["corporate", "foundations"]:
            recommendations.append(
                f"Opportunity: {source.title()} only {percentage:.1f}% of revenue. "
                f"Consider expanding this area."
            )
    
    if not recommendations:
        recommendations.append("Revenue is well-diversified. Maintain balanced approach.")
    
    return recommendations


def get_second_gift_recommendations(
    conversion_rate: float,
    avg_days: float,
    breakeven_rate: float
) -> List[str]:
    """Generate actionable recommendations for second gift performance"""
    recommendations = []
    
    if conversion_rate < 15:
        recommendations.append(
            "CRITICAL: Second gift conversion below 15%. Implement immediate onboarding program for new donors."
        )
    elif conversion_rate < 20:
        recommendations.append(
            "Second gift conversion below target. Consider welcome series and early engagement touchpoints."
        )
    else:
        recommendations.append(
            "Excellent second gift conversion! Focus on maintaining quality donor experience."
        )
    
    if avg_days > 120:
        recommendations.append(
            "Second gifts taking too long. Add 30-day and 60-day touchpoints to accelerate conversion."
        )
    elif avg_days > 90:
        recommendations.append(
            "Second gift timing is acceptable but could improve with strategic nurturing."
        )
    
    if breakeven_rate < 50:
        recommendations.append(
            "Low breakeven rate suggests acquisition costs too high or donor values too low. "
            "Review acquisition strategies and improve donor retention."
        )
    
    return recommendations
