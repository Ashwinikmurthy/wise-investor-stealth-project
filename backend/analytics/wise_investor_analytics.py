"""
Enhanced Analytics Endpoints for Wise Investor Platform
Add these endpoints to your existing analytics.py file

Based on Bob's Feedback Implementation
Date: November 14, 2025

These endpoints integrate with the new models in enhanced_models.py
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc
from uuid import UUID
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List, Any
from decimal import Decimal
import statistics

from analytics.analytics import get_current_user, verify_organization_access
# Assuming you have these imports from your existing analytics.py
from database import get_db
from models import (
    Organizations as Organization, 
    Users as User,  
    Donations as Donation, 
    Donors as Donor,
    Programs as Program
)

# Import the new models
from models import (
    WiseInvestorScore,
    DonorChurnMetrics,
    StaffingAnalysis,
    CashflowReport,
    DonorEngagementContinuum,
    LegacyPipeline,
    SecondGiftTracking,
    WhatIfScenarios,
    GoldenTriangle
)

# Use your existing authentication functions
# get_current_user() and verify_organization_access() from your analytics.py
router = APIRouter(prefix="/api/v1/analytics", tags=["Donor Acquisition"])

# =====================================================================
# P2SG EXECUTIVE DASHBOARD
# =====================================================================

@router.get("/executive/p2sg-dashboard/{organization_id}")
async def get_p2sg_executive_dashboard(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    P2SG Executive Dashboard - One-page comprehensive view
    
    Implements Bob's 9/20/25 email specifications:
    - Wise Investor 2x2 quadrant positioning
    - Key formulas: V+S+SI+M = G4S2F and DE + DX -> DR -> LTV
    - Donor churn ratio
    - Engagement continuum
    - Multi-year trends (3, 5, 10 years)
    
    Returns: Complete executive overview with all strategic metrics
    """
    verify_organization_access(current_user, organization_id)
    
    # Get latest Wise Investor Score
    wise_score = db.query(WiseInvestorScore).filter(
        WiseInvestorScore.organization_id == organization_id
    ).order_by(WiseInvestorScore.calculated_date.desc()).first()
    
    # If no score exists, calculate one
    if not wise_score:
        wise_score = calculate_wise_investor_score(db, organization_id)
    
    # Build key formulas data
    vision_strategy_data = {
        "formula": "V+S+SI+M = G4S2F",
        "description": "Vision + Strategy + Sustained Investment + Momentum = Growth for Scale and Sustainability Foundation",
        "components": {
            "vision": wise_score.vision_score if wise_score else 0,
            "strategy": wise_score.strategy_score if wise_score else 0,
            "sustained_investment": wise_score.sustained_investment_score if wise_score else 0,
            "momentum": wise_score.momentum_score if wise_score else 0,
            "g4s2f_score": wise_score.g4s2f_composite_score if wise_score else 0
        }
    }
    
    donor_lifecycle_data = {
        "formula": "^DE + ^DX -> ^DR -> ^LTV -> ^Revenue & Impact",
        "description": "Increased Donor Engagement + Experience leads to Retention, Lifetime Value, Revenue & Impact",
        "components": {
            "donor_engagement": wise_score.donor_engagement_score if wise_score else 0,
            "donor_experience": wise_score.donor_experience_score if wise_score else 0,
            "donor_retention": wise_score.donor_retention_score if wise_score else 0,
            "ltv_growth": wise_score.ltv_growth_score if wise_score else 0
        }
    }
    
    # Get donor churn metrics (trailing 12 months)
    churn = db.query(DonorChurnMetrics).filter(
        DonorChurnMetrics.organization_id == organization_id,
        DonorChurnMetrics.trailing_12_months == True
    ).order_by(DonorChurnMetrics.created_at.desc()).first()
    
    # Get engagement continuum data
    continuum = db.query(DonorEngagementContinuum).filter(
        DonorEngagementContinuum.organization_id == organization_id
    ).all()
    
    # Get multi-year trends (3, 5, 10 years)
    current_year = datetime.now().year
    multi_year_trends = []
    
    for years_back in [3, 5, 10]:
        start_year = current_year - years_back
        yearly_data = db.query(
            extract('year', Donation.donation_date).label('year'),
            func.sum(Donation.amount).label('revenue'),
            func.count(func.distinct(Donation.donor_id)).label('donors'),
            func.count(Donation.id).label('gifts')
        ).filter(
            Donation.organization_id == organization_id,
            extract('year', Donation.donation_date) >= start_year
        ).group_by(extract('year', Donation.donation_date)).all()
        
        multi_year_trends.append({
            "period": f"{years_back}_year",
            "start_year": start_year,
            "end_year": current_year,
            "data": [
                {
                    "year": int(d.year),
                    "revenue": float(d.revenue),
                    "donors": d.donors,
                    "gifts": d.gifts
                } for d in yearly_data
            ]
        })
    
    return {
        "wise_investor_quadrant": {
            "quadrant": wise_score.quadrant if wise_score else "Not Calculated",
            "x_position": wise_score.x_score if wise_score else 50,
            "y_position": wise_score.y_score if wise_score else 50,
            "hover_description": wise_score.notes if wise_score else {},
            "calculated_date": wise_score.calculated_date if wise_score else None
        },
        "key_formulas": {
            "growth_formula": vision_strategy_data,
            "lifecycle_formula": donor_lifecycle_data
        },
        "donor_churn": {
            "ratio": churn.churn_ratio if churn else 1.0,
            "status": churn.equilibrium_status if churn else "equilibrium",
            "new_donors": churn.new_donors if churn else 0,
            "reactivated": churn.reactivated_donors if churn else 0,
            "lapsed": churn.lapsed_donors if churn else 0,
            "interpretation": get_churn_interpretation(churn.churn_ratio if churn else 1.0)
        },
        "engagement_continuum": [
            {
                "phase": c.phase,
                "investment_level": c.investment_level,
                "current_investment": float(c.current_investment),
                "recommended_investment": float(c.recommended_investment),
                "roi_current": c.roi_current,
                "roi_projected": c.roi_projected,
                "donors_in_phase": c.donors_in_phase,
                "conversion_rate": c.conversion_rate
            } for c in continuum
        ],
        "multi_year_trends": multi_year_trends,
        "generated_at": datetime.utcnow()
    }


