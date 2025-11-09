"""
Major Gifts Module Data Generation Script
Generates realistic test data for all major gifts tables

Prerequisites:
- organizations table must have data
- users table must have data  
- donors table must have data
- campaigns table must have data (optional but recommended)

Usage:
    python gendata_major_gifts.py
"""

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

def now_utc():
    return datetime.now(timezone.utc)

DB_CONFIG = {
    'dbname': 'organization_db3',
    'user': 'orguser3',
    'password': 'orgpassword3',
    'host': 'localhost',
    'port': 5432
}

# Enum values matching database
PORTFOLIO_ROLES = ['ceo', 'cdo', 'lead_officer', 'portfolio_manager', 
                   'principal_gifts', 'major_gifts', 'planned_giving', 'corporate_relations']
MOVES_STAGES = ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship']
DONOR_LEVELS = ['mega_donor', 'major_donor', 'mid_level', 'upper_donor', 'lower_donor']
PRIORITY_LEVELS = ['priority_1', 'priority_2', 'priority_3', 'priority_4', 'priority_5']
EXCLUSION_TAGS = ['estate_gift', 'bequest', 'foundation_grant', 'planned_gift']
MEETING_TYPES = ['substantive', 'informational', 'social', 'cultivation', 'solicitation', 'stewardship']
PROPOSAL_STATUSES = ['draft', 'sent', 'under_review', 'accepted', 'declined', 'withdrawn']

# Portfolio sizes by role
PORTFOLIO_SIZES = {
    'ceo': (5, 10),
    'cdo': (10, 20),
    'lead_officer': (50, 75),
    'portfolio_manager': (100, 125),
    'principal_gifts': (75, 100),
    'major_gifts': (125, 150),
    'planned_giving': (150, 200),
    'corporate_relations': (30, 50)
}

class MajorGiftsDataGenerator:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.generated_data = {
            'organizations': [],
            'users': [],
            'donors': [],
            'campaigns': [],
            'officers': [],
            'portfolio_assignments': [],
            'moves_stages': [],
            'meetings': [],
            'targets': [],
            'goals': [],
            'proposals': [],
            'priorities': [],
            'exclusions': []
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
    
    def load_existing_data(self):
        """Load existing organizations, users, donors, campaigns"""
        print("\n📥 Loading existing data...")
        
        # Load organizations
        self.cur.execute("SELECT id, name FROM organizations ORDER BY created_at LIMIT 50")
        self.generated_data['organizations'] = [
            {'id': row[0], 'name': row[1]} for row in self.cur.fetchall()
        ]
        print(f"  ✅ Loaded {len(self.generated_data['organizations'])} organizations")
        
        # Load users
        self.cur.execute("SELECT id, organization_id, email FROM users ORDER BY created_at LIMIT 100")
        self.generated_data['users'] = [
            {'id': row[0], 'organization_id': row[1], 'email': row[2]} 
            for row in self.cur.fetchall()
        ]
        print(f"  ✅ Loaded {len(self.generated_data['users'])} users")
        
        # Load donors
        self.cur.execute("""
            SELECT id, organization_id, first_name, last_name, donor_level, total_donated 
            FROM donors 
            ORDER BY total_donated DESC 
            LIMIT 2000
        """)
        self.generated_data['donors'] = [
            {
                'id': row[0],
                'organization_id': row[1],
                'first_name': row[2],
                'last_name': row[3],
                'donor_level': row[4],
                'total_donated': float(row[5]) if row[5] else 0
            }
            for row in self.cur.fetchall()
        ]
        print(f"  ✅ Loaded {len(self.generated_data['donors'])} donors")
        
        # Load campaigns
        self.cur.execute("SELECT id, organization_id, name FROM campaigns LIMIT 100")
        self.generated_data['campaigns'] = [
            {'id': row[0], 'organization_id': row[1], 'name': row[2]}
            for row in self.cur.fetchall()
        ]
        print(f"  ✅ Loaded {len(self.generated_data['campaigns'])} campaigns")
        
    def generate_major_gift_officers(self, officers_per_org=5):
        """Generate major gift officers"""
        total_officers = len(self.generated_data['organizations']) * officers_per_org
        print(f"\n👔 Generating {total_officers} major gift officers...")
        
        officers = []
        for org in self.generated_data['organizations']:
            org_id = org['id']
            
