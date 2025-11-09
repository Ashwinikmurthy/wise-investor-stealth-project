# analytics_backup.py - Comprehensive Organizational Analytics
"""
Complete Analytics API endpoints for organizational dashboard including:
- Mission/Vision, SWOT, Lifecycle, Fundraising, Revenue, Program Impact
- Digital KPIs, Strategic Initiatives
- Donor Lifecycle Analytics (Segmentation, Movement, LTV)
- Advanced Lifecycle Analytics (Churn Risk, Cohorts)
- Missional Impact Correlation
- WiseInvestor 2x2 Matrix
- Legacy/Planned Giving Pipeline
- Upgrade Readiness Scoring
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from database import get_db
import models_bkp
from pydantic import BaseModel, Field
from decimal import Decimal
from enum import Enum
from collections import defaultdict
import io
import csv

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# =====================================================================
# PYDANTIC MODELS - BASIC ANALYTICS
# =====================================================================

class MissionVisionCard(BaseModel):
    mission: str
    vision: str
    brand_promise: str
    owner: str
    last_updated: datetime
    north_star_objective: str

class SWOTItem(BaseModel):
    category: str  # strength, weakness, opportunity, threat
    items: List[str]
    detail_link: Optional[str] = None

class LifecycleStage(BaseModel):
    stage: str
    count: int
    avg_days_in_stage: float
    handoff_conversion_rate: float
    sla_days: int
    sla_status: str  # green, amber, red

class FundraisingVitals(BaseModel):
    income_diversification: Dict[str, float]
    donor_pyramid: Dict[str, int]
    retention_rates: Dict[str, float]
    avg_gift: float
    avg_gift_prior_year: float
    multi_year_donors: int
    inflow_lapsed_ratio: float

class AudienceMetrics(BaseModel):
    active_donors: int
    active_donors_yoy_delta: int
    donors_gte_1k: int
    donors_gte_1k_yoy_delta: int
    donors_gte_10k: int
    donors_gte_10k_yoy_delta: int
    email_list_size: int
    email_list_yoy_delta: int
    social_followers: int
    social_followers_yoy_delta: int

class RevenueRollup(BaseModel):
    year: int
    total_revenue: float
    online_revenue: float
    offline_revenue: float
    event_revenue: float
    first_gift_count: int
    major_gift_count: int
    variance_vs_plan: float

class ProgramImpact(BaseModel):
    program_id: str
    program_name: str
    beneficiaries_served: int
    units_delivered: float
    hours_delivered: float
    cost_per_outcome: float
    progress_vs_target: float
    quarterly_target: float

class DigitalKPIs(BaseModel):
    sessions: int
    avg_session_duration: float
    bounce_rate: float
    email_sends: int
    email_opens: int
    email_clicks: int
    email_ctr: float
    conversion_to_donation: float
    conversion_to_volunteer: float
    conversion_to_newsletter: float

class HighImpactTarget(BaseModel):
    id: str
    title: str
    owner: str
    due_date: date
    timeframe: str  # 90_day or 1_year
    status: str  # R (red), A (amber), G (green)
    expected_lift: float
    milestones: List[Dict[str, Any]]
    risk_flags: List[str]

# =====================================================================
# PYDANTIC MODELS - DONOR LIFECYCLE (FROM GAP_ANALYTICS)
# =====================================================================

class DonorSegment(BaseModel):
    segment_name: str
    criteria: str
    donor_count: int
    avg_lifetime_value: float
    avg_annual_gift: float
    retention_rate: float
    yoy_growth: int

class DonorSegmentsResponse(BaseModel):
    organization_id: str
    as_of_date: datetime
    segments: List[DonorSegment]

class UpgradeFlow(BaseModel):
    from_segment: str
    to_segment: str
    count: int
    avg_time_to_upgrade_months: float
    success_factors: List[str]

class DowngradeFlow(BaseModel):
    from_segment: str
    to_segment: str
    count: int
    risk_factors: List[str]

class DonorMovementResponse(BaseModel):
    organization_id: str
    analysis_period: str
    movement_summary: Dict[str, int]
    upgrade_flows: List[UpgradeFlow]
    downgrade_flows: List[DowngradeFlow]
    pipeline_health: Dict[str, Any]

class DonorLTVMetrics(BaseModel):
    actual_ltv: float
    projected_ltv: float
    giving_tenure_years: float
    total_gifts: int
    avg_gift_size: float
    largest_gift: float
    first_gift_date: Optional[date]
    last_gift_date: Optional[date]

class LTVTrajectory(BaseModel):
    trend: str  # increasing, decreasing, stable
    growth_rate_annual: float
    upgrade_probability: Dict[str, float]

class DonorLTVDetail(BaseModel):
    donor_id: str
    donor_name: str
    current_segment: str
    ltv_metrics: DonorLTVMetrics
    ltv_trajectory: LTVTrajectory
    value_drivers: List[str]
    recommended_actions: List[str]

class DonorLTVResponse(BaseModel):
    organization_id: str
    analysis_date: datetime
    total_donors: int
    total_ltv: float
    avg_ltv: float
    top_donors: List[DonorLTVDetail]

class AcquisitionChannel(BaseModel):
    channel: str
    total_acquired: int
    conversion_to_repeat: float
    avg_first_gift: float
    avg_ltv: float
    cost_per_acquisition: float
    roi: float

class JourneyStage(BaseModel):
    stage: str
    typical_duration_days: int
    conversion_rate: float
    key_touchpoints: List[str]

class DonorJourneyResponse(BaseModel):
    organization_id: str
    analysis_date: datetime
    acquisition_channels: List[AcquisitionChannel]
    journey_stages: List[JourneyStage]

class LegacyPipelineStage(BaseModel):
    stage_name: str
    count: int
    total_value: Optional[float] = None
    avg_days_in_stage: Optional[float] = None
    estimated_close_rate: Optional[float] = None

class LegacyProspect(BaseModel):
    donor_id: str
    name: str
    age: Optional[int]
    giving_tenure_years: float
    lifetime_value: float
    legacy_readiness_score: float
    recommended_approach: str

class LegacyPipelineResponse(BaseModel):
    organization_id: str
    analysis_date: datetime
    legacy_program_metrics: Dict[str, Any]
    pipeline_stages: Dict[str, LegacyPipelineStage]
    top_prospects: List[LegacyProspect]

class UpgradeReadyDonor(BaseModel):
    donor_id: str
    donor_name: str
    current_segment: str
    target_segment: str
    readiness_score: float
    current_ltv: float
    projected_ltv: float
    key_indicators: List[str]
    recommended_timing: str
    recommended_ask_amount: float

class UpgradeReadinessResponse(BaseModel):
    organization_id: str
    analysis_date: datetime
    total_upgrade_ready: int
    by_target_segment: Dict[str, int]
    ready_donors: List[UpgradeReadyDonor]

# =====================================================================
# PYDANTIC MODELS - ADVANCED ANALYTICS
# =====================================================================

class LifecycleStageEnum(str, Enum):
    PROSPECT = "prospect"
    FIRST_TIME = "first_time"
    REPEAT = "repeat"
    MAJOR = "major"
    LAPSED = "lapsed"
    LOST = "lost"

class ChurnRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DonorLifecycleStageDetailed(BaseModel):
    stage: LifecycleStageEnum
    donor_count: int
    avg_days_in_stage: float
    avg_lifetime_value: float
    conversion_rate: Optional[float] = None
    churn_rate: Optional[float] = None

class DonorChurnRisk(BaseModel):
    donor_id: str
    donor_name: str
    email: Optional[str]
    last_donation_date: Optional[datetime]
    days_since_last_donation: int
    total_donations: int
    lifetime_value: float
    current_stage: LifecycleStageEnum
    risk_level: ChurnRisk
    risk_factors: List[str]
    recommended_action: str

class CohortAnalysis(BaseModel):
    cohort_period: str
    initial_count: int
    retained_month_1: int
    retained_month_3: int
    retained_month_6: int
    retained_month_12: int
    retention_rate_12m: float
    avg_cohort_value: float

class LifecycleAnalyticsResponse(BaseModel):
    organization_id: str
    snapshot_date: datetime
    lifecycle_stages: List[DonorLifecycleStageDetailed]
    cohort_analysis: List[CohortAnalysis]
    at_risk_donors: List[DonorChurnRisk]
    summary_metrics: Dict[str, Any]

class ImpactMapping(BaseModel):
    program_id: str
    program_name: str
    unit_cost: float
    outcome_unit: str
    formula: str

class ImpactCorrelation(BaseModel):
    program_id: str
    program_name: str
    total_funding: float
    total_outcomes: int
    unit_cost_actual: float
    unit_cost_planned: float
    efficiency_ratio: float
    correlation_strength: float
    lag_months: int

class ImpactSummary(BaseModel):
    total_investment: float
    total_outcomes: int
    weighted_avg_unit_cost: float
    programs_analyzed: int
    assumptions: List[str]
    key_findings: List[str]

class MissionalImpactResponse(BaseModel):
    organization_id: str
    analysis_period_start: datetime
    analysis_period_end: datetime
    impact_mappings: List[ImpactMapping]
    correlations: List[ImpactCorrelation]
    summary: ImpactSummary

class QuadrantType(str, Enum):
    QUICK_WINS = "quick_wins"
    BIG_BETS = "big_bets"
    FILL_INS = "fill_ins"
    MONEY_PITS = "money_pits"

class StrategicInitiativeInput(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    strategic_alignment_score: float = Field(..., ge=0, le=10)
    investment_maturity_score: float = Field(..., ge=0, le=10)
    estimated_cost: float
    expected_benefit: Optional[str] = None
    quadrant: Optional[QuadrantType] = None
    recommendation: Optional[str] = None

class WiseInvestorQuadrant(BaseModel):
    quadrant: QuadrantType
    initiatives: List[StrategicInitiativeInput]
    total_cost: float
    average_alignment: float
    recommendation: str

class WiseInvestor2x2Response(BaseModel):
    organization_id: str
    analysis_date: datetime
    quadrants: List[WiseInvestorQuadrant]
    total_initiatives: int
    total_investment: float
    strategic_summary: str

# =====================================================================
# BASIC ANALYTICS ENDPOINTS
# =====================================================================

@router.get("/mission-vision/{organization_id}", response_model=MissionVisionCard)
def get_mission_vision(organization_id: str, db: Session = Depends(get_db)):
    """Get organization's mission, vision, brand promise, and north star objective"""
    org = db.query(models_bkp.Organization).filter(models_bkp.Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "mission": "Transform lives through education and community support",
        "vision": "A world where every individual has access to quality resources",
        "brand_promise": "Committed to measurable impact and transparency",
        "owner": "CEO / Board Chair",
        "last_updated": datetime.now() - timedelta(days=30),
        "north_star_objective": "Diversify revenue streams and achieve sustainable growth"
    }

@router.get("/swot/{organization_id}", response_model=List[SWOTItem])
def get_swot_analysis(organization_id: str, db: Session = Depends(get_db)):
    """Get SWOT analysis (top 3 per quadrant)"""
    return [
        {
            "category": "strengths",
            "items": [
                "Strong donor retention (87%)",
                "Established community presence (15 years)",
                "Skilled volunteer base (500+ active)"
            ],
            "detail_link": "/strategic-plan/swot#strengths"
        },
        {
            "category": "weaknesses",
            "items": [
                "Limited digital fundraising capability",
                "Aging donor base (avg 62 years)",
                "Single-source funding dependency (45%)"
            ],
            "detail_link": "/strategic-plan/swot#weaknesses"
        },
        {
            "category": "opportunities",
            "items": [
                "Growing corporate partnership interest",
                "Untapped monthly giving program",
                "Expansion into adjacent service areas"
            ],
            "detail_link": "/strategic-plan/swot#opportunities"
        },
        {
            "category": "threats",
            "items": [
                "Increased competition for grants",
                "Economic uncertainty affecting giving",
                "Regulatory changes in nonprofit sector"
            ],
            "detail_link": "/strategic-plan/swot#threats"
        }
    ]

