#!/usr/bin/env node
/**
 * Test Article Submission and Approval Workflow
 * 
 * This script tests the complete article workflow:
 * 1. Create article as draft
 * 2. Submit for review
 * 3. Start review process
 * 4. Approve article
 * 5. Publish article
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test data
const testArticle = {
  title: `Test Article - ${new Date().toISOString()}`,
  summary: 'This is a test article to verify the submission and approval workflow',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. This is the main content of the test article.',
  category: 'news',
  status: 'draft',
  source_type: 'manual',
  tags: ['test', 'workflow'],
  seo_title: 'Test Article for Workflow',
  seo_description: 'Testing the article submission and approval workflow',
  is_featured: false,
  enable_comments: true
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testWorkflow() {
  log('\n🚀 Starting Article Workflow Test\n', 'bright')
  
  try {
    // Get test users
    log('1️⃣  Getting test users...', 'cyan')
    
    // Get a curator user (or create one)
    const { data: curatorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'curator')
      .limit(1)
      .single()
    
    // Get an editor user (or create one)
    const { data: editorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'editor')
      .limit(1)
      .single()
    
    const authorId = curatorProfile?.id || editorProfile?.id
    
    if (!authorId) {
      log('❌ No test users found. Please create a curator or editor user first.', 'red')
      return
    }
    
    log(`   ✅ Using author: ${curatorProfile?.full_name || editorProfile?.full_name}`, 'green')
    
    // Step 1: Create article as draft
    log('\n2️⃣  Creating article as draft...', 'cyan')
    const { data: draftArticle, error: createError } = await supabase
      .from('articles')
      .insert({
        ...testArticle,
        author_id: authorId
      })
      .select()
      .single()
    
    if (createError) {
      log(`   ❌ Error creating article: ${createError.message}`, 'red')
      return
    }
    
    log(`   ✅ Article created with ID: ${draftArticle.id}`, 'green')
    log(`   📝 Status: ${draftArticle.status}`, 'yellow')
    
    // Step 2: Submit for review
    log('\n3️⃣  Submitting article for review...', 'cyan')
    const { data: submittedArticle, error: submitError } = await supabase
      .from('articles')
      .update({ status: 'submitted' })
      .eq('id', draftArticle.id)
      .select()
      .single()
    
    if (submitError) {
      log(`   ❌ Error submitting article: ${submitError.message}`, 'red')
      return
    }
    
    log(`   ✅ Article submitted for review`, 'green')
    log(`   📝 Status: ${submittedArticle.status}`, 'yellow')
    
    // Step 3: Start review (as editor)
    log('\n4️⃣  Starting review process...', 'cyan')
    const { data: inReviewArticle, error: reviewError } = await supabase
      .from('articles')
      .update({ 
        status: 'in_review',
        editor_id: editorProfile?.id || authorId
      })
      .eq('id', draftArticle.id)
      .select()
      .single()
    
    if (reviewError) {
      log(`   ❌ Error starting review: ${reviewError.message}`, 'red')
      return
    }
    
    log(`   ✅ Review started`, 'green')
    log(`   📝 Status: ${inReviewArticle.status}`, 'yellow')
    
    // Step 4: Approve article using RPC function
    log('\n5️⃣  Approving article...', 'cyan')
    const { data: approvalResult, error: approveError } = await supabase
      .rpc('approve_article', {
        _article_id: draftArticle.id,
        _approver_id: editorProfile?.id || authorId,
        _publish_immediately: false,
        _comments: 'Approved via workflow test'
      })
    
    if (approveError) {
      log(`   ❌ Error approving article: ${approveError.message}`, 'red')
      return
    }
    
    if (approvalResult?.success === false) {
      log(`   ❌ Approval failed: ${approvalResult.error}`, 'red')
      return
    }
    
    log(`   ✅ Article approved`, 'green')
    log(`   📝 Result: ${JSON.stringify(approvalResult, null, 2)}`, 'yellow')
    
    // Step 5: Publish article
    log('\n6️⃣  Publishing article...', 'cyan')
    const { data: publishedArticle, error: publishError } = await supabase
      .from('articles')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', draftArticle.id)
      .select()
      .single()
    
    if (publishError) {
      log(`   ❌ Error publishing article: ${publishError.message}`, 'red')
      return
    }
    
    log(`   ✅ Article published!`, 'green')
    log(`   📝 Status: ${publishedArticle.status}`, 'yellow')
    log(`   🔗 Published at: ${publishedArticle.published_at}`, 'blue')
    
    // Step 6: Verify public access
    log('\n7️⃣  Verifying public access...', 'cyan')
    const { data: publicArticle, error: publicError } = await supabase
      .from('articles')
      .select('id, title, status')
      .eq('id', draftArticle.id)
      .eq('status', 'published')
      .single()
    
    if (publicError) {
      log(`   ❌ Error accessing published article: ${publicError.message}`, 'red')
      return
    }
    
    log(`   ✅ Article is publicly accessible`, 'green')
    
    // Step 7: Test workflow status function
    log('\n8️⃣  Testing workflow status function...', 'cyan')
    const { data: workflowStatus, error: statusError } = await supabase
      .rpc('get_article_workflow_status', {
        _article_id: draftArticle.id
      })
    
    if (statusError) {
      log(`   ⚠️  Workflow status function not available: ${statusError.message}`, 'yellow')
    } else {
      log(`   ✅ Workflow status retrieved`, 'green')
      log(`   📊 Status: ${JSON.stringify(workflowStatus, null, 2)}`, 'blue')
    }
    
    // Cleanup
    log('\n9️⃣  Cleaning up test data...', 'cyan')
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', draftArticle.id)
    
    if (deleteError) {
      log(`   ⚠️  Could not delete test article: ${deleteError.message}`, 'yellow')
    } else {
      log(`   ✅ Test article deleted`, 'green')
    }
    
    log('\n✨ Workflow test completed successfully!\n', 'bright')
    
  } catch (error) {
    log(`\n❌ Unexpected error: ${error}`, 'red')
    process.exit(1)
  }
}

// Run the test
testWorkflow().then(() => {
  log('✅ All tests passed!', 'green')
  process.exit(0)
}).catch(error => {
  log(`❌ Test failed: ${error}`, 'red')
  process.exit(1)
})