"""
Golden Triangle & What-If Scenarios Analytics API
Wise Investor Platform

These endpoints provide:
- Golden Triangle analysis (Traffic × Conversion × Avg Gift = Revenue)
- What-If scenario modeling for 5-year projections
- Staffing analysis and recommendations

Add to your analytics.py or create a new extra analytics router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel

from analytics.analytics import get_current_user, verify_organization_access
from database import get_db
from models import Organizations, Donations
from models import (
    GoldenTriangle, WhatIfScenarios, StaffingAnalysis
)

router = APIRouter(prefix="/api/v1/analytics", tags=["Scenarios & Digital"])


# ============================================================================
# PYDANTIC MODELS FOR REQUEST/RESPONSE
# ============================================================================

class WhatIfInvestment(BaseModel):
    year_1: float = 0
    year_2: float = 0
    year_3: float = 0
    year_4: float = 0
    year_5: float = 0


class WhatIfScenarioCreate(BaseModel):
    scenario_name: str
    scenario_type: str  # "donor_acquisition", "major_gifts", "digital", etc.
    investments: WhatIfInvestment


# ============================================================================
# GOLDEN TRIANGLE ANALYSIS
# ============================================================================

@router.get("/digital/golden-triangle/{organization_id}")
async def get_golden_triangle_analysis(
    organization_id: UUID,
    period_days: int = Query(30, description="Analysis period in days", ge=7, le=365),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Golden Triangle Analysis for Online Revenue Optimization
    
    Formula: Traffic × Conversion Rate × Average Gift = Revenue
    
    Provides:
    - Current metrics for the period
    - What-if scenarios with varying improvements
    - Recommendations for optimization
    
    Note: Traffic data requires integration with web analytics (Google Analytics, etc.)
    For now, this uses placeholder traffic data and focuses on conversion/gift metrics
    from your actual donation data.
    
    Args:
        organization_id: Organization UUID
        period_days: Number of days to analyze (default 30)
    """
    verify_organization_access(current_user, organization_id)
    
    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)
    
    # Get online donation metrics
    # Note: This assumes you have a 'channel' field to identify online donations
    online_donations = db.query(
        func.count(Donations.id).label('conversions'),
        func.sum(Donations.amount).label('revenue'),
        func.avg(Donations.amount).label('avg_gift')
    ).filter(
        Donations.organization_id == organization_id,
        Donations.donation_date >= start_date,
        Donations.donation_date <= end_date,
        # Uncomment when you have channel tracking:
        # Donations.channel == 'online'
    ).first()
    
    # Placeholder traffic (you should integrate with Google Analytics)
    # For now, estimate based on conversion
    estimated_traffic = (online_donations.conversions or 1) * 50  # Assume 2% conversion
    
    current_traffic = estimated_traffic
    current_conversions = online_donations.conversions or 0
    current_conversion_rate = (current_conversions / current_traffic) * 100 if current_traffic > 0 else 0
    current_avg_gift = float(online_donations.avg_gift) if online_donations.avg_gift else 0
    current_revenue = float(online_donations.revenue) if online_donations.revenue else 0
    
    # Generate what-if scenarios
    scenarios = []
    improvement_levels = [0, 10, 25, 50]  # % improvements
    
    for traffic_increase in improvement_levels:
        for conversion_increase in improvement_levels:
            for avg_gift_increase in improvement_levels:
                new_traffic = current_traffic * (1 + traffic_increase / 100)
                new_conversion_rate = current_conversion_rate * (1 + conversion_increase / 100)
                new_avg_gift = current_avg_gift * (1 + avg_gift_increase / 100)
                new_revenue = new_traffic * (new_conversion_rate / 100) * new_avg_gift
                
                scenarios.append({
                    "traffic_increase_pct": traffic_increase,
                    "conversion_increase_pct": conversion_increase,
                    "avg_gift_increase_pct": avg_gift_increase,
                    "projected_revenue": round(new_revenue, 2),
                    "revenue_increase": round(new_revenue - current_revenue, 2),
                    "revenue_increase_pct": round(
                        ((new_revenue - current_revenue) / current_revenue * 100) if current_revenue > 0 else 0,
                        2
                    )
                })
    
    # Sort by projected revenue
    scenarios.sort(key=lambda x: x["projected_revenue"], reverse=True)
    
    # Save current metrics
    golden_triangle_record = GoldenTriangle(
        organization_id=organization_id,
        period_start=start_date,
        period_end=end_date,
        traffic=current_traffic,
        conversion_rate=current_conversion_rate,
        average_gift=current_avg_gift,
        online_revenue=current_revenue
    )
    db.add(golden_triangle_record)
    db.commit()
    
    return {
        "current_metrics": {
            "traffic": current_traffic,
            "conversions": current_conversions,
            "conversion_rate_pct": round(current_conversion_rate, 2),
            "average_gift": round(current_avg_gift, 2),
            "online_revenue": round(current_revenue, 2)
        },
        "golden_triangle_formula": "Traffic × Conversion Rate × Average Gift = Revenue",
        "what_if_scenarios": scenarios[:20],  # Top 20 scenarios
        "recommendations": generate_golden_triangle_recommendations(
            current_conversion_rate, 
            current_avg_gift,
            current_traffic
        ),
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": period_days
        },
        "note": "Traffic data is estimated. Integrate with Google Analytics for accurate metrics."
    }