            # Get some users from this org to link
            org_users = [u for u in self.generated_data['users'] 
                        if u['organization_id'] == org_id]
            
            for i in range(officers_per_org):
                officer_id = uuid4()
                first_name = fake.first_name()
                last_name = fake.last_name()
                email = f"{first_name.lower()}.{last_name.lower()}@{org['name'].replace(' ', '').lower()}.org"
                
                # Link to user if available
                user_id = str(org_users[i]['id']) if i < len(org_users) else None
                
                # Assign portfolio role
                role = random.choice(PORTFOLIO_ROLES)
                
                # Hire date in past 1-10 years
                hire_date = fake.date_between(start_date='-10y', end_date='-1y')
                
                officer_data = (
                    str(officer_id), str(org_id), user_id,
                    first_name, last_name, email, fake.phone_number(),
                    role, True, hire_date, None,
                    now_utc(), now_utc()
                )
                officers.append(officer_data)
                self.generated_data['officers'].append({
                    'id': officer_id,
                    'organization_id': org_id,
                    'name': f"{first_name} {last_name}",
                    'role': role,
                    'email': email
                })
        
        insert_query = """
            INSERT INTO major_gift_officers (
                id, organization_id, user_id, first_name, last_name, email, phone,
                portfolio_role, is_active, hire_date, departure_date,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, officers, page_size=50)
        self.conn.commit()
        print(f"✅ Generated {len(officers)} major gift officers")
    
    def generate_portfolio_assignments(self):
        """Assign donors to officer portfolios"""
        print(f"\n📋 Generating portfolio assignments...")
        
        assignments = []
        assigned_donors = set()  # Track to avoid duplicates
        
        for officer in self.generated_data['officers']:
            org_id = officer['organization_id']
            officer_id = officer['id']
            role = officer['role']
            
            # Get portfolio size for this role
            min_size, max_size = PORTFOLIO_SIZES.get(role, (50, 100))
            portfolio_size = random.randint(min_size, max_size)
            
            # Get donors from this org who aren't assigned yet
            available_donors = [
                d for d in self.generated_data['donors']
                if d['organization_id'] == org_id and d['id'] not in assigned_donors
            ]
            
            # Take subset for portfolio
            portfolio_donors = random.sample(
                available_donors,
                min(portfolio_size, len(available_donors))
            )
            
            for i, donor in enumerate(portfolio_donors):
                assignment_id = uuid4()
                assignment_date = fake.date_between(start_date='-2y', end_date='today')
                is_primary = (i < len(portfolio_donors) * 0.7)  # 70% primary
                
                assignment_data = (
                    str(assignment_id), str(org_id), str(donor['id']), str(officer_id),
                    assignment_date, is_primary, True, None, None, None,
                    now_utc(), now_utc()
                )
                assignments.append(assignment_data)
                assigned_donors.add(donor['id'])
                
                self.generated_data['portfolio_assignments'].append({
                    'id': assignment_id,
                    'donor_id': donor['id'],
                    'officer_id': officer_id,
                    'organization_id': org_id
                })
        
        insert_query = """
            INSERT INTO donor_portfolio_assignments (
                id, organization_id, donor_id, officer_id, assignment_date,
                is_primary, is_active, deactivation_date, deactivation_reason,
                assignment_notes, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(assignments), 100):
            batch = assignments[i:i + 100]
            execute_batch(self.cur, insert_query, batch, page_size=100)
            self.conn.commit()
            if i % 500 == 0:
                print(f"  📝 Batch {i//100 + 1}/{(len(assignments)-1)//100 + 1}")
        
        print(f"✅ Generated {len(assignments)} portfolio assignments")
    
    def generate_moves_management_stages(self):
        """Generate moves management stages for assigned donors"""
        print(f"\n🎯 Generating moves management stages...")
        
        stages = []
        for assignment in self.generated_data['portfolio_assignments']:
            stage_id = uuid4()
            
            # Current stage distribution
            stage_weights = {
                'identification': 0.15,
                'qualification': 0.20,
                'cultivation': 0.35,
                'solicitation': 0.20,
                'stewardship': 0.10
            }
            current_stage = random.choices(
                list(stage_weights.keys()),
                weights=list(stage_weights.values())
            )[0]
            
