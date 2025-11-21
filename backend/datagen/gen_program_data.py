#!/usr/bin/env python3
"""
Program Impact Analytics - Data Generation Script
Generates comprehensive test data for Program Impact Dashboard

This script creates realistic sample data for:
- Programs (various types and statuses)
- Beneficiaries (diverse demographics)
- Program Enrollments (linking beneficiaries to programs)
- Impact Metrics (SROI, social value)
- Outcome Metrics (indicators and targets)
- Outcome Records (actual measurements)
- Service Events (service delivery)
- Service Beneficiaries (attendance)
- SDG Alignment (UN Sustainable Development Goals)

Author: Ashwini
Date: November 2025
"""

import random
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
import sys

# Database imports - adjust as needed for your setup
try:
    from database import SessionLocal, engine
    from models import (
        Programs, Beneficiaries, ProgramEnrollments,
        ImpactMetrics, OutcomeMetrics, OutcomeRecords,
        ServiceEvents, ServiceBeneficiaries, SdgAlignment
    )
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️  Database modules not found. Running in preview mode.")

# ============================================================================
# CONFIGURATION
# ============================================================================

# Your organization ID - UPDATE THIS
ORGANIZATION_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'

# Data generation counts
NUM_PROGRAMS = 8
NUM_BENEFICIARIES = 150
NUM_SERVICE_EVENTS_PER_PROGRAM = 12
ENROLLMENTS_PER_BENEFICIARY = (1, 3)  # min, max

# ============================================================================
# SAMPLE DATA TEMPLATES
# ============================================================================

PROGRAM_TEMPLATES = [
    {
        "name": "Youth Education & Tutoring",
        "description": "After-school tutoring and mentoring program for underserved K-12 students",
        "program_type": "Education",
        "budget": 150000,
        "target_beneficiaries": 200,
        "sdg_goals": ["SDG 4: Quality Education", "SDG 10: Reduced Inequalities"],
        "outcomes": [
            {"name": "Grade Improvement", "unit": "letter grades", "direction": "increase", "target": 1.5},
            {"name": "Graduation Rate", "unit": "percentage", "direction": "increase", "target": 95},
            {"name": "College Enrollment", "unit": "percentage", "direction": "increase", "target": 70}
        ]
    },
    {
        "name": "Community Food Bank",
        "description": "Emergency food assistance and nutrition education for families in need",
        "program_type": "Food Security",
        "budget": 200000,
        "target_beneficiaries": 500,
        "sdg_goals": ["SDG 2: Zero Hunger", "SDG 3: Good Health"],
        "outcomes": [
            {"name": "Meals Distributed", "unit": "meals", "direction": "increase", "target": 50000},
            {"name": "Food Insecurity Reduction", "unit": "percentage", "direction": "decrease", "target": 30},
            {"name": "Nutrition Knowledge", "unit": "score", "direction": "increase", "target": 80}
        ]
    },
    {
        "name": "Workforce Development",
        "description": "Job training, resume building, and career placement services for unemployed adults",
        "program_type": "Employment",
        "budget": 175000,
        "target_beneficiaries": 100,
        "sdg_goals": ["SDG 8: Decent Work", "SDG 1: No Poverty"],
        "outcomes": [
            {"name": "Job Placement Rate", "unit": "percentage", "direction": "increase", "target": 75},
            {"name": "Avg Starting Salary", "unit": "dollars", "direction": "increase", "target": 35000},
            {"name": "Job Retention (6 mo)", "unit": "percentage", "direction": "increase", "target": 80}
        ]
    },
    {
        "name": "Senior Wellness Program",
        "description": "Health screenings, fitness classes, and social activities for seniors",
        "program_type": "Health",
        "budget": 120000,
        "target_beneficiaries": 150,
        "sdg_goals": ["SDG 3: Good Health", "SDG 11: Sustainable Communities"],
        "outcomes": [
            {"name": "Health Screenings", "unit": "screenings", "direction": "increase", "target": 500},
            {"name": "Social Isolation Reduction", "unit": "percentage", "direction": "decrease", "target": 40},
            {"name": "Physical Activity Level", "unit": "hours/week", "direction": "increase", "target": 5}
        ]
    },
    {
        "name": "Housing Assistance",
        "description": "Emergency housing support and homelessness prevention services",
        "program_type": "Housing",
        "budget": 250000,
        "target_beneficiaries": 75,
        "sdg_goals": ["SDG 11: Sustainable Communities", "SDG 1: No Poverty"],
        "outcomes": [
            {"name": "Families Housed", "unit": "families", "direction": "increase", "target": 50},
            {"name": "Housing Stability", "unit": "months", "direction": "increase", "target": 12},
            {"name": "Eviction Prevention", "unit": "cases", "direction": "increase", "target": 100}
        ]
    },
    {
        "name": "Mental Health Services",
        "description": "Counseling, therapy, and crisis intervention for community members",
        "program_type": "Mental Health",
        "budget": 180000,
        "target_beneficiaries": 120,
        "sdg_goals": ["SDG 3: Good Health", "SDG 10: Reduced Inequalities"],
        "outcomes": [
            {"name": "Counseling Sessions", "unit": "sessions", "direction": "increase", "target": 1500},
            {"name": "Mental Health Improvement", "unit": "PHQ-9 score", "direction": "decrease", "target": 5},
            {"name": "Crisis Interventions", "unit": "interventions", "direction": "increase", "target": 200}
        ]
    },
    {
        "name": "Environmental Education",
        "description": "Community gardens, recycling programs, and sustainability education",
        "program_type": "Environment",
        "budget": 90000,
        "target_beneficiaries": 300,
        "sdg_goals": ["SDG 13: Climate Action", "SDG 15: Life on Land"],
        "outcomes": [
            {"name": "Community Gardens", "unit": "gardens", "direction": "increase", "target": 10},
            {"name": "Recycling Rate", "unit": "percentage", "direction": "increase", "target": 60},
            {"name": "Carbon Offset", "unit": "tons CO2", "direction": "increase", "target": 50}
        ]
    },
    {
        "name": "Digital Literacy",
        "description": "Computer skills training and internet access for underserved communities",
        "program_type": "Technology",
        "budget": 100000,
        "target_beneficiaries": 200,
        "sdg_goals": ["SDG 4: Quality Education", "SDG 9: Innovation"],
        "outcomes": [
            {"name": "Digital Certifications", "unit": "certifications", "direction": "increase", "target": 150},
            {"name": "Internet Access Provided", "unit": "households", "direction": "increase", "target": 100},
            {"name": "Digital Confidence", "unit": "score", "direction": "increase", "target": 85}
        ]
    }
]

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
    "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
    "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
    "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker"
]

