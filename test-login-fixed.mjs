// Test login with the CORRECT anon key
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.4RIRul4zGoHhw54MKLNQXjbgonNHxJUfJYrkjiDAAJ8'

// Create client with the CORRECT anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login with CORRECT anon key...\n')
  
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@mydub.ai',
    password: 'Test123456!'
  })
  
  if (error) {
    console.error('❌ Login failed:', error.message)
  } else {
    console.log('✅ LOGIN SUCCESSFUL!')
    console.log('User:', data.user.email)
    console.log('User ID:', data.user.id)
    console.log('Session:', data.session ? 'Active' : 'None')
    console.log('Access Token:', data.session?.access_token?.slice(0, 20) + '...')
    
    // Check if we can access the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Could not fetch profile:', profileError.message)
    } else {
      console.log('\n✅ Profile fetched successfully!')
      console.log('Name:', profile.full_name)
      console.log('Role:', profile.role)
      console.log('Email:', profile.email)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Signed out successfully')
  }
}

testLogin().catch(console.error)