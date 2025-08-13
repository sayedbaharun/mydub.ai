# Admin/Backend Fixes Log - System Agent Tasks

## Priority: CRITICAL (Fix Immediately)

### 1. Database Policy Error - Infinite Recursion
**Issue**: "infinite recursion detected in policy for relation 'profiles'"
**Impact**: Users cannot access profiles, breaking core functionality

**Tasks**:
- [ ] Fix circular reference in RLS policies for profiles table
- [ ] Review and update all RLS policies for security
- [ ] Test profile CRUD operations after fix
- [ ] Add policy documentation

**SQL to Run**:
```sql
-- Drop problematic policies and recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create fixed policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Email Verification System
**Issue**: Auto-confirms emails (testing mode in production)
**Location**: `/src/features/auth/services/auth.service.ts` line 21
**Security Risk**: HIGH

**Tasks**:
- [ ] Remove auto-confirm from production
- [ ] Implement proper email verification flow
- [ ] Set up email templates in Supabase
- [ ] Add resend verification endpoint
- [ ] Test with Resend integration

**Supabase Functions to Deploy**:
```bash
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=re_V87e7eDL_AXhrRbL7U3XpEauy3LRXUqcc
```

### 3. Storage Buckets Creation
**Issue**: Storage buckets defined but not created
**Required Buckets**:
- content-images (10MB, public)
- article-images (10MB, public)
- user-avatars (5MB, public)
- content-documents (50MB, private)

**Tasks**:
- [ ] Create all storage buckets in Supabase
- [ ] Set proper file size limits
- [ ] Configure allowed MIME types
- [ ] Set up bucket policies
- [ ] Test file upload for each bucket

**SQL Commands**:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-images', 'content-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('article-images', 'article-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png']),
  ('content-documents', 'content-documents', false, 52428800, ARRAY['application/pdf', 'application/msword']);
```

## Priority: HIGH (Security & Performance)

### 4. API Rate Limiting Implementation
**Issue**: No rate limiting visible, risk of DDoS
**Tasks**:
- [ ] Configure Supabase rate limiting
- [ ] Add rate limit headers to responses
- [ ] Implement IP-based rate limiting
- [ ] Create rate limit monitoring
- [ ] Document rate limits for API users

**Implementation**:
```typescript
// Add to API middleware
const rateLimiter = {
  auth: '10 requests per minute',
  api: '100 requests per minute',
  ai: '20 requests per hour'
}
```

### 5. Security Headers & CSRF Protection
**Issue**: Missing security headers in API responses
**Tasks**:
- [ ] Add CSRF token generation
- [ ] Implement security headers middleware
- [ ] Enable CORS properly
- [ ] Add request validation
- [ ] Set up API key rotation schedule

**Vercel Configuration**:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 6. Admin Credentials Security
**Issue**: Admin credentials found in setup scripts
**Found**: admin@mydub.ai / MyDub@Admin2025!
**Risk**: CRITICAL

**Tasks**:
- [ ] Change admin password immediately
- [ ] Remove credentials from codebase
- [ ] Implement secure admin creation flow
- [ ] Add 2FA for admin accounts
- [ ] Audit all admin access logs

## Priority: MEDIUM (Data & Integration)

### 7. API Integration Error Handling
**Issue**: Hardcoded fallbacks masking API failures
**Affected APIs**: Weather, News, OpenRouter

**Tasks**:
- [ ] Remove hardcoded fallback data
- [ ] Implement proper error logging
- [ ] Add retry mechanisms with backoff
- [ ] Create API health monitoring
- [ ] Set up alerts for API failures

### 8. Database Optimization
**Issue**: Missing indexes and query optimization
**Tasks**:
- [ ] Add indexes for common queries
- [ ] Optimize news article queries
- [ ] Add database query logging
- [ ] Implement query caching
- [ ] Set up slow query alerts

**SQL Indexes to Add**:
```sql
CREATE INDEX idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

### 9. Backup and Recovery Setup
**Issue**: No automated backup visible
**Tasks**:
- [ ] Enable Supabase point-in-time recovery
- [ ] Set up daily backup schedule
- [ ] Create backup testing procedure
- [ ] Document recovery process
- [ ] Test backup restoration

### 10. Monitoring and Logging
**Issue**: Limited error tracking and monitoring
**Tasks**:
- [ ] Configure Sentry for backend errors
- [ ] Set up performance monitoring
- [ ] Create error alerting rules
- [ ] Implement audit logging
- [ ] Create monitoring dashboard

## Priority: LOW (Enhancement)

### 11. AI Content Moderation
**Issue**: No moderation for AI-generated content
**Tasks**:
- [ ] Implement content review queue
- [ ] Add profanity/spam filters
- [ ] Create moderation dashboard
- [ ] Set up auto-moderation rules
- [ ] Add manual review workflow

### 12. Payment Integration Preparation
**Issue**: Subscriber role exists but no payment system
**Tasks**:
- [ ] Research payment providers (Stripe, PayPal)
- [ ] Create subscription plans schema
- [ ] Design payment flow
- [ ] Add payment webhook endpoints
- [ ] Create billing dashboard

## Database Migrations to Run

```bash
# Run these migrations in order
supabase db push # Push latest schema
supabase db reset # Reset if needed (CAUTION: deletes data)

# Apply security fixes
supabase migrations new fix_profiles_rls
supabase migrations new create_storage_buckets
supabase migrations new add_indexes
```

## Environment Variables Check

Ensure these are set in production:
- [ ] SUPABASE_URL ✓
- [ ] SUPABASE_ANON_KEY ✓
- [ ] SUPABASE_SERVICE_ROLE_KEY ✓
- [ ] RESEND_API_KEY ✓
- [ ] OPENROUTER_API_KEY ✓
- [ ] WEATHERAPI_KEY ✓
- [ ] SENTRY_DSN ✓
- [ ] CLOUDFLARE_API_TOKEN ✓

## Security Audit Checklist

- [ ] Change all default passwords
- [ ] Review all RLS policies
- [ ] Check API endpoint authentication
- [ ] Validate all user inputs
- [ ] Review file upload restrictions
- [ ] Test SQL injection prevention
- [ ] Verify HTTPS everywhere
- [ ] Check for exposed secrets

## Deployment Checklist

Before deploying fixes:
- [ ] Run all database migrations
- [ ] Test in staging environment
- [ ] Backup production database
- [ ] Update environment variables
- [ ] Clear CDN cache
- [ ] Monitor error rates
- [ ] Have rollback plan ready
- [ ] Notify team of changes