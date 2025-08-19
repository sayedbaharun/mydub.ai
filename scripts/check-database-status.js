#!/usr/bin/env node

/**
 * Database Status Check Script
 * Verifies the current state of the Supabase database
 */

async function checkDatabaseStatus() {
  const SUPABASE_URL = 'https://pltutlpmamxozailzffm.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.4RIRul4zGoHhw54MKLNQXjbgonNHxJUfJYrkjiDAAJ8';

  console.log('🔍 Checking MyDub.AI Database Status...\n');
  console.log('================================\n');

  // Tables to check
  const tablesToCheck = [
    'profiles',
    'articles', 
    'news_articles',
    'government_services',
    'tourism_attractions',
    'chat_sessions',
    'chat_messages',
    'ai_agents',
    'user_preferences',
    'admin_users'
  ];

  const results = {
    tables: {},
    admins: [],
    content: {},
    totalRecords: 0
  };

  for (const table of tablesToCheck) {
    try {
      console.log(`Checking table: ${table}...`);
      
      // Check if table exists and get count
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Range': '0-0',
            'Prefer': 'count=exact'
          }
        }
      );

      if (response.ok) {
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        results.tables[table] = { exists: true, count };
        results.totalRecords += count;
        console.log(`  ✅ ${table}: ${count} records`);
      } else if (response.status === 404 || response.status === 400) {
        results.tables[table] = { exists: false, count: 0 };
        console.log(`  ❌ ${table}: Table not found`);
      } else {
        console.log(`  ⚠️  ${table}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${table}: Failed to check - ${error.message}`);
    }
  }

  // Check for admin users specifically
  console.log('\n📊 Checking for admin users...');
  try {
    const adminResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?role=eq.admin&select=email,full_name,created_at`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (adminResponse.ok) {
      const admins = await adminResponse.json();
      results.admins = admins;
      if (admins.length > 0) {
        console.log(`  ✅ Found ${admins.length} admin user(s):`);
        admins.forEach(admin => {
          console.log(`     - ${admin.email || 'No email'} (${admin.full_name || 'No name'})`);
        });
      } else {
        console.log('  ⚠️  No admin users found');
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to check admins: ${error.message}`);
  }

  // Summary
  console.log('\n================================');
  console.log('📈 DATABASE STATUS SUMMARY\n');
  
  const existingTables = Object.entries(results.tables)
    .filter(([_, info]) => info.exists)
    .map(([name, info]) => `${name} (${info.count})`);
  
  const missingTables = Object.entries(results.tables)
    .filter(([_, info]) => !info.exists)
    .map(([name]) => name);

  console.log(`✅ Existing Tables (${existingTables.length}/${tablesToCheck.length}):`);
  existingTables.forEach(table => console.log(`   - ${table}`));
  
  if (missingTables.length > 0) {
    console.log(`\n❌ Missing Tables (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`   - ${table}`));
  }

  console.log(`\n📊 Total Records: ${results.totalRecords}`);
  console.log(`👤 Admin Users: ${results.admins.length}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (missingTables.length > 0) {
    console.log('1. Run database migrations to create missing tables');
    console.log('   Command: npm run db:push');
  }
  
  if (results.admins.length === 0) {
    console.log('2. Create at least one admin user');
    console.log('   Command: npm run manage-admins add your-email@example.com');
  }
  
  if (results.totalRecords < 10) {
    console.log('3. Seed database with initial content');
    console.log('   Command: npm run seed-database');
  }
  
  if (missingTables.length === 0 && results.admins.length > 0 && results.totalRecords > 10) {
    console.log('✅ Database appears to be properly configured and ready for production!');
  }

  console.log('\n================================\n');
}

// Run the check
checkDatabaseStatus().catch(console.error);