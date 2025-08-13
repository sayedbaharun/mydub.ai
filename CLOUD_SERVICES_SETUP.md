# Cloud Services Setup (No Docker Required!)

This guide uses free-tier cloud services instead of Docker for easier setup.

## 🚀 Quick Start with Free Services

### 1. **Database & Storage - Supabase** ✅
You already have this! Supabase provides:
- PostgreSQL database
- File storage (replaces Google Drive/MinIO)
- Realtime subscriptions
- Edge Functions

No additional setup needed!

### 2. **Caching - Upstash Redis** 
Free tier: 10,000 commands/day

1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy the REST URL and token
4. Add to `.env.mcp`:
   ```
   REDIS_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### 3. **Email - Resend**
Free tier: 3,000 emails/month

1. Sign up at https://resend.com
2. Verify your domain or use their subdomain
3. Create an API key
4. Add to `.env.mcp`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### 4. **Search - Algolia**
Free tier: 10,000 searches/month

1. Sign up at https://algolia.com
2. Create an application
3. Create an index called `mydubai_content`
4. Get your API keys
5. Add to `.env.mcp`:
   ```
   ALGOLIA_APP_ID=your-app-id
   ALGOLIA_API_KEY=your-api-key
   ALGOLIA_INDEX_NAME=mydubai_content
   ```

### 5. **Error Tracking - Sentry**
Free tier: 5,000 errors/month

1. Sign up at https://sentry.io
2. Create a project (React)
3. Copy the DSN
4. Add to `.env.mcp`:
   ```
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

### 6. **Analytics - Vercel Analytics**
Free with Vercel hosting

1. Deploy to Vercel
2. Enable Analytics in project settings
3. No API key needed!

## 🎯 Minimal Setup (Start Here!)

If you want to start with the absolute minimum:

1. **Use existing Supabase** for:
   - Database (PostgreSQL)
   - File storage
   - Authentication
   - Edge Functions for email sending

2. **Add Resend** for emails (5 minutes setup)

3. **Add Sentry** for error tracking (5 minutes setup)

That's it! You can add other services as needed.

## 📝 Updated Service Integration

Here's how to use Supabase for multiple needs:

### Email via Supabase Edge Function
```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  const data = await resend.emails.send({
    from: 'MyDubai <noreply@mydubai.ae>',
    to,
    subject,
    html,
  })
  
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### Caching with Supabase
```typescript
// Use Supabase table for caching
const cache = {
  async get(key: string) {
    const { data } = await supabase
      .from('cache')
      .select('value, expires_at')
      .eq('key', key)
      .single()
    
    if (!data || new Date(data.expires_at) < new Date()) {
      return null
    }
    return data.value
  },
  
  async set(key: string, value: any, ttl: number) {
    await supabase.from('cache').upsert({
      key,
      value,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString()
    })
  }
}
```

### Search with Supabase Full-Text Search
```typescript
// PostgreSQL full-text search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', searchQuery, {
    type: 'websearch',
    config: 'english'
  })
```

## 🔧 No Docker Required!

All these services:
- ✅ Work in the cloud
- ✅ Have generous free tiers
- ✅ No local setup needed
- ✅ Work immediately
- ✅ Scale when you need

## 🚀 Next Steps

1. Start with Supabase + Resend (email)
2. Add services as you need them
3. Most MCP servers will work with these cloud services
4. No Docker required!