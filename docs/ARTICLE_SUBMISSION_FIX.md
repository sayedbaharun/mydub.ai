# Article Submission and Publishing Flow - Fix Documentation

## Issues Identified and Fixed

### 1. Status Value Mismatch
**Problem**: ArticleCreateForm was using `pending_review` status, but the database only allowed specific values.
**Solution**: 
- Updated form to use `submitted` status
- Added `pending_review` to database constraints for backward compatibility
- Updated type definitions to support both values

### 2. Table Name Inconsistency
**Problem**: Mixed usage of `articles` and `news_articles` table names across the codebase.
**Solution**: 
- Standardized on `articles` as the main table
- Created `news_articles` view for backward compatibility
- No need to update existing code references

### 3. Missing Database Columns
**Problem**: SEO and publishing option columns were missing from the articles table.
**Solution**: Added columns:
- `seo_title`, `seo_description`, `seo_keywords`
- `is_featured`, `is_breaking_news`, `enable_comments`

### 4. RLS Policy Issues
**Problem**: Incomplete or incorrect Row Level Security policies preventing proper article operations.
**Solution**: Created comprehensive RLS policies for:
- Public viewing of published articles
- User creation and editing of own articles
- Admin/editor/curator approval workflows
- Proper role-based permissions

## Files Modified

### Database
- `/supabase/migrations/20250807_fix_article_submission_flow.sql` - Main migration file with all fixes

### Frontend Components
- `/src/features/dashboard/components/ArticleCreateForm.tsx` - Updated status values from `pending_review` to `submitted`

### Type Definitions
- `/src/shared/types/article-status.ts` - Added `PENDING_REVIEW` as alias for backward compatibility

### Scripts
- `/scripts/apply-article-fix.sh` - Deployment script for applying fixes

### Tests
- `/src/test/article-submission.test.tsx` - Comprehensive test suite for validation

## How to Apply the Fixes

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/supabase/migrations/20250807_fix_article_submission_flow.sql`
4. Paste and run the SQL

### Option 2: Using the Script
```bash
# Make script executable
chmod +x scripts/apply-article-fix.sh

# Run the script for instructions
./scripts/apply-article-fix.sh
```

### Option 3: Supabase CLI
```bash
# If you have the database password
npx supabase db push --db-url 'postgresql://postgres:[PASSWORD]@db.pltutlpmamxozailzffm.supabase.co:5432/postgres'
```

## Article Status Flow

The corrected flow is:
```
draft → submitted/pending_review → in_review → approved → published
         ↓                          ↓            ↓
      archived              needs_revision   scheduled
                                 ↓
                              rejected
```

## Testing the Fix

### 1. Create Article
- Login as any authenticated user
- Go to dashboard
- Click "Create Article"
- Fill in required fields (title, summary, content)
- Click "Save as Draft" or "Submit for Review"

### 2. Review Article (Admin/Editor/Curator)
- Login as admin/editor/curator
- Go to approval queue
- Review submitted articles
- Approve or reject with comments

### 3. Publish Article (Admin/Editor)
- Login as admin/editor
- Find approved articles
- Click publish
- Verify article appears publicly

## Key Functions Added

### Database Functions
- `submit_article_for_review(article_id)` - Submit article for review
- `approve_article(article_id, comments)` - Approve article with optional comments
- `publish_article(article_id)` - Publish approved article
- `generate_article_slug()` - Auto-generate URL slugs

### Triggers
- `update_articles_updated_at` - Auto-update timestamps
- `generate_article_slug_trigger` - Auto-generate slugs

## Backward Compatibility

### Maintained Support For:
- `pending_review` status (mapped to `submitted`)
- `news_articles` table references (view created)
- All existing API calls and components

### No Breaking Changes
- All existing code continues to work
- New code can use either naming convention
- Gradual migration possible

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] Users can create draft articles
- [ ] Users can submit articles for review
- [ ] Admins/editors can see submitted articles
- [ ] Approval workflow functions correctly
- [ ] Articles can be published
- [ ] Published articles are publicly visible
- [ ] SEO fields are saved correctly
- [ ] Multilingual content works
- [ ] Tags and categories function properly

## Troubleshooting

### If article creation fails:
1. Check browser console for errors
2. Verify user is authenticated
3. Ensure all required fields are filled
4. Check Supabase logs for RLS policy violations

### If approval doesn't work:
1. Verify user has correct role (admin/editor/curator)
2. Check article is in correct status
3. Review RLS policies in Supabase dashboard

### If published articles don't appear:
1. Verify status is 'published'
2. Check published_at timestamp is set
3. Review public viewing policies

## Future Improvements

1. **Add versioning**: Track article revision history
2. **Enhance notifications**: Real-time updates on status changes
3. **Bulk operations**: Approve/reject multiple articles
4. **Scheduled publishing**: Automated publication at set times
5. **Content templates**: Predefined article structures

## Support

For issues or questions:
1. Check Supabase logs for detailed errors
2. Review browser console for frontend issues
3. Verify all migrations were applied
4. Test with the provided test suite