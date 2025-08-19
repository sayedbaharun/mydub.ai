# API Security Checklist for MyDub.AI

## Immediate Actions Required ⚠️

### 1. ✅ Enable Sensitive Flag in Vercel
- [ ] VITE_OPENAI_API_KEY - Mark as Sensitive
- [ ] VITE_SUPABASE_ANON_KEY - Mark as Sensitive  
- [ ] SUPABASE_SERVICE_ROLE_KEY - Mark as Sensitive
- [ ] OPENROUTER_API_KEY - Mark as Sensitive
- [ ] VITE_SENDGRID_API_KEY - Mark as Sensitive
- [ ] VITE_NEWS_API_KEY - Mark as Sensitive
- [ ] VITE_NEWSDATA_API_KEY - Mark as Sensitive
- [ ] VITE_WEATHERAPI_KEY - Mark as Sensitive

### 2. ✅ Rotate Compromised Keys
- [ ] OpenAI API Key (was exposed in chat)
- [ ] Any other keys that may have been exposed

### 3. ✅ Domain Restrictions Setup

#### SendGrid
- [ ] Add domain authentication for mydub.ai
- [ ] Restrict API key to "Mail Send" permission only
- [ ] Set up SPF, DKIM, and DMARC records

#### Weather API
- [ ] Add allowed referrers:
  ```
  https://mydub.ai/*
  https://*.mydub.ai/*
  ```

#### News APIs
- [ ] NewsAPI.org - Add CORS domains
- [ ] NewsData.io - Add domain restrictions

#### OpenRouter
- [ ] Set CORS allowed origins to https://mydub.ai

### 4. ✅ Environment-Specific Keys

Create separate keys for each environment:

| Service | Production Key | Development Key | Status |
|---------|---------------|-----------------|---------|
| OpenAI | mydub-prod-xxx | mydub-dev-xxx | [ ] Created |
| SendGrid | mydub-prod-xxx | mydub-dev-xxx | [ ] Created |
| Weather API | mydub-prod-xxx | mydub-dev-xxx | [ ] Created |
| News API | mydub-prod-xxx | mydub-dev-xxx | [ ] Created |
| OpenRouter | mydub-prod-xxx | mydub-dev-xxx | [ ] Created |

### 5. ✅ Rate Limiting & Monitoring

- [ ] Set up API usage alerts in each service dashboard
- [ ] Configure rate limits where available
- [ ] Enable usage notifications for unusual activity
- [ ] Set monthly/daily limits to prevent bill shock

### 6. ✅ Additional Security Measures

- [ ] Never commit .env files to Git
- [ ] Add .env* to .gitignore
- [ ] Use environment-specific prefixes (PROD_, DEV_)
- [ ] Implement API proxy/backend for sensitive operations
- [ ] Regular key rotation schedule (every 3-6 months)
- [ ] Document which team members have access to which keys

## Service-Specific Instructions

### OpenAI
1. Visit: https://platform.openai.com/api-keys
2. Revoke current key
3. Create new key with descriptive name
4. Set usage limits: Account → Limits

### SendGrid
1. Visit: https://app.sendgrid.com/settings/api_keys
2. Create restricted key (Mail Send only)
3. Domain authentication: Settings → Sender Authentication
4. Add DNS records to your domain provider

### Weather API
1. Visit: https://www.weatherapi.com/my/
2. API Configuration → Referrer restrictions
3. Add mydub.ai domains

### News API
1. Visit: https://newsapi.org/account
2. Manage → CORS domains
3. Add mydub.ai

### Supabase
1. Never expose service_role_key in client code
2. Use anon_key for client-side operations
3. Set up Row Level Security (RLS) policies
4. Configure allowed URLs in Authentication settings

## Monitoring Setup

### Set Up Alerts For:
- [ ] Unusual API usage spikes
- [ ] Failed authentication attempts  
- [ ] Rate limit approaching
- [ ] Monthly budget thresholds
- [ ] Unauthorized domain access attempts

## Regular Maintenance Schedule

### Weekly
- Check API usage dashboards
- Review any security alerts

### Monthly
- Audit API access logs
- Review and update rate limits
- Check for unused API keys

### Quarterly
- Rotate API keys
- Review security policies
- Update domain restrictions
- Audit team member access

## Emergency Response Plan

If a key is compromised:
1. Immediately revoke the key
2. Generate new key
3. Update in Vercel
4. Redeploy application
5. Check logs for unauthorized usage
6. Notify team members
7. Document incident

## Contact Information

Keep these support contacts handy:
- OpenAI Support: https://help.openai.com
- SendGrid Support: https://support.sendgrid.com
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

---

Last Security Review: [Date]
Next Scheduled Review: [Date + 3 months]