            # Previous stage (if not first stage)
            stage_order = ['identification', 'qualification', 'cultivation', 'solicitation', 'stewardship']
            current_idx = stage_order.index(current_stage)
            previous_stage = stage_order[current_idx - 1] if current_idx > 0 else None
            
            # Dates
            stage_entered_date = fake.date_between(start_date='-1y', end_date='today')
            expected_next_date = fake.date_between(start_date='today', end_date='+6M')
            last_change_date = fake.date_between(start_date='-2y', end_date=stage_entered_date)
            
            # Engagement
            total_interactions = random.randint(1, 50)
            last_interaction = fake.date_between(start_date='-30d', end_date='today')
            
            stage_data = (
                str(stage_id), str(assignment['organization_id']),
                str(assignment['donor_id']), str(assignment['officer_id']),
                current_stage, previous_stage,
                stage_entered_date, expected_next_date, last_change_date,
                total_interactions, last_interaction,
                fake.paragraph(), fake.paragraph(),
                now_utc(), now_utc()
            )
            stages.append(stage_data)
            
            self.generated_data['moves_stages'].append({
                'id': stage_id,
                'donor_id': assignment['donor_id'],
                'officer_id': assignment['officer_id'],
                'current_stage': current_stage
            })
        
        insert_query = """
            INSERT INTO moves_management_stages (
                id, organization_id, donor_id, officer_id, current_stage, previous_stage,
                stage_entered_date, expected_next_stage_date, last_stage_change_date,
                total_interactions, last_interaction_date, stage_notes, next_steps,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(stages), 100):
            batch = stages[i:i + 100]
            execute_batch(self.cur, insert_query, batch, page_size=100)
            self.conn.commit()
            if i % 500 == 0:
                print(f"  📝 Batch {i//100 + 1}/{(len(stages)-1)//100 + 1}")
        
        print(f"✅ Generated {len(stages)} moves management stages")
    
    def generate_donor_meetings(self, meetings_per_assignment=3):
        """Generate donor meetings"""
        print(f"\n🤝 Generating donor meetings...")
        
        meetings = []
        for assignment in self.generated_data['portfolio_assignments'][:500]:  # Limit for speed
            num_meetings = random.randint(1, meetings_per_assignment)
            
            for _ in range(num_meetings):
                meeting_id = uuid4()
                meeting_type = random.choice(MEETING_TYPES)
                
                # Meeting date within past year
                scheduled_date = fake.date_between(start_date='-1y', end_date='+3M')
                is_completed = scheduled_date < date.today()
                
                meeting_data = (
                    str(meeting_id), str(assignment['organization_id']),
                    str(assignment['donor_id']), str(assignment['officer_id']),
                    f"Meeting with {assignment['donor_id']}", meeting_type,
                    scheduled_date, fake.time(), random.choice([30, 45, 60, 90]),
                    fake.address() if random.random() > 0.3 else None,
                    random.random() > 0.7, None,
                    'completed' if is_completed else 'scheduled', is_completed,
                    scheduled_date if is_completed else None,
                    [fake.name(), fake.name()] if random.random() > 0.5 else None,
                    fake.paragraph() if is_completed else None,
                    fake.paragraph() if is_completed else None,
                    fake.paragraph() if is_completed else None,
                    random.random() > 0.7, random.random() > 0.8, random.random() > 0.9,
                    now_utc(), now_utc()
                )
                meetings.append(meeting_data)
        
        insert_query = """
            INSERT INTO donor_meetings (
                id, organization_id, donor_id, officer_id, meeting_title, meeting_type,
                scheduled_date, scheduled_time, duration_minutes, location, is_virtual,
                meeting_link, status, is_completed, actual_date, attendees,
                agenda, meeting_notes, follow_up_actions, moves_stage_advanced,
                gift_discussed, proposal_presented, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(meetings), 50):
            batch = meetings[i:i + 50]
            execute_batch(self.cur, insert_query, batch, page_size=50)
            self.conn.commit()
            print(f"  📝 Batch {i//50 + 1}/{(len(meetings)-1)//50 + 1}")
        
        print(f"✅ Generated {len(meetings)} donor meetings")
    
    def generate_officer_annual_targets(self):
        """Generate annual targets for officers"""
        print(f"\n🎯 Generating officer annual targets...")
        
        targets = []
        current_year = datetime.now().year
        
        for officer in self.generated_data['officers']:
            for year in [current_year - 1, current_year, current_year + 1]:
                target_id = uuid4()
                
