"""
Database Seeding Script for Testing Enhanced Program Impact APIs
FIXED VERSION - Matches actual models.py column definitions
"""

from datetime import datetime, timedelta, date
import random
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from faker import Faker
import numpy as np

# Import ONLY your existing models
from models import (
    Organizations, Beneficiaries, Programs, ServiceEvents, ServiceBeneficiaries,
    OutcomeMetrics, OutcomeRecords, ImpactMetrics, SdgAlignment, Projects, 
    ProgramEnrollments
)

# Initialize Faker for realistic data
fake = Faker()

# Database connection - UPDATE THIS
DATABASE_URL = "postgresql://orguser5:orgpassword5@localhost/organization_db5"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Configuration
ORGANIZATION_ID = "c96b63de-4531-4584-a3a5-2c8f20b33428"  # Or use your existing org ID
DAYS_OF_DATA = 365  # One year of historical data
NUM_BENEFICIARIES = 500
NUM_PROJECTS = 3

print("🚀 Starting database seeding with EXISTING MODELS ONLY...")

# ============================================================================
# 1. CREATE ORGANIZATION
# ============================================================================

# ============================================================================
# 2. CREATE PROGRAMS FIRST (Projects reference Programs)
# ============================================================================
print("Creating programs...")

programs_data = [
    {
        "name": "Education Support",
        "description": "After-school tutoring and mentorship",
        "program_type": "Education",  # FIXED: was 'type'
        "budget": 50000,
    },
    {
        "name": "Food Security Initiative", 
        "description": "Weekly food distribution and meal services",
        "program_type": "Food",  # FIXED: was 'type'
        "budget": 75000,
    },
    {
        "name": "Community Sports Program",
        "description": "Outdoor sports and fitness activities",
        "program_type": "Recreation",  # FIXED: was 'type'
        "budget": 30000,
    },
    {
        "name": "Healthcare Outreach",
        "description": "Basic health services and checkups",
        "program_type": "Healthcare",  # FIXED: was 'type'
        "budget": 100000,
    },
    {
        "name": "Community Garden Project",
        "description": "Urban gardening and sustainability education",
        "program_type": "Environment",  # FIXED: was 'type'
        "budget": 25000,
    }
]

programs = []
for prog_data in programs_data:
    program = Programs(
        id=str(uuid.uuid4()),
        organization_id=ORGANIZATION_ID,
        name=prog_data["name"],
        description=prog_data["description"],
        program_type=prog_data["program_type"],  # FIXED: was not set
        status="active",
        start_date=(datetime.utcnow() - timedelta(days=DAYS_OF_DATA)).date(),  # FIXED: Date type
        budget=prog_data["budget"],
        target_beneficiaries=random.randint(50, 200),
        current_beneficiaries=0,
        created_at=datetime.utcnow() - timedelta(days=DAYS_OF_DATA)
    )
    # FIXED: Removed project_id assignment - Programs don't have project_id
    db.add(program)
    programs.append(program)

db.commit()
print(f"Created {len(programs)} programs")

# ============================================================================
# 3. CREATE PROJECTS (Projects reference Programs, not vice versa)
# ============================================================================
print("Creating projects...")

projects = []
project_names = ["2024 Initiative", "Community Outreach", "Annual Campaign"]

for i, name in enumerate(project_names):
    project = Projects(
        id=str(uuid.uuid4()),
        organization_id=ORGANIZATION_ID,
        program_id=programs[i % len(programs)].id if programs else None,  # FIXED: Project has program_id
        name=name,
        description=f"{name} for community impact",
        project_type="Initiative",
        status="active",
        start_date=(datetime.utcnow() - timedelta(days=DAYS_OF_DATA)).date(),  # FIXED: Date type
        created_at=datetime.utcnow() - timedelta(days=DAYS_OF_DATA)
    )
    db.add(project)
    projects.append(project)

db.commit()
print(f"Created {len(projects)} projects")

# ============================================================================
# 4. CREATE BENEFICIARIES WITH GROWTH PATTERN
# ============================================================================
print(f"Creating {NUM_BENEFICIARIES} beneficiaries with growth pattern...")

