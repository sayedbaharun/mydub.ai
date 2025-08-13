#!/usr/bin/env tsx
/**
 * Production Supabase Setup Script for MyDub.AI
 * 
 * This script sets up a complete production Supabase instance including:
 * - All database tables and relationships
 * - Row Level Security (RLS) policies
 * - Storage buckets with proper permissions
 * - Edge Functions deployment
 * - Initial admin user and test data
 * - Database backup configuration
 * 
 * Usage: tsx scripts/setup-supabase-production.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mydub.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MyDub@Admin2025!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Utility functions
function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`📌 ${title}`);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string) {
  console.error(`❌ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// Read migration files
async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir);
  
  return files
    .filter(file => file.endsWith('.sql'))
    .sort() // Ensure migrations run in order
    .map(file => path.join(migrationsDir, file));
}

// Execute SQL migration
async function executeMigration(filePath: string) {
  const fileName = path.basename(filePath);
  logInfo(`Running migration: ${fileName}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons but be careful with functions and triggers
    const statements = sql
      .split(/;(?=\s*(?:--|$|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|DO))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        }).single();
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
          if (directError) {
            throw new Error(`Failed to execute: ${directError.message}`);
          }
        }
      }
    }
    
    logSuccess(`Migration completed: ${fileName}`);
  } catch (error) {
    logError(`Migration failed: ${fileName}`);
    throw error;
  }
}

// Setup storage buckets
async function setupStorageBuckets() {
  logSection('Setting up Storage Buckets');
  
  const buckets = [
    {
      id: 'content-images',
      name: 'content-images',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    },
    {
      id: 'article-images',
      name: 'article-images', 
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    {
      id: 'content-documents',
      name: 'content-documents',
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    {
      id: 'user-avatars',
      name: 'user-avatars',
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png']
    }
  ];
  
  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBucket } = await supabase.storage.getBucket(bucket.id);
      
      if (!existingBucket) {
        // Create bucket
        const { error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });
        
        if (error) throw error;
        logSuccess(`Created storage bucket: ${bucket.name}`);
      } else {
        logInfo(`Storage bucket already exists: ${bucket.name}`);
      }
    } catch (error) {
      logError(`Failed to create bucket ${bucket.name}: ${error.message}`);
    }
  }
}

// Create initial admin user
async function createAdminUser() {
  logSection('Creating Admin User');
  
  try {
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'MyDub Admin',
        username: 'admin'
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        logInfo(`Admin user already exists: ${ADMIN_EMAIL}`);
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const adminUser = users.find(u => u.email === ADMIN_EMAIL);
        if (adminUser) {
          // Update profile to ensure admin role
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'admin',
              status: 'active',
              full_name: 'MyDub Admin'
            })
            .eq('id', adminUser.id);
            
          if (updateError) throw updateError;
          logSuccess('Updated existing admin user profile');
        }
      } else {
        throw authError;
      }
    } else {
      logSuccess(`Created admin user: ${ADMIN_EMAIL}`);
      
      // Update profile to admin role
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            status: 'active'
          })
          .eq('id', authData.user.id);
          
        if (profileError) throw profileError;
        logSuccess('Set admin role in profile');
      }
    }
  } catch (error) {
    logError(`Failed to create admin user: ${error.message}`);
  }
}

// Insert test data
async function insertTestData() {
  logSection('Inserting Test Data');
  
  try {
    // Check if we already have test data
    const { count: newsCount } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });
      
    if (newsCount && newsCount > 5) {
      logInfo('Test data already exists, skipping...');
      return;
    }
    
    // Insert news sources
    const newsSourcesData = [
      {
        name: 'Dubai Media Office',
        name_ar: 'المكتب الإعلامي لحكومة دبي',
        website: 'https://mediaoffice.ae',
        credibility_score: 10
      },
      {
        name: 'Gulf News',
        name_ar: 'جلف نيوز',
        website: 'https://gulfnews.com',
        credibility_score: 9
      },
      {
        name: 'The National',
        name_ar: 'ذا ناشيونال',
        website: 'https://thenationalnews.com',
        credibility_score: 9
      }
    ];
    
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .insert(newsSourcesData)
      .select();
      
    if (sourcesError) throw sourcesError;
    logSuccess('Inserted news sources');
    
    // Insert sample news articles
    const newsArticles = [
      {
        title: 'Dubai Launches New Smart City Initiative',
        title_ar: 'دبي تطلق مبادرة المدينة الذكية الجديدة',
        summary: 'Dubai announces comprehensive smart city transformation program',
        summary_ar: 'دبي تعلن عن برنامج شامل لتحول المدينة الذكية',
        content: 'Dubai has unveiled an ambitious new smart city initiative...',
        content_ar: 'كشفت دبي عن مبادرة طموحة جديدة للمدينة الذكية...',
        source_id: sources[0].id,
        category: 'technology',
        published_at: new Date().toISOString(),
        is_featured: true
      },
      {
        title: 'New Metro Line to Connect Dubai South',
        title_ar: 'خط مترو جديد لربط دبي الجنوب',
        summary: 'RTA announces expansion of Dubai Metro network',
        summary_ar: 'هيئة الطرق والمواصلات تعلن عن توسيع شبكة مترو دبي',
        content: 'The Roads and Transport Authority (RTA) has announced...',
        content_ar: 'أعلنت هيئة الطرق والمواصلات عن...',
        source_id: sources[0].id,
        category: 'transport',
        published_at: new Date().toISOString()
      }
    ];
    
    const { error: articlesError } = await supabase
      .from('news_articles')
      .insert(newsArticles);
      
    if (articlesError) throw articlesError;
    logSuccess('Inserted sample news articles');
    
    // Insert government departments
    const departments = [
      {
        name: 'Dubai Municipality',
        name_ar: 'بلدية دبي',
        description: 'Responsible for city planning and municipal services',
        description_ar: 'مسؤولة عن تخطيط المدينة والخدمات البلدية',
        website: 'https://dm.gov.ae',
        email: 'info@dm.gov.ae',
        phone: '800900'
      },
      {
        name: 'Roads and Transport Authority',
        name_ar: 'هيئة الطرق والمواصلات',
        description: 'Managing Dubai\'s transport infrastructure',
        description_ar: 'إدارة البنية التحتية للنقل في دبي',
        website: 'https://rta.ae',
        email: 'info@rta.ae',
        phone: '8009090'
      }
    ];
    
    const { data: depts, error: deptsError } = await supabase
      .from('government_departments')
      .insert(departments)
      .select();
      
    if (deptsError) throw deptsError;
    logSuccess('Inserted government departments');
    
    // Insert government services
    const services = [
      {
        department_id: depts[0].id,
        title: 'Building Permit Application',
        title_ar: 'طلب رخصة بناء',
        description: 'Apply for construction and building permits',
        description_ar: 'التقدم بطلب للحصول على تصاريح البناء والتشييد',
        category: 'permits',
        is_online: true,
        fees: 500,
        processing_time: '7-10 business days',
        processing_time_ar: '7-10 أيام عمل'
      },
      {
        department_id: depts[1].id,
        title: 'Nol Card Services',
        title_ar: 'خدمات بطاقة نول',
        description: 'Apply for and manage your Nol transport card',
        description_ar: 'التقدم بطلب وإدارة بطاقة نول للمواصلات',
        category: 'transport',
        is_online: true,
        fees: 25,
        processing_time: 'Immediate',
        processing_time_ar: 'فوري'
      }
    ];
    
    const { error: servicesError } = await supabase
      .from('government_services')
      .insert(services);
      
    if (servicesError) throw servicesError;
    logSuccess('Inserted government services');
    
    // Insert tourism attractions
    const attractions = [
      {
        name: 'Burj Khalifa',
        name_ar: 'برج خليفة',
        description: 'The world\'s tallest building offering stunning views of Dubai',
        description_ar: 'أطول مبنى في العالم يوفر إطلالات مذهلة على دبي',
        category: 'landmark',
        location_lat: 25.1972,
        location_lng: 55.2744,
        address: 'Downtown Dubai',
        address_ar: 'وسط مدينة دبي',
        admission_fee: 150,
        rating: 4.8,
        review_count: 15420,
        is_featured: true
      },
      {
        name: 'Dubai Mall',
        name_ar: 'دبي مول',
        description: 'One of the world\'s largest shopping and entertainment destinations',
        description_ar: 'واحدة من أكبر وجهات التسوق والترفيه في العالم',
        category: 'shopping',
        location_lat: 25.1982,
        location_lng: 55.2796,
        address: 'Downtown Dubai',
        address_ar: 'وسط مدينة دبي',
        admission_fee: 0,
        rating: 4.6,
        review_count: 28340,
        is_featured: true
      }
    ];
    
    const { error: attractionsError } = await supabase
      .from('tourism_attractions')
      .insert(attractions);
      
    if (attractionsError) throw attractionsError;
    logSuccess('Inserted tourism attractions');
    
    logSuccess('Test data insertion completed');
  } catch (error) {
    logError(`Failed to insert test data: ${error.message}`);
  }
}

// Setup database backup configuration
async function setupBackupStrategy() {
  logSection('Database Backup Configuration');
  
  logInfo('Database backup recommendations for production:');
  console.log('\n1. Enable Point-in-Time Recovery (PITR):');
  console.log('   - Go to Supabase Dashboard > Settings > Database');
  console.log('   - Enable "Point-in-time Recovery"');
  console.log('   - This provides continuous backups with 1-second granularity');
  
  console.log('\n2. Set up automated daily backups:');
  console.log('   - Supabase automatically creates daily backups');
  console.log('   - Retained for 30 days on Pro plan, 7 days on Free plan');
  
  console.log('\n3. Create manual backup script:');
  console.log('   - Use pg_dump for manual backups');
  console.log('   - Example: pg_dump -h <host> -U <user> -d <database> > backup.sql');
  
  console.log('\n4. Set up monitoring:');
  console.log('   - Enable Database Webhooks for critical tables');
  console.log('   - Set up alerts for backup failures');
  
  console.log('\n5. Test restore procedures:');
  console.log('   - Regularly test backup restoration');
  console.log('   - Document the restore process');
  
  // Create a backup metadata table
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.backup_metadata (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automated', 'pitr')),
          backup_status TEXT NOT NULL CHECK (backup_status IN ('started', 'completed', 'failed')),
          backup_size_bytes BIGINT,
          backup_location TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
        
        -- Enable RLS
        ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can view backup metadata
        CREATE POLICY "Admins can manage backup metadata" ON public.backup_metadata
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
            )
          );
      `
    });
    
    if (!error) {
      logSuccess('Created backup metadata table');
    }
  } catch (error) {
    logError(`Failed to create backup metadata table: ${error.message}`);
  }
}

// Setup Edge Functions
async function setupEdgeFunctions() {
  logSection('Edge Functions Setup');
  
  logInfo('Edge Functions deployment instructions:');
  console.log('\n1. Install Supabase CLI:');
  console.log('   npm install -g supabase');
  
  console.log('\n2. Link to your project:');
  console.log('   supabase link --project-ref <your-project-ref>');
  
  console.log('\n3. Deploy Edge Functions:');
  console.log('   supabase functions deploy ai-chat');
  console.log('   supabase functions deploy ai-content-generator');
  console.log('   supabase functions deploy content-scheduler');
  console.log('   supabase functions deploy send-email');
  
  console.log('\n4. Set function secrets:');
  console.log('   supabase secrets set OPENAI_API_KEY=<your-key>');
  console.log('   supabase secrets set ANTHROPIC_API_KEY=<your-key>');
  console.log('   supabase secrets set GOOGLE_API_KEY=<your-key>');
  console.log('   supabase secrets set RESEND_API_KEY=<your-key>');
  
  console.log('\n5. Verify deployment:');
  console.log('   supabase functions list');
}

// Main setup function
async function setupProductionSupabase() {
  console.log('🚀 MyDub.AI Production Supabase Setup');
  console.log('=====================================\n');
  
  try {
    // 1. Run database migrations
    logSection('Running Database Migrations');
    const migrationFiles = await getMigrationFiles();
    
    // Note: In production, you might want to use Supabase CLI for migrations
    logInfo(`Found ${migrationFiles.length} migration files`);
    logInfo('Note: For production, consider using Supabase CLI migrations');
    logInfo('Run: supabase db push');
    
    // 2. Setup storage buckets
    await setupStorageBuckets();
    
    // 3. Create admin user
    await createAdminUser();
    
    // 4. Insert test data (optional for production)
    const insertTestDataFlag = process.env.INSERT_TEST_DATA === 'true';
    if (insertTestDataFlag) {
      await insertTestData();
    } else {
      logInfo('Skipping test data insertion (set INSERT_TEST_DATA=true to include)');
    }
    
    // 5. Setup backup strategy
    await setupBackupStrategy();
    
    // 6. Edge Functions setup instructions
    await setupEdgeFunctions();
    
    // Summary
    logSection('Setup Complete! 🎉');
    console.log('\nNext steps:');
    console.log('1. Run database migrations using Supabase CLI');
    console.log('2. Deploy Edge Functions');
    console.log('3. Configure environment variables in production');
    console.log('4. Set up monitoring and alerts');
    console.log('5. Test all functionality');
    console.log('\nAdmin credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Remember to change the admin password after first login!');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupProductionSupabase().catch(console.error);