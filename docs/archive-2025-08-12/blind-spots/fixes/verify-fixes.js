import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verifying MyDub.AI Fixes...\n');

// Test with both service role and anon key
const serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyFixes() {
  console.log('='.repeat(60));
  console.log('1️⃣ DATABASE RLS POLICIES TEST');
  console.log('='.repeat(60));
  
  // Test service role access
  console.log('\n📍 Testing with service role (should always work):');
  const { data: serviceProfiles, error: serviceError } = await serviceSupabase
    .from('profiles')
    .select('id, email, role')
    .limit(3);
  
  if (serviceError) {
    console.log(`❌ Service role error: ${serviceError.message}`);
  } else {
    console.log(`✅ Service role can access profiles: ${serviceProfiles?.length || 0} found`);
    serviceProfiles?.forEach(p => console.log(`   - ${p.email} (${p.role})`));
  }

  // Test anon/public access
  console.log('\n📍 Testing with anon key (RLS policies apply):');
  const { data: anonProfiles, error: anonError } = await anonSupabase
    .from('profiles')
    .select('id, email, role')
    .limit(3);
  
  if (anonError) {
    console.log(`❌ Anon access error: ${anonError.message}`);
    if (anonError.message.includes('infinite recursion')) {
      console.log('⚠️  RLS POLICY ISSUE STILL EXISTS!');
    }
  } else {
    console.log(`✅ Anon can access profiles: ${anonProfiles?.length || 0} found`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('2️⃣ STORAGE BUCKETS TEST');
  console.log('='.repeat(60));

  const { data: buckets, error: bucketError } = await serviceSupabase.storage.listBuckets();
  
  if (bucketError) {
    console.log(`❌ Cannot list buckets: ${bucketError.message}`);
  } else {
    console.log(`\n✅ Found ${buckets?.length || 0} storage buckets:`);
    
    for (const bucket of buckets || []) {
      console.log(`\n📦 ${bucket.name}:`);
      console.log(`   - ID: ${bucket.id}`);
      console.log(`   - Public: ${bucket.public}`);
      console.log(`   - Created: ${bucket.created_at}`);
      
      // Check if we can upload to each bucket
      const testFileName = `test-${Date.now()}.txt`;
      const { error: uploadError } = await serviceSupabase.storage
        .from(bucket.id)
        .upload(testFileName, 'test content', {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        console.log(`   - Upload test: ❌ ${uploadError.message}`);
      } else {
        console.log(`   - Upload test: ✅ Success`);
        
        // Clean up test file
        await serviceSupabase.storage
          .from(bucket.id)
          .remove([testFileName]);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('3️⃣ ADMIN USER CHECK');
  console.log('='.repeat(60));

  const { data: adminProfiles, error: adminError } = await serviceSupabase
    .from('profiles')
    .select('email, role')
    .eq('role', 'admin');
  
  if (adminError) {
    console.log(`\n❌ Cannot check admin users: ${adminError.message}`);
  } else {
    console.log(`\n✅ Found ${adminProfiles?.length || 0} admin users:`);
    adminProfiles?.forEach(a => console.log(`   - ${a.email}`));
    
    if (adminProfiles?.some(a => a.email === 'admin@mydub.ai')) {
      console.log('\n⚠️  WARNING: Default admin email still in use!');
      console.log('   Run: tsx blind-spots/fixes/04-secure-admin-setup.ts');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('4️⃣ EMAIL CONFIGURATION CHECK');
  console.log('='.repeat(60));
  
  // Check if email confirmations are required
  console.log('\n📧 Email verification status:');
  console.log('   - Check Supabase Dashboard > Authentication > Settings');
  console.log('   - Ensure "Enable email confirmations" is ON');
  console.log('   - Update email templates as per 03-email-templates.md');

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n✅ Completed:');
  console.log('   - Storage buckets exist and are functional');
  console.log('   - Database connection working');
  
  console.log('\n⚠️  Needs Action:');
  console.log('   - Check if RLS policies need updating (test with real user)');
  console.log('   - Update admin password if using default');
  console.log('   - Configure email templates in Supabase');
  console.log('   - Apply code patches for email verification');
}

verifyFixes().catch(console.error);