beneficiaries = []
# Create beneficiaries with increasing enrollment over time (shows growth)
for i in range(NUM_BENEFICIARIES):
    # Distribute creation dates to show growth
    days_ago = DAYS_OF_DATA - int((i / NUM_BENEFICIARIES) * DAYS_OF_DATA)
    days_ago = max(1, days_ago + random.randint(-10, 10))
    
    # Create age distribution
    age_ranges = [(5, 17), (18, 24), (25, 34), (35, 49), (50, 64), (65, 80)]
    age_range = random.choice(age_ranges)
    birth_date = datetime.utcnow() - timedelta(days=random.randint(age_range[0]*365, age_range[1]*365))
    
    beneficiary = Beneficiaries(
        id=str(uuid.uuid4()),
        organization_id=ORGANIZATION_ID,
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        email=fake.email() if random.random() > 0.3 else None,
        phone=fake.phone_number() if random.random() > 0.4 else None,
        date_of_birth=birth_date.date(),
        gender=random.choice(['Male', 'Female', 'Other', None]),
        address=fake.street_address(),
        city=fake.city(),
        state="TX",
        country="USA",  # FIXED: was 'zip_code', model has 'country' not 'zip_code'
        household_size=random.randint(1, 6),
        income_level=random.choice(['Low', 'Medium', 'High', None]),
        status=random.choices(['Active', 'Inactive'], weights=[85, 15])[0],
        enrolled_date=(datetime.utcnow() - timedelta(days=days_ago)).date(),  # FIXED: Date type
        created_at=datetime.utcnow() - timedelta(days=days_ago)
    )
    db.add(beneficiary)
    beneficiaries.append(beneficiary)

db.commit()
print(f"Created {len(beneficiaries)} beneficiaries")

# ============================================================================
# 5. CREATE PROGRAM ENROLLMENTS
# ============================================================================
print("Creating program enrollments...")

enrollments = []
for beneficiary in beneficiaries:
    # Each beneficiary enrolls in 1-3 programs
    num_programs = random.randint(1, 3)
    enrolled_programs = random.sample(programs, num_programs)
    
    for program in enrolled_programs:
        # Determine enrollment status
        status_weights = [60, 20, 15, 5]  # Active, Completed, Withdrawn, Pending
        status = random.choices(
            ['Active', 'Completed', 'Withdrawn', 'Pending'],
            weights=status_weights
        )[0]
        
        enrollment_date = (beneficiary.created_at + timedelta(days=random.randint(0, 7))).date()
        
        enrollment = ProgramEnrollments(
            id=str(uuid.uuid4()),
            # FIXED: Removed organization_id - not in model
            program_id=program.id,
            beneficiary_id=beneficiary.id,
            status=status,
            enrollment_date=enrollment_date,  # FIXED: was 'enrolled_date'
            progress_percentage=random.randint(0, 100) if status in ['Active', 'Completed'] else 0,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, DAYS_OF_DATA))
        )
        db.add(enrollment)
        enrollments.append(enrollment)

db.commit()
print(f"Created {len(enrollments)} enrollments")

# Update program current_beneficiaries count
for program in programs:
    count = len([e for e in enrollments if e.program_id == program.id and e.status == 'Active'])
    program.current_beneficiaries = count
db.commit()

# ============================================================================
# 6. CREATE SERVICE EVENTS AND ATTENDANCE
# ============================================================================
print("Creating service events and attendance records...")

service_events = []
service_beneficiaries = []

for program in programs:
    # Create weekly events for each program over the past year
    for week in range(52):
        event_date = (datetime.utcnow() - timedelta(weeks=52-week)).date()  # FIXED: Date type
        
        event = ServiceEvents(
            id=str(uuid.uuid4()),
            organization_id=ORGANIZATION_ID,
            program_id=program.id,
            date=event_date,  # FIXED: Only 'date', removed 'name', 'start_time', 'end_time', 'status', 'volunteer_count'
            location=fake.address(),
            units_delivered=random.randint(10, 100),
            notes=f"Weekly session for {program.name}"
        )
        db.add(event)
        service_events.append(event)
        
        # Get enrolled beneficiaries for this program
        program_enrollments = [e for e in enrollments if e.program_id == program.id]
        
        # Random attendance (60-90% attendance rate)
        attendance_rate = random.uniform(0.6, 0.9)
        attending = random.sample(
            program_enrollments, 
            int(len(program_enrollments) * attendance_rate)
        )
        
        for enrollment in attending:
            attendance = ServiceBeneficiaries(
                id=str(uuid.uuid4()),
                # FIXED: Removed organization_id - not in model
                service_event_id=event.id,
                beneficiary_id=enrollment.beneficiary_id,
                participation_status=random.choices(  # FIXED: was 'attendance_status'
                    ['Present', 'Partial', 'Absent'],
                    weights=[85, 10, 5]
                )[0],
                # FIXED: Removed 'service_date' - not in model
                created_at=datetime.utcnow() - timedelta(weeks=52-week)
            )
            db.add(attendance)
            service_beneficiaries.append(attendance)

