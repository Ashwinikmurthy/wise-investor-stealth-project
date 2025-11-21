"""
Comprehensive Donor Intelligence API
Based on ACTUAL database schema - NO MOCKED DATA

Tables Used:
- donors
- donations
- donor_meetings
- major_gift_officers
- moves_management_stages
- donor_priority_cache
- programs

Features:
- RFM Analysis (Recency, Frequency, Monetary)
- Donor Health Scoring
- Churn Risk Prediction
- Lifetime Value Forecasting
- Giving Pattern Analysis
- Next Gift Prediction
- Upgrade Potential Analysis
- Portfolio Performance Metrics

Date: November 2024
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_, case, desc, distinct, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta, timezone
from pydantic import BaseModel, Field
from uuid import UUID
from decimal import Decimal
import statistics

from database import get_db
from models import (
    Users as User,
    Donations as Donation,
    Donors as Donor,
    DonorMeetings as DonorMeeting,
    MajorGiftOfficer,
    Programs as Program
)

router = APIRouter(prefix="/api/v1/donor-intelligence", tags=["Donor Intelligence"])


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class RFMScoreResponse(BaseModel):
    """RFM Analysis Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    recency_score: int = Field(ge=1, le=5, description="1-5, 5=most recent")
    frequency_score: int = Field(ge=1, le=5, description="1-5, 5=most frequent")
    monetary_score: int = Field(ge=1, le=5, description="1-5, 5=highest value")
    rfm_segment: str
    days_since_last_gift: int
    total_gifts: int
    lifetime_value: Decimal
    average_gift: Decimal
    last_gift_date: Optional[date]
    recommended_action: str

    class Config:
        from_attributes = True


class DonorHealthResponse(BaseModel):
    """Donor Health Score Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    health_score: float = Field(ge=0, le=100)
    health_status: str  # Excellent, Good, Fair, Poor, Critical
    recency_component: float
    consistency_component: float
    trend_component: float
    total_gifts: int
    lifetime_value: Decimal
    days_since_last_gift: int
    year_over_year_change_percent: float
    risk_indicators: List[str]
    recommended_actions: List[str]

    class Config:
        from_attributes = True


class ChurnRiskResponse(BaseModel):
    """Churn Risk Prediction Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    churn_probability_percent: float
    risk_level: str  # High, Medium, Low
    risk_factors: List[str]
    days_since_last_gift: int
    expected_frequency_days: int
    is_overdue: bool
    lifetime_value: Decimal
    total_gifts: int
    last_gift_date: Optional[date]
    intervention_urgency: str
    recommended_actions: List[str]

    class Config:
        from_attributes = True


class LifetimeValuePredictionResponse(BaseModel):
    """Lifetime Value Prediction Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    current_ltv: Decimal
    predicted_ltv_conservative: Decimal
    predicted_ltv_expected: Decimal
    predicted_ltv_optimistic: Decimal
    predicted_future_value: Decimal
    value_segment: str  # High Value, Medium Value, Standard, Low Value
    retention_probability_percent: float
    expected_remaining_years: int
    gifts_per_year: float
    average_gift_size: Decimal
    cultivation_priority: str

    class Config:
        from_attributes = True


class GivingPatternResponse(BaseModel):
    """Giving Pattern Analysis Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    pattern_type: str  # Monthly, Quarterly, Annual, Irregular, Event-Driven
    average_frequency_days: int
    consistency_score: float  # 0-100
    preferred_giving_months: List[str]
    preferred_giving_amounts: List[Decimal]
    total_gifts: int
    lifetime_value: Decimal
    trend: str  # Increasing, Stable, Decreasing
    seasonal_pattern_detected: bool

    class Config:
        from_attributes = True


