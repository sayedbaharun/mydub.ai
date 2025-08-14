import { createClient } from '@supabase/supabase-js';

// Require environment variables for security
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsAndUpdate() {
  console.log('🚀 Starting complete database update...\n');

  // Step 1: Add columns using direct SQL
  console.log('📝 Adding image attribution columns...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE news_articles 
        ADD COLUMN IF NOT EXISTS image_alt TEXT,
        ADD COLUMN IF NOT EXISTS image_credit TEXT;
      `
    });

    if (error) {
      console.log('RPC failed, trying direct approach...');
      // Let's just try updating without adding columns first
    } else {
      console.log('✅ Columns added via RPC');
    }
  } catch (err) {
    console.log('RPC not available, proceeding with direct updates...');
  }

  // Step 2: Update just the image URLs first (without attribution)
  console.log('\n📸 Updating image URLs to original images...');
  
  const imageUpdates = [
    { id: 1, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article01.jpg' },
    { id: 2, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article02.png' },
    { id: 3, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article03.jpg' },
    { id: 4, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article04.jpg' },
    { id: 5, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article05.jpg' },
    { id: 6, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article06.jpg' },
    { id: 7, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article07.png' },
    { id: 8, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article08.png' },
    { id: 9, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article09.jpg' },
    { id: 10, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article10.jpg' },
    { id: 11, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article11.jpg' },
    { id: 12, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article12.jpg' },
    { id: 13, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article13.jpg' },
    { id: 14, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article14.jpg' },
    { id: 15, url: 'https://pltutlpmamxozailzffm.supabase.co/storage/v1/object/public/article-images/original/article15.jpg' }
  ];

  const results = {
    updated: [] as number[],
    failed: [] as number[]
  };

  for (const update of imageUpdates) {
    try {
      console.log(`📸 Updating article ${update.id} image URL...`);
      
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({ image_url: update.url })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Failed to update article ${update.id}:`, updateError.message);
        results.failed.push(update.id);
      } else {
        console.log(`✅ Updated article ${update.id}`);
        results.updated.push(update.id);
      }

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`❌ Error updating article ${update.id}:`, error);
      results.failed.push(update.id);
    }
  }

  // Results
  console.log('\n🎉 Image URL Update Complete!');
  console.log(`✅ Successfully updated: ${results.updated.length} articles`);
  console.log(`❌ Failed: ${results.failed.length} articles`);

  if (results.failed.length > 0) {
    console.log('Failed articles:', results.failed.join(', '));
  }

  // Verification
  console.log('\n🔍 Verifying updated articles...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('news_articles')
    .select('id, title, image_url')
    .in('id', [1, 2, 3, 4, 5])
    .order('id');

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    return;
  }

  console.log('\n📋 Updated articles (sample):');
  verifyData?.forEach(article => {
    const isOriginal = article.image_url?.includes('supabase.co/storage/v1/object/public/article-images/original/');
    console.log(`  - Article ${article.id}: ${isOriginal ? '✅' : '❌'} ${article.title?.substring(0, 50)}...`);
    if (isOriginal) {
      console.log(`    URL: ${article.image_url}`);
    }
  });

  const originalCount = verifyData?.filter(a => 
    a.image_url?.includes('supabase.co/storage/v1/object/public/article-images/original/')
  ).length || 0;

  console.log(`\n🎉 ${originalCount} articles now using authentic TimeOut Dubai images!`);
}

addColumnsAndUpdate().catch(console.error); 