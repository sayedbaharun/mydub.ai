// Create a test user using the service role key
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwOTg1NiwiZXhwIjoyMDY1NTg1ODU2fQ.d7XUUomKbSUpk3oMJLeeG7SmsJJ2FIWebYM5Kif8h_s'

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('Creating test user...\n')
  
  // Create a test user using admin API
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email: 'test@mydub.ai',
    password: 'Test123456!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test User'
    }
  })
  
  if (createError) {
    console.error('❌ Failed to create user:', createError.message)
    
    // Try to list existing users
    console.log('\nListing existing users...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
    } else {
      console.log('Found', users.users.length, 'users:')
      users.users.forEach(u => {
        console.log('-', u.email, '(created:', new Date(u.created_at).toLocaleDateString(), ')')
      })
    }
  } else {
    console.log('✅ User created successfully!')
    console.log('Email:', user.user.email)
    console.log('ID:', user.user.id)
    console.log('\nYou can now login with:')
    console.log('Email: test@mydub.ai')
    console.log('Password: Test123456!')
  }
  
  // Check if profile was created
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'test@mydub.ai')
    .single()
  
  if (profileError) {
    console.log('\n⚠️ Profile not found, might need to be created manually')
  } else {
    console.log('\n✅ Profile exists:', profile)
  }
}

createTestUser().catch(console.error)