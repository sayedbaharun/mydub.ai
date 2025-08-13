#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions"
echo "===================================="

PROJECT_REF="pltutlpmamxozailzffm"

# Deploy OpenRouter proxy function
echo "Deploying api-proxy-openrouter..."
supabase functions deploy api-proxy-openrouter \
  --project-ref $PROJECT_REF

# Deploy Send Email function
echo "Deploying send-email..."
supabase functions deploy send-email \
  --project-ref $PROJECT_REF

# Set the secrets
echo "Setting API key secrets..."

# OpenRouter API key
supabase secrets set OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
  --project-ref $PROJECT_REF

# SendGrid API key
supabase secrets set SENDGRID_API_KEY="${SENDGRID_API_KEY}" \
  --project-ref $PROJECT_REF

# SendGrid From Email
supabase secrets set SENDGRID_FROM_EMAIL="${SENDGRID_FROM_EMAIL:-noreply@mydub.ai}" \
  --project-ref $PROJECT_REF

echo "✅ Edge Functions deployed!"
echo ""
echo "Note: Make sure you're logged in to Supabase CLI:"
echo "  supabase login"