CITIES = ["Dallas", "Fort Worth", "Arlington", "Plano", "Irving", "Garland", "Frisco", "McKinney"]
STATES = ["TX"]
GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"]
INCOME_LEVELS = ["Very Low", "Low", "Moderate", "Low-Moderate", "Unknown"]
ENROLLMENT_STATUSES = ["Active", "Completed", "Graduated", "Withdrawn", "On Hold"]
SERVICE_LOCATIONS = [
    "Main Community Center", "North Branch", "South Branch", "Mobile Unit",
    "Partner Site - School", "Partner Site - Church", "Online/Virtual",
    "Downtown Office", "Satellite Location"
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def random_date_between(start_date, end_date):
    """Generate a random date between two dates"""
    delta = end_date - start_date
    # Handle edge case where end_date is before or equal to start_date
    if delta.days <= 0:
        return start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def generate_phone():
    """Generate a random phone number"""
    return f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}"

def generate_email(first_name, last_name):
    """Generate an email address"""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]
    return f"{first_name.lower()}.{last_name.lower()}@{random.choice(domains)}"

def calculate_sroi(social_value, investment):
    """Calculate Social Return on Investment"""
    if investment > 0:
        return round(float(social_value) / float(investment), 2)
    return 0

def print_progress(message, current, total):
    """Print progress indicator"""
    percentage = (current / total) * 100
    print(f"  {message}: {current}/{total} ({percentage:.0f}%)")

# ============================================================================
# DATA GENERATION FUNCTIONS
# ============================================================================

