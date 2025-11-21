#!/usr/bin/env python3
"""
Populate Donor Priority Cache with Complete Data
=================================================
This script populates the donor_priority_cache table with all required fields
including opportunity_amount, current/last/two_years_ago totals, and priority levels.

This fixes the "float() argument must be a string or a real number, not 'NoneType'" error
in the opportunities endpoint.

Author: Ashwini
Date: November 2025
"""

import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, date
from decimal import Decimal
import uuid

# Database configuration
DB_CONFIG = {
    'dbname': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'host': 'localhost',
    'port': '5432'
}

# Target organization ID
TARGET_ORG_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'


def get_current_fiscal_year():
    """Get current fiscal year (July 1 - June 30)"""
    today = date.today()
    if today.month >= 7:
        return today.year
    else:
        return today.year - 1


def populate_priority_cache(org_id):
    """Populate donor_priority_cache with complete data"""
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        print("\n" + "=" * 70)
        print("POPULATING DONOR PRIORITY CACHE")
        print("=" * 70)
        print(f"Organization ID: {org_id}")
        
        # Get current fiscal year boundaries
        current_fy = get_current_fiscal_year()
        current_fy_start = date(current_fy, 7, 1)
        current_fy_end = date(current_fy + 1, 6, 30)
        
        last_fy_start = date(current_fy - 1, 7, 1)
        last_fy_end = date(current_fy, 6, 30)
        
        two_years_ago_start = date(current_fy - 2, 7, 1)
        two_years_ago_end = date(current_fy - 1, 6, 30)
        
        print(f"\nFiscal Year Periods:")
        print(f"  Current FY:    {current_fy_start} to {current_fy_end}")
        print(f"  Last FY:       {last_fy_start} to {last_fy_end}")
        print(f"  Two Years Ago: {two_years_ago_start} to {two_years_ago_end}")
        
        # Get all major donors with their giving history
        print("\n📊 Calculating donor priorities and opportunities...")
        
        cursor.execute("""
            WITH donor_giving AS (
                SELECT 
                    d.id as donor_id,
                    d.donor_level,
                    -- Current year total
                    COALESCE(SUM(CASE 
                        WHEN don.donation_date >= %s AND don.donation_date <= %s 
                        THEN don.amount ELSE 0 
                    END), 0) as current_year_total,
                    -- Last year total
                    COALESCE(SUM(CASE 
                        WHEN don.donation_date >= %s AND don.donation_date <= %s 
                        THEN don.amount ELSE 0 
                    END), 0) as last_year_total,
                    -- Two years ago total
                    COALESCE(SUM(CASE 
                        WHEN don.donation_date >= %s AND don.donation_date <= %s 
                        THEN don.amount ELSE 0 
                    END), 0) as two_years_ago_total,
                    -- Last gift date
                    MAX(don.donation_date) as last_gift_date,
                    -- Largest gift
                    MAX(don.amount) as largest_gift
                FROM donors d
                LEFT JOIN donations don ON d.id = don.donor_id 
                WHERE d.organization_id = %s
                    AND d.donor_level IN ('mega_donor', 'major_donor', 'mid_level')
                GROUP BY d.id, d.donor_level
            )
            SELECT 
                donor_id,
                donor_level,
                current_year_total,
                last_year_total,
                two_years_ago_total,
                last_gift_date,
                largest_gift
            FROM donor_giving
        """, (
            current_fy_start, current_fy_end,
            last_fy_start, last_fy_end,
            two_years_ago_start, two_years_ago_end,
            org_id
        ))
        
        donors_data = cursor.fetchall()
        print(f"   Found {len(donors_data)} major/mid-level donors")
        
        # Get major gift officers for assignment
        cursor.execute("""
            SELECT id FROM major_gift_officers
            WHERE organization_id = %s
        """, (org_id,))
        
        mgo_ids = [row[0] for row in cursor.fetchall()]
        print(f"   Found {len(mgo_ids)} major gift officers")
        
        # Delete existing cache
        cursor.execute("""
            DELETE FROM donor_priority_cache
            WHERE organization_id = %s
        """, (org_id,))
        print(f"   Cleared existing priority cache")
        
        # Build priority cache records
        cache_records = []
        priority_stats = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        import random
        
        for donor_id, donor_level, current_total, last_total, two_years_total, last_gift_date, largest_gift in donors_data:
            current_total = float(current_total) if current_total else 0.0
            last_total = float(last_total) if last_total else 0.0
            two_years_total = float(two_years_total) if two_years_total else 0.0
            largest_gift = float(largest_gift) if largest_gift else 0.0
            
            # Convert datetime to date if needed
            if last_gift_date and hasattr(last_gift_date, 'date'):
                last_gift_date = last_gift_date.date()
            
            # Determine priority level and opportunity amount
            if current_total == 0 and last_total > 0:
                # Priority 1: No gift this year, but gave last year
                priority_level = 'priority_1'
                opportunity_amount = last_total
                opportunity_basis = "Last year's gift amount"
            elif last_total > current_total and current_total > 0:
                # Priority 2: Last year > this year
                priority_level = 'priority_2'
                opportunity_amount = last_total - current_total
                opportunity_basis = "Gap between last year and current year"
            elif two_years_total > 0 and last_total == 0 and current_total == 0:
                # Priority 3: Gave 2 years ago, nothing since
                priority_level = 'priority_3'
                opportunity_amount = two_years_total * 0.5  # Conservative estimate
                opportunity_basis = "50% of two-year-ago gift"
            elif last_gift_date and (current_fy_start - last_gift_date).days > 730:
                # Priority 4: No gifts in 2+ years
                priority_level = 'priority_4'
                opportunity_amount = largest_gift * 0.3  # Very conservative
                opportunity_basis = "30% of largest historical gift"
            else:
                # Priority 5: Current year >= last year
                priority_level = 'priority_5'
                opportunity_amount = max(current_total, last_total) * 1.2  # 20% increase
                opportunity_basis = "20% increase on recent giving"
            
            priority_stats[int(priority_level.split('_')[1])] += 1
            
            # Assign to random officer if available
            assigned_officer_id = random.choice(mgo_ids) if mgo_ids else None
            
            cache_records.append((
                str(uuid.uuid4()),
                org_id,
                donor_id,
                priority_level,
                float(opportunity_amount),
                opportunity_basis,
                donor_level,
                float(current_total),
                float(last_total),
                float(two_years_total),
                last_gift_date,
                assigned_officer_id,
                True,  # is_current
                datetime.now(),
                date.today()
            ))
        
        # Batch insert
        execute_batch(cursor, """
            INSERT INTO donor_priority_cache (
                id, organization_id, donor_id, priority_level,
                opportunity_amount, opportunity_basis, current_donor_level,
                current_year_total, last_year_total, two_years_ago_total,
                last_gift_date, assigned_officer_id, is_current,
                created_at, calculation_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, cache_records)
        
        conn.commit()
        
        print(f"\n✅ Created {len(cache_records)} priority cache records")
        print("\n   Priority Distribution:")
        for priority, count in sorted(priority_stats.items()):
            print(f"      Priority {priority}: {count:>4} donors")
        
        # Show top opportunities by priority
        print("\n📋 Sample High-Priority Opportunities:")
        cursor.execute("""
            SELECT 
                dpc.priority_level,
                CONCAT(d.first_name, ' ', d.last_name) as donor_name,
                dpc.opportunity_amount,
                dpc.opportunity_basis
            FROM donor_priority_cache dpc
            JOIN donors d ON dpc.donor_id = d.id
            WHERE dpc.organization_id = %s
                AND dpc.priority_level IN ('priority_1', 'priority_2')
            ORDER BY dpc.priority_level, dpc.opportunity_amount DESC
            LIMIT 10
        """, (org_id,))
        
        for priority, name, amount, basis in cursor.fetchall():
            print(f"      {priority}: ${amount:,.2f} - {name} ({basis})")
        
        print("\n" + "=" * 70)
        print("✅ PRIORITY CACHE POPULATION COMPLETE!")
        print("=" * 70)
        print("\nThe /api/v1/major-gifts/opportunities endpoint should now work correctly.")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        cursor.close()
        conn.close()
        return False


def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("DONOR PRIORITY CACHE POPULATOR")
    print("=" * 70)
    
    confirm = input(f"\nPopulate priority cache for organization {TARGET_ORG_ID}? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Cancelled.")
        return
    
    success = populate_priority_cache(TARGET_ORG_ID)
    
    if success:
        print("\n🎉 Success! The opportunities endpoint should now work without errors.")
    else:
        print("\n❌ Failed. Check the error messages above.")


if __name__ == "__main__":
    main()