                # Targets based on role
                role = officer['role']
                if role in ['ceo', 'cdo']:
                    target_dollars = float(Decimal(random.randint(2000000, 5000000)))
                    target_gifts = random.randint(20, 50)
                elif role in ['lead_officer', 'principal_gifts']:
                    target_dollars = float(Decimal(random.randint(1000000, 2000000)))
                    target_gifts = random.randint(40, 80)
                else:
                    target_dollars = float(Decimal(random.randint(500000, 1000000)))
                    target_gifts = random.randint(60, 120)
                
                # Actuals (80-110% of target for past years)
                if year < current_year:
                    actual_dollars = target_dollars * random.uniform(0.8, 1.1)
                    actual_gifts = int(target_gifts * random.uniform(0.8, 1.1))
                else:
                    # Current/future: partial progress
                    actual_dollars = target_dollars * random.uniform(0.3, 0.7)
                    actual_gifts = int(target_gifts * random.uniform(0.3, 0.7))
                
                target_data = (
                    str(target_id), str(officer['organization_id']), str(officer['id']),
                    year, target_dollars, target_gifts,
                    random.randint(5, 20), random.randint(30, 100), random.randint(10, 40),
                    actual_dollars, actual_gifts,
                    int(random.randint(5, 20) * 0.9), int(random.randint(30, 100) * 0.9),
                    int(random.randint(10, 40) * 0.9),
                    now_utc(), now_utc()
                )
                targets.append(target_data)
        
        insert_query = """
            INSERT INTO officer_annual_targets (
                id, organization_id, officer_id, fiscal_year,
                target_dollars, target_gift_count, target_new_donors,
                target_meetings, target_proposals,
                actual_dollars, actual_gift_count, actual_new_donors,
                actual_meetings, actual_proposals,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, targets, page_size=50)
        self.conn.commit()
        print(f"✅ Generated {len(targets)} officer annual targets")
    
    def generate_gift_goals(self):
        """Generate gift goals for major donors"""
        print(f"\n🎁 Generating gift goals...")
        
        goals = []
        # Only create goals for cultivation/solicitation stage donors
        solicitation_stages = [
            s for s in self.generated_data['moves_stages']
            if s['current_stage'] in ['cultivation', 'solicitation']
        ]
        
        for stage in solicitation_stages[:300]:  # Limit for speed
            goal_id = uuid4()
            
            # Get donor to determine amount
            donor = next((d for d in self.generated_data['donors'] 
                         if d['id'] == stage['donor_id']), None)
            if not donor:
                continue
            
            # Goal amount based on donor level
            base_amount = donor['total_donated']
            goal_amount = float(Decimal(base_amount * random.uniform(1.5, 3.0)))
            
            # Get campaign if available
            org_campaigns = [c for c in self.generated_data['campaigns']
                           if c['organization_id'] == donor['organization_id']]
            campaign_id = str(random.choice(org_campaigns)['id']) if org_campaigns else None
            
            target_date = fake.date_between(start_date='today', end_date='+18M')
            probability = random.choice([25, 50, 75, 90])
            
            goal_data = (
                str(goal_id), str(donor['organization_id']),
                str(donor['id']), str(stage['officer_id']),
                fake.paragraph(), goal_amount,
                campaign_id, None, None,
                target_date, datetime.now().year + 1,
                float(Decimal(goal_amount * random.uniform(0, 0.5))),
                float(Decimal(goal_amount * random.uniform(0, 0.3))),
                probability, 'active', False, None, None,
                now_utc(), now_utc()
            )
            goals.append(goal_data)
        
        insert_query = """
            INSERT INTO gift_goals (
                id, organization_id, donor_id, officer_id, goal_description,
                goal_amount, campaign_id, project_id, program_id,
                target_date, target_fiscal_year, current_committed_amount,
                current_received_amount, probability_percentage, status,
                is_realized, date_realized, notes, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, goals, page_size=50)
        self.conn.commit()
        print(f"✅ Generated {len(goals)} gift goals")
    
    def generate_solicitation_proposals(self):
        """Generate solicitation proposals"""
        print(f"\n📄 Generating solicitation proposals...")
        
        proposals = []
        # Only for solicitation stage donors
        solicitation_stages = [
            s for s in self.generated_data['moves_stages']
            if s['current_stage'] == 'solicitation'
        ]
        
