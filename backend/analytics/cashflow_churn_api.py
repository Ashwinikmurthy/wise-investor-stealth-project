"""
Cashflow Reports & Donor Churn Analytics API
Wise Investor Platform

These endpoints provide:
- Multi-year cashflow comparison with color coding
- Donor churn ratio analysis (In vs Out)
- Monthly performance tracking

Add to your analytics.py or create a new router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, not_
from typing import Optional, List, Dict
from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import UUID

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import Organizations, Donors, Donations
from models import (

    CashflowReport, DonorChurnMetrics
)

router = APIRouter(prefix="/api/v1/analytics/reports", tags=["Cashflow & Churn"])


# ============================================================================
# TOTAL INCOME CASHFLOW REPORT
# ============================================================================

@router.get("/cashflow/{organization_id}")
async def get_total_income_cashflow(
    organization_id: UUID,
    years: int = Query(3, description="Number of years to compare (3, 5, or 10)", ge=1, le=10),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Total Income Cashflow Report - Monthly Comparison Across Years
    
    Returns a matrix of monthly revenue data across multiple years with:
    - Monthly revenue, gift count, donor count
    - Year-to-date aggregates
    - Color-coded performance vs previous year:
      * Green: >10% increase
      * Yellow: Within ±10%
      * Red: >10% decrease
    
    Args:
        organization_id: Organization UUID
        years: Number of years to include (default 3, max 10)
    """
    verify_organization_access(current_user, organization_id)
    
    current_year = datetime.now().year
    start_year = current_year - years + 1
    
    # Get all monthly data for the period
    monthly_data = db.query(
        extract('year', Donations.donation_date).label('year'),
        extract('month', Donations.donation_date).label('month'),
        func.sum(Donations.amount).label('revenue'),
        func.count(Donations.id).label('gift_count'),
        func.count(func.distinct(Donations.donor_id)).label('donor_count')
    ).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) >= start_year,
        extract('year', Donations.donation_date) <= current_year
    ).group_by(
        extract('year', Donations.donation_date),
        extract('month', Donations.donation_date)
    ).all()
    
    # Organize data by year and month
    cashflow_matrix = {}
    
    for year in range(start_year, current_year + 1):
        cashflow_matrix[year] = {}
        ytd_revenue = 0
        ytd_gifts = 0
        ytd_donors_set = set()
        
        for month in range(1, 13):
            # Find data for this month
            month_data = next(
                (d for d in monthly_data if int(d.year) == year and int(d.month) == month), 
                None
            )
            
            if month_data:
                monthly_revenue = float(month_data.revenue) if month_data.revenue else 0
                monthly_gifts = month_data.gift_count
                monthly_donors = month_data.donor_count
                
                ytd_revenue += monthly_revenue
                ytd_gifts += monthly_gifts
                # Note: This is a simplified donor count - for exact unique donors, 
                # you'd need to query all donors up to this month
                
                # Determine color based on comparison to previous year
                prev_year_data = cashflow_matrix.get(year - 1, {}).get(month, {})
                if prev_year_data and 'revenue' in prev_year_data:
                    prev_revenue = prev_year_data['revenue']
                    if prev_revenue > 0:
                        change_pct = ((monthly_revenue - prev_revenue) / prev_revenue) * 100
                        if change_pct > 10:
                            color = 'green'
                        elif change_pct < -10:
                            color = 'red'
                        else:
                            color = 'yellow'
                    else:
                        color = 'green' if monthly_revenue > 0 else 'neutral'
                else:
                    color = 'neutral'
                
                cashflow_matrix[year][month] = {
                    'revenue': monthly_revenue,
                    'gift_count': monthly_gifts,
                    'donor_count': monthly_donors,
                    'avg_gift': monthly_revenue / monthly_gifts if monthly_gifts > 0 else 0,
                    'ytd_revenue': ytd_revenue,
                    'ytd_gifts': ytd_gifts,
                    'ytd_donors': monthly_donors,  # Simplified
                    'color': color
                }
            else:
                # No data for this month
                cashflow_matrix[year][month] = {
                    'revenue': 0,
                    'gift_count': 0,
                    'donor_count': 0,
                    'avg_gift': 0,
                    'ytd_revenue': ytd_revenue,
                    'ytd_gifts': ytd_gifts,
                    'ytd_donors': 0,
                    'color': 'neutral'
                }
    
    # Calculate year-over-year totals
    year_totals = {}
    for year in range(start_year, current_year + 1):
        year_total = sum(
            cashflow_matrix[year][month]['revenue'] 
            for month in range(1, 13)
        )
        year_totals[year] = year_total
    
    return {
        "cashflow_data": cashflow_matrix,
        "year_totals": year_totals,
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "years_included": list(range(start_year, current_year + 1)),
        "color_legend": {
            "green": "Revenue increased >10% vs previous year",
            "yellow": "Revenue within ±10% of previous year",
            "red": "Revenue decreased >10% vs previous year",
            "neutral": "No comparison data available"
        },
        "generated_at": datetime.utcnow().isoformat()
    }


