"""
Comprehensive Analytics Data Generator for Wise Investor Platform
==================================================================
Generates realistic data for ALL analytics endpoints including:
- Donor retention & cohorts
- Campaign analytics & ROI
- Major gifts & moves management
- Financial analytics
- Impact analytics
- P2SG dashboard
- Cash flow & churn
- Wise Investor scores
- And more

Author: Ashwini
Date: November 2025
"""

import random
import uuid
from datetime import datetime, timedelta, date
from decimal import Decimal
from faker import Faker
import psycopg2
import psycopg2.extras
from psycopg2.extras import execute_batch, Json
import sys

# Register UUID adapter for psycopg2
psycopg2.extras.register_uuid()

fake = Faker()
Faker.seed(42)
random.seed(42)

# Database connection parameters
DB_CONFIG = {
    'dbname': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'host': 'localhost',
    'port': '5432'
}


# ============================================================================
# CONFIGURATION & DATA GENERATORS
# ============================================================================

class DataGenerator:
    """Main data generation orchestrator"""
    
    def __init__(self, org_id):
        self.org_id = str(org_id)  # Ensure it's a string
        self.conn = None
        self.cursor = None
        
        # Storage for generated IDs
        self.user_ids = []
        self.donor_ids = []
        self.party_ids = []
        self.campaign_ids = []
        self.program_ids = []
        self.fund_ids = []
        self.expense_category_ids = []
        self.officer_ids = []
        self.grant_ids = []
        
        # Date ranges
        self.today = date.today()
        self.start_date = self.today - timedelta(days=1095)  # 3 years back
        
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("✓ Connected to database")
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            sys.exit(1)
            
    def close(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✓ Database connection closed")
        
    def clear_existing_data(self):
        """Clear existing generated data for this organization"""
        print("\n⚠️  CLEARING EXISTING DATA...")
        
        tables_to_clear = [
            'outcome_records', 'outcome_metrics', 'impact_metrics',
            'wise_investor_scores', 'second_gift_tracking', 'donor_engagement_continuum',
            'cashflow_reports', 'donor_churn_metrics', 'donor_scores',
            'payments', 'grant_reports', 'grants', 'expenses',
            'donor_priority_cache', 'solicitation_proposals', 'gift_goals',
            'donor_meetings', 'moves_management_stages', 'officer_annual_targets',
            'major_gift_officers', 'pledge_installments', 'pledges',
            'recurring_gifts', 'donation_lines', 'donations', 'donors', 'parties',
            'expense_categories', 'campaigns', 'funds', 'programs', 'users'
        ]
        
        try:
            for table in tables_to_clear:
                self.cursor.execute(f"DELETE FROM {table} WHERE organization_id = %s", (self.org_id,))
            self.conn.commit()
            print("✓ Existing data cleared")
        except Exception as e:
            self.conn.rollback()
            print(f"⚠️  Warning: Could not clear some data: {e}")
            print("   Continuing anyway...")
    
    def generate_all(self, clear_first=False):
        """Generate all data"""
        try:
            self.connect()
            
            if clear_first:
                self.clear_existing_data()
            
            print("\n" + "="*70)
            print("COMPREHENSIVE ANALYTICS DATA GENERATION")
            print("="*70)
            
            # Core data
            print("\n📊 PHASE 1: Core Infrastructure")
            self.generate_users()
            self.generate_programs()
            self.generate_funds()
            self.generate_campaigns()
            self.generate_expense_categories()
            
            # Donor data
            print("\n👥 PHASE 2: Donor Ecosystem")
            self.generate_parties_and_donors()
            self.generate_donations_historical()
            self.generate_recurring_gifts()
            self.generate_pledges()
            
            # Major gifts
            print("\n💎 PHASE 3: Major Gifts Infrastructure")
            self.generate_major_gift_officers()
            self.generate_moves_management()
            self.generate_donor_meetings()
            self.generate_gift_goals()
            self.generate_solicitation_proposals()
            self.generate_donor_priorities()
            
            # Financial data
            print("\n💰 PHASE 4: Financial Data")
            self.generate_expenses()
            self.generate_grants()
            self.generate_payments()
            
            # Analytics-specific data
            print("\n📈 PHASE 5: Advanced Analytics")
            self.generate_donor_scores()
            self.generate_churn_metrics()
            self.generate_cashflow_reports()
            self.generate_engagement_continuum()
            self.generate_second_gift_tracking()
            self.generate_wise_investor_scores()
            
            # Impact & outcomes
            print("\n🎯 PHASE 6: Impact & Outcomes")
            self.generate_impact_metrics()
            self.generate_outcome_metrics()
            
            self.conn.commit()
            print("\n" + "="*70)
            print("✓ ALL DATA GENERATED SUCCESSFULLY!")
            print("="*70)
            
            self.print_summary()
            
        except Exception as e:
            self.conn.rollback()
            print(f"\n✗ ERROR: {e}")
            raise
        finally:
            self.close()
    
    # ========================================================================
    # CORE INFRASTRUCTURE
    # ========================================================================
    
    def generate_users(self):
        """Generate users including major gift officers"""
        print("  → Generating users...")
        
        roles = ['admin', 'development_manager', 'gift_officer', 'analyst', 'finance_manager']
        
        users = []
        for i in range(15):
            user_id = str(uuid.uuid4())
            users.append((
                user_id,
                str(self.org_id),
                fake.email(),
                fake.password(),  # This becomes password_hash
                fake.first_name(),
                fake.last_name(),
                random.choice(roles),
                True,  # is_active
                datetime.now(),
                datetime.now()
            ))
            self.user_ids.append(user_id)
        
        execute_batch(self.cursor, """
            INSERT INTO users (id, organization_id, email, password_hash, first_name, 
                             last_name, role, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, users)
        
        print(f"    ✓ Created {len(users)} users")
    
    def generate_programs(self):
        """Generate programs for the organization"""
        print("  → Generating programs...")
        
        program_names = [
            "Education & Literacy",
            "Health & Wellness",
            "Community Development",
            "Environmental Conservation",
            "Arts & Culture",
            "Youth Mentorship",
            "Senior Services"
        ]
        
        programs = []
        for name in program_names:
            program_id = str(uuid.uuid4())
            programs.append((
                program_id,
                self.org_id,
                name,
                fake.text(max_nb_chars=200),
                random.choice(['education', 'health', 'community', 'environment', 'social']),  # program_type
                random.uniform(50000, 500000),  # budget
                random.uniform(30000, 400000),  # actual_spending
                self.start_date,  # start_date
                self.today + timedelta(days=365),  # end_date
                'active',  # status
                datetime.now(),
                datetime.now()
            ))
            self.program_ids.append(program_id)
        
        execute_batch(self.cursor, """
            INSERT INTO programs (id, organization_id, name, description, program_type, budget, 
                                actual_spending, start_date, end_date, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, programs)
        
        print(f"    ✓ Created {len(programs)} programs")
    
    def generate_funds(self):
        """Generate funds for the organization"""
        print("  → Generating funds...")
        
        fund_names = [
            "General Operating Fund",
            "Endowment Fund",
            "Capital Campaign Fund",
            "Emergency Relief Fund",
            "Scholarship Fund",
            "Research Fund"
        ]
        
        funds = []
        for name in fund_names:
            fund_id = str(uuid.uuid4())
            funds.append((
                fund_id,
                self.org_id,
                name,
                random.choice(['unrestricted', 'temporarily_restricted', 'permanently_restricted']),  # restriction
                random.choice(self.program_ids) if self.program_ids and random.random() < 0.7 else None,  # program_id
                datetime.now(),
                f"FUND-{random.randint(1000, 9999)}",  # fund_code
                random.choice(['unrestricted', 'restricted', 'endowment']),  # fund_type
                random.uniform(100000, 1000000)  # target_amount
            ))
            self.fund_ids.append(fund_id)
        
        execute_batch(self.cursor, """
            INSERT INTO funds (id, organization_id, name, restriction, program_id, 
                             created_at, fund_code, fund_type, target_amount)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, funds)
        
        print(f"    ✓ Created {len(funds)} funds")
    
    def generate_campaigns(self):
        """Generate campaigns with historical data"""
        print("  → Generating campaigns...")
        
        campaign_types = ['general', 'annual', 'monthly_giving', 'project', 'capital', 'emergency', 'endowment']
        statuses = ['active', 'completed', 'draft']
        
        campaigns = []
        
        # Historical campaigns (last 3 years)
        for year_offset in range(3):
            base_date = self.today - timedelta(days=365 * year_offset)
            
            for i in range(6):  # 6 campaigns per year
                campaign_id = str(uuid.uuid4())
                start_date = base_date - timedelta(days=random.randint(0, 300))
                end_date = start_date + timedelta(days=random.randint(30, 120))
                
                goal = random.randint(25000, 500000)
                
                campaign_name = f"{random.choice(['Spring', 'Summer', 'Fall', 'Winter'])} {random.choice(['Appeal', 'Drive', 'Campaign'])} {2025 - year_offset}"
                campaign_slug = f"{campaign_name.lower().replace(' ', '-')}-{campaign_id[:8]}"
                goal = random.randint(25000, 500000)
                raised = random.uniform(goal * 0.4, goal * 1.2) if year_offset > 0 else random.uniform(0, goal * 0.8)
                
                campaigns.append((
                    campaign_id,
                    self.org_id,
                    campaign_name,
                    campaign_slug,
                    fake.text(max_nb_chars=200),
                    random.choice(campaign_types),
                    'completed' if year_offset > 0 else random.choice(['active', 'completed']),
                    goal,
                    raised,  # raised_amount
                    start_date,
                    end_date,
                    goal * random.uniform(0.05, 0.15),  # marketing_cost
                    datetime.now(),
                    datetime.now()
                ))
                self.campaign_ids.append(campaign_id)
        
        execute_batch(self.cursor, """
            INSERT INTO campaigns (id, organization_id, name, slug, description, campaign_type, 
                                 status, goal_amount, raised_amount, start_date, end_date, 
                                 marketing_cost, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, CAST(%s AS campaigntype), CAST(%s AS campaignstatus), 
                    %s, %s, %s, %s, %s, %s, %s)
        """, campaigns)
        
        print(f"    ✓ Created {len(campaigns)} campaigns")
    
    def generate_expense_categories(self):
        """Generate expense categories"""
        print("  → Generating expense categories...")
        
        categories = [
            ('Program Services', 'program', 'Direct program delivery costs'),
            ('Administrative', 'administrative', 'General administrative expenses'),
            ('Fundraising', 'fundraising', 'Development and fundraising costs'),
            ('Marketing', 'fundraising', 'Marketing and communications'),
            ('Salaries & Benefits', 'administrative', 'Personnel costs'),
            ('Facilities', 'administrative', 'Rent, utilities, maintenance'),
            ('Professional Services', 'administrative', 'Legal, accounting, consulting'),
            ('Technology', 'administrative', 'Software, hardware, IT services')
        ]
        
        expense_cats = []
        for name, cat_type, description in categories:
            cat_id = str(uuid.uuid4())
            expense_cats.append((
                cat_id,
                self.org_id,
                name,
                description,
                cat_type,
                True,
                datetime.now(),
                datetime.now()
            ))
            self.expense_category_ids.append(cat_id)
        
        execute_batch(self.cursor, """
            INSERT INTO expense_categories (id, organization_id, name, description, 
                                          category_type, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, expense_cats)
        
        print(f"    ✓ Created {len(expense_cats)} expense categories")
    
    # ========================================================================
    # DONOR ECOSYSTEM
    # ========================================================================
    
    def generate_parties_and_donors(self):
        """Generate parties (donors) with various profiles"""
        print("  → Generating parties and donors...")
        
        donor_levels = ['mega_donor', 'major_donor', 'mid_level', 'upper_donor', 'lower_donor']
        donor_level_weights = [0.02, 0.08, 0.20, 0.30, 0.40]  # Distribution
        
        parties = []
        donors = []
        
        for i in range(500):  # 500 donors
            party_id = str(uuid.uuid4())
            donor_id = str(uuid.uuid4())
            
            is_organization = random.random() < 0.15  # 15% corporate donors
            
            if is_organization:
                party_name = fake.company()
                first_name = None
                last_name = None
            else:
                first_name = fake.first_name()
                last_name = fake.last_name()
                party_name = f"{first_name} {last_name}"
            
            # Party record
            parties.append((
                party_id,
                self.org_id,
                party_name,  # full_name
                party_name,  # display_name
                'organization' if is_organization else 'individual',  # donor_type
                fake.email(),
                fake.phone_number(),
                fake.street_address(),
                fake.city(),
                fake.state(),
                fake.postcode(),
                'USA',
                datetime.now()
            ))
            
            # Donor record
            donor_level = random.choices(donor_levels, weights=donor_level_weights)[0]
            
            # Calculate total donated based on level
            level_amounts = {
                'mega_donor': (100000, 1000000),
                'major_donor': (10000, 99999),
                'mid_level': (1000, 9999),
                'upper_donor': (100, 999),
                'lower_donor': (10, 99)
            }
            min_amt, max_amt = level_amounts[donor_level]
            total_donated = random.uniform(min_amt, max_amt)
            
            first_donation_date = self.start_date + timedelta(days=random.randint(0, 900))
            last_donation_date = self.today - timedelta(days=random.randint(0, 365))
            donation_count = random.randint(1, 50)
            
            donors.append((
                donor_id,
                self.org_id,
                party_id,
                first_name if not is_organization else party_name,
                last_name if not is_organization else '',
                fake.email(),
                fake.phone_number(),
                fake.street_address(),
                fake.city(),
                fake.state(),
                fake.postcode(),
                'USA',
                donor_level,
                total_donated,
                donation_count,
                first_donation_date,
                last_donation_date,
                total_donated / donation_count,  # average_donation
                max(total_donated * random.uniform(0.3, 0.8), total_donated / donation_count),  # largest_donation
                'active',
                datetime.now(),
                datetime.now()
            ))
            
            self.party_ids.append(party_id)
            self.donor_ids.append(donor_id)
        
        execute_batch(self.cursor, """
            INSERT INTO parties (id, organization_id, full_name, display_name, 
                               donor_type, email, phone, address, city, state, postal_code, 
                               country, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, parties)
        
        execute_batch(self.cursor, """
            INSERT INTO donors (id, organization_id, party_id, first_name, last_name, email, phone,
                              address, city, state, postal_code, country, donor_level, total_donated, 
                              donation_count, first_donation_date, last_donation_date, 
                              average_donation, largest_donation, donor_status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, donors)
        
        print(f"    ✓ Created {len(parties)} parties and {len(donors)} donors")
    
    def generate_donations_historical(self):
        """Generate historical donations with patterns for retention analysis"""
        print("  → Generating donations (this may take a moment)...")
        
        donations = []
        donation_lines = []
        
        # Generate donations for each donor
        for donor_id, party_id in zip(self.donor_ids, self.party_ids):
            # Determine donor giving pattern
            num_gifts = random.randint(1, 30)
            
            for gift_num in range(num_gifts):
                donation_id = str(uuid.uuid4())
                
                # Spread gifts over time
                days_back = random.randint(0, 1095)  # Up to 3 years
                donation_date = self.today - timedelta(days=days_back)
                received_date = donation_date + timedelta(days=random.randint(0, 5))
                
                # Amount varies
                amount = random.choice([
                    random.uniform(10, 99),
                    random.uniform(100, 499),
                    random.uniform(500, 999),
                    random.uniform(1000, 4999),
                    random.uniform(5000, 25000)
                ])
                
                # Assign to campaign (70% of donations)
                campaign_id = random.choice(self.campaign_ids) if random.random() < 0.7 else None
                fund_id = random.choice(self.fund_ids)
                
                donations.append((
                    donation_id,
                    self.org_id,
                    donor_id,
                    party_id,
                    amount,
                    donation_date,
                    random.choice(['credit_card', 'check', 'bank_transfer', 'cash']),
                    'completed',  # payment_status
                    campaign_id,
                    False,  # is_recurring
                    False,  # is_anonymous
                    True,  # receipt_sent
                    gift_num == 0,  # is_first_time (True if first gift)
                    gift_num > 0,  # is_repeat (True if not first gift)
                    datetime.now(),
                    datetime.now()
                ))
                
                # Add donation line
                donation_lines.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    donation_id,
                    amount,
                    random.choice(self.program_ids) if random.random() < 0.6 else None
                ))
        
        # Insert in batches
        batch_size = 1000
        for i in range(0, len(donations), batch_size):
            execute_batch(self.cursor, """
                INSERT INTO donations (id, organization_id, donor_id, party_id, amount, 
                                     donation_date, payment_method, payment_status, 
                                     campaign_id, is_recurring, is_anonymous, receipt_sent,
                                     is_first_time, is_repeat, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, donations[i:i+batch_size])
        
        for i in range(0, len(donation_lines), batch_size):
            execute_batch(self.cursor, """
                INSERT INTO donation_lines (id, organization_id, donation_id, amount, program_id)
                VALUES (%s, %s, %s, %s, %s)
            """, donation_lines[i:i+batch_size])
        
        print(f"    ✓ Created {len(donations)} donations with {len(donation_lines)} line items")
    
    def generate_recurring_gifts(self):
        """Generate recurring gift subscriptions"""
        print("  → Generating recurring gifts...")
        
        recurring = []
        
        # 20% of donors have recurring gifts
        for donor_id in random.sample(self.donor_ids, len(self.donor_ids) // 5):
            recurring_id = str(uuid.uuid4())
            
            amount = random.choice([10, 25, 50, 100, 250, 500])
            frequency = random.choice(['monthly', 'quarterly', 'annual'])
            
            next_charge_on = self.today + timedelta(days=random.randint(1, 60))
            
            recurring.append((
                recurring_id,
                self.org_id,
                donor_id,
                amount,
                'USD',  # currency (required)
                frequency,
                next_charge_on
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO recurring_gifts (id, organization_id, donor_id, amount, currency, frequency, next_charge_on)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, recurring)
        
        print(f"    ✓ Created {len(recurring)} recurring gifts")
    
    def generate_pledges(self):
        """Generate pledges with installments"""
        print("  → Generating pledges...")
        
        pledges = []
        installments = []
        
        # 15% of donors have pledges
        for donor_id in random.sample(self.donor_ids, len(self.donor_ids) // 7):
            pledge_id = str(uuid.uuid4())
            
            total_amount = random.choice([1000, 2500, 5000, 10000, 25000, 50000])
            num_installments = random.choice([2, 3, 4, 6, 12])
            installment_amount = total_amount / num_installments
            
            pledge_date = self.today - timedelta(days=random.randint(30, 730))
            
            status = random.choice(['active', 'active', 'active', 'completed'])
            
            pledges.append((
                pledge_id,
                self.org_id,
                donor_id,
                pledge_date,
                total_amount,
                random.choice(['monthly', 'quarterly', 'annual']),
                random.choice(['1st of month', '15th of month', 'last day']),
                f"{pledge_date.isoformat()} to {(pledge_date + timedelta(days=365)).isoformat()}",
                random.choice(self.fund_ids) if self.fund_ids else None,
                status,
                datetime.now(),
                datetime.now()
            ))
            
            # Generate installments
            for i in range(num_installments):
                due_date = pledge_date + timedelta(days=30 * (i + 1))
                installment_status = random.choice(['pending', 'pending', 'paid'])
                
                installments.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    pledge_id,
                    due_date,
                    installment_amount,  # due_amount
                    installment_status,
                    datetime.now()
                ))
        
        execute_batch(self.cursor, """
            INSERT INTO pledges (id, organization_id, donor_id, pledge_date, total_amount, 
                               frequency, schedule, start_end, goal_fund_id, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, pledges)
        
        execute_batch(self.cursor, """
            INSERT INTO pledge_installments (id, organization_id, pledge_id, due_date, due_amount, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, installments)
        
        print(f"    ✓ Created {len(pledges)} pledges with {len(installments)} installments")
    
    # ========================================================================
    # MAJOR GIFTS INFRASTRUCTURE
    # ========================================================================
    
    def generate_major_gift_officers(self):
        """Generate major gift officers"""
        print("  → Generating major gift officers...")
        
        roles = ['ceo', 'cdo', 'lead_officer', 'major_gifts', 'principal_gifts', 'planned_giving']
        
        officers = []
        
        for i, user_id in enumerate(random.sample(self.user_ids, min(8, len(self.user_ids)))):
            officer_id = str(uuid.uuid4())
            first_name = fake.first_name()
            last_name = fake.last_name()
            
            officers.append((
                officer_id,
                self.org_id,
                user_id,
                first_name,
                last_name,
                f"{first_name.lower()}.{last_name.lower()}@nonprofit.org",
                fake.phone_number(),
                random.choice(roles),  # portfolio_role
                True,  # is_active
                self.start_date + timedelta(days=random.randint(0, 900)),  # hire_date
                datetime.now(),
                datetime.now()
            ))
            
            self.officer_ids.append(officer_id)
        
        execute_batch(self.cursor, """
            INSERT INTO major_gift_officers (id, organization_id, user_id, first_name, last_name,
                                           email, phone, portfolio_role, is_active, hire_date, 
                                           created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CAST(%s AS portfolio_role_enum), %s, %s, %s, %s)
        """, officers)
        
        # Generate annual targets
        targets = []
        for officer_id in self.officer_ids:
            for year in [2023, 2024, 2025]:
                targets.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    officer_id,
                    year,  # fiscal_year
                    random.randint(200000, 2000000),  # target_dollars
                    random.randint(10, 50),  # target_gift_count
                    random.randint(5, 25),  # target_new_donors
                    random.randint(20, 100),  # target_meetings
                    random.randint(5, 30),  # target_proposals
                    random.randint(150000, 1800000),  # actual_dollars
                    random.randint(8, 45),  # actual_gift_count
                    random.randint(3, 20),  # actual_new_donors
                    random.randint(15, 90),  # actual_meetings
                    random.randint(3, 25),  # actual_proposals
                    datetime.now(),
                    datetime.now()
                ))
        
        execute_batch(self.cursor, """
            INSERT INTO officer_annual_targets (id, organization_id, officer_id, fiscal_year, 
                                              target_dollars, target_gift_count, target_new_donors, 
                                              target_meetings, target_proposals, actual_dollars, 
                                              actual_gift_count, actual_new_donors, actual_meetings, 
                                              actual_proposals, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, targets)
        
        print(f"    ✓ Created {len(officers)} major gift officers with {len(targets)} annual targets")
    
    def generate_moves_management(self):
        """Generate moves management stages for major donors"""
        print("  → Generating moves management stages...")
        
        stages = ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship']
        
        moves = []
        
        # Assign major and mega donors to moves management
        major_donors = random.sample(self.donor_ids, len(self.donor_ids) // 5)  # 20% in moves management
        
        for donor_id in major_donors:
            current_stage = random.choice(stages)
            previous_stage = random.choice(stages + [None])
            stage_entered_date = self.today - timedelta(days=random.randint(0, 180))
            
            moves.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                random.choice(self.officer_ids) if self.officer_ids else None,  # officer_id
                current_stage,
                previous_stage,
                stage_entered_date,
                self.today + timedelta(days=random.randint(30, 180)),  # expected_next_stage_date
                stage_entered_date - timedelta(days=random.randint(1, 90)) if previous_stage else None,  # last_stage_change_date
                random.randint(1, 20),  # total_interactions
                self.today - timedelta(days=random.randint(0, 30)),  # last_interaction_date
                fake.text(max_nb_chars=200),  # stage_notes
                fake.text(max_nb_chars=100),  # next_steps
                datetime.now(),
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO moves_management_stages (id, organization_id, donor_id, officer_id, 
                                                current_stage, previous_stage, stage_entered_date, 
                                                expected_next_stage_date, last_stage_change_date,
                                                total_interactions, last_interaction_date, stage_notes, 
                                                next_steps, created_at, updated_at)
            VALUES (%s, %s, %s, %s, CAST(%s AS moves_stage_enum), CAST(%s AS moves_stage_enum), 
                    %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, moves)
        
        print(f"    ✓ Created {len(moves)} moves management records")
    
    def generate_donor_meetings(self):
        """Generate donor meetings"""
        print("  → Generating donor meetings...")
        
        meeting_types = ['substantive', 'cultivation', 'solicitation', 'stewardship']
        
        meetings = []
        
        # Generate 200+ meetings
        for _ in range(250):
            donor_id = random.choice(self.donor_ids)
            
            scheduled_date = self.today - timedelta(days=random.randint(0, 730))
            
            meetings.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                random.choice(self.officer_ids) if self.officer_ids else None,
                f"Meeting with {fake.name()}",  # meeting_title
                random.choice(meeting_types),  # meeting_type
                scheduled_date,
                random.randint(15, 120),  # duration_minutes
                fake.address() if random.random() < 0.6 else None,  # location
                random.random() < 0.3,  # is_virtual
                'scheduled',  # status
                False,  # is_completed
                fake.text(max_nb_chars=300),  # meeting_notes
                datetime.now(),
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO donor_meetings (id, organization_id, donor_id, officer_id, meeting_title,
                                       meeting_type, scheduled_date, duration_minutes, location,
                                       is_virtual, status, is_completed, meeting_notes, 
                                       created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, CAST(%s AS meeting_type_enum), %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, meetings)
        
        print(f"    ✓ Created {len(meetings)} donor meetings")
    
    def generate_gift_goals(self):
        """Generate gift goals"""
        print("  → Generating gift goals...")
        
        goals = []
        
        for _ in range(100):
            donor_id = random.choice(self.donor_ids)
            
            goal_amount = random.choice([5000, 10000, 25000, 50000, 100000, 250000])
            current_received = random.uniform(0, goal_amount * 1.2)
            
            target_date = self.today + timedelta(days=random.randint(30, 365))
            status = 'realized' if current_received >= goal_amount else 'active'
            
            goals.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                random.choice(self.officer_ids) if self.officer_ids else None,
                fake.text(max_nb_chars=200),  # goal_description (REQUIRED)
                goal_amount,
                random.choice(self.campaign_ids) if random.random() < 0.7 else None,
                random.choice(self.program_ids) if random.random() < 0.5 else None,
                target_date,
                current_received * 0.8,  # current_committed_amount
                current_received,  # current_received_amount
                random.randint(25, 95),  # probability_percentage
                status,
                current_received >= goal_amount,  # is_realized
                datetime.now(),
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO gift_goals (id, organization_id, donor_id, officer_id, goal_description,
                                  goal_amount, campaign_id, program_id, target_date, 
                                  current_committed_amount, current_received_amount,
                                  probability_percentage, status, is_realized, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, goals)
        
        print(f"    ✓ Created {len(goals)} gift goals")
    
    def generate_solicitation_proposals(self):
        """Generate solicitation proposals"""
        print("  → Generating solicitation proposals...")
        
        statuses = ['draft', 'sent', 'under_review', 'accepted', 'declined']
        
        proposals = []
        
        for _ in range(75):
            donor_id = random.choice(self.donor_ids)
            
            requested_amount = random.choice([10000, 25000, 50000, 100000, 250000, 500000])
            status = random.choice(statuses)
            
            date_sent = self.today - timedelta(days=random.randint(10, 365)) if status != 'draft' else None
            committed = requested_amount if status == 'accepted' else 0
            
            proposals.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                random.choice(self.officer_ids) if self.officer_ids else None,
                f"Proposal for ${requested_amount:,.0f} Gift",  # proposal_title (REQUIRED)
                fake.text(max_nb_chars=400),  # proposal_description
                requested_amount,
                random.choice(self.campaign_ids) if random.random() < 0.5 else None,
                random.choice(self.program_ids) if random.random() < 0.8 else None,
                status,
                date_sent,
                committed,  # committed_amount
                datetime.now(),
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO solicitation_proposals (id, organization_id, donor_id, officer_id, 
                                              proposal_title, proposal_description, requested_amount, 
                                              campaign_id, program_id, status, date_sent, 
                                              committed_amount, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CAST(%s AS proposal_status_enum), %s, %s, %s, %s)
        """, proposals)
        
        print(f"    ✓ Created {len(proposals)} solicitation proposals")
    
    def generate_donor_priorities(self):
        """Generate donor priority cache"""
        print("  → Generating donor priorities...")
        
        donor_levels = ['mega_donor', 'major_donor', 'mid_level', 'upper_donor', 'lower_donor']
        priorities = ['priority_1', 'priority_2', 'priority_3', 'priority_4', 'priority_5']
        
        priority_data = []
        
        for donor_id in random.sample(self.donor_ids, len(self.donor_ids) // 3):
            current_year = random.uniform(1000, 100000)
            last_year = random.uniform(500, 80000)
            
            priority_data.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                random.choice(donor_levels),  # current_donor_level
                random.choice(priorities),  # priority_level
                current_year,  # current_year_total
                last_year,  # last_year_total
                random.uniform(0, 50000),  # two_years_ago_total
                max(current_year, last_year) * random.uniform(0.3, 0.8),  # largest_gift_amount
                self.today - timedelta(days=random.randint(0, 365)),  # last_gift_date
                random.randint(0, 365),  # days_since_last_gift
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO donor_priority_cache (id, organization_id, donor_id, current_donor_level,
                                            priority_level, current_year_total, last_year_total, 
                                            two_years_ago_total, largest_gift_amount, last_gift_date,
                                            days_since_last_gift, created_at)
            VALUES (%s, %s, %s, CAST(%s AS donor_level_enum), CAST(%s AS priority_level_enum), 
                    %s, %s, %s, %s, %s, %s, %s)
        """, priority_data)
        
        print(f"    ✓ Created {len(priority_data)} donor priority records")
    
    # ========================================================================
    # FINANCIAL DATA
    # ========================================================================
    
    def generate_expenses(self):
        """Generate expenses"""
        print("  → Generating expenses...")
        
        expenses = []
        
        # Generate monthly expenses for last 2 years
        for month_offset in range(24):
            expense_date = self.today - timedelta(days=30 * month_offset)
            
            # Multiple expenses per month
            for _ in range(random.randint(5, 15)):
                expenses.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    random.choice(self.expense_category_ids),
                    random.uniform(500, 25000),
                    expense_date,
                    fake.text(max_nb_chars=150),
                    random.choice(self.program_ids) if random.random() < 0.6 else None,
                    random.choice(['check', 'credit_card', 'bank_transfer', 'cash']),
                    datetime.now(),
                    datetime.now()
                ))
        
        execute_batch(self.cursor, """
            INSERT INTO expenses (id, organization_id, category_id, amount, expense_date, 
                                description, program_id, payment_method, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, expenses)
        
        print(f"    ✓ Created {len(expenses)} expenses")
    
    def generate_grants(self):
        """Generate grants"""
        print("  → Generating grants...")
        
        grant_types = ['operating', 'program', 'capital', 'research', 'capacity_building']
        statuses = ['prospecting', 'submitted', 'under_review', 'awarded', 'declined']
        priorities = ['high', 'medium', 'low']
        
        grants = []
        grant_reports = []
        
        for i in range(40):
            grant_id = str(uuid.uuid4())
            
            status = random.choice(statuses)
            amount_requested = random.choice([10000, 25000, 50000, 100000, 250000, 500000])
            amount_awarded = amount_requested * random.uniform(0.5, 1.0) if status == 'awarded' else None
            
            deadline = self.today + timedelta(days=random.randint(-180, 180))
            submission_date = deadline - timedelta(days=random.randint(7, 60)) if status in ['submitted', 'under_review', 'awarded', 'declined'] else None
            
            grants.append((
                grant_id,
                self.org_id,
                fake.company(),
                f"Grant Application {i+1}",
                fake.text(max_nb_chars=300),
                random.choice(['foundation', 'corporate', 'government', 'individual']),
                random.choice(grant_types),
                amount_requested,
                amount_awarded,
                deadline,
                submission_date,
                self.today + timedelta(days=random.randint(30, 365)) if amount_awarded else None,
                self.today + timedelta(days=random.randint(365, 730)) if amount_awarded else None,
                status,
                random.randint(25, 100) if status != 'declined' else 0,
                random.choice(priorities),
                random.choice(self.user_ids) if self.user_ids else None,
                random.choice(self.program_ids) if random.random() < 0.8 else None,
                datetime.now(),
                datetime.now()
            ))
            
            self.grant_ids.append(grant_id)
            
            # Add grant reports for awarded grants
            if status == 'awarded' and random.random() < 0.7:
                for report_num in range(random.randint(1, 4)):
                    grant_reports.append((
                        str(uuid.uuid4()),
                        grant_id,
                        self.org_id,
                        random.choice(['interim', 'final', 'financial']),
                        self.today + timedelta(days=90 * (report_num + 1)),
                        random.choice(['pending', 'draft', 'submitted', 'accepted']),
                        random.choice(self.user_ids) if self.user_ids else None,
                        datetime.now(),
                        datetime.now()
                    ))
        
        execute_batch(self.cursor, """
            INSERT INTO grants (id, organization_id, funder_name, name, description, 
                              funder_type, grant_type, amount_requested, amount_awarded, 
                              deadline, submission_date, start_date, end_date, status, 
                              probability, priority, assigned_to, program_id, 
                              created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, grants)
        
        if grant_reports:
            execute_batch(self.cursor, """
                INSERT INTO grant_reports (id, grant_id, organization_id, report_type, 
                                         due_date, status, assigned_to, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, grant_reports)
        
        print(f"    ✓ Created {len(grants)} grants with {len(grant_reports)} reports")
    
    def generate_payments(self):
        """Generate payments"""
        print("  → Generating payments...")
        
        # Get some donation IDs
        self.cursor.execute(f"""
            SELECT id FROM donations WHERE organization_id = '{self.org_id}' LIMIT 300
        """)
        donation_ids = [row[0] for row in self.cursor.fetchall()]
        
        payments = []
        
        for donation_id in random.sample(donation_ids, min(200, len(donation_ids))):
            payments.append((
                str(uuid.uuid4()),
                self.org_id,
                donation_id,
                self.today - timedelta(days=random.randint(0, 730)),  # payment_date
                random.uniform(10, 25000),  # amount
                'USD',  # currency (REQUIRED)
                random.choice(['credit_card', 'check', 'bank_transfer', 'cash', 'paypal']),  # method
                fake.uuid4(),  # reference_no
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO payments (id, organization_id, donation_id, payment_date, amount, 
                                currency, method, reference_no, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, payments)
        
        print(f"    ✓ Created {len(payments)} payments")
    
    # ========================================================================
    # ADVANCED ANALYTICS
    # ========================================================================
    
    def generate_donor_scores(self):
        """Generate donor scores"""
        print("  → Generating donor scores...")
        
        segments = ['champion', 'loyal', 'potential', 'at_risk', 'lost']
        lifecycle_stages = ['prospect', 'first_time', 'repeat', 'major', 'lapsed']
        
        scores = []
        
        for donor_id in random.sample(self.donor_ids, len(self.donor_ids) // 2):
            rfm = random.uniform(0.1, 1.0)
            engagement = random.uniform(0.1, 1.0)
            loyalty = random.uniform(0.1, 1.0)
            
            scores.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                rfm,  # rfm_score
                engagement,  # engagement_score
                loyalty,  # loyalty_score
                random.uniform(0.1, 1.0),  # influence_score
                random.uniform(0.1, 1.0),  # churn_risk_score
                random.choice(segments),  # donor_segment
                random.choice(lifecycle_stages),  # lifecycle_stage
                None,  # score_components (JSONB) - can be NULL
                self.today  # calculated_at
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO donor_scores (id, organization_id, donor_id, rfm_score, 
                                    engagement_score, loyalty_score, influence_score, 
                                    churn_risk_score, donor_segment, lifecycle_stage,
                                    score_components, calculated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, scores)
        
        print(f"    ✓ Created {len(scores)} donor scores")
    
    def generate_churn_metrics(self):
        """Generate donor churn metrics"""
        print("  → Generating churn metrics...")
        
        metrics = []
        
        # Monthly churn metrics for last 12 months
        for month_offset in range(12):
            period_end = self.today - timedelta(days=30 * month_offset)
            period_start = period_end - timedelta(days=30)
            
            new_donors = random.randint(20, 60)
            reactivated_donors = random.randint(5, 25)
            lapsed_donors = random.randint(10, 40)
            
            # Calculate churn ratio: (new + reactivated) / lapsed
            churn_ratio = (new_donors + reactivated_donors) / lapsed_donors if lapsed_donors > 0 else 1.0
            
            # Determine equilibrium status
            if churn_ratio > 1.1:
                status = "growing"
            elif churn_ratio < 0.9:
                status = "declining"
            else:
                status = "equilibrium"
            
            metrics.append((
                str(uuid.uuid4()),
                self.org_id,
                period_start,
                period_end,
                new_donors,
                reactivated_donors,
                lapsed_donors,
                churn_ratio,
                status,
                month_offset == 0,  # trailing_12_months (True for most recent)
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO donor_churn_metrics (id, organization_id, period_start, period_end,
                                           new_donors, reactivated_donors, lapsed_donors, 
                                           churn_ratio, equilibrium_status, trailing_12_months,
                                           created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, metrics)
        
        print(f"    ✓ Created {len(metrics)} churn metrics")
    
    def generate_cashflow_reports(self):
        """Generate cashflow reports with year/month structure matching model"""
        print("  → Generating cashflow reports...")
        
        reports = []
        
        # Generate reports for last 24 months
        for month_offset in range(24):
            report_date = self.today - timedelta(days=30 * month_offset)
            year = report_date.year
            month = report_date.month
            
            # Generate realistic revenue data
            revenue = random.uniform(30000, 150000)
            gift_count = random.randint(50, 300)
            donor_count = random.randint(40, 250)
            avg_gift_size = revenue / gift_count if gift_count > 0 else 0
            
            # Calculate YTD values (simplified - in real scenario would aggregate from Jan-current month)
            ytd_multiplier = month / 12.0
            ytd_revenue = revenue * random.uniform(month * 0.8, month * 1.2)
            ytd_gift_count = int(gift_count * random.uniform(month * 0.8, month * 1.2))
            ytd_donor_count = int(donor_count * random.uniform(month * 0.8, month * 1.2))
            
            # Determine comparison status
            if revenue > 100000:
                status = "green"
            elif revenue > 60000:
                status = "yellow"
            elif revenue > 40000:
                status = "neutral"
            else:
                status = "red"
            
            reports.append((
                str(uuid.uuid4()),
                self.org_id,
                year,
                month,
                revenue,
                gift_count,
                donor_count,
                avg_gift_size,
                ytd_revenue,
                ytd_gift_count,
                ytd_donor_count,
                status,
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO cashflow_reports (id, organization_id, year, month, revenue, 
                                        gift_count, donor_count, avg_gift_size,
                                        ytd_revenue, ytd_gift_count, ytd_donor_count,
                                        comparison_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ON CONSTRAINT unique_org_year_month 
            DO UPDATE SET 
                revenue = EXCLUDED.revenue,
                gift_count = EXCLUDED.gift_count,
                donor_count = EXCLUDED.donor_count,
                avg_gift_size = EXCLUDED.avg_gift_size,
                ytd_revenue = EXCLUDED.ytd_revenue,
                ytd_gift_count = EXCLUDED.ytd_gift_count,
                ytd_donor_count = EXCLUDED.ytd_donor_count,
                comparison_status = EXCLUDED.comparison_status,
                created_at = EXCLUDED.created_at
        """, reports)
        
        print(f"    ✓ Created {len(reports)} cashflow reports")
    
    def generate_engagement_continuum(self):
        """Generate donor engagement continuum"""
        print("  → Generating engagement continuum...")
        
        # These are engagement PHASES, not individual donors
        engagement_phases = ['awareness', 'engagement', 'acquisition', 'conversion', 'cultivation', 'retention', 'reactivation']
        
        engagement = []
        
        # One record per phase
        for phase in engagement_phases:
            investment_level = random.randint(1, 5)
            current_investment = random.uniform(1000, 50000)
            roi_current = random.uniform(1.2, 4.5)
            
            engagement.append((
                str(uuid.uuid4()),
                self.org_id,
                phase,
                investment_level,
                current_investment,
                current_investment * random.uniform(1.1, 1.8),  # recommended_investment
                roi_current,
                roi_current * random.uniform(1.05, 1.3),  # roi_projected
                random.randint(10, 200),  # donors_in_phase
                random.uniform(0.15, 0.85),  # conversion_rate
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO donor_engagement_continuum (id, organization_id, phase, investment_level, 
                                                   current_investment, recommended_investment, 
                                                   roi_current, roi_projected, donors_in_phase, 
                                                   conversion_rate, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, engagement)
        
        print(f"    ✓ Created {len(engagement)} engagement phase records")
    
    def generate_second_gift_tracking(self):
        """Generate second gift tracking"""
        print("  → Generating second gift tracking...")
        
        tracking = []
        
        channels = ['direct_mail', 'email', 'social_media', 'event', 'peer_to_peer', 'website', 'phone']
        
        for donor_id in random.sample(self.donor_ids, len(self.donor_ids) // 3):
            first_gift_date = self.today - timedelta(days=random.randint(90, 730))
            first_gift_amount = random.uniform(10, 500)
            acquisition_cost = random.uniform(20, 150)
            acquisition_channel = random.choice(channels)
            
            # Some have second gift, some don't
            has_second_gift = random.random() < 0.6
            
            if has_second_gift:
                second_gift_date = first_gift_date + timedelta(days=random.randint(30, 180))
                second_gift_amount = random.uniform(15, 750)
                days_to_second = (second_gift_date - first_gift_date).days
                
                # Calculate breakeven
                cumulative_value = first_gift_amount + second_gift_amount
                if cumulative_value >= acquisition_cost:
                    breakeven_date = second_gift_date
                    months_to_breakeven = int(days_to_second / 30)
                else:
                    breakeven_date = None
                    months_to_breakeven = None
            else:
                second_gift_date = None
                second_gift_amount = None
                days_to_second = None
                breakeven_date = None
                months_to_breakeven = None
            
            tracking.append((
                str(uuid.uuid4()),
                self.org_id,
                donor_id,
                first_gift_date,
                first_gift_amount,
                acquisition_cost,
                second_gift_date,
                second_gift_amount,
                days_to_second,
                breakeven_date,
                months_to_breakeven,
                acquisition_channel,
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO second_gift_tracking (id, organization_id, donor_id, first_gift_date, 
                                            first_gift_amount, acquisition_cost, second_gift_date, 
                                            second_gift_amount, days_to_second_gift, 
                                            breakeven_date, months_to_breakeven,
                                            acquisition_channel, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, tracking)
        
        print(f"    ✓ Created {len(tracking)} second gift tracking records")
    
    def generate_wise_investor_scores(self):
        """Generate Wise Investor organization scores (2x2 quadrant)"""
        print("  → Generating Wise Investor scores...")
        
        scores = []
        
        # Generate quarterly scores for the org (e.g., last 4 quarters)
        quadrants = ['Wise Investor', 'Growing', 'Struggling', 'At Risk']
        
        for quarter_offset in range(4):
            calc_date = self.today - timedelta(days=90 * quarter_offset)
            
            # Generate component scores (0-100)
            vision = random.uniform(60, 95)
            strategy = random.uniform(50, 90)
            sustained_investment = random.uniform(40, 85)
            momentum = random.uniform(55, 92)
            g4s2f_composite = (vision + strategy + sustained_investment + momentum) / 4
            
            donor_engagement = random.uniform(50, 95)
            donor_experience = random.uniform(45, 90)
            donor_retention = random.uniform(60, 95)
            ltv_growth = random.uniform(55, 88)
            
            # Calculate quadrant position
            x_score = g4s2f_composite  # Impact Score (x-axis)
            y_score = (donor_engagement + donor_experience + donor_retention + ltv_growth) / 4  # Sustainability Score (y-axis)
            
            # Determine quadrant
            if x_score >= 70 and y_score >= 70:
                quadrant = 'Wise Investor'
            elif x_score >= 70 and y_score < 70:
                quadrant = 'Growing'
            elif x_score < 70 and y_score >= 70:
                quadrant = 'Struggling'
            else:
                quadrant = 'At Risk'
            quarter = (calc_date.month - 1) // 3 + 1
            notes = {
                #"description": f"Quarterly assessment for {calc_date.strftime('%Y Q%s' % ((calc_date.month-1)//3+1))}",
                "description": f"Quarterly assessment for {calc_date.year} Q{quarter}",
                #quarter = (calc_date.month - 1) // 3 + 1
                #"description": f"Quarterly assessment for {calc_date.year} Q{quarter}",
                "key_insights": ["Strong donor retention", "Investment momentum building"]
            }
            
            scores.append((
                str(uuid.uuid4()),
                self.org_id,
                quadrant,
                x_score,
                y_score,
                vision,
                strategy,
                sustained_investment,
                momentum,
                g4s2f_composite,
                donor_engagement,
                donor_experience,
                donor_retention,
                ltv_growth,
                calc_date,
                Json(notes),
                datetime.now()
            ))
        
        execute_batch(self.cursor, """
            INSERT INTO wise_investor_scores (id, organization_id, quadrant, x_score, y_score,
                                            vision_score, strategy_score, sustained_investment_score,
                                            momentum_score, g4s2f_composite_score,
                                            donor_engagement_score, donor_experience_score,
                                            donor_retention_score, ltv_growth_score,
                                            calculated_date, notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, scores)
        
        print(f"    ✓ Created {len(scores)} Wise Investor organization scores")
    
    # ========================================================================
    # IMPACT & OUTCOMES
    # ========================================================================
    
    def generate_impact_metrics(self):
        """Generate impact metrics with SROI calculations"""
        print("  → Generating impact metrics...")
        
        metrics = []
        
        for program_id in self.program_ids:
            # Multiple metrics per program
            for i in range(random.randint(2, 5)):
                investment = random.uniform(10000, 500000)
                social_value = investment * random.uniform(2.5, 8.0)  # SROI multiplier
                sroi = social_value / investment if investment > 0 else 0
                
                metrics.append((
                    str(uuid.uuid4()),
                    self.org_id,
                    program_id,
                    random.choice(['People Served', 'Programs Delivered', 'Families Helped', 
                                 'Students Educated', 'Meals Provided', 'Hours of Service']),
                    social_value,
                    investment,
                    sroi,
                    datetime.now()
                ))
        
        execute_batch(self.cursor, """
            INSERT INTO impact_metrics (id, organization_id, program_id, metric_name, 
                                      social_value, investment, sroi, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, metrics)
        
        print(f"    ✓ Created {len(metrics)} impact metrics")
    
    def generate_outcome_metrics(self):
        """Generate outcome metrics and records"""
        print("  → Generating outcome metrics...")
        
        outcome_metrics = []
        outcome_records = []
        
        directions = ['increase', 'decrease', 'maintain']
        
        for program_id in self.program_ids:
            # Outcome metrics for each program
            for i in range(random.randint(2, 4)):
                metric_id = str(uuid.uuid4())
                
                outcome_metrics.append((
                    metric_id,
                    self.org_id,
                    program_id,
                    random.choice(['Quality of Life', 'Academic Achievement', 'Health Outcomes', 
                                 'Economic Stability', 'Community Engagement']),
                    fake.text(max_nb_chars=150),
                    random.choice(['percentage', 'count', 'score', 'rating']),
                    random.choice(directions),
                    random.uniform(50, 1000)
                ))
                
                # Generate records for this metric
                for month_offset in range(12):
                    record_date = self.today - timedelta(days=30 * month_offset)
                    
                    outcome_records.append((
                        str(uuid.uuid4()),
                        self.org_id,
                        metric_id,
                        random.uniform(30, 950),
                        random.choice(['Survey', 'Assessment', 'Direct Measurement', 'Third-party Report']),
                        record_date
                    ))
        
        execute_batch(self.cursor, """
            INSERT INTO outcome_metrics (id, organization_id, program_id, name, 
                                       description, unit, direction, target_value)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, outcome_metrics)
        
        execute_batch(self.cursor, """
            INSERT INTO outcome_records (id, organization_id, outcome_metric_id, 
                                       value, source, recorded_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, outcome_records)
        
        print(f"    ✓ Created {len(outcome_metrics)} outcome metrics with {len(outcome_records)} records")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    
    def print_summary(self):
        """Print generation summary"""
        print("\n" + "="*70)
        print("DATA GENERATION SUMMARY")
        print("="*70)
        
        # Query counts
        queries = [
            ("Organizations", "organizations"),
            ("Users", "users"),
            ("Programs", "programs"),
            ("Funds", "funds"),
            ("Campaigns", "campaigns"),
            ("Donors", "donors"),
            ("Parties", "parties"),
            ("Donations", "donations"),
            ("Recurring Gifts", "recurring_gifts"),
            ("Pledges", "pledges"),
            ("Major Gift Officers", "major_gift_officers"),
            ("Donor Meetings", "donor_meetings"),
            ("Gift Goals", "gift_goals"),
            ("Solicitation Proposals", "solicitation_proposals"),
            ("Moves Management", "moves_management_stages"),
            ("Expenses", "expenses"),
            ("Grants", "grants"),
            ("Payments", "payments"),
            ("Donor Scores", "donor_scores"),
            ("Churn Metrics", "donor_churn_metrics"),
            ("Cashflow Reports", "cashflow_reports"),
            ("Engagement Continuum", "donor_engagement_continuum"),
            ("Second Gift Tracking", "second_gift_tracking"),
            ("Wise Investor Scores", "wise_investor_scores"),
            ("Impact Metrics", "impact_metrics"),
            ("Outcome Metrics", "outcome_metrics"),
        ]
        
        for name, table in queries:
            self.cursor.execute(f"""
                SELECT COUNT(*) FROM {table} WHERE id = %s
            """, (self.org_id,))
            count = self.cursor.fetchone()[0]
            print(f"  {name:.<40} {count:>6}")
        
        print("="*70)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def create_organization(cursor):
    """Create a new organization interactively"""
    print("\n" + "="*70)
    print("CREATE NEW ORGANIZATION")
    print("="*70)
    
    org_name = input("\nOrganization name: ").strip()
    if not org_name:
        org_name = "Sample Nonprofit Organization"
    
    ein = input("EIN (optional, press Enter to skip): ").strip() or None
    
    mission = input("Mission statement (optional): ").strip() or f"Dedicated to making a positive impact in our community through innovative programs and services."
    
    city = input("City (default: New York): ").strip() or "New York"
    state = input("State (default: NY): ").strip() or "NY"
    
    org_id = str(uuid.uuid4())  # Convert to string
    
    cursor.execute("""
        INSERT INTO organizations (
            id, name, ein, mission, city, state, country, 
            is_active, created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """, (
        org_id,  # Now it's a string
        org_name,
        ein,
        mission,
        city,
        state,
        'USA',
        True,
        datetime.now(),
        datetime.now()
    ))
    
    print(f"\n✓ Created organization: {org_name}")
    print(f"   ID: {org_id}")
    
    return org_id


def main():
    """Main execution"""
    print("\n" + "="*70)
    print("WISE INVESTOR - COMPREHENSIVE ANALYTICS DATA GENERATOR")
    print("="*70)
    print("\nThis script will generate complete analytics data for:")
    print("  • Donor retention & cohorts")
    print("  • Campaign analytics & ROI")
    print("  • Major gifts & moves management")
    print("  • Financial analytics")
    print("  • Impact analytics")
    print("  • P2SG dashboard")
    print("  • Cash flow & churn")
    print("  • Wise Investor scores")
    print("  • And more...")
    print("\n" + "="*70)
    
    # Get organization ID
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name FROM organizations LIMIT 10")
        orgs = cursor.fetchall()
        
        if not orgs:
            print("\n⚠️  No organizations found in database.")
            create_new = input("\nWould you like to create a new organization? (yes/no): ").strip().lower()
            
            if create_new == 'yes':
                org_id = create_organization(cursor)
                conn.commit()
            else:
                print("\n✗ Cannot proceed without an organization.")
                print("   Please create an organization first or re-run with 'yes'.")
                cursor.close()
                conn.close()
                sys.exit(1)
        else:
            print("\nAvailable organizations:")
            for i, (org_id_opt, org_name) in enumerate(orgs, 1):
                print(f"  {i}. {org_name} ({org_id_opt})")
            
            print(f"  {len(orgs) + 1}. Create new organization")
            
            choice = input(f"\nSelect option (1-{len(orgs) + 1}, or press Enter for first): ").strip()
            
            if choice and int(choice) == len(orgs) + 1:
                # Create new organization
                org_id = create_organization(cursor)
                conn.commit()
            elif choice and int(choice) <= len(orgs):
                org_id = orgs[int(choice) - 1][0]
            else:
                org_id = orgs[0][0]
        
        cursor.close()
        conn.close()
        
        print(f"\n✓ Selected organization: {org_id}")
        
    except Exception as e:
        print(f"\n✗ Error connecting to database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Check if data exists and ask about clearing
    clear_first = False
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM donations WHERE organization_id = %s", (org_id,))
        existing_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        if existing_count > 0:
            print(f"\n⚠️  Found {existing_count} existing donations for this organization.")
            clear_data = input("Clear existing data before generating new data? (yes/no): ").strip().lower()
            clear_first = (clear_data == 'yes')
    except:
        pass
    
    # Confirm
    confirm = input("\nProceed with data generation? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("\nCancelled.")
        sys.exit(0)
    
    # Generate data
    generator = DataGenerator(org_id)
    generator.generate_all(clear_first=clear_first)
    
    print("\n✓ Complete! Your analytics endpoints are now fully populated.")
    print("\nNext steps:")
    print("  1. Start your FastAPI server")
    print("  2. Test the analytics endpoints")
    print("  3. Refresh your dashboards")
    print()


if __name__ == "__main__":
    main()
