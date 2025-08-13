#!/bin/bash

# ============================================================================
# GitHub Secrets Setup Script for MyDub.AI
# ============================================================================
# This script helps set up all required GitHub repository secrets for the
# MyDub.AI deployment pipeline using GitHub CLI (gh).
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Repository owner permissions
#
# Usage:
#   ./scripts/setup-github-secrets.sh [--dry-run] [--validate-only]
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DRY_RUN=false
VALIDATE_ONLY=false
REPO=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --validate-only)
      VALIDATE_ONLY=true
      shift
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--validate-only] [--repo owner/repo]"
      echo ""
      echo "Options:"
      echo "  --dry-run        Show what would be done without making changes"
      echo "  --validate-only  Only check if secrets exist, don't set them"
      echo "  --repo          Specify repository (default: detected from git remote)"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}============================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check if gh CLI is installed and authenticated
check_gh_cli() {
  if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
  fi

  if ! gh auth status &> /dev/null; then
    print_error "GitHub CLI is not authenticated."
    echo "Please run: gh auth login"
    exit 1
  fi

  print_success "GitHub CLI is installed and authenticated"
}

# Get repository from git remote if not specified
get_repository() {
  if [[ -z "$REPO" ]]; then
    if git remote get-url origin &> /dev/null; then
      REPO=$(git remote get-url origin | sed -E 's/.*github.com[:/](.+)\.git/\1/')
      print_info "Detected repository: $REPO"
    else
      print_error "Could not detect repository from git remote"
      echo "Please specify with --repo owner/repo"
      exit 1
    fi
  fi
}

# ============================================================================
# Secret Definitions
# ============================================================================

declare -A SECRETS=(
  # Deployment Secrets
  ["VERCEL_TOKEN"]="required:Your Vercel authentication token"
  ["VERCEL_ORG_ID"]="required:Your Vercel organization ID"
  ["VERCEL_PROJECT_ID"]="required:Your Vercel project ID"
  
  # Supabase Secrets
  ["VITE_SUPABASE_URL"]="required:Your Supabase project URL"
  ["VITE_SUPABASE_ANON_KEY"]="required:Your Supabase anonymous key"
  ["SUPABASE_SERVICE_ROLE_KEY"]="required:Your Supabase service role key (for backups)"
  
  # Application Configuration
  ["VITE_APP_URL"]="required:Your production app URL (e.g., https://mydub.ai)"
  
  # Code Quality & Monitoring
  ["CODECOV_TOKEN"]="optional:Codecov upload token for coverage reports"
  ["LHCI_GITHUB_APP_TOKEN"]="optional:Lighthouse CI GitHub App token"
  
  # Analytics & Monitoring (Optional)
  ["VITE_SENTRY_DSN"]="optional:Sentry DSN for error tracking"
  ["VITE_GA_MEASUREMENT_ID"]="optional:Google Analytics measurement ID"
  ["VITE_WEBHOOK_URL"]="optional:Webhook URL for deployment notifications"
  ["VITE_MONITORING_EMAIL"]="optional:Email for monitoring alerts"
)