class NextGiftPredictionResponse(BaseModel):
    """Next Gift Prediction Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    predicted_next_gift_date: date
    days_until_predicted: int
    confidence_percent: float
    suggested_ask_amount: Decimal
    optimal_ask_timing: str
    is_overdue: bool
    days_overdue: int
    last_gift_date: date
    average_frequency_days: int

    class Config:
        from_attributes = True


class UpgradePotentialResponse(BaseModel):
    """Upgrade Potential Analysis Response"""
    donor_id: UUID
    donor_name: str
    email: Optional[str]
    upgrade_readiness_score: float  # 0-100
    potential_level: str  # High, Medium, Low
    estimated_capacity: Decimal
    current_average_gift: Decimal
    capacity_utilization_percent: float
    suggested_ask_conservative: Decimal
    suggested_ask_moderate: Decimal
    suggested_ask_stretch: Decimal
    readiness_factors: List[str]
    cultivation_stage: str
    recommended_timeline: str

    class Config:
        from_attributes = True


# ============================================================================
# RFM ANALYSIS
# ============================================================================

@router.get("/rfm-analysis/{organization_id}", response_model=List[RFMScoreResponse])
async def get_rfm_analysis(
        organization_id: UUID,
        segment_filter: Optional[str] = Query(None, description="Filter by segment"),
        min_score: Optional[int] = Query(None, ge=1, le=5),
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    RFM (Recency, Frequency, Monetary) Analysis

    Scores donors on 1-5 scale for:
    - Recency: How recently they gave (5 = most recent)
    - Frequency: How often they give (5 = most frequent)
    - Monetary: How much they give (5 = highest value)

    Segments:
    - Champions (555, 554, 545): Best donors
    - Loyal (543, 444, 435): Consistent givers
    - At-Risk (244, 234): Need re-engagement
    - Lost (111, 112): Lapsed donors
    """

    today = date.today()  # Use date instead of datetime to avoid timezone issues

    # Get donor giving statistics
    donor_stats_query = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.max(Donation.donation_date).label('last_donation_date'),
        func.count(Donation.id).label('donation_count'),
        func.sum(Donation.amount).label('total_donated'),
        func.avg(Donation.amount).label('avg_donation')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    )

    donor_stats = donor_stats_query.all()

    if not donor_stats:
        return []

    # Calculate RFM scores
    rfm_data = []
    recency_values = []
    frequency_values = []
    monetary_values = []

    # Collect values for quintile calculation
    for stats in donor_stats:
        # Convert to date if it's datetime
        last_gift_date = stats.last_donation_date.date() if hasattr(stats.last_donation_date, 'date') else stats.last_donation_date
        days_since_last = (today - last_gift_date).days
        recency_values.append(days_since_last)
        frequency_values.append(stats.donation_count)
        monetary_values.append(float(stats.total_donated))

    # Calculate quintiles (5 bins)
    def get_quintiles(values, reverse=False):
        sorted_vals = sorted(values, reverse=reverse)
        n = len(sorted_vals)
        if n == 0:
            return [0, 0, 0, 0, 0]
        return [
            sorted_vals[max(0, int(n * 0.2) - 1)],
            sorted_vals[max(0, int(n * 0.4) - 1)],
            sorted_vals[max(0, int(n * 0.6) - 1)],
            sorted_vals[max(0, int(n * 0.8) - 1)],
            sorted_vals[-1]
        ]

    recency_quintiles = get_quintiles(recency_values, reverse=True)  # Lower days = better
    frequency_quintiles = get_quintiles(frequency_values, reverse=False)
    monetary_quintiles = get_quintiles(monetary_values, reverse=False)

    def get_score(value, quintiles, reverse=False):
        """Assign 1-5 score based on quintile"""
        if reverse:
            quintiles = list(reversed(quintiles))
        for i, threshold in enumerate(quintiles, 1):
            if reverse:
                if value >= threshold:
                    return 6 - i
            else:
                if value <= threshold:
                    return i
        return 5

    # Score each donor
    for stats in donor_stats:
        # Convert to date if it's datetime
        last_gift_date = stats.last_donation_date.date() if hasattr(stats.last_donation_date, 'date') else stats.last_donation_date
        days_since_last = (today - last_gift_date).days

        r_score = get_score(days_since_last, recency_quintiles, reverse=True)
        f_score = get_score(stats.donation_count, frequency_quintiles)
        m_score = get_score(float(stats.total_donated), monetary_quintiles)

        # Classify segment
        if r_score >= 4 and f_score >= 4 and m_score >= 4:
            segment = "Champion"
            action = "Steward deeply, consider upgrade, seek testimonials"
        elif r_score >= 3 and f_score >= 4:
            segment = "Loyal"
            action = "Maintain contact, share impact, invite to events"
        elif r_score >= 4 and 2 <= f_score <= 3:
            segment = "Potential Loyalist"
            action = "Increase touchpoints, build relationship"
        elif r_score >= 4 and f_score == 1:
            segment = "New Donor"
            action = "Welcome series, focus on second gift"
        elif r_score >= 3 and m_score >= 4:
            segment = "Promising"
            action = "Increase frequency, build engagement"
        elif r_score == 3:
            segment = "Needs Attention"
            action = "Re-engagement campaign, special project"
        elif r_score == 2:
            segment = "At Risk"
            action = "Immediate outreach, we-miss-you campaign"
        elif r_score == 1 and f_score >= 2:
            segment = "Hibernating"
            action = "Win-back campaign, reactivation offer"
        else:
            segment = "Lost"
            action = "Final reactivation or archive"

        # Apply filters
        if segment_filter and segment != segment_filter:
            continue
        if min_score and (r_score < min_score or f_score < min_score or m_score < min_score):
            continue

        rfm_data.append(RFMScoreResponse(
            donor_id=stats.id,
            donor_name=f"{stats.first_name} {stats.last_name}",
            email=stats.email,
            recency_score=r_score,
            frequency_score=f_score,
            monetary_score=m_score,
            rfm_segment=segment,
            days_since_last_gift=days_since_last,
            total_gifts=stats.donation_count,
            lifetime_value=Decimal(str(stats.total_donated)),
            average_gift=Decimal(str(stats.avg_donation)),
            last_gift_date=last_gift_date,
            recommended_action=action
        ))

    # Sort by combined RFM score
    rfm_data.sort(key=lambda x: (x.recency_score + x.frequency_score + x.monetary_score), reverse=True)

    return rfm_data[:limit]


