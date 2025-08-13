# CloudFlare CDN Configuration for MyDub.AI

This guide walks through setting up CloudFlare CDN to provide Dubai edge location support for the MyDub.AI application.

## Why CloudFlare?

- **Dubai Edge Location**: CloudFlare has presence in Dubai, providing low latency for UAE users
- **Vercel Integration**: Seamless integration with Vercel deployments
- **Free Tier Available**: Suitable for initial deployment with upgrade path
- **Advanced Caching**: Granular control over caching strategies

## Prerequisites

1. Domain name for your application
2. CloudFlare account (free tier is sufficient to start)
3. Vercel deployment already configured

## Step 1: CloudFlare Account Setup

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain to CloudFlare
3. Update your domain's nameservers to CloudFlare's nameservers

## Step 2: DNS Configuration

1. In CloudFlare dashboard, go to DNS settings
2. Add CNAME record:
   ```
   Type: CNAME
   Name: @ (or www)
   Target: mydub.ai
   Proxy status: Proxied (orange cloud ON)
   ```

## Step 3: SSL/TLS Configuration

1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

## Step 4: Caching Rules

### Page Rules (Free tier - 3 rules)

1. **Static Assets Rule**:
   ```
   URL: *mydub.ai/static/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 month
   ```

2. **API Caching Rule**:
   ```
   URL: *mydub.ai/api/public/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 5 minutes
   - Bypass Cache on Cookie: supabase-auth-token
   ```

3. **Dynamic Content Rule**:
   ```
   URL: *mydub.ai/*
   Settings:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   ```

### Cache Rules (Pro tier - more granular control)

```javascript
// Example advanced caching rule
{
  "expression": "(http.request.uri.path matches \"^/api/news/\") and not (http.cookie contains \"supabase-auth-token\")",
  "action": "cache",
  "action_parameters": {
    "cache": true,
    "edge_ttl": {
      "mode": "override_origin",
      "default": 300 // 5 minutes
    }
  }
}
```

## Step 5: Performance Optimizations

### Enable These Features:

1. **Auto Minify**:
   - JavaScript: ON
   - CSS: ON
   - HTML: ON

2. **Brotli Compression**: ON

3. **Early Hints**: ON (sends 103 status to speed up loading)

4. **Rocket Loader**: ON (improves JavaScript loading)

5. **Polish**:
   - Image optimization: Lossy
   - WebP conversion: ON

6. **Mirage**: ON (lazy loads images on mobile)

## Step 6: Security Settings

1. **Firewall Rules**:
   ```
   // Block non-UAE traffic during beta (optional)
   (not ip.geoip.country in {"AE" "SA" "OM" "KW" "BH" "QA"}) and not (cf.bot_management.verified_bot)
   Action: Challenge
   ```

2. **Rate Limiting**:
   ```
   // API rate limiting
   Path: /api/*
   Requests: 100 per minute per IP
   Action: Challenge
   ```

3. **DDoS Protection**: Automatic (included in free tier)

## Step 7: Workers (Optional - Advanced)

Create a CloudFlare Worker for custom caching logic:

```javascript
// workers/cache-handler.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Cache Supabase Storage assets aggressively
  if (url.pathname.includes('/storage/v1/object/public/')) {
    const cache = caches.default
    let response = await cache.match(request)
    
    if (!response) {
      response = await fetch(request)
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000') // 1 year
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })
      
      event.waitUntil(cache.put(request, response.clone()))
    }
    
    return response
  }
  
  // Default behavior for other requests
  return fetch(request)
}
```

## Step 8: Analytics & Monitoring

1. Enable **Web Analytics** (free, privacy-focused)
2. Set up **Real User Monitoring** for performance tracking
3. Configure alerts for:
   - High error rates
   - Slow response times
   - Traffic spikes

## Step 9: Vercel Integration

In your Vercel project settings:

1. Add your custom domain
2. Configure domain to use CloudFlare DNS
3. Ensure SSL certificate is issued for the domain

## Step 10: Testing

1. Use CloudFlare's **Speed Test** tool
2. Check caching headers:
   ```bash
   curl -I https://mydub.ai/api/news
   # Look for CF-Cache-Status: HIT
   ```
3. Test from Dubai using VPN or monitoring service

## Configuration Checklist

- [ ] Domain added to CloudFlare
- [ ] DNS records configured
- [ ] SSL/TLS set to Full (strict)
- [ ] Page rules created
- [ ] Performance features enabled
- [ ] Security rules configured
- [ ] Analytics enabled
- [ ] Vercel domain configured

## Monitoring Headers

Key headers to monitor:

```
CF-Cache-Status: HIT/MISS/DYNAMIC
CF-Ray: Unique request ID
CF-IPCountry: AE (for Dubai)
Cache-Control: Response caching directives
```

## Cost Considerations

- **Free Tier**: Sufficient for most features
- **Pro Tier ($20/month)**: Advanced rules, WAF, image optimization
- **Business Tier ($200/month)**: Custom SSL, advanced DDoS, priority support

## Next Steps

1. Implement Redis caching for database queries
2. Add service worker for offline functionality
3. Set up monitoring dashboard for Dubai performance metrics