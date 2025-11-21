#!/usr/bin/env python3
"""
Donor Engagement Analytics - Data Generation Script
Generates comprehensive test data for Donor Engagement Intelligence Dashboard

This script creates realistic sample data for:
- Donor Interactions (calls, emails, meetings, events)
- Engagement Preferences (communication preferences)
- Engagement Predictions (churn risk, propensity scores)

Author: Ashwini
Date: November 2025
"""

import random
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
import sys

# Database imports
try:
    from database import SessionLocal, engine
    from models import (
        Donors, DonorInteraction, EngagementPreference, EngagementPrediction,
        Users, Campaigns, Events
    )
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️  Database modules not found. Running in preview mode.")

# ============================================================================
# CONFIGURATION
# ============================================================================

ORGANIZATION_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'

# Data generation counts
NUM_INTERACTIONS_PER_DONOR = (5, 25)  # min, max interactions per donor
PREDICTION_FOR_ALL_DONORS = True

# ============================================================================
# ENUMS (matching your models)
# ============================================================================

INTERACTION_TYPES = [
    'PHONE', 'EMAIL', 'MEETING', 'EVENT', 'MAIL',
    'SOCIAL_MEDIA', 'VOLUNTEER', 'DONATION', 'THANK_YOU',
    'SITE_VISIT', 'NEWSLETTER', 'SURVEY', 'WEBINAR', 'OTHER'
]

INTERACTION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

INTERACTION_OUTCOMES = [
    'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FOLLOW_UP_NEEDED', 'CONVERSION'
]

COMMUNICATION_CHANNELS = ['EMAIL', 'PHONE', 'MAIL', 'SMS', 'SOCIAL_MEDIA', 'IN_PERSON']

SENTIMENT_TYPES = ['positive', 'neutral', 'negative', 'very_positive', 'very_negative']

ENGAGEMENT_LEVELS = ['on_fire', 'hot', 'warm', 'lukewarm', 'cold']

RISK_LEVELS = ['low', 'medium', 'high', 'critical']

INTERACTION_TRENDS = ['increasing', 'stable', 'declining']

# ============================================================================
# SAMPLE DATA
# ============================================================================

INTERACTION_SUBJECTS = {
    'PHONE': [
        "Thank you call for recent donation",
        "Follow-up on event attendance",
        "Quarterly check-in call",
        "Campaign update discussion",
        "Impact story sharing",
        "Planned giving conversation",
        "Corporate matching inquiry",
        "Volunteer opportunity discussion"
    ],
    'EMAIL': [
        "Monthly newsletter response",
        "Event invitation follow-up",
        "Donation acknowledgment",
        "Survey response thank you",
        "Impact report sharing",
        "Year-end appeal response",
        "Membership renewal reminder",
        "Special campaign update"
    ],
    'MEETING': [
        "Annual stewardship meeting",
        "Major gift cultivation",
        "Board member introduction",
        "Facility tour",
        "Program site visit",
        "Legacy giving discussion",
        "Corporate partnership meeting",
        "Donor recognition event"
    ],
    'EVENT': [
        "Annual gala attendance",
        "Volunteer appreciation event",
        "Groundbreaking ceremony",
        "Program graduation",
        "Networking reception",
        "Holiday celebration",
        "Award ceremony",
        "Open house tour"
    ]
}

FOLLOW_UP_NOTES = [
    "Send impact report by end of week",
    "Schedule site visit for next month",
    "Prepare personalized thank you package",
    "Connect with program director",
    "Research corporate matching program",
    "Invite to upcoming cultivation event",
    "Send planned giving brochure",
    "Arrange meeting with Executive Director"
]

