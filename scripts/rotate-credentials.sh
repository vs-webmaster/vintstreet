#!/bin/bash

# VintStreet Credential Rotation Script
# This script guides you through rotating all exposed credentials

set -e

echo "================================================"
echo "  VintStreet Credential Rotation Guide"
echo "================================================"
echo ""
echo "⚠️  WARNING: Old credentials were exposed in git history!"
echo "This script will guide you through rotating all credentials."
echo ""

# Function to prompt for continuation
continue_prompt() {
    read -p "Press Enter to continue..."
}

# Step 1: Supabase
echo "Step 1: Rotate Supabase Credentials"
echo "------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/quibvppxriibzfvhrhwv/settings/api"
echo "2. Under 'Project API keys', click 'Regenerate' for the anon/public key"
echo "3. Copy the NEW anon key"
echo "4. Update your .env file: VITE_SUPABASE_PUBLISHABLE_KEY=<new_key>"
echo "5. Update GitHub Secrets: VITE_SUPABASE_PUBLISHABLE_KEY"
echo ""
continue_prompt

# Step 2: Agora
echo ""
echo "Step 2: Rotate Agora Credentials"
echo "---------------------------------"
echo "1. Go to: https://console.agora.io/"
echo "2. Navigate to your project"
echo "3. Generate a new App ID or rotate the certificate"
echo "4. Update your .env file: VITE_AGORA_APP_ID=<new_app_id>"
echo "5. Update GitHub Secrets: VITE_AGORA_APP_ID"
echo ""
continue_prompt

# Step 3: Verify .env
echo ""
echo "Step 3: Verify Local Environment"
echo "---------------------------------"
echo "Checking if .env file exists..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo ""
    echo "Required variables in .env:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_PUBLISHABLE_KEY (NEW)"
    echo "  - VITE_AGORA_APP_ID (NEW)"
    echo "  - VITE_ALGOLIA_APP_ID"
    echo "  - VITE_ALGOLIA_SEARCH_API_KEY"
    echo "  - VITE_GOOGLE_MAPS_API_KEY"
else
    echo "❌ .env file not found!"
    echo "   Copy .env.example to .env and fill in values"
fi
echo ""
continue_prompt

# Step 4: Update GitHub Secrets
echo ""
echo "Step 4: Update GitHub Secrets"
echo "------------------------------"
echo "Go to: https://github.com/vs-webmaster/vintstreet/settings/secrets/actions"
echo ""
echo "Update these secrets with NEW values:"
echo "  1. VITE_SUPABASE_PUBLISHABLE_KEY"
echo "  2. VITE_AGORA_APP_ID"
echo ""
continue_prompt

# Step 5: Update Supabase Edge Function Secrets
echo ""
echo "Step 5: Update Supabase Edge Function Secrets"
echo "----------------------------------------------"
echo "Go to: https://supabase.com/dashboard/project/quibvppxriibzfvhrhwv/settings/functions"
echo ""
echo "Verify these secrets are set:"
echo "  - ALGOLIA_APP_ID"
echo "  - ALGOLIA_ADMIN_API_KEY"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo ""
continue_prompt

# Step 6: Test
echo ""
echo "Step 6: Test Configuration"
echo "--------------------------"
echo "Run these commands to verify:"
echo "  npm run build"
echo "  npm run dev"
echo ""
echo "Check for errors related to credentials"
echo ""
continue_prompt

# Step 7: Deploy
echo ""
echo "Step 7: Deploy Changes"
echo "----------------------"
echo "Once verified locally:"
echo "  git add .env.example"
echo "  git commit -m 'chore: update environment configuration'"
echo "  git push"
echo ""
echo "Monitor the deployment to ensure everything works"
echo ""

echo ""
echo "================================================"
echo "  ✅ Credential Rotation Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Monitor application for any auth/API errors"
echo "2. Run: ./scripts/audit-git-history.sh to check for remaining secrets"
echo "3. Consider using git-filter-repo to clean git history"
echo ""