def generate_programs(db, org_id):
    """Generate programs with various types and statuses"""
    print("\n📋 Generating Programs...")
    programs = []
    
    for i, template in enumerate(PROGRAM_TEMPLATES[:NUM_PROGRAMS]):
        # Randomize dates
        start_date = date.today() - timedelta(days=random.randint(180, 730))
        end_date = start_date + timedelta(days=random.randint(365, 730))
        
        # Randomize budget utilization
        budget = template["budget"]
        actual_spending = budget * random.uniform(0.6, 0.95)
        
        # Calculate current beneficiaries
        target = template["target_beneficiaries"]
        current = int(target * random.uniform(0.5, 1.1))
        
        # Determine status
        if end_date < date.today():
            status = "Completed"
        elif start_date > date.today():
            status = "Planned"
        else:
            status = random.choice(["Active", "Active", "Active", "On Hold"])
        
        program = Programs(
            id=uuid.uuid4(),
            organization_id=org_id,
            name=template["name"],
            description=template["description"],
            program_type=template["program_type"],
            budget=Decimal(str(budget)),
            actual_spending=Decimal(str(round(actual_spending, 2))),
            start_date=start_date,
            end_date=end_date,
            status=status,
            target_beneficiaries=target,
            current_beneficiaries=current,
            success_metrics={
                "target_outcomes": len(template["outcomes"]),
                "sdg_alignment": len(template["sdg_goals"])
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Store template info for later use
        program._template = template
        programs.append(program)
        
        if DB_AVAILABLE:
            db.add(program)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(programs)} programs")
    return programs

def generate_beneficiaries(db, org_id):
    """Generate diverse beneficiary profiles"""
    print("\n👥 Generating Beneficiaries...")
    beneficiaries = []
    
    for i in range(NUM_BENEFICIARIES):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        
        # Age distribution - weighted toward adults
        age = random.choices(
            [random.randint(5, 17), random.randint(18, 35), random.randint(36, 55), random.randint(56, 85)],
            weights=[20, 35, 30, 15]
        )[0]
        dob = date.today() - timedelta(days=age * 365)
        
        # Enrollment date
        enrolled_date = random_date_between(
            date.today() - timedelta(days=365),
            date.today()
        )
        
        # Needs based on income level
        income_level = random.choice(INCOME_LEVELS)
        possible_needs = [
            "Food Assistance", "Housing Support", "Job Training", "Education",
            "Healthcare", "Mental Health", "Childcare", "Transportation",
            "Legal Aid", "Financial Literacy", "Digital Skills"
        ]
        needs = random.sample(possible_needs, random.randint(1, 4))
        
        beneficiary = Beneficiaries(
            id=uuid.uuid4(),
            organization_id=org_id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=dob,
            gender=random.choice(GENDERS),
            email=generate_email(first_name, last_name),
            phone=generate_phone(),
            address=f"{random.randint(100, 9999)} {random.choice(['Main St', 'Oak Ave', 'Park Blvd', 'Cedar Ln', 'Maple Dr'])}",
            city=random.choice(CITIES),
            state=random.choice(STATES),
            country="USA",
            household_size=random.randint(1, 6),
            income_level=income_level,
            needs=needs,
            status=random.choices(
                ["Active", "Inactive", "Graduated", "Moved"],
                weights=[70, 10, 15, 5]
            )[0],
            enrolled_date=enrolled_date,
            notes=f"Referred from {random.choice(['Community Partner', 'Self-referral', 'School', 'Healthcare Provider', 'Government Agency'])}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        beneficiaries.append(beneficiary)
        
        if DB_AVAILABLE:
            db.add(beneficiary)
        
        if (i + 1) % 50 == 0:
            print_progress("Beneficiaries", i + 1, NUM_BENEFICIARIES)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(beneficiaries)} beneficiaries")
    return beneficiaries

def generate_program_enrollments(db, programs, beneficiaries):
    """Generate enrollments linking beneficiaries to programs"""
    print("\n📝 Generating Program Enrollments...")
    enrollments = []
    
    for i, beneficiary in enumerate(beneficiaries):
        # Each beneficiary enrolled in 1-3 programs
        num_enrollments = random.randint(*ENROLLMENTS_PER_BENEFICIARY)
        enrolled_programs = random.sample(programs, min(num_enrollments, len(programs)))
        
        for program in enrolled_programs:
            # Calculate valid enrollment date range
            enrollment_start = max(program.start_date, beneficiary.enrolled_date)
            enrollment_end = min(program.end_date, date.today())
            
            # Skip if no valid date range (beneficiary enrolled after program ended)
            if enrollment_start > enrollment_end:
                continue
            
            enrollment_date = random_date_between(
                enrollment_start,
                enrollment_end
            )
            
            # Determine completion status
            if random.random() > 0.7:  # 30% completed
                status = "Completed"
                completion_date = enrollment_date + timedelta(days=random.randint(30, 180))
                progress = 100
            elif random.random() > 0.1:  # 60% active
                status = "Active"
                completion_date = None
                progress = random.randint(20, 90)
            else:  # 10% withdrawn
                status = "Withdrawn"
                completion_date = enrollment_date + timedelta(days=random.randint(7, 60))
                progress = random.randint(5, 50)
            
            enrollment = ProgramEnrollments(
                id=uuid.uuid4(),
                program_id=program.id,
                beneficiary_id=beneficiary.id,
                enrollment_date=enrollment_date,
                completion_date=completion_date if status != "Active" else None,
                status=status,
                progress_percentage=Decimal(str(progress)),
                outcome_metrics={
                    "attendance_rate": random.randint(60, 100),
                    "satisfaction_score": random.randint(3, 5),
                    "skill_improvement": random.randint(10, 50)
                },
                notes=f"Enrolled via {random.choice(['Online', 'Walk-in', 'Referral', 'Outreach'])}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            enrollments.append(enrollment)
            
            if DB_AVAILABLE:
                db.add(enrollment)
        
        if (i + 1) % 50 == 0:
            print_progress("Beneficiary enrollments", i + 1, len(beneficiaries))
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(enrollments)} program enrollments")
    return enrollments

def generate_impact_metrics(db, org_id, programs):
    """Generate SROI and social value impact metrics"""
    print("\n📊 Generating Impact Metrics...")
    impact_metrics = []
    
    for program in programs:
        # Generate multiple impact metrics per program
        metrics = [
            ("Social Value Created", random.uniform(1.5, 5.0)),
            ("Community Benefit Index", random.uniform(2.0, 6.0)),
            ("Wellbeing Impact Score", random.uniform(1.8, 4.5))
        ]
        
        for metric_name, multiplier in metrics:
            investment = float(program.actual_spending)
            social_value = investment * multiplier
            sroi = calculate_sroi(social_value, investment)
            
            impact_metric = ImpactMetrics(
                id=uuid.uuid4(),
                organization_id=org_id,
                program_id=program.id,
                metric_name=metric_name,
                social_value=Decimal(str(round(social_value, 2))),
                investment=Decimal(str(round(investment, 2))),
                sroi=Decimal(str(sroi)),
                created_at=datetime.utcnow()
            )
            
            impact_metrics.append(impact_metric)
            
            if DB_AVAILABLE:
                db.add(impact_metric)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(impact_metrics)} impact metrics")
    return impact_metrics