# =====================================================================
# WISE INVESTOR 2X2 QUADRANT
# =====================================================================

@router.get("/executive/wise-investor-2x2/{organization_id}")
async def get_wise_investor_quadrant(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Wise Investor 2x2 Quadrant visualization data
    
    Returns quadrant positioning and scoring details for visualization.
    Automatically calculates scores if not exists or outdated (>30 days).
    """
    verify_organization_access(current_user, organization_id)
    
    # Get or calculate score
    score = db.query(WiseInvestorScore).filter(
        WiseInvestorScore.organization_id == organization_id
    ).order_by(WiseInvestorScore.calculated_date.desc()).first()
    
    # Recalculate if older than 30 days or doesn't exist
    if not score or (datetime.utcnow() - score.calculated_date).days > 30:
        score = calculate_wise_investor_score(db, organization_id)
    
    return {
        "quadrant_data": {
            "x_axis": {
                "label": "Impact Score",
                "description": "Measures program effectiveness and mission delivery",
                "min": 0,
                "max": 100
            },
            "y_axis": {
                "label": "Sustainability Score",
                "description": "Measures financial health and operational resilience",
                "min": 0,
                "max": 100
            },
            "quadrants": {
                "top_right": {
                    "name": "Wise Investor",
                    "description": "High impact, highly sustainable organizations with strong donor engagement and diversified revenue",
                    "color": "#4CAF50",  # Green
                    "characteristics": [
                        "Strong financial reserves",
                        "Diversified revenue streams",
                        "High donor retention",
                        "Measurable impact",
                        "Excellent stewardship"
                    ]
                },
                "top_left": {
                    "name": "Growing",
                    "description": "Good sustainability but need to increase impact and program effectiveness",
                    "color": "#2196F3",  # Blue
                    "characteristics": [
                        "Financially stable",
                        "Building programs",
                        "Increasing reach",
                        "Developing metrics"
                    ]
                },
                "bottom_right": {
                    "name": "At Risk",
                    "description": "High impact but sustainability challenges - need revenue diversification",
                    "color": "#FF9800",  # Orange
                    "characteristics": [
                        "Strong programs",
                        "Grant dependent",
                        "Need individual donors",
                        "Financial vulnerability"
                    ]
                },
                "bottom_left": {
                    "name": "Struggling",
                    "description": "Challenges in both impact and sustainability - need comprehensive strategy",
                    "color": "#F44336",  # Red
                    "characteristics": [
                        "Limited resources",
                        "Unclear impact",
                        "High staff turnover",
                        "Need strategic focus"
                    ]
                }
            },
            "organization_position": {
                "x": score.x_score,
                "y": score.y_score,
                "quadrant": score.quadrant,
                "scores": {
                    "vision": score.vision_score,
                    "strategy": score.strategy_score,
                    "sustained_investment": score.sustained_investment_score,
                    "momentum": score.momentum_score,
                    "donor_engagement": score.donor_engagement_score,
                    "donor_experience": score.donor_experience_score,
                    "donor_retention": score.donor_retention_score,
                    "ltv_growth": score.ltv_growth_score
                },
                "calculated_date": score.calculated_date
            }
        }
    }


# =====================================================================
# TOTAL CASHFLOW REPORTS
# =====================================================================

@router.get("/reports/cashflow/{organization_id}")
async def get_total_income_cashflow(
    organization_id: UUID,
    years: int = Query(3, description="Number of years to compare (3, 5, or 10)", ge=2, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Total Income Cashflow Report - Monthly comparison across years
    
    Provides side-by-side monthly comparison for multiple years with:
    - Revenue, gift count, donor count per month
    - Year-to-date calculations
    - Color-coded performance indicators (green/yellow/red)
    
    Color coding:
    - Green: >10% improvement over previous year
    - Red: >10% decline from previous year
    - Yellow: Within 10% of previous year
    """
    verify_organization_access(current_user, organization_id)
    
    current_year = datetime.now().year
    start_year = current_year - years + 1
    
    # Get monthly data for each year
    monthly_data = db.query(
        extract('year', Donation.donation_date).label('year'),
        extract('month', Donation.donation_date).label('month'),
        func.sum(Donation.amount).label('revenue'),
        func.count(Donation.id).label('gift_count'),
        func.count(func.distinct(Donation.donor_id)).label('donor_count')
    ).filter(
        Donation.organization_id == organization_id,
        extract('year', Donation.donation_date) >= start_year
    ).group_by(
        extract('year', Donation.donation_date),
        extract('month', Donation.donation_date)
    ).all()
    
    # Organize data by year and month
    cashflow_matrix = {}
    
    for year in range(start_year, current_year + 1):
        cashflow_matrix[year] = {}
        ytd_revenue = 0
        ytd_gifts = 0
        ytd_donors = set()
        
        for month in range(1, 13):
            month_data = next(
                (d for d in monthly_data if d.year == year and d.month == month), 
                None
            )
            
            if month_data:
                ytd_revenue += float(month_data.revenue)
                ytd_gifts += month_data.gift_count
                
                # Determine color based on comparison to previous year
                prev_year_data = cashflow_matrix.get(year - 1, {}).get(month, {})
                if prev_year_data and prev_year_data.get('revenue', 0) > 0:
                    variance = (float(month_data.revenue) - prev_year_data['revenue']) / prev_year_data['revenue']
                    if variance > 0.1:
                        color = 'green'
                    elif variance < -0.1:
                        color = 'red'
                    else:
                        color = 'yellow'
                else:
                    color = 'neutral'
                
                cashflow_matrix[year][month] = {
                    'revenue': float(month_data.revenue),
                    'gift_count': month_data.gift_count,
                    'donor_count': month_data.donor_count,
                    'avg_gift': float(month_data.revenue) / month_data.gift_count if month_data.gift_count > 0 else 0,
                    'ytd_revenue': ytd_revenue,
                    'ytd_gifts': ytd_gifts,
                    'ytd_donors': month_data.donor_count,  # Simplified
                    'color': color
                }
            else:
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
    
    return {
        "organization_id": str(organization_id),
        "cashflow_data": cashflow_matrix,
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "years_included": list(range(start_year, current_year + 1)),
        "generated_at": datetime.utcnow()
    }


# =====================================================================
# DONOR CHURN RATIO
# =====================================================================

@router.get("/reports/donor-churn/{organization_id}")
async def get_donor_churn_ratio(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    In vs Out Donor Churn statistic
    
    Formula: (new donors + reactivated donors) / lapsed donors
    
    Interpretation:
    - 1.0 = equilibrium (balanced donor base)
    - >1.0 = growing (gaining more than losing)
    - <1.0 = declining (losing more than gaining)
    
    Calculates for trailing 12 months and saves to database.
    """
    verify_organization_access(current_user, organization_id)
    
    # Calculate for trailing 12 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    # Get new donors (first gift in period, no gifts before)
    new_donors_subquery = db.query(Donation.donor_id).filter(
        Donation.donation_date < start_date
    ).subquery()
    
    new_donors = db.query(func.count(func.distinct(Donor.id))).join(Donation).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date.between(start_date, end_date),
        ~Donor.id.in_(new_donors_subquery)
    ).scalar() or 0
    
    # Get reactivated donors (gave in period after 12+ month lapse)
    previous_period_start = start_date - timedelta(days=730)
    previous_period_end = start_date - timedelta(days=365)
    
    previous_donors_subquery = db.query(Donation.donor_id).filter(
        Donation.donation_date.between(previous_period_start, previous_period_end)
    ).subquery()
    
    reactivated_donors = db.query(func.count(func.distinct(Donor.id))).join(Donation).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date.between(start_date, end_date),
        Donor.id.in_(previous_donors_subquery)
    ).scalar() or 0
    
    # Get lapsed donors (gave in previous period but not in current period)
    current_donors_subquery = db.query(Donation.donor_id).filter(
        Donation.donation_date.between(start_date, end_date)
    ).subquery()
    
    lapsed_donors = db.query(func.count(func.distinct(Donor.id))).join(Donation).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date.between(previous_period_end, start_date),
        ~Donor.id.in_(current_donors_subquery)
    ).scalar() or 1  # Avoid division by zero
    
    # Calculate churn ratio
    churn_ratio = (new_donors + reactivated_donors) / lapsed_donors if lapsed_donors > 0 else 1.0
    
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
        period_start=start_date.date(),
        period_end=end_date.date(),
        new_donors=new_donors,
        reactivated_donors=reactivated_donors,
        lapsed_donors=lapsed_donors,
        churn_ratio=churn_ratio,
        equilibrium_status=equilibrium_status,
        trailing_12_months=True
    )
    db.add(churn_metric)
    db.commit()
    
    return {
        "organization_id": str(organization_id),
        "churn_ratio": round(churn_ratio, 2),
        "status": equilibrium_status,
        "metrics": {
            "new_donors": new_donors,
            "reactivated_donors": reactivated_donors,
            "lapsed_donors": lapsed_donors,
            "total_in": new_donors + reactivated_donors,
            "net_change": (new_donors + reactivated_donors) - lapsed_donors
        },
        "period": {
            "start": start_date.date(),
            "end": end_date.date(),
            "description": "trailing_12_months"
        },
        "interpretation": get_churn_interpretation(churn_ratio),
        "benchmarks": {
            "excellent": ">1.5",
            "good": "1.1-1.5",
            "equilibrium": "0.9-1.1",
            "concerning": "0.7-0.9",
            "critical": "<0.7"
        }
    }


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

def calculate_wise_investor_score(db: Session, organization_id: UUID) -> WiseInvestorScore:
    """
    Calculate Wise Investor Score components
    
    This is a simplified calculation. In production, you would use more
    sophisticated algorithms considering:
    - Financial ratios and reserves
    - Donor retention trends
    - Revenue diversity (Herfindahl index)
    - Program impact metrics
    - Strategic planning documentation
    """
    # Get organization metrics
    current_year = datetime.now().year
    year_start = datetime(current_year, 1, 1)
    
    # Calculate donor retention (for sustainability)
    last_year_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        extract('year', Donation.donation_date) == current_year - 1
    ).scalar() or 1
    
    retained_donors = db.query(func.count(func.distinct(Donation.donor_id))).filter(
        Donation.organization_id == organization_id,
        Donation.donation_date >= year_start,
        Donation.donor_id.in_(
            db.query(Donation.donor_id).filter(
                Donation.organization_id == organization_id,
                extract('year', Donation.donation_date) == current_year - 1
            )
        )
    ).scalar() or 0
    
    retention_rate = (retained_donors / last_year_donors) * 100 if last_year_donors > 0 else 0
    
    # Calculate revenue growth (for momentum)
    current_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        extract('year', Donation.donation_date) == current_year
    ).scalar() or 0
    
    last_year_revenue = db.query(func.sum(Donation.amount)).filter(
        Donation.organization_id == organization_id,
        extract('year', Donation.donation_date) == current_year - 1
    ).scalar() or 1
    
    revenue_growth = ((float(current_revenue) - float(last_year_revenue)) / float(last_year_revenue)) * 100
    
    # Simplified scoring (0-100 scale)
    # In production, use weighted algorithms
    vision_score = min(70 + (retention_rate * 0.3), 100)  # Higher retention = clearer vision
    strategy_score = min(60 + (revenue_growth if revenue_growth > 0 else 0), 100)
    sustained_investment_score = min(retention_rate, 100)  # Retention indicates investment
    momentum_score = min(50 + revenue_growth, 100) if revenue_growth > 0 else 50
    
    g4s2f_composite = (vision_score + strategy_score + sustained_investment_score + momentum_score) / 4
    
    # Donor lifecycle scores
    donor_engagement_score = min(retention_rate, 100)
    donor_experience_score = min(70 + (retention_rate * 0.3), 100)
    donor_retention_score = retention_rate
    ltv_growth_score = min(50 + revenue_growth, 100) if revenue_growth > 0 else 50
    
    # Calculate X and Y positions for quadrant
    x_score = g4s2f_composite  # Impact Score
    y_score = (donor_retention_score + donor_engagement_score) / 2  # Sustainability Score
    
    # Determine quadrant
    if x_score >= 50 and y_score >= 50:
        quadrant = "Wise Investor"
    elif x_score < 50 and y_score >= 50:
        quadrant = "Growing"
    elif x_score >= 50 and y_score < 50:
        quadrant = "At Risk"
    else:
        quadrant = "Struggling"
    
    # Create and save score
    score = WiseInvestorScore(
        organization_id=organization_id,
        quadrant=quadrant,
        x_score=x_score,
        y_score=y_score,
        vision_score=vision_score,
        strategy_score=strategy_score,
        sustained_investment_score=sustained_investment_score,
        momentum_score=momentum_score,
        g4s2f_composite_score=g4s2f_composite,
        donor_engagement_score=donor_engagement_score,
        donor_experience_score=donor_experience_score,
        donor_retention_score=donor_retention_score,
        ltv_growth_score=ltv_growth_score,
        notes={
            "description": f"Positioned in {quadrant} quadrant",
            "retention_rate": f"{retention_rate:.1f}%",
            "revenue_growth": f"{revenue_growth:.1f}%"
        }
    )
    
    db.add(score)
    db.commit()
    db.refresh(score)
    
    return score


def get_churn_interpretation(churn_ratio: float) -> str:
    """Get human-readable interpretation of churn ratio"""
    if churn_ratio > 1.5:
        return "Excellent - Rapidly growing donor base with strong acquisition"
    elif churn_ratio > 1.1:
        return "Good - Growing donor base, gaining more than losing"
    elif churn_ratio >= 0.9:
        return "Equilibrium - Stable donor base, balanced acquisition and attrition"
    elif churn_ratio >= 0.7:
        return "Concerning - Losing more donors than gaining, focus on retention"
    else:
        return "Critical - Significant donor attrition, immediate action needed"