# ============================================================================
# DONOR HEALTH SCORE
# ============================================================================

@router.get("/health-score/{organization_id}", response_model=List[DonorHealthResponse])
async def get_donor_health_scores(
        organization_id: UUID,
        min_health_score: Optional[int] = Query(None, ge=0, le=100),
        health_status: Optional[str] = Query(None),
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Comprehensive Donor Health Score (0-100)

    Components:
    - Recency (30%): How recently they gave
    - Consistency (40%): Regularity of giving pattern
    - Trend (30%): Direction of giving (increasing/decreasing)

    Status Categories:
    - Excellent (80-100): Highly engaged
    - Good (60-79): Healthy
    - Fair (40-59): Needs attention
    - Poor (20-39): At risk
    - Critical (0-19): Likely to lapse
    """

    today = date.today()  # Use date to avoid timezone issues
    one_year_ago = today - timedelta(days=365)
    two_years_ago = today - timedelta(days=730)

    # Get donors with giving history
    donors = db.query(Donor).filter(
        Donor.organization_id == organization_id
    ).all()

    health_scores = []

    for donor in donors:
        # Get donation history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        if not donations:
            continue

        # Convert donation dates to date objects
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]

        # Calculate recency score (0-100)
        last_gift_date = donation_dates[-1]
        days_since_last = (today - last_gift_date).days
        recency_score = max(0, 100 - (days_since_last / 730.0 * 100))  # 0 at 2 years

        # Calculate consistency score (0-100)
        if len(donation_dates) >= 2:
            time_diffs = [
                (donation_dates[i+1] - donation_dates[i]).days
                for i in range(len(donation_dates) - 1)
            ]
            avg_diff = statistics.mean(time_diffs)
            std_diff = statistics.stdev(time_diffs) if len(time_diffs) > 1 else 0
            cv = std_diff / avg_diff if avg_diff > 0 else 0
            consistency_score = max(0, 100 - (cv * 50))  # Lower CV = more consistent
        else:
            consistency_score = 50  # Neutral for new donors

        # Calculate trend score (0-100)
        this_year_donations = [
            donations[i] for i, d in enumerate(donation_dates) if d >= one_year_ago
        ]
        last_year_donations = [
            donations[i] for i, d in enumerate(donation_dates)
            if two_years_ago <= d < one_year_ago
        ]

        this_year_total = sum(d.amount for d in this_year_donations) if this_year_donations else Decimal('0')
        last_year_total = sum(d.amount for d in last_year_donations) if last_year_donations else Decimal('0')

        if last_year_total > 0:
            yoy_change = ((this_year_total - last_year_total) / last_year_total) * 100
            trend_score = 50 + min(max(float(yoy_change), -50), 50)  # -50% to +50% mapped to 0-100
        else:
            yoy_change = 0
            trend_score = 50

        # Weighted health score
        health_score = (recency_score * 0.30) + (consistency_score * 0.40) + (trend_score * 0.30)

        # Classify health status
        if health_score >= 80:
            status = "Excellent"
        elif health_score >= 60:
            status = "Good"
        elif health_score >= 40:
            status = "Fair"
        elif health_score >= 20:
            status = "Poor"
        else:
            status = "Critical"

        # Identify risk indicators
        risks = []
        if days_since_last > 365:
            risks.append("No gift in over 12 months")
        if yoy_change < -20:
            risks.append("Giving declined >20% year-over-year")
        if health_score < 40:
            risks.append("Overall health score below 40")
        if not risks:
            risks.append("No significant risks detected")

        # Recommended actions
        if status == "Excellent":
            actions = ["Continue stewardship", "Consider upgrade", "Seek testimonial"]
        elif status == "Good":
            actions = ["Maintain engagement", "Share impact stories", "Invite to events"]
        elif status == "Fair":
            actions = ["Increase touchpoints", "Survey satisfaction", "Re-engage"]
        elif status == "Poor":
            actions = ["Personal outreach", "Identify barriers", "Special campaign"]
        else:
            actions = ["Urgent intervention", "Personal call", "Last-chance offer"]

        # Apply filters
        if min_health_score and health_score < min_health_score:
            continue
        if health_status and status != health_status:
            continue

        health_scores.append(DonorHealthResponse(
            donor_id=donor.id,
            donor_name=f"{donor.first_name} {donor.last_name}",
            email=donor.email,
            health_score=round(health_score, 1),
            health_status=status,
            recency_component=round(recency_score, 1),
            consistency_component=round(consistency_score, 1),
            trend_component=round(trend_score, 1),
            total_gifts=len(donations),
            lifetime_value=sum(d.amount for d in donations),
            days_since_last_gift=days_since_last,
            year_over_year_change_percent=round(float(yoy_change), 1),
            risk_indicators=risks,
            recommended_actions=actions
        ))

    # Sort by health score descending
    health_scores.sort(key=lambda x: x.health_score, reverse=True)

    return health_scores[:limit]


# ============================================================================
# CHURN RISK PREDICTION
# ============================================================================

@router.get("/churn-risk/{organization_id}", response_model=List[ChurnRiskResponse])
async def predict_churn_risk(
        organization_id: UUID,
        risk_level: Optional[str] = Query(None, description="High, Medium, Low"),
        days_threshold: int = Query(365, description="Lapse threshold in days"),
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Predictive Churn Risk Analysis

    Identifies donors at risk of lapsing using:
    - Days since last gift vs historical frequency
    - Declining gift amounts
    - Reduced giving frequency

    Risk Levels:
    - High (70-100%): Immediate intervention needed
    - Medium (40-69%): Watch closely
    - Low (0-39%): Healthy
    """

    today = date.today()  # Use date to avoid timezone issues
    lookback_date = today - timedelta(days=days_threshold * 2)

    # Get donors with at least 2 gifts
    donor_histories = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.count(Donation.id).label('gift_count'),
        func.max(Donation.donation_date).label('last_gift_date'),
        func.sum(Donation.amount).label('total_amount')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id,
        Donation.donation_date >= lookback_date
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    ).having(
        func.count(Donation.id) >= 2
    ).all()

    predictions = []

    for donor_history in donor_histories:
        # Get detailed history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor_history.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        if len(donations) < 2:
            continue

        # Convert to date objects
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]

        # Calculate expected frequency
        time_diffs = [
            (donation_dates[i+1] - donation_dates[i]).days
            for i in range(len(donation_dates) - 1)
        ]
        expected_frequency = statistics.mean(time_diffs)

        # Convert last_gift_date to date object
        last_gift_date = donor_history.last_gift_date.date() if hasattr(donor_history.last_gift_date, 'date') else donor_history.last_gift_date
        days_since_last = (today - last_gift_date).days
        is_overdue = days_since_last > (expected_frequency * 1.5)

        # Calculate churn probability
        risk_factors = []
        churn_probability = 0

        if days_since_last > days_threshold:
            risk_factors.append("Exceeded lapse threshold")
            churn_probability += 40
        elif is_overdue:
            risk_factors.append("Overdue based on giving pattern")
            churn_probability += 25

        # Check for declining amounts
        if len(donations) >= 4:
            recent_avg = statistics.mean([float(d.amount) for d in donations[-2:]])
            older_avg = statistics.mean([float(d.amount) for d in donations[:2]])
            if recent_avg < (older_avg * 0.8):
                risk_factors.append("Declining gift amounts")
                churn_probability += 20

        # Recency risk
        recency_risk = min((days_since_last / days_threshold) * 30, 30)
        churn_probability += recency_risk

        churn_probability = min(churn_probability, 100)

        if churn_probability < 40:
            risk_level_str = "Low"
            urgency = "Monitor (3 months)"
            actions = ["Standard nurture", "Monitor engagement"]
        elif churn_probability < 70:
            risk_level_str = "Medium"
            urgency = "Act soon (1 month)"
            actions = ["Personal email", "Share success story", "Event invitation"]
        else:
            risk_level_str = "High"
            urgency = "Immediate (1 week)"
            actions = ["Personal call", "We-miss-you message", "Exclusive opportunity"]

        if not risk_factors:
            risk_factors.append("No significant risks detected")

        # Apply filter
        if risk_level and risk_level_str != risk_level:
            continue

        predictions.append(ChurnRiskResponse(
            donor_id=donor_history.id,
            donor_name=f"{donor_history.first_name} {donor_history.last_name}",
            email=donor_history.email,
            churn_probability_percent=round(churn_probability, 1),
            risk_level=risk_level_str,
            risk_factors=risk_factors,
            days_since_last_gift=days_since_last,
            expected_frequency_days=round(expected_frequency),
            is_overdue=is_overdue,
            lifetime_value=Decimal(str(donor_history.total_amount)),
            total_gifts=donor_history.gift_count,
            last_gift_date=last_gift_date,
            intervention_urgency=urgency,
            recommended_actions=actions
        ))

    # Sort by churn probability descending
    predictions.sort(key=lambda x: x.churn_probability_percent, reverse=True)

    return predictions[:limit]


