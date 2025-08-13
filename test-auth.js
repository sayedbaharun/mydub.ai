// Test authentication with Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.HWRsXqQ7CVkzVDhLIcEUmdPMW9XgLcK26BI7GqnZZ9E'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('Testing Supabase connection...')
  
  // Test 1: Check if we can connect
  const { data: healthCheck, error: healthError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1)
  
  if (healthError) {
    console.error('Database connection error:', healthError)
  } else {
    console.log('✓ Database connection successful')
  }
  
  // Test 2: Try to sign up a test user
  const testEmail = `test${Date.now()}@example.com`
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
  })
  
  if (signUpError) {
    console.error('Sign up error:', signUpError)
  } else {
    console.log('✓ Sign up successful:', signUpData.user?.email)
  }
  
  // Test 3: Try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signIn({
    email: 'test@example.com',
    password: 'password123',
  })
  
  if (signInError) {
    console.error('Sign in error:', signInError)
  } else {
    console.log('✓ Sign in successful:', signInData.user?.email)
  }
  
  // Test 4: Check auth settings
  const { data: settings } = await supabase.auth.getSession()
  console.log('Current session:', settings)
}

testAuth().catch(console.error)