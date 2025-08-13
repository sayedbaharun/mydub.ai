# MyDub.AI Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- Vercel account (or preferred hosting platform)
- All API keys configured in `.env.local`

## Pre-Deployment Checklist

### 1. Security Audit
- [ ] Change default admin password
- [ ] Remove all `console.log` statements
- [ ] Verify all API keys are in environment variables
- [ ] Check for exposed secrets in code
- [ ] Enable email verification (remove auto-confirm)

### 2. Database Setup
- [ ] Run all migrations
- [ ] Create storage buckets
- [ ] Fix RLS policies (especially profiles table)
- [ ] Set up database backups
- [ ] Test all CRUD operations

### 3. Environment Configuration
```bash
# Required environment variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
OPENROUTER_API_KEY=
WEATHERAPI_KEY=
VITE_SENTRY_DSN=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
```

## Deployment Steps

### 1. Local Build Test
```bash
# Test production build locally
npm run build
npm run preview

# Run tests
npm test
npm run test:e2e

# Check for TypeScript errors
npm run type-check

# Security audit
npm run security:audit
```

### 2. Supabase Setup

#### Deploy Edge Functions
```bash
# Deploy email function
supabase functions deploy send-email

# Set secrets
supabase secrets set RESEND_API_KEY=your_key_here
```

#### Create Storage Buckets
```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-images', 'content-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('article-images', 'article-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png']),
  ('content-documents', 'content-documents', false, 52428800, ARRAY['application/pdf']);
```

### 3. Vercel Deployment

#### Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Configure Environment Variables
```bash
# Add all environment variables to Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all other variables
```

#### Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 4. Post-Deployment

#### Configure Cloudflare
1. Update DNS to point to Vercel
2. Enable Cloudflare proxy
3. Configure page rules for caching
4. Set up firewall rules

#### Monitor Deployment
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Check Sentry for errors
# Visit https://sentry.io
```

## Production Configuration

### Vercel Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Headers Configuration
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
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Monitoring & Maintenance

### Daily Tasks
- Check Sentry for new errors
- Monitor API usage and costs
- Review user feedback
- Check performance metrics

### Weekly Tasks
- Review security logs
- Update dependencies
- Backup database
- Clear old cache

### Monthly Tasks
- Security audit
- Performance optimization
- Cost analysis
- Feature usage analytics

## Rollback Procedure

If issues occur after deployment:

1. **Immediate Rollback**
```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy specific version
vercel --prod [deployment-url]
```

2. **Database Rollback**
```bash
# Restore from backup
supabase db restore --backup-id [backup-id]
```

3. **Clear Cache**
```bash
# Clear Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node version (must be 18+)
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **API Errors**
   - Verify environment variables
   - Check API rate limits
   - Review CORS settings

3. **Database Issues**
   - Check RLS policies
   - Verify connection string
   - Review query performance

### Debug Commands
```bash
# Check deployment logs
vercel logs --num 100

# Test API endpoints
curl https://your-domain.com/api/health

# Check environment variables
vercel env ls
```

## Performance Optimization

### Before Launch
- [ ] Enable Gzip compression
- [ ] Optimize images (WebP format)
- [ ] Enable browser caching
- [ ] Minify CSS/JS
- [ ] Set up CDN

### Monitoring Tools
- Lighthouse CI (automated in GitHub Actions)
- Sentry Performance Monitoring
- Vercel Analytics
- Google PageSpeed Insights

## Security Checklist

- [ ] HTTPS enabled everywhere
- [ ] Security headers configured
- [ ] API rate limiting active
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload restrictions set

## Support

For deployment issues:
1. Check deployment logs
2. Review error tracking in Sentry
3. Contact team in Slack
4. Create GitHub issue

Remember: Always test in staging before production deployment!