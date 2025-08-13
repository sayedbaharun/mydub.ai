// Test authentication with the correct Supabase credentials
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.HWRsXqQ7CVkzVDhLIcEUmdPMW9XgLcK26BI7GqnZZ9E'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('Testing Supabase authentication...\n')
  
  // Test 1: Check database connection
  console.log('1. Testing database connection...')
  const { data: tableCheck, error: tableError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (tableError) {
    console.error('❌ Database error:', tableError.message)
  } else {
    console.log('✅ Database connection successful')
  }
  
  // Test 2: Try to sign in with a test account
  console.log('\n2. Testing sign in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123',
  })
  
  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message)
    
    // If sign in failed, let's try to create a test account
    console.log('\n3. Creating test account...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message)
    } else {
      console.log('✅ Test account created:', signUpData.user?.email)
      console.log('   Note: You may need to verify the email address')
    }
  } else {
    console.log('✅ Sign in successful:', signInData.user?.email)
  }
  
  // Test 3: Check if profiles table exists and has proper structure
  console.log('\n4. Checking profiles table structure...')
  const { data: columns, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'profiles' })
    .select('*')
    .catch(err => ({ data: null, error: err }))
  
  if (columnsError) {
    // Try a simpler query
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Cannot access profiles table:', countError.message)
    } else {
      console.log('✅ Profiles table exists (count:', count, ')')
    }
  }
  
  console.log('\n📝 Summary:')
  console.log('- Supabase URL:', supabaseUrl)
  console.log('- Project Ref: pltutlpmamxozailzffm')
  console.log('- Anon Key: ...', supabaseAnonKey.slice(-10))
}

testAuth().catch(console.error)