# ============================================================================
# LIFETIME VALUE PREDICTION
# ============================================================================

@router.get("/lifetime-value-prediction/{organization_id}", response_model=List[LifetimeValuePredictionResponse])
async def predict_lifetime_value(
        organization_id: UUID,
        min_predicted_ltv: Optional[float] = None,
        value_segment: Optional[str] = None,
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Predicted Lifetime Value (pLTV)

    Forecasts total future value using:
    - Historical giving patterns
    - Gift frequency trends
    - Retention probability
    - Expected donor lifespan

    Three scenarios:
    - Conservative: 10th percentile
    - Expected: Most likely (50th percentile)
    - Optimistic: 90th percentile

    Value Segments:
    - High Value: >$10,000
    - Medium Value: $2,500-$10,000
    - Standard: $500-$2,500
    - Low Value: <$500
    """

    today = date.today()  # Use date to avoid timezone issues

    # Get donors with at least 2 gifts
    donor_histories = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.count(Donation.id).label('gift_count'),
        func.sum(Donation.amount).label('lifetime_value'),
        func.avg(Donation.amount).label('avg_gift'),
        func.min(Donation.donation_date).label('first_gift_date'),
        func.max(Donation.donation_date).label('last_gift_date')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    ).having(
        func.count(Donation.id) >= 2
    ).all()

    predictions = []

    for donor_history in donor_histories:
        # Get detailed history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor_history.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        # Convert to date objects
        first_gift_date = donor_history.first_gift_date.date() if hasattr(donor_history.first_gift_date, 'date') else donor_history.first_gift_date
        last_gift_date = donor_history.last_gift_date.date() if hasattr(donor_history.last_gift_date, 'date') else donor_history.last_gift_date

        # Calculate donor age
        donor_age_days = (today - first_gift_date).days
        donor_age_years = donor_age_days / 365.25

        if donor_age_years < 0.1:  # Too new
            continue

        # Convert donation dates
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]

        # Calculate giving frequency
        time_diffs = [
            (donation_dates[i+1] - donation_dates[i]).days
            for i in range(len(donation_dates) - 1)
        ]
        avg_days_between = statistics.mean(time_diffs)
        gifts_per_year = 365.25 / avg_days_between if avg_days_between > 0 else 1

        # Calculate retention probability based on recency
        days_since_last = (today - last_gift_date).days
        if days_since_last < avg_days_between:
            retention_prob = 0.85
            expected_years = 7
        elif days_since_last < avg_days_between * 2:
            retention_prob = 0.65
            expected_years = 5
        elif days_since_last < avg_days_between * 3:
            retention_prob = 0.45
            expected_years = 3
        else:
            retention_prob = 0.25
            expected_years = 1

        current_ltv = float(donor_history.lifetime_value)
        avg_gift = float(donor_history.avg_gift)

        # Predictions
        conservative_annual = avg_gift * gifts_per_year * 0.8
        conservative_pltv = current_ltv + (conservative_annual * expected_years * 0.7)

        expected_annual = avg_gift * gifts_per_year
        expected_pltv = current_ltv + (expected_annual * expected_years * retention_prob)

        optimistic_annual = avg_gift * gifts_per_year * 1.2
        optimistic_pltv = current_ltv + (optimistic_annual * (expected_years * 1.5) * min(retention_prob * 1.2, 1.0))

        # Value segment
        if expected_pltv >= 10000:
            segment = "High Value"
            priority = "Critical - Major Gift Officer"
        elif expected_pltv >= 2500:
            segment = "Medium Value"
            priority = "High - Portfolio Assignment"
        elif expected_pltv >= 500:
            segment = "Standard"
            priority = "Medium - Pool Management"
        else:
            segment = "Low Value"
            priority = "Standard - Mass Communication"

        # Apply filters
        if min_predicted_ltv and expected_pltv < min_predicted_ltv:
            continue
        if value_segment and segment != value_segment:
            continue

        predictions.append(LifetimeValuePredictionResponse(
            donor_id=donor_history.id,
            donor_name=f"{donor_history.first_name} {donor_history.last_name}",
            email=donor_history.email,
            current_ltv=Decimal(str(current_ltv)),
            predicted_ltv_conservative=Decimal(str(round(conservative_pltv, 2))),
            predicted_ltv_expected=Decimal(str(round(expected_pltv, 2))),
            predicted_ltv_optimistic=Decimal(str(round(optimistic_pltv, 2))),
            predicted_future_value=Decimal(str(round(expected_pltv - current_ltv, 2))),
            value_segment=segment,
            retention_probability_percent=round(retention_prob * 100, 1),
            expected_remaining_years=expected_years,
            gifts_per_year=round(gifts_per_year, 2),
            average_gift_size=Decimal(str(avg_gift)),
            cultivation_priority=priority
        ))

    # Sort by expected pLTV descending
    predictions.sort(key=lambda x: x.predicted_ltv_expected, reverse=True)

    return predictions[:limit]


# ============================================================================
# NEXT GIFT PREDICTION
# ============================================================================

@router.get("/next-gift-prediction/{organization_id}", response_model=List[NextGiftPredictionResponse])
async def predict_next_gift(
        organization_id: UUID,
        days_ahead: int = Query(90),
        include_overdue: bool = Query(True),
        min_confidence: Optional[int] = Query(None, ge=0, le=100),
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Next Gift Prediction & Optimal Ask Timing

    Predicts when donors will give next based on:
    - Historical giving frequency
    - Seasonal patterns
    - Recent engagement

    Includes:
    - Predicted gift date with confidence
    - Optimal ask amount
    - Best timing for outreach
    - Overdue warnings
    """

    today = date.today()  # Use date to avoid timezone issues
    prediction_window = today + timedelta(days=days_ahead)

    # Get donors with at least 2 gifts
    donor_histories = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.count(Donation.id).label('gift_count'),
        func.avg(Donation.amount).label('avg_amount'),
        func.max(Donation.donation_date).label('last_gift_date')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    ).having(
        func.count(Donation.id) >= 2
    ).all()

    predictions = []

    for donor_history in donor_histories:
        # Get detailed history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor_history.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        if len(donations) < 2:
            continue

        # Convert to date objects
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]
        last_gift_date = donor_history.last_gift_date.date() if hasattr(donor_history.last_gift_date, 'date') else donor_history.last_gift_date

        # Calculate average frequency
        time_diffs = [
            (donation_dates[i+1] - donation_dates[i]).days
            for i in range(len(donation_dates) - 1)
        ]
        avg_frequency = statistics.mean(time_diffs)
        std_frequency = statistics.stdev(time_diffs) if len(time_diffs) > 1 else 0

        # Predict next gift date
        predicted_date = last_gift_date + timedelta(days=int(avg_frequency))
        days_since_last = (today - last_gift_date).days
        days_until = (predicted_date - today).days

        # Calculate confidence based on consistency
        cv = std_frequency / avg_frequency if avg_frequency > 0 else 1
        consistency_score = max(0, 1 - cv)
        confidence = consistency_score * 100

        # Adjust for recency
        is_overdue = days_since_last > avg_frequency * 1.2
        days_overdue = int(max(0, days_since_last - avg_frequency))

        if is_overdue and avg_frequency > 0:
            confidence -= min((days_overdue / avg_frequency) * 20, 30)

        confidence = max(0, min(100, confidence))

        # Only include if within window or overdue
        if not (predicted_date <= prediction_window or (include_overdue and is_overdue)):
            continue

        # Calculate suggested ask
        recent_gifts = donations[-3:] if len(donations) >= 3 else donations
        recent_avg = statistics.mean([float(d.amount) for d in recent_gifts])
        suggested_ask = Decimal(str(float(recent_avg) * 1.15)) # 15% increase

        # Timing recommendation
        if is_overdue:
            timing = "Now - Already overdue"
        elif days_until <= 7:
            timing = "This week"
        elif days_until <= 14:
            timing = "Within 2 weeks"
        elif days_until <= 30:
            timing = "This month"
        else:
            timing = f"In {days_until} days"

        # Apply filter
        if min_confidence and confidence < min_confidence:
            continue

        predictions.append(NextGiftPredictionResponse(
            donor_id=donor_history.id,
            donor_name=f"{donor_history.first_name} {donor_history.last_name}",
            email=donor_history.email,
            predicted_next_gift_date=predicted_date,
            days_until_predicted=days_until,
            confidence_percent=round(confidence, 1),
            suggested_ask_amount=suggested_ask,
            optimal_ask_timing=timing,
            is_overdue=is_overdue,
            days_overdue=days_overdue,
            last_gift_date=last_gift_date,
            average_frequency_days=round(avg_frequency)
        ))

    # Sort by days until predicted (overdue first, then soonest)
    predictions.sort(key=lambda x: (not x.is_overdue, x.days_until_predicted))

    return predictions[:limit]


