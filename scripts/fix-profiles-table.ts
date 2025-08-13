import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixProfilesTable() {
  console.log('🔧 Starting profiles table fix...\n')

  try {
    // Step 1: Create the standard profiles table
    console.log('1️⃣ Creating standard profiles table...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create standard profiles table
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'curator', 'editor', 'admin')),
          user_type TEXT DEFAULT 'resident',
          language TEXT DEFAULT 'en',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "Admins can view all profiles" ON profiles
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        CREATE POLICY "Admins can update all profiles" ON profiles
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
      `,
    })

    if (createError) {
      throw createError
    }
    console.log('✅ Standard profiles table created')

    // Step 2: Check if user_profiles has data to migrate
    console.log('\n2️⃣ Checking for data migration...')
    const { data: userProfilesData, error: userProfilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (userProfilesError) {
      console.log('⚠️ user_profiles table not found or empty, skipping migration')
    } else if (userProfilesData && userProfilesData.length > 0) {
      console.log(`📊 Found ${userProfilesData.length} records in user_profiles`)

      // Migrate data from user_profiles to profiles
      for (const userProfile of userProfilesData) {
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: userProfile.id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
          role: userProfile.role || 'user',
          user_type: userProfile.user_type || 'resident',
          language: userProfile.language || 'en',
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at || new Date().toISOString(),
        })

        if (insertError) {
          console.error(`❌ Error migrating profile ${userProfile.id}:`, insertError)
        }
      }
      console.log('✅ Data migration completed')
    }

    // Step 3: Verify the admin user exists in profiles
    console.log('\n3️⃣ Verifying admin user in profiles...')
    const { data: adminUser, error: adminError } = await supabase.auth.admin.listUsers()

    if (adminError) {
      throw adminError
    }

    const admin = adminUser.users.find((user) => user.email === 'admin@mydub.ai')
    if (admin) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: admin.id,
        email: admin.email,
        full_name: 'MyDub Admin',
        role: 'admin',
        user_type: 'admin',
        language: 'en',
      })

      if (profileError) {
        throw profileError
      }
      console.log('✅ Admin profile ensured in profiles table')
    }

    // Step 4: Test the profiles table
    console.log('\n4️⃣ Testing profiles table...')
    const { data: profilesTest, error: testError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)

    if (testError) {
      throw testError
    }

    console.log('✅ Profiles table test successful')
    console.log(`📊 Current profiles: ${profilesTest?.length || 0}`)

    if (profilesTest && profilesTest.length > 0) {
      console.log('Sample profiles:')
      profilesTest.forEach((profile) => {
        console.log(`  - ${profile.email} (${profile.role})`)
      })
    }

    console.log('\n🎉 Profiles table fix completed successfully!')
  } catch (error) {
    console.error('❌ Error fixing profiles table:', error)
    process.exit(1)
  }
}

// Execute the function
fixProfilesTable()

export { fixProfilesTable }
