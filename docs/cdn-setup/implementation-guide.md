# CDN Implementation Guide for Dubai Edge Location

## Quick Start

This guide helps you implement CloudFlare CDN for optimal performance in Dubai/UAE.

## 1. CloudFlare Setup (15 minutes)

1. **Create CloudFlare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Add your domain
   - Update nameservers at your registrar

2. **Configure DNS**
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Content: mydub.ai
   Proxy: ON (orange cloud)
   ```

3. **SSL Settings**
   - SSL/TLS → Full (strict)
   - Always Use HTTPS → ON

## 2. Application Setup (10 minutes)

1. **Add Environment Variables**
   ```bash
   # .env.local
   CLOUDFLARE_API_TOKEN=your_token
   CLOUDFLARE_ZONE_ID=your_zone_id
   ```

2. **Install the Service Worker**
   - The service worker is already created at `/public/service-worker.js`
   - It will auto-register in production

3. **Initialize Performance Monitoring**
   ```typescript
   // In your app's root layout or _app.tsx
   import { initPerformanceMonitoring } from '@/utils/performance/dubai-monitor';
   
   useEffect(() => {
     initPerformanceMonitoring();
   }, []);
   ```

## 3. Database Setup (5 minutes)

Run this migration in Supabase Dashboard:
- `/supabase/migrations/20250125_PERFORMANCE_MONITORING_TABLES.sql`

## 4. Vercel Configuration

1. **Add Custom Domain**
   - Go to Vercel project settings
   - Add your domain
   - It will auto-detect CloudFlare

2. **Environment Variables**
   - Add CloudFlare tokens to Vercel
   - Set for all environments

## 5. Testing

1. **Check CloudFlare Headers**
   ```bash
   curl -I https://mydub.ai
   # Look for: CF-Cache-Status, CF-Ray
   ```

2. **Check Location API**
   ```bash
   curl https://mydub.ai/api/location
   # Should show country: "AE" for Dubai
   ```

3. **Monitor Performance**
   - Check browser console for performance logs
   - View metrics at `/api/analytics/performance`

## 6. CloudFlare Page Rules

Create these rules in CloudFlare dashboard:

1. **Static Assets**
   - URL: `*mydub.ai/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

2. **API Caching**
   - URL: `*mydub.ai/api/public/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 5 minutes

3. **Dynamic Pages**
   - URL: `*mydub.ai/*`
   - Cache Level: Standard

## 7. Monitoring Dashboard

Access performance metrics:
- CloudFlare Analytics: Real-time traffic and performance
- Vercel Analytics: Build and runtime metrics
- Custom Dashboard: `/api/analytics/performance` (build your own UI)

## Common Issues

### Issue: Not seeing CF headers
**Solution**: Ensure DNS proxy is enabled (orange cloud)

### Issue: Service worker not registering
**Solution**: Only works in production or with HTTPS locally

### Issue: Slow API responses
**Solution**: Check if you're hitting Mumbai Supabase region, implement Redis caching

## Next Steps

1. Implement Redis caching for database queries
2. Set up CloudFlare Workers for advanced caching
3. Configure CloudFlare Web Analytics
4. Set up alerts for performance degradation

## Performance Targets for Dubai

- LCP: < 2.5s (Good), < 4s (Needs Improvement)
- FID: < 100ms (Good), < 300ms (Needs Improvement)
- CLS: < 0.1 (Good), < 0.25 (Needs Improvement)
- TTFB: < 600ms (with CDN cache hit)

## Support

- CloudFlare Support: support.cloudflare.com
- Vercel Support: vercel.com/support
- Supabase Support: supabase.com/support