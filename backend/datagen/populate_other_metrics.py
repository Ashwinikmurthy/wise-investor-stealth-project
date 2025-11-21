#!/usr/bin/env python3
"""
Dashboard Metrics Data Populator
=================================
Populates touchpoint_logs, thank_you_logs, and donor_interactions tables
to make dashboard metrics come alive with realistic data.

This will fix:
- Avg Touchpoints/Donor: 0.0 → 4-8 per donor
- Thank-You Velocity: 0.0h → 8-24 hours average
- Total Outreach YTD: 0 → 500-2000 interactions

Author: Ashwini
Date: November 2025
"""

import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid
import random

# Database configuration
DB_CONFIG = {
    'dbname': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'host': 'localhost',
    'port': '5432'
}

# Target organization ID
TARGET_ORG_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'


class DashboardDataPopulator:
    def __init__(self, org_id):
        self.org_id = org_id
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        
        # Will be populated from database
        self.donors = []
        self.donations = []
        self.users = []
        self.campaigns = []
        
    def close(self):
        """Close database connection"""
        self.cursor.close()
        self.conn.close()
        print("\n✓ Database connection closed")
    
    def load_existing_data(self):
        """Load existing donors, donations, users from database"""
        print(f"\n📊 Loading existing data for organization {self.org_id}...")
        
        # Load donors (focus on major/mid-level)
        self.cursor.execute("""
            SELECT id, first_name, last_name, total_donated
            FROM donors
            WHERE organization_id = %s
            AND donor_level IN ('mega_donor', 'major_donor', 'mid_level', 'upper_donor')
            ORDER BY total_donated DESC NULLS LAST
            LIMIT 500
        """, (self.org_id,))
        self.donors = self.cursor.fetchall()
        print(f"   Found {len(self.donors)} donors")
        
        # Load recent donations (last 2 years)
        two_years_ago = date.today() - timedelta(days=730)
        self.cursor.execute("""
            SELECT id, donor_id, amount, donation_date, campaign_id
            FROM donations
            WHERE organization_id = %s
            AND donation_date >= %s
            ORDER BY donation_date DESC
            LIMIT 2000
        """, (self.org_id, two_years_ago))
        self.donations = self.cursor.fetchall()
        print(f"   Found {len(self.donations)} recent donations")
        
        # Load users
        self.cursor.execute("""
            SELECT id FROM users
            WHERE organization_id = %s
        """, (self.org_id,))
        self.users = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(self.users)} users")
        
        # Load campaigns
        self.cursor.execute("""
            SELECT id FROM campaigns
            WHERE organization_id = %s
        """, (self.org_id,))
        self.campaigns = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(self.campaigns)} campaigns")
        
        if not self.donors:
            print("\n⚠️  WARNING: No donors found!")
            return False
        
        return True
    
    def populate_touchpoint_logs(self):
        """
        Populate touchpoint_logs table
        Creates 4-10 touchpoints per donor over last 12 months
        """
        print("\n👉 Populating Touchpoint Logs...")
        
        # Clear existing data for this org
        self.cursor.execute("""
            DELETE FROM touchpoint_logs
            WHERE organization_id = %s
        """, (self.org_id,))
        
        touchpoint_types = [
            'Meeting',
            'Phone Call',
            'Email',
            'Event',
            'Thank You Note',
            'Site Visit',
            'Lunch/Dinner',
            'Video Call',
            'Personal Note',
            'Gift Acknowledgment'
        ]
        
        notes_templates = [
            "Productive conversation about giving opportunities.",
            "Discussed program impact and future initiatives.",
            "Follow-up on previous conversation.",
            "Thanked donor for recent support.",
            "Shared updates on campaign progress.",
            "Discussed donor's interests and passions.",
            "Introduced new program opportunities.",
            "Reviewed gift impact and outcomes.",
            "Scheduled follow-up meeting.",
            "Personal check-in and relationship building."
        ]
        
        touchpoints = []
        today = date.today()
        
        # Create 4-10 touchpoints per donor over last 12 months
        for donor_id, first_name, last_name, total_donated in self.donors[:300]:  # Focus on top 300
            num_touchpoints = random.randint(4, 10)
            
            for _ in range(num_touchpoints):
                # Random date in last 365 days
                days_back = random.randint(0, 365)
                touchpoint_date = today - timedelta(days=days_back)
                
                # Random user
                created_by = random.choice(self.users) if self.users else None
                
                touchpoints.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    donor_id,
                    random.choice(touchpoint_types),
                    random.choice(notes_templates),
                    touchpoint_date,
                    created_by
                ))
        
        # Batch insert
        execute_batch(self.cursor, """
            INSERT INTO touchpoint_logs (id, organization_id, donor_id, touchpoint_type, 
                notes, created_at, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, touchpoints)
        
        self.conn.commit()
        print(f"   ✓ Created {len(touchpoints)} touchpoint records")
        
        # Show statistics
        self.cursor.execute("""
            SELECT 
                touchpoint_type,
                COUNT(*) as count
            FROM touchpoint_logs
            WHERE organization_id = %s
            GROUP BY touchpoint_type
            ORDER BY count DESC
        """, (self.org_id,))
        
        print("\n   Touchpoint Distribution:")
        for tp_type, count in self.cursor.fetchall():
            print(f"      {tp_type:<20} {count:>4}")
    
    def populate_thank_you_logs(self):
        """
        Populate thank_you_logs table
        Creates thank-you records for donations with realistic response times
        """
        print("\n💌 Populating Thank You Logs...")
        
        # Clear existing data for this org
        self.cursor.execute("""
            DELETE FROM thank_you_logs
            WHERE organization_id = %s
        """, (self.org_id,))
        
        thank_yous = []
        
        # Create thank-you logs for 70-90% of donations
        for donation_id, donor_id, amount, donation_date, campaign_id in self.donations:
            # 70-90% of donations get thank-yous
            if random.random() < 0.85:
                # Response time: mostly within 24h, some longer
                if random.random() < 0.7:
                    # Fast response: 2-24 hours
                    response_hours = random.uniform(2, 24)
                elif random.random() < 0.9:
                    # Medium response: 24-72 hours
                    response_hours = random.uniform(24, 72)
                else:
                    # Slow response: 72-168 hours (1 week)
                    response_hours = random.uniform(72, 168)
                
                # Calculate sent_at timestamp
                sent_at = donation_date + timedelta(hours=response_hours)
                
                # Target is 24 hours
                target_hours = 24
                
                thank_yous.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    donation_id,
                    float(amount) if amount else 0.0,
                    response_hours,
                    target_hours,
                    sent_at,
                    donation_date  # created_at
                ))
        
        # Batch insert
        execute_batch(self.cursor, """
            INSERT INTO thank_you_logs (id, organization_id, donation_id, gift_amount,
                response_hours, target_hours, sent_at, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, thank_yous)
        
        self.conn.commit()
        print(f"   ✓ Created {len(thank_yous)} thank-you records")
        
        # Show statistics
        self.cursor.execute("""
            SELECT 
                COUNT(*) as total,
                ROUND(AVG(response_hours)::numeric, 1) as avg_hours,
                ROUND(MIN(response_hours)::numeric, 1) as min_hours,
                ROUND(MAX(response_hours)::numeric, 1) as max_hours,
                COUNT(CASE WHEN response_hours <= 24 THEN 1 END) as within_24h,
                ROUND(COUNT(CASE WHEN response_hours <= 24 THEN 1 END)::numeric / COUNT(*)::numeric * 100, 1) as pct_within_24h
            FROM thank_you_logs
            WHERE organization_id = %s
        """, (self.org_id,))
        
        stats = self.cursor.fetchone()
        print(f"\n   Thank-You Statistics:")
        print(f"      Total sent:        {stats[0]}")
        print(f"      Avg response:      {stats[1]} hours")
        print(f"      Fastest:           {stats[2]} hours")
        print(f"      Slowest:           {stats[3]} hours")
        print(f"      Within 24h:        {stats[4]} ({stats[5]}%)")
    
    def populate_donor_interactions(self):
        """
        Populate donor_interactions table
        Creates comprehensive interaction records
        """
        print("\n🤝 Populating Donor Interactions...")
        
        # Clear existing data for this org
        self.cursor.execute("""
            DELETE FROM donor_interactions
            WHERE organization_id = %s
        """, (self.org_id,))
        
        # Dynamically get valid enum values from database
        print("   📋 Querying database for valid enum values...")
        
        try:
            # Get interaction_type enum values
            self.cursor.execute("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (
                    SELECT atttypid FROM pg_attribute 
                    WHERE attrelid = 'donor_interactions'::regclass 
                    AND attname = 'interaction_type'
                )
                ORDER BY enumsortorder;
            """)
            interaction_types = [row[0] for row in self.cursor.fetchall()]
            
            # Get interaction_status enum values
            self.cursor.execute("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (
                    SELECT atttypid FROM pg_attribute 
                    WHERE attrelid = 'donor_interactions'::regclass 
                    AND attname = 'interaction_status'
                )
                ORDER BY enumsortorder;
            """)
            statuses = [row[0] for row in self.cursor.fetchall()]
            
            # Get outcome enum values (may be NULL in column)
            self.cursor.execute("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (
                    SELECT atttypid FROM pg_attribute 
                    WHERE attrelid = 'donor_interactions'::regclass 
                    AND attname = 'outcome'
                )
                ORDER BY enumsortorder;
            """)
            outcomes = [row[0] for row in self.cursor.fetchall()]
            
            # Get channel enum values
            self.cursor.execute("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (
                    SELECT atttypid FROM pg_attribute 
                    WHERE attrelid = 'donor_interactions'::regclass 
                    AND attname = 'channel'
                )
                ORDER BY enumsortorder;
            """)
            channels = [row[0] for row in self.cursor.fetchall()]
            
            # Get sentiment enum values
            self.cursor.execute("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (
                    SELECT atttypid FROM pg_attribute 
                    WHERE attrelid = 'donor_interactions'::regclass 
                    AND attname = 'sentiment'
                )
                ORDER BY enumsortorder;
            """)
            sentiments = [row[0] for row in self.cursor.fetchall()]
            
            print(f"   ✓ Found enum values:")
            print(f"      interaction_type: {interaction_types}")
            print(f"      interaction_status: {statuses}")
            print(f"      outcome: {outcomes}")
            print(f"      channel: {channels}")
            print(f"      sentiment: {sentiments}")
            
            # Validate we have values
            if not interaction_types or not statuses or not channels:
                print(f"   ⚠️  Missing required enum values!")
                print(f"   ⚠️  Skipping donor_interactions table")
                return
            
        except Exception as e:
            print(f"   ⚠️  Could not query enum values: {e}")
            print(f"   ⚠️  Skipping donor_interactions table")
            return
        
        subjects = [
            "Major gift solicitation",
            "Cultivation meeting",
            "Thank you call",
            "Program update",
            "Event follow-up",
            "Campaign discussion",
            "Stewardship visit",
            "Donor recognition",
            "Impact report discussion",
            "Future giving opportunities"
        ]
        
        interactions = []
        today = date.today()
        
        # Create 3-8 interactions per major donor
        for donor_id, first_name, last_name, total_donated in self.donors[:250]:
            num_interactions = random.randint(3, 8)
            
            for _ in range(num_interactions):
                # Random date in last 365 days
                days_back = random.randint(0, 365)
                interaction_date = today - timedelta(days=days_back)
                
                interaction_type = random.choice(interaction_types)
                status = random.choice(statuses)
                outcome = random.choice(outcomes) if (status == 'completed' and outcomes) else None
                channel = random.choice(channels)
                sentiment = random.choice(sentiments) if (status == 'completed' and sentiments) else None
                
                # Duration for meetings/calls
                duration = random.randint(15, 90) if interaction_type in ['meeting', 'call', 'visit'] else None
                
                # Engagement score (0-100)
                engagement = random.randint(50, 100) if status == 'completed' else None
                
                # Follow-up needed for some interactions
                follow_up_needed = random.random() < 0.3
                follow_up_date = interaction_date + timedelta(days=random.randint(7, 30)) if follow_up_needed else None
                follow_up_completed = random.random() < 0.6 if follow_up_needed else None
                
                # Response time for emails/calls
                response_time = random.uniform(1, 48) if interaction_type in ['email', 'call'] else None
                
                # Random campaign/user
                campaign_id = random.choice(self.campaigns) if self.campaigns and random.random() < 0.3 else None
                assigned_to = random.choice(self.users) if self.users else None
                created_by = random.choice(self.users) if self.users else None
                
                interactions.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    donor_id,
                    interaction_type,
                    interaction_date,
                    status,
                    outcome,
                    random.choice(subjects),
                    f"Notes for {interaction_type} with {first_name} {last_name}",
                    channel,
                    duration,
                    response_time,
                    engagement,
                    sentiment,
                    follow_up_needed,
                    follow_up_date,
                    follow_up_completed,
                    None,  # follow_up_notes
                    campaign_id,
                    None,  # event_id
                    assigned_to,
                    created_by,
                    None,  # custom_fields
                    None,  # tags
                    interaction_date,
                    interaction_date
                ))
        
        # Batch insert - Let PostgreSQL handle enum conversions automatically
        execute_batch(self.cursor, """
            INSERT INTO donor_interactions (
                id, organization_id, donor_id, interaction_type, interaction_date,
                interaction_status, outcome, subject, notes, channel, duration_minutes,
                response_time_hours, engagement_score, sentiment, follow_up_required,
                follow_up_date, follow_up_completed, follow_up_notes, campaign_id,
                event_id, assigned_to, created_by, custom_fields, tags, created_at, updated_at
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s
            )
        """, interactions)
        
        self.conn.commit()
        print(f"   ✓ Created {len(interactions)} interaction records")
        
        # Show statistics
        self.cursor.execute("""
            SELECT 
                interaction_type,
                COUNT(*) as count
            FROM donor_interactions
            WHERE organization_id = %s
            GROUP BY interaction_type
            ORDER BY count DESC
        """, (self.org_id,))
        
        print("\n   Interaction Type Distribution:")
        for int_type, count in self.cursor.fetchall():
            print(f"      {int_type:<15} {count:>4}")
    
    def generate_all(self):
        """Run all data generation methods"""
        print("\n" + "=" * 70)
        print("DASHBOARD METRICS DATA POPULATOR")
        print("=" * 70)
        print(f"Target Organization: {self.org_id}")
        
        try:
            # Load existing data
            if not self.load_existing_data():
                print("\n❌ Cannot proceed without donors. Exiting.")
                return False
            
            # Populate all tables
            self.populate_touchpoint_logs()
            self.populate_thank_you_logs()
            self.populate_donor_interactions()
            
            # Summary
            print("\n" + "=" * 70)
            print("✅ DATA POPULATION COMPLETE!")
            print("=" * 70)
            
            # Final counts
            self.cursor.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM touchpoint_logs WHERE organization_id = %s) as touchpoints,
                    (SELECT COUNT(*) FROM thank_you_logs WHERE organization_id = %s) as thank_yous,
                    (SELECT COUNT(*) FROM donor_interactions WHERE organization_id = %s) as interactions
            """, (self.org_id, self.org_id, self.org_id))
            
            counts = self.cursor.fetchone()
            
            print(f"\n📊 Summary for Organization {self.org_id}:")
            print(f"   • {counts[0]:>5} touchpoint logs")
            print(f"   • {counts[1]:>5} thank-you logs")
            print(f"   • {counts[2]:>5} donor interactions")
            print(f"   • {len(self.donors):>5} donors with data")
            
            print("\n🎉 Your dashboard metrics should now display:")
            print("   • Avg Touchpoints/Donor: 4-8 per donor")
            print("   • Thank-You Velocity: 8-24 hours average")
            print("   • Total Outreach YTD: 500-2000 interactions")
            print()
            
            self.close()
            return True
            
        except Exception as e:
            self.conn.rollback()
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            self.close()
            return False


def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("SETUP")
    print("=" * 70)
    
    org_id = TARGET_ORG_ID
    print(f"\nTarget Organization ID: {org_id}")
    
    # Confirm
    print("\n⚠️  This will populate:")
    print("   • touchpoint_logs (1200-3000 records)")
    print("   • thank_you_logs (500-1700 records)")
    print("   • donor_interactions (750-2000 records)")
    print(f"\n   For organization: {org_id}")
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Cancelled.")
        return
    
    # Run generation
    populator = DashboardDataPopulator(TARGET_ORG_ID)
    
    try:
        success = populator.generate_all()
        if success:
            print("\n✅ All dashboard metrics populated successfully!")
        else:
            print("\n❌ Population failed. Check errors above.")
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Exiting...")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
