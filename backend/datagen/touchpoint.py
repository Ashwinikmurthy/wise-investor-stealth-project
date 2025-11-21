#!/usr/bin/env python3
"""
Stewardship, Touchpoint & Communications Data Generator
=========================================================
Creates stewardship plans, touchpoint logs, and communication records
for a specific organization.

These methods are extracted from gen_demo_data_2org.py and are
perfectly working implementations.

Usage:
    python create_stewardship_touchpoint_comms.py

Author: Ashwini
Date: November 2025
"""

import uuid
import random
from datetime import datetime, date, timedelta
import psycopg2
from psycopg2.extras import execute_batch

# Database configuration
DB_CONFIG = {
    'dbname': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'host': 'localhost',
    'port': '5432'
}

# Target organization ID (hard-coded as requested)
TARGET_ORG_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'

# ============================================
# HELPER FUNCTIONS
# ============================================

def generate_uuid():
    """Generate a new UUID"""
    return str(uuid.uuid4())

def random_date(start_year, end_year):
    """Generate a random date between start_year and end_year"""
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

def random_datetime(start_year, end_year):
    """Generate a random datetime between start_year and end_year"""
    d = random_date(start_year, end_year)
    return datetime.combine(d, datetime.min.time()) + timedelta(
        hours=random.randint(8, 18),
        minutes=random.randint(0, 59)
    )

# ============================================
# STEWARDSHIP, TOUCHPOINT & COMMS GENERATOR
# ============================================