# Instructions for obtaining secrets
declare -A SECRET_INSTRUCTIONS=(
  ["VERCEL_TOKEN"]="
  1. Go to https://vercel.com/account/tokens
  2. Click 'Create Token'
  3. Give it a descriptive name (e.g., 'mydub-ai-deploy')
  4. Copy the token (you won't see it again!)"
  
  ["VERCEL_ORG_ID"]="
  1. Go to https://vercel.com/account
  2. Your Org ID is in the URL: vercel.com/[YOUR_ORG_ID]
  3. Or find it in Account Settings > General"
  
  ["VERCEL_PROJECT_ID"]="
  1. Go to your Vercel project dashboard
  2. Click on Settings
  3. Find the Project ID under 'General' section"
  
  ["VITE_SUPABASE_URL"]="
  1. Go to your Supabase project dashboard
  2. Navigate to Settings > API
  3. Copy the 'Project URL' (looks like https://[project-id].supabase.co)"
  
  ["VITE_SUPABASE_ANON_KEY"]="
  1. Go to your Supabase project dashboard
  2. Navigate to Settings > API
  3. Copy the 'anon public' key under 'Project API keys'"
  
  ["SUPABASE_SERVICE_ROLE_KEY"]="
  1. Go to your Supabase project dashboard
  2. Navigate to Settings > API
  3. Copy the 'service_role' key (keep this secret!)
  4. ⚠️  This key has admin privileges - handle with care!"
  
  ["VITE_APP_URL"]="
  Your production application URL (e.g., https://mydub.ai)"
  
  ["CODECOV_TOKEN"]="
  1. Go to https://app.codecov.io/gh/[your-org]/[your-repo]
  2. Navigate to Settings
  3. Copy the 'Upload Token'"
  
  ["LHCI_GITHUB_APP_TOKEN"]="
  1. Install Lighthouse CI GitHub App
  2. Go to the app settings
  3. Generate a token for your repository"
  
  ["VITE_SENTRY_DSN"]="
  1. Create a project at https://sentry.io
  2. Go to Settings > Projects > [Your Project] > Client Keys
  3. Copy the DSN"
  
  ["VITE_GA_MEASUREMENT_ID"]="
  1. Go to Google Analytics
  2. Admin > Data Streams > [Your Stream]
  3. Copy the Measurement ID (starts with G-)"
)

# ============================================================================
# Secret Management Functions
# ============================================================================

check_secret_exists() {
  local secret_name=$1
  if gh secret list --repo "$REPO" | grep -q "^${secret_name}"; then
    return 0
  else
    return 1
  fi
}

set_secret() {
  local secret_name=$1
  local secret_value=$2
  
  if [[ "$DRY_RUN" == "true" ]]; then
    print_info "[DRY RUN] Would set secret: $secret_name"
    return 0
  fi
  
  echo -n "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
  
  if [[ $? -eq 0 ]]; then
    print_success "Set secret: $secret_name"
    return 0
  else
    print_error "Failed to set secret: $secret_name"
    return 1
  fi
}

validate_secrets() {
  print_header "Validating GitHub Secrets"
  
  local missing_required=()
  local missing_optional=()
  local existing=()
  
  for secret_name in "${!SECRETS[@]}"; do
    local secret_info="${SECRETS[$secret_name]}"
    local is_required=$(echo "$secret_info" | cut -d: -f1)
    
    if check_secret_exists "$secret_name"; then
      existing+=("$secret_name")
    else
      if [[ "$is_required" == "required" ]]; then
        missing_required+=("$secret_name")
      else
        missing_optional+=("$secret_name")
      fi
    fi
  done
  
  # Print results
  if [[ ${#existing[@]} -gt 0 ]]; then
    echo -e "${GREEN}Existing secrets:${NC}"
    for secret in "${existing[@]}"; do
      print_success "$secret"
    done
  fi
  
  if [[ ${#missing_required[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}Missing REQUIRED secrets:${NC}"
    for secret in "${missing_required[@]}"; do
      print_error "$secret - ${SECRETS[$secret]#*:}"
    done
  fi
  
  if [[ ${#missing_optional[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Missing optional secrets:${NC}"
    for secret in "${missing_optional[@]}"; do
      print_warning "$secret - ${SECRETS[$secret]#*:}"
    done
  fi
  
  # Return failure if required secrets are missing
  if [[ ${#missing_required[@]} -gt 0 ]]; then
    return 1
  else
    return 0
  fi
}

prompt_for_secret() {
  local secret_name=$1
  local secret_desc="${SECRETS[$secret_name]#*:}"
  local instructions="${SECRET_INSTRUCTIONS[$secret_name]:-}"
  
  echo ""
  echo -e "${BLUE}Setting up: $secret_name${NC}"
  echo -e "Description: $secret_desc"
  
  if [[ -n "$instructions" ]]; then
    echo -e "${YELLOW}How to obtain this secret:${NC}"
    echo "$instructions"
  fi
  
  echo ""
  read -r -s -p "Enter value for $secret_name (input hidden): " secret_value
  echo ""
  
  if [[ -z "$secret_value" ]]; then
    print_warning "Skipping empty value"
    return 1
  fi
  
  return 0
}

setup_secrets() {
  print_header "Setting Up GitHub Secrets"
  
  local required_only=false
  
  echo "Would you like to set up:"
  echo "1) All secrets (required + optional)"
  echo "2) Only required secrets"
  read -r -p "Enter choice (1 or 2): " choice
  
  if [[ "$choice" == "2" ]]; then
    required_only=true
  fi
  
  for secret_name in "${!SECRETS[@]}"; do
    local secret_info="${SECRETS[$secret_name]}"
    local is_required=$(echo "$secret_info" | cut -d: -f1)
    
    # Skip optional secrets if only setting required
    if [[ "$required_only" == "true" && "$is_required" == "optional" ]]; then
      continue
    fi
    
    # Check if secret already exists
    if check_secret_exists "$secret_name"; then
      read -r -p "Secret $secret_name already exists. Update it? (y/N): " update
      if [[ ! "$update" =~ ^[Yy]$ ]]; then
        print_info "Skipping $secret_name"
        continue
      fi
    fi
    
    # Prompt for secret value
    if prompt_for_secret "$secret_name"; then
      set_secret "$secret_name" "$secret_value"
    fi
  done
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_header "MyDub.AI GitHub Secrets Setup"
  
  # Check prerequisites
  check_gh_cli
  get_repository
  
  # Validate current state
  if ! validate_secrets; then
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
      print_error "Validation failed - missing required secrets"
      exit 1
    fi
  else
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
      print_success "All required secrets are configured!"
      exit 0
    fi
  fi
  
  # If not validate-only, proceed with setup
  if [[ "$VALIDATE_ONLY" == "false" ]]; then
    echo ""
    read -r -p "Do you want to set up missing secrets? (y/N): " proceed
    if [[ "$proceed" =~ ^[Yy]$ ]]; then
      setup_secrets
      
      # Final validation
      echo ""
      if validate_secrets; then
        print_success "All required secrets are now configured!"
        echo ""
        echo "Next steps:"
        echo "1. Commit and push your code to trigger the deployment"
        echo "2. Monitor the Actions tab for deployment progress"
        echo "3. Check https://mydub.ai after deployment completes"
      else
        print_error "Some required secrets are still missing"
        exit 1
      fi
    fi
  fi
}

# Run main function
main

# ============================================================================
# Additional Information
# ============================================================================

if [[ "$1" == "--show-webhook-example" ]]; then
  print_header "Example Webhook Payload"
  cat << 'EOF'
{
  "event": "deployment",
  "status": "success",
  "environment": "production",
  "url": "https://mydub.ai",
  "timestamp": "2024-01-20T10:30:00Z",
  "commit": {
    "sha": "abc123...",
    "message": "Deploy new features",
    "author": "developer@example.com"
  }
}
EOF
fi