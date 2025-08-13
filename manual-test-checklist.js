import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pltutlpmamxozailzffm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.4RIRul4zGoHhw54MKLNQXjbgonNHxJUfJYrkjiDAAJ8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runManualTests() {
  console.log('🧪 Running MyDub.ai Manual Test Checklist\n');
  const results = [];

  // Test 1: Check Supabase Connection
  console.log('1️⃣ Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    results.push('✅ Supabase connection working');
  } catch (error) {
    results.push(`❌ Supabase connection failed: ${error.message}`);
  }

  // Test 2: Check if admin user exists
  console.log('\n2️⃣ Checking Admin User...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('role', 'admin')
      .limit(5);
    
    if (error) throw error;
    
    if (profiles && profiles.length > 0) {
      results.push(`✅ Found ${profiles.length} admin user(s)`);
      profiles.forEach(p => console.log(`   - ${p.email} (${p.role})`));
    } else {
      results.push('⚠️ No admin users found in database');
    }
  } catch (error) {
    results.push(`❌ Admin user check failed: ${error.message}`);
  }

  // Test 3: Check News Articles
  console.log('\n3️⃣ Checking News Articles...');
  try {
    const { data: articles, count, error } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: false })
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    results.push(`✅ Found ${count || 0} news articles`);
    if (articles && articles.length > 0) {
      console.log('   Recent articles:');
      articles.forEach(a => console.log(`   - ${a.title} (${a.status})`));
    }
  } catch (error) {
    results.push(`❌ News articles check failed: ${error.message}`);
  }

  // Test 4: Check Storage Buckets
  console.log('\n4️⃣ Checking Storage Buckets...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;
    
    if (buckets && buckets.length > 0) {
      results.push(`✅ Found ${buckets.length} storage bucket(s)`);
      buckets.forEach(b => console.log(`   - ${b.name} (${b.public ? 'public' : 'private'})`));
    } else {
      results.push('⚠️ No storage buckets found');
    }
  } catch (error) {
    results.push(`❌ Storage buckets check failed: ${error.message}`);
  }

  // Test 5: Check API Health
  console.log('\n5️⃣ Checking API Health...');
  try {
    const response = await fetch('http://localhost:8001');
    if (response.ok) {
      results.push('✅ Frontend server is running');
    } else {
      results.push(`⚠️ Frontend server returned status: ${response.status}`);
    }
  } catch (error) {
    results.push('❌ Frontend server not accessible');
  }

  // Test 6: Check Content Categories
  console.log('\n6️⃣ Checking Content Categories...');
  try {
    const { data: categories, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    if (categories && categories.length > 0) {
      results.push(`✅ Found ${categories.length} content categories`);
      categories.forEach(c => console.log(`   - ${c.name} (${c.slug})`));
    } else {
      results.push('⚠️ No content categories found');
    }
  } catch (error) {
    results.push(`❌ Content categories check failed: ${error.message}`);
  }

  // Test 7: Check User Types Distribution
  console.log('\n7️⃣ Checking User Types...');
  try {
    const { data: userTypes, error } = await supabase
      .from('profiles')
      .select('user_type')
      .not('user_type', 'is', null);
    
    if (error) throw error;
    
    const typeCounts = userTypes.reduce((acc, curr) => {
      acc[curr.user_type] = (acc[curr.user_type] || 0) + 1;
      return acc;
    }, {});
    
    results.push('✅ User type distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} users`);
    });
  } catch (error) {
    results.push(`❌ User types check failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => console.log(r));

  // Recommendations
  console.log('\n📝 MANUAL TESTING CHECKLIST:');
  console.log('');
  console.log('1. [ ] Open http://localhost:8001 in browser');
  console.log('2. [ ] Try to sign in with admin@mydub.ai / MyDub@Admin2025!');
  console.log('3. [ ] Navigate to /dashboard after login');
  console.log('4. [ ] Try creating a news article');
  console.log('5. [ ] Upload an image to an article');
  console.log('6. [ ] Test the search functionality');
  console.log('7. [ ] Check responsive design (F12 → Toggle device)');
  console.log('8. [ ] Test password reset flow');
  console.log('9. [ ] Check user profile page');
  console.log('10. [ ] Verify error pages (visit /404)');
  console.log('');
  console.log('🔍 Key URLs to test:');
  console.log('   - Homepage: http://localhost:8001');
  console.log('   - Login: http://localhost:8001/auth/signin');
  console.log('   - Dashboard: http://localhost:8001/dashboard');
  console.log('   - News: http://localhost:8001/news');
  console.log('   - Search: http://localhost:8001/search');
  console.log('   - Profile: http://localhost:8001/profile');
  console.log('   - AI Assistant: http://localhost:8001/ayyan');
}

// Run the tests
runManualTests().catch(console.error);