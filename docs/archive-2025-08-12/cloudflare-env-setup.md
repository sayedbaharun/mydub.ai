# CloudFlare Environment Variables Setup

Add these environment variables to your `.env.local` file and Vercel dashboard:

## Required Environment Variables

```bash
# CloudFlare API Credentials
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

# CloudFlare Cache Purge Webhook (optional)
CLOUDFLARE_PURGE_WEBHOOK_SECRET=your_webhook_secret_here

# CloudFlare Analytics (optional)
CLOUDFLARE_ANALYTICS_TOKEN=your_analytics_token_here
```

## How to Get These Values

### 1. CloudFlare API Token

1. Log in to CloudFlare Dashboard
2. Go to My Profile → API Tokens
3. Click "Create Token"
4. Use the "Edit zone DNS" template or create custom token with these permissions:
   - Zone → Cache Purge → Purge
   - Zone → Zone → Read
   - Zone → DNS → Edit (if managing DNS)

### 2. CloudFlare Zone ID

1. Go to your domain in CloudFlare Dashboard
2. On the right sidebar, find "API" section
3. Copy the "Zone ID"

### 3. CloudFlare Account ID

1. Go to CloudFlare Dashboard home
2. On the right sidebar, find "Account ID"

## Vercel Environment Setup

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development environments
4. Click "Save"

## Testing the Configuration

Create a test API route to verify CloudFlare integration:

```typescript
// pages/api/test-cloudflare.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
  const hasZoneId = !!process.env.CLOUDFLARE_ZONE_ID;
  
  res.status(200).json({
    cloudflare: {
      configured: hasToken && hasZoneId,
      hasToken,
      hasZoneId,
    },
    headers: {
      'cf-ray': req.headers['cf-ray'] || 'not-from-cloudflare',
      'cf-ipcountry': req.headers['cf-ipcountry'] || 'unknown',
    },
  });
}
```

## Security Notes

- Never commit these values to your repository
- Use Vercel's environment variable encryption
- Rotate API tokens regularly
- Use scoped tokens with minimal permissions