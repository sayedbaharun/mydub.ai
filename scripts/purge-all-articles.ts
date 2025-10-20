#!/usr/bin/env node
/**
 * Purge ALL articles from database to start clean.
 * Tables targeted:
 *  - news_articles (primary)
 *  - articles (legacy/fallback)
 * Optionally purges related quality review tables if requested.
 *
 * Usage:
 *  npx tsx scripts/purge-all-articles.ts            # purge news_articles and articles
 *  npx tsx scripts/purge-all-articles.ts --with-qc  # also purge quality_reviews
 *  npx tsx scripts/purge-all-articles.ts --dry-run  # preview only
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
const DRY_RUN = process.argv.includes('--dry-run')
const WITH_QC = process.argv.includes('--with-qc')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function count(table: string) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

async function purgeTable(table: string) {
  const existing = await count(table)
  console.log(`• ${table}: ${existing} rows`)
  if (DRY_RUN) return
  if (existing > 0) {
    // Fetch IDs explicitly to avoid UUID comparison issues
    const { data: rows, error: selErr } = await supabase.from(table).select('id')
    if (selErr) throw selErr
    const ids = (rows || []).map((r: any) => r.id).filter(Boolean)
    if (ids.length === 0) return
    const { error } = await supabase.from(table).delete().in('id', ids)
    if (error) throw error
    console.log(`  -> Deleted ${ids.length} from ${table}`)
  }
}

async function run() {
  console.log('⚠️  PURGE START: news content tables')
  console.log(DRY_RUN ? 'Mode: DRY RUN (no deletions will occur)\n' : 'Mode: LIVE\n')

  // Order matters if there are FKs; try QC reviews first
  if (WITH_QC) {
    try {
      await purgeTable('quality_reviews')
    } catch (e) {
      console.warn('  (warning) Could not purge quality_reviews:', (e as any).message)
    }
  }

  // Primary tables
  await purgeTable('news_articles')

  // Legacy/fallback table used in news.service.ts
  try {
    await purgeTable('articles')
  } catch (e) {
    console.warn('  (warning) Could not purge articles (table may not exist):', (e as any).message)
  }

  console.log('\n✅ PURGE COMPLETE')
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('❌ Purge error:', e)
  process.exit(1)
})
