// Reset password for test user
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pltutlpmamxozailzffm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwOTg1NiwiZXhwIjoyMDY1NTg1ODU2fQ.d7XUUomKbSUpk3oMJLeeG7SmsJJ2FIWebYM5Kif8h_s'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  console.log('Resetting password for test@mydub.ai...\n')
  
  // Update the user's password
  const { data, error } = await supabase.auth.admin.updateUserById(
    'b715cecd-7da3-44ee-94ec-c2d595797e56',
    { password: 'Test123456!' }
  )
  
  if (error) {
    console.error('❌ Failed to reset password:', error.message)
  } else {
    console.log('✅ Password reset successfully!')
    console.log('\n📧 Login credentials:')
    console.log('Email: test@mydub.ai')
    console.log('Password: Test123456!')
    console.log('\nYou can now login at http://localhost:8001/auth/signin')
  }
}

resetPassword().catch(console.error)