        for stage in solicitation_stages[:200]:  # Limit
            proposal_id = uuid4()
            
            # Get donor
            donor = next((d for d in self.generated_data['donors']
                         if d['id'] == stage['donor_id']), None)
            if not donor:
                continue
            
            requested_amount = float(Decimal(donor['total_donated'] * random.uniform(2.0, 4.0)))
            status = random.choice(PROPOSAL_STATUSES)
            
            # Dates based on status
            if status == 'draft':
                date_sent = None
                expected_decision = None
                date_responded = None
            elif status == 'sent':
                date_sent = fake.date_between(start_date='-30d', end_date='today')
                expected_decision = fake.date_between(start_date='today', end_date='+60d')
                date_responded = None
            else:  # under_review, accepted, declined, withdrawn
                date_sent = fake.date_between(start_date='-90d', end_date='-30d')
                expected_decision = fake.date_between(start_date=date_sent, end_date='today')
                date_responded = fake.date_between(start_date=date_sent, end_date='today')
            
            # Response amounts
            if status == 'accepted':
                committed = float(Decimal(requested_amount * random.uniform(0.8, 1.0)))
                received = float(Decimal(committed * random.uniform(0.5, 1.0)))
            elif status == 'under_review':
                committed = 0
                received = 0
            else:
                committed = 0
                received = 0
            
            # Get campaign
            org_campaigns = [c for c in self.generated_data['campaigns']
                           if c['organization_id'] == donor['organization_id']]
            campaign_id = str(random.choice(org_campaigns)['id']) if org_campaigns else None
            
            proposal_data = (
                str(proposal_id), str(donor['organization_id']),
                str(donor['id']), str(stage['officer_id']),
                f"Major Gift Proposal - {donor['first_name']} {donor['last_name']}",
                fake.paragraph(), requested_amount,
                campaign_id, None, None,
                status, date_sent, expected_decision, date_responded,
                fake.paragraph() if date_responded else None,
                committed, received, None,
                now_utc(), now_utc()
            )
            proposals.append(proposal_data)
        
