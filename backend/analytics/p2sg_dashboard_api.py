"""
P2SG Executive Dashboard Analytics API
Wise Investor Platform

Add these endpoints to your analytics.py file or create a new router file.
These implement Bob's P2SG Framework with complete analytics.

Dependencies:
- FastAPI
- SQLAlchemy
- Your existing auth system (get_current_user, verify_organization_access)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import  WiseInvestorScore, DonorChurnMetrics, DonorEngagementContinuum
from models import (
    Organizations, Donors, Donations

)
# Import your existing auth functions
# from your_auth_module import get_current_user, verify_organization_access

router = APIRouter(prefix="/api/v1/analytics", tags=["P2SG Executive Dashboard"])


# ============================================================================
# P2SG EXECUTIVE DASHBOARD - ONE-PAGE COMPREHENSIVE VIEW
# ============================================================================

@router.get("/executive/p2sg-dashboard/{organization_id}")
async def get_p2sg_executive_dashboard(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)  # Add your User type
):
    """
    P2SG Executive Dashboard - One-Page Comprehensive View
    Implements Bob's 9/20/25 email specifications
    
    Returns:
    - Wise Investor 2x2 quadrant position
    - Key formulas: V+S+SI+M = G4S2F and ^DE + ^DX -> ^DR->^LTV
    - Donor churn metrics (In vs Out ratio)
    - Engagement continuum analysis
    - Multi-year trends (3, 5, 10 years)
    """
    verify_organization_access(current_user, organization_id)

    # Get or calculate Wise Investor Score
    wise_score = db.query(WiseInvestorScore).filter(
        WiseInvestorScore.organization_id == organization_id
    ).order_by(WiseInvestorScore.calculated_date.desc()).first()

    # If no score exists, calculate it
    if not wise_score:
        wise_score = calculate_wise_investor_score(db, organization_id)

    # Build Vision + Strategy + Sustained Investment + Momentum = G4S2F data
    vision_strategy_data = {
        "formula": "V+S+SI+M = G4S2F",
        "description": "Vision + Strategy + Sustained Investment + Momentum = Growth for Sure & Sustainable Future",
        "components": {
            "vision": float(wise_score.vision_score) if wise_score else 0,
            "strategy": float(wise_score.strategy_score) if wise_score else 0,
            "sustained_investment": float(wise_score.sustained_investment_score) if wise_score else 0,
            "momentum": float(wise_score.momentum_score) if wise_score else 0,
            "g4s2f_score": float(wise_score.g4s2f_composite_score) if wise_score else 0
        }
    }

    # Build ^DE + ^DX -> ^DR->^LTV data
    donor_lifecycle_data = {
        "formula": "^DE + ^DX -> ^DR->^LTV->^Revenue & Impact",
        "description": "Donor Engagement + Experience leads to Retention, Lifetime Value, Revenue & Impact",
        "components": {
            "donor_engagement": float(wise_score.donor_engagement_score) if wise_score else 0,
            "donor_experience": float(wise_score.donor_experience_score) if wise_score else 0,
            "donor_retention": float(wise_score.donor_retention_score) if wise_score else 0,
            "ltv_growth": float(wise_score.ltv_growth_score) if wise_score else 0
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
            extract('year', Donations.donation_date).label('year'),
            func.sum(Donations.amount).label('revenue'),
            func.count(func.distinct(Donations.donor_id)).label('donors'),
            func.count(Donations.id).label('gifts')
        ).filter(
            Donations.organization_id == organization_id,
            extract('year', Donations.donation_date) >= start_year
        ).group_by(extract('year', Donations.donation_date)).all()

        multi_year_trends.append({
            "period": f"{years_back}_year",
            "data": [
                {
                    "year": int(d.year),
                    "revenue": float(d.revenue) if d.revenue else 0,
                    "donors": d.donors,
                    "gifts": d.gifts
                } for d in yearly_data
            ]
        })

    return {
        "wise_investor_quadrant": {
            "quadrant": wise_score.quadrant if wise_score else "Not Calculated",
            "x_position": float(wise_score.x_score) if wise_score else 50,
            "y_position": float(wise_score.y_score) if wise_score else 50,
            "hover_description": wise_score.notes if wise_score else {}
        },
        "key_formulas": {
            "growth_formula": vision_strategy_data,
            "lifecycle_formula": donor_lifecycle_data
        },
        "donor_churn": {
            "ratio": float(churn.churn_ratio) if churn else 1.0,
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
                "roi_current": float(c.roi_current),
                "roi_projected": float(c.roi_projected),
                "donors_in_phase": c.donors_in_phase,
                "conversion_rate": float(c.conversion_rate)
            } for c in continuum
        ],
        "multi_year_trends": multi_year_trends,
        "generated_at": datetime.utcnow().isoformat()
    }


# ============================================================================
# WISE INVESTOR 2x2 QUADRANT VISUALIZATION
# ============================================================================

@router.get("/executive/wise-investor-2x2/{organization_id}")
async def get_wise_investor_quadrant(
        organization_id: UUID,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user)
):
    """
    Wise Investor 2x2 Quadrant Visualization Data
    
    Returns positioning data for the 2x2 matrix:
    - X-axis: Impact Score (0-100)
    - Y-axis: Sustainability Score (0-100)
    
    Quadrants:
    - Top Right: Wise Investor (high impact, high sustainability)
    - Top Left: Growing (good sustainability, needs more impact)
    - Bottom Right: At Risk (high impact, sustainability challenges)
    - Bottom Left: Struggling (challenges in both areas)
    """
    verify_organization_access(current_user, organization_id)

    # Calculate or retrieve current score
    score = db.query(WiseInvestorScore).filter(
        WiseInvestorScore.organization_id == organization_id
    ).order_by(WiseInvestorScore.calculated_date.desc()).first()

    if not score:
        score = calculate_wise_investor_score(db, organization_id)

    return {
        "quadrant_data": {
            "x_axis": {
                "label": "Impact Score",
                "description": "Program effectiveness and mission delivery",
                "min": 0,
                "max": 100
            },
            "y_axis": {
                "label": "Sustainability Score",
                "description": "Financial health and donor engagement",
                "min": 0,
                "max": 100
            },
            "quadrants": {
                "top_right": {
                    "name": "Wise Investor",
                    "description": "High impact, highly sustainable organizations with strong donor engagement and diversified revenue",
                    "color": "#4CAF50",
                    "recommendations": [
                        "Maintain excellence in both program delivery and fundraising",
                        "Focus on scaling impact while preserving sustainability",
                        "Share best practices with sector"
                    ]
                },
                "top_left": {
                    "name": "Growing",
                    "description": "Good sustainability but need to increase impact and program effectiveness",
                    "color": "#2196F3",
                    "recommendations": [
                        "Invest in program development and impact measurement",
                        "Strengthen program outcomes while maintaining financial health",
                        "Expand mission delivery capacity"
                    ]
                },
                "bottom_right": {
                    "name": "At Risk",
                    "description": "High impact but sustainability challenges - need revenue diversification",
                    "color": "#FF9800",
                    "recommendations": [
                        "Diversify revenue streams urgently",
                        "Strengthen donor retention programs",
                        "Build sustainable fundraising infrastructure"
                    ]
                },
                "bottom_left": {
                    "name": "Struggling",
                    "description": "Challenges in both impact and sustainability - need comprehensive strategy",
                    "color": "#F44336",
                    "recommendations": [
                        "Develop comprehensive turnaround strategy",
                        "Focus on quick wins in both program and fundraising",
                        "Consider strategic partnerships or mergers"
                    ]
                }
            },
            "organization_position": {
                "x": float(score.x_score),
                "y": float(score.y_score),
                "quadrant": score.quadrant,
                "scores": {
                    "vision": float(score.vision_score),
                    "strategy": float(score.strategy_score),
                    "sustained_investment": float(score.sustained_investment_score),
                    "momentum": float(score.momentum_score),
                    "donor_engagement": float(score.donor_engagement_score),
                    "donor_experience": float(score.donor_experience_score),
                    "donor_retention": float(score.donor_retention_score),
                    "ltv_growth": float(score.ltv_growth_score)
                }
            }
        }
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_wise_investor_score(db: Session, organization_id: UUID) -> WiseInvestorScore:
    """
    Calculate Wise Investor Score based on organizational metrics
    
    Impact Score (X-axis) components:
    - Program effectiveness
    - Beneficiary outcomes
    - Mission delivery
    
    Sustainability Score (Y-axis) components:
    - Donor retention rate
    - Revenue diversification
    - Financial health
    """
    # Get organization data
    current_year = datetime.now().year

    # Calculate donor retention (for sustainability)
    total_donors_last_year = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year - 1
    ).scalar() or 1

    retained_donors = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year,
        Donations.donor_id.in_(
            db.query(Donations.donor_id).filter(
                Donations.organization_id == organization_id,
                extract('year', Donations.donation_date) == current_year - 1
            )
        )
    ).scalar() or 0

    retention_rate = float((retained_donors / total_donors_last_year) * 100)

    # Calculate revenue growth (for momentum)
    revenue_current = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year
    ).scalar() or 0

    revenue_last_year = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year - 1
    ).scalar() or 1

    # Convert Decimal to float to avoid type errors in calculations
    revenue_current = float(revenue_current) if revenue_current else 0.0
    revenue_last_year = float(revenue_last_year) if revenue_last_year else 1.0
    revenue_growth = ((revenue_current - revenue_last_year) / revenue_last_year) * 100 if revenue_last_year > 0 else 0.0

    # Component scores (simplified - you can enhance these)
    vision_score = min(75.0, max(25.0, 50.0 + (revenue_growth / 2)))  # Based on growth trajectory
    strategy_score = min(80.0, max(30.0, retention_rate * 0.8))  # Based on retention
    sustained_investment_score = 65.0  # Placeholder - can be calculated from expense ratios
    momentum_score = min(85.0, max(20.0, 50.0 + revenue_growth))  # Based on growth

    donor_engagement_score = min(90.0, max(25.0, retention_rate * 0.9))
    donor_experience_score = 70.0  # Placeholder - can be from surveys
    donor_retention_score = retention_rate
    ltv_growth_score = min(80.0, max(30.0, 50.0 + (revenue_growth / 2)))

    # Composite scores
    g4s2f_composite = (vision_score + strategy_score + sustained_investment_score + momentum_score) / 4

    # Calculate X and Y positions
    impact_score = (vision_score + strategy_score + sustained_investment_score + momentum_score) / 4
    sustainability_score = (donor_engagement_score + donor_experience_score + donor_retention_score + ltv_growth_score) / 4

    # Determine quadrant
    if impact_score >= 60 and sustainability_score >= 60:
        quadrant = "Wise Investor"
    elif impact_score < 60 and sustainability_score >= 60:
        quadrant = "Growing"
    elif impact_score >= 60 and sustainability_score < 60:
        quadrant = "At Risk"
    else:
        quadrant = "Struggling"

    # Create and save score
    score = WiseInvestorScore(
        organization_id=organization_id,
        quadrant=quadrant,
        x_score=impact_score,
        y_score=sustainability_score,
        vision_score=vision_score,
        strategy_score=strategy_score,
        sustained_investment_score=sustained_investment_score,
        momentum_score=momentum_score,
        g4s2f_composite_score=g4s2f_composite,
        donor_engagement_score=donor_engagement_score,
        donor_experience_score=donor_experience_score,
        donor_retention_score=donor_retention_score,
        ltv_growth_score=ltv_growth_score,
        calculated_date=datetime.utcnow(),
        notes={
            "calculation_method": "Automated scoring based on retention, growth, and engagement metrics",
            "retention_rate": float(retention_rate),
            "revenue_growth": float(revenue_growth)
        }
    )

    db.add(score)
    db.commit()
    db.refresh(score)

    return score


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