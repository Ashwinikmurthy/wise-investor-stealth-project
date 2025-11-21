"""
Create Organization Script
===========================
Utility script to create organizations in the Wise Investor database
"""

import uuid
import psycopg2
import psycopg2.extras
from datetime import datetime
import sys

# Register UUID adapter for psycopg2
psycopg2.extras.register_uuid()

# Database connection parameters
DB_CONFIG = {
    'dbname': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'host': 'localhost',
    'port': '5432'
}


def create_organization():
    """Create a new organization"""
    print("\n" + "="*70)
    print("CREATE NEW ORGANIZATION")
    print("="*70)
    
    # Get organization details
    org_name = input("\nOrganization name: ").strip()
    if not org_name:
        print("✗ Organization name is required!")
        return None
    
    ein = input("EIN (Tax ID, optional): ").strip() or None
    
    print("\nMission statement (optional, or press Enter for default):")
    mission = input("> ").strip()
    if not mission:
        mission = f"{org_name} is dedicated to making a positive impact in our community through innovative programs and services."
    
    # Address details
    print("\nAddress Information:")
    address = input("  Street address (optional): ").strip() or None
    city = input("  City (default: New York): ").strip() or "New York"
    state = input("  State (default: NY): ").strip() or "NY"
    postal_code = input("  Postal code (optional): ").strip() or None
    country = input("  Country (default: USA): ").strip() or "USA"
    
    # Contact details
    print("\nContact Information:")
    email = input("  Email (optional): ").strip() or None
    phone = input("  Phone (optional): ").strip() or None
    website = input("  Website (optional): ").strip() or None
    
    # Fiscal details
    print("\nFiscal Information:")
    fiscal_year_end = input("  Fiscal year end (MM-DD, default: 12-31): ").strip() or "12-31"
    annual_budget = input("  Annual budget (optional, e.g., 1000000): ").strip()
    annual_budget = float(annual_budget) if annual_budget else None
    
    # Founded date
    founded_input = input("  Founded year (optional, e.g., 2020): ").strip()
    if founded_input:
        founded_date = datetime(int(founded_input), 1, 1).date()
    else:
        founded_date = None
    
    # Confirm
    print("\n" + "="*70)
    print("ORGANIZATION DETAILS")
    print("="*70)
    print(f"  Name: {org_name}")
    if ein:
        print(f"  EIN: {ein}")
    print(f"  Mission: {mission}")
    print(f"  Location: {city}, {state}, {country}")
    if email:
        print(f"  Email: {email}")
    if phone:
        print(f"  Phone: {phone}")
    print("="*70)
    
    confirm = input("\nCreate this organization? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("\nCancelled.")
        return None
    
    # Create organization
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        org_id = str(uuid.uuid4())  # Convert UUID to string
        
        cursor.execute("""
            INSERT INTO organizations (
                id, name, ein, mission, founded_date,
                address, city, state, country, postal_code,
                phone, email, website, is_active,
                fiscal_year_end, annual_budget,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            org_id,  # Now it's a string
            org_name,
            ein,
            mission,
            founded_date,
            address,
            city,
            state,
            country,
            postal_code,
            phone,
            email,
            website,
            True,  # is_active
            fiscal_year_end,
            annual_budget,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        
        print("\n" + "="*70)
        print("✓ ORGANIZATION CREATED SUCCESSFULLY!")
        print("="*70)
        print(f"\n  Organization ID: {org_id}")
        print(f"  Name: {org_name}")
        print("\nYou can now use this organization ID to generate analytics data.")
        print(f"\nRun: python generate_comprehensive_analytics_data.py")
        print("="*70 + "\n")
        
        cursor.close()
        conn.close()
        
        return org_id
        
    except Exception as e:
        print(f"\n✗ Error creating organization: {e}")
        import traceback
        traceback.print_exc()
        return None


def list_organizations():
    """List all organizations"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, name, city, state, email, is_active, created_at
            FROM organizations
            ORDER BY created_at DESC
        """)
        
        orgs = cursor.fetchall()
        
        if not orgs:
            print("\n⚠️  No organizations found in database.")
            return
        
        print("\n" + "="*70)
        print("EXISTING ORGANIZATIONS")
        print("="*70)
        
        for i, (org_id, name, city, state, email, is_active, created_at) in enumerate(orgs, 1):
            status = "✓ Active" if is_active else "✗ Inactive"
            print(f"\n{i}. {name}")
            print(f"   ID: {org_id}")
            print(f"   Location: {city}, {state}")
            if email:
                print(f"   Email: {email}")
            print(f"   Status: {status}")
            print(f"   Created: {created_at.strftime('%Y-%m-%d')}")
        
        print("\n" + "="*70 + "\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error listing organizations: {e}")


def delete_organization():
    """Delete an organization (use with caution!)"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name FROM organizations ORDER BY created_at DESC")
        orgs = cursor.fetchall()
        
        if not orgs:
            print("\n⚠️  No organizations found to delete.")
            cursor.close()
            conn.close()
            return
        
        print("\n" + "="*70)
        print("SELECT ORGANIZATION TO DELETE")
        print("="*70)
        
        for i, (org_id, name) in enumerate(orgs, 1):
            print(f"  {i}. {name} ({org_id})")
        
        choice = input(f"\nSelect organization number to delete (1-{len(orgs)}, or 0 to cancel): ").strip()
        
        if not choice or int(choice) == 0:
            print("\nCancelled.")
            cursor.close()
            conn.close()
            return
        
        org_id, org_name = orgs[int(choice) - 1]
        
        print(f"\n⚠️  WARNING: This will permanently delete '{org_name}' and ALL associated data!")
        confirm = input("Type the organization name to confirm deletion: ").strip()
        
        if confirm != org_name:
            print("\n✗ Name doesn't match. Cancelled.")
            cursor.close()
            conn.close()
            return
        
        double_confirm = input("Are you absolutely sure? (yes/no): ").strip().lower()
        
        if double_confirm != 'yes':
            print("\nCancelled.")
            cursor.close()
            conn.close()
            return
        
        # Delete organization (cascade will handle related records)
        cursor.execute("DELETE FROM organizations WHERE id = %s", (org_id,))
        conn.commit()
        
        print(f"\n✓ Organization '{org_name}' has been deleted.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error deleting organization: {e}")


def main():
    """Main menu"""
    print("\n" + "="*70)
    print("WISE INVESTOR - ORGANIZATION MANAGEMENT")
    print("="*70)
    print("\nOptions:")
    print("  1. Create new organization")
    print("  2. List all organizations")
    print("  3. Delete organization")
    print("  0. Exit")
    print("="*70)
    
    choice = input("\nSelect option: ").strip()
    
    if choice == '1':
        create_organization()
    elif choice == '2':
        list_organizations()
    elif choice == '3':
        delete_organization()
    elif choice == '0':
        print("\nGoodbye!")
        sys.exit(0)
    else:
        print("\n✗ Invalid option")
    
    # Ask if user wants to continue
    continue_choice = input("\nWould you like to perform another action? (yes/no): ").strip().lower()
    if continue_choice == 'yes':
        main()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
