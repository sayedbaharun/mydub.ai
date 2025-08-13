#!/usr/bin/env node

/**
 * Admin Management Script for MyDub.ai
 * 
 * This script provides utilities to manage admin users in the database.
 * 
 * Usage:
 *   npm run manage-admins list              - List all admin users
 *   npm run manage-admins add <email>       - Add a new admin user
 *   npm run manage-admins remove <email>    - Remove admin privileges
 *   npm run manage-admins check <email>     - Check if user is admin
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: resolve(__dirname, '../.env') })

// Validate environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Parse command line arguments
const command = process.argv[2]
const email = process.argv[3]

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

async function listAdmins() {
  console.log(`${colors.cyan}📋 Fetching admin users...${colors.reset}`)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      console.log(`${colors.yellow}No admin users found${colors.reset}`)
      return
    }

    console.log(`\n${colors.green}✅ Found ${data.length} admin user(s):${colors.reset}\n`)
    
    data.forEach((admin, index) => {
      console.log(`${colors.bright}${index + 1}. ${admin.full_name || 'No name'}${colors.reset}`)
      console.log(`   Email: ${colors.cyan}${admin.email}${colors.reset}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Created: ${new Date(admin.created_at).toLocaleDateString()}`)
      console.log('')
    })
  } catch (error) {
    console.error(`${colors.red}❌ Error listing admins:${colors.reset}`, error.message)
    process.exit(1)
  }
}

async function addAdmin(email: string) {
  if (!email) {
    console.error(`${colors.red}❌ Error: Email address is required${colors.reset}`)
    console.log('Usage: npm run manage-admins add <email>')
    process.exit(1)
  }

  console.log(`${colors.cyan}➕ Adding admin privileges for ${email}...${colors.reset}`)
  
  try {
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (!existingUser) {
      console.log(`${colors.yellow}⚠️  User ${email} does not exist yet${colors.reset}`)
      console.log('They will be granted admin role when they sign up')
      
      // Add email to admin_emails table if it exists
      const { error: insertError } = await supabase
        .from('admin_emails')
        .insert({ email, notes: `Added via CLI on ${new Date().toISOString()}` })
        .select()
        .single()

      if (insertError && insertError.code !== '42P01') {
        // Ignore if table doesn't exist
        console.warn('Note: admin_emails table not found. Run migrations first.')
      }
      
      console.log(`${colors.green}✅ Email ${email} added to admin list${colors.reset}`)
      return
    }

    if (existingUser.role === 'admin') {
      console.log(`${colors.yellow}ℹ️  User ${email} is already an admin${colors.reset}`)
      return
    }

    // Update user role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', existingUser.id)

    if (updateError) throw updateError

    // Add to admin_emails table
    const { error: insertError } = await supabase
      .from('admin_emails')
      .insert({ email, notes: `Added via CLI on ${new Date().toISOString()}` })
      .select()
      .single()

    if (insertError && insertError.code !== '42P01' && insertError.code !== '23505') {
      // Ignore if table doesn't exist or duplicate
      console.warn('Note: Could not add to admin_emails table')
    }

    console.log(`${colors.green}✅ Successfully granted admin privileges to ${email}${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}❌ Error adding admin:${colors.reset}`, error.message)
    process.exit(1)
  }
}

async function removeAdmin(email: string) {
  if (!email) {
    console.error(`${colors.red}❌ Error: Email address is required${colors.reset}`)
    console.log('Usage: npm run manage-admins remove <email>')
    process.exit(1)
  }

  // Prevent removing critical admins
  if (email === 'admin@mydub.ai') {
    console.error(`${colors.red}❌ Error: Cannot remove admin@mydub.ai - this is the system admin account${colors.reset}`)
    process.exit(1)
  }

  console.log(`${colors.cyan}➖ Removing admin privileges for ${email}...${colors.reset}`)
  
  try {
    // Check if user exists and is admin
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log(`${colors.yellow}⚠️  User ${email} not found${colors.reset}`)
        return
      }
      throw checkError
    }

    if (existingUser.role !== 'admin') {
      console.log(`${colors.yellow}ℹ️  User ${email} is not an admin${colors.reset}`)
      return
    }

    // Check remaining admins
    const { data: adminCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin')

    if (countError) throw countError

    if (adminCount && adminCount.length <= 1) {
      console.error(`${colors.red}❌ Error: Cannot remove the last admin user${colors.reset}`)
      console.log('At least one admin must remain in the system')
      process.exit(1)
    }

    // Update user role to user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', existingUser.id)

    if (updateError) throw updateError

    // Remove from admin_emails table
    const { error: deleteError } = await supabase
      .from('admin_emails')
      .delete()
      .eq('email', email)

    if (deleteError && deleteError.code !== '42P01') {
      // Ignore if table doesn't exist
      console.warn('Note: Could not remove from admin_emails table')
    }

    console.log(`${colors.green}✅ Successfully removed admin privileges from ${email}${colors.reset}`)
  } catch (error) {
    console.error(`${colors.red}❌ Error removing admin:${colors.reset}`, error.message)
    process.exit(1)
  }
}

async function checkAdmin(email: string) {
  if (!email) {
    console.error(`${colors.red}❌ Error: Email address is required${colors.reset}`)
    console.log('Usage: npm run manage-admins check <email>')
    process.exit(1)
  }

  console.log(`${colors.cyan}🔍 Checking admin status for ${email}...${colors.reset}`)
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`${colors.yellow}⚠️  User ${email} not found in database${colors.reset}`)
        
        // Check if email is in admin_emails table
        const { data: adminEmail } = await supabase
          .from('admin_emails')
          .select('email')
          .eq('email', email)
          .single()

        if (adminEmail) {
          console.log(`${colors.blue}ℹ️  Email ${email} is pre-authorized as admin${colors.reset}`)
          console.log('They will receive admin role upon first sign-in')
        }
        return
      }
      throw error
    }

    console.log(`\n${colors.bright}User Details:${colors.reset}`)
    console.log(`Email: ${colors.cyan}${data.email}${colors.reset}`)
    console.log(`Name: ${data.full_name || 'Not set'}`)
    console.log(`Role: ${data.role === 'admin' ? colors.green : colors.yellow}${data.role}${colors.reset}`)
    console.log(`Status: ${data.role === 'admin' ? `${colors.green}✅ IS ADMIN` : `${colors.yellow}⚠️  NOT ADMIN`}${colors.reset}`)
    console.log(`Account created: ${new Date(data.created_at).toLocaleDateString()}`)
  } catch (error) {
    console.error(`${colors.red}❌ Error checking admin status:${colors.reset}`, error.message)
    process.exit(1)
  }
}

async function showHelp() {
  console.log(`
${colors.bright}MyDub.ai Admin Management Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  npm run manage-admins ${colors.green}list${colors.reset}              - List all admin users
  npm run manage-admins ${colors.green}add${colors.reset} <email>       - Add a new admin user
  npm run manage-admins ${colors.green}remove${colors.reset} <email>    - Remove admin privileges
  npm run manage-admins ${colors.green}check${colors.reset} <email>     - Check if user is admin
  npm run manage-admins ${colors.green}help${colors.reset}              - Show this help message

${colors.cyan}Examples:${colors.reset}
  npm run manage-admins list
  npm run manage-admins add user@example.com
  npm run manage-admins remove user@example.com
  npm run manage-admins check admin@mydub.ai

${colors.yellow}Note:${colors.reset} This script requires SUPABASE_SERVICE_ROLE_KEY to be set in .env
`)
}

// Main execution
async function main() {
  console.log(`${colors.magenta}${colors.bright}MyDub.ai Admin Management${colors.reset}\n`)

  switch (command) {
    case 'list':
      await listAdmins()
      break
    case 'add':
      await addAdmin(email)
      break
    case 'remove':
      await removeAdmin(email)
      break
    case 'check':
      await checkAdmin(email)
      break
    case 'help':
    case undefined:
      await showHelp()
      break
    default:
      console.error(`${colors.red}❌ Unknown command: ${command}${colors.reset}`)
      await showHelp()
      process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}❌ Unexpected error:${colors.reset}`, error)
  process.exit(1)
})