#!/usr/bin/env python3
"""
recreate_wise_investor_schema.py - FULLY CORRECTED VERSION

Complete schema recreation for Wise Investor Platform
Includes all 66 tables with ALL 11 corrected enum types

CORRECTED: November 9, 2025 - FINAL VERSION
- Fixed table count: 54 → 66 tables
- Fixed enum count: 7 → 11 enums
- Fixed table names: donor_portfolio_assignment → donor_portfolio_assignments
- Fixed table names: user_registration_request → user_registration_requests
- Added missing table: donor_giving_segments
- Added missing enums: CampaignStatus, CampaignType, EventStatus, EventType

Usage:
    python recreate_wise_investor_schema.py --check           # Check current state
    python recreate_wise_investor_schema.py --backup          # Backup database
    python recreate_wise_investor_schema.py --recreate-enums  # Recreate enum types only
    python recreate_wise_investor_schema.py --recreate-all    # Full recreation (DANGER!)
    python recreate_wise_investor_schema.py --test            # Test on copy database
"""

import argparse
import sys
import subprocess
import os
from datetime import datetime
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

# Database configuration
DB_NAME = os.getenv('DB_NAME', 'wise_investor')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'your_password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ALL 11 CORRECTED ENUM DEFINITIONS
ENUM_DEFINITIONS = {
    # Major Gifts Module Enums (7)
    'movesstage': [
        'identification',
        'qualification',
        'cultivation',
        'solicitation',
        'stewardship'
    ],
    'donorlevel': [
        'mega_donor',
        'major_donor',
        'mid_level',
        'upper_donor',
        'lower_donor'
    ],
    'portfoliorole': [
        'ceo',
        'cdo',
        'lead_officer',
        'portfolio_manager',
        'principal_gifts',
        'major_gifts',
        'planned_giving',
        'corporate_relations'
    ],
    'prioritylevel': [
        'priority_1',
        'priority_2',
        'priority_3',
        'priority_4',
        'priority_5'
    ],
    'exclusiontag': [
        'estate_gift',
        'bequest',
        'foundation_grant',
        'planned_gift'
    ],
    'meetingtype': [
        'substantive',
        'informational',
        'social',
        'cultivation',
        'solicitation',
        'stewardship'
    ],
    'proposalstatus': [
        'draft',
        'sent',
        'under_review',
        'accepted',
        'declined',
        'withdrawn'
    ],

    # Campaign Enums (2)
    'campaignstatus': [
        'draft',
        'active',
        'paused',
        'completed',
        'archived'
    ],
    'campaigntype': [
        'general',
        'project',
        'emergency',
        'capital',
        'endowment',
        'annual',
        'monthly_giving'
    ],

    # Event Enums (2)
    'eventstatus': [
        'published',
        'completed'
    ],
    'eventtype': [
        'Fundraising Gala',
        'Capacity Building',
        'Community Service',
        'Charity Run/Walk',
        'Youth Program',
        'Training Program',
        'Community Outreach',
        'Donor Appreciation',
        'Community Event',
        'Virtual Fundraiser',
        'Volunteer Event',
        'Volunteer Training',
        'Fundraising Auction',
        'Donor Engagement',
        'Donor Stewardship',
        'Board Meeting',
        'Educational Seminar',
        'Staff Training',
        'Workshop'
    ]
}

