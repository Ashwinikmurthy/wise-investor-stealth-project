"""
COMPLETE FIXED Data Generation Script
- Removed ALL ON CONFLICT clauses
- Fast password hashing (not bcrypt)
- Fixed slug generation
- Progress indicators
"""

import sys
import random
import hashlib
from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from uuid import uuid4
from faker import Faker
import psycopg2
from psycopg2.extras import execute_batch

fake = Faker()
Faker.seed(2024)
random.seed(2024)

# FAST hashing for test data (not production!)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def now_utc():
    return datetime.now(timezone.utc)

DB_CONFIG = {
    'dbname': 'organization_db3',
    'user': 'orguser3',
    'password': 'orgpassword3',
    'host': 'localhost',
    'port': 5432
}

DONOR_TYPES = ['individual', 'corporate', 'foundation']
DONOR_STATUSES = ['active', 'lapsed', 'prospect']
DONOR_LEVELS = ['mega_donor', 'major_donor', 'mid_level', 'upper_donor', 'lower_donor']
PAYMENT_METHODS = ['cash', 'check', 'credit_card', 'bank_transfer', 'stock']
PAYMENT_STATUSES = ['pending', 'completed', 'failed']
CAMPAIGN_TYPES = ['general', 'project', 'emergency', 'capital', 'endowment', 'annual']
CAMPAIGN_STATUSES = ['draft', 'active', 'completed', 'archived']
PROGRAM_STATUSES = ['active', 'completed', 'planned']

