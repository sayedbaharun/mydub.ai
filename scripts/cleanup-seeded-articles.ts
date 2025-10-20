#!/usr/bin/env node
/**
 * Cleanup seeded test articles from `news_articles`.
 * Deletes rows whose title starts with the prefix used by seed script: "QC Test:".
 * Supports DRY_RUN mode to preview deletions.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars. Please set VITE_SUPABASE_URL and VITE_SUPABASE_[SERVICE_ROLE_KEY|ANON_KEY] in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  console.log(`🔎 Locating seeded articles (title LIKE "QC Test:%")...`)
  const { data: candidates, error: qErr } = await supabase
    .from('news_articles')
    .select('id, title, status, published_at')
    .ilike('title', 'QC Test:%')
    .order('published_at', { ascending: false })

  if (qErr) {
    console.error('❌ Query failed:', qErr.message)
    process.exit(1)
  }

  if (!candidates || candidates.length === 0) {
    console.log('ℹ️ No seeded articles found. Nothing to delete.')
    return
  }

  console.log(`Found ${candidates.length} article(s):`)
  for (const a of candidates) {
    console.log(` - ${a.title} (${a.id}) @ ${a.published_at}`)
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN enabled — no deletion performed.')
    return
  }

  console.log('\n🗑️ Deleting...')
  const ids = candidates.map((c) => c.id)
  const { error: dErr } = await supabase
    .from('news_articles')
    .delete()
    .in('id', ids)

  if (dErr) {
    console.error('❌ Delete failed:', dErr.message)
    process.exit(1)
  }

  console.log('✅ Deleted seeded articles successfully.')
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('❌ Cleanup script error:', e)
  process.exit(1)
})