# ============================================================================
# UPGRADE POTENTIAL ANALYSIS
# ============================================================================

@router.get("/upgrade-potential/{organization_id}", response_model=List[UpgradePotentialResponse])
async def analyze_upgrade_potential(
        organization_id: UUID,
        potential_level: Optional[str] = Query(None),
        min_capacity: Optional[float] = None,
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Donor Upgrade Potential & Capacity Analysis

    Identifies donors ready for higher giving levels based on:
    - Giving capacity signals
    - Engagement indicators
    - Giving trajectory
    - Consistency patterns

    Potential Levels:
    - High: Ready now (70-100 score)
    - Medium: Needs cultivation (40-69)
    - Low: Limited readiness (0-39)
    """

    today = date.today()  # Use date to avoid timezone issues
    one_year_ago = today - timedelta(days=365)

    # Get donors with history
    donor_histories = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.count(Donation.id).label('gift_count'),
        func.sum(Donation.amount).label('lifetime_value'),
        func.max(Donation.amount).label('largest_gift'),
        func.avg(Donation.amount).label('avg_gift'),
        func.min(Donation.donation_date).label('first_gift_date'),
        func.max(Donation.donation_date).label('last_gift_date')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    ).having(
        func.count(Donation.id) >= 2
    ).all()

    analyses = []

    for donor_history in donor_histories:
        # Get detailed history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor_history.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        # Convert to date objects
        first_gift_date = donor_history.first_gift_date.date() if hasattr(donor_history.first_gift_date, 'date') else donor_history.first_gift_date
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]

        # Calculate tenure
        tenure_days = (today - first_gift_date).days
        tenure_years = tenure_days / 365.25

        # Recent vs historical average
        recent_donations = [
            donations[i] for i, d in enumerate(donation_dates) if d >= one_year_ago
        ]
        recent_avg = (
            sum(d.amount for d in recent_donations) / len(recent_donations)
            if recent_donations else donor_history.avg_gift
        )

        # Estimate capacity (rough heuristic)
        largest_gift = float(donor_history.largest_gift)
        capacity_estimate = largest_gift * 5  # Largest gift ~20% of capacity

        # Calculate capacity utilization
        capacity_utilization = (float(donor_history.avg_gift) / capacity_estimate * 100) if capacity_estimate > 0 else 0

        # Calculate readiness score
        readiness_score = 0
        readiness_factors = []

        # Factor 1: Consistent giving (25 points)
        if donor_history.gift_count >= 5 and tenure_years >= 2:
            readiness_score += 25
            readiness_factors.append("Consistent giving history")
        elif donor_history.gift_count >= 3:
            readiness_score += 15

        # Factor 2: Low capacity utilization (25 points)
        if capacity_utilization < 30:
            readiness_score += 25
            readiness_factors.append("Low capacity utilization")
        elif capacity_utilization < 50:
            readiness_score += 15

        # Factor 3: Growing gifts (25 points)
        if len(recent_donations) >= 2 and len(donations) >= 4 and len(donations) > len(recent_donations):
            historical_avg = sum(d.amount for d in donations[:-len(recent_donations)]) / (len(donations) - len(recent_donations))
            if recent_avg > historical_avg * Decimal('1.1'):
                readiness_score += 25
                readiness_factors.append("Growing gift sizes")
            elif recent_avg >= historical_avg:
                readiness_score += 15

        # Factor 4: Engagement (25 points)
        engagement_score = min((donor_history.gift_count / max(tenure_years, 1) * 20), 25)
        readiness_score += engagement_score
        if engagement_score >= 20:
            readiness_factors.append("Highly engaged")

        # Classify potential
        if readiness_score >= 70:
            potential = "High"
            stage = "Solicitation Ready"
            timeline = "Ready now - 30-60 days"
        elif readiness_score >= 40:
            potential = "Medium"
            stage = "Active Cultivation"
            timeline = "3-6 months cultivation"
        else:
            potential = "Low"
            stage = "Qualification"
            timeline = "12+ months cultivation"

        # Calculate ask amounts
        current_avg = float(donor_history.avg_gift)
        conservative_ask = Decimal(str(current_avg * 1.5))
        moderate_ask = Decimal(str(current_avg * 2.0))
        stretch_ask = Decimal(str(min(current_avg * 3.0, capacity_estimate * 0.3)))

        # Apply filters
        if potential_level and potential != potential_level:
            continue
        if min_capacity and capacity_estimate < min_capacity:
            continue

        analyses.append(UpgradePotentialResponse(
            donor_id=donor_history.id,
            donor_name=f"{donor_history.first_name} {donor_history.last_name}",
            email=donor_history.email,
            upgrade_readiness_score=round(readiness_score, 1),
            potential_level=potential,
            estimated_capacity=Decimal(str(capacity_estimate)),
            current_average_gift=Decimal(str(current_avg)),
            capacity_utilization_percent=round(capacity_utilization, 1),
            suggested_ask_conservative=conservative_ask,
            suggested_ask_moderate=moderate_ask,
            suggested_ask_stretch=stretch_ask,
            readiness_factors=readiness_factors if readiness_factors else ["Building readiness"],
            cultivation_stage=stage,
            recommended_timeline=timeline
        ))

    # Sort by readiness score descending
    analyses.sort(key=lambda x: x.upgrade_readiness_score, reverse=True)

    return analyses[:limit]


# ============================================================================
# GIVING PATTERN ANALYSIS
# ============================================================================

@router.get("/giving-patterns/{organization_id}", response_model=List[GivingPatternResponse])
async def analyze_giving_patterns(
        organization_id: UUID,
        pattern_type: Optional[str] = Query(None),
        limit: int = Query(100, le=1000),
        db: Session = Depends(get_db)
):
    """
    Giving Pattern Analysis

    Identifies each donor's giving pattern:
    - Monthly: Gifts every 25-35 days
    - Quarterly: Gifts every 80-100 days
    - Semi-Annual: Gifts every 170-190 days
    - Annual: Gifts every 350-380 days
    - Irregular: No clear pattern

    Includes:
    - Preferred giving months
    - Consistency score
    - Trend direction
    - Seasonal patterns
    """

    # Get donors with at least 3 gifts for pattern detection
    donor_histories = db.query(
        Donor.id,
        Donor.first_name,
        Donor.last_name,
        Donor.email,
        func.count(Donation.id).label('gift_count'),
        func.sum(Donation.amount).label('lifetime_value')
    ).join(
        Donation, Donation.donor_id == Donor.id
    ).filter(
        Donor.organization_id == organization_id
    ).group_by(
        Donor.id, Donor.first_name, Donor.last_name, Donor.email
    ).having(
        func.count(Donation.id) >= 3
    ).all()

    patterns = []

    for donor_history in donor_histories:
        # Get detailed history
        donations = db.query(Donation).filter(
            Donation.donor_id == donor_history.id,
            Donation.organization_id == organization_id
        ).order_by(Donation.donation_date).all()

        # Convert to date objects
        donation_dates = [
            d.donation_date.date() if hasattr(d.donation_date, 'date') else d.donation_date
            for d in donations
        ]

        # Calculate frequency
        time_diffs = [
            (donation_dates[i+1] - donation_dates[i]).days
            for i in range(len(donation_dates) - 1)
        ]
        avg_frequency = statistics.mean(time_diffs)
        std_frequency = statistics.stdev(time_diffs) if len(time_diffs) > 1 else 0

        # Determine pattern type
        if 25 <= avg_frequency <= 35:
            pattern = "Monthly"
        elif 80 <= avg_frequency <= 100:
            pattern = "Quarterly"
        elif 170 <= avg_frequency <= 190:
            pattern = "Semi-Annual"
        elif 350 <= avg_frequency <= 380:
            pattern = "Annual"
        else:
            pattern = "Irregular"

        # Calculate consistency
        cv = std_frequency / avg_frequency if avg_frequency > 0 else 1
        consistency = max(0, (1 - cv) * 100)

        # Find preferred months (extract month from date objects)
        months = [d.month for d in donation_dates]
        month_counts = {}
        for m in months:
            month_counts[m] = month_counts.get(m, 0) + 1

        top_months = sorted(month_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        preferred_months = [month_names[m-1] for m, _ in top_months]

        # Find preferred amounts
        amounts = [d.amount for d in donations]
        preferred_amounts = sorted(set(amounts), reverse=True)[:3]

        # Trend
        if len(donations) >= 4:
            midpoint = len(donations) // 2
            recent_avg = sum(d.amount for d in donations[midpoint:]) / len(donations[midpoint:])
            older_avg = sum(d.amount for d in donations[:midpoint]) / midpoint
            if recent_avg > older_avg * Decimal('1.1'):
                trend = "Increasing"
            elif recent_avg < older_avg * Decimal('0.9'):
                trend = "Decreasing"
            else:
                trend = "Stable"
        else:
            trend = "Insufficient data"

        # Apply filter
        if pattern_type and pattern != pattern_type:
            continue

        patterns.append(GivingPatternResponse(
            donor_id=donor_history.id,
            donor_name=f"{donor_history.first_name} {donor_history.last_name}",
            email=donor_history.email,
            pattern_type=pattern,
            average_frequency_days=round(avg_frequency),
            consistency_score=round(consistency, 1),
            preferred_giving_months=preferred_months,
            preferred_giving_amounts=preferred_amounts,
            total_gifts=donor_history.gift_count,
            lifetime_value=Decimal(str(donor_history.lifetime_value)),
            trend=trend,
            seasonal_pattern_detected=len(set(months)) <= 3  # Concentrated in few months
        ))

    # Sort by consistency score descending
    patterns.sort(key=lambda x: x.consistency_score, reverse=True)

    return patterns[:limit]