db.commit()
print(f"Created {len(service_events)} service events with {len(service_beneficiaries)} attendance records")

# ============================================================================
# 7. CREATE AT-RISK BENEFICIARIES (no recent attendance)
# ============================================================================
print("Creating at-risk beneficiaries (no activity in 14+ days)...")
active_enrollments = [e for e in enrollments if e.status == 'Active']
at_risk_count = int(len(active_enrollments) * 0.1)  # 10% at-risk
at_risk_enrollments = random.sample(active_enrollments, min(at_risk_count, len(active_enrollments)))

# Get recent service events
recent_events = [e for e in service_events if e.date >= (datetime.utcnow() - timedelta(days=14)).date()]
recent_event_ids = [e.id for e in recent_events]

# Remove their recent attendance records
for enrollment in at_risk_enrollments:
    recent_attendance = db.query(ServiceBeneficiaries).filter(
        ServiceBeneficiaries.beneficiary_id == enrollment.beneficiary_id,
        ServiceBeneficiaries.service_event_id.in_(recent_event_ids)
    ).all()
    for attendance in recent_attendance:
        db.delete(attendance)

db.commit()
print(f"Created {len(at_risk_enrollments)} at-risk beneficiaries")

# ============================================================================
# 8. CREATE OUTCOME METRICS AND RECORDS
# ============================================================================
print("Creating outcome metrics and tracking...")

outcome_metrics = []
outcome_records = []

# Create metrics for each program
metric_templates = [
    {'name': 'Skills Assessment Score', 'direction': 'increase', 'target': 80, 'unit': 'points'},
    {'name': 'Attendance Rate', 'direction': 'increase', 'target': 85, 'unit': 'percent'},
    {'name': 'Satisfaction Score', 'direction': 'increase', 'target': 90, 'unit': 'points'},
    {'name': 'Health Improvement Index', 'direction': 'increase', 'target': 75, 'unit': 'index'},
    {'name': 'Food Security Level', 'direction': 'increase', 'target': 100, 'unit': 'percent'}
]

for program in programs:
    # 1-3 metrics per program
    num_metrics = random.randint(1, 3)
    program_metrics = random.sample(metric_templates, num_metrics)
    
    for metric_template in program_metrics:
        metric = OutcomeMetrics(
            id=str(uuid.uuid4()),
            organization_id=ORGANIZATION_ID,
            program_id=program.id,
            name=metric_template['name'],
            description=f"Tracking {metric_template['name']} for {program.name}",
            unit=metric_template['unit'],  # FIXED: Added unit
            target_value=metric_template['target'],
            direction=metric_template['direction'],
            # FIXED: Removed created_at - not in model
        )
        db.add(metric)
        outcome_metrics.append(metric)
        
        # Create monthly outcome records showing improvement over time
        for month in range(12):
            record_date = datetime.utcnow() - timedelta(days=30*(12-month))
            
            # Start below target and gradually improve
            base_value = metric.target_value * 0.6
            improvement_rate = 0.03 * month  # 3% improvement per month
            value = min(
                metric.target_value * 1.1,  # Cap at 110% of target
                base_value * (1 + improvement_rate) + random.uniform(-5, 5)
            )
            
            record = OutcomeRecords(
                id=str(uuid.uuid4()),
                organization_id=ORGANIZATION_ID,
                outcome_metric_id=metric.id,
                value=round(value, 2),
                source="Monthly Assessment",
                recorded_at=record_date,
                # FIXED: Removed created_at - not in model
            )
            db.add(record)
            outcome_records.append(record)

db.commit()
print(f"Created {len(outcome_metrics)} metrics with {len(outcome_records)} records")

# ============================================================================
# 9. CREATE IMPACT METRICS (Organization-wide metrics)
# ============================================================================
print("Creating impact metrics...")

# FIXED: ImpactMetrics model has: metric_name, social_value, investment, sroi, program_id
# NOT: description, unit_of_measure, total_value, ytd_value, current_month_value

impact_data = [
    {"metric_name": "Total People Served", "social_value": 500000, "investment": 100000},
    {"metric_name": "Meals Distributed", "social_value": 250000, "investment": 75000},
    {"metric_name": "Educational Hours Provided", "social_value": 300000, "investment": 50000},
    {"metric_name": "Health Screenings Completed", "social_value": 400000, "investment": 100000},
    {"metric_name": "Community Events Hosted", "social_value": 150000, "investment": 30000},
]

