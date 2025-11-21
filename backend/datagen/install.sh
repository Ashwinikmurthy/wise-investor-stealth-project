#!/bin/bash

################################################################################
# Simple Installation Script - Works from any directory
################################################################################

echo ""
echo "========================================="
echo "Wise Investor Setup - Simple Version"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "data_generator_requirements.txt" ]; then
    echo -e "${RED}✗ Error: data_generator_requirements.txt not found${NC}"
    echo ""
    echo "Please run this script from the directory containing the setup files."
    echo ""
    echo "Steps:"
    echo "  1. cd /path/to/your/downloaded/files"
    echo "  2. bash install.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found setup files${NC}"
echo ""

# Check Python
echo "Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    echo "  Please install Python 3.8 or higher"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗ pip3 not found${NC}"
    echo "  Please install pip3"
    exit 1
fi
echo -e "${GREEN}✓ pip3 found${NC}"

echo ""
echo "========================================="
echo "Installing Dependencies"
echo "========================================="
echo ""

pip3 install -r data_generator_requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo ""
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "Testing Database Connection"
echo "========================================="
echo ""

# Default database settings
DB_NAME="organization_db4"
DB_USER="orguser4"
DB_PASS="orgpassword4"
DB_HOST="localhost"
DB_PORT="5432"

echo "Using default database settings:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

read -p "Are these settings correct? (yes/no, default: yes): " CORRECT
CORRECT=${CORRECT:-yes}

if [ "$CORRECT" != "yes" ]; then
    read -p "Database name: " DB_NAME
    read -p "Database user: " DB_USER
    read -sp "Database password: " DB_PASS
    echo ""
    read -p "Database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    read -p "Database port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    echo ""
fi

# Test connection
echo "Testing connection..."
PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Database connection failed${NC}"
    echo ""
    echo "This might be okay if:"
    echo "  • You'll update DB_CONFIG in the scripts manually"
    echo "  • You'll run the scripts from a different location"
    echo ""
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo ""
echo "========================================="
echo "✓ INSTALLATION COMPLETE!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create an organization:"
echo "   ${GREEN}python3 create_organization.py${NC}"
echo ""
echo "2. Generate analytics data:"
echo "   ${GREEN}python3 generate_comprehensive_analytics_data.py${NC}"
echo ""
echo "3. Verify the data:"
echo "   ${GREEN}python3 verify_generated_data.py${NC}"
echo ""
echo "Or use the interactive menu:"
echo "   ${GREEN}bash run_data_generator.sh${NC}"
echo ""
echo "Documentation:"
echo "  • QUICK_START.md - Quick start guide"
echo "  • DATA_GENERATOR_README.md - Complete guide"
echo "  • README.md - Package overview"
echo ""
echo -e "${GREEN}Ready to generate analytics data! 🚀${NC}"
echo ""