# ============================================================================
# WHAT-IF SCENARIO ANALYSIS
# ============================================================================

@router.post("/whatif/scenario/{organization_id}")
async def create_whatif_scenario(
    organization_id: UUID,
    scenario: WhatIfScenarioCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create and Calculate What-If Scenario for 5-Year Projections
    
    Scenario Types:
    - donor_acquisition: New donor acquisition campaigns
    - major_gifts: Major gift officer hiring
    - digital: Digital marketing expansion
    - events: Event-based fundraising
    - monthly_giving: Monthly donor program
    
    Returns 5-year projections with:
    - Year-by-year ROI
    - Net revenue
    - Donor count
    - Average LTV
    - Breakeven point
    
    Args:
        organization_id: Organization UUID
        scenario: Scenario details with investments
    """
    verify_organization_access(current_user, organization_id)
    
    # Get current organizational metrics
    current_year = datetime.now().year
    
    current_revenue = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year
    ).scalar() or 0
    
    current_donors = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year
    ).scalar() or 0
    
    # Calculate projections
    projections = calculate_scenario_projections(
        scenario.scenario_type,
        {
            "year_1": scenario.investments.year_1,
            "year_2": scenario.investments.year_2,
            "year_3": scenario.investments.year_3,
            "year_4": scenario.investments.year_4,
            "year_5": scenario.investments.year_5
        },
        float(current_revenue),
        current_donors
    )
    
    # Save scenario
    whatif_scenario = WhatIfScenarios(
        organization_id=organization_id,
        scenario_name=scenario.scenario_name,
        scenario_type=scenario.scenario_type,
        year_1_investment=scenario.investments.year_1,
        year_2_investment=scenario.investments.year_2,
        year_3_investment=scenario.investments.year_3,
        year_4_investment=scenario.investments.year_4,
        year_5_investment=scenario.investments.year_5,
        projected_roi=projections["roi"],
        projected_net_revenue=projections["net_revenue"],
        projected_donor_count=projections["donor_count"],
        projected_avg_ltv=projections["avg_ltv"],
        breakeven_month=projections["breakeven_month"],
        assumptions=projections["assumptions"],
        created_by=current_user.id
    )
    
    db.add(whatif_scenario)
    db.commit()
    db.refresh(whatif_scenario)
    
    return {
        "scenario_id": str(whatif_scenario.id),
        "scenario_name": scenario.scenario_name,
        "scenario_type": scenario.scenario_type,
        "projections": projections,
        "visualization_data": format_scenario_for_charts(projections),
        "summary": {
            "total_investment": sum([
                scenario.investments.year_1,
                scenario.investments.year_2,
                scenario.investments.year_3,
                scenario.investments.year_4,
                scenario.investments.year_5
            ]),
            "total_projected_return": sum(projections["net_revenue"].values()),
            "breakeven_year": (projections["breakeven_month"] // 12) + 1 if projections["breakeven_month"] else None,
            "5_year_roi": projections["roi"].get("year_5", 0)
        }
    }


@router.get("/whatif/scenarios/{organization_id}")
async def get_whatif_scenarios(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all what-if scenarios for an organization"""
    verify_organization_access(current_user, organization_id)
    
    scenarios = db.query(WhatIfScenarios).filter(
        WhatIfScenarios.organization_id == organization_id
    ).order_by(WhatIfScenarios.created_at.desc()).all()
    
    return {
        "scenarios": [
            {
                "id": str(s.id),
                "name": s.scenario_name,
                "type": s.scenario_type,
                "total_investment": sum([
                    float(s.year_1_investment or 0),
                    float(s.year_2_investment or 0),
                    float(s.year_3_investment or 0),
                    float(s.year_4_investment or 0),
                    float(s.year_5_investment or 0)
                ]),
                "breakeven_month": s.breakeven_month,
                "created_at": s.created_at.isoformat()
            }
            for s in scenarios
        ]
    }


# ============================================================================
# STAFFING ANALYSIS
# ============================================================================

@router.get("/staffing/analysis/{organization_id}")
async def get_staffing_recommendations(
    organization_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    AI-Driven Staffing Analysis and Recommendations
    
    Analyzes current revenue and donor base to recommend optimal staffing levels
    based on industry benchmarks.
    
    Industry Benchmarks:
    - Frontline Fundraisers: 2 per $1M raised, 150 donors per staff
    - Donor Relations: 1 per $1M, 500 donors per staff
    - Gift Processing: 0.5 per $1M, 1000 donors per staff
    - Research: 0.5 per $1M, 2000 donors per staff
    - Communications: 1 per $1M, 1000 donors per staff
    """
    verify_organization_access(current_user, organization_id)
    
    # Get current metrics
    current_year = datetime.now().year
    
    total_revenue = db.query(func.sum(Donations.amount)).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year
    ).scalar() or 0
    
    total_donors = db.query(func.count(func.distinct(Donations.donor_id))).filter(
        Donations.organization_id == organization_id,
        extract('year', Donations.donation_date) == current_year
    ).scalar() or 0
    
    # Industry benchmarks
    benchmarks = {
        "frontline_fundraisers": {
            "ratio_per_million": 2,
            "donors_per_staff": 150,
            "description": "Major gift officers and frontline fundraisers",
            "revenue_per_staff": 500000
        },
        "donor_relations": {
            "ratio_per_million": 1,
            "donors_per_staff": 500,
            "description": "Stewardship and donor relations team",
            "revenue_per_staff": 200000
        },
        "gift_processing": {
            "ratio_per_million": 0.5,
            "donors_per_staff": 1000,
            "description": "Gift entry and acknowledgment team",
            "revenue_per_staff": 100000
        },
        "prospect_research": {
            "ratio_per_million": 0.5,
            "donors_per_staff": 2000,
            "description": "Research and analytics team",
            "revenue_per_staff": 150000
        },
        "communications": {
            "ratio_per_million": 1,
            "donors_per_staff": 1000,
            "description": "Marketing and communications team",
            "revenue_per_staff": 200000
        }
    }
    
    recommendations = []
    total_gap = 0
    total_opportunity = 0
    
    for dept, benchmark in benchmarks.items():
        # Calculate recommended staff
        recommended_by_revenue = (float(total_revenue) / 1000000) * benchmark["ratio_per_million"]
        recommended_by_donors = total_donors / benchmark["donors_per_staff"] if total_donors > 0 else 0
        recommended_staff = max(recommended_by_revenue, recommended_by_donors)
        
        # Current staff (placeholder - should come from actual data)
        current_staff = 1  # You should track actual staff in your database
        
        gap = recommended_staff - current_staff
        revenue_opportunity = gap * benchmark["revenue_per_staff"]
        
        if gap > 0:
            total_gap += gap
            total_opportunity += revenue_opportunity
            
            # Save analysis
            analysis = StaffingAnalysis(
                organization_id=organization_id,
                department=dept,
                current_staff_count=current_staff,
                recommended_staff_count=int(recommended_staff),
                gap_analysis=int(gap),
                revenue_opportunity=revenue_opportunity,
                ai_recommendation=f"Add {int(gap)} {dept.replace('_', ' ')} to capture ${revenue_opportunity:,.0f} opportunity",
                priority_level=1 if gap > 2 else 2 if gap > 1 else 3
            )
            db.add(analysis)
        
        recommendations.append({
            "department": dept,
            "description": benchmark["description"],
            "current_staff": current_staff,
            "recommended_staff": round(recommended_staff, 1),
            "gap": round(gap, 1),
            "priority": "High" if gap > 2 else "Medium" if gap > 1 else "Low",
            "revenue_opportunity": round(revenue_opportunity, 2),
            "rationale": f"Based on ${total_revenue:,.0f} revenue and {total_donors:,} donors"
        })
    
    db.commit()
    
    # Sort by gap (highest priority first)
    recommendations.sort(key=lambda x: x["gap"], reverse=True)
    
    return {
        "organization_metrics": {
            "total_revenue": float(total_revenue),
            "total_donors": total_donors,
            "revenue_per_donor": float(total_revenue) / total_donors if total_donors > 0 else 0
        },
        "staffing_recommendations": recommendations,
        "summary": {
            "total_staffing_gap": round(total_gap, 1),
            "total_revenue_opportunity": round(total_opportunity, 2),
            "roi_estimate": f"{(total_opportunity / (total_gap * 75000) * 100):.0f}%" if total_gap > 0 else "N/A",
            "avg_cost_per_position": 75000
        }
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_scenario_projections(
    scenario_type: str,
    investments: Dict[str, float],
    current_revenue: float,
    current_donors: int
) -> Dict[str, Any]:
    """Calculate detailed projections for what-if scenarios"""
    
    projections = {
        "roi": {},
        "net_revenue": {},
        "donor_count": {},
        "avg_ltv": {},
        "breakeven_month": None,
        "assumptions": {}
    }
    
    cumulative_investment = 0
    cumulative_return = 0
    
    for year in range(1, 6):
        investment = investments.get(f"year_{year}", 0)
        cumulative_investment += investment
        
        if scenario_type == "donor_acquisition":
            # Acquisition cost decreases with scale
            cost_per_donor = max(50 - (year * 5), 25)
            new_donors = investment / cost_per_donor if cost_per_donor > 0 else 0
            avg_gift = 75 * (1 + year * 0.1)  # Gift size increases
            year_return = new_donors * avg_gift * 2  # 2 gifts per year average
            
            projections["assumptions"] = {
                "cost_per_donor": cost_per_donor,
                "retention_rate": 0.6,
                "gifts_per_year": 2
            }
            
        elif scenario_type == "major_gifts":
            # MGO can manage 150 donors, raise $1M+
            mgos_hired = investment / 100000  # $100k per MGO
            year_return = mgos_hired * 1000000  # $1M per MGO
            new_donors = mgos_hired * 150
            
            projections["assumptions"] = {
                "mgo_salary": 100000,
                "revenue_per_mgo": 1000000,
                "donors_per_mgo": 150
            }
            
        else:  # default/digital
            # Digital campaigns
            roi_multiplier = 3 + (year * 0.5)  # ROI improves over time
            year_return = investment * roi_multiplier
            new_donors = investment / 50  # $50 acquisition cost
            
            projections["assumptions"] = {
                "roi_multiplier": roi_multiplier,
                "acquisition_cost": 50
            }
        
        cumulative_return += year_return
        net_revenue = cumulative_return - cumulative_investment
        
        # Calculate metrics
        projections["roi"][f"year_{year}"] = round(
            (year_return / investment - 1) * 100 if investment > 0 else 0,
            2
        )
        projections["net_revenue"][f"year_{year}"] = round(net_revenue, 2)
        projections["donor_count"][f"year_{year}"] = round(current_donors + new_donors * year)
        projections["avg_ltv"][f"year_{year}"] = round(
            cumulative_return / (new_donors * year) if new_donors > 0 else 0,
            2
        )
        
        # Check for breakeven
        if net_revenue >= 0 and projections["breakeven_month"] is None:
            projections["breakeven_month"] = year * 12
    
    return projections


def format_scenario_for_charts(projections: Dict[str, Any]) -> Dict[str, Any]:
    """Format projections for visualization"""
    return {
        "line_charts": {
            "net_revenue": [
                {"year": i, "value": projections["net_revenue"].get(f"year_{i}", 0)}
                for i in range(1, 6)
            ],
            "donor_growth": [
                {"year": i, "value": projections["donor_count"].get(f"year_{i}", 0)}
                for i in range(1, 6)
            ]
        },
        "bar_charts": {
            "roi_by_year": [
                {"year": f"Year {i}", "roi": projections["roi"].get(f"year_{i}", 0)}
                for i in range(1, 6)
            ]
        }
    }


def generate_golden_triangle_recommendations(
    conversion_rate: float,
    avg_gift: float,
    traffic: int
) -> List[Dict[str, str]]:
    """Generate AI-driven recommendations for Golden Triangle optimization"""
    recommendations = []
    
    if conversion_rate < 2:
        recommendations.append({
            "area": "Conversion Rate",
            "priority": "High",
            "suggestion": "Your conversion rate is below industry average (2-3%). Consider A/B testing donation forms, reducing friction, and adding trust signals.",
            "potential_impact": "Improving to 2.5% could increase revenue by 25%+"
        })
    
    if avg_gift < 75:
        recommendations.append({
            "area": "Average Gift",
            "priority": "Medium",
            "suggestion": "Consider implementing suggested giving amounts, monthly giving options, or matching gift campaigns to increase average gift size.",
            "potential_impact": "Increasing avg gift by $25 could add significant revenue"
        })
    
    if traffic < 1000:
        recommendations.append({
            "area": "Traffic",
            "priority": "Medium",
            "suggestion": "Invest in SEO, Google Ad Grants, and social media to increase qualified traffic to donation pages.",
            "potential_impact": "Doubling traffic could double revenue with same conversion"
        })
    else:
        recommendations.append({
            "area": "Traffic",
            "priority": "Low",
            "suggestion": "Good traffic volume. Focus on conversion optimization to maximize existing visitors.",
            "potential_impact": "Better to improve conversion than add more traffic"
        })
    
    return recommendations
