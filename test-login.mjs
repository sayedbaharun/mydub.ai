// Test login with the anon key (client-side simulation)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.HWRsXqQ7CVkzVDhLIcEUmdPMW9XgLcK26BI7GqnZZ9E'

// Create client with anon key (like the frontend would)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login with client credentials...\n')
  
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@mydub.ai',
    password: 'Test123456!'
  })
  
  if (error) {
    console.error('❌ Login failed:', error.message)
    console.error('Error details:', error)
  } else {
    console.log('✅ Login successful!')
    console.log('User:', data.user.email)
    console.log('Session:', data.session ? 'Active' : 'None')
    
    // Check if we can access the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Could not fetch profile:', profileError.message)
    } else {
      console.log('✅ Profile fetched:', profile.full_name, '(' + profile.role + ')')
    }
  }
  
  // Sign out to clean up
  await supabase.auth.signOut()
  console.log('\n✅ Test complete - signed out')
}

testLogin().catch(console.error)