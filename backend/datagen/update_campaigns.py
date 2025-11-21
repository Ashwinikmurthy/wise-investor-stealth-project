#!/usr/bin/env python3
"""
Script to update campaigns to be public and active.
Updates the status and is_public columns in the campaigns table.
"""

import psycopg2
from psycopg2 import sql
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration - update these or use environment variables
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "organization_db4"),
    "user": os.getenv("DB_USER", "orguser4"),
    "password": os.getenv("DB_PASSWORD", "orgpassword4")
}


def get_db_connection():
    """Create and return a database connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        raise


def list_campaigns(conn):
    """List all campaigns with their current status."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, name, status, is_public, is_featured, created_at
            FROM campaigns
            ORDER BY created_at DESC
        """)
        campaigns = cur.fetchall()
        
        print("\n" + "=" * 80)
        print("CURRENT CAMPAIGNS")
        print("=" * 80)
        print(f"{'Name':<30} {'Status':<12} {'Public':<8} {'Featured':<10}")
        print("-" * 80)
        
        for campaign in campaigns:
            id_, name, status, is_public, is_featured, created_at = campaign
            print(f"{name[:29]:<30} {status or 'N/A':<12} {str(is_public):<8} {str(is_featured):<10}")
        
        print("=" * 80)
        print(f"Total campaigns: {len(campaigns)}\n")
        
        return campaigns


def update_all_campaigns_public_active(conn):
    """Update ALL campaigns to be public and active."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE campaigns
            SET 
                status = 'active',
                is_public = true,
                is_featured = true,
                updated_at = %s
            RETURNING id, name
        """, (datetime.utcnow(),))
        
        updated = cur.fetchall()
        conn.commit()
        
        print(f"\n✅ Updated {len(updated)} campaigns to public and active:")
        for id_, name in updated:
            print(f"   - {name}")
        
        return updated


def update_campaigns_by_limit(conn, limit=5):
    """Update a limited number of campaigns to be public and active."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE campaigns
            SET 
                status = 'active',
                is_public = true,
                is_featured = true,
                updated_at = %s
            WHERE id IN (
                SELECT id FROM campaigns 
                ORDER BY created_at DESC 
                LIMIT %s
            )
            RETURNING id, name
        """, (datetime.utcnow(), limit))
        
        updated = cur.fetchall()
        conn.commit()
        
        print(f"\n✅ Updated {len(updated)} campaigns to public and active:")
        for id_, name in updated:
            print(f"   - {name}")
        
        return updated


def update_campaigns_by_ids(conn, campaign_ids: list):
    """Update specific campaigns by their IDs."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE campaigns
            SET 
                status = 'active',
                is_public = true,
                is_featured = true,
                updated_at = %s
            WHERE id = ANY(%s)
            RETURNING id, name
        """, (datetime.utcnow(), campaign_ids))
        
        updated = cur.fetchall()
        conn.commit()
        
        print(f"\n✅ Updated {len(updated)} campaigns to public and active:")
        for id_, name in updated:
            print(f"   - {name}")
        
        return updated


def check_enum_values(conn):
    """Check valid values for campaignstatus enum."""
    with conn.cursor() as cur:
        cur.execute("SELECT enum_range(NULL::campaignstatus)")
        result = cur.fetchone()
        print(f"\nValid campaign status values: {result[0]}")
        return result[0]


def main():
    """Main function to run the campaign update."""
    print("\n" + "=" * 80)
    print("CAMPAIGN UPDATE SCRIPT")
    print("=" * 80)
    
    try:
        conn = get_db_connection()
        print(f"✅ Connected to database: {DB_CONFIG['database']}")
        
        # Check valid enum values
        check_enum_values(conn)
        
        # List current campaigns
        campaigns = list_campaigns(conn)
        
        if not campaigns:
            print("No campaigns found in database.")
            return
        
        # Ask user what to do
        print("\nOptions:")
        print("1. Update ALL campaigns to public and active")
        print("2. Update first N campaigns (by creation date)")
        print("3. Exit without changes")
        
        choice = input("\nSelect option (1/2/3): ").strip()
        
        if choice == "1":
            update_all_campaigns_public_active(conn)
        elif choice == "2":
            limit = int(input("How many campaigns to update? "))
            update_campaigns_by_limit(conn, limit)
        else:
            print("No changes made.")
            return
        
        # Show updated campaigns
        print("\n--- AFTER UPDATE ---")
        list_campaigns(conn)
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("Database connection closed.")


if __name__ == "__main__":
    main()
