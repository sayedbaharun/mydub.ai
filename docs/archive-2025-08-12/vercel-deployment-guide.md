# Vercel Deployment Guide for MyDub.AI

This guide provides step-by-step instructions for deploying MyDub.AI on Vercel, including all configuration, environment variables, and troubleshooting tips.

## Table of Contents
1. [Prerequisites and Account Setup](#prerequisites-and-account-setup)
2. [Vercel Project Creation](#vercel-project-creation)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Domain Setup Instructions](#domain-setup-instructions)
5. [Build and Deployment Settings](#build-and-deployment-settings)
6. [Production Deployment Checklist](#production-deployment-checklist)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Prerequisites and Account Setup

### Required Accounts
1. **GitHub Account**: Required for connecting your repository
   - Ensure your repository is pushed to GitHub
   - Repository should be public or you need a Vercel Pro account for private repos

2. **Vercel Account**: 
   - Sign up at [vercel.com](https://vercel.com)
   - Free tier supports personal projects
   - Pro tier recommended for production with team collaboration

3. **Supabase Account**:
   - Create project at [supabase.com](https://supabase.com)
   - Note down your project URL and anon key

4. **API Keys** (if using all features):
   - OpenAI API key
   - Anthropic Claude API key
   - Google Gemini API key
   - News API key

### Local Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version

# Install Vercel CLI globally (optional but recommended)
npm install -g vercel

# Ensure all dependencies are installed
npm install

# Test local build
npm run build
```

## Vercel Project Creation

### Method 1: Using Vercel Dashboard (Recommended)

1. **Login to Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Git Repository**
   - Click "Import Git Repository"
   - Authorize GitHub integration if not already done
   - Search for "mydub.ai" or your repository name
   - Select the repository

3. **Configure Project**
   - **Project Name**: `mydub-ai` (or your preferred name)
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: Leave as `./` (unless monorepo)
   - **Build Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Navigate to project directory
cd /Users/sayedbaharun/Documents/Developer/mydub.ai/mdweb

# Run Vercel deployment
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project?: N
# - Project name: mydub-ai
# - In which directory: ./ 
# - Override settings?: N
```

## Environment Variables Configuration

### Required Environment Variables

Navigate to your Vercel project settings → Environment Variables and add:

#### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### AI API Keys
```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_GOOGLE_API_KEY=your_google_gemini_api_key
```

#### News API
```
VITE_NEWS_API_KEY=your_news_api_key
```

#### Application Settings
```
VITE_APP_NAME=MyDub.AI
VITE_APP_URL=https://mydub.ai
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,ar,hi,ur
```

### Adding Environment Variables

1. **Via Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add each variable with its value
   - Select environments: Production, Preview, Development
   - Click "Save"

2. **Via CLI**:
   ```bash
   # Add a single variable
   vercel env add VITE_SUPABASE_URL

   # Add from .env file
   vercel env pull .env.production
   ```

### Environment-Specific Variables

For different environments, you can set different values:
- **Production**: Live site variables
- **Preview**: For PR previews and staging
- **Development**: Local development (via Vercel CLI)

## Domain Setup Instructions

### Using a Custom Domain

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `mydub.ai`

2. **DNS Configuration**:
   
   **Option A: Vercel Nameservers** (Recommended)
   - Change nameservers at your registrar to:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```

   **Option B: Individual Records**
   - Add A record: `@` → `76.76.21.21`
   - Add CNAME record: `www` → `cname.vercel-dns.com`

3. **SSL Certificate**:
   - Automatically provisioned by Vercel
   - Usually active within minutes
   - Force HTTPS in Project Settings → Domains

### Subdomain Configuration

For staging or preview environments:
```
staging.mydub.ai → staging-mydub-ai.vercel.app
api.mydub.ai → mydub-ai-api.vercel.app
```

## Build and Deployment Settings

### Optimize Build Configuration

1. **Update vercel.json**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       },
       {
         "source": "/sw.js",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=0, must-revalidate"
           }
         ]
       },
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

2. **Node.js Version**:
   - Create `.nvmrc` file:
     ```
     18.17.0
     ```

3. **Build Optimizations**:
   - In Project Settings → General:
     - Node.js Version: 18.x
     - Build Timeout: 30 minutes
     - Enable "Automatically expose System Environment Variables"

### Function Configuration

For API routes or edge functions:
```json
{
  "functions": {
    "api/chat.js": {
      "maxDuration": 30
    },
    "api/news.js": {
      "maxDuration": 10
    }
  }
}
```

## Production Deployment Checklist

### Pre-Deployment Checklist

- [ ] **Code Quality**
  - [ ] Run `npm run lint` and fix all errors
  - [ ] Run `npm run test` and ensure all tests pass
  - [ ] Run `npm run build` locally to verify build succeeds

- [ ] **Environment Variables**
  - [ ] All production API keys are set
  - [ ] Supabase production URL and keys are configured
  - [ ] App URL is set to production domain

- [ ] **Security**
  - [ ] Remove all console.log statements
  - [ ] Ensure no sensitive data in code
  - [ ] API keys are only in environment variables
  - [ ] CORS settings are properly configured

- [ ] **Performance**
  - [ ] Run `npm run lighthouse` and meet targets
  - [ ] Bundle size is optimized (`npm run build:analyze`)
  - [ ] Images are optimized and lazy loaded

- [ ] **Database**
  - [ ] All migrations are applied to production
  - [ ] Row-level security policies are enabled
  - [ ] Database backups are configured

### Deployment Steps

1. **Create Production Branch**:
   ```bash
   git checkout -b production
   git merge main
   ```

2. **Final Testing**:
   ```bash
   npm run test
   npm run test:e2e
   npm run build
   npm run preview
   ```

3. **Deploy to Vercel**:
   ```bash
   # Via Git push (automatic)
   git push origin production

   # Or via CLI
   vercel --prod
   ```

4. **Post-Deployment Verification**:
   - [ ] Check all pages load correctly
   - [ ] Test authentication flow
   - [ ] Verify API integrations work
   - [ ] Check multi-language support
   - [ ] Test PWA installation
   - [ ] Monitor error tracking

### Monitoring Setup

1. **Enable Vercel Analytics**:
   - Go to Project → Analytics
   - Enable Web Analytics
   - Enable Speed Insights

2. **Set up Alerts**:
   - Configure build failure notifications
   - Set up downtime alerts
   - Monitor function execution errors

## Troubleshooting Common Issues

### Build Failures

**Issue: "Module not found" errors**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
vercel --prod --force
```

**Issue: Environment variables not accessible**
```bash
# Ensure VITE_ prefix is used
VITE_SUPABASE_URL=xxx  # ✓ Correct
SUPABASE_URL=xxx       # ✗ Wrong

# Rebuild after adding variables
vercel env pull
vercel --prod --force
```

### Runtime Errors

**Issue: 404 errors on page refresh**
- Ensure `vercel.json` includes SPA rewrite rules
- Check that output directory is correctly set to `dist`

**Issue: CORS errors with Supabase**
```javascript
// Add to Supabase dashboard → Settings → API
// Allowed origins: https://mydub.ai, https://*.vercel.app
```

**Issue: Large bundle size warnings**
```bash
# Analyze bundle
npm run build:analyze

# Common solutions:
# - Dynamic imports for large components
# - Tree-shake unused imports
# - Optimize images
```

### Performance Issues

**Issue: Slow initial load**
1. Enable Vercel Edge Network
2. Implement proper caching headers
3. Use dynamic imports for routes
4. Optimize images with next/image or Vercel Image Optimization

**Issue: Function timeouts**
- Increase function duration in vercel.json
- Optimize database queries
- Implement proper error handling

### SSL/Domain Issues

**Issue: SSL certificate pending**
- Wait 24-48 hours for propagation
- Verify DNS records are correct
- Check domain verification in Vercel dashboard

**Issue: Redirect loops**
- Check for conflicting redirects in vercel.json
- Ensure no .htaccess files in project
- Verify Cloudflare SSL settings if using

### Debugging Tips

1. **Check Build Logs**:
   - Vercel Dashboard → Functions → Logs
   - Look for build errors or warnings

2. **Use Vercel CLI for Testing**:
   ```bash
   # Test production build locally
   vercel dev

   # Check environment variables
   vercel env ls
   ```

3. **Enable Debug Mode**:
   ```json
   // In vercel.json
   {
     "build": {
       "env": {
         "DEBUG": "true"
       }
     }
   }
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel Guide](https://vercel.com/guides/deploying-vite-with-vercel)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Troubleshooting Deployments](https://vercel.com/docs/deployments/troubleshoot)

## Support

For deployment issues:
1. Check Vercel Status: [status.vercel.com](https://status.vercel.com)
2. Vercel Support: support@vercel.com
3. Community Forum: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)