RECOMMENDED_ACTIONS = [
    "Schedule personal phone call",
    "Send personalized impact update",
    "Invite to upcoming cultivation event",
    "Arrange meeting with Executive Director",
    "Send handwritten thank you note",
    "Include in major donor newsletter",
    "Connect with peer donor for testimonial",
    "Review for upgrade opportunity",
    "Consider for board nomination",
    "Send exclusive program update"
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def random_date_between(start_date, end_date):
    """Generate a random date between two dates"""
    if isinstance(start_date, date) and not isinstance(start_date, datetime):
        start_date = datetime.combine(start_date, datetime.min.time())
    if isinstance(end_date, date) and not isinstance(end_date, datetime):
        end_date = datetime.combine(end_date, datetime.min.time())
    
    delta = end_date - start_date
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

def calculate_engagement_score(interactions):
    """Calculate engagement score based on RFM analysis"""
    if not interactions:
        return 0.0
    
    # Recency score (0-40)
    most_recent = max(i['date'] for i in interactions)
    days_since = (datetime.utcnow() - most_recent).days
    
    if days_since <= 7:
        recency = 40
    elif days_since <= 30:
        recency = 30
    elif days_since <= 60:
        recency = 20
    else:
        recency = 10
    
    # Frequency score (0-30)
    count = len(interactions)
    if count >= 10:
        frequency = 30
    elif count >= 6:
        frequency = 25
    elif count >= 3:
        frequency = 15
    else:
        frequency = 10
    
    # Quality score (0-30)
    positive = sum(1 for i in interactions if i['outcome'] in ['POSITIVE', 'CONVERSION'])
    quality = (positive / len(interactions)) * 30 if interactions else 0
    
    return min(100.0, recency + frequency + quality)

def determine_risk_level(churn_score):
    """Determine risk level from churn score"""
    if churn_score >= 70:
        return 'critical'
    elif churn_score >= 50:
        return 'high'
    elif churn_score >= 30:
        return 'medium'
    return 'low'

def determine_engagement_level(score):
    """Determine engagement level from score"""
    if score >= 81:
        return 'on_fire'
    elif score >= 61:
        return 'hot'
    elif score >= 41:
        return 'warm'
    elif score >= 21:
        return 'lukewarm'
    return 'cold'

# ============================================================================
# DATA GENERATION FUNCTIONS
# ============================================================================

def get_existing_data(db, org_id):
    """Get existing donors, users, campaigns, and events"""
    print("\n📋 Fetching existing data...")
    
    donors = db.query(Donors).filter(Donors.organization_id == org_id).all()
    users = db.query(Users).filter(Users.organization_id == org_id).all()
    campaigns = db.query(Campaigns).filter(Campaigns.organization_id == org_id).all()
    events = db.query(Events).filter(Events.organization_id == org_id).all()
    
    print(f"  Found {len(donors)} donors")
    print(f"  Found {len(users)} users")
    print(f"  Found {len(campaigns)} campaigns")
    print(f"  Found {len(events)} events")
    
    if not donors:
        print("  ⚠️  No donors found! Please create donors first.")
        return None
    
    return {
        'donors': donors,
        'users': users if users else [None],
        'campaigns': campaigns if campaigns else [None],
        'events': events if events else [None]
    }

def generate_interactions(db, org_id, existing_data):
    """Generate donor interactions"""
    print("\n📞 Generating Donor Interactions...")
    interactions = []
    all_interaction_data = {}  # Store for prediction calculations
    
    donors = existing_data['donors']
    users = existing_data['users']
    campaigns = existing_data['campaigns']
    events = existing_data['events']
    
    for i, donor in enumerate(donors):
        num_interactions = random.randint(*NUM_INTERACTIONS_PER_DONOR)
        donor_interactions = []
        
        for j in range(num_interactions):
            # Random interaction type
            int_type = random.choice(INTERACTION_TYPES)
            
            # Get appropriate subject
            subjects = INTERACTION_SUBJECTS.get(int_type, INTERACTION_SUBJECTS['PHONE'])
            subject = random.choice(subjects)
            
            # Random date in last 2 years
            int_date = random_date_between(
                datetime.utcnow() - timedelta(days=730),
                datetime.utcnow()
            )
            
            # Determine outcome based on weighted probability
            outcome = random.choices(
                INTERACTION_OUTCOMES,
                weights=[35, 30, 5, 15, 15]
            )[0]
            
            # Sentiment correlates with outcome
            if outcome in ['POSITIVE', 'CONVERSION']:
                sentiment = random.choice(['positive', 'very_positive'])
            elif outcome == 'NEGATIVE':
                sentiment = random.choice(['negative', 'very_negative'])
            else:
                sentiment = random.choice(['neutral', 'positive', 'neutral'])
            
            # Follow-up needed for some interactions
            follow_up_required = random.random() > 0.7
            follow_up_date = None
            follow_up_completed = False
            
            if follow_up_required:
                follow_up_date = int_date + timedelta(days=random.randint(3, 30))
                if follow_up_date < datetime.utcnow():
                    follow_up_completed = random.random() > 0.3
            
            # Calculate engagement score for this interaction
            if outcome in ['POSITIVE', 'CONVERSION']:
                engagement_score = random.uniform(70, 100)
            elif outcome == 'NEGATIVE':
                engagement_score = random.uniform(10, 40)
            else:
                engagement_score = random.uniform(40, 70)
            
            interaction = DonorInteraction(
                id=uuid.uuid4(),
                organization_id=org_id,
                donor_id=donor.id,
                interaction_type=int_type,
                interaction_date=int_date,
                interaction_status='COMPLETED' if int_date < datetime.utcnow() else 'SCHEDULED',
                outcome=outcome,
                subject=subject,
                notes=f"{'Excellent' if outcome == 'POSITIVE' else 'Standard'} {int_type.replace('_', ' ')} with {donor.first_name}. {random.choice(['Very engaged.', 'Good conversation.', 'Follow up needed.', 'Shared impact story.', 'Discussed upcoming events.'])}",
                channel=random.choice(COMMUNICATION_CHANNELS),
                duration_minutes=random.randint(5, 90) if int_type in ['PHONE', 'MEETING', 'WEBINAR'] else None,
                response_time_hours=random.uniform(0.5, 72) if outcome != 'NEGATIVE' else None,
                engagement_score=engagement_score,
                sentiment=sentiment,
                follow_up_required=follow_up_required,
                follow_up_date=follow_up_date,
                follow_up_completed=follow_up_completed,
                follow_up_notes=random.choice(FOLLOW_UP_NOTES) if follow_up_required else None,
                campaign_id=random.choice(campaigns).id if campaigns[0] and random.random() > 0.5 else None,
                event_id=random.choice(events).id if events[0] and int_type == 'EVENT' else None,
                assigned_to=random.choice(users).id if users[0] else None,
                created_by=random.choice(users).id if users[0] else uuid.uuid4(),
                tags=['major_donor', 'cultivation'] if random.random() > 0.7 else None,
                custom_fields={'source': 'datagen'},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            interactions.append(interaction)
            donor_interactions.append({
                'date': int_date,
                'outcome': outcome,
                'type': int_type
            })
            
            if DB_AVAILABLE:
                db.add(interaction)
        
        # Store for prediction calculations
        all_interaction_data[str(donor.id)] = donor_interactions
        
        if (i + 1) % 50 == 0:
            print(f"  Progress: {i + 1}/{len(donors)} donors ({((i + 1)/len(donors)*100):.0f}%)")
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(interactions)} interactions")
    return interactions, all_interaction_data

def generate_engagement_preferences(db, org_id, donors):
    """Generate engagement preferences for donors"""
    print("\n⚙️ Generating Engagement Preferences...")
    preferences = []
    
    for donor in donors:
        # Check if preference already exists
        existing = db.query(EngagementPreference).filter(
            EngagementPreference.donor_id == donor.id
        ).first()
        
        if existing:
            continue
        
        preference = EngagementPreference(
            id=uuid.uuid4(),
            organization_id=org_id,
            donor_id=donor.id,
            preferred_channel=random.choice(COMMUNICATION_CHANNELS),
            email_opt_in=random.random() > 0.1,
            phone_opt_in=random.random() > 0.3,
            mail_opt_in=random.random() > 0.2,
            sms_opt_in=random.random() > 0.6,
            best_contact_time=random.choice(['morning', 'afternoon', 'evening']),
            best_contact_day=random.choice(['weekday', 'weekend', 'any']),
            timezone='America/Chicago',
            preferred_frequency=random.choice(['weekly', 'monthly', 'quarterly']),
            do_not_contact=random.random() > 0.95,
            content_interests=random.sample(
                ['Impact Stories', 'Event Invitations', 'Financial Reports', 
                 'Volunteer Opportunities', 'Newsletter', 'Program Updates'],
                random.randint(2, 4)
            ),
            event_types_interested=random.sample(
                ['Gala', 'Tours', 'Volunteer Days', 'Networking', 'Educational'],
                random.randint(1, 3)
            ),
            current_engagement_level=random.choice(ENGAGEMENT_LEVELS),
            engagement_score=random.uniform(20, 95),
            last_engagement_date=datetime.utcnow() - timedelta(days=random.randint(1, 180)),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        preferences.append(preference)
        
        if DB_AVAILABLE:
            db.add(preference)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(preferences)} engagement preferences")
    return preferences

def generate_engagement_predictions(db, org_id, donors, interaction_data):
    """Generate AI-style engagement predictions"""
    print("\n🤖 Generating Engagement Predictions...")
    predictions = []
    
    for donor in donors:
        donor_id = str(donor.id)
        interactions = interaction_data.get(donor_id, [])
        
        # Calculate metrics
        if interactions:
            last_interaction = max(i['date'] for i in interactions)
            days_since = (datetime.utcnow() - last_interaction).days
            
            # Determine interaction trend
            recent = [i for i in interactions if (datetime.utcnow() - i['date']).days <= 90]
            older = [i for i in interactions if 90 < (datetime.utcnow() - i['date']).days <= 180]
            
            if len(recent) > len(older) * 1.2:
                trend = 'increasing'
            elif len(recent) < len(older) * 0.8:
                trend = 'declining'
            else:
                trend = 'stable'
            
            # Calculate engagement score
            engagement_score = calculate_engagement_score(interactions)
        else:
            days_since = 365
            trend = 'declining'
            engagement_score = 10
        
        # Calculate churn risk
        churn_score = 0
        
        # Days since last interaction (0-40)
        if days_since > 180:
            churn_score += 40
        elif days_since > 90:
            churn_score += 30
        elif days_since > 60:
            churn_score += 20
        elif days_since > 30:
            churn_score += 10
        
        # Trend factor (0-30)
        if trend == 'declining':
            churn_score += 30
        elif trend == 'stable':
            churn_score += 15
        
        # Random factors (0-30)
        churn_score += random.uniform(0, 30)
        churn_score = min(100, churn_score)
        
        # Engagement propensity (inverse of churn)
        engagement_propensity = 100 - churn_score + random.uniform(-10, 10)
        engagement_propensity = max(0, min(100, engagement_propensity))
        
        # Response likelihood
        response_likelihood = random.uniform(40, 95)
        
        # Determine risk level
        risk_level = determine_risk_level(churn_score)
        
        # Recommended actions based on risk
        if risk_level == 'critical':
            actions = random.sample(RECOMMENDED_ACTIONS[:4], 3)
        elif risk_level == 'high':
            actions = random.sample(RECOMMENDED_ACTIONS[:6], 2)
        else:
            actions = random.sample(RECOMMENDED_ACTIONS, random.randint(1, 2))
        
        prediction = EngagementPrediction(
            id=uuid.uuid4(),
            organization_id=org_id,
            donor_id=donor.id,
            churn_risk_score=round(churn_score, 2),
            engagement_propensity=round(engagement_propensity, 2),
            response_likelihood=round(response_likelihood, 2),
            event_attendance_score=random.uniform(30, 90),
            volunteer_propensity=random.uniform(20, 80),
            predicted_next_interaction=datetime.utcnow() + timedelta(days=random.randint(7, 60)),
            predicted_channel=random.choice(COMMUNICATION_CHANNELS),
            predicted_engagement_level=determine_engagement_level(engagement_score),
            days_since_last_interaction=days_since,
            interaction_trend=trend,
            risk_level=risk_level,
            recommended_actions=actions,
            optimal_contact_window={
                'start_date': (datetime.utcnow() + timedelta(days=7)).isoformat(),
                'end_date': (datetime.utcnow() + timedelta(days=14)).isoformat(),
                'best_day': random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday']),
                'best_time': random.choice(['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'])
            },
            model_version='v1.0',
            prediction_confidence=random.uniform(65, 95),
            prediction_date=datetime.utcnow(),
            feature_scores={
                'recency': random.uniform(0.1, 0.4),
                'frequency': random.uniform(0.1, 0.3),
                'monetary': random.uniform(0.1, 0.3),
                'engagement': random.uniform(0.05, 0.2)
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        predictions.append(prediction)
        
        if DB_AVAILABLE:
            db.add(prediction)
    
    if DB_AVAILABLE:
        db.commit()
    
    # Summary stats
    critical = sum(1 for p in predictions if p.risk_level == 'critical')
    high = sum(1 for p in predictions if p.risk_level == 'high')
    medium = sum(1 for p in predictions if p.risk_level == 'medium')
    low = sum(1 for p in predictions if p.risk_level == 'low')
    
    print(f"  ✅ Created {len(predictions)} engagement predictions")
    print(f"     Risk distribution: Critical={critical}, High={high}, Medium={medium}, Low={low}")
    
    return predictions

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def generate_all_data():
    """Generate all engagement analytics test data"""
    print("=" * 60)
    print("🚀 DONOR ENGAGEMENT ANALYTICS - DATA GENERATOR")
    print("=" * 60)
    print(f"\nOrganization ID: {ORGANIZATION_ID}")
    
    if not DB_AVAILABLE:
        print("\n⚠️  Running in PREVIEW MODE (no database connection)")
        return
    
    try:
        db = SessionLocal()
        org_id = uuid.UUID(ORGANIZATION_ID)
        
        # Get existing data
        existing_data = get_existing_data(db, org_id)
        if not existing_data:
            return 1
        
        # Generate data
        interactions, interaction_data = generate_interactions(db, org_id, existing_data)
        preferences = generate_engagement_preferences(db, org_id, existing_data['donors'])
        predictions = generate_engagement_predictions(db, org_id, existing_data['donors'], interaction_data)
        
        # Summary
        print("\n" + "=" * 60)
        print("✅ DATA GENERATION COMPLETE")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"  • Donors processed: {len(existing_data['donors'])}")
        print(f"  • Interactions created: {len(interactions)}")
        print(f"  • Preferences created: {len(preferences)}")
        print(f"  • Predictions created: {len(predictions)}")
        
        total = len(interactions) + len(preferences) + len(predictions)
        print(f"\n  📈 Total Records Created: {total}")
        
        db.close()
        
        print("\n🎉 Your Donor Engagement Dashboard now has comprehensive test data!")
        print("   Navigate to /analytics/engagement to see it in action.")
        
    except Exception as e:
        print(f"\n❌ Error generating data: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(generate_all_data())
