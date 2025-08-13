# Article Submission and Approval Workflow - Fixed

## Overview
The article submission and approval workflow has been comprehensively fixed to ensure smooth operation from article creation through publication.

## What Was Fixed

### 1. Database Schema (✅ Complete)
- **Articles Table**: Ensured all required columns exist
- **Status Constraints**: Updated to support all workflow states
- **Editor Tracking**: Added `editor_id` column to track who approved/edited
- **Content Approvals**: Created audit trail table for approval history

### 2. RPC Functions (✅ Complete)
Created three essential RPC functions:
- `approve_article(_article_id, _approver_id, _publish_immediately, _comments)`
- `reject_article(_article_id, _approver_id, _reason, _comments)`
- `get_article_workflow_status(_article_id)`

### 3. RLS Policies (✅ Complete)
Comprehensive policies for role-based access:
- **Public**: Can view published articles only
- **Authors**: Can create, edit own drafts, submit for review
- **Curators**: Can review submitted articles
- **Editors**: Can approve, reject, and publish
- **Admins**: Full access to all operations

### 4. Status Flow (✅ Complete)
```
draft → submitted → in_review → approved → published
         ↓             ↓           ↓
      rejected     rejected    rejected
```

## How to Use

### 1. Apply Database Migrations
```bash
# Apply the new RPC functions migration
npx supabase db push

# Or manually in Supabase SQL Editor:
# 1. Run: supabase/migrations/20250807_fix_article_submission_flow_v2.sql
# 2. Run: supabase/migrations/20250809_fix_approval_rpc_functions.sql
```

### 2. Test the Workflow
```bash
# Run the automated test
npm run test:workflow

# This will:
# - Create a test article
# - Submit it for review
# - Approve it
# - Publish it
# - Verify public access
# - Clean up test data
```

### 3. Manual Workflow Steps

#### As a Curator/Author:
1. **Create Article**: 
   - Go to Dashboard → Article Management
   - Click "Create Article"
   - Fill in details
   - Save as Draft or Submit for Review

2. **Submit for Review**:
   - Find your draft article
   - Click "Submit" button
   - Article status changes to "submitted"

#### As an Editor/Admin:
3. **Review Article**:
   - Go to Dashboard → Article Management
   - Find submitted articles (filter by status)
   - Click "Start Review"
   - Article status changes to "in_review"

4. **Approve/Reject**:
   - For approval: Click "Approve" 
   - For rejection: Click "Reject" with reason
   - Article status changes accordingly

5. **Publish**:
   - Find approved articles
   - Click "Publish" button
   - Article becomes publicly visible

## Frontend Components

### ArticleCreateForm.tsx
- Location: `/src/features/dashboard/components/ArticleCreateForm.tsx`
- Creates articles with status 'draft' or 'submitted'
- Handles all metadata, SEO, and multilingual content

### ArticleManagementDashboard.tsx
- Location: `/src/features/dashboard/components/ArticleManagementDashboard.tsx`
- Shows all articles with filtering
- Status transition buttons based on user role
- Real-time status updates

### contentApproval.service.ts
- Location: `/src/features/content-approval/services/contentApproval.service.ts`
- Calls RPC functions for approval/rejection
- Handles approval queue and statistics

## Status Values

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `draft` | Initial creation state | Authors |
| `submitted` | Ready for review | Authors |
| `in_review` | Being reviewed | Editors, Curators |
| `approved` | Approved, awaiting publish | Editors |
| `published` | Live and public | Editors, Admins |
| `rejected` | Needs revision | Editors, Curators |
| `archived` | Removed from public | Editors, Admins |
| `scheduled` | Set for future publish | Editors |

## Permissions Matrix

| Role | Create | Edit Own | Edit All | Submit | Review | Approve | Publish | Delete |
|------|--------|----------|----------|--------|--------|---------|---------|--------|
| User | ✅ | ✅ (draft) | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ (draft) |
| Curator | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ (own) |
| Editor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## API Reference

### approve_article
```typescript
const { data, error } = await supabase.rpc('approve_article', {
  _article_id: 'uuid',
  _approver_id: 'uuid', 
  _publish_immediately: false,
  _comments: 'Optional approval notes'
})

// Response:
{
  success: true,
  message: 'Article approved',
  article_id: 'uuid',
  new_status: 'approved'
}
```

### reject_article
```typescript
const { data, error } = await supabase.rpc('reject_article', {
  _article_id: 'uuid',
  _approver_id: 'uuid',
  _reason: 'Rejection reason',
  _comments: 'Optional notes'
})

// Response:
{
  success: true,
  message: 'Article rejected',
  article_id: 'uuid',
  reason: 'Rejection reason'
}
```

### get_article_workflow_status
```typescript
const { data, error } = await supabase.rpc('get_article_workflow_status', {
  _article_id: 'uuid'
})

// Response:
{
  success: true,
  article: { ... },
  permissions: {
    can_edit: boolean,
    can_approve: boolean,
    can_publish: boolean,
    can_delete: boolean
  },
  next_actions: ['approve', 'reject', ...]
}
```

## Troubleshooting

### Common Issues

1. **"Insufficient permissions" error**
   - Check user role in profiles table
   - Ensure RLS policies are enabled
   - Verify user is authenticated

2. **Status transition not working**
   - Check current article status
   - Verify user has permission for that transition
   - Look for console errors

3. **RPC function not found**
   - Run the migration scripts
   - Check Supabase dashboard for function existence
   - Verify function permissions

### Debug Commands

```sql
-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Check article status
SELECT id, title, status, author_id, editor_id 
FROM articles 
WHERE id = 'article-uuid';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'articles';

-- Check RPC functions
SELECT proname FROM pg_proc 
WHERE proname IN ('approve_article', 'reject_article');
```

## Testing Checklist

- [ ] Create article as draft
- [ ] Edit draft article
- [ ] Submit article for review
- [ ] Start review process
- [ ] Approve article
- [ ] Publish article
- [ ] Verify public access
- [ ] Reject article
- [ ] Archive published article
- [ ] Delete draft article

## Next Steps

1. **Monitor Usage**: Check Supabase logs for any errors
2. **Add Features**: 
   - Email notifications on status changes
   - Bulk operations for multiple articles
   - Scheduled publishing
3. **Optimize**: 
   - Add caching for published articles
   - Implement full-text search
   - Add analytics tracking

## Support

If issues persist:
1. Check browser console for errors
2. Review Supabase logs
3. Run `npm run test:workflow` to verify backend
4. Check this documentation for updates