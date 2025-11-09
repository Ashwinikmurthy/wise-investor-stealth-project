"""
TRUNCATE ALL TABLES - No Superuser Required
Works with regular user privileges
"""

import psycopg2

# ============================================================================
# DATABASE CONFIGURATION - UPDATE THESE VALUES
# ============================================================================

DB_CONFIG = {
    'dbname': 'organization_db3',
    'user': 'orguser3',
    'password': 'orgpassword3',
    'host': 'localhost',
    'port': 5432
}

def truncate_all_tables():
    """Truncate all tables without requiring superuser privileges"""
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("\n" + "="*80)
        print("⚠️  TRUNCATING ALL TABLES - THIS WILL DELETE ALL DATA")
        print("="*80)
        
        # Get table counts before truncation
        print("\n📊 Current record counts:")
        tables_to_check = [
            'organizations', 'users', 'donors', 'donations', 
            'campaigns', 'programs', 'funds', 'parties'
        ]
        
        for table in tables_to_check:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  {table:20s}: {count:,}")
            except:
                pass
        
        confirm = input("\n⚠️  Type 'YES' to confirm truncation: ")
        if confirm != 'YES':
            print("❌ Truncation cancelled")
            return
        
        print("\n🗑️  Truncating tables...")
        
        # Method: Individual truncation with CASCADE (no superuser required)
        # Order matters - children first, then parents
        tables_ordered = [
            # Level 1: No dependencies
            'donation_lines',
            'pledge_installments',
            'payments',
            'matching_claims',
            'soft_credits',
            
            # Level 2: Depend on Level 1
            'email_campaign_recipients',
            'event_registrations',
            'event_tickets',
            'program_enrollments',
            'project_team',
            'volunteer_assignments',
            'volunteer_activities',
            
            # Level 3: Transaction tables
            'donations',
            'pledges',
            'recurring_gifts',
            
            # Level 4: Relationship tables
            'moves_management_stages',
            'donor_portfolio_assignment',
            'donor_priority_cache',
            'donor_exclusion_tags',
            'donor_meetings',
            'donor_scores',
            'solicitation_proposals',
            'gift_goals',
            'officer_annual_targets',
            
            # Level 5: Contact and metadata
            'contact_points',
            'addresses',
            'consents',
            'payment_methods',
            'party_roles',
            
            # Level 6: Program and project related
            'service_events',
            'outcome_records',
            'outcome_metrics',
            'impact_metrics',
            'expenses',
            'tasks',
            'stories',
            'sdg_alignment',
            
            # Level 7: Events and campaigns
            'email_campaigns',
            'events',
            'donation_campaigns',
            'appeals',
            'packages',
            
            # Level 8: Support tables
            'volunteer_events',
            'volunteer_skills',
            'expense_categories',
            'reports',
            'user_roles',
            
            # Level 9: Projects
            'projects',
            
            # Level 10: Core entity tables
            'campaigns',
            'major_gift_officers',
            'beneficiaries',
            'donors',
            'parties',
            'funds',
            'programs',
            
            # Level 11: Users and auth
            'user_registration_requests',
            'users',
            
            # Level 12: Organizations (last - everything depends on this)
            'organizations'
        ]
        
        successful = 0
        failed = 0
        
        for table in tables_ordered:
            try:
                cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
                conn.commit()
                print(f"  ✅ {table}")
                successful += 1
            except psycopg2.errors.UndefinedTable:
                print(f"  ⚠️  {table} (table doesn't exist - skipping)")
            except Exception as e:
                print(f"  ❌ {table}: {str(e)[:60]}")
                failed += 1
                conn.rollback()
        
        print(f"\n📊 Truncation Summary:")
        print(f"  ✅ Successful: {successful}")
        if failed > 0:
            print(f"  ❌ Failed: {failed}")
        
        # Verify truncation
        print("\n📊 After truncation:")
        for table in tables_to_check:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                status = "✅" if count == 0 else "⚠️"
                print(f"  {status} {table:20s}: {count:,}")
            except:
                pass
        
        print("\n" + "="*80)
        print("✅ TRUNCATION COMPLETE - Database is ready for gendata")
        print("="*80)
        
        cur.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection Error: {e}")
        print("\nCheck your database credentials in DB_CONFIG")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════════════════╗
    ║           TRUNCATE ALL TABLES (No Superuser Required)                ║
    ║                                                                      ║
    ║  ⚠️  WARNING: This will DELETE ALL DATA from your database!         ║
    ║                                                                      ║
    ║  This version works with regular user privileges.                   ║
    ║  No superuser access needed!                                        ║
    ║                                                                      ║
    ║  Before running, update DB_CONFIG with your credentials             ║
    ╚══════════════════════════════════════════════════════════════════════╝
    """)
    
    truncate_all_tables()
