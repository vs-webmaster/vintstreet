#!/bin/bash

# VintStreet Git History Audit Script
# Scans git history for exposed credentials

set -e

echo "================================================"
echo "  Git History Audit for Exposed Secrets"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check for pattern in git history
check_pattern() {
    local pattern=$1
    local description=$2
    
    echo -n "Checking for $description... "
    
    matches=$(git log --all --full-history --source --remotes -S "$pattern" --pretty=format:"%h %s" 2>/dev/null | wc -l)
    
    if [ "$matches" -gt 0 ]; then
        echo -e "${RED}FOUND ($matches commits)${NC}"
        echo "  Commits containing this pattern:"
        git log --all --full-history --source --remotes -S "$pattern" --pretty=format:"    %h - %s (%an, %ar)" 2>/dev/null | head -5
        echo ""
        return 1
    else
        echo -e "${GREEN}CLEAN${NC}"
        return 0
    fi
}

# Track if any secrets were found
secrets_found=0

echo "Scanning for exposed credentials in git history..."
echo ""

# Check for Supabase credentials
echo "1. Supabase Credentials"
echo "-----------------------"
if ! check_pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" "Supabase JWT tokens"; then
    secrets_found=1
fi
if ! check_pattern "quibvppxriibzfvhrhwv.supabase.co" "Supabase URL"; then
    secrets_found=1
fi
echo ""

# Check for Agora credentials
echo "2. Agora Credentials"
echo "--------------------"
if ! check_pattern "578fc4cf2194471794d0198d1f6a595b" "Agora App ID"; then
    secrets_found=1
fi
echo ""

# Check for Stripe credentials
echo "3. Stripe Credentials"
echo "---------------------"
if ! check_pattern "sk_test_" "Stripe test keys"; then
    secrets_found=1
fi
if ! check_pattern "sk_live_" "Stripe live keys"; then
    secrets_found=1
fi
echo ""

# Check for Algolia credentials
echo "4. Algolia Credentials"
echo "----------------------"
if ! check_pattern "ALGOLIA_ADMIN_API_KEY" "Algolia admin keys"; then
    secrets_found=1
fi
echo ""

# Summary
echo ""
echo "================================================"
if [ $secrets_found -eq 0 ]; then
    echo -e "  ${GREEN}✅ No secrets found in git history${NC}"
    echo "================================================"
else
    echo -e "  ${RED}⚠️  SECRETS FOUND IN GIT HISTORY${NC}"
    echo "================================================"
    echo ""
    echo "Recommended actions:"
    echo ""
    echo "Option 1: Use git-filter-repo (recommended)"
    echo "  pip install git-filter-repo"
    echo "  git filter-repo --path src/components/docs/CredentialsSection.tsx --invert-paths"
    echo ""
    echo "Option 2: Use BFG Repo-Cleaner"
    echo "  Download from: https://rtyley.github.io/bfg-repo-cleaner/"
    echo "  java -jar bfg.jar --delete-files CredentialsSection.tsx"
    echo ""
    echo "Option 3: Rewrite specific commits"
    echo "  Use 'git rebase -i' to edit/remove commits with secrets"
    echo ""
    echo "⚠️  WARNING: All options require force-pushing!"
    echo "    Coordinate with your team before proceeding."
    echo ""
fi

