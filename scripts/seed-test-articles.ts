#!/usr/bin/env node
/**
 * Seed 3 published test articles into `news_articles`
 * Ensures they appear in RandomReviewPanel which fetches PUBLISHED articles.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// Prefer service role if available, otherwise fall back to anon (will require insert RLS policy)
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars. Please set VITE_SUPABASE_URL and VITE_SUPABASE_[SERVICE_ROLE_KEY|ANON_KEY] in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function nowIso(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString()
}

async function run() {
  const base = `QC Test` // prefix for easy cleanup later
  const articles = [
    {
      title: `${base}: Dubai Metro Night Service Trial`,
      summary: 'RTA announces limited overnight metro service trial to gauge demand ahead of Expo expansions.',
      content:
        'The Roads and Transport Authority (RTA) has launched a limited overnight metro service trial across select stations to evaluate late-night demand ahead of Expo-related network expansions. Passenger feedback and ridership data will inform broader rollouts. Safety protocols and station staffing have been adjusted for extended hours.',
      category: 'news',
      status: 'published',
      published_at: nowIso(-10),
      tags: ['dubai', 'transport', 'rta'],
    },
    {
      title: `${base}: DIFC Fintech Accelerator Cohort Announced`,
      summary: 'DIFC reveals 15-startup fintech cohort focusing on AI risk, payments, and compliance automation.',
      content:
        'Dubai International Financial Centre (DIFC) unveiled its latest fintech accelerator cohort, featuring startups working on AI-driven risk assessment, cross‑border payments, and automated compliance. The program offers mentorship, regulatory sandboxes, and enterprise pilot access across the region.',
      category: 'business',
      status: 'published',
      published_at: nowIso(-5),
      tags: ['difc', 'fintech', 'ai'],
    },
    {
      title: `${base}: Family Guide to Dubai Creek Activities`,
      summary: 'A family-friendly guide to abra rides, heritage districts, and waterfront dining along Dubai Creek.',
      content:
        'Dubai Creek offers a blend of heritage and modern leisure. Families can explore the Al Fahidi Historical Neighbourhood, take traditional abra rides between Deira and Bur Dubai, and sample waterfront dining. Seasonal events and improved wayfinding enhance accessibility for all ages.',
      category: 'lifestyle',
      status: 'published',
      published_at: nowIso(-2),
      tags: ['family', 'dubai-creek', 'guide'],
    },
  ]

  console.log('📝 Inserting 3 published test articles into news_articles...')
  const { data, error } = await supabase
    .from('news_articles')
    .insert(
      articles.map((a) => ({
        title: a.title,
        summary: a.summary,
        content: a.content,
        category: a.category,
        status: a.status,
        published_at: a.published_at,
        tags: a.tags,
        created_at: nowIso(-11),
        updated_at: nowIso(-1),
      }))
    )
    .select('id, title, status, published_at')

  if (error) {
    console.error('❌ Insert failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Inserted articles:')
  for (const row of data || []) {
    console.log(` - ${row.title} [${row.status}] @ ${row.published_at} (id=${row.id})`)
  }

  // Quick verification: query latest published
  const { data: verify, error: vErr } = await supabase
    .from('news_articles')
    .select('id, title, status, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  if (vErr) {
    console.warn('⚠️ Verification query failed:', vErr.message)
  } else {
    console.log('\n🔎 Latest published articles:')
    for (const row of verify || []) {
      console.log(` - ${row.title} @ ${row.published_at}`)
    }
  }

  console.log('\n✨ Done. Open the Quality Control dashboard and press “Refresh” or “New Random” to sample these.')
}

run().then(() => process.exit(0)).catch((e) => {
  console.error('❌ Seed script error:', e)
  process.exit(1)
})
