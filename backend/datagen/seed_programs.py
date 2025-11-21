#!/usr/bin/env python3
"""
Seed Script for Program Impact Stats
Creates sample impact metrics for demonstration
"""

import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "port":  "5432",
    "database":"organization_db4",
    "user":  "orguser4",
    "password":  "orgpassword4"
}

# Sample impact data templates
IMPACT_TEMPLATES = [
    # Food Security
    {
        "category": "food_security",
        "metric_name": "People Fed",
        "metric_unit": "people",
        "display_label": "individuals received nutritious meals",
        "icon_name": "utensils",
        "is_featured": True,
        "value_range": (500, 5000),
        "target_multiplier": 1.2
    },
    {
        "category": "food_security",
        "metric_name": "Meals Served",
        "metric_unit": "meals",
        "display_label": "hot meals served to families",
        "icon_name": "utensils",
        "is_featured": True,
        "value_range": (1000, 15000),
        "target_multiplier": 1.3
    },
    # Education
    {
        "category": "education",
        "metric_name": "Students Educated",
        "metric_unit": "students",
        "display_label": "students received educational support",
        "icon_name": "graduation-cap",
        "is_featured": True,
        "value_range": (100, 2000),
        "target_multiplier": 1.25
    },
    {
        "category": "education",
        "metric_name": "Scholarships Awarded",
        "metric_unit": "scholarships",
        "display_label": "scholarships awarded to deserving students",
        "icon_name": "graduation-cap",
        "is_featured": False,
        "value_range": (20, 200),
        "target_multiplier": 1.5
    },
    # Healthcare
    {
        "category": "healthcare",
        "metric_name": "Patients Treated",
        "metric_unit": "patients",
        "display_label": "patients received medical care",
        "icon_name": "heart-pulse",
        "is_featured": True,
        "value_range": (200, 3000),
        "target_multiplier": 1.2
    },
    {
        "category": "healthcare",
        "metric_name": "Health Checkups",
        "metric_unit": "checkups",
        "display_label": "free health checkups provided",
        "icon_name": "heart-pulse",
        "is_featured": False,
        "value_range": (300, 2000),
        "target_multiplier": 1.3
    },
    # Housing
    {
        "category": "housing",
        "metric_name": "Families Housed",
        "metric_unit": "families",
        "display_label": "families found stable housing",
        "icon_name": "home",
        "is_featured": True,
        "value_range": (50, 500),
        "target_multiplier": 1.4
    },
    # Employment
    {
        "category": "employment",
        "metric_name": "Jobs Created",
        "metric_unit": "jobs",
        "display_label": "jobs created in the community",
        "icon_name": "briefcase",
        "is_featured": True,
        "value_range": (30, 300),
        "target_multiplier": 1.5
    },
    {
        "category": "employment",
        "metric_name": "People Trained",
        "metric_unit": "people",
        "display_label": "individuals received job training",
        "icon_name": "briefcase",
        "is_featured": False,
        "value_range": (100, 1000),
        "target_multiplier": 1.3
    },
    # Environment
    {
        "category": "environment",
        "metric_name": "Trees Planted",
        "metric_unit": "trees",
        "display_label": "trees planted for a greener future",
        "icon_name": "leaf",
        "is_featured": False,
        "value_range": (500, 10000),
        "target_multiplier": 1.2
    },
    # Community
    {
        "category": "community",
        "metric_name": "Volunteers Engaged",
        "metric_unit": "volunteers",
        "display_label": "community volunteers mobilized",
        "icon_name": "users",
        "is_featured": False,
        "value_range": (50, 500),
        "target_multiplier": 1.4
    },
    # Children
    {
        "category": "children",
        "metric_name": "Children Supported",
        "metric_unit": "children",
        "display_label": "children received support and care",
        "icon_name": "baby",
        "is_featured": True,
        "value_range": (100, 2000),
        "target_multiplier": 1.25
    },
]

# Program type to impact category mapping
PROGRAM_CATEGORY_MAP = {
    "food_bank": ["food_security"],
    "education": ["education"],
    "healthcare": ["healthcare"],
    "housing": ["housing"],
    "employment": ["employment"],
    "environment": ["environment"],
    "community": ["community"],
    "youth": ["children", "education"],
    "senior": ["elderly", "healthcare"],
    "general": ["community", "financial"],
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_programs(conn, organization_id):
    """Get all programs for an organization"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, name, program_type, target_beneficiaries, current_beneficiaries
            FROM programs
            WHERE organization_id = %s AND status = 'active'
        """, (organization_id,))
        return cur.fetchall()


