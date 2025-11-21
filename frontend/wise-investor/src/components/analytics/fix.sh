#!/bin/bash
# Automated Field Name Fix Script for Wise Investor Platform
# This script fixes all API field name mismatches in the frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Wise Investor - Field Mapping Fix${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if file path is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No file path provided${NC}"
    echo "Usage: $0 <path-to-CampaignPerformanceDashboard.jsx>"
    echo "Example: $0 ./frontend/src/components/CampaignPerformanceDashboard.jsx"
    exit 1
fi

FILE_PATH="$1"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Error: File not found: $FILE_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Target file: $FILE_PATH${NC}"
echo ""

# Create backup
BACKUP_PATH="${FILE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$FILE_PATH" "$BACKUP_PATH"
echo -e "${GREEN}✓ Backup created: $BACKUP_PATH${NC}"
echo ""

# Counter for changes
CHANGES=0

echo -e "${BLUE}Applying fixes...${NC}"
echo ""

# Fix 1: ROI Analysis - campaign_roi to campaigns
echo -e "${YELLOW}[1/7] Fixing ROI field: campaign_roi → campaigns${NC}"
if grep -q "campaign_roi" "$FILE_PATH"; then
    sed -i 's/\.campaign_roi/.campaigns/g' "$FILE_PATH"
    sed -i 's/campaign_roi\?/campaigns?/g' "$FILE_PATH"
    CHANGES=$((CHANGES + 1))
    echo -e "${GREEN}  ✓ Fixed ROI field references${NC}"
else
    echo -e "  ℹ️  No campaign_roi references found (already fixed?)"
fi

# Fix 2: CPA Analysis - cpa_by_campaign to campaigns
echo -e "${YELLOW}[2/7] Fixing CPA field: cpa_by_campaign → campaigns${NC}"
if grep -q "cpa_by_campaign" "$FILE_PATH"; then
    sed -i 's/\.cpa_by_campaign/.campaigns/g' "$FILE_PATH"
    sed -i 's/cpa_by_campaign\?/campaigns?/g' "$FILE_PATH"
    CHANGES=$((CHANGES + 1))
    echo -e "${GREEN}  ✓ Fixed CPA field references${NC}"
else
    echo -e "  ℹ️  No cpa_by_campaign references found (already fixed?)"
fi

# Fix 3: Average CPA - average_cpa to summary.overall_cost_per_donation
echo -e "${YELLOW}[3/7] Fixing average CPA calculation${NC}"
if grep -q "\.average_cpa" "$FILE_PATH"; then
    # This is more complex, needs manual review or specific context
    echo -e "${YELLOW}  ⚠️  Found .average_cpa references - needs manual review${NC}"
    echo -e "     Replace with: summary?.overall_cost_per_donation"
    CHANGES=$((CHANGES + 1))
else
    echo -e "  ℹ️  No .average_cpa references found"
fi

# Fix 4: Add fallback for cost_per_acquisition
echo -e "${YELLOW}[4/7] Adding fallbacks for cost extraction${NC}"
if grep -q "parseFloat(c.cost_per_acquisition)" "$FILE_PATH"; then
    sed -i 's/parseFloat(c\.cost_per_acquisition)/parseFloat(c.cost_per_acquisition || c.donor_acquisition_cost || c.cost_per_donation || 0)/g' "$FILE_PATH"
    CHANGES=$((CHANGES + 1))
    echo -e "${GREEN}  ✓ Added fallbacks for cost field${NC}"
else
    echo -e "  ℹ️  Cost extraction already has fallbacks or different pattern"
fi

# Fix 5: Check for cost_per_donor usage (this is the critical one from the image)
echo -e "${YELLOW}[5/7] Checking for cost_per_donor vs cost_per_donation${NC}"
if grep -q "cost_per_donor" "$FILE_PATH"; then
    echo -e "${RED}  ⚠️  WARNING: Found 'cost_per_donor' references!${NC}"
    echo -e "     These should likely be 'cost_per_donation'"
    echo -e "     Locations:"
    grep -n "cost_per_donor" "$FILE_PATH" | head -5
    echo ""
    read -p "     Replace all cost_per_donor with cost_per_donation? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i 's/cost_per_donor/cost_per_donation/g' "$FILE_PATH"
        CHANGES=$((CHANGES + 1))
        echo -e "${GREEN}  ✓ Replaced cost_per_donor with cost_per_donation${NC}"
    else
        echo -e "  ℹ️  Skipped cost_per_donor replacement"
    fi
else
    echo -e "  ℹ️  No cost_per_donor references found"
fi

# Fix 6: Industry average fallback
echo -e "${YELLOW}[6/7] Adding industry average fallback${NC}"
if grep -q "industry_average_cpa \|\| 0" "$FILE_PATH"; then
    sed -i 's/industry_average_cpa || 0/industry_average_cpa || dashboardData.costAnalysis.efficiency_benchmarks?.target_cost_per_dollar * 100 || 50/g' "$FILE_PATH"
    CHANGES=$((CHANGES + 1))
    echo -e "${GREEN}  ✓ Added efficiency benchmark fallback${NC}"
else
    echo -e "  ℹ️  Industry average already has fallback or different pattern"
fi

# Fix 7: Verify chart conditionals
echo -e "${YELLOW}[7/7] Verifying chart render conditionals${NC}"
CHART_ISSUES=$(grep -c "campaign_roi?.length\|cpa_by_campaign?.length" "$FILE_PATH" 2>/dev/null || echo "0")
if [ "$CHART_ISSUES" -gt 0 ]; then
    echo -e "${RED}  ⚠️  Found $CHART_ISSUES old conditional references${NC}"
    echo -e "     These should use .campaigns instead"
else
    echo -e "${GREEN}  ✓ Chart conditionals look good${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Fix Summary:${NC}"
echo -e "  Changes applied: $CHANGES"
echo -e "  Backup location: $BACKUP_PATH"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review the changes: diff $BACKUP_PATH $FILE_PATH"
echo "  2. Test the dashboard in browser (clear cache: Ctrl+Shift+R)"
echo "  3. Check debug panel for data loading status"
echo "  4. If issues persist, check console for errors"
echo ""
echo -e "${BLUE}Rollback command (if needed):${NC}"
echo "  cp $BACKUP_PATH $FILE_PATH"
echo ""
echo -e "${GREEN}Done!${NC}"