class StewardshipDataGenerator:
    def __init__(self, org_id):
        self.org_id = org_id
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cursor = self.conn.cursor()
        
        # Will be populated from database
        self.donor_ids = []
        self.user_ids = []
        
    def close(self):
        """Close database connection"""
        self.cursor.close()
        self.conn.close()
        print("\n✓ Database connection closed")
    
    def load_existing_data(self):
        """Load existing donor and user IDs from database"""
        print(f"\n📊 Loading existing data for organization {self.org_id}...")
        
        # Load donor IDs
        self.cursor.execute("""
            SELECT id FROM donors
            WHERE organization_id = %s
            ORDER BY created_at
        """, (self.org_id,))
        
        self.donor_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(self.donor_ids)} donors")
        
        # Load user IDs
        self.cursor.execute("""
            SELECT id FROM users
            WHERE organization_id = %s
            ORDER BY created_at
        """, (self.org_id,))
        
        self.user_ids = [row[0] for row in self.cursor.fetchall()]
        print(f"   Found {len(self.user_ids)} users")
        
        if not self.donor_ids:
            print("\n⚠️  WARNING: No donors found for this organization!")
            print("   Run generate_comprehensive_analytics_data.py first to create donors.")
            return False
        
        return True
    
    def create_stewardship_data(self):
        """
        Create stewardship tracking plans
        
        Creates stewardship plans for major donors showing engagement
        and cultivation activities over time.
        """
        print("\n📋 Creating Stewardship Plans...")
        
        num = min(100, len(self.donor_ids))
        
        plans = []
        for _ in range(num):
            plan_id = generate_uuid()
            
            start_date = date.today() - timedelta(days=random.randint(30, 365))
            end_date = date.today() + timedelta(days=random.randint(180, 730))
            
            plans.append((
                plan_id,
                self.org_id,
                random.choice(self.donor_ids),
                random.choice([
                    "Major Donor Stewardship",
                    "Monthly Giver Engagement",
                    "Legacy Society Member",
                    "Leadership Circle Cultivation",
                    "Annual Fund Stewardship",
                    "Capital Campaign Donor Care"
                ]),
                random.choice([
                    "On Track",
                    "Ahead of Schedule",
                    "Excellent Progress",
                    "Active",
                    "Thriving"
                ]),
                start_date,
                end_date,
                datetime.utcnow()
            ))
        
        # Insert stewardship plans
        execute_batch(self.cursor, """
            INSERT INTO stewardship_plans (id, organization_id, donor_id, plan_name,
                status, start_date, end_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, plans)
        
        self.conn.commit()
        print(f"   ✓ Created {num} stewardship plans")
        
        return num
    
    def create_touchpoint_logs(self):
        """
        Create donor touchpoint logs
        
        Records all interactions with donors including emails, phone calls,
        meetings, events, etc. for comprehensive relationship tracking.
        """
        print("\n📞 Creating Touchpoint Logs...")
        
        num = min(500, len(self.donor_ids) * 2)
        touchpoint_types = [
            "Email",
            "Phone Call",
            "In-Person Meeting",
            "Virtual Meeting",
            "Event Attendance",
            "Mail",
            "Text Message",
            "Social Media Interaction"
        ]
        
        touchpoints = []
        for _ in range(num):
            touchpoint_type = random.choice(touchpoint_types)
            created_at = random_datetime(2023, 2024)
            
            # Generate contextual notes based on touchpoint type
            notes_options = {
                "Email": [
                    "Great conversation about program impact and giving opportunities.",
                    "Donor expressed interest in increasing support next year.",
                    "Sent thank you note and impact report.",
                    "Follow-up on recent donation and program updates."
                ],
                "Phone Call": [
                    "Wonderful discussion about donor's philanthropic goals.",
                    "Donor very engaged and interested in expanding involvement.",
                    "Discussed potential major gift opportunity.",
                    "Scheduled in-person meeting for next month."
                ],
                "In-Person Meeting": [
                    "Productive meeting at donor's office. Very enthusiastic.",
                    "Tour of facilities - donor impressed with program outcomes.",
                    "Discussed legacy giving options and estate planning.",
                    "Great connection - donor excited about upcoming projects."
                ],
                "Event Attendance": [
                    "Donor attended annual gala - excellent engagement.",
                    "Met donor at program showcase - very positive feedback.",
                    "Donor brought friends to event - potential new prospects.",
                    "Great networking opportunity at stewardship event."
                ]
            }
            
            notes = random.choice(notes_options.get(touchpoint_type, [
                "Great conversation about program impact and giving opportunities.",
                "Positive interaction - donor very engaged.",
                "Excellent engagement and relationship building."
            ]))
            
            touchpoints.append((
                generate_uuid(),
                self.org_id,
                random.choice(self.donor_ids),
                touchpoint_type,
                notes,
                created_at,
                random.choice(self.user_ids) if self.user_ids else None
            ))
        
        # Insert touchpoint logs
        execute_batch(self.cursor, """
            INSERT INTO touchpoint_logs (id, organization_id, donor_id, touchpoint_type,
                notes, created_at, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, touchpoints)
        
        self.conn.commit()
        print(f"   ✓ Created {num} touchpoint logs")
        
        return num
    
    def create_communications(self):
        """
        Create communication records
        
        Tracks all communications sent to donors including thank you letters,
        newsletters, receipts, and program updates with delivery and engagement metrics.
        """
        print("\n✉️  Creating Communication Records...")
        
        num = min(1000, len(self.donor_ids) * 4)
        
        communications = []
        for _ in range(num):
            comm_type = random.choice([
                "thank_you",
                "newsletter",
                "receipt",
                "update",
                "announcement",
                "invitation"
            ])
            
            channel = random.choice([
                "email",
                "letter",
                "sms",
                "phone"
            ])
            
            status = random.choice([
                "delivered",
                "opened",
                "clicked",
                "responded"
            ])
            
            sent_at = random_datetime(2023, 2024)
            
            # Generate subject based on communication type
            subjects = {
                "thank_you": [
                    "Thank You for Your Generous Support",
                    "Your Gift Makes a Difference",
                    "Grateful for Your Partnership",
                    "Thank You for Changing Lives"
                ],
                "newsletter": [
                    "Monthly Newsletter - Program Highlights",
                    "Impact Update: Your Support in Action",
                    "Community Newsletter - Success Stories",
                    "Quarterly Impact Report"
                ],
                "receipt": [
                    "Tax Receipt for Your Donation",
                    "Donation Receipt - Thank You",
                    "Your 2024 Giving Summary",
                    "Year-End Tax Receipt"
                ],
                "update": [
                    "Program Update: Exciting News",
                    "Impact Story: Lives Changed",
                    "Project Progress Update",
                    "Community Impact Report"
                ],
                "announcement": [
                    "Important Announcement from Our Team",
                    "New Program Launch",
                    "Leadership Update",
                    "Exciting Expansion News"
                ],
                "invitation": [
                    "You're Invited: Annual Gala",
                    "Join Us for a Special Event",
                    "Exclusive Tour Invitation",
                    "Save the Date: Donor Appreciation"
                ]
            }
            
            subject = random.choice(subjects.get(comm_type, ["Important Update"]))
            
            delivered_at = sent_at + timedelta(minutes=random.randint(1, 30))
            opened_at = None
            if status in ["opened", "clicked", "responded"]:
                opened_at = sent_at + timedelta(hours=random.randint(1, 48))
            
            communications.append((
                generate_uuid(),
                self.org_id,
                random.choice(self.donor_ids),
                comm_type,
                channel,
                subject,
                status,
                sent_at,
                delivered_at,
                opened_at,
                datetime.utcnow(),
                datetime.utcnow()
            ))
        
        # Insert communications
        execute_batch(self.cursor, """
            INSERT INTO communications (id, organization_id, donor_id, communication_type,
                channel, subject, status, sent_at, delivered_at, opened_at, created_at,
                updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, communications)
        
        self.conn.commit()
        print(f"   ✓ Created {num} communications")
        
        return num
    
    def generate_all(self):
        """Run all data generation methods"""
        print("\n" + "=" * 70)
        print("STEWARDSHIP, TOUCHPOINT & COMMUNICATIONS DATA GENERATOR")
        print("=" * 70)
        print(f"Target Organization: {self.org_id}")
        
        try:
            # Load existing data
            if not self.load_existing_data():
                print("\n❌ Cannot proceed without donors. Exiting.")
                return False
            
            # Create all data
            stewardship_count = self.create_stewardship_data()
            touchpoint_count = self.create_touchpoint_logs()
            comm_count = self.create_communications()
            
            # Summary
            print("\n" + "=" * 70)
            print("✅ DATA GENERATION COMPLETE!")
            print("=" * 70)
            print(f"\n📊 Summary for Organization {self.org_id}:")
            print(f"   • {len(self.donor_ids)} donors found")
            print(f"   • {len(self.user_ids)} users found")
            print(f"   • {stewardship_count} stewardship plans created")
            print(f"   • {touchpoint_count} touchpoint logs created")
            print(f"   • {comm_count} communications created")
            
            print("\n🎉 All stewardship, touchpoint, and communication data created!")
            print("\nThese endpoints should now have data:")
            print("   • /api/v1/analytics/{org_id}/stewardship/touchpoints")
            print("   • /api/v1/analytics/{org_id}/stewardship/dx-score")
            print("   • /api/v1/analytics/{org_id}/stewardship/plan-progress")
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
    print("\n⚠️  This will create:")
    print("   • Up to 100 stewardship plans")
    print("   • Up to 500 touchpoint logs")
    print("   • Up to 1000 communication records")
    print(f"\n   For organization: {org_id}")
    
    confirm = input("\nProceed? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Cancelled.")
        return
    
    # Run generation
    generator = StewardshipDataGenerator(org_id)
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
