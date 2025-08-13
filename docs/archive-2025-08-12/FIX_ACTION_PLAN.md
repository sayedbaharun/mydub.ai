# MyDub.AI Fix Action Plan

## 🚨 IMMEDIATE ACTIONS (Day 1)

### 1. Fix Database Policy Error (2 hours)
```bash
# Connect to Supabase SQL editor and run:
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Create Storage Buckets (1 hour)
```bash
# Run the setup script
cd /path/to/project
tsx scripts/setup-supabase-production.ts

# Or manually in Supabase dashboard:
# Create buckets: content-images, article-images, user-avatars, content-documents
```

### 3. Change Admin Password (30 mins)
```sql
-- In Supabase dashboard
-- 1. Go to Authentication > Users
-- 2. Find admin@mydub.ai
-- 3. Reset password
-- 4. Update .env.local with new password
```

### 4. Remove Auto-Email Confirmation (1 hour)
```typescript
// In src/features/auth/services/auth.service.ts
// Remove line 21 comment about auto-confirm
// Change email_confirm: true to false in signUp options
```

## 📅 DAY 2 TASKS

### 5. Implement Email Verification (3 hours)
```bash
# Deploy email function
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=re_V87e7eDL_AXhrRbL7U3XpEauy3LRXUqcc

# Update email templates in Supabase dashboard
```

### 6. Add Security Headers (2 hours)
Create `vercel.json`:
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

### 7. Add Database Indexes (1 hour)
```sql
CREATE INDEX idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

## 📅 DAY 3 TASKS

### 8. Set Up Rate Limiting (3 hours)
- Configure in Supabase dashboard
- Add middleware for API routes
- Test with load testing tool

### 9. Enable Monitoring (2 hours)
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
# Set SENTRY_DSN in .env
```

### 10. Set Up Backups (1 hour)
- Enable Point-in-Time Recovery in Supabase
- Configure daily backups
- Document recovery procedure

## 🔧 TESTING CHECKLIST

After each fix:
- [ ] Test user registration flow
- [ ] Test admin login
- [ ] Test file uploads
- [ ] Test profile updates
- [ ] Check error logs

## 📊 VERIFICATION STEPS

### Day 1 Verification
```bash
# Test profile access
curl -X GET https://pltutlpmamxozailzffm.supabase.co/rest/v1/profiles \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT"

# Test storage buckets
curl -X GET https://pltutlpmamxozailzffm.supabase.co/storage/v1/bucket \
  -H "apikey: YOUR_ANON_KEY"
```

### Day 2 Verification
- Send test email verification
- Check security headers response
- Query performance with indexes

### Day 3 Verification
- Load test rate limiting
- Check Sentry error tracking
- Test backup restoration

## 🚀 DEPLOYMENT PROCESS

1. **Pre-deployment**
   ```bash
   # Backup current database
   supabase db dump > backup-$(date +%Y%m%d).sql
   
   # Test in local environment
   npm run test
   ```

2. **Deploy fixes**
   ```bash
   # Deploy to staging first
   vercel --env=preview
   
   # Test all critical paths
   # Then deploy to production
   vercel --prod
   ```

3. **Post-deployment**
   - Monitor error rates for 24 hours
   - Check all critical user flows
   - Be ready to rollback if needed

## ⏰ TIMELINE

- **Day 1**: Critical fixes (6 hours)
- **Day 2**: Security & performance (6 hours)  
- **Day 3**: Monitoring & testing (6 hours)
- **Day 4**: Final testing & deployment (4 hours)

**Total time to production-ready: 4 days**

## 🔄 ROLLBACK PLAN

If issues occur:
```bash
# 1. Revert database policies
supabase db reset --db-url $ROLLBACK_URL

# 2. Revert code changes
git revert HEAD
vercel rollback

# 3. Restore from backup
psql $DATABASE_URL < backup-20250802.sql
```

## 📞 EMERGENCY CONTACTS

- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com
- Team Lead: [Add contact]
- Database Admin: [Add contact]