def generate_outcome_metrics_and_records(db, org_id, programs):
    """Generate outcome metrics and actual measurement records"""
    print("\n📈 Generating Outcome Metrics & Records...")
    outcome_metrics = []
    outcome_records = []
    
    for program in programs:
        template = program._template
        
        for outcome_def in template["outcomes"]:
            # Create outcome metric definition
            outcome_metric = OutcomeMetrics(
                id=uuid.uuid4(),
                organization_id=org_id,
                program_id=program.id,
                name=outcome_def["name"],
                description=f"Tracks {outcome_def['name'].lower()} for {program.name}",
                unit=outcome_def["unit"],
                direction=outcome_def["direction"],
                target_value=outcome_def["target"]
            )
            
            outcome_metrics.append(outcome_metric)
            
            if DB_AVAILABLE:
                db.add(outcome_metric)
                db.flush()  # Get the ID
            
            # Generate monthly records for this metric
            start_date = program.start_date
            end_date = min(program.end_date, date.today())
            
            current_date = start_date
            base_value = outcome_def["target"] * 0.3  # Start at 30% of target
            
            while current_date <= end_date:
                # Progressive improvement with some variance
                progress = (current_date - start_date).days / max(1, (end_date - start_date).days)
                
                if outcome_def["direction"] == "increase":
                    value = base_value + (outcome_def["target"] - base_value) * progress
                    value = value * random.uniform(0.85, 1.15)  # Add variance
                else:
                    value = base_value - (base_value * 0.7) * progress
                    value = value * random.uniform(0.85, 1.15)
                
                record = OutcomeRecords(
                    id=uuid.uuid4(),
                    organization_id=org_id,
                    outcome_metric_id=outcome_metric.id,
                    value=round(value, 2),
                    source=random.choice(["Survey", "Database", "Manual Entry", "Partner Report", "Automated"]),
                    recorded_at=datetime.combine(current_date, datetime.min.time())
                )
                
                outcome_records.append(record)
                
                if DB_AVAILABLE:
                    db.add(record)
                
                current_date += timedelta(days=30)  # Monthly records
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(outcome_metrics)} outcome metrics")
    print(f"  ✅ Created {len(outcome_records)} outcome records")
    return outcome_metrics, outcome_records

