import os
import psycopg2
from passlib.hash import bcrypt
from datetime import datetime
from uuid import uuid4

# ✅ Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "organization_db3")
DB_USER = os.getenv("DB_USER", "orguser3")
DB_PASSWORD = os.getenv("DB_PASSWORD", "orgpassword3")

# ✅ Superadmin credentials
SUPERADMIN_EMAIL = "superadmin@example.com"
SUPERADMIN_PASSWORD = "SuperAdmin@123"
SUPERADMIN_NAME = "System Superadmin"

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )
    cur = conn.cursor()

    # ✅ Hash password (truncate if needed for bcrypt’s 72-byte limit)
    hashed_pw = bcrypt.hash(SUPERADMIN_PASSWORD[:72])

    # ✅ Check if superadmin already exists
    cur.execute("SELECT id FROM users WHERE email = %s;", (SUPERADMIN_EMAIL,))
    existing = cur.fetchone()
    if existing:
        print(f"⚠️  Superadmin already exists with email {SUPERADMIN_EMAIL}")
    else:
        # ✅ Insert superadmin
        cur.execute(
            """
            INSERT INTO users (
                id, organization_id, email, password_hash, phone, is_active,
                is_superadmin, created_at, updated_at, full_name, role, last_login
            )
            VALUES (
                %s, NULL, %s, %s, %s, TRUE, TRUE,
                %s, %s, %s, %s, %s
            );
            """,
            (
                str(uuid4()),
                SUPERADMIN_EMAIL,
                hashed_pw,
                "1234567890",
                datetime.utcnow(),
                datetime.utcnow(),
                SUPERADMIN_NAME,
                "SuperAdmin",
                datetime.utcnow(),
            ),
        )
        conn.commit()
        print(f"✅ Superadmin user created successfully: {SUPERADMIN_EMAIL}")

except Exception as e:
    print(f"❌ Error creating superadmin: {e}")

finally:
    if "conn" in locals():
        cur.close()
        conn.close()