for i, data in enumerate(impact_data):
    social_value = data["social_value"]
    investment = data["investment"]
    sroi = round(social_value / investment, 2) if investment > 0 else 0
    
    impact = ImpactMetrics(
        id=str(uuid.uuid4()),
        organization_id=ORGANIZATION_ID,
        program_id=programs[i % len(programs)].id,  # Link to a program
        metric_name=data["metric_name"],
        social_value=social_value,
        investment=investment,
        sroi=sroi,
        created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
    )
    db.add(impact)

db.commit()
print("Created impact metrics")

# ============================================================================
# 10. CREATE SDG ALIGNMENT (UN Sustainable Development Goals)
# ============================================================================
print("Creating SDG alignment...")

# FIXED: SdgAlignment model has: sdg_goal, contribution_score
# NOT: sdg_number, sdg_name, alignment_description, beneficiaries_impacted

sdg_goals = [
    {"goal": "SDG 1: No Poverty", "score": 85},
    {"goal": "SDG 2: Zero Hunger", "score": 90},
    {"goal": "SDG 3: Good Health and Well-being", "score": 75},
    {"goal": "SDG 4: Quality Education", "score": 95},
    {"goal": "SDG 10: Reduced Inequalities", "score": 80},
]

for program in programs:
    # Align each program with 1-2 SDGs
    num_sdgs = random.randint(1, 2)
    selected_sdgs = random.sample(sdg_goals, num_sdgs)
    
    for sdg in selected_sdgs:
        alignment = SdgAlignment(
            id=str(uuid.uuid4()),
            organization_id=ORGANIZATION_ID,
            program_id=program.id,
            sdg_goal=sdg["goal"],  # FIXED: was sdg_number, sdg_name, etc.
            contribution_score=sdg["score"] + random.randint(-10, 10),  # FIXED: was various other fields
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180))
        )
        db.add(alignment)

db.commit()
print("Created SDG alignments")

# ============================================================================
# 11. CREATE TODAY'S REAL-TIME DATA
# ============================================================================
print("Creating today's real-time data...")

today = datetime.utcnow().date()

# Create some services happening today
for program in programs[:3]:  # First 3 programs have events today
    today_event = ServiceEvents(
        id=str(uuid.uuid4()),
        organization_id=ORGANIZATION_ID,
        program_id=program.id,
        date=today,  # FIXED: Date type, removed name, start_time, end_time, status, volunteer_count
        location=f"{program.name} - Main Location",
        units_delivered=random.randint(20, 50),
        notes=f"Today's session for {program.name}"
    )
    db.add(today_event)
    db.commit()  # Commit to get the ID
    
    # Add some beneficiaries attending today
    today_attendees = random.sample(beneficiaries, min(20, len(beneficiaries)))
    for beneficiary in today_attendees:
        attendance = ServiceBeneficiaries(
            id=str(uuid.uuid4()),
            # FIXED: Removed organization_id
            service_event_id=today_event.id,
            beneficiary_id=beneficiary.id,
            participation_status='Present',  # FIXED: was 'attendance_status'
            # FIXED: Removed service_date
            created_at=datetime.utcnow()
        )
        db.add(attendance)

db.commit()
print("Created today's real-time data")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "="*60)
print("✅ DATABASE SEEDING COMPLETE!")
print("="*60)
print(f"Organization ID: {ORGANIZATION_ID}")
print(f"Created data for {DAYS_OF_DATA} days")
print(f"  - {len(beneficiaries)} beneficiaries")
print(f"  - {len(programs)} programs")
print(f"  - {len(projects)} projects")
print(f"  - {len(enrollments)} enrollments")
print(f"  - {len(service_events)} service events")
print(f"  - {len(service_beneficiaries)} attendance records")
print(f"  - {len(at_risk_enrollments)} at-risk beneficiaries")
print(f"  - {len(outcome_records)} outcome measurements")
print(f"  - 5 impact metrics")
print(f"  - SDG alignments")

print("\n📊 Data Characteristics:")
print(f"  - Growth pattern in beneficiary enrollment")
print(f"  - {len(at_risk_enrollments)} beneficiaries with no activity in 14+ days")
print(f"  - Outcome metrics showing gradual improvement")
print(f"  - Real-time data for today's activities")

print(f"\n🔗 Use this Organization ID for API testing: {ORGANIZATION_ID}")
print("\n🚀 You can now test the APIs with this data!")

# Close database connection
db.close()
