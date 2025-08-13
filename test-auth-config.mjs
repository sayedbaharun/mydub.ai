// Check Supabase auth configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwOTg1NiwiZXhwIjoyMDY1NTg1ODU2fQ.d7XUUomKbSUpk3oMJLeeG7SmsJJ2FIWebYM5Kif8h_s'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAuthConfig() {
  console.log('Checking Supabase Auth Configuration...\n')
  
  // Check if email auth is enabled
  console.log('Testing auth methods...')
  
  // Try to create a magic link for testing
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'test@mydub.ai',
  })
  
  if (linkError) {
    console.error('❌ Magic link generation failed:', linkError.message)
  } else {
    console.log('✅ Magic link can be generated')
  }
  
  // Get user details to check status
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
    'b715cecd-7da3-44ee-94ec-c2d595797e56'
  )
  
  if (userError) {
    console.error('❌ Could not fetch user:', userError.message)
  } else {
    console.log('\n📧 User Details:')
    console.log('- Email:', userData.user.email)
    console.log('- Confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No')
    console.log('- Banned:', userData.user.banned_until ? 'Yes' : 'No')
    console.log('- Created:', new Date(userData.user.created_at).toLocaleString())
    console.log('- Last Sign In:', userData.user.last_sign_in_at ? new Date(userData.user.last_sign_in_at).toLocaleString() : 'Never')
    console.log('- Auth Provider:', userData.user.app_metadata.provider || 'email')
  }
  
  // Try to directly authenticate using service key
  console.log('\n🔐 Testing direct authentication...')
  
  // Create a test session
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
    email: 'temp-' + Date.now() + '@test.com',
    password: 'TempPass123!',
    email_confirm: true
  })
  
  if (sessionError) {
    console.log('⚠️ Could not create temp user:', sessionError.message)
  } else {
    console.log('✅ Can create users with password auth')
    // Clean up
    await supabase.auth.admin.deleteUser(sessionData.user.id)
  }
  
  console.log('\n📝 Potential Issues:')
  console.log('1. The anon key might have different permissions')
  console.log('2. Email/password auth might be disabled in Supabase dashboard')
  console.log('3. There might be auth rate limiting')
  console.log('4. The project might have custom auth settings')
}

checkAuthConfig().catch(console.error)