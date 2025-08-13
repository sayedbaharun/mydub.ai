#!/bin/bash

# MyDub.AI Production Setup Script
# This script helps set up a production Supabase instance

set -e

echo "🚀 MyDub.AI Production Supabase Setup"
echo "====================================="
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] && [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL or VITE_SUPABASE_URL not set"
    echo "Please set these environment variables first"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set"
    echo "Please set this environment variable first"
    exit 1
fi

# Menu for setup options
echo "Select setup option:"
echo "1) Full setup (TypeScript) - Recommended"
echo "2) Database only (SQL) - Manual setup"
echo "3) Deploy Edge Functions only"
echo "4) Create admin user only"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "Running full TypeScript setup..."
        echo "--------------------------------"
        
        # Check if tsx is installed
        if ! command -v tsx &> /dev/null; then
            echo "Installing tsx..."
            npm install -g tsx
        fi
        
        # Optional: Insert test data
        read -p "Do you want to insert test data? (y/N): " insert_test
        if [ "$insert_test" = "y" ] || [ "$insert_test" = "Y" ]; then
            export INSERT_TEST_DATA=true
        fi
        
        # Run the TypeScript setup script
        tsx scripts/setup-supabase-production.ts
        ;;
        
    2)
        echo ""
        echo "Database SQL setup instructions:"
        echo "--------------------------------"
        echo "1. Go to your Supabase Dashboard"
        echo "2. Navigate to SQL Editor"
        echo "3. Create a new query"
        echo "4. Copy and paste the contents of:"
        echo "   scripts/setup-production-db.sql"
        echo "5. Run the query"
        echo ""
        echo "The SQL file has been created at:"
        echo "scripts/setup-production-db.sql"
        ;;
        
    3)
        echo ""
        echo "Deploying Edge Functions..."
        echo "---------------------------"
        
        # Check if supabase CLI is installed
        if ! command -v supabase &> /dev/null; then
            echo "❌ Supabase CLI not installed"
            echo "Install it with: npm install -g supabase"
            exit 1
        fi
        
        # Get project ref
        read -p "Enter your Supabase project ref: " project_ref
        
        # Link to project
        echo "Linking to project..."
        supabase link --project-ref $project_ref
        
        # Deploy functions
        echo "Deploying Edge Functions..."
        supabase functions deploy ai-chat
        supabase functions deploy ai-content-generator
        supabase functions deploy content-scheduler
        supabase functions deploy send-email
        
        echo ""
        echo "✅ Edge Functions deployed!"
        echo ""
        echo "Don't forget to set function secrets:"
        echo "supabase secrets set OPENAI_API_KEY=<your-key>"
        echo "supabase secrets set ANTHROPIC_API_KEY=<your-key>"
        echo "supabase secrets set GOOGLE_API_KEY=<your-key>"
        echo "supabase secrets set RESEND_API_KEY=<your-key>"
        ;;
        
    4)
        echo ""
        echo "Creating admin user only..."
        echo "---------------------------"
        
        # Get admin credentials
        read -p "Enter admin email (default: admin@mydub.ai): " admin_email
        admin_email=${admin_email:-admin@mydub.ai}
        
        read -s -p "Enter admin password: " admin_password
        echo ""
        
        export ADMIN_EMAIL=$admin_email
        export ADMIN_PASSWORD=$admin_password
        
        # Run only the admin user creation
        tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: 'MyDub Admin',
      username: 'admin'
    }
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  // Update profile to admin role
  if (data?.user) {
    await supabase
      .from('profiles')
      .update({ role: 'admin', status: 'active' })
      .eq('id', data.user.id);
  }
  
  console.log('✅ Admin user created successfully!');
}

createAdmin();
"
        ;;
        
    5)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "================================"
echo "Setup process completed!"
echo ""
echo "Important reminders:"
echo "- Change admin password after first login"
echo "- Set up database backups"
echo "- Configure monitoring"
echo "- Review security settings"
echo "- Test all functionality"