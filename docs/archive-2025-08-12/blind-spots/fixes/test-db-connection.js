import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  try {
    // Test 1: Check if we can query profiles (this should fail with recursion error)
    console.log('1️⃣ Testing profiles table access...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profileError) {
      console.log(`❌ Profile access error: ${profileError.message}`);
      if (profileError.message.includes('infinite recursion')) {
        console.log('✅ Confirmed: RLS policy issue exists\n');
      }
    } else {
      console.log(`✅ Profiles accessible: ${profiles?.length || 0} found\n`);
    }

    // Test 2: Check storage buckets
    console.log('2️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log(`❌ Cannot list buckets: ${bucketError.message}`);
    } else {
      console.log(`📦 Current buckets: ${buckets?.length || 0}`);
      buckets?.forEach(b => console.log(`   - ${b.name}`));
    }

    console.log('\n✅ Connection test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();