def generate_service_events(db, org_id, programs, beneficiaries):
    """Generate service delivery events and attendance"""
    print("\n🎯 Generating Service Events...")
    service_events = []
    service_beneficiaries = []
    
    for program in programs:
        # Generate monthly service events
        for i in range(NUM_SERVICE_EVENTS_PER_PROGRAM):
            event_date = random_date_between(program.start_date, min(program.end_date, date.today()))
            
            # Units delivered based on program type
            if program.program_type == "Food Security":
                units = random.randint(500, 2000)
            elif program.program_type == "Education":
                units = random.randint(20, 100)
            elif program.program_type == "Health":
                units = random.randint(10, 50)
            else:
                units = random.randint(10, 200)
            
            event = ServiceEvents(
                id=uuid.uuid4(),
                organization_id=org_id,
                program_id=program.id,
                date=event_date,
                location=random.choice(SERVICE_LOCATIONS),
                units_delivered=Decimal(str(units)),
                notes=f"{program.program_type} service event - {random.choice(['Regular session', 'Special event', 'Outreach', 'Workshop', 'Distribution'])}"
            )
            
            service_events.append(event)
            
            if DB_AVAILABLE:
                db.add(event)
                db.flush()
            
            # Add beneficiary attendance
            # Get beneficiaries enrolled in this program
            program_beneficiaries = [b for b in beneficiaries if random.random() > 0.5][:random.randint(5, 30)]
            
            for beneficiary in program_beneficiaries:
                service_beneficiary = ServiceBeneficiaries(
                    id=uuid.uuid4(),
                    service_event_id=event.id,
                    beneficiary_id=beneficiary.id,
                    participation_status=random.choices(
                        ["Attended", "Attended", "Attended", "No-show", "Cancelled"],
                        weights=[70, 70, 70, 15, 5]
                    )[0],
                    created_at=datetime.utcnow()
                )
                
                service_beneficiaries.append(service_beneficiary)
                
                if DB_AVAILABLE:
                    db.add(service_beneficiary)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(service_events)} service events")
    print(f"  ✅ Created {len(service_beneficiaries)} service beneficiary records")
    return service_events, service_beneficiaries