class DataGenerator:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.generated_data = {
            'organizations': [],
            'users': [],
            'programs': [],
            'campaigns': [],
            'donors': [],
            'donations': []
        }
        
    def connect(self):
        print("\n🔌 Connecting to database...")
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.cur = self.conn.cursor()
        print("✅ Connected successfully!")
        
    def disconnect(self):
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
        print("\n🔌 Database connection closed")
        
    def generate_organizations(self, count=20):
        print(f"\n🏢 Generating {count} organizations...")
        organizations = []
        
        for i in range(count):
            org_id = uuid4()
            org_name = fake.company()
            slug = f"{org_name.lower().replace(' ', '-').replace(',', '').replace('.', '')[:200]}-{str(uuid4())[:8]}"
            
            org_data = (
                str(org_id), org_name, fake.ein(), fake.catch_phrase(),
                fake.date_between(start_date='-50y', end_date='-5y'),
                fake.street_address(), fake.city(), fake.state(), 'USA', fake.zipcode(),
                fake.phone_number(), fake.company_email(), fake.url(), None, True,
                now_utc(), now_utc(), f"{random.randint(1, 12)}/30",
                float(Decimal(random.randint(500000, 50000000))), slug
            )
            organizations.append(org_data)
            self.generated_data['organizations'].append({
                'id': org_id,
                'name': org_name
            })
        
        insert_query = """
            INSERT INTO organizations (
                id, name, ein, mission, founded_date, address, city, state, country,
                postal_code, phone, email, website, logo_url, is_active, created_at,
                updated_at, fiscal_year_end, annual_budget, slug
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, organizations, page_size=10)
        self.conn.commit()
        print(f"✅ Generated {count} organizations")
        
    def generate_users(self, users_per_org=16):
        total_users = len(self.generated_data['organizations']) * users_per_org
        print(f"\n👥 Generating {total_users} users...")
        
        all_users = []
        user_roles = ['org_admin', 'staff', 'fundraising', 'manager']
        
        for org in self.generated_data['organizations']:
            org_id = org['id']
            for i in range(users_per_org):
                user_id = uuid4()
                first_name = fake.first_name()
                last_name = fake.last_name()
                email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.org"
                full_name = f"{first_name} {last_name}"
                
                user_data = (
                    str(user_id), str(org_id), email, hash_password("Password123!"),
                    first_name, last_name, fake.phone_number(), True, False, None,
                    now_utc(), now_utc(), full_name, random.choice(user_roles),
                    False, None, None
                )
                all_users.append(user_data)
                
                # Progress indicator
                if len(all_users) % 50 == 0:
                    print(f"  ⏳ Generated {len(all_users)}/{total_users} users...")
        
        insert_query = """
            INSERT INTO users (
                id, organization_id, email, password_hash, first_name, last_name,
                phone, is_active, is_superadmin, last_login, created_at, updated_at,
                full_name, role, email_verified, invitation_token, invitation_expires_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(all_users), 50):
            batch = all_users[i:i + 50]
            execute_batch(self.cur, insert_query, batch, page_size=50)
            self.conn.commit()
            print(f"  📝 Batch {i//50 + 1}/{(len(all_users)-1)//50 + 1}")
        
        print(f"✅ Generated {len(all_users)} users")
        
    def generate_campaigns(self, campaigns_per_org=3):
        total_campaigns = len(self.generated_data['organizations']) * campaigns_per_org
        print(f"\n📣 Generating {total_campaigns} campaigns...")
        
        campaigns = []
        for org in self.generated_data['organizations']:
            org_id = org['id']
            for i in range(campaigns_per_org):
                campaign_id = uuid4()
                campaign_type = random.choice(CAMPAIGN_TYPES)
                campaign_name = f"{org['name']} {campaign_type.title()} 202{random.randint(3, 5)}"
                slug = f"{campaign_name.lower().replace(' ', '-')[:200]}-{str(uuid4())[:8]}"
                
                goal = float(Decimal(random.randint(50000, 2000000)))
                raised = goal * random.uniform(0.2, 1.1)
                
                start_date = fake.date_between(start_date='-1y', end_date='today')
                end_date = fake.date_between(start_date=start_date, end_date='+6M')
                
                campaign_data = (
                    str(campaign_id), str(org_id), campaign_name, slug,
                    fake.paragraph(), fake.paragraph(),
                    campaign_type, random.choice(CAMPAIGN_STATUSES),
                    goal, raised, start_date, end_date,
                    True, False, True, '25,50,100,250',
                    None, None, None, None,
                    now_utc(), now_utc()
                )
                campaigns.append(campaign_data)
                self.generated_data['campaigns'].append({
                    'id': campaign_id,
                    'organization_id': org_id
                })
        
        insert_query = """
            INSERT INTO campaigns (
                id, organization_id, name, slug, description, story,
                campaign_type, status, goal_amount, raised_amount,
                start_date, end_date, is_public, is_featured,
                allow_recurring, suggested_amounts, image_url, video_url,
                meta_title, meta_description, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, campaigns, page_size=20)
        self.conn.commit()
        print(f"✅ Generated {total_campaigns} campaigns")
        
    def generate_donors(self, donors_per_org=100):
        total_donors = len(self.generated_data['organizations']) * donors_per_org
        print(f"\n👤 Generating {total_donors} donors...")
        
        donors = []
        for org in self.generated_data['organizations']:
            org_id = org['id']
            
            for i in range(donors_per_org):
                donor_id = uuid4()
                donor_type = random.choice(DONOR_TYPES)
                
                if donor_type == 'individual':
                    first_name = fake.first_name()
                    last_name = fake.last_name()
                else:
                    first_name = fake.company()
                    last_name = 'Corp' if donor_type == 'corporate' else 'Foundation'
                
                # Determine donor level
                level_roll = random.random()
                if level_roll < 0.05:
                    donor_level = 'mega_donor'
                    amount_range = (100000, 500000)
                elif level_roll < 0.15:
                    donor_level = 'major_donor'
                    amount_range = (10000, 99999)
                elif level_roll < 0.35:
                    donor_level = 'mid_level'
                    amount_range = (1000, 9999)
                elif level_roll < 0.70:
                    donor_level = 'upper_donor'
                    amount_range = (100, 999)
                else:
                    donor_level = 'lower_donor'
                    amount_range = (10, 99)
                
                total_donated = float(Decimal(random.uniform(*amount_range)))
                lifetime_value = total_donated * random.uniform(1.2, 2.0)
                
                donor_data = (
                    str(donor_id), str(org_id), donor_type, first_name, last_name,
                    fake.email(), fake.phone_number(),
                    fake.street_address(), fake.city(), fake.state(), fake.zipcode(), 'USA',
                    fake.date_between(start_date='-10y', end_date='today'),
                    fake.date_between(start_date='-1y', end_date='today'),
                    random.choice(DONOR_STATUSES), total_donated, lifetime_value,
                    donor_level, random.randint(1, 50),
                    float(Decimal(random.uniform(*amount_range))),
                    random.choice([True, False]),
                    now_utc(), now_utc()
                )
                donors.append(donor_data)
                self.generated_data['donors'].append({
                    'id': donor_id,
                    'organization_id': org_id,
                    'amount_range': amount_range
                })
                
                # Progress indicator
                if len(donors) % 200 == 0:
                    print(f"  ⏳ Generated {len(donors)}/{total_donors} donors...")
        
        insert_query = """
            INSERT INTO donors (
                id, organization_id, donor_type, first_name, last_name, email, phone,
                address, city, state, postal_code, country,
                first_donation_date, last_donation_date, donor_status,
                total_donated, lifetime_value, donor_level, donation_count,
                giving_capacity, planned_giving, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(donors), 100):
            batch = donors[i:i + 100]
            execute_batch(self.cur, insert_query, batch, page_size=100)
            self.conn.commit()
            print(f"  📝 Batch {i//100 + 1}/{(len(donors)-1)//100 + 1}")
        
        print(f"✅ Generated {len(donors)} donors")
        
    def generate_donations(self, avg_per_donor=5):
        total_donations = len(self.generated_data['donors']) * avg_per_donor
        print(f"\n💵 Generating ~{total_donations} donations...")
        
        donations = []
        for donor in self.generated_data['donors']:
            donor_id = donor['id']
            org_id = donor['organization_id']
            min_amount, max_amount = donor['amount_range']
            
            num_donations = random.randint(1, avg_per_donor * 2)
            
            for _ in range(num_donations):
                donation_id = uuid4()
                amount = float(Decimal(random.uniform(min_amount * 0.5, max_amount)))
                donation_date = fake.date_between(start_date='-3y', end_date='today')
                
                # Get random campaign
                org_campaigns = [c for c in self.generated_data['campaigns']
                               if c['organization_id'] == org_id]
                campaign_id = str(random.choice(org_campaigns)['id']) if org_campaigns else None
                
                donation_data = (
                    str(donation_id), str(org_id), str(donor_id), campaign_id,
                    amount, donation_date,
                    random.choice(PAYMENT_METHODS),
                    random.choice(PAYMENT_STATUSES),
                    now_utc(), now_utc()
                )
                donations.append(donation_data)
                
                # Progress indicator
                if len(donations) % 500 == 0:
                    print(f"  ⏳ Generated {len(donations)}/{total_donations} donations...")
        
        insert_query = """
            INSERT INTO donations (
                id, organization_id, donor_id, campaign_id, amount, donation_date,
                payment_method, payment_status, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(donations), 200):
            batch = donations[i:i + 200]
            execute_batch(self.cur, insert_query, batch, page_size=200)
            self.conn.commit()
            if (i // 200) % 5 == 0:
                print(f"  📝 Batch {i//200 + 1}/{(len(donations)-1)//200 + 1}")
        
        print(f"✅ Generated {len(donations)} donations")
        
    def run(self):
        try:
            self.connect()
            
            # Generate data
            self.generate_organizations(count=20)
            self.generate_users(users_per_org=16)
            self.generate_campaigns(campaigns_per_org=3)
            self.generate_donors(donors_per_org=100)
            self.generate_donations(avg_per_donor=5)
            
            print("\n" + "="*70)
            print("✅ DATA GENERATION COMPLETE!")
            print("="*70)
            print(f"\n📊 Summary:")
            print(f"  Organizations: {len(self.generated_data['organizations'])}")
            print(f"  Users: {len(self.generated_data['organizations']) * 16}")
            print(f"  Campaigns: {len(self.generated_data['campaigns'])}")
            print(f"  Donors: {len(self.generated_data['donors'])}")
            print(f"  Donations: ~{len(self.generated_data['donors']) * 5}")
            print(f"\n🎉 Your database is now populated with test data!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            self.conn.rollback()
        finally:
            self.disconnect()

if __name__ == "__main__":
    generator = DataGenerator()
    generator.run()
