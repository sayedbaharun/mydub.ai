# API Integrations Documentation

## Overview
This document outlines the external API integrations implemented in MyDub.AI.

## 1. NewsAPI Integration

### Configuration
- **API Key**: Stored in `VITE_NEWS_API_KEY` environment variable
- **Base URL**: `https://newsapi.org/v2`
- **Service**: `src/features/news/services/news.service.ts`

### Features
- **Fetch News Articles**: Retrieves Dubai-related news from NewsAPI
- **Search Functionality**: Search for specific news topics
- **Top Headlines**: Get trending news for UAE
- **Fallback Support**: NewsAPI serves as fallback when Supabase is unavailable

### Usage Example
```typescript
import { NewsService } from '@/features/news/services/news.service'

// Fetch news articles
const articles = await NewsService.fetchFromNewsAPI('Dubai UAE', 1)

// Get articles with fallback to NewsAPI
const news = await NewsService.getArticles(filters)
```

## 2. SendGrid Email Integration

### Configuration
- **API Key**: `SENDGRID_API_KEY` (server-side only)
- **From Email**: `noreply@mydub.ai`
- **Service**: `src/services/email.service.ts`
- **Edge Function**: `supabase/functions/send-email/index.ts`

### Features
- **Welcome Emails**: Sent automatically on user registration
- **Password Reset**: Secure password reset emails
- **Notifications**: Custom notification emails
- **Daily Digest**: Scheduled digest emails with news and updates

### Security
- Client-side emails sent through Supabase Edge Function
- Server-side emails sent directly via SendGrid API
- All emails logged in database for audit trail

### Usage Example
```typescript
import { EmailService } from '@/services/email.service'

// Send welcome email
await EmailService.sendWelcomeEmail(email, name)

// Send notification
await EmailService.sendNotificationEmail(
  email,
  'New Government Update',
  'A new service is now available...',
  'https://mydub.ai/government',
  'View Details'
)
```

## 3. AI Services Integration

### OpenAI
- **API Key**: `VITE_OPENAI_API_KEY`
- **Model**: GPT-4 for advanced queries, GPT-3.5 for general chat
- **Features**: Natural language processing, content generation, translation

### Anthropic Claude
- **API Key**: `VITE_ANTHROPIC_API_KEY`
- **Model**: Claude 3 for complex reasoning and analysis
- **Features**: Document analysis, summarization, Q&A

### Google Gemini
- **API Key**: `VITE_GOOGLE_GEMINI_API_KEY`
- **Model**: Gemini Pro for multimodal tasks
- **Features**: Image analysis, content understanding

### AI Service Configuration
```typescript
// src/lib/ai-services.ts
const AI_PROVIDERS = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    models: ['gpt-4', 'gpt-3.5-turbo']
  },
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    models: ['claude-3-opus', 'claude-3-sonnet']
  },
  google: {
    apiKey: import.meta.env.VITE_GOOGLE_GEMINI_API_KEY,
    models: ['gemini-pro']
  }
}
```

## 4. Supabase Integration

### Configuration
- **URL**: `VITE_SUPABASE_URL`
- **Anon Key**: `VITE_SUPABASE_ANON_KEY`
- **Service**: `src/lib/supabase.ts`

### Features
- **Authentication**: User registration, login, social auth
- **Database**: Real-time data synchronization
- **Storage**: File uploads and media management
- **Edge Functions**: Serverless functions for secure operations

## Environment Variables Summary

```env
# Supabase
VITE_SUPABASE_URL=https://pltutlpmamxozailzffm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# AI Services
VITE_OPENAI_API_KEY=sk-proj-...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_GOOGLE_GEMINI_API_KEY=AIzaSy...

# News API
VITE_NEWS_API_KEY=fc87238b76db4c21b60e3456a3ed9f40

# SendGrid (Server-side only)
SENDGRID_API_KEY=SG.Oxhrifs...
SENDGRID_FROM_EMAIL=noreply@mydub.ai
```

## Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Implement rate limiting for API calls

2. **Error Handling**
   - Always implement fallback mechanisms
   - Log errors for debugging
   - Provide user-friendly error messages

3. **Performance**
   - Cache API responses when appropriate
   - Implement request debouncing
   - Use pagination for large datasets

4. **Monitoring**
   - Track API usage and costs
   - Monitor response times
   - Set up alerts for failures

## Testing APIs

### NewsAPI Test
```bash
curl -X GET "https://newsapi.org/v2/everything?q=Dubai&apiKey=YOUR_API_KEY"
```

### SendGrid Test (via Supabase Edge Function)
```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<p>This is a test</p>'
  }
})
```

## Deployment Considerations

1. **Environment Variables**
   - Set all API keys in production environment
   - Use different keys for development/staging/production
   - Rotate keys regularly

2. **Rate Limits**
   - NewsAPI: 1000 requests/day (free tier)
   - SendGrid: 100 emails/day (free tier)
   - Monitor usage to avoid hitting limits

3. **Costs**
   - Track API usage to manage costs
   - Implement caching to reduce API calls
   - Consider upgrading plans as needed