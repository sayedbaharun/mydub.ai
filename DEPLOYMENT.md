# MyDub.AI Production Deployment Guide

## Environment Variables Setup for Vercel

### Step 1: Access Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Production Environment Variables

Add the following environment variables for **Production** environment:

#### Required Variables (Already Configured)
```bash
# Analytics
VITE_GA_MEASUREMENT_ID=G-WMNHXLYZWM

# AI Services
VITE_OPENROUTER_API_KEY=[Already configured in Vercel]

# External APIs
VITE_WEATHERAPI_KEY=[Already configured in Vercel]
VITE_NEWS_API_KEY=[Already configured in Vercel]
VITE_NEWSDATA_API_KEY=[Already configured in Vercel]

# Email Service
VITE_SENDGRID_API_KEY=[Already configured in Vercel]
VITE_SENDGRID_FROM_EMAIL=noreply@mydub.ai
```

#### Still Needed from Supabase
You need to add these from your Supabase project:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 3: Deploy to Production

After adding all environment variables:

1. **Via Git Push** (Automatic):
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

2. **Manual Redeploy**:
   - Go to Vercel dashboard
   - Click **Redeploy** → **Redeploy with existing Build Cache**

### Step 4: Verify Deployment

1. Check deployment logs in Vercel dashboard
2. Visit your production URL: https://mydub.ai
3. Verify:
   - Google Analytics is tracking (check real-time in GA dashboard)
   - Weather widget is loading data
   - News feed is populating
   - AI features are working (if configured)

## Important Security Notes

⚠️ **CRITICAL**: The API keys in this file are for production use. Please:

1. **Rotate these keys** after initial deployment
2. **Never commit** actual API keys to public repositories
3. **Set up domain restrictions** where possible:
   - SendGrid: Add mydub.ai to authorized senders
   - Google Analytics: Already configured for mydub.ai
   - Weather/News APIs: Add domain restrictions in their dashboards

## Post-Deployment Checklist

- [ ] Verify all environment variables are set in Vercel
- [ ] Test critical user flows
- [ ] Check error tracking in browser console
- [ ] Verify email sending functionality
- [ ] Test AI-powered features
- [ ] Monitor initial traffic in Google Analytics
- [ ] Set up uptime monitoring
- [ ] Configure custom error pages

## Troubleshooting

If features aren't working after deployment:

1. **Check Vercel Function Logs**: Dashboard → Functions → View Logs
2. **Verify Environment Variables**: Settings → Environment Variables
3. **Check Browser Console**: Look for API errors or missing configurations
4. **Test API Endpoints**: Use browser DevTools to check network requests

## Support

For deployment issues:
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Project Repository: [Your GitHub URL]