"""
Update Donor Types Script - CORRECTED VERSION
Uses 'id' column (not 'donor_id')
"""

import psycopg2
from psycopg2 import sql
import random
from datetime import datetime

# Database connection parameters
DB_CONFIG = {
    'host': 'localhost',
    'database': 'organization_db4',
    'user': 'orguser4',
    'password': 'orgpassword4',
    'port': 5432
}

ORGANIZATION_ID = 'cc5da00c-4881-415f-88e5-a343ed4755e8'

# Distribution percentages (should add up to 100%)
DISTRIBUTION = {
    'individual': 0.70,   # 70%
    'corporate': 0.15,    # 15%
    'foundation': 0.15    # 15%
}


def update_using_cte(conn, organization_id, dry_run=True):
    """
    Update using CTEs directly in SQL (most reliable approach)
    CORRECTED: Uses 'id' column instead of 'donor_id'
    """
    cursor = conn.cursor()
    
    try:
        print("Using CTE-based approach (most reliable)...")
        
        # Count nulls first
        cursor.execute("""
            SELECT COUNT(*)
            FROM donors
            WHERE organization_id = %s
            AND donor_type IS NULL
        """, (organization_id,))
        
        total_null = cursor.fetchone()[0]
        print(f"Found {total_null} donors with NULL donor_type")
        
        if total_null == 0:
            print("No donors to update!")
            return
        
        individual_count = int(total_null * 0.70)
        corporate_count = int(total_null * 0.15)
        
        print(f"\nPlanned distribution:")
        print(f"  Individual: {individual_count} (~70%)")
        print(f"  Corporate:  {corporate_count} (~15%)")
        print(f"  Foundation: {total_null - individual_count - corporate_count} (~15%)")
        
        if dry_run:
            print("\n*** DRY RUN MODE - No changes will be committed ***")
            conn.rollback()
            return
        
        print("\n*** LIVE MODE - Updating database ***")
        
        # Update to individual
        cursor.execute("""
            WITH null_donors AS (
                SELECT id
                FROM donors
                WHERE organization_id = %s
                AND donor_type IS NULL
                ORDER BY RANDOM()
                LIMIT %s
            )
            UPDATE donors
            SET donor_type = 'individual',
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (SELECT id FROM null_donors)
        """, (organization_id, individual_count))
        print(f"Updated {cursor.rowcount} donors to 'individual'")
        
        # Update to corporate
        cursor.execute("""
            WITH null_donors AS (
                SELECT id
                FROM donors
                WHERE organization_id = %s
                AND donor_type IS NULL
                ORDER BY RANDOM()
                LIMIT %s
            )
            UPDATE donors
            SET donor_type = 'corporate',
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (SELECT id FROM null_donors)
        """, (organization_id, corporate_count))
        print(f"Updated {cursor.rowcount} donors to 'corporate'")
        
        # Update remaining to foundation
        cursor.execute("""
            UPDATE donors
            SET donor_type = 'foundation',
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_id = %s
            AND donor_type IS NULL
        """, (organization_id,))
        print(f"Updated {cursor.rowcount} donors to 'foundation'")
        
        conn.commit()
        print("\nChanges committed successfully!")
        
        # Verify
        cursor.execute("""
            SELECT 
                donor_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM donors
            WHERE organization_id = %s
            GROUP BY donor_type
            ORDER BY count DESC
        """, (organization_id,))
        
        results = cursor.fetchall()
        print("\nFinal distribution:")
        for donor_type, count, percentage in results:
            print(f"  {donor_type or 'NULL'}: {count} ({percentage}%)")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()


