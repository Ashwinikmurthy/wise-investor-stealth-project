"""
Engagement Analytics & Predictive APIs
Advanced analytics for donor engagement patterns and churn prediction

Features inspired by:
- Bloomerang Engagement Meter & Analytics
- Blackbaud Predictive Analytics
- Salesforce Einstein Analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json

# Assuming imports
from database import get_db
from models import Donors as Donor
from models import (
     DonorInteraction, EngagementPreference, EngagementPrediction,
    InteractionStatus, InteractionOutcome, SentimentType, EngagementLevel,
     CommunicationChannel
)

router = APIRouter(prefix="/api/v1/engagement-analytics", tags=["engagement-analytics"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class EngagementMetrics(BaseModel):
    """Individual donor engagement metrics"""
    donor_id: str
    donor_name: str
    engagement_level: str  # EngagementLevel
    engagement_score: float
    total_interactions: int
    interactions_30d: int
    interactions_90d: int
    interactions_12m: int
    last_interaction_date: Optional[datetime]
    last_interaction_type: Optional[str]
    days_since_last_interaction: Optional[int]
    interaction_frequency_days: float
    preferred_channel: Optional[str]
    response_rate: float
    average_response_time_hours: Optional[float]
    sentiment_trend: Optional[str]


class EngagementPredictionResponse(BaseModel):
    """Predictive analytics for engagement"""
    donor_id: str
    donor_name: str
    churn_risk_score: float  # 0-100
    engagement_propensity: float
    response_likelihood: float
    risk_level: str
    days_since_last_interaction: Optional[int]
    interaction_trend: Optional[str]
    predicted_next_interaction: Optional[datetime]
    predicted_channel: Optional[str]
    predicted_engagement_level: Optional[str]
    recommended_actions: List[str]
    optimal_contact_window: Optional[Dict[str, Any]]
    prediction_confidence: Optional[float]
    prediction_date: datetime


class NextBestAction(BaseModel):
    """Recommended action for donor engagement"""
    donor_id: str
    donor_name: str
    recommended_action: str
    action_type: str
    recommended_channel: str
    recommended_timing: datetime
    confidence_score: float
    reason: str
    expected_outcome: str


class EngagementTrendResponse(BaseModel):
    """Engagement trends over time"""
    period: str
    total_interactions: int
    unique_donors_engaged: int
    average_engagement_score: float
    engagement_distribution: Dict[str, int]
    top_interaction_types: List[Dict[str, Any]]
    sentiment_distribution: Dict[str, int]


class EngagementSummary(BaseModel):
    """Organization-wide engagement summary"""
    total_donors: int
    engaged_donors_30d: int
    engaged_donors_90d: int
    average_engagement_score: float
    engagement_distribution: Dict[str, int]
    at_risk_donors: int
    high_opportunity_donors: int
    total_interactions_30d: int
    response_rate: float


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_engagement_score(interactions: List, days_window: int = 90) -> float:
    """
    Calculate engagement score (0-100) based on RFM-style analysis
    - Recency: How recent was the last interaction
    - Frequency: How often do they interact
    - Quality: Positive outcomes and sentiment
    """
    if not interactions:
        return 0.0

    cutoff_date = datetime.utcnow() - timedelta(days=days_window)
    recent_interactions = [i for i in interactions if i.interaction_date >= cutoff_date]

    if not recent_interactions:
        return 0.0

    # Recency score (0-40 points)
    days_since_last = (datetime.utcnow() - max(i.interaction_date for i in recent_interactions)).days
    if days_since_last <= 7:
        recency_score = 40
    elif days_since_last <= 30:
        recency_score = 30
    elif days_since_last <= 60:
        recency_score = 20
    else:
        recency_score = 10

    # Frequency score (0-30 points)
    interaction_count = len(recent_interactions)
    if interaction_count >= 10:
        frequency_score = 30
    elif interaction_count >= 6:
        frequency_score = 25
    elif interaction_count >= 3:
        frequency_score = 15
    else:
        frequency_score = 10

    # Quality score (0-30 points) - based on outcomes and sentiment
    positive_outcomes = sum(1 for i in recent_interactions
                            if i.outcome in ["positive", "conversion"])
    quality_ratio = positive_outcomes / len(recent_interactions) if recent_interactions else 0
    quality_score = quality_ratio * 30

    total_score = recency_score + frequency_score + quality_score
    return min(100.0, max(0.0, total_score))


def determine_engagement_level(score: float) -> str:
    """Determine engagement level from score (Bloomerang-style)"""
    if score >= 81:
        return "on_fire"
    elif score >= 61:
        return "hot"
    elif score >= 41:
        return "warm"
    elif score >= 21:
        return "lukewarm"
    else:
        return "cold"


def calculate_churn_risk(donor_data: Dict[str, Any]) -> tuple[float, str]:
    """
    Calculate churn risk score (0-100) and level
    Higher score = higher risk of disengagement

    Factors:
    - Days since last interaction
    - Interaction trend (declining/stable/increasing)
    - Response rate
    - Sentiment trend
    """
    risk_score = 0.0

    # Days since last interaction (0-40 points)
    days_since_last = donor_data.get('days_since_last_interaction', 999)
    if days_since_last > 180:
        risk_score += 40
    elif days_since_last > 90:
        risk_score += 30
    elif days_since_last > 60:
        risk_score += 20
    elif days_since_last > 30:
        risk_score += 10

    # Interaction trend (0-30 points)
    interaction_trend = donor_data.get('interaction_trend', 'stable')
    if interaction_trend == 'declining':
        risk_score += 30
    elif interaction_trend == 'stable':
        risk_score += 15

    # Response rate (0-20 points)
    response_rate = donor_data.get('response_rate', 50.0)
    if response_rate < 20:
        risk_score += 20
    elif response_rate < 40:
        risk_score += 15
    elif response_rate < 60:
        risk_score += 10

    # Sentiment trend (0-10 points)
    sentiment_score = donor_data.get('sentiment_score', 0)
    if sentiment_score < -0.3:
        risk_score += 10
    elif sentiment_score < 0:
        risk_score += 5

    # Determine risk level
    if risk_score >= 70:
        risk_level = "critical"
    elif risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    return min(100.0, risk_score), risk_level


def generate_engagement_recommendations(prediction_data: Dict[str, Any]) -> List[str]:
    """Generate actionable recommendations based on engagement predictions"""
    recommendations = []

    churn_risk = prediction_data.get('churn_risk_score', 0)
    engagement_score = prediction_data.get('engagement_score', 50)
    days_since_last = prediction_data.get('days_since_last_interaction', 0)

    if churn_risk >= 70:
        recommendations.append("URGENT: Immediate personalized outreach required")
        recommendations.append("Schedule executive or board member call within 48 hours")
    elif churn_risk >= 50:
        recommendations.append("High priority re-engagement needed")
        recommendations.append("Send personalized impact story via preferred channel")

    if days_since_last > 60:
        recommendations.append(f"Re-engage within next 7 days (no contact in {days_since_last} days)")

    if engagement_score < 40:
        recommendations.append("Increase touchpoint frequency to monthly minimum")
        recommendations.append("Invite to upcoming event or virtual engagement opportunity")

    if prediction_data.get('interaction_trend') == 'declining':
        recommendations.append("Conduct satisfaction survey to understand declining engagement")

    if not recommendations:
        recommendations.append("Continue current engagement strategy")
        recommendations.append("Monitor for changes in engagement patterns")

    return recommendations[:5]  # Top 5 recommendations


# ============================================================================
# API ENDPOINTS - ENGAGEMENT METRICS
# ============================================================================

@router.get("/metrics/{donor_id}", response_model=EngagementMetrics)
async def get_donor_engagement_metrics(
        organization_id: str,
        donor_id: str,
        db: Session = Depends(get_db)
):
    """
    Get comprehensive engagement metrics for a single donor

    **Metrics Included:**
    - Engagement score and level (Bloomerang-style)
    - Interaction counts by time period
    - Response rates and times
    - Preferred communication channels
    - Sentiment trends
    """
    donor = db.query(Donor).filter(
        Donor.id == donor_id,
        Donor.organization_id == organization_id
    ).first()

    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    # Get all completed interactions
    interactions = db.query(DonorInteraction).filter(
        DonorInteraction.donor_id == donor_id,
        DonorInteraction.interaction_status == "completed"
    ).order_by(desc(DonorInteraction.interaction_date)).all()

    if not interactions:
        return EngagementMetrics(
            donor_id=str(donor_id),
            donor_name=f"{donor.first_name} {donor.last_name}",
            engagement_level="cold",
            engagement_score=0.0,
            total_interactions=0,
            interactions_30d=0,
            interactions_90d=0,
            interactions_12m=0,
            last_interaction_date=None,
            last_interaction_type=None,
            days_since_last_interaction=None,
            interaction_frequency_days=0.0,
            preferred_channel=None,
            response_rate=0.0,
            average_response_time_hours=None,
            sentiment_trend=None
        )

    # Calculate metrics
    now = datetime.utcnow()
    interactions_30d = len([i for i in interactions if i.interaction_date >= now - timedelta(days=30)])
    interactions_90d = len([i for i in interactions if i.interaction_date >= now - timedelta(days=90)])
    interactions_12m = len([i for i in interactions if i.interaction_date >= now - timedelta(days=365)])

    last_interaction = interactions[0]
    days_since_last = (now - last_interaction.interaction_date).days

    # Calculate interaction frequency
    if len(interactions) > 1:
        first_date = interactions[-1].interaction_date
        last_date = interactions[0].interaction_date
        days_span = (last_date - first_date).days
        interaction_frequency = days_span / len(interactions) if len(interactions) > 0 else 0
    else:
        interaction_frequency = 0

    # Calculate response rate
    interactions_with_response = [i for i in interactions if i.outcome in ["positive", "neutral", "negative"]]
    response_rate = (len(interactions_with_response) / len(interactions) * 100) if interactions else 0

    # Average response time
    response_times = [i.response_time_hours for i in interactions if i.response_time_hours is not None]
    avg_response_time = sum(response_times) / len(response_times) if response_times else None

    # Preferred channel (most used)
    channel_counts = {}
    for i in interactions:
        if i.channel:
            channel_counts[i.channel] = channel_counts.get(i.channel, 0) + 1
    preferred_channel = max(channel_counts, key=channel_counts.get) if channel_counts else None

    # Sentiment trend
    recent_sentiments = [i.sentiment for i in interactions[:10] if i.sentiment]
    if recent_sentiments:
        positive_count = sum(1 for s in recent_sentiments if s in ["positive", "very_positive"])
        negative_count = sum(1 for s in recent_sentiments if s in ["negative", "very_negative"])
        if positive_count > negative_count * 1.5:
            sentiment_trend = "improving"
        elif negative_count > positive_count * 1.5:
            sentiment_trend = "declining"
        else:
            sentiment_trend = "stable"
    else:
        sentiment_trend = None

    # Calculate engagement score
    engagement_score = calculate_engagement_score(interactions)
    engagement_level = determine_engagement_level(engagement_score)

    return EngagementMetrics(
        donor_id=str(donor_id),
        donor_name=f"{donor.first_name} {donor.last_name}",
        engagement_level=engagement_level,
        engagement_score=engagement_score,
        total_interactions=len(interactions),
        interactions_30d=interactions_30d,
        interactions_90d=interactions_90d,
        interactions_12m=interactions_12m,
        last_interaction_date=last_interaction.interaction_date,
        last_interaction_type=last_interaction.interaction_type,
        days_since_last_interaction=days_since_last,
        interaction_frequency_days=interaction_frequency,
        preferred_channel=preferred_channel,
        response_rate=response_rate,
        average_response_time_hours=avg_response_time,
        sentiment_trend=sentiment_trend
    )


@router.get("/metrics", response_model=List[EngagementMetrics])
async def get_organization_engagement_metrics(
        organization_id: str,
        engagement_level: Optional[str] = None,
        min_score: float = 0,
        max_score: float = 100,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """
    Get engagement metrics for all donors in organization

    **Filters:**
    - engagement_level: cold, lukewarm, warm, hot, on_fire
    - min_score/max_score: Filter by engagement score range

    **Use Cases:**
    - Identify highly engaged donors
    - Find at-risk donors (low engagement)
    - Segment donors by engagement level
    """
    donors = db.query(Donor).filter(
        Donor.organization_id == organization_id
    ).offset(skip).limit(limit).all()

    metrics_list = []

    for donor in donors:
        try:
            metrics = await get_donor_engagement_metrics(organization_id, str(donor.id), db)

            # Apply filters
            if engagement_level and metrics.engagement_level != engagement_level:
                continue
            if metrics.engagement_score < min_score or metrics.engagement_score > max_score:
                continue

            metrics_list.append(metrics)
        except:
            continue

    return sorted(metrics_list, key=lambda x: x.engagement_score, reverse=True)


@router.get("/summary/{organization_id}", response_model=EngagementSummary)
async def get_engagement_summary(
        organization_id: str,
        db: Session = Depends(get_db)
):
    """
    Get organization-wide engagement summary

    **High-Level Metrics:**
    - Total donors and engagement distribution
    - Average engagement scores
    - At-risk donor counts
    - Total interactions
    - Response rates
    """
    # Get all donors
    donors = db.query(Donor).filter(
        Donor.organization_id == organization_id
    ).all()

    total_donors = len(donors)

    # Get recent interactions
    now = datetime.utcnow()
    interactions_30d = db.query(DonorInteraction).filter(
        DonorInteraction.organization_id == organization_id,
        DonorInteraction.interaction_date >= now - timedelta(days=30),
        DonorInteraction.interaction_status == "completed"
    ).all()

    # Count engaged donors
    engaged_donor_ids_30d = set(i.donor_id for i in interactions_30d)

    interactions_90d = db.query(DonorInteraction).filter(
        DonorInteraction.organization_id == organization_id,
        DonorInteraction.interaction_date >= now - timedelta(days=90),
        DonorInteraction.interaction_status == "completed"
    ).all()
    engaged_donor_ids_90d = set(i.donor_id for i in interactions_90d)

    # Calculate engagement distribution
    engagement_dist = {"cold": 0, "lukewarm": 0, "warm": 0, "hot": 0, "on_fire": 0}
    total_score = 0
    at_risk = 0
    high_opportunity = 0

    for donor in donors[:100]:  # Sample for performance
        interactions = db.query(DonorInteraction).filter(
            DonorInteraction.donor_id == donor.id,
            DonorInteraction.interaction_status == "completed"
        ).all()

        score = calculate_engagement_score(interactions)
        total_score += score
        level = determine_engagement_level(score)
        engagement_dist[level] += 1

        if score < 30:
            at_risk += 1
        elif score > 70:
            high_opportunity += 1

    avg_score = total_score / len(donors[:100]) if donors else 0

    # Calculate response rate
    interactions_with_outcome = [i for i in interactions_30d if i.outcome is not None]
    response_rate = (len(interactions_with_outcome) / len(interactions_30d) * 100) if interactions_30d else 0

    return EngagementSummary(
        total_donors=total_donors,
        engaged_donors_30d=len(engaged_donor_ids_30d),
        engaged_donors_90d=len(engaged_donor_ids_90d),
        average_engagement_score=avg_score,
        engagement_distribution=engagement_dist,
        at_risk_donors=at_risk,
        high_opportunity_donors=high_opportunity,
        total_interactions_30d=len(interactions_30d),
        response_rate=response_rate
    )


@router.get("/trends/{organization_id}", response_model=List[EngagementTrendResponse])
async def get_engagement_trends(
        organization_id: str,
        period: str = "monthly",  # daily, weekly, monthly, quarterly
        months_back: int = 12,
        db: Session = Depends(get_db)
):
    """
    Get engagement trends over time

    **Periods Supported:**
    - daily: Last N days
    - weekly: Last N weeks
    - monthly: Last N months (default)
    - quarterly: Last N quarters

    **Use Case:** Dashboard trend charts
    """
    trends = []
    now = datetime.utcnow()

    # Define period grouping
    if period == "monthly":
        periods = [(now - timedelta(days=30 * i), now - timedelta(days=30 * (i-1)))
                   for i in range(months_back, 0, -1)]
        period_format = "%b %Y"
    elif period == "quarterly":
        periods = [(now - timedelta(days=90 * i), now - timedelta(days=90 * (i-1)))
                   for i in range(months_back // 3, 0, -1)]
        period_format = "Q%q %Y"
    else:
        periods = [(now - timedelta(days=7 * i), now - timedelta(days=7 * (i-1)))
                   for i in range(months_back * 4, 0, -1)]
        period_format = "%d %b"

    for start_date, end_date in periods:
        interactions = db.query(DonorInteraction).filter(
            DonorInteraction.organization_id == organization_id,
            DonorInteraction.interaction_date >= start_date,
            DonorInteraction.interaction_date < end_date,
            DonorInteraction.interaction_status == "completed"
        ).all()

        if not interactions:
            continue

        # Calculate metrics
        unique_donors = len(set(i.donor_id for i in interactions))
        avg_score = sum(i.engagement_score for i in interactions) / len(interactions) if interactions else 0

        # Engagement distribution
        engagement_dist = {"on_fire": 0, "hot": 0, "warm": 0, "lukewarm": 0, "cold": 0}

        for interaction in interactions:
            level = determine_engagement_level(interaction.engagement_score)
            engagement_dist[level] += 1

        # Top interaction types
        type_counts = {}
        for interaction in interactions:
            type_name = interaction.interaction_type
            type_counts[type_name] = type_counts.get(type_name, 0) + 1

        top_types = [{"type": k, "count": v}
                     for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

        # Sentiment distribution
        sentiment_dist = {}
        for interaction in interactions:
            if interaction.sentiment:
                sent_name = interaction.sentiment
                sentiment_dist[sent_name] = sentiment_dist.get(sent_name, 0) + 1

        trends.append(EngagementTrendResponse(
            period=start_date.strftime(period_format),
            total_interactions=len(interactions),
            unique_donors_engaged=unique_donors,
            average_engagement_score=avg_score,
            engagement_distribution=engagement_dist,
            top_interaction_types=top_types,
            sentiment_distribution=sentiment_dist
        ))

    return trends


# ============================================================================
# API ENDPOINTS - PREDICTIVE ANALYTICS
# ============================================================================

@router.post("/predictions/generate/{organization_id}")
async def generate_engagement_predictions(
        organization_id: str,
        force_refresh: bool = False,
        db: Session = Depends(get_db)
):
    """
    Generate engagement predictions for all donors
    Uses machine learning-style scoring based on historical patterns

    **What This Predicts:**
    - Churn risk (likelihood of disengagement)
    - Engagement propensity (likelihood to respond)
    - Next best actions
    - Optimal contact timing

    **Note:** Typically run as scheduled background job
    """
    donors = db.query(Donor).filter(
        Donor.organization_id == organization_id
    ).all()

    predictions_created = 0

    for donor in donors:
        # Check if recent prediction exists
        existing_prediction = db.query(EngagementPrediction).filter(
            EngagementPrediction.donor_id == donor.id,
            EngagementPrediction.prediction_date >= datetime.utcnow() - timedelta(days=7)
        ).first()

        if existing_prediction and not force_refresh:
            continue

        # Get donor interactions
        interactions = db.query(DonorInteraction).filter(
            DonorInteraction.donor_id == donor.id,
            DonorInteraction.interaction_status == "completed"
        ).all()

        if not interactions:
            continue

        # Calculate metrics for prediction
        now = datetime.utcnow()
        last_interaction = max(interactions, key=lambda x: x.interaction_date)
        days_since_last = (now - last_interaction.interaction_date).days

        # Calculate interaction trend
        recent_30d = len([i for i in interactions if i.interaction_date >= now - timedelta(days=30)])
        previous_30d = len([i for i in interactions
                            if now - timedelta(days=60) <= i.interaction_date < now - timedelta(days=30)])

        if previous_30d > 0:
            trend_ratio = recent_30d / previous_30d
            if trend_ratio > 1.2:
                interaction_trend = "increasing"
            elif trend_ratio < 0.8:
                interaction_trend = "declining"
            else:
                interaction_trend = "stable"
        else:
            interaction_trend = "stable"

        # Calculate response rate
        interactions_with_response = [i for i in interactions if i.outcome is not None]
        response_rate = (len(interactions_with_response) / len(interactions) * 100) if interactions else 0

        # Calculate sentiment score
        recent_sentiments = [i.sentiment for i in interactions[:20] if i.sentiment]
        sentiment_score = 0
        if recent_sentiments:
            sentiment_values = {
                "very_positive": 1.0, "positive": 0.5, "neutral": 0.0,
                "negative": -0.5, "very_negative": -1.0
            }
            sentiment_score = sum(sentiment_values.get(s, 0) for s in recent_sentiments) / len(recent_sentiments)

        # Calculate predictions
        donor_data = {
            'days_since_last_interaction': days_since_last,
            'interaction_trend': interaction_trend,
            'response_rate': response_rate,
            'sentiment_score': sentiment_score
        }

        churn_risk_score, risk_level = calculate_churn_risk(donor_data)
        engagement_propensity = 100 - churn_risk_score  # Inverse of churn
        response_likelihood = response_rate

        # Predict next interaction date
        avg_days_between = 30  # Simplified
        predicted_next = now + timedelta(days=avg_days_between)

        # Most used channel
        channel_counts = {}
        for i in interactions:
            if i.channel:
                channel_counts[i.channel] = channel_counts.get(i.channel, 0) + 1
        predicted_channel = max(channel_counts, key=channel_counts.get) if channel_counts else None

        # Predicted engagement level
        predicted_score = (engagement_propensity + response_likelihood) / 2
        predicted_engagement_level = determine_engagement_level(predicted_score)

        # Generate recommendations
        prediction_data = {
            'churn_risk_score': churn_risk_score,
            'engagement_score': predicted_score,
            'days_since_last_interaction': days_since_last,
            'interaction_trend': interaction_trend
        }
        recommended_actions = generate_engagement_recommendations(prediction_data)

        # Optimal contact window
        optimal_window = {
            'start_date': (now + timedelta(days=1)).isoformat(),
            'end_date': (now + timedelta(days=7)).isoformat(),
            'best_time': 'afternoon',
            'best_day': 'weekday'
        }

        # Feature importance
        feature_scores = {
            'recency': 35.0, 'frequency': 25.0, 'response_rate': 20.0,
            'sentiment': 15.0, 'trend': 5.0
        }

        # Create or update prediction
        if existing_prediction:
            prediction = existing_prediction
        else:
            prediction = EngagementPrediction(
                organization_id=organization_id,
                donor_id=donor.id
            )
            db.add(prediction)

        # Update prediction fields
        prediction.churn_risk_score = churn_risk_score
        prediction.engagement_propensity = engagement_propensity
        prediction.response_likelihood = response_likelihood
        prediction.days_since_last_interaction = days_since_last
        prediction.interaction_trend = interaction_trend
        prediction.risk_level = risk_level
        prediction.predicted_next_interaction = predicted_next
        prediction.predicted_channel = predicted_channel
        prediction.predicted_engagement_level = predicted_engagement_level
        prediction.recommended_actions = recommended_actions
        prediction.optimal_contact_window = optimal_window
        prediction.feature_scores = feature_scores
        prediction.model_version = "v1.0"
        prediction.prediction_confidence = 75.0
        prediction.prediction_date = datetime.utcnow()
        prediction.updated_at = datetime.utcnow()

        predictions_created += 1

    db.commit()

    return {
        "message": f"Generated predictions for {predictions_created} donors",
        "total_donors": len(donors),
        "predictions_created": predictions_created
    }


@router.get("/predictions/{donor_id}", response_model=EngagementPredictionResponse)
async def get_engagement_prediction(
        organization_id: str,
        donor_id: str,
        db: Session = Depends(get_db)
):
    """
    Get engagement prediction for a specific donor

    **Returns:**
    - Churn risk score and level
    - Engagement propensity
    - Predicted behaviors
    - Recommended actions
    - Optimal contact timing
    """
    donor = db.query(Donor).filter(
        Donor.id == donor_id,
        Donor.organization_id == organization_id
    ).first()

    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    prediction = db.query(EngagementPrediction).filter(
        EngagementPrediction.donor_id == donor_id,
        EngagementPrediction.organization_id == organization_id
    ).order_by(desc(EngagementPrediction.prediction_date)).first()

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found. Run generate_engagement_predictions first."
        )

    return EngagementPredictionResponse(
        donor_id=str(donor_id),
        donor_name=f"{donor.first_name} {donor.last_name}",
        churn_risk_score=prediction.churn_risk_score,
        engagement_propensity=prediction.engagement_propensity,
        response_likelihood=prediction.response_likelihood,
        risk_level=prediction.risk_level,
        days_since_last_interaction=prediction.days_since_last_interaction,
        interaction_trend=prediction.interaction_trend,
        predicted_next_interaction=prediction.predicted_next_interaction,
        predicted_channel=prediction.predicted_channel,
        predicted_engagement_level=prediction.predicted_engagement_level,
        recommended_actions=prediction.recommended_actions or [],
        optimal_contact_window=prediction.optimal_contact_window,
        prediction_confidence=prediction.prediction_confidence,
        prediction_date=prediction.prediction_date
    )


@router.get("/predictions", response_model=List[EngagementPredictionResponse])
async def get_organization_predictions(
        organization_id: str,
        risk_level: Optional[str] = None,  # low, medium, high, critical
        min_churn_risk: float = 0,
        max_churn_risk: float = 100,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """
    Get engagement predictions for all donors with filtering

    **Filters:**
    - risk_level: low, medium, high, critical
    - min_churn_risk/max_churn_risk: Filter by churn score range

    **Use Cases:**
    - Identify donors at risk of churning
    - Find high-engagement opportunities
    - Prioritize outreach efforts
    """
    query = db.query(EngagementPrediction).filter(
        EngagementPrediction.organization_id == organization_id
    )

    if risk_level:
        query = query.filter(EngagementPrediction.risk_level == risk_level)

    query = query.filter(
        EngagementPrediction.churn_risk_score >= min_churn_risk,
        EngagementPrediction.churn_risk_score <= max_churn_risk
    )

    predictions = query.order_by(desc(EngagementPrediction.churn_risk_score)).offset(skip).limit(limit).all()

    # Get donor names
    donor_ids = [p.donor_id for p in predictions]
    donors = db.query(Donor).filter(Donor.id.in_(donor_ids)).all()
    donor_map = {str(d.id): f"{d.first_name} {d.last_name}" for d in donors}

    return [
        EngagementPredictionResponse(
            donor_id=str(p.donor_id),
            donor_name=donor_map.get(str(p.donor_id), "Unknown"),
            churn_risk_score=p.churn_risk_score,
            engagement_propensity=p.engagement_propensity,
            response_likelihood=p.response_likelihood,
            risk_level=p.risk_level,
            days_since_last_interaction=p.days_since_last_interaction,
            interaction_trend=p.interaction_trend,
            predicted_next_interaction=p.predicted_next_interaction,
            predicted_channel=p.predicted_channel,
            predicted_engagement_level=p.predicted_engagement_level,
            recommended_actions=p.recommended_actions or [],
            optimal_contact_window=p.optimal_contact_window,
            prediction_confidence=p.prediction_confidence,
            prediction_date=p.prediction_date
        )
        for p in predictions
    ]


@router.get("/next-best-actions/{organization_id}", response_model=List[NextBestAction])
async def get_next_best_actions(
        organization_id: str,
        priority: str = "high",  # high, medium, all
        limit: int = 50,
        db: Session = Depends(get_db)
):
    """
    Get recommended next best actions for donor engagement
    Based on predictive analytics and engagement patterns

    **Priority Levels:**
    - high: Critical/high-risk donors or high-opportunity donors
    - medium: Medium-risk donors
    - all: All donors with recommendations

    **Use Case:** Daily action list for fundraisers
    """
    # Get predictions based on priority
    query = db.query(EngagementPrediction).filter(
        EngagementPrediction.organization_id == organization_id
    )

    if priority == "high":
        query = query.filter(
            or_(
                EngagementPrediction.risk_level.in_(["high", "critical"]),
                EngagementPrediction.engagement_propensity >= 70
            )
        )
    elif priority == "medium":
        query = query.filter(EngagementPrediction.risk_level == "medium")

    predictions = query.order_by(desc(EngagementPrediction.churn_risk_score)).limit(limit).all()

    # Get donor names
    donor_ids = [p.donor_id for p in predictions]
    donors = db.query(Donor).filter(Donor.id.in_(donor_ids)).all()
    donor_map = {str(d.id): f"{d.first_name} {d.last_name}" for d in donors}

    actions = []

    for p in predictions:
        # Determine action type and description
        if p.churn_risk_score >= 70:
            action_type = "meeting"
            action_description = "Schedule executive meeting to rebuild relationship"
            expected_outcome = "Re-engage and understand concerns"
        elif p.churn_risk_score >= 50:
            action_type = "phone"
            action_description = "Personal phone call to check in"
            expected_outcome = "Reconnect and assess satisfaction"
        elif p.engagement_propensity >= 70:
            action_type = "event"
            action_description = "Invite to upcoming high-value event"
            expected_outcome = "Deepen engagement and relationship"
        else:
            action_type = "email"
            action_description = "Send personalized impact update"
            expected_outcome = "Maintain awareness and interest"

        # Get recommended timing
        optimal_window = p.optimal_contact_window or {}
        recommended_timing = datetime.fromisoformat(
            optimal_window.get('start_date', datetime.utcnow().isoformat())
        )

        # Determine reason
        reasons = []
        if p.days_since_last_interaction and p.days_since_last_interaction > 60:
            reasons.append(f"No contact in {p.days_since_last_interaction} days")
        if p.interaction_trend == "declining":
            reasons.append("Declining interaction frequency")
        if p.churn_risk_score >= 50:
            reasons.append(f"High churn risk ({p.churn_risk_score:.0f}%)")
        if p.engagement_propensity >= 70:
            reasons.append(f"High engagement opportunity ({p.engagement_propensity:.0f}%)")

        reason = "; ".join(reasons) if reasons else "Proactive engagement"

        actions.append(NextBestAction(
            donor_id=str(p.donor_id),
            donor_name=donor_map.get(str(p.donor_id), "Unknown"),
            recommended_action=action_description,
            action_type=action_type,
            recommended_channel=p.predicted_channel or "email",
            recommended_timing=recommended_timing,
            confidence_score=p.prediction_confidence or 75.0,
            reason=reason,
            expected_outcome=expected_outcome
        ))

    return actions