def create_impact_stats_table(conn):
    """Create the program_impact_stats table if it doesn't exist"""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS program_impact_stats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                metric_name VARCHAR(255) NOT NULL,
                metric_value INTEGER NOT NULL DEFAULT 0,
                metric_unit VARCHAR(100) DEFAULT 'people',
                display_label VARCHAR(255),
                icon_name VARCHAR(50),
                display_order INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT FALSE,
                is_public BOOLEAN DEFAULT TRUE,
                period_start DATE,
                period_end DATE,
                period_type VARCHAR(20),
                target_value INTEGER,
                description TEXT,
                methodology TEXT,
                data_source VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID,
                updated_by UUID
            );
            
            CREATE INDEX IF NOT EXISTS idx_impact_stats_org ON program_impact_stats(organization_id);
            CREATE INDEX IF NOT EXISTS idx_impact_stats_program ON program_impact_stats(program_id);
            CREATE INDEX IF NOT EXISTS idx_impact_stats_featured ON program_impact_stats(organization_id, is_featured) WHERE is_featured = TRUE;
        """)
        conn.commit()
        print("✅ Created program_impact_stats table")


def seed_impact_stats(conn, organization_id, user_id=None):
    """Seed impact stats for all programs in an organization"""
    import random
    
    programs = get_programs(conn, organization_id)
    
    if not programs:
        print("❌ No active programs found for this organization")
        return
    
    print(f"Found {len(programs)} active programs")
    
    stats_to_insert = []
    display_order = 0
    
    for program in programs:
        program_id, program_name, program_type, target_benef, current_benef = program
        
        # Determine which impact templates to use based on program type
        program_type_lower = (program_type or "general").lower()
        
        # Find matching categories
        matching_categories = []
        for key, categories in PROGRAM_CATEGORY_MAP.items():
            if key in program_type_lower:
                matching_categories.extend(categories)
        
        if not matching_categories:
            matching_categories = ["community"]  # Default
        
        # Get templates for these categories
        templates = [t for t in IMPACT_TEMPLATES if t["category"] in matching_categories]
        
        if not templates:
            templates = random.sample(IMPACT_TEMPLATES, min(2, len(IMPACT_TEMPLATES)))
        
        # Create 1-3 impact stats per program
        num_stats = min(len(templates), random.randint(1, 3))
        selected_templates = random.sample(templates, num_stats)
        
        for template in selected_templates:
            value = random.randint(template["value_range"][0], template["value_range"][1])
            target = int(value * template["target_multiplier"])
            
            stats_to_insert.append((
                str(uuid.uuid4()),
                str(organization_id),
                str(program_id),
                template["category"],
                template["metric_name"],
                value,
                template["metric_unit"],
                template["display_label"],
                template["icon_name"],
                display_order,
                template["is_featured"],
                True,  # is_public
                "all_time",  # period_type
                target,
                f"Impact from {program_name}",
                str(user_id) if user_id else None
            ))
            display_order += 1
    
    # Insert all stats
    with conn.cursor() as cur:
        execute_values(cur, """
            INSERT INTO program_impact_stats 
            (id, organization_id, program_id, category, metric_name, metric_value, 
             metric_unit, display_label, icon_name, display_order, is_featured, 
             is_public, period_type, target_value, description, created_by)
            VALUES %s
        """, stats_to_insert)
        conn.commit()
    
    print(f"✅ Created {len(stats_to_insert)} impact stats")
    
    # Print summary
    print("\n📊 Impact Stats Summary:")
    print("-" * 60)
    for stat in stats_to_insert[:10]:  # Show first 10
        print(f"  • {stat[4]}: {stat[5]:,} {stat[6]} ({stat[3]})")
    if len(stats_to_insert) > 10:
        print(f"  ... and {len(stats_to_insert) - 10} more")


def list_impact_stats(conn, organization_id):
    """List all impact stats for an organization"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 
                pis.metric_name, 
                pis.metric_value, 
                pis.metric_unit,
                pis.category,
                pis.is_featured,
                p.name as program_name
            FROM program_impact_stats pis
            JOIN programs p ON pis.program_id = p.id
            WHERE pis.organization_id = %s
            ORDER BY pis.is_featured DESC, pis.metric_value DESC
        """, (organization_id,))
        
        stats = cur.fetchall()
        
        print(f"\n📊 Impact Stats for Organization ({len(stats)} total):")
        print("-" * 80)
        print(f"{'Metric':<25} {'Value':>10} {'Unit':<15} {'Category':<15} {'Featured':<10}")
        print("-" * 80)
        
        for stat in stats:
            featured = "⭐ Yes" if stat[4] else "No"
            print(f"{stat[0]:<25} {stat[1]:>10,} {stat[2]:<15} {stat[3]:<15} {featured:<10}")
        
        print("-" * 80)


def main():
    print("\n" + "=" * 60)
    print("PROGRAM IMPACT STATS SEEDER")
    print("=" * 60)
    
    try:
        conn = get_connection()
        print(f"✅ Connected to database: {DB_CONFIG['database']}")
        
        # Create table if needed
        create_impact_stats_table(conn)
        
        # Get organization ID
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM organizations LIMIT 5")
            orgs = cur.fetchall()
        
        if not orgs:
            print("❌ No organizations found")
            return
        
        print("\nAvailable organizations:")
        for i, (org_id, org_name) in enumerate(orgs, 1):
            print(f"  {i}. {org_name} ({org_id})")
        
        choice = input("\nSelect organization (1-{}) or enter UUID: ".format(len(orgs))).strip()
        
        try:
            idx = int(choice) - 1
            organization_id = orgs[idx][0]
        except (ValueError, IndexError):
            organization_id = choice
        
        print(f"\nUsing organization: {organization_id}")
        
        # Check if stats already exist
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM program_impact_stats WHERE organization_id = %s",
                (str(organization_id),)
            )
            existing = cur.fetchone()[0]
        
        if existing > 0:
            print(f"\n⚠️  Found {existing} existing impact stats")
            action = input("Choose action: (L)ist / (D)elete and reseed / (A)dd more / (Q)uit: ").strip().upper()
            
            if action == 'L':
                list_impact_stats(conn, organization_id)
                return
            elif action == 'D':
                with conn.cursor() as cur:
                    cur.execute(
                        "DELETE FROM program_impact_stats WHERE organization_id = %s",
                        (str(organization_id),)
                    )
                    conn.commit()
                print("✅ Deleted existing stats")
                seed_impact_stats(conn, organization_id)
            elif action == 'A':
                seed_impact_stats(conn, organization_id)
            else:
                print("Exiting without changes")
                return
        else:
            seed_impact_stats(conn, organization_id)
        
        # Show final results
        list_impact_stats(conn, organization_id)
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    main()