def generate_sdg_alignment(db, org_id, programs):
    """Generate UN Sustainable Development Goals alignment"""
    print("\n🌍 Generating SDG Alignment...")
    sdg_alignments = []
    
    for program in programs:
        template = program._template
        
        for sdg_goal in template["sdg_goals"]:
            # Contribution score based on program focus
            contribution_score = random.uniform(60, 95)
            
            alignment = SdgAlignment(
                id=uuid.uuid4(),
                organization_id=org_id,
                program_id=program.id,
                sdg_goal=sdg_goal,
                contribution_score=Decimal(str(round(contribution_score, 2))),
                created_at=datetime.utcnow()
            )
            
            sdg_alignments.append(alignment)
            
            if DB_AVAILABLE:
                db.add(alignment)
    
    if DB_AVAILABLE:
        db.commit()
    
    print(f"  ✅ Created {len(sdg_alignments)} SDG alignments")
    return sdg_alignments

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def generate_all_data():
    """Generate all program impact test data"""
    print("=" * 60)
    print("🚀 PROGRAM IMPACT ANALYTICS - DATA GENERATOR")
    print("=" * 60)
    print(f"\nOrganization ID: {ORGANIZATION_ID}")
    print(f"Programs to create: {NUM_PROGRAMS}")
    print(f"Beneficiaries to create: {NUM_BENEFICIARIES}")
    
    if not DB_AVAILABLE:
        print("\n⚠️  Running in PREVIEW MODE (no database connection)")
        print("    To generate actual data, ensure database.py and models.py are available")
        return
    
    try:
        db = SessionLocal()
        org_id = uuid.UUID(ORGANIZATION_ID)
        
        # Generate all data
        programs = generate_programs(db, org_id)
        beneficiaries = generate_beneficiaries(db, org_id)
        enrollments = generate_program_enrollments(db, programs, beneficiaries)
        impact_metrics = generate_impact_metrics(db, org_id, programs)
        outcome_metrics, outcome_records = generate_outcome_metrics_and_records(db, org_id, programs)
        service_events, service_beneficiaries = generate_service_events(db, org_id, programs, beneficiaries)
        sdg_alignments = generate_sdg_alignment(db, org_id, programs)
        
        # Summary
        print("\n" + "=" * 60)
        print("✅ DATA GENERATION COMPLETE")
        print("=" * 60)
        print(f"\n📊 Summary:")
        print(f"  • Programs: {len(programs)}")
        print(f"  • Beneficiaries: {len(beneficiaries)}")
        print(f"  • Program Enrollments: {len(enrollments)}")
        print(f"  • Impact Metrics: {len(impact_metrics)}")
        print(f"  • Outcome Metrics: {len(outcome_metrics)}")
        print(f"  • Outcome Records: {len(outcome_records)}")
        print(f"  • Service Events: {len(service_events)}")
        print(f"  • Service Beneficiaries: {len(service_beneficiaries)}")
        print(f"  • SDG Alignments: {len(sdg_alignments)}")
        
        total_records = (len(programs) + len(beneficiaries) + len(enrollments) + 
                       len(impact_metrics) + len(outcome_metrics) + len(outcome_records) +
                       len(service_events) + len(service_beneficiaries) + len(sdg_alignments))
        print(f"\n  📈 Total Records Created: {total_records}")
        
        db.close()
        
        print("\n🎉 Your Program Impact Dashboard now has comprehensive test data!")
        print("   Navigate to /analytics/program-impact to see it in action.")
        
    except Exception as e:
        print(f"\n❌ Error generating data: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

def cleanup_data():
    """Remove all generated test data (use with caution)"""
    if not DB_AVAILABLE:
        print("Database not available for cleanup")
        return
    
    print("⚠️  This will DELETE all program impact data for the organization!")
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm != "DELETE":
        print("Cleanup cancelled")
        return
    
    try:
        db = SessionLocal()
        org_id = uuid.UUID(ORGANIZATION_ID)
        
        # Delete in reverse order of dependencies
        db.query(ServiceBeneficiaries).filter(
            ServiceBeneficiaries.service_event_id.in_(
                db.query(ServiceEvents.id).filter(ServiceEvents.organization_id == org_id)
            )
        ).delete(synchronize_session=False)
        
        db.query(ServiceEvents).filter(ServiceEvents.organization_id == org_id).delete()
        db.query(OutcomeRecords).filter(OutcomeRecords.organization_id == org_id).delete()
        db.query(OutcomeMetrics).filter(OutcomeMetrics.organization_id == org_id).delete()
        db.query(ImpactMetrics).filter(ImpactMetrics.organization_id == org_id).delete()
        db.query(SdgAlignment).filter(SdgAlignment.organization_id == org_id).delete()
        db.query(ProgramEnrollments).filter(
            ProgramEnrollments.program_id.in_(
                db.query(Programs.id).filter(Programs.organization_id == org_id)
            )
        ).delete(synchronize_session=False)
        db.query(Beneficiaries).filter(Beneficiaries.organization_id == org_id).delete()
        db.query(Programs).filter(Programs.organization_id == org_id).delete()
        
        db.commit()
        db.close()
        
        print("✅ All program impact data deleted")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cleanup":
        cleanup_data()
    else:
        sys.exit(generate_all_data())