@router.post("/cashflow/{organization_id}/update")
async def update_cashflow_cache(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update cashflow cache for faster dashboard loading
    
    This endpoint recalculates and caches all monthly cashflow data
    in the cashflow_reports table for improved performance.
    """
    verify_organization_access(current_user, organization_id)
    
    current_year = datetime.now().year
    start_year = current_year - 10  # Cache 10 years of data
    
    # Delete existing cache
    db.query(CashflowReport).filter(
        CashflowReport.organization_id == organization_id
    ).delete()
    
    # Calculate and cache each month
    for year in range(start_year, current_year + 1):
        ytd_revenue = 0
        ytd_gifts = 0
        ytd_donors = 0
        
        for month in range(1, 13):
            # Get monthly data
            month_data = db.query(
                func.sum(Donations.amount).label('revenue'),
                func.count(Donations.id).label('gift_count'),
                func.count(func.distinct(Donations.donor_id)).label('donor_count')
            ).filter(
                Donations.organization_id == organization_id,
                extract('year', Donations.donation_date) == year,
                extract('month', Donations.donation_date) == month
            ).first()
            
            monthly_revenue = float(month_data.revenue) if month_data and month_data.revenue else 0
            monthly_gifts = month_data.gift_count if month_data else 0
            monthly_donors = month_data.donor_count if month_data else 0
            
            ytd_revenue += monthly_revenue
            ytd_gifts += monthly_gifts
            
            # Determine color
            prev_year_report = db.query(CashflowReport).filter(
                CashflowReport.organization_id == organization_id,
                CashflowReport.year == year - 1,
                CashflowReport.month == month
            ).first()
            
            if prev_year_report and prev_year_report.revenue > 0:
                change_pct = ((monthly_revenue - float(prev_year_report.revenue)) / 
                             float(prev_year_report.revenue)) * 100
                if change_pct > 10:
                    color = 'green'
                elif change_pct < -10:
                    color = 'red'
                else:
                    color = 'yellow'
            else:
                color = 'neutral'
            
            # Save to cache
            report = CashflowReport(
                organization_id=organization_id,
                year=year,
                month=month,
                revenue=monthly_revenue,
                gift_count=monthly_gifts,
                donor_count=monthly_donors,
                avg_gift_size=monthly_revenue / monthly_gifts if monthly_gifts > 0 else 0,
                ytd_revenue=ytd_revenue,
                ytd_gift_count=ytd_gifts,
                ytd_donor_count=ytd_donors,
                comparison_status=color
            )
            db.add(report)
    
    db.commit()
    
    return {
        "message": "Cashflow cache updated successfully",
        "years_cached": list(range(start_year, current_year + 1)),
        "months_per_year": 12,
        "total_records": (current_year - start_year + 1) * 12
    }


# ============================================================================
# DONOR CHURN RATIO ANALYSIS
# ============================================================================

@router.get("/donor-churn/{organization_id}")
async def get_donor_churn_ratio(
    organization_id: UUID,
    period_months: int = Query(12, description="Period in months for analysis", ge=1, le=36),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    In vs Out Donor Churn Statistic
    
    Formula: (new donors + reactivated donors) / lapsed donors
    - Ratio = 1.0: equilibrium (balanced)
    - Ratio > 1.0: growing (gaining more than losing)
    - Ratio < 1.0: declining (losing more than gaining)
    
    Args:
        organization_id: Organization UUID
        period_months: Analysis period in months (default 12)
    
    Returns:
        Churn ratio, status, and detailed donor counts
    """
    verify_organization_access(current_user, organization_id)
    
    # Calculate period dates
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=period_months * 30)
    
    # Define lookback period for identifying reactivated donors
    lookback_start = start_date - timedelta(days=365 * 2)  # 2 years before period
    
    # Get NEW donors (first gift in the analysis period)
    new_donors_subquery = db.query(Donations.donor_id).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date < start_date
    ).subquery()
    
    new_donors = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= start_date,
        Donations.donation_date <= end_date,
        ~Donations.donor_id.in_(new_donors_subquery)
    ).scalar() or 0
    
    # Get REACTIVATED donors (gave in period but were lapsed)
    # Donors who gave 13-24 months ago but not in the 12 months before period start
    lapsed_period_start = start_date - timedelta(days=365)
    lapsed_period_end = start_date
    old_donors_start = lookback_start
    old_donors_end = lapsed_period_start
    
    # Donors who gave in old period
    old_givers = db.query(Donations.donor_id).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= old_donors_start,
        Donations.donation_date < old_donors_end
    ).subquery()
    
    # But didn't give in lapsed period
    recent_givers = db.query(Donations.donor_id).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= lapsed_period_start,
        Donations.donation_date < lapsed_period_end
    ).subquery()
    
    # And came back in current period
    reactivated_donors = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= start_date,
        Donations.donation_date <= end_date,
        Donations.donor_id.in_(old_givers),
        ~Donations.donor_id.in_(recent_givers)
    ).scalar() or 0
    
    # Get LAPSED donors (gave before period but not during)
    previous_period_start = start_date - timedelta(days=period_months * 30)
    previous_period_end = start_date
    
    previous_givers = db.query(Donations.donor_id).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= previous_period_start,
        Donations.donation_date < previous_period_end
    ).subquery()
    
    current_givers = db.query(Donations.donor_id).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= start_date,
        Donations.donation_date <= end_date
    ).subquery()
    
    lapsed_donors = db.query(func.count(func.distinct(previous_givers.c.donor_id))).filter(
        ~previous_givers.c.donor_id.in_(current_givers)
    ).scalar() or 1  # Avoid division by zero
    
    # Calculate churn ratio
    churn_ratio = (new_donors + reactivated_donors) / lapsed_donors if lapsed_donors > 0 else 0
    
    # Determine status
    if churn_ratio > 1.1:
        equilibrium_status = "growing"
    elif churn_ratio < 0.9:
        equilibrium_status = "declining"
    else:
        equilibrium_status = "equilibrium"
    
    # Save to database
    churn_metric = DonorChurnMetrics(
        organization_id=organization_id,
        period_start=start_date,
        period_end=end_date,
        new_donors=new_donors,
        reactivated_donors=reactivated_donors,
        lapsed_donors=lapsed_donors,
        churn_ratio=churn_ratio,
        equilibrium_status=equilibrium_status,
        trailing_12_months=(period_months == 12)
    )
    db.add(churn_metric)
    db.commit()
    
    return {
        "churn_ratio": round(churn_ratio, 2),
        "status": equilibrium_status,
        "details": {
            "new_donors": new_donors,
            "reactivated_donors": reactivated_donors,
            "total_in": new_donors + reactivated_donors,
            "lapsed_donors": lapsed_donors,
            "net_change": (new_donors + reactivated_donors) - lapsed_donors
        },
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "months": period_months
        },
        "interpretation": get_churn_interpretation(churn_ratio),
        "recommendations": get_churn_recommendations(churn_ratio, equilibrium_status),
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/donor-churn/{organization_id}/trend")
async def get_donor_churn_trend(
    organization_id: UUID,
    months: int = Query(12, description="Number of months to analyze", ge=6, le=36),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get donor churn trend over time
    
    Returns monthly churn ratios to visualize trends
    """
    verify_organization_access(current_user, organization_id)
    
    trends = []
    current_date = datetime.now().date()
    
    for i in range(months):
        end_date = current_date - timedelta(days=i * 30)
        start_date = end_date - timedelta(days=365)
        
        # Get saved metric if exists
        metric = db.query(DonorChurnMetrics).filter(
            DonorChurnMetrics.organization_id == organization_id,
            DonorChurnMetrics.period_end == end_date
        ).first()
        
        if metric:
            trends.append({
                "date": end_date.isoformat(),
                "churn_ratio": float(metric.churn_ratio),
                "status": metric.equilibrium_status,
                "new_donors": metric.new_donors,
                "reactivated_donors": metric.reactivated_donors,
                "lapsed_donors": metric.lapsed_donors
            })
    
    return {
        "trend_data": sorted(trends, key=lambda x: x['date']),
        "summary": {
            "current_ratio": trends[0]["churn_ratio"] if trends else 0,
            "average_ratio": sum(t["churn_ratio"] for t in trends) / len(trends) if trends else 0,
            "trend_direction": "improving" if len(trends) > 1 and trends[0]["churn_ratio"] > trends[-1]["churn_ratio"] else "declining"
        }
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_churn_interpretation(churn_ratio: float) -> str:
    """Get human-readable interpretation of churn ratio"""
    if churn_ratio > 1.2:
        return "Strong Growth - gaining significantly more donors than losing"
    elif churn_ratio > 1.0:
        return "Growing - gaining more donors than losing"
    elif churn_ratio >= 0.9:
        return "Equilibrium - balanced donor acquisition and losses"
    elif churn_ratio >= 0.7:
        return "Declining - losing more donors than gaining"
    else:
        return "Critical - significant donor loss requiring immediate action"


def get_churn_recommendations(churn_ratio: float, status: str) -> List[str]:
    """Get actionable recommendations based on churn status"""
    if status == "growing":
        return [
            "Excellent donor growth! Focus on converting new donors to repeat givers",
            "Invest in onboarding programs for new donors",
            "Track second gift conversion rates closely"
        ]
    elif status == "equilibrium":
        return [
            "Donor base is stable but not growing",
            "Increase investment in acquisition to drive growth",
            "Focus on moving donors up the giving ladder"
        ]
    else:  # declining
        return [
            "URGENT: Donor losses exceed acquisitions",
            "Implement donor retention campaigns immediately",
            "Conduct lapsed donor reactivation program",
            "Review donor experience and communication frequency",
            "Consider hiring additional stewardship staff"
        ]