        insert_query = """
            INSERT INTO solicitation_proposals (
                id, organization_id, donor_id, officer_id, proposal_title,
                proposal_description, requested_amount, campaign_id, project_id,
                program_id, status, date_sent, expected_decision_date,
                date_responded, response_notes, committed_amount, received_amount,
                proposal_document_url, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, proposals, page_size=50)
        self.conn.commit()
        print(f"✅ Generated {len(proposals)} solicitation proposals")
    
    def generate_donor_priority_cache(self):
        """Generate donor priority cache"""
        print(f"\n🔝 Generating donor priority cache...")
        
        priorities = []
        current_year = datetime.now().year
        
        for assignment in self.generated_data['portfolio_assignments'][:1000]:  # Limit
            priority_id = uuid4()
            
            # Get donor
            donor = next((d for d in self.generated_data['donors']
                         if d['id'] == assignment['donor_id']), None)
            if not donor:
                continue
            
            total_donated = donor['total_donated']
            donor_level = donor['donor_level']
            
            # Assign priority based on giving
            if total_donated > 100000:
                priority = 'priority_1'
            elif total_donated > 10000:
                priority = 'priority_2'
            elif total_donated > 1000:
                priority = 'priority_3'
            else:
                priority = random.choice(['priority_4', 'priority_5'])
            
            # Generate giving history
            current_year_total = float(Decimal(total_donated * random.uniform(0.3, 0.5)))
            last_year_total = float(Decimal(total_donated * random.uniform(0.3, 0.4)))
            two_years_ago = float(Decimal(total_donated * random.uniform(0.2, 0.3)))
            
            yoy_change = current_year_total - last_year_total
            yoy_pct = (yoy_change / last_year_total * 100) if last_year_total > 0 else 0
            
            # Get officer role
            officer = next((o for o in self.generated_data['officers']
                          if o['id'] == assignment['officer_id']), None)
            portfolio_role = officer['role'] if officer else None
            
            priority_data = (
                str(priority_id), str(assignment['organization_id']),
                str(donor['id']), donor_level, priority,
                current_year_total, last_year_total, two_years_ago,
                0, 0, float(Decimal(total_donated)), fake.past_date(),
                float(Decimal(total_donated * random.uniform(1.5, 3.0))),
                "Based on giving history",
                yoy_change, yoy_pct,
                random.randint(1, 10), random.randint(1, 8), random.randint(1, 6),
                fake.date_between(start_date='-90d', end_date='today'),
                random.randint(10, 365),
                str(assignment['officer_id']), portfolio_role,
                False, None, date.today(), True,
                now_utc(), now_utc()
            )
            priorities.append(priority_data)
        
        insert_query = """
            INSERT INTO donor_priority_cache (
                id, organization_id, donor_id, current_donor_level, priority_level,
                current_year_total, last_year_total, two_years_ago_total,
                year_2023_total, year_2022_total, largest_gift_amount, largest_gift_date,
                opportunity_amount, opportunity_basis, yoy_dollar_change, yoy_percentage_change,
                gift_count_current_year, gift_count_last_year, gift_count_two_years_ago,
                last_gift_date, days_since_last_gift, assigned_officer_id, portfolio_role,
                has_exclusion_tag, exclusion_tags, calculation_date, is_current,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for i in range(0, len(priorities), 100):
            batch = priorities[i:i + 100]
            execute_batch(self.cur, insert_query, batch, page_size=100)
            self.conn.commit()
            print(f"  📝 Batch {i//100 + 1}/{(len(priorities)-1)//100 + 1}")
        
        print(f"✅ Generated {len(priorities)} donor priority records")
    
    def generate_donor_exclusion_tags(self):
        """Generate donor exclusion tags"""
        print(f"\n🏷️  Generating donor exclusion tags...")
        
        exclusions = []
        # Apply exclusion tags to ~10% of assigned donors
        sample_assignments = random.sample(
            self.generated_data['portfolio_assignments'],
            len(self.generated_data['portfolio_assignments']) // 10
        )
        
        for assignment in sample_assignments:
            exclusion_id = uuid4()
            tag = random.choice(EXCLUSION_TAGS)
            tag_date = fake.date_between(start_date='-2y', end_date='today')
            
            exclusion_data = (
                str(exclusion_id), str(assignment['organization_id']),
                str(assignment['donor_id']), tag,
                tag_date, None, True, fake.paragraph(),
                now_utc(), now_utc()
            )
            exclusions.append(exclusion_data)
        
        insert_query = """
            INSERT INTO donor_exclusion_tags (
                id, organization_id, donor_id, exclusion_tag,
                tag_applied_date, tag_removed_date, is_active, notes,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        execute_batch(self.cur, insert_query, exclusions, page_size=50)
        self.conn.commit()
        print(f"✅ Generated {len(exclusions)} donor exclusion tags")
    
    def run(self):
        try:
            self.connect()
            self.load_existing_data()
            
            # Generate all major gifts data
            self.generate_major_gift_officers(officers_per_org=5)
            self.generate_portfolio_assignments()
            self.generate_moves_management_stages()
            self.generate_donor_meetings(meetings_per_assignment=3)
            self.generate_officer_annual_targets()
            self.generate_gift_goals()
            self.generate_solicitation_proposals()
            self.generate_donor_priority_cache()
            self.generate_donor_exclusion_tags()
            
            print("\n" + "="*70)
            print("✅ MAJOR GIFTS DATA GENERATION COMPLETE!")
            print("="*70)
            print(f"\n📊 Summary:")
            print(f"  Organizations: {len(self.generated_data['organizations'])}")
            print(f"  Major Gift Officers: {len(self.generated_data['officers'])}")
            print(f"  Portfolio Assignments: {len(self.generated_data['portfolio_assignments'])}")
            print(f"  Moves Management Stages: {len(self.generated_data['moves_stages'])}")
            print(f"  Donor Meetings: ~{len(self.generated_data['portfolio_assignments'][:500]) * 3}")
            print(f"  Officer Annual Targets: {len(self.generated_data['officers']) * 3}")
            print(f"  Gift Goals: ~300")
            print(f"  Solicitation Proposals: ~200")
            print(f"  Donor Priority Records: ~1000")
            print(f"  Exclusion Tags: ~{len(self.generated_data['portfolio_assignments']) // 10}")
            print(f"\n🎉 Major gifts module is now populated with test data!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            self.conn.rollback()
        finally:
            self.disconnect()

if __name__ == "__main__":
    generator = MajorGiftsDataGenerator()
    generator.run()
