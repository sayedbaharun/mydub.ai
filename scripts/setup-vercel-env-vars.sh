#!/bin/bash

# Vercel Environment Variables Setup Script
# This script sets up all necessary environment variables in Vercel
# Usage: ./scripts/setup-vercel-env-vars.sh

set -e

echo "🔒 Setting up secure environment variables in Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📝 Please enter the following environment variables:"
echo "⚠️  These values will be securely stored in Vercel and not visible in code"
echo ""

# Function to read secret input
read_secret() {
    local var_name=$1
    local prompt=$2
    local value
    
    echo -n "$prompt: "
    read -s value
    echo ""
    
    if [ -z "$value" ]; then
        echo "❌ $var_name cannot be empty"
        exit 1
    fi
    
    echo "$value"
}

# Read all sensitive values
echo "🔑 GitHub Configuration"
GITHUB_TOKEN=$(read_secret "GITHUB_PERSONAL_ACCESS_TOKEN" "Enter GitHub Personal Access Token")

echo ""
echo "🔑 Supabase Configuration"
SUPABASE_TOKEN=$(read_secret "SUPABASE_ACCESS_TOKEN" "Enter Supabase Access Token")
SUPABASE_URL=$(read_secret "VITE_SUPABASE_URL" "Enter Supabase URL")
SUPABASE_ANON_KEY=$(read_secret "VITE_SUPABASE_ANON_KEY" "Enter Supabase Anon Key")
SUPABASE_SERVICE_KEY=$(read_secret "SUPABASE_SERVICE_ROLE_KEY" "Enter Supabase Service Role Key")

echo ""
echo "🔑 API Keys"
OPENWEATHER_KEY=$(read_secret "OPENWEATHER_API_KEY" "Enter OpenWeather API Key")
SMITHERY_KEY=$(read_secret "SMITHERY_API_KEY" "Enter Smithery API Key")
OPENROUTER_KEY=$(read_secret "VITE_OPENROUTER_API_KEY" "Enter OpenRouter API Key")
OPENAI_KEY=$(read_secret "VITE_OPENAI_API_KEY" "Enter OpenAI API Key (optional, press Enter to skip)")
NEWS_API_KEY=$(read_secret "VITE_NEWS_API_KEY" "Enter News API Key")
GOOGLE_MAPS_KEY=$(read_secret "VITE_GOOGLE_MAPS_API_KEY" "Enter Google Maps API Key")
BRAVE_SEARCH_KEY=$(read_secret "VITE_BRAVE_SEARCH_API_KEY" "Enter Brave Search API Key")
EVENTBRITE_TOKEN=$(read_secret "VITE_EVENTBRITE_TOKEN" "Enter Eventbrite Token")

echo ""
echo "🔑 Email Configuration"
SENDGRID_KEY=$(read_secret "SENDGRID_API_KEY" "Enter SendGrid API Key")

echo ""
echo "🔑 Other Configuration"
echo -n "Enter TaskManager Path (default: /home/app/mcp-servers/taskmanager): "
read TASKMANAGER_PATH
TASKMANAGER_PATH=${TASKMANAGER_PATH:-"/home/app/mcp-servers/taskmanager"}

echo ""
echo "🔄 Setting environment variables in Vercel..."

# Set environment variables in Vercel for all environments
set_vercel_env() {
    local key=$1
    local value=$2
    local environments="production preview development"
    
    for env in $environments; do
        echo "Setting $key for $env..."
        echo "$value" | vercel env add "$key" "$env" --force 2>/dev/null || true
    done
}

# Set all environment variables
set_vercel_env "GITHUB_PERSONAL_ACCESS_TOKEN" "$GITHUB_TOKEN"
set_vercel_env "SUPABASE_ACCESS_TOKEN" "$SUPABASE_TOKEN"
set_vercel_env "VITE_SUPABASE_URL" "$SUPABASE_URL"
set_vercel_env "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
set_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY"
set_vercel_env "OPENWEATHER_API_KEY" "$OPENWEATHER_KEY"
set_vercel_env "VITE_OPENWEATHER_API_KEY" "$OPENWEATHER_KEY"
set_vercel_env "SMITHERY_API_KEY" "$SMITHERY_KEY"
set_vercel_env "VITE_OPENROUTER_API_KEY" "$OPENROUTER_KEY"
set_vercel_env "VITE_NEWS_API_KEY" "$NEWS_API_KEY"
set_vercel_env "VITE_GOOGLE_MAPS_API_KEY" "$GOOGLE_MAPS_KEY"
set_vercel_env "VITE_BRAVE_SEARCH_API_KEY" "$BRAVE_SEARCH_KEY"
set_vercel_env "VITE_EVENTBRITE_TOKEN" "$EVENTBRITE_TOKEN"
set_vercel_env "SENDGRID_API_KEY" "$SENDGRID_KEY"
set_vercel_env "SENDGRID_FROM_EMAIL" "noreply@mydub.ai"
set_vercel_env "TASKMANAGER_PATH" "$TASKMANAGER_PATH"
set_vercel_env "VITE_APP_URL" "https://mydub.ai"
set_vercel_env "VITE_APP_NAME" "MyDub.AI"
set_vercel_env "VITE_APP_DESCRIPTION" "AI-powered information platform for Dubai"

# Optional: Set OpenAI key if provided
if [ ! -z "$OPENAI_KEY" ]; then
    set_vercel_env "VITE_OPENAI_API_KEY" "$OPENAI_KEY"
fi

echo ""
echo "✅ Environment variables have been set in Vercel!"
echo ""
echo "📋 Next steps:"
echo "1. Replace mcp.json with mcp.json.secure"
echo "2. Deploy to Vercel to use the new environment variables"
echo "3. Never commit API keys to your repository"
echo ""
echo "🔒 Security checklist:"
echo "- [ ] Remove the old mcp.json with hardcoded tokens"
echo "- [ ] Update .gitignore to exclude any files with secrets"
echo "- [ ] Rotate all exposed API keys"
echo "- [ ] Enable 2FA on all service accounts"