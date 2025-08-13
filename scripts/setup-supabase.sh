#!/bin/bash

# Extract project reference from Supabase URL
SUPABASE_URL="https://pltutlpmamxozailzffm.supabase.co"
PROJECT_REF="pltutlpmamxozailzffm"

echo "Setting up Supabase project..."
echo "Project Reference: $PROJECT_REF"
echo ""

# Link to the Supabase project
echo "Linking to Supabase project..."
npx supabase link --project-ref $PROJECT_REF

# Push database migrations
echo ""
echo "Pushing database migrations..."
npx supabase db push

echo ""
echo "Setup complete!"