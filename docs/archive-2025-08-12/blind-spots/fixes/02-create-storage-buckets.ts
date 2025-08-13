#!/usr/bin/env tsx
/**
 * Script to create storage buckets in Supabase
 * Run with: tsx blind-spots/fixes/02-create-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Bucket configurations
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

async function createStorageBuckets() {
  console.log('🚀 Creating Storage Buckets...\n');

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBucket, error: checkError } = await supabase.storage.getBucket(bucket.id);
      
      if (checkError && checkError.message.includes('not found')) {
        // Bucket doesn't exist, create it
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (error) {
          console.error(`❌ Failed to create bucket ${bucket.name}: ${error.message}`);
        } else {
          console.log(`✅ Created bucket: ${bucket.name}`);
          console.log(`   - Public: ${bucket.public}`);
          console.log(`   - Size limit: ${bucket.fileSizeLimit / 1024 / 1024}MB`);
          console.log(`   - Allowed types: ${bucket.allowedMimeTypes.join(', ')}\n`);
        }
      } else if (existingBucket) {
        console.log(`ℹ️  Bucket already exists: ${bucket.name}`);
        
        // Optional: Update bucket settings if needed
        const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });
        
        if (updateError) {
          console.error(`   ⚠️  Could not update settings: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated settings\n`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing bucket ${bucket.name}: ${error.message}`);
    }
  }

  // List all buckets to verify
  console.log('\n📋 Verifying all buckets:');
  const { data: allBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error(`❌ Could not list buckets: ${listError.message}`);
  } else if (allBuckets) {
    console.log(`\nTotal buckets: ${allBuckets.length}`);
    allBuckets.forEach(b => {
      console.log(`- ${b.name} (${b.public ? 'public' : 'private'})`);
    });
  }

  console.log('\n✅ Storage bucket setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run the SQL script to set up bucket policies');
  console.log('2. Test file uploads in each bucket');
}

// Run the script
createStorageBuckets().catch(console.error);