@router.get("/lifecycle/{organization_id}", response_model=List[LifecycleStage])
def get_lifecycle_snapshot(
        organization_id: str,
        segment: Optional[str] = None,
        channel: Optional[str] = None,
        campaign_id: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    Donor lifecycle stages with counts, average days, and SLA compliance
    Stages: Acquisition → Conversion → Cultivation → Stewardship → Reactivation
    """
    query = db.query(
        models.Party.id,
        func.count(models_bkp.Donation.id).label('donation_count'),
        func.max(models.Donation.donation_date).label('last_donation'),
        func.sum(models_bkp.Donation.amount).label('total_given')
    ).join(
        models.Donation, models_bkp.Party.id == models.Donation.party_id
    ).filter(
        models_bkp.Party.organization_id == organization_id
    ).group_by(models_bkp.Party.id)

    results = query.all()

    acquisition_count = 0
    conversion_count = 0
    cultivation_count = 0
    stewardship_count = 0
    reactivation_count = 0

    now = datetime.now()

    for party_id, donation_count, last_donation, total_given in results:
        days_since_last = (now - last_donation).days if last_donation else 999
        if last_donation and last_donation.tzinfo is None:
    last_donation = last_donation.replace(tzinfo=timezone.utc)
        if donation_count == 0:
            acquisition_count += 1
        elif donation_count == 1:
            conversion_count += 1
        elif donation_count > 1 and total_given < 1000:
            cultivation_count += 1
        elif total_given >= 1000 and days_since_last < 365:
            stewardship_count += 1
        elif days_since_last > 365:
            reactivation_count += 1
        else:
            cultivation_count += 1

    stages = [
        {
            "stage": "Acquisition",
            "count": acquisition_count,
            "avg_days_in_stage": 25.5,
            "handoff_conversion_rate": 42.3,
            "sla_days": 30,
            "sla_status": "green"
        },
        {
            "stage": "Conversion",
            "count": conversion_count,
            "avg_days_in_stage": 38.2,
            "handoff_conversion_rate": 67.8,
            "sla_days": 45,
            "sla_status": "green"
        },
        {
            "stage": "Cultivation",
            "count": cultivation_count,
            "avg_days_in_stage": 52.1,
            "handoff_conversion_rate": 24.5,
            "sla_days": 60,
            "sla_status": "amber"
        },
        {
            "stage": "Stewardship",
            "count": stewardship_count,
            "avg_days_in_stage": 180.3,
            "handoff_conversion_rate": 85.2,
            "sla_days": 90,
            "sla_status": "red"
        },
        {
            "stage": "Reactivation",
            "count": reactivation_count,
            "avg_days_in_stage": 45.7,
            "handoff_conversion_rate": 18.9,
            "sla_days": 60,
            "sla_status": "amber"
        }
    ]

    return stages

@router.get("/fundraising-vitals/{organization_id}", response_model=FundraisingVitals)
def get_fundraising_vitals(organization_id: str, db: Session = Depends(get_db)):
    """Key fundraising metrics: diversification, donor pyramid, retention, etc."""
    current_year = datetime.now().year
    prior_year = current_year - 1

    fund_totals = db.query(
        models_bkp.Fund.restriction,
        func.sum(models_bkp.DonationLine.amount).label('total')
    ).join(
        models_bkp.DonationLine, models_bkp.Fund.id == models_bkp.DonationLine.program_id
    ).filter(
        models.Fund.organization_id == organization_id
    ).group_by(models_bkp.Fund.restriction).all()

    total_restricted = sum([t[1] for t in fund_totals if t[1]])
    income_diversification = {}
    for restriction, amount in fund_totals:
        if amount and total_restricted > 0:
            income_diversification[restriction or "unrestricted"] = round((amount / total_restricted) * 100, 2)

    donor_pyramid_query = db.query(
        models_bkp.Party.id,
        func.sum(models.Donation.amount).label('annual_total')
    ).join(
        models_bkp.Donation, models_bkp.Party.id == models.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id,
        extract('year', models.Donation.donation_date) == current_year
    ).group_by(models_bkp.Party.id).all()

    donor_pyramid = {
        "<$100": 0,
        "$100-499": 0,
        "$500-999": 0,
        "$1k-4.9k": 0,
        "$5k-9.9k": 0,
        "$10k+": 0
    }

    for party_id, annual_total in donor_pyramid_query:
        if annual_total:
            if annual_total < 100:
                donor_pyramid["<$100"] += 1
            elif annual_total < 500:
                donor_pyramid["$100-499"] += 1
            elif annual_total < 1000:
                donor_pyramid["$500-999"] += 1
            elif annual_total < 5000:
                donor_pyramid["$1k-4.9k"] += 1
            elif annual_total < 10000:
                donor_pyramid["$5k-9.9k"] += 1
            else:
                donor_pyramid["$10k+"] += 1

    current_year_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models.Donation.organization_id == organization_id,
        extract('year', models_bkp.Donation.donation_date) == current_year
    ).scalar() or 0

    prior_year_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        extract('year', models.Donation.donation_date) == prior_year
    ).scalar() or 0

    retained_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.party_id.in_(
            db.query(models.Donation.party_id).filter(
                extract('year', models.Donation.donation_date) == prior_year
            )
        ),
        extract('year', models_bkp.Donation.donation_date) == current_year
    ).scalar() or 0

    overall_retention = (retained_donors / prior_year_donors * 100) if prior_year_donors > 0 else 0

    avg_gift_current = db.query(func.avg(models_bkp.Donation.amount)).filter(
        models.Donation.organization_id == organization_id,
        extract('year', models.Donation.donation_date) == current_year
    ).scalar() or 0

    avg_gift_prior = db.query(func.avg(models.Donation.amount)).filter(
        models_bkp.Donation.organization_id == organization_id,
        extract('year', models_bkp.Donation.donation_date) == prior_year
    ).scalar() or 0

    multi_year_donors = db.query(func.count(func.distinct(models_bkp.Party.id))).filter(
        models_bkp.Party.id.in_(
            db.query(models.Donation.party_id).filter(
                models_bkp.Donation.organization_id == organization_id,
                extract('year', models.Donation.donation_date) >= current_year - 2
            ).group_by(models_bkp.Donation.party_id).having(
                func.count(func.distinct(extract('year', models_bkp.Donation.donation_date))) >= 2
            )
        )
    ).scalar() or 0

    new_donors = current_year_donors - retained_donors
    lapsed_donors = prior_year_donors - retained_donors
    inflow_lapsed_ratio = (new_donors / lapsed_donors) if lapsed_donors > 0 else 0

    return {
        "income_diversification": income_diversification,
        "donor_pyramid": donor_pyramid,
        "retention_rates": {
            "overall": round(overall_retention, 2),
            "first_year": 45.3,
            "major": 92.1
        },
        "avg_gift": round(float(avg_gift_current), 2),
        "avg_gift_prior_year": round(float(avg_gift_prior), 2),
        "multi_year_donors": multi_year_donors,
        "inflow_lapsed_ratio": round(inflow_lapsed_ratio, 2)
    }

@router.get("/audience-metrics/{organization_id}", response_model=AudienceMetrics)
def get_audience_metrics(organization_id: str, db: Session = Depends(get_db)):
    """Audience size and growth metrics year-over-year"""
    current_year = datetime.now().year
    prior_year = current_year - 1

    active_donors_current = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= datetime.now() - timedelta(days=730)
    ).scalar() or 0

    active_donors_prior = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= datetime.now() - timedelta(days=1095),
        models_bkp.Donation.donation_date < datetime.now() - timedelta(days=365)
    ).scalar() or 0

    donors_1k_current = db.query(func.count(func.distinct(models.Party.id))).filter(
        models_bkp.Party.id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                models_bkp.Donation.organization_id == organization_id,
                extract('year', models_bkp.Donation.donation_date) == current_year
            ).group_by(models_bkp.Donation.party_id).having(
                func.sum(models_bkp.Donation.amount) >= 1000
            )
        )
    ).scalar() or 0

    donors_1k_prior = db.query(func.count(func.distinct(models.Party.id))).filter(
        models_bkp.Party.id.in_(
            db.query(models.Donation.party_id).filter(
                models.Donation.organization_id == organization_id,
                extract('year', models.Donation.donation_date) == prior_year
            ).group_by(models_bkp.Donation.party_id).having(
                func.sum(models_bkp.Donation.amount) >= 1000
            )
        )
    ).scalar() or 0

    donors_10k_current = db.query(func.count(func.distinct(models_bkp.Party.id))).filter(
        models_bkp.Party.id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                models_bkp.Donation.organization_id == organization_id,
                extract('year', models_bkp.Donation.donation_date) == current_year
            ).group_by(models.Donation.party_id).having(
                func.sum(models_bkp.Donation.amount) >= 10000
            )
        )
    ).scalar() or 0

    donors_10k_prior = db.query(func.count(func.distinct(models.Party.id))).filter(
        models.Party.id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                models.Donation.organization_id == organization_id,
                extract('year', models.Donation.donation_date) == prior_year
            ).group_by(models_bkp.Donation.party_id).having(
                func.sum(models_bkp.Donation.amount) >= 10000
            )
        )
    ).scalar() or 0

    email_list_current = db.query(func.count(models_bkp.ContactPoint.id)).filter(
        models_bkp.ContactPoint.organization_id == organization_id,
        models.ContactPoint.type == "email",
        models.ContactPoint.verified_at.isnot(None)
    ).scalar() or 0

    email_list_prior = int(email_list_current * 0.92)

    return {
        "active_donors": active_donors_current,
        "active_donors_yoy_delta": active_donors_current - active_donors_prior,
        "donors_gte_1k": donors_1k_current,
        "donors_gte_1k_yoy_delta": donors_1k_current - donors_1k_prior,
        "donors_gte_10k": donors_10k_current,
        "donors_gte_10k_yoy_delta": donors_10k_current - donors_10k_prior,
        "email_list_size": email_list_current,
        "email_list_yoy_delta": email_list_current - email_list_prior,
        "social_followers": 15420,
        "social_followers_yoy_delta": 1230
    }

@router.get("/revenue-rollup/{organization_id}", response_model=List[RevenueRollup])
def get_revenue_rollup(organization_id: str, db: Session = Depends(get_db)):
    """Revenue breakdown by year and channel"""
    current_year = datetime.now().year
    years = [current_year - 2, current_year - 1, current_year]

    results = []

    for year in years:
        total_revenue = db.query(func.sum(models_bkp.Donation.amount)).filter(
            models_bkp.Donation.organization_id == organization_id,
            extract('year', models_bkp.Donation.donation_date) == year
        ).scalar() or 0

        online_revenue = total_revenue * 0.35
        offline_revenue = total_revenue * 0.50
        event_revenue = total_revenue * 0.15

        first_gift_count = db.query(func.count(models_bkp.Donation.id)).filter(
            models_bkp.Donation.organization_id == organization_id,
            extract('year', models_bkp.Donation.donation_date) == year,
            models_bkp.Donation.party_id.in_(
                db.query(models.Donation.party_id).filter(
                    models.Donation.organization_id == organization_id
                ).group_by(models_bkp.Donation.party_id).having(
                    func.min(models_bkp.Donation.donation_date) >= f"{year}-01-01"
                )
            )
        ).scalar() or 0

        major_gift_count = db.query(func.count(models.Donation.id)).filter(
            models.Donation.organization_id == organization_id,
            extract('year', models.Donation.donation_date) == year,
            models_bkp.Donation.amount >= 1000
        ).scalar() or 0

        results.append({
            "year": year,
            "total_revenue": float(total_revenue),
            "online_revenue": float(online_revenue),
            "offline_revenue": float(offline_revenue),
            "event_revenue": float(event_revenue),
            "first_gift_count": first_gift_count,
            "major_gift_count": major_gift_count,
            "variance_vs_plan": 2.5 if year == current_year else 0
        })

    return results

@router.get("/program-impact/{organization_id}", response_model=List[ProgramImpact])
def get_program_impact(organization_id: str, db: Session = Depends(get_db)):
    """Program impact metrics: beneficiaries, units delivered, cost per outcome"""
    programs = db.query(models_bkp.Program).filter(
        models_bkp.Program.organization_id == organization_id
    ).all()

    results = []

    for program in programs:
        beneficiaries_served = db.query(func.count(func.distinct(models_bkp.ServiceBeneficiary.beneficiary_id))).filter(
            models.ServiceBeneficiary.service_event_id.in_(
                db.query(models_bkp.ServiceEvent.id).filter(
                    models.ServiceEvent.program_id == program.id
                )
            )
        ).scalar() or 0

        units_delivered = db.query(func.sum(models_bkp.ServiceEvent.units_delivered)).filter(
            models.ServiceEvent.program_id == program.id
        ).scalar() or 0

        hours_delivered = float(units_delivered)

        program_expenses = db.query(func.sum(models_bkp.DonationLine.amount)).filter(
            models.DonationLine.program_id == program.id
        ).scalar() or 0

        cost_per_outcome = (float(program_expenses) / beneficiaries_served) if beneficiaries_served > 0 else 0

        quarterly_target = 150
        progress = (beneficiaries_served / quarterly_target * 100) if quarterly_target > 0 else 0

        results.append({
            "program_id": str(program.id),
            "program_name": program.description or program.code,
            "beneficiaries_served": beneficiaries_served,
            "units_delivered": float(units_delivered),
            "hours_delivered": hours_delivered,
            "cost_per_outcome": round(cost_per_outcome, 2),
            "progress_vs_target": round(progress, 2),
            "quarterly_target": quarterly_target
        })

    return results

@router.get("/digital-kpis/{organization_id}", response_model=DigitalKPIs)
def get_digital_kpis(organization_id: str, db: Session = Depends(get_db)):
    """Digital marketing and website performance metrics"""
    return {
        "sessions": 45230,
        "avg_session_duration": 142.5,
        "bounce_rate": 42.3,
        "email_sends": 12500,
        "email_opens": 3750,
        "email_clicks": 825,
        "email_ctr": 6.6,
        "conversion_to_donation": 2.8,
        "conversion_to_volunteer": 1.2,
        "conversion_to_newsletter": 8.5
    }

@router.get("/high-impact-targets/{organization_id}", response_model=List[HighImpactTarget])
def get_high_impact_targets(
        organization_id: str,
        timeframe: Optional[str] = Query(None, regex="^(90_day|1_year)$"),
        db: Session = Depends(get_db)
):
    """Strategic bets and initiatives with owner, due date, status, and milestones"""
    targets = [
        {
            "id": "1",
            "title": "Launch Monthly Giving Program",
            "owner": "Sarah Johnson - Development Director",
            "due_date": date.today() + timedelta(days=85),
            "timeframe": "90_day",
            "status": "G",
            "expected_lift": 125000.00,
            "milestones": [
                {"name": "Platform selection", "due": "2025-01-15", "status": "complete"},
                {"name": "Marketing materials", "due": "2025-02-01", "status": "in_progress"},
                {"name": "Soft launch", "due": "2025-02-15", "status": "pending"},
                {"name": "Full launch", "due": "2025-03-01", "status": "pending"}
            ],
            "risk_flags": []
        },
        {
            "id": "2",
            "title": "Diversify Corporate Partnerships",
            "owner": "Michael Chen - Partnerships Manager",
            "due_date": date.today() + timedelta(days=75),
            "timeframe": "90_day",
            "status": "A",
            "expected_lift": 200000.00,
            "milestones": [
                {"name": "Prospect research", "due": "2024-12-15", "status": "complete"},
                {"name": "Initial outreach", "due": "2025-01-10", "status": "complete"},
                {"name": "Proposal submissions", "due": "2025-02-01", "status": "in_progress"},
                {"name": "Close 3 partnerships", "due": "2025-02-28", "status": "pending"}
            ],
            "risk_flags": ["Slower response rate than expected", "Budget approval delays at corporate partners"]
        }
    ]

    if timeframe:
        targets = [t for t in targets if t["timeframe"] == timeframe]

    return targets

@router.get("/dashboard-summary/{organization_id}")
def get_dashboard_summary(organization_id: str, db: Session = Depends(get_db)):
    """Comprehensive dashboard summary combining all key metrics"""
    return {
        "organization_id": organization_id,
        "as_of_date": datetime.now().isoformat(),
        "sections": {
            "mission_vision": f"/analytics/mission-vision/{organization_id}",
            "swot": f"/analytics/swot/{organization_id}",
            "lifecycle": f"/analytics/lifecycle/{organization_id}",
            "fundraising_vitals": f"/analytics/fundraising-vitals/{organization_id}",
            "audience_metrics": f"/analytics/audience-metrics/{organization_id}",
            "revenue_rollup": f"/analytics/revenue-rollup/{organization_id}",
            "program_impact": f"/analytics/program-impact/{organization_id}",
            "digital_kpis": f"/analytics/digital-kpis/{organization_id}",
            "high_impact_targets": f"/analytics/high-impact-targets/{organization_id}",
            "donor_segments": f"/analytics/donor-segments/{organization_id}",
            "donor_movement": f"/analytics/donor-movement/{organization_id}",
            "donor_ltv": f"/analytics/donor-ltv/{organization_id}",
            "donor_journey": f"/analytics/donor-journey/{organization_id}",
            "legacy_pipeline": f"/analytics/legacy-pipeline/{organization_id}",
            "upgrade_readiness": f"/analytics/donor-segments/upgrade-readiness/{organization_id}",
            "advanced_lifecycle": f"/analytics/advanced/donor-lifecycle/{organization_id}",
            "impact_correlation": f"/analytics/advanced/impact-correlation/{organization_id}",
            "wise_investor": f"/analytics/advanced/wise-investor/{organization_id}"
        }
    }

@router.get("/alerts/{organization_id}")
def get_threshold_alerts(organization_id: str, db: Session = Depends(get_db)):
    """Threshold-based alerts for key metrics"""
    alerts = []
    current_year = datetime.now().year
    prior_year = current_year - 1

    current_year_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        extract('year', models.Donation.donation_date) == current_year
    ).scalar() or 0

    prior_year_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        extract('year', models.Donation.donation_date) == prior_year
    ).scalar() or 0

    retained = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        models.Donation.party_id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                extract('year', models.Donation.donation_date) == prior_year
            )
        ),
        extract('year', models.Donation.donation_date) == current_year
    ).scalar() or 0

    retention_rate = (retained / prior_year_donors * 100) if prior_year_donors > 0 else 0

    if retention_rate < 75:
        alerts.append({
            "severity": "high",
            "category": "retention",
            "message": f"Donor retention rate ({retention_rate:.1f}%) is below threshold of 75%",
            "metric_value": retention_rate,
            "threshold": 75,
            "action_required": "Review donor engagement strategy"
        })

    return {
        "organization_id": organization_id,
        "alert_count": len(alerts),
        "alerts": alerts,
        "generated_at": datetime.now().isoformat()
    }

@router.get("/benchmarks/{organization_id}")
def get_industry_benchmarks(organization_id: str, db: Session = Depends(get_db)):
    """Industry benchmarks for comparison"""
    return {
        "organization_id": organization_id,
        "benchmarks": {
            "retention_rate": {
                "your_value": 67.8,
                "nonprofit_average": 45.0,
                "top_quartile": 65.0,
                "status": "above_average"
            },
            "donor_acquisition_cost": {
                "your_value": 125.00,
                "nonprofit_average": 150.00,
                "top_quartile": 100.00,
                "status": "above_average"
            }
        }
    }

@router.get("/cohort-analysis/{organization_id}")
def get_cohort_analysis(
        organization_id: str,
        cohort_type: str = Query("acquisition_year", regex="^(acquisition_year|gift_level|channel)$"),
        db: Session = Depends(get_db)
):
    """Cohort analysis for donor behavior over time"""
    cohorts = []
    for year in range(datetime.now().year - 5, datetime.now().year + 1):
        first_time_donors = db.query(models_bkp.Donation.party_id).filter(
            models_bkp.Donation.organization_id == organization_id,
            extract('year', models.Donation.donation_date) == year
        ).group_by(models_bkp.Donation.party_id).having(
            func.min(models.Donation.donation_date) >= f"{year}-01-01"
        ).count()

        cohorts.append({
            "cohort": f"{year} Acquisitions",
            "size": first_time_donors,
            "year_1_retention": 45.2,
            "year_2_retention": 32.1,
            "year_3_retention": 28.5,
            "lifetime_value": 1250.00
        })

    return {"cohort_type": cohort_type, "cohorts": cohorts}

@router.get("/forecast/{organization_id}")
def get_revenue_forecast(
        organization_id: str,
        months_ahead: int = Query(12, ge=1, le=24),
        db: Session = Depends(get_db)
):
    """Revenue forecast based on historical trends"""
    current_year = datetime.now().year
    prior_years_revenue = []

    for year in range(current_year - 3, current_year):
        revenue = db.query(func.sum(models.Donation.amount)).filter(
            models_bkp.Donation.organization_id == organization_id,
            extract('year', models.Donation.donation_date) == year
        ).scalar() or 0
        prior_years_revenue.append(float(revenue))

    avg_revenue = sum(prior_years_revenue) / len(prior_years_revenue) if prior_years_revenue else 0
    growth_rate = 0.05

    forecast = []
    for month in range(1, months_ahead + 1):
        forecasted_amount = (avg_revenue / 12) * (1 + growth_rate) ** (month / 12)
        forecast.append({
            "month": (datetime.now() + timedelta(days=30 * month)).strftime("%Y-%m"),
            "forecasted_revenue": round(forecasted_amount, 2),
            "confidence_interval_low": round(forecasted_amount * 0.85, 2),
            "confidence_interval_high": round(forecasted_amount * 1.15, 2)
        })

    return {
        "organization_id": organization_id,
        "forecast_period": f"{months_ahead} months",
        "assumptions": {
            "annual_growth_rate": growth_rate * 100,
            "historical_average_annual": round(avg_revenue, 2)
        },
        "forecast": forecast
    }

@router.get("/export/dashboard/{organization_id}")
def export_dashboard_data(
        organization_id: str,
        format: str = Query("json", regex="^(json|csv)$"),
        db: Session = Depends(get_db)
):
    """Export comprehensive dashboard data for external analysis"""
    dashboard_data = {
        "organization_id": organization_id,
        "export_date": datetime.now().isoformat(),
        "lifecycle": get_lifecycle_snapshot(organization_id, db=db),
        "fundraising_vitals": get_fundraising_vitals(organization_id, db=db),
        "audience_metrics": get_audience_metrics(organization_id, db=db),
        "revenue_rollup": get_revenue_rollup(organization_id, db=db),
        "program_impact": get_program_impact(organization_id, db=db),
        "digital_kpis": get_digital_kpis(organization_id, db=db),
        "high_impact_targets": get_high_impact_targets(organization_id, db=db),
        "alerts": get_threshold_alerts(organization_id, db=db),
        "benchmarks": get_industry_benchmarks(organization_id, db=db)
    }

    if format == "json":
        return dashboard_data
    else:
        return {"message": "CSV export not yet implemented", "data": dashboard_data}

# =====================================================================
# DONOR LIFECYCLE ENDPOINTS (FROM GAP_ANALYTICS)
# =====================================================================
from sqlalchemy import Table, MetaData, select
@router.get("/donor-segments/{organization_id}", response_model=DonorSegmentsResponse)
def get_donor_segments(organization_id: str, db: Session = Depends(get_db)):
    """
    Get donor segmentation breakdown by giving levels:
    - Broad Base (<$1,000)
    - Mid-Level ($1,000-$4,999)
    - Major/Leadership ($5,000-$24,999)
    - Principal/Transformational ($25,000+)
    - Legacy/Planned Giving
    """
    current_year = datetime.now().year
    prior_year = current_year - 1

    donor_annual_giving = db.query(
        models_bkp.Party.id,
        func.sum(models.Donation.amount).label('annual_total'),
        func.sum(
            case(
                (extract('year', models_bkp.Donation.donation_date) == current_year, models_bkp.Donation.amount),
                else_=0
            )
        ).label('current_year_total'),
        func.sum(
            case(
                (extract('year', models_bkp.Donation.donation_date) == prior_year, models.Donation.amount),
                else_=0
            )
        ).label('prior_year_total')
    ).join(
        models_bkp.Donation, models.Party.id == models_bkp.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(models.Party.id).all()

    segments_data = {
        'Broad Base': {'current': [], 'prior': [], 'criteria': '<$1,000 annual giving'},
        'Mid-Level': {'current': [], 'prior': [], 'criteria': '$1,000-$4,999 annual'},
        'Major/Leadership': {'current': [], 'prior': [], 'criteria': '$5,000-$24,999 annual'},
        'Principal/Transformational': {'current': [], 'prior': [], 'criteria': '$25,000+ annual'},
    }

    for donor_id, lifetime_total, current_total, prior_total in donor_annual_giving:
        if current_total:
            if current_total < 1000:
                segments_data['Broad Base']['current'].append((donor_id, current_total))
            elif current_total < 5000:
                segments_data['Mid-Level']['current'].append((donor_id, current_total))
            elif current_total < 25000:
                segments_data['Major/Leadership']['current'].append((donor_id, current_total))
            else:
                segments_data['Principal/Transformational']['current'].append((donor_id, current_total))

        if prior_total:
            if prior_total < 1000:
                segments_data['Broad Base']['prior'].append((donor_id, prior_total))
            elif prior_total < 5000:
                segments_data['Mid-Level']['prior'].append((donor_id, prior_total))
            elif prior_total < 25000:
                segments_data['Major/Leadership']['prior'].append((donor_id, prior_total))
            else:
                segments_data['Principal/Transformational']['prior'].append((donor_id, prior_total))

    segments = []
    for segment_name, data in segments_data.items():
        current_donors = data['current']
        prior_donors = data['prior']

        if current_donors:
            avg_gift = sum(amt for _, amt in current_donors) / len(current_donors)

            current_ids = {donor_id for donor_id, _ in current_donors}
            prior_ids = {donor_id for donor_id, _ in prior_donors}
            retained = len(current_ids & prior_ids)
            retention_rate = (retained / len(prior_ids) * 100) if prior_ids else 0

            avg_ltv = avg_gift * 3

            segments.append(DonorSegment(
                segment_name=segment_name,
                criteria=data['criteria'],
                donor_count=len(current_donors),
                avg_lifetime_value=round(avg_ltv, 2),
                avg_annual_gift=round(avg_gift, 2),
                retention_rate=round(retention_rate, 1),
                yoy_growth=len(current_donors) - len(prior_donors)
            ))



    metadata = MetaData()
    donations_reflected = Table("donations", metadata, autoload_with=db.bind, schema="public")
    subq = (
        select(donations_reflected.c.party_id)
        .where(
            donations_reflected.c.organization_id == organization_id,
            donations_reflected.c.gift_type.in_(["bequest_expectancy", "planned_gift"])
        )
    )
    legacy_count = (db.query(func.count(models.Party.id)).filter(
        models_bkp.Party.organization_id == organization_id,
                           models_bkp.Party.id.in_(subq)).scalar()) or 0
    if legacy_count > 0:
        total_legacy_value = (db.query(func.sum(donations_reflected.c.amount)).filter(
            donations_reflected.c.organization_id == organization_id,
                     donations_reflected.c.gift_type.in_(["bequest_expectancy", "planned_gift"]))
                             ).scalar() or 0

        segments.append(DonorSegment(
            segment_name='Legacy/Planned Giving',
            criteria='Documented planned gift commitment',
            donor_count=legacy_count,
            avg_lifetime_value=round(float(total_legacy_value) / legacy_count, 2),
            avg_annual_gift=0,
            retention_rate=100.0,
            yoy_growth=0
        ))

    return DonorSegmentsResponse(
        organization_id=organization_id,
        as_of_date=datetime.now(),
        segments=segments
    )

@router.get("/donor-movement/{organization_id}", response_model=DonorMovementResponse)
def get_donor_movement(organization_id: str, db: Session = Depends(get_db)):
    """Track donor upgrade and downgrade flows between segments"""
    current_year = datetime.now().year
    prior_year = current_year - 1

    donor_comparison = db.query(
        models_bkp.Party.id,
        func.sum(
            case(
                (extract('year', models_bkp.Donation.donation_date) == current_year, models_bkp.Donation.amount),
                else_=0
            )
        ).label('current_amount'),
        func.sum(
            case(
                (extract('year', models.Donation.donation_date) == prior_year, models_bkp.Donation.amount),
                else_=0
            )
        ).label('prior_amount')
    ).join(
        models_bkp.Donation, models.Party.id == models_bkp.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(models.Party.id).all()

    def categorize(amount):
        if amount < 1000:
            return 'Broad Base'
        elif amount < 5000:
            return 'Mid-Level'
        elif amount < 25000:
            return 'Major/Leadership'
        else:
            return 'Principal'

    upgrade_count = 0
    downgrade_count = 0
    upgrade_flows = defaultdict(int)
    downgrade_flows = defaultdict(int)

    for donor_id, current_amt, prior_amt in donor_comparison:
        if prior_amt and current_amt:
            prior_segment = categorize(prior_amt)
            current_segment = categorize(current_amt)

            if prior_segment != current_segment:
                segments = ['Broad Base', 'Mid-Level', 'Major/Leadership', 'Principal']
                prior_idx = segments.index(prior_segment)
                current_idx = segments.index(current_segment)

                if current_idx > prior_idx:
                    upgrade_count += 1
                    upgrade_flows[(prior_segment, current_segment)] += 1
                else:
                    downgrade_count += 1
                    downgrade_flows[(prior_segment, current_segment)] += 1

    upgrade_flow_list = []
    for (from_seg, to_seg), count in upgrade_flows.items():
        upgrade_flow_list.append(UpgradeFlow(
            from_segment=from_seg,
            to_segment=to_seg,
            count=count,
            avg_time_to_upgrade_months=18.5,
            success_factors=['Consistent multi-year giving', 'Event attendance', 'Personal cultivation']
        ))

    downgrade_flow_list = []
    for (from_seg, to_seg), count in downgrade_flows.items():
        downgrade_flow_list.append(DowngradeFlow(
            from_segment=from_seg,
            to_segment=to_seg,
            count=count,
            risk_factors=['Economic factors', 'Reduced engagement', 'Competing priorities']
        ))

    bottlenecks = []
    if upgrade_count < 10:
        bottlenecks.append("Low overall upgrade velocity - consider enhanced cultivation programs")

    return DonorMovementResponse(
        organization_id=organization_id,
        analysis_period='last_12_months',
        movement_summary={
            'total_upgrades': upgrade_count,
            'total_downgrades': downgrade_count,
            'net_movement': upgrade_count - downgrade_count
        },
        upgrade_flows=upgrade_flow_list,
        downgrade_flows=downgrade_flow_list,
        pipeline_health={
            'upgrade_velocity': 'medium' if upgrade_count > 5 else 'low',
            'bottlenecks': bottlenecks,
            'opportunities': [f"{upgrade_count} donors moved up in giving level this year"]
        }
    )

@router.get("/donor-ltv/{organization_id}", response_model=DonorLTVResponse)
def get_donor_ltv(
        organization_id: str,
        limit: int = Query(50, description="Number of top donors to return"),
        db: Session = Depends(get_db)
):
    """Comprehensive donor lifetime value tracking with projections"""
    donor_ltv_data = db.query(
        models.Party.id,
        models.Party.display_name,
        func.count(models.Donation.id).label('gift_count'),
        func.sum(models.Donation.amount).label('ltv'),
        func.avg(models_bkp.Donation.amount).label('avg_gift'),
        func.max(models_bkp.Donation.amount).label('largest_gift'),
        func.min(models.Donation.donation_date).label('first_gift_date'),
        func.max(models.Donation.donation_date).label('last_gift_date')
    ).join(
        models_bkp.Donation, models.Party.id == models.Donation.party_id
    ).filter(
        models_bkp.Party.organization_id == organization_id
    ).group_by(
        models_bkp.Party.id, models_bkp.Party.display_name
    ).order_by(
        desc(func.sum(models_bkp.Donation.amount))
    ).limit(limit).all()

    top_donors = []
    total_ltv = 0
    total_donors = 0

    for donor_data in donor_ltv_data:
        donor_id, name, gift_count, ltv, avg_gift, largest_gift, first_date, last_date = donor_data

        if ltv:
            total_ltv += float(ltv)
            total_donors += 1

            if first_date and last_date:
                tenure_days = (last_date - first_date).days
                tenure_years = tenure_days / 365.25
            else:
                tenure_years = 0

            annual_rate = float(ltv) / max(tenure_years, 1) if tenure_years > 0 else float(avg_gift or 0)
            projected_ltv = float(ltv) + (annual_rate * 5)

            if gift_count >= 3:
                trend = 'increasing'
                growth_rate = 12.5
            else:
                trend = 'stable'
                growth_rate = 0

            if ltv >= 25000:
                current_segment = 'Principal'
            elif ltv >= 5000:
                current_segment = 'Major/Leadership'
            elif ltv >= 1000:
                current_segment = 'Mid-Level'
            else:
                current_segment = 'Broad Base'

            upgrade_prob = {}
            if current_segment == 'Mid-Level':
                upgrade_prob = {
                    'to_major_leadership': 0.68,
                    'to_legacy': 0.15,
                    'estimated_timeframe_months': 18
                }
            elif current_segment == 'Broad Base':
                upgrade_prob = {
                    'to_mid_level': 0.45,
                    'to_major_leadership': 0.12,
                    'estimated_timeframe_months': 24
                }

            top_donors.append(DonorLTVDetail(
                donor_id=str(donor_id),
                donor_name=name,
                current_segment=current_segment,
                ltv_metrics=DonorLTVMetrics(
                    actual_ltv=round(float(ltv), 2),
                    projected_ltv=round(projected_ltv, 2),
                    giving_tenure_years=round(tenure_years, 1),
                    total_gifts=gift_count,
                    avg_gift_size=round(float(avg_gift or 0), 2),
                    largest_gift=round(float(largest_gift or 0), 2),
                    first_gift_date=first_date.date() if first_date else None,
                    last_gift_date=last_date.date() if last_date else None
                ),
                ltv_trajectory=LTVTrajectory(
                    trend=trend,
                    growth_rate_annual=growth_rate,
                    upgrade_probability=upgrade_prob
                ),
                value_drivers=[
                    'Consistent annual giving' if gift_count >= 3 else 'Early-stage donor',
                    'Increasing gift sizes' if trend == 'increasing' else 'Stable giving pattern',
                    'Long-term relationship' if tenure_years > 5 else 'Building relationship'
                ],
                recommended_actions=[
                    'Schedule major gift conversation' if current_segment in ['Mid-Level', 'Major/Leadership'] else 'Continue cultivation',
                    'Share personalized impact stories',
                    'Consider upgrade ask' if upgrade_prob else 'Maintain engagement'
                ]
            ))

    avg_ltv = total_ltv / total_donors if total_donors > 0 else 0

    return DonorLTVResponse(
        organization_id=organization_id,
        analysis_date=datetime.now(),
        total_donors=total_donors,
        total_ltv=round(total_ltv, 2),
        avg_ltv=round(avg_ltv, 2),
        top_donors=top_donors
    )

@router.get("/donor-ltv/{organization_id}/donor/{donor_id}", response_model=DonorLTVDetail)
def get_individual_donor_ltv(
        organization_id: str,
        donor_id: str,
        db: Session = Depends(get_db)
):
    """Get detailed LTV information for a specific donor"""
    donor_data = db.query(
        models.Party.id,
        models.Party.display_name,
        func.count(models_bkp.Donation.id).label('gift_count'),
        func.sum(models_bkp.Donation.amount).label('ltv'),
        func.avg(models_bkp.Donation.amount).label('avg_gift'),
        func.max(models_bkp.Donation.amount).label('largest_gift'),
        func.min(models.Donation.donation_date).label('first_gift_date'),
        func.max(models_bkp.Donation.donation_date).label('last_gift_date')
    ).join(
        models.Donation, models_bkp.Party.id == models_bkp.Donation.party_id
    ).filter(
        models_bkp.Party.organization_id == organization_id,
        models.Party.id == donor_id
    ).group_by(
        models.Party.id, models_bkp.Party.display_name
    ).first()

    if not donor_data:
        raise HTTPException(status_code=404, detail="Donor not found")

    donor_id, name, gift_count, ltv, avg_gift, largest_gift, first_date, last_date = donor_data

    if first_date and last_date:
        tenure_years = (last_date - first_date).days / 365.25
    else:
        tenure_years = 0

    annual_rate = float(ltv or 0) / max(tenure_years, 1) if tenure_years > 0 else float(avg_gift or 0)
    projected_ltv = float(ltv or 0) + (annual_rate * 5)

    if ltv >= 25000:
        current_segment = 'Principal'
    elif ltv >= 5000:
        current_segment = 'Major/Leadership'
    elif ltv >= 1000:
        current_segment = 'Mid-Level'
    else:
        current_segment = 'Broad Base'

    return DonorLTVDetail(
        donor_id=str(donor_id),
        donor_name=name,
        current_segment=current_segment,
        ltv_metrics=DonorLTVMetrics(
            actual_ltv=round(float(ltv or 0), 2),
            projected_ltv=round(projected_ltv, 2),
            giving_tenure_years=round(tenure_years, 1),
            total_gifts=gift_count,
            avg_gift_size=round(float(avg_gift or 0), 2),
            largest_gift=round(float(largest_gift or 0), 2),
            first_gift_date=first_date.date() if first_date else None,
            last_gift_date=last_date.date() if last_date else None
        ),
        ltv_trajectory=LTVTrajectory(
            trend='increasing' if gift_count >= 3 else 'stable',
            growth_rate_annual=12.5,
            upgrade_probability={'to_major_leadership': 0.68}
        ),
        value_drivers=['Consistent giving', 'Growing relationship'],
        recommended_actions=['Schedule cultivation meeting', 'Share impact stories']
    )

@router.get("/donor-journey/{organization_id}", response_model=DonorJourneyResponse)
def get_donor_journey(organization_id: str, db: Session = Depends(get_db)):
    """Visualize the complete donor journey from acquisition through lifecycle stages"""
    acquisition_channels = [
        AcquisitionChannel(
            channel='Website/Online',
            total_acquired=145,
            conversion_to_repeat=62.0,
            avg_first_gift=125.00,
            avg_ltv=1850.00,
            cost_per_acquisition=45.00,
            roi=41.1
        ),
        AcquisitionChannel(
            channel='Direct Mail',
            total_acquired=89,
            conversion_to_repeat=48.3,
            avg_first_gift=75.00,
            avg_ltv=980.00,
            cost_per_acquisition=85.00,
            roi=11.5
        ),
        AcquisitionChannel(
            channel='Events',
            total_acquired=67,
            conversion_to_repeat=71.6,
            avg_first_gift=250.00,
            avg_ltv=4200.00,
            cost_per_acquisition=125.00,
            roi=33.6
        ),
        AcquisitionChannel(
            channel='Peer Referral',
            total_acquired=45,
            conversion_to_repeat=82.2,
            avg_first_gift=350.00,
            avg_ltv=8500.00,
            cost_per_acquisition=25.00,
            roi=340.0
        )
    ]

    journey_stages = [
        JourneyStage(
            stage='Prospect',
            typical_duration_days=45,
            conversion_rate=42.0,
            key_touchpoints=['Email nurture', 'Social media', 'Website visits']
        ),
        JourneyStage(
            stage='First Gift',
            typical_duration_days=30,
            conversion_rate=65.0,
            key_touchpoints=['Thank you call', 'Welcome series', 'Impact report']
        ),
        JourneyStage(
            stage='Repeat Donor',
            typical_duration_days=365,
            conversion_rate=58.5,
            key_touchpoints=['Quarterly updates', 'Annual appeal', 'Donor survey']
        ),
        JourneyStage(
            stage='Mid-Level',
            typical_duration_days=730,
            conversion_rate=28.0,
            key_touchpoints=['Personal outreach', 'Behind-scenes tour', 'Recognition']
        ),
        JourneyStage(
            stage='Major/Leadership',
            typical_duration_days=1095,
            conversion_rate=15.0,
            key_touchpoints=['1:1 meetings', 'Board engagement', 'Major gift proposal']
        )
    ]

    return DonorJourneyResponse(
        organization_id=organization_id,
        analysis_date=datetime.now(),
        acquisition_channels=acquisition_channels,
        journey_stages=journey_stages
    )

@router.get("/donor-journey/{organization_id}/acquisition-sources")
def get_acquisition_sources(organization_id: str, db: Session = Depends(get_db)):
    """Detailed breakdown of donor acquisition sources and their performance"""
    return {
        "organization_id": organization_id,
        "acquisition_sources": [
            {
                "source": "Google Ads",
                "donors_acquired": 45,
                "total_cost": 2250.00,
                "cost_per_donor": 50.00,
                "avg_first_gift": 125.00,
                "conversion_to_second_gift": 58.5
            },
            {
                "source": "Facebook Ads",
                "donors_acquired": 32,
                "total_cost": 1280.00,
                "cost_per_donor": 40.00,
                "avg_first_gift": 95.00,
                "conversion_to_second_gift": 52.3
            },
            {
                "source": "Direct Mail Campaign",
                "donors_acquired": 89,
                "total_cost": 7565.00,
                "cost_per_donor": 85.00,
                "avg_first_gift": 75.00,
                "conversion_to_second_gift": 48.3
            }
        ]
    }

@router.get("/legacy-pipeline/{organization_id}", response_model=LegacyPipelineResponse)
def get_legacy_pipeline(organization_id: str, db: Session = Depends(get_db)):
    """Track legacy/planned giving pipeline and prospects"""
    documented_commitments = db.query(
        func.count(models_bkp.Donation.id),
        func.sum(models.Donation.amount)
    ).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.gift_type.in_(['bequest_expectancy', 'planned_gift', 'charitable_trust'])
    ).first()

    commitment_count = documented_commitments[0] or 0
    total_committed_value = float(documented_commitments[1] or 0)

    current_year = datetime.now().year
    realized_bequests = db.query(
        func.count(models_bkp.Donation.id),
        func.sum(models_bkp.Donation.amount)
    ).filter(
        models.Donation.organization_id == organization_id,
        models_bkp.Donation.gift_type == 'bequest_received',
        extract('year', models.Donation.donation_date) == current_year
    ).first()

    realized_count = realized_bequests[0] or 0
    realized_value = float(realized_bequests[1] or 0)

    prospect_count = db.query(func.count(func.distinct(models_bkp.Party.id))).filter(
        models_bkp.Party.organization_id == organization_id,
        models_bkp.Party.id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                models.Donation.organization_id == organization_id
            ).group_by(models.Donation.party_id).having(
                and_(
                    func.sum(models.Donation.amount) >= 10000,
                    func.count(models_bkp.Donation.id) >= 5
                )
            )
        )
    ).scalar() or 0

    top_prospects = []
    legacy_prospects_data = db.query(
        models.Party.id,
        models_bkp.Party.display_name,
        func.count(models.Donation.id).label('donation_count'),
        func.sum(models.Donation.amount).label('ltv'),
        func.min(models_bkp.Donation.donation_date).label('first_gift')
    ).join(
        models_bkp.Donation, models_bkp.Party.id == models_bkp.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(
        models.Party.id, models.Party.display_name
    ).having(
        and_(
            func.sum(models_bkp.Donation.amount) >= 10000,
            func.count(models_bkp.Donation.id) >= 5
        )
    ).order_by(desc(func.sum(models_bkp.Donation.amount))).limit(10).all()

    for donor_id, name, donation_count, ltv, first_gift in legacy_prospects_data:
        if first_gift:
            tenure_years = (datetime.now() - first_gift).days / 365.25
        else:
            tenure_years = 0

        readiness_score = 0
        if ltv >= 50000:
            readiness_score += 0.3
        elif ltv >= 25000:
            readiness_score += 0.2
        elif ltv >= 10000:
            readiness_score += 0.1

        if tenure_years >= 15:
            readiness_score += 0.3
        elif tenure_years >= 10:
            readiness_score += 0.2
        elif tenure_years >= 5:
            readiness_score += 0.1

        if donation_count >= 20:
            readiness_score += 0.2
        elif donation_count >= 10:
            readiness_score += 0.1

        readiness_score += 0.2

        top_prospects.append(LegacyProspect(
            donor_id=str(donor_id),
            name=name,
            age=68,
            giving_tenure_years=round(tenure_years, 1),
            lifetime_value=round(float(ltv), 2),
            legacy_readiness_score=min(readiness_score, 1.0),
            recommended_approach='Personal meeting to discuss estate planning and legacy options'
        ))

    return LegacyPipelineResponse(
        organization_id=organization_id,
        analysis_date=datetime.now(),
        legacy_program_metrics={
            'total_documented_commitments': commitment_count,
            'total_committed_value': round(total_committed_value, 2),
            'avg_bequest_value': round(total_committed_value / commitment_count, 2) if commitment_count > 0 else 0,
            'realized_bequests_ytd': realized_count,
            'realized_value_ytd': round(realized_value, 2)
        },
        pipeline_stages={
            'prospects': LegacyPipelineStage(
                stage_name='prospects',
                count=prospect_count,
                total_value=None,
                avg_days_in_stage=None,
                estimated_close_rate=0.35
            ),
            'in_discussion': LegacyPipelineStage(
                stage_name='in_discussion',
                count=int(prospect_count * 0.4),
                total_value=None,
                avg_days_in_stage=180.0,
                estimated_close_rate=0.35
            ),
            'documented_commitments': LegacyPipelineStage(
                stage_name='documented_commitments',
                count=commitment_count,
                total_value=total_committed_value,
                avg_days_in_stage=None,
                estimated_close_rate=None
            )
        },
        top_prospects=top_prospects
    )

@router.get("/legacy-prospects/{organization_id}")
def get_legacy_prospects(organization_id: str, db: Session = Depends(get_db)):
    """Get detailed list of legacy giving prospects with scoring"""
    return get_legacy_pipeline(organization_id, db)

@router.get("/donor-segments/upgrade-readiness/{organization_id}", response_model=UpgradeReadinessResponse)
def get_upgrade_readiness(
        organization_id: str,
        min_score: float = Query(0.6, description="Minimum readiness score (0-1)"),
        db: Session = Depends(get_db)
):
    """Identify donors ready for upgrade with scoring and recommendations"""
    current_year = datetime.now().year

    donors_data = db.query(
        models_bkp.Party.id,
        models_bkp.Party.display_name,
        func.count(models_bkp.Donation.id).label('donation_count'),
        func.sum(models_bkp.Donation.amount).label('ltv'),
        func.sum(
            case(
                (extract('year', models_bkp.Donation.donation_date) == current_year, models_bkp.Donation.amount),
                else_=0
            )
        ).label('current_year_total'),
        func.max(models_bkp.Donation.donation_date).label('last_gift_date'),
        func.avg(models_bkp.Donation.amount).label('avg_gift')
    ).join(
        models_bkp.Donation, models.Party.id == models_bkp.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(
        models_bkp.Party.id, models_bkp.Party.display_name
    ).all()

    ready_donors = []
    by_target_segment = defaultdict(int)

    for donor_id, name, donation_count, ltv, current_giving, last_gift, avg_gift in donors_data:
        ltv_val = float(ltv or 0)
        current_val = float(current_giving or 0)
        avg_gift_val = float(avg_gift or 0)

        if current_val < 1000:
            current_segment = 'Broad Base'
            target_segment = 'Mid-Level'
            target_ask = 1500.00
        elif current_val < 5000:
            current_segment = 'Mid-Level'
            target_segment = 'Major/Leadership'
            target_ask = 7500.00
        elif current_val < 25000:
            current_segment = 'Major/Leadership'
            target_segment = 'Principal'
            target_ask = 35000.00
        else:
            current_segment = 'Principal'
            target_segment = 'Transformational'
            target_ask = 100000.00

        readiness_score = 0

        if donation_count >= 5:
            readiness_score += 0.3
        elif donation_count >= 3:
            readiness_score += 0.2
        elif donation_count >= 2:
            readiness_score += 0.1

        if last_gift:
            days_since = (datetime.now() - last_gift).days
            if days_since < 90:
                readiness_score += 0.2
            elif days_since < 180:
                readiness_score += 0.15
            elif days_since < 365:
                readiness_score += 0.1

        if ltv_val > 0 and donation_count > 0:
            avg_historical = ltv_val / donation_count
            if avg_gift_val > avg_historical * 1.2:
                readiness_score += 0.3
            elif avg_gift_val > avg_historical:
                readiness_score += 0.2

        if current_segment == 'Broad Base' and current_val >= 750:
            readiness_score += 0.2
        elif current_segment == 'Mid-Level' and current_val >= 3500:
            readiness_score += 0.2
        elif current_segment == 'Major/Leadership' and current_val >= 15000:
            readiness_score += 0.2
        elif current_val >= 500:
            readiness_score += 0.1

        if readiness_score >= min_score:
            projected_ltv = ltv_val + (target_ask * 3)

            key_indicators = []
            if donation_count >= 5:
                key_indicators.append('Consistent multi-year giving')
            if readiness_score >= 0.8:
                key_indicators.append('Strong engagement signals')
            if avg_gift_val > (ltv_val / donation_count) * 1.2:
                key_indicators.append('Gift sizes increasing')

            if readiness_score >= 0.8:
                timing = 'Ready now - schedule within 30 days'
            elif readiness_score >= 0.7:
                timing = 'Ready soon - cultivate for 60-90 days'
            else:
                timing = 'Building readiness - continue cultivation'

            ready_donors.append(UpgradeReadyDonor(
                donor_id=str(donor_id),
                donor_name=name,
                current_segment=current_segment,
                target_segment=target_segment,
                readiness_score=round(readiness_score, 2),
                current_ltv=round(ltv_val, 2),
                projected_ltv=round(projected_ltv, 2),
                key_indicators=key_indicators,
                recommended_timing=timing,
                recommended_ask_amount=target_ask
            ))

            by_target_segment[target_segment] += 1

    ready_donors.sort(key=lambda x: x.readiness_score, reverse=True)

    return UpgradeReadinessResponse(
        organization_id=organization_id,
        analysis_date=datetime.now(),
        total_upgrade_ready=len(ready_donors),
        by_target_segment=dict(by_target_segment),
        ready_donors=ready_donors
    )

# =====================================================================
# ADVANCED ANALYTICS - HELPER FUNCTIONS
# =====================================================================

def calculate_lifecycle_stage_advanced(
        donation_count: int,
        last_donation_date: Optional[datetime],
        lifetime_value: float,
        days_since_last: int
) -> LifecycleStageEnum:
    """Calculate donor lifecycle stage based on business rules"""
    if donation_count == 0:
        return LifecycleStageEnum.PROSPECT

    if donation_count == 1:
        if days_since_last > 365:
            return LifecycleStageEnum.LOST
        return LifecycleStageEnum.FIRST_TIME

    if days_since_last >= 365:
        if days_since_last >= 730:
            return LifecycleStageEnum.LOST
        return LifecycleStageEnum.LAPSED

    if lifetime_value >= 5000:
        return LifecycleStageEnum.MAJOR

    return LifecycleStageEnum.REPEAT

def calculate_churn_risk_advanced(
        days_since_last: int,
        donation_count: int,
        avg_donation_frequency: float,
        lifetime_value: float
) -> tuple[ChurnRisk, List[str]]:
    """Calculate churn risk with detailed risk factors"""
    risk_factors = []
    risk_score = 0

    if days_since_last >= 365:
        risk_factors.append(f"No donation in {days_since_last} days (12+ months)")
        risk_score += 40
    elif days_since_last >= 180:
        risk_factors.append(f"No donation in {days_since_last} days (6+ months)")
        risk_score += 20
    elif days_since_last >= 90:
        risk_factors.append(f"No donation in {days_since_last} days (3+ months)")
        risk_score += 10

    if avg_donation_frequency > 0:
        expected_next = avg_donation_frequency * 1.5
        if days_since_last > expected_next:
            risk_factors.append("Overdue based on donation pattern")
            risk_score += 25

    if donation_count < 3:
        risk_factors.append("Limited giving history (< 3 donations)")
        risk_score += 15

    if lifetime_value >= 5000 and days_since_last >= 180:
        risk_factors.append("High-value donor showing inactivity")
        risk_score += 20

    if risk_score >= 70:
        return ChurnRisk.CRITICAL, risk_factors
    elif risk_score >= 50:
        return ChurnRisk.HIGH, risk_factors
    elif risk_score >= 30:
        return ChurnRisk.MEDIUM, risk_factors
    else:
        return ChurnRisk.LOW, risk_factors

def get_recommended_action_advanced(risk_level: ChurnRisk, stage: LifecycleStageEnum) -> str:
    """Generate recommended action based on risk and stage"""
    actions = {
        (ChurnRisk.CRITICAL, LifecycleStageEnum.MAJOR): "URGENT: Personal call from Executive Director within 48 hours",
        (ChurnRisk.CRITICAL, LifecycleStageEnum.REPEAT): "High-touch re-engagement campaign, offer exclusive event invite",
        (ChurnRisk.HIGH, LifecycleStageEnum.MAJOR): "Schedule coffee meeting, share insider updates",
        (ChurnRisk.HIGH, LifecycleStageEnum.REPEAT): "Multi-channel re-engagement, highlight recent impact",
        (ChurnRisk.MEDIUM, LifecycleStageEnum.REPEAT): "Include in next newsletter, light touch",
    }
    return actions.get((risk_level, stage), "Standard stewardship communication")

def calculate_quadrant(strategy_score: float, investment_score: float) -> QuadrantType:
    """Determine quadrant based on scores"""
    high_strategy = strategy_score >= 5.0
    high_investment = investment_score >= 5.0

    if high_strategy and not high_investment:
        return QuadrantType.QUICK_WINS
    elif high_strategy and high_investment:
        return QuadrantType.BIG_BETS
    elif not high_strategy and not high_investment:
        return QuadrantType.FILL_INS
    else:
        return QuadrantType.MONEY_PITS

def get_quadrant_recommendation(quadrant: QuadrantType, initiative_count: int) -> str:
    """Generate recommendation based on quadrant"""
    recommendations = {
        QuadrantType.QUICK_WINS: f"High Priority! {initiative_count} initiatives offer strong strategic value with manageable investment. Execute these first.",
        QuadrantType.BIG_BETS: f"Strategic Focus: {initiative_count} initiatives require significant investment but align with strategy. Prioritize based on ROI.",
        QuadrantType.FILL_INS: f"Low Priority: {initiative_count} initiatives have limited strategic value. Consider deferring.",
        QuadrantType.MONEY_PITS: f"Caution! {initiative_count} initiatives require high investment with low strategic alignment. Reevaluate before proceeding."
    }
    return recommendations.get(quadrant, "Review carefully")

def get_initiative_recommendation(quadrant: QuadrantType) -> str:
    """Get specific recommendation for an initiative"""
    recommendations = {
        QuadrantType.QUICK_WINS: "Prioritize - Low investment, high strategic value",
        QuadrantType.BIG_BETS: "Evaluate ROI - High investment, high strategic value",
        QuadrantType.FILL_INS: "Consider deferring - Low value, low investment",
        QuadrantType.MONEY_PITS: "Reevaluate or cancel - High investment, low strategic value"
    }
    return recommendations.get(quadrant, "Review carefully")

# =====================================================================
# ADVANCED ANALYTICS - D3: DONOR LIFECYCLE ANALYTICS
# =====================================================================

@router.get("/advanced/donor-lifecycle/{organization_id}", response_model=LifecycleAnalyticsResponse)
def get_donor_lifecycle_analytics(
        organization_id: str,
        include_at_risk: bool = Query(True, description="Include at-risk donor details"),
        risk_threshold: ChurnRisk = Query(ChurnRisk.MEDIUM, description="Minimum risk level to include"),
        db: Session = Depends(get_db)
):
    """
    D3: Comprehensive Donor Lifecycle Analytics
    Features: Stage definitions, cohort retention, churn risk assessment, downloadable at-risk list
    """
    current_date = datetime.utcnow()

    donor_stats = db.query(
        models_bkp.Party.id.label('donor_id'),
        models_bkp.Party.display_name.label('donor_name'),
        func.count(models.Donation.id).label('donation_count'),
        func.max(models_bkp.Donation.donation_date).label('last_donation_date'),
        func.sum(models_bkp.Donation.amount).label('lifetime_value'),
        func.min(models_bkp.Donation.donation_date).label('first_donation_date')
    ).outerjoin(
        models.Donation, models_bkp.Party.id == models_bkp.Donation.party_id
    ).filter(
        models.Party.organization_id == organization_id
    ).group_by(
        models_bkp.Party.id, models_bkp.Party.display_name
    ).all()

    donors_by_stage = defaultdict(list)
    at_risk_donors = []

    for donor in donor_stats:
        days_since_last = (current_date - donor.last_donation_date).days if donor.last_donation_date else 999999

        if donor.donation_count > 1 and donor.first_donation_date and donor.last_donation_date:
            total_days = (donor.last_donation_date - donor.first_donation_date).days
            avg_frequency = total_days / (donor.donation_count - 1) if donor.donation_count > 1 else 0
        else:
            avg_frequency = 0

        stage = calculate_lifecycle_stage_advanced(
            donor.donation_count,
            donor.last_donation_date,
            donor.lifetime_value or 0,
            days_since_last
        )

        donors_by_stage[stage].append({
            'donor_id': donor.donor_id,
            'donor_name': donor.donor_name,
            'donation_count': donor.donation_count,
            'lifetime_value': donor.lifetime_value or 0,
            'days_since_last': days_since_last,
            'last_donation_date': donor.last_donation_date,
            'avg_frequency': avg_frequency
        })

        risk_level, risk_factors = calculate_churn_risk_advanced(
            days_since_last,
            donor.donation_count,
            avg_frequency,
            donor.lifetime_value or 0
        )

        risk_order = {ChurnRisk.LOW: 1, ChurnRisk.MEDIUM: 2, ChurnRisk.HIGH: 3, ChurnRisk.CRITICAL: 4}
        if include_at_risk and risk_order[risk_level] >= risk_order[risk_threshold]:
            email_query = db.query(models_bkp.ContactPoint.value).filter(
                models_bkp.ContactPoint.party_id == donor.donor_id,
                models.ContactPoint.type == 'email'
            ).first()

            at_risk_donors.append(DonorChurnRisk(
                donor_id=str(donor.donor_id),
                donor_name=donor.donor_name,
                email=email_query[0] if email_query else None,
                last_donation_date=donor.last_donation_date,
                days_since_last_donation=days_since_last,
                total_donations=donor.donation_count,
                lifetime_value=donor.lifetime_value or 0,
                current_stage=stage,
                risk_level=risk_level,
                risk_factors=risk_factors,
                recommended_action=get_recommended_action_advanced(risk_level, stage)
            ))

    risk_order_sort = {ChurnRisk.CRITICAL: 4, ChurnRisk.HIGH: 3, ChurnRisk.MEDIUM: 2, ChurnRisk.LOW: 1}
    at_risk_donors.sort(key=lambda x: (risk_order_sort[x.risk_level], x.lifetime_value), reverse=True)

    lifecycle_stages = []
    for stage in LifecycleStageEnum:
        donors_in_stage = donors_by_stage.get(stage, [])

        if donors_in_stage:
            avg_ltv = sum(d['lifetime_value'] for d in donors_in_stage) / len(donors_in_stage)
            avg_days = sum(d['days_since_last'] for d in donors_in_stage) / len(donors_in_stage)
        else:
            avg_ltv = 0
            avg_days = 0

        lifecycle_stages.append(DonorLifecycleStageDetailed(
            stage=stage,
            donor_count=len(donors_in_stage),
            avg_days_in_stage=round(avg_days, 1),
            avg_lifetime_value=round(avg_ltv, 2),
            conversion_rate=None,
            churn_rate=None
        ))

    cohort_analysis = []
    for year in range(current_date.year - 2, current_date.year + 1):
        cohort_donors = db.query(models_bkp.Party.id).join(
            models_bkp.Donation, models_bkp.Party.id == models_bkp.Donation.party_id
        ).filter(
            models_bkp.Party.organization_id == organization_id,
            extract('year', models_bkp.Donation.donation_date) == year
        ).group_by(models.Party.id).all()

        initial_count = len(cohort_donors)

        if initial_count > 0:
            cohort_analysis.append(CohortAnalysis(
                cohort_period=f"{year}",
                initial_count=initial_count,
                retained_month_1=0,
                retained_month_3=0,
                retained_month_6=0,
                retained_month_12=0,
                retention_rate_12m=0,
                avg_cohort_value=0
            ))

    total_donors = sum(len(donors) for donors in donors_by_stage.values())
    active_donors = len(donors_by_stage[LifecycleStageEnum.REPEAT]) + len(donors_by_stage[LifecycleStageEnum.MAJOR])

    summary_metrics = {
        "total_donors": total_donors,
        "active_donors": active_donors,
        "at_risk_count": len(at_risk_donors),
        "critical_risk_count": len([d for d in at_risk_donors if d.risk_level == ChurnRisk.CRITICAL]),
        "major_donors": len(donors_by_stage[LifecycleStageEnum.MAJOR]),
        "lapsed_donors": len(donors_by_stage[LifecycleStageEnum.LAPSED]),
        "lost_donors": len(donors_by_stage[LifecycleStageEnum.LOST]),
        "retention_rate": round(active_donors / total_donors * 100, 1) if total_donors > 0 else 0
    }

    return LifecycleAnalyticsResponse(
        organization_id=organization_id,
        snapshot_date=current_date,
        lifecycle_stages=lifecycle_stages,
        cohort_analysis=cohort_analysis,
        at_risk_donors=at_risk_donors[:100],
        summary_metrics=summary_metrics
    )

@router.get("/advanced/donor-lifecycle/{organization_id}/download-at-risk")
def download_at_risk_donors(
        organization_id: str,
        risk_threshold: ChurnRisk = Query(ChurnRisk.MEDIUM),
        db: Session = Depends(get_db)
):
    """Download at-risk donors as CSV"""
    analytics = get_donor_lifecycle_analytics(
        organization_id=organization_id,
        include_at_risk=True,
        risk_threshold=risk_threshold,
        db=db
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'Donor Name', 'Email', 'Last Donation Date', 'Days Since Last Donation',
        'Total Donations', 'Lifetime Value', 'Current Stage', 'Risk Level',
        'Risk Factors', 'Recommended Action'
    ])

    for donor in analytics.at_risk_donors:
        writer.writerow([
            donor.donor_name,
            donor.email or 'N/A',
            donor.last_donation_date.strftime('%Y-%m-%d') if donor.last_donation_date else 'Never',
            donor.days_since_last_donation,
            donor.total_donations,
            f"${donor.lifetime_value:,.2f}",
            donor.current_stage.value,
            donor.risk_level.value.upper(),
            '; '.join(donor.risk_factors),
            donor.recommended_action
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=at_risk_donors_{organization_id}_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )

# =====================================================================
# ADVANCED ANALYTICS - D4: MISSIONAL IMPACT CORRELATION
# =====================================================================

@router.get("/advanced/impact-correlation/{organization_id}", response_model=MissionalImpactResponse)
def get_missional_impact_correlation(
        organization_id: str,
        start_date: Optional[datetime] = Query(None),
        end_date: Optional[datetime] = Query(None),
        lag_months: int = Query(3, description="Months lag between funding and outcomes"),
        db: Session = Depends(get_db)
):
    """
    D4: Missional Impact Correlation Analysis
    Features: Configurable mapping of fundraising → outcomes, correlation & lag view, auto-generated Impact Summary
    """
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=365)

    outcome_start = start_date + timedelta(days=30 * lag_months)
    outcome_end = end_date + timedelta(days=30 * lag_months)

    programs = db.query(models_bkp.Program).filter(
        models_bkp.Program.organization_id == organization_id
    ).all()

    impact_mappings = []
    correlations = []
    total_investment = 0
    total_outcomes_count = 0

    assumptions = [
        f"Analysis period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
        f"Outcome lag: {lag_months} months (funding to impact realization)",
        "Only completed service events counted as outcomes",
        "Unit costs based on program configuration or calculated average",
        "Correlation strength based on funding-outcome consistency"
    ]

    for program in programs:
        funding = db.query(func.sum(models_bkp.DonationLine.amount)).join(
            models_bkp.Donation, models_bkp.DonationLine.donation_id == models_bkp.Donation.id
        ).filter(
            models.DonationLine.program_id == program.id,
            models_bkp.Donation.donation_date >= start_date,
            models.Donation.donation_date <= end_date
        ).scalar() or 0

        outcomes = db.query(
            func.count(models.ServiceEvent.id),
            func.sum(models_bkp.ServiceEvent.units_delivered)
        ).filter(
            models_bkp.ServiceEvent.program_id == program.id,
            models_bkp.ServiceEvent.date >= outcome_start,
            models_bkp.ServiceEvent.date <= outcome_end
        ).first()

        outcome_count = outcomes[0] or 0
        units_delivered = outcomes[1] or 0

        if funding > 0 or outcome_count > 0:
            unit_cost_planned = 25.0
            unit_cost_actual = funding / units_delivered if units_delivered > 0 else 0

            if unit_cost_actual > 0 and unit_cost_planned > 0:
                efficiency_ratio = unit_cost_planned / unit_cost_actual
                correlation_strength = 1.0 - min(abs(1.0 - efficiency_ratio), 1.0)
            else:
                efficiency_ratio = 0.0
                correlation_strength = 0.0

            correlations.append(ImpactCorrelation(
                program_id=str(program.id),
                program_name=program.description or program.code or "Unnamed Program",
                total_funding=round(float(funding), 2),
                total_outcomes=int(units_delivered),
                unit_cost_actual=round(unit_cost_actual, 2),
                unit_cost_planned=unit_cost_planned,
                efficiency_ratio=round(efficiency_ratio, 2),
                correlation_strength=round(correlation_strength, 2),
                lag_months=lag_months
            ))

            impact_mappings.append(ImpactMapping(
                program_id=str(program.id),
                program_name=program.description or program.code or "Unnamed Program",
                unit_cost=unit_cost_planned,
                outcome_unit="units",
                formula=f"${unit_cost_planned} = 1 unit"
            ))

            total_investment += float(funding)
            total_outcomes_count += units_delivered

    weighted_avg_unit_cost = total_investment / total_outcomes_count if total_outcomes_count > 0 else 0

    key_findings = []
    if correlations:
        best_performer = max(correlations, key=lambda x: x.efficiency_ratio)
        key_findings.append(f"Best efficiency: {best_performer.program_name} at ${best_performer.unit_cost_actual:.2f} per unit")

        strong_correlations = [c for c in correlations if c.correlation_strength >= 0.7]
        key_findings.append(f"{len(strong_correlations)} of {len(correlations)} programs show strong funding-outcome correlation")

        if total_outcomes_count > 0:
            key_findings.append(f"Overall: ${total_investment:,.2f} generated {total_outcomes_count:,.0f} outcome units")

    summary = ImpactSummary(
        total_investment=round(total_investment, 2),
        total_outcomes=int(total_outcomes_count),
        weighted_avg_unit_cost=round(weighted_avg_unit_cost, 2),
        programs_analyzed=len(correlations),
        assumptions=assumptions,
        key_findings=key_findings
    )

    return MissionalImpactResponse(
        organization_id=organization_id,
        analysis_period_start=start_date,
        analysis_period_end=end_date,
        impact_mappings=impact_mappings,
        correlations=correlations,
        summary=summary
    )

# =====================================================================
# ADVANCED ANALYTICS - D5: WISEINVESTOR 2x2 MATRIX
# =====================================================================

@router.post("/advanced/wise-investor/{organization_id}", response_model=WiseInvestor2x2Response)
def analyze_strategic_initiatives(
        organization_id: str,
        initiatives: List[StrategicInitiativeInput],
        db: Session = Depends(get_db)
):
    """
    D5: WiseInvestor 2x2 Analysis
    Features: Input form for initiatives, plotted quadrants with hover details, recommendation hints, export capability
    Quadrants: Quick Wins, Big Bets, Fill-Ins, Money Pits
    """
    org = db.query(models_bkp.Organization).filter(models.Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    quadrant_map = defaultdict(list)
    total_investment = 0

    for initiative in initiatives:
        quadrant = calculate_quadrant(
            initiative.strategic_alignment_score,
            initiative.investment_maturity_score
        )

        initiative.quadrant = quadrant
        initiative.recommendation = get_initiative_recommendation(quadrant)

        quadrant_map[quadrant].append(initiative)
        total_investment += initiative.estimated_cost

    quadrants = []
    for quadrant_type in QuadrantType:
        initiatives_in_quadrant = quadrant_map.get(quadrant_type, [])

        if initiatives_in_quadrant:
            total_cost = sum(i.estimated_cost for i in initiatives_in_quadrant)
            avg_alignment = sum(i.strategic_alignment_score for i in initiatives_in_quadrant) / len(initiatives_in_quadrant)

            quadrants.append(WiseInvestorQuadrant(
                quadrant=quadrant_type,
                initiatives=initiatives_in_quadrant,
                total_cost=round(total_cost, 2),
                average_alignment=round(avg_alignment, 1),
                recommendation=get_quadrant_recommendation(quadrant_type, len(initiatives_in_quadrant))
            ))

    quick_wins_count = len(quadrant_map[QuadrantType.QUICK_WINS])
    big_bets_count = len(quadrant_map[QuadrantType.BIG_BETS])
    money_pits_count = len(quadrant_map[QuadrantType.MONEY_PITS])

    strategic_summary = f"Portfolio Analysis: {quick_wins_count} Quick Wins, {big_bets_count} Big Bets, {money_pits_count} Money Pits. "
    if quick_wins_count > 0:
        strategic_summary += f"Prioritize Quick Wins for immediate strategic value. "
    if money_pits_count > 0:
        strategic_summary += f"⚠️ Review {money_pits_count} Money Pit initiatives."

    return WiseInvestor2x2Response(
        organization_id=organization_id,
        analysis_date=datetime.utcnow(),
        quadrants=quadrants,
        total_initiatives=len(initiatives),
        total_investment=round(total_investment, 2),
        strategic_summary=strategic_summary
    )

# =====================================================================
# EXECUTIVE DASHBOARD - PYDANTIC MODELS
# =====================================================================

class PeriodMetric(BaseModel):
    value: float
    variance_vs_prior: float
    variance_percentage: float
    trend: str  # up, down, flat

class StatusIndicator(str, Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"

class KPICard(BaseModel):
    title: str
    current_value: float
    target_value: Optional[float] = None
    unit: str  # $, #, %
    status: StatusIndicator
    variance_vs_target: Optional[float] = None
    variance_percentage: Optional[float] = None
    trend: str  # ↑, ↓, →
    period: str  # YTD, QTD, MTD
    context: str

class KeyResult(BaseModel):
    kr_id: str
    description: str
    target_value: float
    current_value: float
    progress_percentage: float
    status: StatusIndicator
    owner: str
    due_date: date
    unit: str

class Objective(BaseModel):
    objective_id: str
    title: str
    description: str
    owner: str
    start_date: date
    end_date: date
    status: StatusIndicator
    progress_percentage: float
    key_results: List[KeyResult]
    linked_initiatives: List[str]

class OKRResponse(BaseModel):
    organization_id: str
    period: str  # Q1 2025, 2025, etc.
    objectives: List[Objective]
    overall_progress: float
    on_track_count: int
    at_risk_count: int
    off_track_count: int

class ScorecardMetric(BaseModel):
    category: str
    metric_name: str
    current_value: float
    target_value: float
    unit: str
    status: StatusIndicator
    variance: float
    variance_percentage: float
    notes: Optional[str] = None

class ScorecardSection(BaseModel):
    section_name: str
    overall_status: StatusIndicator
    metrics: List[ScorecardMetric]

class ExecutiveScorecardResponse(BaseModel):
    organization_id: str
    reporting_period: str
    as_of_date: datetime
    overall_health_score: float  # 0-100
    overall_status: StatusIndicator
    sections: List[ScorecardSection]
    executive_summary: str
    key_wins: List[str]
    areas_of_concern: List[str]

class HeroNumber(BaseModel):
    label: str
    value: float
    unit: str
    change_vs_prior: float
    change_percentage: float
    status: StatusIndicator

class ExecutiveDashboardResponse(BaseModel):
    organization_id: str
    as_of_date: datetime
    reporting_period: str
    hero_numbers: List[HeroNumber]
    revenue_snapshot: Dict[str, Any]
    donor_activity: Dict[str, Any]
    mission_impact: Dict[str, Any]
    strategic_progress: Dict[str, Any]
    top_alerts: List[Dict[str, Any]]
    board_narrative: str

# =====================================================================
# EXECUTIVE DASHBOARD - HELPER FUNCTIONS
# =====================================================================

def get_period_dates(period: str = "YTD") -> tuple[datetime, datetime]:
    """Get start and end dates for reporting period"""
    now = datetime.now()

    if period == "MTD":
        start = datetime(now.year, now.month, 1)
        end = now
    elif period == "QTD":
        quarter = (now.month - 1) // 3 + 1
        start_month = (quarter - 1) * 3 + 1
        start = datetime(now.year, start_month, 1)
        end = now
    elif period == "YTD":
        start = datetime(now.year, 1, 1)
        end = now
    else:  # Full year
        start = datetime(now.year, 1, 1)
        end = datetime(now.year, 12, 31)

    return start, end

def calculate_status(current: float, target: float, tolerance: float = 0.1) -> StatusIndicator:
    """Calculate RAG status based on current vs target"""
    if target == 0:
        return StatusIndicator.GREEN if current > 0 else StatusIndicator.RED

    variance_pct = (current - target) / target

    if variance_pct >= -tolerance:
        return StatusIndicator.GREEN
    elif variance_pct >= -2 * tolerance:
        return StatusIndicator.AMBER
    else:
        return StatusIndicator.RED

def get_trend_arrow(current: float, prior: float) -> str:
    """Get trend arrow indicator"""
    if prior == 0:
        return "→"

    change_pct = (current - prior) / prior

    if change_pct > 0.02:
        return "↑"
    elif change_pct < -0.02:
        return "↓"
    else:
        return "→"

def calculate_health_score(metrics: List[ScorecardMetric]) -> float:
    """Calculate overall organizational health score (0-100)"""
    if not metrics:
        return 0.0

    total_score = 0
    for metric in metrics:
        if metric.status == StatusIndicator.GREEN:
            total_score += 100
        elif metric.status == StatusIndicator.AMBER:
            total_score += 60
        else:  # RED
            total_score += 30

    return round(total_score / len(metrics), 1)

# =====================================================================
# EXECUTIVE DASHBOARD - MAIN ENDPOINT
# =====================================================================

@router.get("/executive-dashboard/{organization_id}", response_model=ExecutiveDashboardResponse)
def get_executive_dashboard(
        organization_id: str,
        period: str = Query("YTD", regex="^(MTD|QTD|YTD|YEAR)$"),
        db: Session = Depends(get_db)
):
    """
    Consolidated executive dashboard with all key metrics for C-suite
    Single API call for complete leadership overview
    """
    org = db.query(models.Organization).filter(models_bkp.Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    start_date, end_date = get_period_dates(period)

    # Calculate prior period for comparisons
    period_days = (end_date - start_date).days
    prior_start = start_date - timedelta(days=period_days)
    prior_end = start_date - timedelta(days=1)

    # ==================== REVENUE SNAPSHOT ====================
    current_revenue = db.query(func.sum(models_bkp.Donation.amount)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start_date,
        models_bkp.Donation.donation_date <= end_date
    ).scalar() or 0

    prior_revenue = db.query(func.sum(models.Donation.amount)).filter(
        models_bkp.Donation.organization_id == organization_id,
        models.Donation.donation_date >= prior_start,
        models.Donation.donation_date <= prior_end
    ).scalar() or 0

    revenue_variance = float(current_revenue) - float(prior_revenue)
    revenue_variance_pct = (revenue_variance / float(prior_revenue) * 100) if prior_revenue > 0 else 0

    # Revenue by source
    online_revenue = float(current_revenue) * 0.35
    major_gifts = db.query(func.sum(models_bkp.Donation.amount)).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= start_date,
        models_bkp.Donation.donation_date <= end_date,
        models_bkp.Donation.amount >= 1000
    ).scalar() or 0

    # ==================== DONOR ACTIVITY ====================
    active_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= start_date,
        models_bkp.Donation.donation_date <= end_date
    ).scalar() or 0

    prior_active_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= prior_start,
        models_bkp.Donation.donation_date <= prior_end
    ).scalar() or 0

    donor_variance = active_donors - prior_active_donors
    donor_variance_pct = (donor_variance / prior_active_donors * 100) if prior_active_donors > 0 else 0

    new_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models_bkp.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= start_date,
        models_bkp.Donation.donation_date <= end_date,
        models.Donation.party_id.in_(
            db.query(models_bkp.Donation.party_id).filter(
                models.Donation.organization_id == organization_id
            ).group_by(models_bkp.Donation.party_id).having(
                func.min(models.Donation.donation_date) >= start_date
            )
        )
    ).scalar() or 0

    avg_gift = float(current_revenue) / active_donors if active_donors > 0 else 0

    # ==================== MISSION IMPACT ====================
    total_beneficiaries = db.query(func.count(func.distinct(models_bkp.ServiceBeneficiary.beneficiary_id))).filter(
        models_bkp.ServiceBeneficiary.service_event_id.in_(
            db.query(models.ServiceEvent.id).filter(
                models_bkp.ServiceEvent.organization_id == organization_id,
                models.ServiceEvent.date >= start_date,
                models.ServiceEvent.date <= end_date
            )
        )
    ).scalar() or 0

    prior_beneficiaries = db.query(func.count(func.distinct(models.ServiceBeneficiary.beneficiary_id))).filter(
        models_bkp.ServiceBeneficiary.service_event_id.in_(
            db.query(models_bkp.ServiceEvent.id).filter(
                models_bkp.ServiceEvent.organization_id == organization_id,
                models.ServiceEvent.date >= prior_start,
                models.ServiceEvent.date <= prior_end
            )
        )
    ).scalar() or 0

    impact_variance = total_beneficiaries - prior_beneficiaries
    impact_variance_pct = (impact_variance / prior_beneficiaries * 100) if prior_beneficiaries > 0 else 0

    programs_active = db.query(func.count(func.distinct(models.ServiceEvent.program_id))).filter(
        models_bkp.ServiceEvent.organization_id == organization_id,
        models_bkp.ServiceEvent.date >= start_date,
        models_bkp.ServiceEvent.date <= end_date
    ).scalar() or 0

    # ==================== STRATEGIC PROGRESS ====================
    # Simplified - would integrate with OKR system
    initiatives_on_track = 3
    initiatives_total = 5
    strategic_progress_pct = (initiatives_on_track / initiatives_total * 100) if initiatives_total > 0 else 0

    # ==================== HERO NUMBERS ====================
    hero_numbers = [
        HeroNumber(
            label="Total Revenue",
            value=round(float(current_revenue), 2),
            unit="$",
            change_vs_prior=round(revenue_variance, 2),
            change_percentage=round(revenue_variance_pct, 1),
            status=calculate_status(float(current_revenue), float(prior_revenue) * 1.05)
        ),
        HeroNumber(
            label="Active Donors",
            value=active_donors,
            unit="#",
            change_vs_prior=donor_variance,
            change_percentage=round(donor_variance_pct, 1),
            status=calculate_status(active_donors, prior_active_donors * 1.02)
        ),
        HeroNumber(
            label="People Served",
            value=total_beneficiaries,
            unit="#",
            change_vs_prior=impact_variance,
            change_percentage=round(impact_variance_pct, 1),
            status=calculate_status(total_beneficiaries, prior_beneficiaries * 1.0)
        ),
        HeroNumber(
            label="Average Gift",
            value=round(avg_gift, 2),
            unit="$",
            change_vs_prior=0,
            change_percentage=0,
            status=StatusIndicator.GREEN
        )
    ]

    # ==================== TOP ALERTS ====================
    top_alerts = []

    if revenue_variance_pct < -10:
        top_alerts.append({
            "severity": "high",
            "category": "revenue",
            "message": f"Revenue down {abs(revenue_variance_pct):.1f}% vs prior period",
            "action": "Review fundraising strategy and donor engagement"
        })

    if donor_variance_pct < -5:
        top_alerts.append({
            "severity": "medium",
            "category": "donors",
            "message": f"Active donor count declining ({donor_variance_pct:.1f}%)",
            "action": "Activate donor retention campaigns"
        })

    # ==================== BOARD NARRATIVE ====================
    board_narrative = f"""
    <strong>Executive Summary - {period} {end_date.year}</strong><br><br>
    
    <strong>Financial Performance:</strong> Raised ${float(current_revenue):,.0f} ({revenue_variance_pct:+.1f}% vs prior period). 
    Major gifts (≥$1k) contributed ${float(major_gifts):,.0f}. {new_donors} new donors acquired.<br><br>
    
    <strong>Mission Impact:</strong> Served {total_beneficiaries:,} beneficiaries across {programs_active} active programs 
    ({impact_variance_pct:+.1f}% vs prior period).<br><br>
    
    <strong>Strategic Progress:</strong> {initiatives_on_track} of {initiatives_total} strategic initiatives on track ({strategic_progress_pct:.0f}%).
    """

    return ExecutiveDashboardResponse(
        organization_id=organization_id,
        as_of_date=datetime.now(),
        reporting_period=period,
        hero_numbers=hero_numbers,
        revenue_snapshot={
            "total_revenue": round(float(current_revenue), 2),
            "variance_vs_prior": round(revenue_variance, 2),
            "variance_percentage": round(revenue_variance_pct, 1),
            "online_revenue": round(online_revenue, 2),
            "major_gifts": round(float(major_gifts), 2),
            "monthly_recurring": 0,  # Would need recurring gift tracking
            "status": calculate_status(float(current_revenue), float(prior_revenue) * 1.05).value
        },
        donor_activity={
            "active_donors": active_donors,
            "new_donors": new_donors,
            "retention_rate": 0,  # Would calculate from retention logic
            "avg_gift": round(avg_gift, 2),
            "variance_vs_prior": donor_variance,
            "variance_percentage": round(donor_variance_pct, 1),
            "status": calculate_status(active_donors, prior_active_donors * 1.02).value
        },
        mission_impact={
            "beneficiaries_served": total_beneficiaries,
            "programs_active": programs_active,
            "variance_vs_prior": impact_variance,
            "variance_percentage": round(impact_variance_pct, 1),
            "status": StatusIndicator.GREEN.value
        },
        strategic_progress={
            "initiatives_on_track": initiatives_on_track,
            "initiatives_total": initiatives_total,
            "progress_percentage": round(strategic_progress_pct, 1),
            "status": calculate_status(initiatives_on_track, initiatives_total * 0.8).value
        },
        top_alerts=top_alerts,
        board_narrative=board_narrative
    )

# =====================================================================
# OKR TRACKING SYSTEM
# =====================================================================

@router.get("/okrs/{organization_id}", response_model=OKRResponse)
def get_okrs(
        organization_id: str,
        period: str = Query("2025", description="Period like 'Q1 2025' or '2025'"),
        db: Session = Depends(get_db)
):
    """
    OKR (Objectives & Key Results) tracking system
    Structured goals with measurable key results
    """
    org = db.query(models.Organization).filter(models_bkp.Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Sample OKRs - would be stored in database
    objectives = [
        Objective(
            objective_id="OKR-2025-1",
            title="Diversify Revenue Streams",
            description="Reduce reliance on single funding source and build sustainable revenue model",
            owner="CFO",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            status=StatusIndicator.GREEN,
            progress_percentage=45.0,
            key_results=[
                KeyResult(
                    kr_id="KR-1.1",
                    description="Launch monthly giving program with 200 subscribers",
                    target_value=200,
                    current_value=87,
                    progress_percentage=43.5,
                    status=StatusIndicator.AMBER,
                    owner="Development Director",
                    due_date=date(2025, 6, 30),
                    unit="subscribers"
                ),
                KeyResult(
                    kr_id="KR-1.2",
                    description="Secure 5 new corporate partnerships totaling $150k",
                    target_value=150000,
                    current_value=85000,
                    progress_percentage=56.7,
                    status=StatusIndicator.GREEN,
                    owner="Partnerships Manager",
                    due_date=date(2025, 9, 30),
                    unit="$"
                ),
                KeyResult(
                    kr_id="KR-1.3",
                    description="Grow online revenue to 40% of total",
                    target_value=40.0,
                    current_value=35.0,
                    progress_percentage=87.5,
                    status=StatusIndicator.GREEN,
                    owner="Digital Marketing Manager",
                    due_date=date(2025, 12, 31),
                    unit="%"
                )
            ],
            linked_initiatives=["1", "2"]
        ),
        Objective(
            objective_id="OKR-2025-2",
            title="Scale Mission Impact",
            description="Increase beneficiaries served while maintaining quality outcomes",
            owner="Chief Program Officer",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            status=StatusIndicator.GREEN,
            progress_percentage=62.0,
            key_results=[
                KeyResult(
                    kr_id="KR-2.1",
                    description="Serve 5,000 beneficiaries (20% increase)",
                    target_value=5000,
                    current_value=3100,
                    progress_percentage=62.0,
                    status=StatusIndicator.GREEN,
                    owner="Program Director",
                    due_date=date(2025, 12, 31),
                    unit="#"
                ),
                KeyResult(
                    kr_id="KR-2.2",
                    description="Achieve 85% program satisfaction score",
                    target_value=85.0,
                    current_value=82.0,
                    progress_percentage=96.5,
                    status=StatusIndicator.AMBER,
                    owner="Quality Manager",
                    due_date=date(2025, 12, 31),
                    unit="%"
                )
            ],
            linked_initiatives=[]
        ),
        Objective(
            objective_id="OKR-2025-3",
            title="Strengthen Donor Engagement",
            description="Build deeper relationships with existing donors and improve retention",
            owner="Chief Development Officer",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            status=StatusIndicator.AMBER,
            progress_percentage=38.0,
            key_results=[
                KeyResult(
                    kr_id="KR-3.1",
                    description="Achieve 80% donor retention rate",
                    target_value=80.0,
                    current_value=67.8,
                    progress_percentage=84.8,
                    status=StatusIndicator.AMBER,
                    owner="Donor Relations Manager",
                    due_date=date(2025, 12, 31),
                    unit="%"
                ),
                KeyResult(
                    kr_id="KR-3.2",
                    description="Move 50 donors to mid-level ($1k+)",
                    target_value=50,
                    current_value=12,
                    progress_percentage=24.0,
                    status=StatusIndicator.RED,
                    owner="Major Gifts Officer",
                    due_date=date(2025, 10, 31),
                    unit="#"
                )
            ],
            linked_initiatives=[]
        )
    ]

    # Calculate summary
    on_track = len([o for o in objectives if o.status == StatusIndicator.GREEN])
    at_risk = len([o for o in objectives if o.status == StatusIndicator.AMBER])
    off_track = len([o for o in objectives if o.status == StatusIndicator.RED])

    total_progress = sum(o.progress_percentage for o in objectives) / len(objectives) if objectives else 0

    return OKRResponse(
        organization_id=organization_id,
        period=period,
        objectives=objectives,
        overall_progress=round(total_progress, 1),
        on_track_count=on_track,
        at_risk_count=at_risk,
        off_track_count=off_track
    )

@router.post("/okrs/{organization_id}/objectives")
def create_objective(
        organization_id: str,
        objective: Objective,
        db: Session = Depends(get_db)
):
    """Create a new objective with key results"""
    # Would store in database
    return {
        "message": "Objective created successfully",
        "objective_id": objective.objective_id
    }

@router.put("/okrs/{organization_id}/objectives/{objective_id}/key-results/{kr_id}")
def update_key_result_progress(
        organization_id: str,
        objective_id: str,
        kr_id: str,
        current_value: float,
        db: Session = Depends(get_db)
):
    """Update progress on a key result"""
    # Would update in database
    return {
        "message": "Key result updated successfully",
        "kr_id": kr_id,
        "current_value": current_value
    }

# =====================================================================
# EXECUTIVE SCORECARD
# =====================================================================

@router.get("/executive-scorecard/{organization_id}", response_model=ExecutiveScorecardResponse)
def get_executive_scorecard(
        organization_id: str,
        period: str = Query("YTD", regex="^(MTD|QTD|YTD)$"),
        db: Session = Depends(get_db)
):
    """
    Comprehensive executive scorecard with RAG status
    Board-ready format with all key metrics and narrative
    """
    org = db.query(models_bkp.Organization).filter(models_bkp.Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    start_date, end_date = get_period_dates(period)

    # Get actual values
    current_revenue = float(db.query(func.sum(models_bkp.Donation.amount)).filter(
        models.Donation.organization_id == organization_id,
        models.Donation.donation_date >= start_date,
        models.Donation.donation_date <= end_date
    ).scalar() or 0)

    active_donors = db.query(func.count(func.distinct(models_bkp.Donation.party_id))).filter(
        models.Donation.organization_id == organization_id,
        models_bkp.Donation.donation_date >= start_date,
        models.Donation.donation_date <= end_date
    ).scalar() or 0

    total_beneficiaries = db.query(func.count(func.distinct(models_bkp.ServiceBeneficiary.beneficiary_id))).filter(
        models_bkp.ServiceBeneficiary.service_event_id.in_(
            db.query(models.ServiceEvent.id).filter(
                models_bkp.ServiceEvent.organization_id == organization_id,
                models.ServiceEvent.date >= start_date,
                models_bkp.ServiceEvent.date <= end_date
            )
        )
    ).scalar() or 0

    # Build scorecard sections
    sections = []

    # FINANCIAL PERFORMANCE
    financial_metrics = [
        ScorecardMetric(
            category="Revenue",
            metric_name="Total Revenue YTD",
            current_value=current_revenue,
            target_value=500000,
            unit="$",
            status=calculate_status(current_revenue, 500000, tolerance=0.1),
            variance=current_revenue - 500000,
            variance_percentage=((current_revenue - 500000) / 500000 * 100) if 500000 > 0 else 0,
            notes="Tracking slightly behind plan"
        ),
        ScorecardMetric(
            category="Revenue",
            metric_name="Major Gifts ($1k+)",
            current_value=45,
            target_value=50,
            unit="#",
            status=StatusIndicator.AMBER,
            variance=-5,
            variance_percentage=-10.0,
            notes="Need to accelerate major gift pipeline"
        ),
        ScorecardMetric(
            category="Diversification",
            metric_name="Online Revenue %",
            current_value=35.0,
            target_value=40.0,
            unit="%",
            status=StatusIndicator.AMBER,
            variance=-5.0,
            variance_percentage=-12.5
        )
    ]

    sections.append(ScorecardSection(
        section_name="Financial Performance",
        overall_status=StatusIndicator.AMBER,
        metrics=financial_metrics
    ))

    # DONOR ENGAGEMENT
    donor_metrics = [
        ScorecardMetric(
            category="Donors",
            metric_name="Active Donors",
            current_value=float(active_donors),
            target_value=850.0,
            unit="#",
            status=calculate_status(float(active_donors), 850, tolerance=0.05),
            variance=float(active_donors) - 850,
            variance_percentage=((active_donors - 850) / 850 * 100) if 850 > 0 else 0
        ),
        ScorecardMetric(
            category="Retention",
            metric_name="Donor Retention Rate",
            current_value=67.8,
            target_value=75.0,
            unit="%",
            status=StatusIndicator.AMBER,
            variance=-7.2,
            variance_percentage=-9.6,
            notes="Below industry benchmark"
        ),
        ScorecardMetric(
            category="Acquisition",
            metric_name="New Donors",
            current_value=145.0,
            target_value=150.0,
            unit="#",
            status=StatusIndicator.GREEN,
            variance=-5.0,
            variance_percentage=-3.3
        )
    ]

    sections.append(ScorecardSection(
        section_name="Donor Engagement",
        overall_status=StatusIndicator.AMBER,
        metrics=donor_metrics
    ))

    # MISSION IMPACT
    impact_metrics = [
        ScorecardMetric(
            category="Impact",
            metric_name="Beneficiaries Served",
            current_value=float(total_beneficiaries),
            target_value=3000.0,
            unit="#",
            status=calculate_status(float(total_beneficiaries), 3000, tolerance=0.1),
            variance=float(total_beneficiaries) - 3000,
            variance_percentage=((total_beneficiaries - 3000) / 3000 * 100) if 3000 > 0 else 0
        ),
        ScorecardMetric(
            category="Quality",
            metric_name="Program Satisfaction",
            current_value=82.0,
            target_value=85.0,
            unit="%",
            status=StatusIndicator.AMBER,
            variance=-3.0,
            variance_percentage=-3.5
        ),
        ScorecardMetric(
            category="Efficiency",
            metric_name="Cost Per Outcome",
            current_value=125.0,
            target_value=120.0,
            unit="$",
            status=StatusIndicator.AMBER,
            variance=5.0,
            variance_percentage=4.2,
            notes="Slightly above target"
        )
    ]

    sections.append(ScorecardSection(
        section_name="Mission Impact",
        overall_status=StatusIndicator.AMBER,
        metrics=impact_metrics
    ))

    # STRATEGIC INITIATIVES
    strategic_metrics = [
        ScorecardMetric(
            category="OKRs",
            metric_name="Objectives On Track",
            current_value=3.0,
            target_value=5.0,
            unit="#",
            status=StatusIndicator.AMBER,
            variance=-2.0,
            variance_percentage=-40.0
        ),
        ScorecardMetric(
            category="Progress",
            metric_name="Overall Strategic Progress",
            current_value=48.3,
            target_value=60.0,
            unit="%",
            status=StatusIndicator.AMBER,
            variance=-11.7,
            variance_percentage=-19.5
        )
    ]

    sections.append(ScorecardSection(
        section_name="Strategic Progress",
        overall_status=StatusIndicator.AMBER,
        metrics=strategic_metrics
    ))

    # Calculate overall health score
    all_metrics = []
    for section in sections:
        all_metrics.extend(section.metrics)

    health_score = calculate_health_score(all_metrics)

    # Determine overall status
    if health_score >= 80:
        overall_status = StatusIndicator.GREEN
    elif health_score >= 60:
        overall_status = StatusIndicator.AMBER
    else:
        overall_status = StatusIndicator.RED

    # Generate insights
    key_wins = [
        "New donor acquisition exceeding target",
        "Program delivery on pace with annual goals",
        "Corporate partnership pipeline growing"
    ]

    areas_of_concern = [
        "Donor retention below 75% threshold - immediate action needed",
        "Revenue tracking 8% behind annual plan",
        "Strategic initiative progress slower than expected"
    ]

    executive_summary = f"""
    <strong>Overall Health Score: {health_score}/100 - {overall_status.value.upper()}</strong><br><br>
    
    The organization is performing adequately with notable strengths in mission delivery and new donor acquisition. 
    However, donor retention and revenue growth require immediate attention. Strategic initiatives are progressing 
    but need acceleration to meet annual objectives. Financial sustainability remains stable with diversification 
    efforts underway. Recommend focusing on retention strategies and major gift pipeline development in Q2.
    """

    return ExecutiveScorecardResponse(
        organization_id=organization_id,
        reporting_period=period,
        as_of_date=datetime.now(),
        overall_health_score=health_score,
        overall_status=overall_status,
        sections=sections,
        executive_summary=executive_summary,
        key_wins=key_wins,
        areas_of_concern=areas_of_concern
    )

# =====================================================================
# ADDITIONAL EXECUTIVE ENDPOINTS
# =====================================================================

@router.get("/executive-summary/{organization_id}")
def get_executive_summary(
        organization_id: str,
        period: str = Query("YTD"),
        format: str = Query("html", regex="^(html|json|pdf)$"),
        db: Session = Depends(get_db)
):
    """
    Generate executive summary for board meetings
    Available in HTML, JSON, or PDF format
    """
    scorecard = get_executive_scorecard(organization_id, period, db)

    if format == "json":
        return scorecard
    elif format == "html":
        return {
            "organization_id": organization_id,
            "format": "html",
            "content": scorecard.executive_summary,
            "health_score": scorecard.overall_health_score,
            "status": scorecard.overall_status.value
        }
    else:  # PDF
        return {
            "message": "PDF generation not yet implemented",
            "download_url": f"/executive-summary/{organization_id}.pdf"
        }

@router.get("/kpi-trends/{organization_id}")
def get_kpi_trends(
        organization_id: str,
        months: int = Query(12, ge=3, le=24),
        db: Session = Depends(get_db)
):
    """
    Historical trends for key KPIs
    Shows month-over-month progression
    """
    trends = []

    for i in range(months):
        month_start = datetime.now() - timedelta(days=30 * (months - i))
        month_end = month_start + timedelta(days=30)

        revenue = float(db.query(func.sum(models_bkp.Donation.amount)).filter(
            models.Donation.organization_id == organization_id,
            models.Donation.donation_date >= month_start,
            models_bkp.Donation.donation_date < month_end
        ).scalar() or 0)

        donors = db.query(func.count(func.distinct(models.Donation.party_id))).filter(
            models_bkp.Donation.organization_id == organization_id,
            models.Donation.donation_date >= month_start,
            models.Donation.donation_date < month_end
        ).scalar() or 0

        trends.append({
            "month": month_start.strftime("%Y-%m"),
            "revenue": round(revenue, 2),
            "donors": donors,
            "avg_gift": round(revenue / donors, 2) if donors > 0 else 0
        })

    return {
        "organization_id": organization_id,
        "period": f"{months} months",
        "trends": trends
    }

# =====================================================================
# END OF COMPREHENSIVE MERGED ANALYTICS MODULE
# =====================================================================
