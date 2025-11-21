#!/usr/bin/env python3
"""
Financial Analytics - Data Generation Script
=============================================
Generates comprehensive test data for all Financial Health Dashboard APIs.

This script creates realistic sample data for:
- Donations (multi-year, various types and methods)
- Donors (with giving patterns)
- Campaigns (with goals and timelines)
- Programs (for allocation tracking)
- DonationLines (program allocations)
- Expenses & ExpenseCategories
- Pledges & PledgeInstallments
- RecurringGifts
- Grants & GrantReports
- GrantBudgets & GrantActivities

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
        Organizations, Donors, Donations, DonationLines,
        Campaigns, Programs, Expenses, ExpenseCategories,
        Pledges, PledgeInstallments, RecurringGifts,
        Grants, GrantReports, GrantBudgets, GrantActivities,
        Users
    )
    DB_AVAILABLE = True
except ImportError as e:
    DB_AVAILABLE = False
    print(f"⚠️  Database modules not found: {e}")
    print("Running in preview mode - no data will be inserted.")

# ============================================================
# CONFIGURATION
# ============================================================

# Replace with your actual organization ID
ORGANIZATION_ID = "cc5da00c-4881-415f-88e5-a343ed4755e8"

# Data generation parameters
NUM_DONORS = 150
NUM_CAMPAIGNS = 8
NUM_PROGRAMS = 6
NUM_EXPENSE_CATEGORIES = 12
NUM_GRANTS = 15
YEARS_OF_DATA = 3  # Generate 3 years of historical data

# Random seed for reproducibility
random.seed(42)

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def random_date_between(start_date, end_date):
    """Generate a random date between two dates."""
    if start_date > end_date:
        start_date, end_date = end_date, start_date
    delta = end_date - start_date
    if delta.days <= 0:
        return start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)

def random_amount(min_amt, max_amt, round_to=2):
    """Generate a random monetary amount."""
    return round(random.uniform(min_amt, max_amt), round_to)

def weighted_choice(choices, weights):
    """Make a weighted random choice."""
    return random.choices(choices, weights=weights, k=1)[0]

# ============================================================
# SAMPLE DATA DEFINITIONS
# ============================================================

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
]

DONATION_TYPES = ["individual", "corporate", "foundation", "government", "in_kind"]
DONATION_TYPE_WEIGHTS = [0.65, 0.15, 0.12, 0.05, 0.03]

PAYMENT_METHODS = ["credit_card", "check", "bank_transfer", "cash", "paypal", "stock"]
PAYMENT_METHOD_WEIGHTS = [0.45, 0.25, 0.15, 0.08, 0.05, 0.02]

CAMPAIGN_NAMES = [
    "Annual Fund 2023", "Annual Fund 2024", "Annual Fund 2025",
    "Year-End Giving Campaign", "Spring Appeal",
    "Capital Campaign - New Facility", "Emergency Relief Fund",
    "Major Gifts Initiative", "Monthly Giving Program Launch",
    "Matching Gift Challenge", "Legacy Society Drive"
]

PROGRAM_NAMES = [
    "Child Nutrition Program", "Education & Literacy", "Healthcare Access",
    "Community Development", "Emergency Response", "Capacity Building",
    "Youth Empowerment", "Senior Services", "Environmental Sustainability"
]

EXPENSE_CATEGORIES_DATA = [
    # Program expenses
    {"name": "Program Staff Salaries", "type": "program"},
    {"name": "Program Supplies", "type": "program"},
    {"name": "Program Travel", "type": "program"},
    {"name": "Beneficiary Services", "type": "program"},
    {"name": "Partner Grants", "type": "program"},
    # Administrative expenses
    {"name": "Admin Staff Salaries", "type": "administrative"},
    {"name": "Office Rent", "type": "administrative"},
    {"name": "Utilities", "type": "administrative"},
    {"name": "Insurance", "type": "administrative"},
    {"name": "Professional Services", "type": "administrative"},
    # Fundraising expenses
    {"name": "Fundraising Staff", "type": "fundraising"},
    {"name": "Marketing & Communications", "type": "fundraising"},
    {"name": "Event Costs", "type": "fundraising"},
    {"name": "Donor Management System", "type": "fundraising"},
]

GRANT_FUNDERS = [
    {"name": "Bill & Melinda Gates Foundation", "type": "foundation"},
    {"name": "Ford Foundation", "type": "foundation"},
    {"name": "MacArthur Foundation", "type": "foundation"},
    {"name": "Rockefeller Foundation", "type": "foundation"},
    {"name": "Robert Wood Johnson Foundation", "type": "foundation"},
    {"name": "USAID", "type": "government"},
    {"name": "Department of Health & Human Services", "type": "government"},
    {"name": "State Department of Education", "type": "government"},
    {"name": "City Community Development Block Grant", "type": "government"},
    {"name": "Google.org", "type": "corporate"},
    {"name": "Microsoft Philanthropies", "type": "corporate"},
    {"name": "Walmart Foundation", "type": "corporate"},
    {"name": "Bank of America Charitable Foundation", "type": "corporate"},
    {"name": "United Way", "type": "foundation"},
    {"name": "Community Foundation", "type": "foundation"},
]

GRANT_TYPES = ["general operating", "program", "capital", "capacity building", "research"]
GRANT_STATUSES = ["prospecting", "preparing", "submitted", "pending_review", "awarded", "declined", "closed"]
GRANT_STATUS_WEIGHTS = [0.15, 0.15, 0.20, 0.10, 0.25, 0.10, 0.05]

# ============================================================
# DATA GENERATION FUNCTIONS
# ============================================================

def generate_expense_categories(db, org_id):
    """Generate expense categories."""
    print("📁 Generating expense categories...")
    categories = []
    
    for cat_data in EXPENSE_CATEGORIES_DATA:
        category = ExpenseCategories(
            id=uuid.uuid4(),
            organization_id=org_id,
            name=cat_data["name"],
            category_type=cat_data["type"],
            description=f"{cat_data['name']} expenses",
            is_active=True
        )
        db.add(category)
        categories.append(category)
    
    db.flush()
    print(f"   ✅ Created {len(categories)} expense categories")
    return categories


def generate_programs(db, org_id):
    """Generate programs."""
    print("📋 Generating programs...")
    programs = []
    
    program_types = ["education", "health", "nutrition", "community", "emergency", "capacity"]
    
    for i, name in enumerate(PROGRAM_NAMES[:NUM_PROGRAMS]):
        start_date = date.today() - timedelta(days=random.randint(365, 1095))
        budget_amount = random_amount(50000, 500000)
        
        program = Programs(
            id=uuid.uuid4(),
            organization_id=org_id,
            name=name,
            description=f"Description for {name}",
            program_type=program_types[i % len(program_types)],
            budget=Decimal(str(budget_amount)),
            actual_spending=Decimal(str(budget_amount * random.uniform(0.4, 0.9))),
            start_date=start_date,
            end_date=start_date + timedelta(days=random.randint(365, 1825)),
            status=random.choice(["active", "active", "active", "planning", "completed"]),
            target_beneficiaries=random.randint(100, 5000),
            current_beneficiaries=random.randint(50, 3000),
            success_metrics={"goal": "Impact measurement", "kpis": ["reach", "outcomes", "efficiency"]}
        )
        db.add(program)
        programs.append(program)
    
    db.flush()
    print(f"   ✅ Created {len(programs)} programs")
    return programs


def generate_campaigns(db, org_id):
    """Generate fundraising campaigns."""
    print("🎯 Generating campaigns...")
    campaigns = []
    
    for i in range(NUM_CAMPAIGNS):
        year = date.today().year - random.randint(0, 2)
        start_date = date(year, random.randint(1, 10), 1)
        end_date = start_date + timedelta(days=random.randint(30, 120))
        
        goal = random_amount(25000, 500000)
        
        campaign_name = CAMPAIGN_NAMES[i % len(CAMPAIGN_NAMES)] if i < len(CAMPAIGN_NAMES) else f"Campaign {i+1}"
        # Generate slug from name
        slug = campaign_name.lower().replace(" ", "-").replace("&", "and")
        slug = ''.join(c for c in slug if c.isalnum() or c == '-')
        slug = f"{slug}-{i}"  # Add index to ensure uniqueness
        
        campaign = Campaigns(
            id=uuid.uuid4(),
            organization_id=org_id,
            name=campaign_name,
            slug=slug,
            description=f"Fundraising campaign for {year}",
            goal_amount=Decimal(str(goal)),
            start_date=start_date,
            end_date=end_date,
            status="completed" if end_date < date.today() else "active",
            campaign_type=random.choice(["general", "project", "emergency", "monthly_giving"])
        )
        db.add(campaign)
        campaigns.append(campaign)
    
    db.flush()
    print(f"   ✅ Created {len(campaigns)} campaigns")
    return campaigns


def generate_donors(db, org_id):
    """Generate donors with various giving capacities."""
    print("👥 Generating donors...")
    donors = []
    
    # Define donor segments
    segments = [
        {"type": "major", "count": int(NUM_DONORS * 0.05), "min": 10000, "max": 100000},
        {"type": "mid_level", "count": int(NUM_DONORS * 0.15), "min": 1000, "max": 9999},
        {"type": "regular", "count": int(NUM_DONORS * 0.40), "min": 100, "max": 999},
        {"type": "small", "count": int(NUM_DONORS * 0.40), "min": 10, "max": 99},
    ]
    
    for segment in segments:
        for _ in range(segment["count"]):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            
            donor = Donors(
                id=uuid.uuid4(),
                organization_id=org_id,
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}{random.randint(1,999)}@example.com",
                phone=f"555-{random.randint(100,999)}-{random.randint(1000,9999)}",
                donor_type=random.choice(["individual", "corporate", "foundation"]),
                acquisition_source=random.choice(["website", "event", "referral", "direct_mail", "social_media"])
            )
            donor._segment = segment  # Store for donation generation
            db.add(donor)
            donors.append(donor)
    
    db.flush()
    print(f"   ✅ Created {len(donors)} donors")
    return donors


def generate_donations(db, org_id, donors, campaigns, programs):
    """Generate donations across multiple years."""
    print("💰 Generating donations...")
    donations = []
    donation_lines = []
    
    today = date.today()
    start_date = today - timedelta(days=YEARS_OF_DATA * 365)
    
    for donor in donors:
        segment = getattr(donor, '_segment', {"min": 50, "max": 500})
        
        # Number of donations based on donor type
        if segment.get("type") == "major":
            num_donations = random.randint(3, 8)
        elif segment.get("type") == "mid_level":
            num_donations = random.randint(4, 12)
        else:
            num_donations = random.randint(1, 6)
        
        for _ in range(num_donations):
            donation_date = random_date_between(start_date, today)
            amount = random_amount(segment["min"], segment["max"])
            
            # Assign to campaign if within campaign dates
            campaign = None
            for c in campaigns:
                if c.start_date <= donation_date <= c.end_date:
                    campaign = c
                    break
            
            is_recurring = random.random() < 0.15
            
            donation = Donations(
                id=uuid.uuid4(),
                organization_id=org_id,
                donor_id=donor.id,
                campaign_id=campaign.id if campaign else None,
                amount=Decimal(str(amount)),
                donation_date=datetime.combine(donation_date, datetime.min.time()),
                gift_type=random.choice(["one_time", "recurring", "pledge", "in_kind", "stock"]),
                payment_method=weighted_choice(PAYMENT_METHODS, PAYMENT_METHOD_WEIGHTS),
                payment_status=random.choice(["completed", "completed", "completed", "pending"]),
                is_recurring=is_recurring,
                is_anonymous=random.random() < 0.05,
                is_first_time=False,
                is_repeat=True,
                receipt_sent=True,
                thank_you_sent=random.random() > 0.1
            )
            db.add(donation)
            donations.append(donation)
            
            # Create donation lines (allocate to programs)
            if programs and random.random() < 0.7:
                num_allocations = random.randint(1, min(3, len(programs)))
                selected_programs = random.sample(programs, num_allocations)
                remaining = amount
                
                for i, prog in enumerate(selected_programs):
                    if i == len(selected_programs) - 1:
                        alloc_amount = remaining
                    else:
                        alloc_amount = round(amount / num_allocations, 2)
                        remaining -= alloc_amount
                    
                    line = DonationLines(
                        id=uuid.uuid4(),
                        organization_id=org_id,
                        donation_id=donation.id,
                        program_id=prog.id,
                        amount=Decimal(str(alloc_amount))
                    )
                    db.add(line)
                    donation_lines.append(line)
    
    db.flush()
    print(f"   ✅ Created {len(donations)} donations with {len(donation_lines)} allocation lines")
    return donations


def generate_expenses(db, org_id, categories, programs):
    """Generate expenses across categories and programs."""
    print("📊 Generating expenses...")
    expenses = []
    
    today = date.today()
    start_date = today - timedelta(days=YEARS_OF_DATA * 365)
    
    # Generate monthly expenses for each category
    current_date = start_date
    while current_date < today:
        for category in categories:
            # Base amount varies by category type
            if category.category_type == "program":
                base_amount = random_amount(5000, 25000)
            elif category.category_type == "administrative":
                base_amount = random_amount(2000, 8000)
            else:  # fundraising
                base_amount = random_amount(1000, 5000)
            
            # Add some monthly variance
            amount = base_amount * random.uniform(0.8, 1.2)
            
            expense = Expenses(
                id=uuid.uuid4(),
                organization_id=org_id,
                category_id=category.id,
                program_id=random.choice(programs).id if category.category_type == "program" and programs else None,
                amount=Decimal(str(round(amount, 2))),
                expense_date=current_date + timedelta(days=random.randint(0, 28)),
                description=f"{category.name} - {current_date.strftime('%B %Y')}",
                vendor=random.choice(["Vendor A", "Vendor B", "Vendor C", "Internal", "Contractor"]),
                payment_method=random.choice(["check", "credit_card", "bank_transfer"]),
                status="paid"
            )
            db.add(expense)
            expenses.append(expense)
        
        # Move to next month
        if current_date.month == 12:
            current_date = date(current_date.year + 1, 1, 1)
        else:
            current_date = date(current_date.year, current_date.month + 1, 1)
    
    db.flush()
    print(f"   ✅ Created {len(expenses)} expense records")
    return expenses


def generate_pledges(db, org_id, donors):
    """Generate pledges with installment schedules."""
    print("📝 Generating pledges...")
    pledges = []
    installments = []
    
    # Select some donors to have pledges
    pledge_donors = random.sample(donors, min(30, len(donors)))
    
    for donor in pledge_donors:
        pledge_amount = random_amount(1000, 50000)
        start_date = date.today() - timedelta(days=random.randint(0, 365))
        num_installments = random.choice([4, 6, 12, 24])
        
        pledge = Pledges(
            id=uuid.uuid4(),
            organization_id=org_id,
            donor_id=donor.id,  # Note: This references parties table, not donors
            total_amount=Decimal(str(pledge_amount)),
            pledge_date=start_date,
            frequency=random.choice(["monthly", "quarterly", "annual"]),
            status=random.choice(["active", "active", "completed", "cancelled"])
        )
        db.add(pledge)
        pledges.append(pledge)
        
        # Generate installments
        installment_amount = pledge_amount / num_installments
        
        for i in range(num_installments):
            due_date = start_date + timedelta(days=30 * (i + 1))
            
            # Determine if paid (past due dates more likely to be paid)
            if due_date < date.today():
                is_paid = random.random() < 0.85
            else:
                is_paid = False
            
            installment = PledgeInstallments(
                id=uuid.uuid4(),
                organization_id=org_id,
                pledge_id=pledge.id,
                due_amount=Decimal(str(round(installment_amount, 2))),
                due_date=due_date,
                status="paid" if is_paid else "pending"
            )
            db.add(installment)
            installments.append(installment)
    
    db.flush()
    print(f"   ✅ Created {len(pledges)} pledges with {len(installments)} installments")
    return pledges


def generate_recurring_gifts(db, org_id, donors):
    """Generate recurring gift subscriptions."""
    print("🔄 Generating recurring gifts...")
    recurring_gifts = []
    
    # Select donors for recurring giving
    recurring_donors = random.sample(donors, min(25, len(donors)))
    
    for donor in recurring_donors:
        gift = RecurringGifts(
            id=uuid.uuid4(),
            organization_id=org_id,
            donor_id=donor.id,
            amount=float(random.choice([10, 25, 50, 100, 250, 500])),
            currency="USD",
            frequency=random.choice(["monthly", "quarterly", "annually"]),
            frequency_amount_count=random.randint(1, 12),
            next_charge_on=date.today() + timedelta(days=random.randint(1, 30))
            # payment_method_id is nullable, skipping for now
        )
        db.add(gift)
        recurring_gifts.append(gift)
    
    db.flush()
    print(f"   ✅ Created {len(recurring_gifts)} recurring gifts")
    return recurring_gifts


def generate_grants(db, org_id, programs):
    """Generate grants with various statuses."""
    print("🏛️ Generating grants...")
    grants = []
    
    for i in range(NUM_GRANTS):
        funder = random.choice(GRANT_FUNDERS)
        status = weighted_choice(GRANT_STATUSES, GRANT_STATUS_WEIGHTS)
        
        # Timeline based on status
        if status in ["awarded", "closed"]:
            deadline = date.today() - timedelta(days=random.randint(60, 365))
            submission_date = deadline - timedelta(days=random.randint(1, 14))
            start_date = deadline + timedelta(days=random.randint(30, 90))
            end_date = start_date + timedelta(days=random.randint(365, 730))
            amount_requested = random_amount(50000, 500000)
            amount_awarded = amount_requested * random.uniform(0.7, 1.0) if status == "awarded" else None
        elif status == "declined":
            deadline = date.today() - timedelta(days=random.randint(30, 180))
            submission_date = deadline - timedelta(days=random.randint(1, 14))
            start_date = None
            end_date = None
            amount_requested = random_amount(50000, 500000)
            amount_awarded = None
        elif status == "submitted":
            deadline = date.today() - timedelta(days=random.randint(1, 30))
            submission_date = deadline - timedelta(days=random.randint(1, 7))
            start_date = None
            end_date = None
            amount_requested = random_amount(50000, 500000)
            amount_awarded = None
        else:  # prospecting, preparing, pending_review
            deadline = date.today() + timedelta(days=random.randint(14, 180))
            submission_date = None
            start_date = None
            end_date = None
            amount_requested = random_amount(50000, 500000)
            amount_awarded = None
        
        grant = Grants(
            id=uuid.uuid4(),
            organization_id=org_id,
            funder_name=funder["name"],
            funder_type=funder["type"],
            name=f"{funder['name']} - {random.choice(GRANT_TYPES).title()} Grant",
            description=f"Grant application to {funder['name']}",
            grant_type=random.choice(GRANT_TYPES),
            amount_requested=Decimal(str(round(amount_requested, 2))),
            amount_awarded=Decimal(str(round(amount_awarded, 2))) if amount_awarded else None,
            deadline=deadline,
            submission_date=submission_date,
            start_date=start_date,
            end_date=end_date,
            status=status,
            probability=random.randint(20, 80),
            priority=random.choice(["low", "medium", "high"]),
            program_id=random.choice(programs).id if programs else None,
            is_renewable=random.random() < 0.3,
            requirements="Standard grant requirements and reporting",
            deliverables="Quarterly reports, final evaluation"
        )
        db.add(grant)
        grants.append(grant)
    
    db.flush()
    print(f"   ✅ Created {len(grants)} grants")
    return grants


def generate_grant_reports(db, org_id, grants):
    """Generate grant reports for awarded grants."""
    print("📄 Generating grant reports...")
    reports = []
    
    awarded_grants = [g for g in grants if g.status in ["awarded", "closed"]]
    
    for grant in awarded_grants:
        if not grant.start_date or not grant.end_date:
            continue
        
        # Generate quarterly reports
        current_date = grant.start_date
        report_num = 1
        
        while current_date < min(grant.end_date, date.today()):
            due_date = current_date + timedelta(days=90)
            
            # Determine status based on due date
            if due_date < date.today() - timedelta(days=30):
                status = random.choice(["submitted", "accepted"])
                submitted_date = due_date - timedelta(days=random.randint(1, 7))
            elif due_date < date.today():
                status = random.choice(["submitted", "in_progress", "under_review"])
                submitted_date = due_date if status == "submitted" else None
            else:
                status = random.choice(["not_started", "in_progress"])
                submitted_date = None
            
            report = GrantReports(
                id=uuid.uuid4(),
                grant_id=grant.id,
                organization_id=org_id,
                report_type=random.choice(["interim", "quarterly", "narrative"]),
                title=f"Q{report_num} Report - {grant.name}",
                due_date=due_date,
                submitted_date=submitted_date,
                status=status,
                period_start=current_date,
                period_end=due_date,
                budget_spent=Decimal(str(random_amount(10000, 50000))) if status in ["submitted", "accepted"] else None,
                narrative_content="Progress report content..." if status in ["submitted", "accepted"] else None
            )
            db.add(report)
            reports.append(report)
            
            current_date = due_date
            report_num += 1
        
        # Final report
        if grant.end_date <= date.today():
            final_report = GrantReports(
                id=uuid.uuid4(),
                grant_id=grant.id,
                organization_id=org_id,
                report_type="final",
                title=f"Final Report - {grant.name}",
                due_date=grant.end_date + timedelta(days=30),
                submitted_date=grant.end_date + timedelta(days=random.randint(15, 30)) if grant.status == "closed" else None,
                status="submitted" if grant.status == "closed" else "not_started",
                period_start=grant.start_date,
                period_end=grant.end_date
            )
            db.add(final_report)
            reports.append(final_report)
    
    db.flush()
    print(f"   ✅ Created {len(reports)} grant reports")
    return reports


def generate_grant_budgets(db, org_id, grants):
    """Generate budget line items for awarded grants."""
    print("💵 Generating grant budgets...")
    budgets = []
    
    budget_categories = [
        {"name": "Personnel", "is_personnel": True, "pct": 0.45},
        {"name": "Fringe Benefits", "is_personnel": True, "pct": 0.10},
        {"name": "Travel", "is_personnel": False, "pct": 0.08},
        {"name": "Equipment", "is_personnel": False, "pct": 0.12},
        {"name": "Supplies", "is_personnel": False, "pct": 0.10},
        {"name": "Contractual", "is_personnel": False, "pct": 0.05},
        {"name": "Indirect Costs", "is_indirect": True, "pct": 0.10},
    ]
    
    awarded_grants = [g for g in grants if g.amount_awarded]
    
    for grant in awarded_grants:
        total_budget = float(grant.amount_awarded)
        
        for cat in budget_categories:
            budgeted = total_budget * cat["pct"]
            # Spent varies based on grant status
            if grant.status == "closed":
                spent = budgeted * random.uniform(0.85, 1.0)
            elif grant.status == "awarded":
                spent = budgeted * random.uniform(0.3, 0.7)
            else:
                spent = 0
            
            budget = GrantBudgets(
                id=uuid.uuid4(),
                grant_id=grant.id,
                organization_id=org_id,
                category=cat["name"],
                budgeted_amount=Decimal(str(round(budgeted, 2))),
                spent_amount=Decimal(str(round(spent, 2))),
                is_personnel=cat.get("is_personnel", False),
                is_indirect=cat.get("is_indirect", False)
            )
            db.add(budget)
            budgets.append(budget)
    
    db.flush()
    print(f"   ✅ Created {len(budgets)} grant budget line items")
    return budgets


def generate_grant_activities(db, grants):
    """Generate activity logs for grants."""
    print("📝 Generating grant activities...")
    activities = []
    
    activity_types = [
        "application_started", "research_completed", "draft_submitted",
        "internal_review", "revisions_made", "submitted", "follow_up_call",
        "site_visit", "notification_received", "contract_signed"
    ]
    
    for grant in grants:
        num_activities = random.randint(2, 8)
        
        for i in range(num_activities):
            activity_date = datetime.now() - timedelta(days=random.randint(1, 180))
            
            activity = GrantActivities(
                id=uuid.uuid4(),
                grant_id=grant.id,
                activity_type=random.choice(activity_types),
                description=f"Activity for {grant.name}",
                activity_date=activity_date
            )
            db.add(activity)
            activities.append(activity)
    
    db.flush()
    print(f"   ✅ Created {len(activities)} grant activities")
    return activities


# ============================================================
# MAIN EXECUTION
# ============================================================

def generate_all_data():
    """Generate all test data for financial analytics."""
    if not DB_AVAILABLE:
        print("\n❌ Database not available. Please check your imports and connection.")
        return 1
    
    print("\n" + "="*60)
    print("💰 FINANCIAL ANALYTICS - DATA GENERATION")
    print("="*60 + "\n")
    
    try:
        db = SessionLocal()
        org_id = uuid.UUID(ORGANIZATION_ID)
        
        # Verify organization exists
        org = db.query(Organizations).filter(Organizations.id == org_id).first()
        if not org:
            print(f"❌ Organization {ORGANIZATION_ID} not found!")
            print("   Please update ORGANIZATION_ID in this script.")
            return 1
        
        print(f"📍 Organization: {org.name}\n")
        
        # Generate all data
        categories = generate_expense_categories(db, org_id)
        programs = generate_programs(db, org_id)
        campaigns = generate_campaigns(db, org_id)
        donors = generate_donors(db, org_id)
        donations = generate_donations(db, org_id, donors, campaigns, programs)
        expenses = generate_expenses(db, org_id, categories, programs)
        pledges = generate_pledges(db, org_id, donors)
        recurring = generate_recurring_gifts(db, org_id, donors)
        grants = generate_grants(db, org_id, programs)
        reports = generate_grant_reports(db, org_id, grants)
        budgets = generate_grant_budgets(db, org_id, grants)
        activities = generate_grant_activities(db, grants)
        
        # Commit all changes
        db.commit()
        db.close()
        
        print("\n" + "="*60)
        print("✅ DATA GENERATION COMPLETE!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   • {len(donors)} donors")
        print(f"   • {len(donations)} donations")
        print(f"   • {len(campaigns)} campaigns")
        print(f"   • {len(programs)} programs")
        print(f"   • {len(categories)} expense categories")
        print(f"   • {len(expenses)} expense records")
        print(f"   • {len(pledges)} pledges")
        print(f"   • {len(recurring)} recurring gifts")
        print(f"   • {len(grants)} grants")
        print(f"   • {len(reports)} grant reports")
        print(f"   • {len(budgets)} grant budgets")
        print(f"   • {len(activities)} grant activities")
        
        print("\n🚀 Ready to test Financial Analytics APIs!")
        print("   Navigate to /financial-analytics/{organization_id}/...")
        
    except Exception as e:
        print(f"\n❌ Error generating data: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


def cleanup_financial_data():
    """Remove all generated financial test data."""
    if not DB_AVAILABLE:
        print("Database not available for cleanup")
        return
    
    print("\n⚠️  This will DELETE all financial data for the organization!")
    confirm = input("Type 'DELETE' to confirm: ")
    
    if confirm != "DELETE":
        print("Cleanup cancelled")
        return
    
    try:
        db = SessionLocal()
        org_id = uuid.UUID(ORGANIZATION_ID)
        
        # Delete in reverse order of dependencies
        print("🗑️  Deleting data...")
        
        db.query(GrantActivities).filter(
            GrantActivities.grant_id.in_(
                db.query(Grants.id).filter(Grants.organization_id == org_id)
            )
        ).delete(synchronize_session=False)
        
        db.query(GrantBudgets).filter(GrantBudgets.organization_id == org_id).delete()
        db.query(GrantReports).filter(GrantReports.organization_id == org_id).delete()
        db.query(Grants).filter(Grants.organization_id == org_id).delete()
        
        db.query(RecurringGifts).filter(RecurringGifts.organization_id == org_id).delete()
        
        db.query(PledgeInstallments).filter(
            PledgeInstallments.pledge_id.in_(
                db.query(Pledges.id).filter(Pledges.organization_id == org_id)
            )
        ).delete(synchronize_session=False)
        db.query(Pledges).filter(Pledges.organization_id == org_id).delete()
        
        db.query(Expenses).filter(Expenses.organization_id == org_id).delete()
        db.query(ExpenseCategories).filter(ExpenseCategories.organization_id == org_id).delete()
        
        db.query(DonationLines).filter(
            DonationLines.donation_id.in_(
                db.query(Donations.id).filter(Donations.organization_id == org_id)
            )
        ).delete(synchronize_session=False)
        db.query(Donations).filter(Donations.organization_id == org_id).delete()
        
        db.query(Campaigns).filter(Campaigns.organization_id == org_id).delete()
        db.query(Programs).filter(Programs.organization_id == org_id).delete()
        db.query(Donors).filter(Donors.organization_id == org_id).delete()
        
        db.commit()
        db.close()
        
        print("✅ All financial data deleted")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cleanup":
        cleanup_financial_data()
    else:
        sys.exit(generate_all_data())