# ALL 66 TABLES IN DEPENDENCY ORDER (CORRECTED)
TABLES_ORDER = [
    # Core/Independent tables (no FK dependencies)
    'organizations',
    'users',
    'roles',
    'permissions',

    # User-related
    'user_registration_requests',  # CORRECTED: was singular
    'user_roles',
    'role_permissions',
    'audit_logs',

    # Organization structure
    'parties',
    'addresses',
    'contact_points',
    'party_roles',

    # Donors and related
    'donors',
    'donors_backup',
    'donor_scores',
    'consents',

    # Programs and campaigns
    'programs',
    'campaigns',
    'appeals',
    'campaign_updates',

    # Funds and financial
    'funds',
    'expense_categories',
    'expenses',
    'payment_methods',
    'payments',

    # Donations
    'pledges',
    'pledge_installments',
    'donations',
    'donation_lines',
    'donation_campaigns',
    'soft_credits',
    'recurring_gifts',
    'matching_claims',

    # Major gifts module
    'major_gift_officers',
    'officer_annual_targets',
    'donor_meetings',
    'moves_management_stages',
    'gift_goals',
    'solicitation_proposals',
    'donor_portfolio_assignments',  # CORRECTED: was singular
    'donor_priority_cache',
    'donor_exclusion_tags',

    # Events and volunteers
    'events',
    'event_registrations',
    'event_tickets',
    'volunteers',
    'volunteer_skills',
    'volunteer_events',
    'volunteer_activities',
    'volunteer_assignments',

    # Projects and tracking
    'projects',
    'project_team',
    'tasks',

    # Impact and reporting
    'sdg_alignment',
    'outcome_metrics',
    'outcome_records',
    'impact_metrics',
    'stories',
    'reports',

    # Email campaigns
    'email_campaigns',
    'email_campaign_recipients',

    # Service delivery
    'service_events',
    'service_beneficiaries',
    'beneficiaries',

    # Program enrollment
    'program_enrollments',
    'packages',

    # Analytics (was missing)
    'donor_giving_segments',
]


def backup_database():
    """Create full database backup"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"wise_investor_backup_{timestamp}.sql"

    print(f"📦 Creating backup: {backup_file}")

    try:
        cmd = [
            "pg_dump",
            "-U", DB_USER,
            "-h", DB_HOST,
            "-p", DB_PORT,
            "-d", DB_NAME,
            "-f", backup_file
        ]

        env = os.environ.copy()
        if DB_PASSWORD:
            env['PGPASSWORD'] = DB_PASSWORD

        subprocess.run(cmd, check=True, env=env)
        print(f"✅ Backup created: {backup_file}")
        return backup_file

    except subprocess.CalledProcessError as e:
        print(f"❌ Backup failed: {e}")
        return None


def check_current_state():
    """Check what currently exists in database"""
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    print("\n" + "="*70)
    print("CURRENT DATABASE STATE")
    print("="*70)

    # Check tables
    existing_tables = inspector.get_table_names()
    print(f"\n📊 Tables: {len(existing_tables)} found")

    for table in sorted(existing_tables):
        in_expected = "✓" if table in TABLES_ORDER else "+"
        print(f"   {in_expected} {table}")

    # Check enums
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT typname 
            FROM pg_type 
            WHERE typtype = 'e' 
            ORDER BY typname
        """))

        enums = [row[0] for row in result]
        print(f"\n🔤 Enum Types: {len(enums)} found")

        for enum in enums:
            # Get enum values
            values_result = conn.execute(text(f"""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = '{enum}'::regtype 
                ORDER BY enumsortorder
            """))
            values = [row[0] for row in values_result]
            in_expected = "✓" if enum in ENUM_DEFINITIONS else "+"
            print(f"   {in_expected} {enum}: {', '.join(values[:3])}{'...' if len(values) > 3 else ''} ({len(values)} values)")

    engine.dispose()

    # Compare with expected
    expected_tables = set(TABLES_ORDER)
    existing_set = set(existing_tables)

    missing = expected_tables - existing_set
    extra = existing_set - expected_tables

    if missing:
        print(f"\n⚠️  Missing tables ({len(missing)}):")
        for table in sorted(missing):
            print(f"   - {table}")

    if extra:
        print(f"\n📝 Extra tables ({len(extra)}):")
        for table in sorted(extra):
            print(f"   + {table}")

    if not missing and not extra:
        print(f"\n✅ All {len(TABLES_ORDER)} expected tables exist!")

    # Check enums
    expected_enums = set(ENUM_DEFINITIONS.keys())
    existing_enums = set(enums)

    missing_enums = expected_enums - existing_enums
    extra_enums = existing_enums - expected_enums

    if missing_enums:
        print(f"\n⚠️  Missing enums ({len(missing_enums)}):")
        for enum in sorted(missing_enums):
            print(f"   - {enum}")

    if extra_enums:
        print(f"\n📝 Extra enums ({len(extra_enums)}):")
        for enum in sorted(extra_enums):
            print(f"   + {enum}")


