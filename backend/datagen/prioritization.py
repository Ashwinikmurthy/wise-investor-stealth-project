#!/usr/bin/env python3
"""
Major Gifts Prioritization Data Generator
==========================================
Populates data required for all major gifts prioritization endpoints:
1. /prioritization/capacity
2. /prioritization/engagement  
3. /prioritization/likelihood
4. /prioritization/portfolio-gaps
5. /prioritization/urgency
6. /prioritization/summary

Creates:
- Donor levels (mega_donor, major_donor, mid_level)
- Giving capacity estimates
- Donor priority cache with officer assignments
- Donor meetings
- Major gift officers (if needed)
- Engagement scores

Author: Ashwini
Date: November 2025
"""

import random
import uuid
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, date, timedelta
from decimal import Decimal

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

# Donor levels distribution
DONOR_LEVELS = [
    ('mega_donor', 0.02),      # 2% - $100K+
    ('major_donor', 0.08),     # 8% - $10K-99,999
    ('mid_level', 0.15),       # 15% - $1K-9,999
    ('upper_donor', 0.30),     # 30% - $100-999
    ('lower_donor', 0.45),     # 45% - <$100
]

class MajorGiftsDataGenerator:
    def __init__(self, org_id):
        self.org_id = org_id
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        self.today = date.today()
        
        # Will be populated from database
        self.donor_ids = []
        self.mgo_ids = []
        self.user_ids = []
        
    def close(self):
        """Close database connection"""
        self.cursor.close()
        self.conn.close()
        print("\n✓ Database connection closed")
    
    def load_existing_data(self):
        """Load existing donor and officer IDs from database"""
        print(f"\n📊 Loading existing data for organization {self.org_id}...")
        
        # Load donor IDs
        self.cursor.execute("""
            SELECT id, first_name, last_name, total_donated
            FROM donors
            WHERE organization_id = %s
            ORDER BY total_donated DESC NULLS LAST
        """, (self.org_id,))
        
        self.donor_ids = [(row[0], row[1], row[2], row[3]) for row in self.cursor.fetchall()]
        print(f"   Found {len(self.donor_ids)} donors")
        
        # Load major gift officer IDs
        self.cursor.execute("""
            SELECT id, first_name, last_name
            FROM major_gift_officers
            WHERE organization_id = %s
        """, (self.org_id,))
        
        self.mgo_ids = [(row[0], row[1], row[2]) for row in self.cursor.fetchall()]
        print(f"   Found {len(self.mgo_ids)} major gift officers")
        
        # Load user IDs
        self.cursor.execute("""
            SELECT id FROM users
            WHERE organization_id = %s
        """, (self.org_id,))
        
        self.user_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(self.user_ids)} users")
        
        if not self.donor_ids:
            print("\n⚠️  WARNING: No donors found for this organization!")
            print("   Run generate_comprehensive_analytics_data.py first to create donors.")
            return False
        
        return True
    
    def update_donor_levels(self):
        """
        Update donors with proper donor levels based on their giving
        """
        print("\n💎 Updating Donor Levels...")
        
        # Sort donors by total donated (already sorted from query)
        updates = []
        
        for idx, (donor_id, first_name, last_name, total_donated) in enumerate(self.donor_ids):
            # Calculate percentile
            percentile = idx / len(self.donor_ids) if len(self.donor_ids) > 0 else 0
            
            # Assign donor level based on percentile
            if percentile < 0.02:
                donor_level = 'mega_donor'
            elif percentile < 0.10:
                donor_level = 'major_donor'
            elif percentile < 0.25:
                donor_level = 'mid_level'
            elif percentile < 0.55:
                donor_level = 'upper_donor'
            else:
                donor_level = 'lower_donor'
            
            updates.append((donor_level, donor_id))
        
        # Batch update
        execute_batch(self.cursor, """
            UPDATE donors
            SET donor_level = %s,
                updated_at = NOW()
            WHERE id = %s
        """, updates)
        
        self.conn.commit()
        
        # Count by level
        self.cursor.execute("""
            SELECT donor_level, COUNT(*)
            FROM donors
            WHERE organization_id = %s
            AND donor_level IS NOT NULL
            GROUP BY donor_level
            ORDER BY 
                CASE donor_level
                    WHEN 'mega_donor' THEN 1
                    WHEN 'major_donor' THEN 2
                    WHEN 'mid_level' THEN 3
                    WHEN 'upper_donor' THEN 4
                    WHEN 'lower_donor' THEN 5
                END
        """, (self.org_id,))
        
        print(f"   ✓ Updated {len(updates)} donor levels")
        print("\n   Distribution:")
        for level, count in self.cursor.fetchall():
            print(f"      {level:<15} {count:>5} donors")
    
    def update_giving_capacity(self):
        """
        Estimate and update giving capacity for donors
        """
        print("\n💰 Updating Giving Capacity Estimates...")
        
        updates = []
        
        for donor_id, first_name, last_name, total_donated in self.donor_ids:
            # Estimate capacity as 5-10x their current giving
            # Add some randomness for realism
            if total_donated:
                base_capacity = float(total_donated) * random.uniform(5, 10)
            else:
                base_capacity = random.uniform(5000, 50000)
            
            # Add wealth indicators multiplier
            wealth_multiplier = random.uniform(1.2, 3.5)
            estimated_capacity = base_capacity * wealth_multiplier
            
            # Round to nearest $1000
            estimated_capacity = round(estimated_capacity / 1000) * 1000
            
            updates.append((estimated_capacity, donor_id))
        
        # Batch update
        execute_batch(self.cursor, """
            UPDATE donors
            SET giving_capacity = %s,
                updated_at = NOW()
            WHERE id = %s
        """, updates)
        
        self.conn.commit()
        
        # Show statistics
        self.cursor.execute("""
            SELECT 
                COUNT(*) as total,
                AVG(giving_capacity) as avg_capacity,
                MIN(giving_capacity) as min_capacity,
                MAX(giving_capacity) as max_capacity
            FROM donors
            WHERE organization_id = %s
            AND giving_capacity IS NOT NULL
        """, (self.org_id,))
        
        stats = self.cursor.fetchone()
        print(f"   ✓ Updated {stats[0]} donor capacities")
        print(f"      Average: ${stats[1]:,.0f}")
        print(f"      Range: ${stats[2]:,.0f} - ${stats[3]:,.0f}")
    
    def create_donor_priority_cache(self):
        """
        Create donor priority cache with officer assignments
        """
        print("\n👥 Creating Donor Priority Cache...")
        
        # Only create for major, mega, and mid-level donors
        self.cursor.execute("""
            SELECT id
            FROM donors
            WHERE organization_id = %s
            AND donor_level IN ('mega_donor', 'major_donor', 'mid_level')
        """, (self.org_id,))
        
        major_donors = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(major_donors)} major/mid-level donors")
        
        if not self.mgo_ids:
            print("   ⚠️  No major gift officers found - assignments will be NULL")
        
        # Delete existing cache for this org
        self.cursor.execute("""
            DELETE FROM donor_priority_cache
            WHERE organization_id = %s
        """, (self.org_id,))
        
        cache_records = []
        
        for donor_id in major_donors:
            # Assign to a random MGO if available
            assigned_officer = random.choice(self.mgo_ids)[0] if self.mgo_ids else None
            
            # Priority level based on random scoring
            priority_score = random.randint(50, 100)
            if priority_score >= 90:
                priority_level = 'priority_1'
            elif priority_score >= 75:
                priority_level = 'priority_2'
            elif priority_score >= 60:
                priority_level = 'priority_3'
            elif priority_score >= 45:
                priority_level = 'priority_4'
            else:
                priority_level = 'priority_5'
            
            cache_records.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                assigned_officer,
                priority_level,
                True,  # is_current
                datetime.now()
            ))
        
        # Insert cache records
        execute_batch(self.cursor, """
            INSERT INTO donor_priority_cache (id, organization_id, donor_id, assigned_officer_id,
                priority_level, is_current, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, cache_records)
        
        self.conn.commit()
        print(f"   ✓ Created {len(cache_records)} priority cache records")
        
        # Show assignment distribution
        if self.mgo_ids:
            self.cursor.execute("""
                SELECT 
                    mgo.first_name || ' ' || mgo.last_name as officer_name,
                    COUNT(*) as donor_count
                FROM donor_priority_cache dpc
                JOIN major_gift_officers mgo ON dpc.assigned_officer_id = mgo.id
                WHERE dpc.organization_id = %s
                GROUP BY officer_name
                ORDER BY donor_count DESC
            """, (self.org_id,))
            
            print("\n   Officer Assignments:")
            for officer_name, count in self.cursor.fetchall():
                print(f"      {officer_name:<25} {count:>3} donors")
    
    def create_donor_meetings(self):
        """
        Create donor meeting records for engagement tracking
        """
        print("\n🤝 Creating Donor Meetings...")
        
        # Get major/mid-level donors
        self.cursor.execute("""
            SELECT id
            FROM donors
            WHERE organization_id = %s
            AND donor_level IN ('mega_donor', 'major_donor', 'mid_level')
        """, (self.org_id,))
        
        major_donors = [row[0] for row in self.cursor.fetchall()]
        
        meetings = []
        meeting_types = ['substantive','informational', 'cultivation', 'solicitation', 'stewardship', 'social']
        
        # Create 2-8 meetings per major donor over the last 12 months
        for donor_id in major_donors:
            num_meetings = random.randint(2, 8)
            
            for _ in range(num_meetings):
                # Random date in last 365 days
                days_back = random.randint(0, 365)
                meeting_date = self.today - timedelta(days=days_back)
                
                # Random officer if available
                officer_id = random.choice(self.mgo_ids)[0] if self.mgo_ids else None
                
                meetings.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    donor_id,
                    officer_id,
                    random.choice(meeting_types),
                    meeting_date,
                    random.choice([
                        "Excellent meeting - donor very engaged and interested.",
                        "Productive discussion about giving opportunities.",
                        "Great conversation about program impact.",
                        "Donor expressed strong interest in major gift.",
                        "Positive meeting - moving forward with cultivation."
                    ]),
                    datetime.now(),
                    "Donor discussion",
                    meeting_date
                ))
        
        # Insert meetings
        execute_batch(self.cursor, """
            INSERT INTO donor_meetings (id, organization_id, donor_id, officer_id,
                meeting_type, actual_date, meeting_notes, created_at,meeting_title,scheduled_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s,%s)
        """, meetings)
        
        self.conn.commit()
        print(f"   ✓ Created {len(meetings)} donor meetings")
    
    def update_engagement_scores(self):
        """
        Update engagement scores for donors based on their activity
        """
        print("\n📊 Updating Engagement Scores...")
        
        # Calculate engagement scores based on meetings and other factors
        self.cursor.execute("""
            WITH donor_engagement AS (
                SELECT 
                    d.id,
                    COUNT(DISTINCT dm.id) as meeting_count,
                    MAX(dm.actual_date) as last_meeting
                FROM donors d
                LEFT JOIN donor_meetings dm ON d.id = dm.donor_id
                WHERE d.organization_id = %s
                GROUP BY d.id
            )
            UPDATE donors d
            SET engagement_score = LEAST(100, (
                (COALESCE(de.meeting_count, 0) * 15) +
                (CASE WHEN de.last_meeting >= CURRENT_DATE - INTERVAL '30 days' THEN 25 ELSE 0 END) +
                (CASE WHEN de.last_meeting >= CURRENT_DATE - INTERVAL '90 days' THEN 15 ELSE 0 END) +
                30  -- Base score
            )),
            updated_at = NOW()
            FROM donor_engagement de
            WHERE d.id = de.id
        """, (self.org_id,))
        
        updated_count = self.cursor.rowcount
        self.conn.commit()
        
        print(f"   ✓ Updated {updated_count} engagement scores")
        
        # Show distribution
        self.cursor.execute("""
            SELECT 
                CASE 
                    WHEN engagement_score >= 75 THEN 'Highly Engaged (75+)'
                    WHEN engagement_score >= 50 THEN 'Engaged (50-74)'
                    WHEN engagement_score >= 25 THEN 'Warm (25-49)'
                    ELSE 'Cold (0-24)'
                END as tier,
                COUNT(*)
            FROM donors
            WHERE organization_id = %s
            AND engagement_score IS NOT NULL
            GROUP BY tier
            ORDER BY MIN(engagement_score) DESC
        """, (self.org_id,))
        
        print("\n   Engagement Distribution:")
        for tier, count in self.cursor.fetchall():
            print(f"      {tier:<25} {count:>5} donors")
    
    def generate_all(self):
        """Run all data generation methods"""
        print("\n" + "=" * 70)
        print("MAJOR GIFTS PRIORITIZATION DATA GENERATOR")
        print("=" * 70)
        print(f"Target Organization: {self.org_id}")
        
        try:
            # Load existing data
            if not self.load_existing_data():
                print("\n❌ Cannot proceed without donors. Exiting.")
                return False
            
            # Update donor data
            self.update_donor_levels()
            self.update_giving_capacity()
            self.create_donor_priority_cache()
            self.create_donor_meetings()
            self.update_engagement_scores()
            
            # Summary
            print("\n" + "=" * 70)
            print("✅ DATA GENERATION COMPLETE!")
            print("=" * 70)
            
            # Final statistics
            self.cursor.execute("""
                SELECT 
                    COUNT(DISTINCT CASE WHEN donor_level IN ('mega_donor', 'major_donor', 'mid_level') THEN id END) as major_donors,
                    COUNT(DISTINCT CASE WHEN giving_capacity IS NOT NULL THEN id END) as with_capacity,
                    COUNT(DISTINCT CASE WHEN engagement_score IS NOT NULL THEN id END) as with_engagement
                FROM donors
                WHERE organization_id = %s
            """, (self.org_id,))
            
            stats = self.cursor.fetchone()
            
            self.cursor.execute("""
                SELECT COUNT(*) FROM donor_priority_cache WHERE organization_id = %s
            """, (self.org_id,))
            cache_count = self.cursor.fetchone()[0]
            
            self.cursor.execute("""
                SELECT COUNT(*) FROM donor_meetings WHERE organization_id = %s
            """, (self.org_id,))
            meeting_count = self.cursor.fetchone()[0]
            
            print(f"\n📊 Summary for Organization {self.org_id}:")
            print(f"   • {len(self.donor_ids)} total donors")
            print(f"   • {stats[0]} major/mid-level donors")
            print(f"   • {stats[1]} donors with giving capacity")
            print(f"   • {stats[2]} donors with engagement scores")
            print(f"   • {cache_count} priority cache records")
            print(f"   • {meeting_count} donor meetings")
            print(f"   • {len(self.mgo_ids)} major gift officers")
            
            print("\n🎉 All major gifts prioritization data created!")
            print("\nThese endpoints should now have data:")
            print("   • /api/v1/major-gifts/prioritization/capacity")
            print("   • /api/v1/major-gifts/prioritization/engagement")
            print("   • /api/v1/major-gifts/prioritization/likelihood")
            print("   • /api/v1/major-gifts/prioritization/portfolio-gaps")
            print("   • /api/v1/major-gifts/prioritization/urgency")
            print("   • /api/v1/major-gifts/prioritization/summary")
            print()
            
            return True
            
        except Exception as e:
            self.conn.rollback()
            print(f"\n❌ Error: {e}")
            raise
        finally:
            self.close()

def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("SETUP")
    print("=" * 70)
    
    org_id = TARGET_ORG_ID
    print(f"\nTarget Organization ID: {org_id}")
    
    # Confirm
    print("\n⚠️  This will:")
    print("   • Update donor levels (mega_donor, major_donor, etc.)")
    print("   • Set giving capacity estimates")
    print("   • Create donor priority cache with officer assignments")
    print("   • Create donor meetings (2-8 per major donor)")
    print("   • Update engagement scores")
    print(f"\n   For organization: {org_id}")
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Cancelled.")
        return
    
    # Run generation
    generator = MajorGiftsDataGenerator(org_id)
    try:
        generator.generate_all()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Exiting...")
        generator.close()
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        generator.close()

if __name__ == "__main__":
    main()