def update_donor_types_in_clause(conn, organization_id, dry_run=True):
    """
    Update NULL donor types using IN clause
    CORRECTED: Uses 'id' column instead of 'donor_id'
    """
    cursor = conn.cursor()
    
    try:
        # Get all donors with NULL type
        cursor.execute("""
            SELECT id::text
            FROM donors
            WHERE organization_id = %s
            AND donor_type IS NULL
        """, (organization_id,))
        
        null_donors = [row[0] for row in cursor.fetchall()]
        total_null = len(null_donors)
        
        print(f"Found {total_null} donors with NULL donor_type")
        
        if total_null == 0:
            print("No donors to update!")
            return
        
        # Shuffle donors randomly
        random.shuffle(null_donors)
        
        # Calculate distribution
        individual_count = int(total_null * DISTRIBUTION['individual'])
        corporate_count = int(total_null * DISTRIBUTION['corporate'])
        foundation_count = total_null - individual_count - corporate_count
        
        print(f"\nPlanned distribution:")
        print(f"  Individual: {individual_count} ({individual_count/total_null*100:.1f}%)")
        print(f"  Corporate:  {corporate_count} ({corporate_count/total_null*100:.1f}%)")
        print(f"  Foundation: {foundation_count} ({foundation_count/total_null*100:.1f}%)")
        
        # Split donors into groups
        individual_donors = null_donors[:individual_count]
        corporate_donors = null_donors[individual_count:individual_count + corporate_count]
        foundation_donors = null_donors[individual_count + corporate_count:]
        
        if dry_run:
            print("\n*** DRY RUN MODE - No changes will be committed ***")
        else:
            print("\n*** LIVE MODE - Updating database ***")
        
        # Update using batched IN clauses
        batch_size = 1000
        
        # Update individual donors
        if individual_donors:
            updated = 0
            for i in range(0, len(individual_donors), batch_size):
                batch = individual_donors[i:i + batch_size]
                placeholders = ','.join(['%s'] * len(batch))
                query = f"""
                    UPDATE donors
                    SET donor_type = 'individual',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id::text IN ({placeholders})
                """
                cursor.execute(query, batch)
                updated += cursor.rowcount
            print(f"Updated {updated} donors to 'individual'")
        
        # Update corporate donors
        if corporate_donors:
            updated = 0
            for i in range(0, len(corporate_donors), batch_size):
                batch = corporate_donors[i:i + batch_size]
                placeholders = ','.join(['%s'] * len(batch))
                query = f"""
                    UPDATE donors
                    SET donor_type = 'corporate',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id::text IN ({placeholders})
                """
                cursor.execute(query, batch)
                updated += cursor.rowcount
            print(f"Updated {updated} donors to 'corporate'")
        
        # Update foundation donors
        if foundation_donors:
            updated = 0
            for i in range(0, len(foundation_donors), batch_size):
                batch = foundation_donors[i:i + batch_size]
                placeholders = ','.join(['%s'] * len(batch))
                query = f"""
                    UPDATE donors
                    SET donor_type = 'foundation',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id::text IN ({placeholders})
                """
                cursor.execute(query, batch)
                updated += cursor.rowcount
            print(f"Updated {updated} donors to 'foundation'")
        
        if not dry_run:
            conn.commit()
            print("\nChanges committed successfully!")
        else:
            conn.rollback()
            print("\nRolled back changes (dry run mode)")
        
        # Verify results
        print("\nVerifying distribution:")
        cursor.execute("""
            SELECT 
                donor_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM donors
            WHERE organization_id = %s
            GROUP BY donor_type
            ORDER BY count DESC
        """, (organization_id,))
        
        results = cursor.fetchall()
        print("\nFinal distribution:")
        for donor_type, count, percentage in results:
            print(f"  {donor_type or 'NULL'}: {count} ({percentage}%)")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()


def simple_update_all_to_type(conn, organization_id, donor_type='individual', dry_run=True):
    """
    Simplest approach: Set all NULL to a single type
    CORRECTED: Uses 'id' column instead of 'donor_id'
    """
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT COUNT(*)
            FROM donors
            WHERE organization_id = %s
            AND donor_type IS NULL
        """, (organization_id,))
        
        null_count = cursor.fetchone()[0]
        print(f"Found {null_count} donors with NULL donor_type")
        
        if null_count == 0:
            print("No donors to update!")
            return
        
        if dry_run:
            print(f"\n*** DRY RUN MODE - Would update {null_count} donors to '{donor_type}' ***")
        else:
            print(f"\n*** LIVE MODE - Updating {null_count} donors to '{donor_type}' ***")
            
            cursor.execute("""
                UPDATE donors
                SET donor_type = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE organization_id = %s
                AND donor_type IS NULL
            """, (donor_type, organization_id))
            
            print(f"Updated {cursor.rowcount} donors")
            conn.commit()
            print("Changes committed successfully!")
        
        cursor.execute("""
            SELECT 
                donor_type,
                COUNT(*) as count
            FROM donors
            WHERE organization_id = %s
            GROUP BY donor_type
            ORDER BY count DESC
        """, (organization_id,))
        
        results = cursor.fetchall()
        print("\nFinal distribution:")
        for donor_type_result, count in results:
            print(f"  {donor_type_result or 'NULL'}: {count}")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()


if __name__ == "__main__":
    import sys
    
    print("=" * 70)
    print("Donor Type Update Script - CORRECTED VERSION")
    print("Uses 'id' column (not 'donor_id')")
    print("=" * 70)
    
    # Connect to database
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Database connected successfully\n")
        
        # RECOMMENDED: Use CTE-based approach (most reliable)
        print("\n--- RECOMMENDED METHOD: CTE-Based Update ---")
        update_using_cte(conn, ORGANIZATION_ID, dry_run=True)
        
        # Uncomment to run for real:
        update_using_cte(conn, ORGANIZATION_ID, dry_run=False)
        
        # ALTERNATIVE 1: Python-based with IN clause
        # print("\n--- ALTERNATIVE 1: Python IN Clause ---")
        # update_donor_types_in_clause(conn, ORGANIZATION_ID, dry_run=True)
        
        # ALTERNATIVE 2: Simple single type update
        # print("\n--- ALTERNATIVE 2: Simple Update ---")
        # simple_update_all_to_type(conn, ORGANIZATION_ID, donor_type='individual', dry_run=True)
        
        conn.close()
        print("\nDatabase connection closed")
        
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