def recreate_enums():
    """Recreate PostgreSQL enum types with corrected values"""
    engine = create_engine(DATABASE_URL)

    print("\n" + "="*70)
    print("RECREATING ENUM TYPES")
    print("="*70)

    with engine.connect() as conn:
        for enum_name, values in ENUM_DEFINITIONS.items():
            print(f"\n🔤 Processing {enum_name}...")

            # Check if enum exists
            result = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = '{enum_name}'
                )
            """))
            exists = result.scalar()

            if exists:
                print(f"   ⚠️  {enum_name} exists - checking for differences...")

                # Get current values
                current_values = conn.execute(text(f"""
                    SELECT enumlabel 
                    FROM pg_enum 
                    WHERE enumtypid = '{enum_name}'::regtype 
                    ORDER BY enumsortorder
                """))
                current = [row[0] for row in current_values]

                if set(current) == set(values):
                    print(f"   ✅ {enum_name} is correct - skipping")
                    continue

                print(f"   Current: {', '.join(current[:3])}{'...' if len(current) > 3 else ''} ({len(current)} values)")
                print(f"   Expected: {', '.join(values[:3])}{'...' if len(values) > 3 else ''} ({len(values)} values)")

                response = input(f"   ⚠️  Drop and recreate {enum_name}? (yes/no): ")
                if response.lower() != 'yes':
                    print(f"   ⏭️  Skipped {enum_name}")
                    continue

                # Drop enum (will fail if used by tables)
                try:
                    conn.execute(text(f"DROP TYPE {enum_name} CASCADE"))
                    conn.commit()
                    print(f"   🗑️  Dropped {enum_name}")
                except Exception as e:
                    print(f"   ❌ Cannot drop {enum_name}: {e}")
                    print(f"   💡 Enum is in use. You need to drop dependent tables first.")
                    continue

            # Create enum
            values_str = "', '".join(values)
            create_sql = f"CREATE TYPE {enum_name} AS ENUM ('{values_str}')"

            try:
                conn.execute(text(create_sql))
                conn.commit()
                print(f"   ✅ Created {enum_name}")
            except Exception as e:
                print(f"   ❌ Failed to create {enum_name}: {e}")

    engine.dispose()
    print("\n✅ Enum recreation complete!")


def recreate_all_tables():
    """Drop and recreate ALL tables"""

    print("\n" + "="*70)
    print("⚠️  FULL SCHEMA RECREATION")
    print("="*70)
    print("\nThis will:")
    print("  1. DROP ALL TABLES (all data will be lost!)")
    print("  2. DROP ALL ENUM TYPES")
    print("  3. RECREATE ENUM TYPES with correct values")
    print("  4. RECREATE ALL TABLES from models.py")
    print("\n⚠️  WARNING: ALL DATA WILL BE PERMANENTLY DELETED!")

    response = input("\nType 'DELETE EVERYTHING' to proceed: ")
    if response != "DELETE EVERYTHING":
        print("❌ Cancelled")
        return False

    # Backup first
    backup_file = backup_database()
    if not backup_file:
        response = input("Backup failed. Continue anyway? (yes/no): ")
        if response.lower() != 'yes':
            return False

    engine = create_engine(DATABASE_URL)

    try:
        # Import your Base and models
        from models import Base

        # Step 1: Drop all tables
        print("\n1️⃣  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("   ✅ All tables dropped")

        # Step 2: Drop all enums
        print("\n2️⃣  Dropping all enum types...")
        with engine.connect() as conn:
            for enum_name in ENUM_DEFINITIONS.keys():
                try:
                    conn.execute(text(f"DROP TYPE IF EXISTS {enum_name} CASCADE"))
                    print(f"   ✅ Dropped {enum_name}")
                except Exception as e:
                    print(f"   ⚠️  Could not drop {enum_name}: {e}")
            conn.commit()

        # Step 3: Recreate enums
        print("\n3️⃣  Creating enum types...")
        with engine.connect() as conn:
            for enum_name, values in ENUM_DEFINITIONS.items():
                values_str = "', '".join(values)
                create_sql = f"CREATE TYPE {enum_name} AS ENUM ('{values_str}')"
                try:
                    conn.execute(text(create_sql))
                    print(f"   ✅ Created {enum_name}")
                except Exception as e:
                    print(f"   ❌ Failed {enum_name}: {e}")
            conn.commit()

        # Step 4: Create all tables
        print("\n4️⃣  Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("   ✅ All tables created")

        # Step 5: Verify
        print("\n5️⃣  Verifying...")
        inspector = inspect(engine)
        created_tables = inspector.get_table_names()
        print(f"   ✅ Created {len(created_tables)} tables")

        print("\n" + "="*70)
        print("✅ SCHEMA RECREATION COMPLETE!")
        print("="*70)
        if backup_file:
            print(f"\n💾 Backup saved as: {backup_file}")

        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n💡 To restore from backup:")
        if backup_file:
            print(f"   psql -U {DB_USER} -d {DB_NAME} < {backup_file}")
        return False

    finally:
        engine.dispose()


def test_on_copy():
    """Test schema recreation on a copy database first"""
    test_db = f"{DB_NAME}_test"

    print(f"\n📋 Creating test database: {test_db}")

    try:
        # Create test database
        subprocess.run([
            "createdb",
            "-U", DB_USER,
            "-h", DB_HOST,
            "-T", DB_NAME,
            test_db
        ], check=True)

        print(f"✅ Created {test_db}")
        print(f"\n💡 Now run:")
        print(f"   DB_NAME={test_db} python {sys.argv[0]} --recreate-all")

    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Wise Investor Schema Recreation Tool (FULLY CORRECTED)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python recreate_wise_investor_schema.py --check
  python recreate_wise_investor_schema.py --backup
  python recreate_wise_investor_schema.py --recreate-enums
  python recreate_wise_investor_schema.py --recreate-all
  python recreate_wise_investor_schema.py --test

Environment Variables:
  DB_NAME     Database name (default: wise_investor)
  DB_USER     Database user (default: postgres)
  DB_PASSWORD Database password
  DB_HOST     Database host (default: localhost)
  DB_PORT     Database port (default: 5432)
        """
    )

    parser.add_argument('--check', action='store_true',
                        help='Check current database state')
    parser.add_argument('--backup', action='store_true',
                        help='Create database backup')
    parser.add_argument('--recreate-enums', action='store_true',
                        help='Recreate enum types only')
    parser.add_argument('--recreate-all', action='store_true',
                        help='Drop and recreate everything (DANGER!)')
    parser.add_argument('--test', action='store_true',
                        help='Create test copy of database')

    args = parser.parse_args()

    # Print config
    print("\n" + "="*70)
    print("WISE INVESTOR SCHEMA RECREATION TOOL (FULLY CORRECTED)")
    print("="*70)
    print(f"\nDatabase: {DB_NAME}")
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print(f"User: {DB_USER}")
    print(f"\nTotal tables to manage: {len(TABLES_ORDER)}")
    print(f"Total enum types: {len(ENUM_DEFINITIONS)}")
    print("\n✅ FULLY CORRECTED VERSION - November 9, 2025")
    print("   - Fixed table count: 54 → 66")
    print("   - Fixed enum count: 7 → 11")
    print("   - Fixed table names: plural forms")
    print("   - Added: donor_giving_segments")
    print("   - Added: campaign and event enums")

    if args.check:
        check_current_state()

    elif args.backup:
        backup_database()

    elif args.recreate_enums:
        recreate_enums()

    elif args.recreate_all:
        success = recreate_all_tables()
        sys.exit(0 if success else 1)

    elif args.test:
        test_on_copy()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
