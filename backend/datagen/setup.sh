#!/bin/bash

################################################################################
# Wise Investor - Quick Setup Script
# First-time setup for analytics data generation
################################################################################

echo "========================================="
echo "Wise Investor - Quick Setup"
echo "========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Working directory: $SCRIPT_DIR"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Error: Python 3 is not installed"
    echo "  Please install Python 3.8 or higher"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  Warning: psql not found in PATH"
    echo "  Make sure PostgreSQL is installed and accessible"
else
    echo "✓ PostgreSQL found"
fi

echo ""
echo "========================================="
echo "Step 1: Install Dependencies"
echo "========================================="
echo ""

if [ -f "data_generator_requirements.txt" ]; then
    pip3 install -r data_generator_requirements.txt
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Dependencies installed successfully"
    else
        echo ""
        echo "✗ Error installing dependencies"
        exit 1
    fi
else
    echo "✗ Error: data_generator_requirements.txt not found"
    exit 1
fi

echo ""
echo "========================================="
echo "Step 2: Test Database Connection"
echo "========================================="
echo ""

# Database connection test
read -p "Database name (default: organization_db3): " DB_NAME
DB_NAME=${DB_NAME:-organization_db3}

read -p "Database user (default: orguser3): " DB_USER
DB_USER=${DB_USER:-orguser3}

read -sp "Database password (default: orgpassword3): " DB_PASS
DB_PASS=${DB_PASS:-orgpassword3}
echo ""

read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Testing connection to $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME..."

PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
    echo ""
    echo "Please check:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database credentials are correct"
    echo "  3. Database '$DB_NAME' exists"
    echo "  4. User '$DB_USER' has access"
    exit 1
fi

echo ""
echo "========================================="
echo "Step 3: Check Database Schema"
echo "========================================="
echo ""

# Check if organizations table exists
TABLE_EXISTS=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='organizations';")

if [ "$TABLE_EXISTS" = "1" ]; then
    echo "✓ Database schema exists (organizations table found)"
else
    echo "⚠️  Warning: 'organizations' table not found"
    echo ""
    echo "You may need to run migrations first:"
    echo "  cd /path/to/your/project"
    echo "  alembic upgrade head"
    echo ""
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo ""
echo "========================================="
echo "Step 4: Create Organization"
echo "========================================="
echo ""

# Check if organizations exist
ORG_COUNT=$(PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -tAc "SELECT COUNT(*) FROM organizations;")

if [ "$ORG_COUNT" -gt 0 ]; then
    echo "✓ Found $ORG_COUNT existing organization(s)"
    echo ""
    read -p "Do you want to create a new organization? (yes/no): " CREATE_ORG
else
    echo "⚠️  No organizations found"
    echo ""
    read -p "Would you like to create one now? (yes/no): " CREATE_ORG
fi

if [ "$CREATE_ORG" = "yes" ]; then
    python3 create_organization.py
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "✗ Organization creation failed"
        exit 1
    fi
fi

echo ""
echo "========================================="
echo "Step 5: Generate Analytics Data"
echo "========================================="
echo ""

read -p "Do you want to generate analytics data now? (yes/no): " GEN_DATA

if [ "$GEN_DATA" = "yes" ]; then
    echo ""
    python3 generate_comprehensive_analytics_data.py
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "Step 6: Verify Generated Data"
        echo "========================================="
        echo ""
        
        read -p "Would you like to verify the generated data? (yes/no): " VERIFY
        
        if [ "$VERIFY" = "yes" ]; then
            python3 verify_generated_data.py
        fi
    fi
fi

echo ""
echo "========================================="
echo "✓ SETUP COMPLETE!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Start your FastAPI server:"
echo "     cd /path/to/your/project"
echo "     uvicorn main:app --reload"
echo ""
echo "  2. Test analytics endpoints:"
echo "     curl http://localhost:8000/analytics/{org_id}/donor-retention"
echo ""
echo "  3. Open your dashboard and verify data displays correctly"
echo ""
echo "Useful commands:"
echo "  • Create organization:    python3 create_organization.py"
echo "  • Generate data:          python3 generate_comprehensive_analytics_data.py"
echo "  • Verify data:            python3 verify_generated_data.py"
echo "  • Quick menu:             bash run_data_generator.sh"
echo ""
echo "Documentation:"
echo "  • README.md                     - Package overview"
echo "  • DATA_GENERATOR_README.md      - Detailed usage guide"
echo "  • ANALYTICS_ENDPOINTS_REFERENCE.md - API reference"
echo "  • SQL_QUERIES_REFERENCE.md      - SQL queries"
echo ""
echo "Happy analyzing! 📊✨"
echo ""
