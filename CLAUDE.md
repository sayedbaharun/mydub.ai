## Project Domain
- its mydub.ai not mydubai.com or mydubai.ae

---

# 🎉 Phase 1 COMPLETE - Foundation Built

**Status:** ✅ 100% Complete (19 tasks)
**See:** [PHASE_1_COMPLETION_LOG.md](./PHASE_1_COMPLETION_LOG.md) for full details

**Completed Features:**
- ✅ AI Transparency (badge, confidence scoring, human review)
- ✅ UAE AI Charter Compliance (83% compliant, 10/12 principles)
- ✅ Design System (Jony Ive aesthetic, Dubai Gold, 2,800+ lines docs)
- ✅ Privacy & Transparency (GDPR, bias monitoring, data deletion)
- ✅ UX/Performance (mobile nav, dark mode, loading states)

**Key Files:**
- Design System: `src/design-system/DESIGN_SYSTEM.md`
- Typography: `src/design-system/TYPOGRAPHY.md`
- Compliance Audit: `compliance/UAE_AI_CHARTER_2024_AUDIT.md`
- Compliance Checklist: `compliance/COMPLIANCE_CHECKLIST.md`

---

# 🎉 Phase 2 COMPLETE - Content Excellence

**Status:** ✅ 100% Complete (16/16 tasks)
**See:** [PHASE_2_COMPLETION_SUMMARY.md](./PHASE_2_COMPLETION_SUMMARY.md) for full details

**Completed Sections:**
- ✅ Phase 2.1: AI Content Generation (4/4 tasks - 100%)
  - Multi-model pipeline (GPT-4, Claude, Gemini)
  - Quality gates (5 checks, 75% threshold)
  - Content quality scoring (7 categories)
  - Human review workflow
- ✅ Phase 2.2: Multi-Source Aggregation (4/4 tasks - 100%)
  - News aggregation (7 Dubai sources)
  - Source credibility scoring (5-factor model)
  - Duplicate detection (75% threshold)
  - Source attribution & citations (APA, MLA, Chicago)
- ✅ Phase 2.3: Real-Time Updates (3/3 tasks - 100%)
  - WebSocket-based real-time updates
  - Breaking news detection (6-factor algorithm)
  - Live update UI components
- ✅ Phase 2.4: Editorial Automation (4/4 tasks - 100%)
  - Editorial workflow state machine
  - Automated fact-checking integration
  - SEO optimization suggestions
  - Publishing scheduler with timezone support

**Key Files:**
- AI Generation: `src/features/ai/services/content-generation.service.ts`
- Quality Scoring: `src/features/content/services/content-quality.service.ts`
- Real-Time Updates: `src/features/realtime/services/realtime-updates.service.ts`
- Breaking News: `src/features/alerts/services/breaking-news-alerts.service.ts`
- Fact-Checking: `src/features/fact-checking/services/fact-checking.service.ts`
- SEO Optimization: `src/features/seo/services/seo-optimization.service.ts`
- Publishing Scheduler: `src/features/publishing/services/publishing-scheduler.service.ts`

---

# Quality Control (QC) + Content Data Guide

This doc summarizes how news/articles flow, how to run end-to-end QC tests, and how to keep environments clean.

## Sources of Articles

* __Database (primary)__
  - Tables: `news_articles` (primary), `articles` (legacy)
  - Queried by `src/features/news/services/news.service.ts`

* __External API (fallback)__
  - News API via `ExternalAPIsService.fetchDubaiNews()`

* __Local hardcoded content (disabled by default)__
  - File: `src/data/news-articles.ts`
  - Loader: `src/shared/services/content-distribution.service.ts`
  - We have intentionally emptied `news-articles.ts` to avoid shipping placeholder content.

## Feature Flags (Vite env)

Configured in `.env.local`.

* __VITE_ENABLE_LOCAL_NEWS__: `false`
  - When `true`, local hardcoded articles from `contentDistributionService` are included as a fallback.
* __VITE_ENABLE_NEWS_MOCKS__: `false`
  - When `true`, returns mock items from `NewsService.getMockNewsData()` upon errors.

These flags are read in `src/features/news/services/news.service.ts`.

## QC Test Data Scripts

All scripts use Supabase credentials from `.env.local`:
`VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY` (requires permissive RLS).

* __Seed 3 published test articles__
  - Path: `scripts/seed-test-articles.ts`
  - Run: `npx tsx scripts/seed-test-articles.ts`
  - Titles prefixed with `QC Test:` for easy cleanup.

* __Cleanup seeded articles by prefix__
  - Path: `scripts/cleanup-seeded-articles.ts`
  - Preview: `npx tsx scripts/cleanup-seeded-articles.ts --dry-run`
  - Delete: `npx tsx scripts/cleanup-seeded-articles.ts`

* __Purge all articles (start clean)__
  - Path: `scripts/purge-all-articles.ts`
  - Preview: `npx tsx scripts/purge-all-articles.ts --dry-run`
  - Purge DB: `npx tsx scripts/purge-all-articles.ts`
  - Optional: add `--with-qc` to also remove `quality_reviews` if present.

## QC Dashboard Expectations

* `RandomReviewPanel` loads only `published` items (via Editorial services) and randomizes selection.
* Ensure seed script creates `status = 'published'` with realistic `published_at` timestamps.
* Alert banners and scoring will surface for items with low scores/flags.

## Required Env Vars

Add to `.env.local` as needed:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_ANON_KEY=...
VITE_ENABLE_LOCAL_NEWS=false
VITE_ENABLE_NEWS_MOCKS=false
# Optional for External APIs
VITE_NEWS_API_KEY=...
```

## Operational Notes

* __Hardcoded local news__ disabled by emptying `src/data/news-articles.ts` and gating in `news.service.ts`.
* __Do not commit real secrets__; rely on `.env.local` locally and environment config in cloud.
* __RLS__: Service role key is recommended for seeding/purging. Using anon key requires write/delete policies.

## Common Flows

1. Purge all existing test data:
   - `npx tsx scripts/purge-all-articles.ts --dry-run`
   - `npx tsx scripts/purge-all-articles.ts`
2. Seed QC test articles:
   - `npx tsx scripts/seed-test-articles.ts`
3. Verify in QC dashboard (Random Review) and alerts.
4. Cleanup afterwards:
   - `npx tsx scripts/cleanup-seeded-articles.ts --dry-run`
   - `npx tsx scripts/cleanup-seeded-articles.ts`