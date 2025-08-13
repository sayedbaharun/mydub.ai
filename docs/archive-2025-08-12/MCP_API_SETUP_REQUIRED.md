# MCP Services - Manual API Key Setup Required

This document lists all MCP services that require manual account creation and API key generation.

## 🚨 IMMEDIATE ACTION REQUIRED

### Exposed Tokens (REGENERATE IMMEDIATELY)
1. **GitHub Personal Access Token**
   - Current token is exposed in git history
   - Go to: https://github.com/settings/tokens
   - Revoke the old token and create a new one

2. **Supabase Access Token**
   - Current token is exposed in git history
   - Go to your Supabase project settings
   - Regenerate the service role key

## 📋 Services Requiring Manual Setup

### Content & Media

#### Google Drive
- **Required**: Google Cloud account
- **Steps**:
  1. Go to https://console.cloud.google.com
  2. Create a new project or select existing
  3. Enable Google Drive API
  4. Create OAuth 2.0 credentials
  5. Add redirect URI: `http://localhost:3000/auth/google/callback`
- **Keys needed**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

#### Cloudflare
- **Required**: Cloudflare account with a domain
- **Steps**:
  1. Log in to https://dash.cloudflare.com
  2. Go to My Profile → API Tokens
  3. Create a token with appropriate permissions
- **Keys needed**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

#### OpenAI (Image Generation)
- **Required**: OpenAI account with API access
- **Steps**:
  1. Go to https://platform.openai.com
  2. Navigate to API keys section
  3. Create a new API key
- **Keys needed**: `OPENAI_API_KEY`

### Analytics

#### Google Analytics
- **Required**: Google Analytics 4 property
- **Steps**:
  1. Go to https://analytics.google.com
  2. Create or select a property
  3. Get Measurement ID from Admin → Data Streams
  4. Create service account for API access
- **Keys needed**: `GOOGLE_ANALYTICS_PROPERTY_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`

#### Mixpanel
- **Required**: Mixpanel account
- **Steps**:
  1. Sign up at https://mixpanel.com
  2. Create a new project
  3. Get project token from Project Settings
- **Keys needed**: `MIXPANEL_TOKEN`, `MIXPANEL_API_SECRET`

#### Segment
- **Required**: Segment account
- **Steps**:
  1. Sign up at https://segment.com
  2. Create a workspace
  3. Add a JavaScript source
- **Keys needed**: `SEGMENT_WRITE_KEY`

### Communication

#### SendGrid
- **Required**: SendGrid account (Twilio company)
- **Steps**:
  1. Sign up at https://sendgrid.com
  2. Verify your email/domain
  3. Create API key in Settings → API Keys
- **Keys needed**: `SENDGRID_API_KEY`

#### Twilio
- **Required**: Twilio account
- **Steps**:
  1. Sign up at https://www.twilio.com
  2. Verify your phone number
  3. Purchase a phone number for SMS
  4. Get credentials from Console Dashboard
- **Keys needed**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

#### Slack
- **Required**: Slack workspace and app
- **Steps**:
  1. Go to https://api.slack.com/apps
  2. Create a new app
  3. Add OAuth scopes and install to workspace
- **Keys needed**: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`

### Translation

#### DeepL
- **Required**: DeepL API account
- **Steps**:
  1. Sign up at https://www.deepl.com/pro-api
  2. Choose a plan (free tier available)
  3. Get API key from account settings
- **Keys needed**: `DEEPL_API_KEY`

#### Google Translate
- **Required**: Google Cloud account
- **Steps**:
  1. Enable Cloud Translation API in GCP
  2. Create service account credentials
  3. Download JSON key file
- **Keys needed**: `GOOGLE_APPLICATION_CREDENTIALS` (path to JSON file)

### Search

#### Algolia
- **Required**: Algolia account
- **Steps**:
  1. Sign up at https://www.algolia.com
  2. Create an application
  3. Create an index for your content
  4. Get API keys from Dashboard
- **Keys needed**: `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`

### Monitoring

#### Sentry
- **Required**: Sentry account
- **Steps**:
  1. Sign up at https://sentry.io
  2. Create a new project
  3. Get DSN from Project Settings
- **Keys needed**: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

#### Datadog
- **Required**: Datadog account
- **Steps**:
  1. Sign up at https://www.datadoghq.com
  2. Get API key from Organization Settings
  3. Create an Application key
- **Keys needed**: `DATADOG_API_KEY`, `DATADOG_APP_KEY`

### Social Media

#### Twitter/X
- **Required**: Twitter Developer account
- **Steps**:
  1. Apply at https://developer.twitter.com
  2. Create a new app
  3. Generate API keys and access tokens
- **Keys needed**: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

#### Instagram
- **Required**: Facebook/Meta Developer account
- **Steps**:
  1. Go to https://developers.facebook.com
  2. Create an app with Instagram Basic Display
  3. Configure OAuth redirect URIs
  4. Get access tokens
- **Keys needed**: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`

### Weather

#### OpenWeather
- **Required**: OpenWeatherMap account
- **Steps**:
  1. Sign up at https://openweathermap.org
  2. Get API key from account settings
- **Keys needed**: `OPENWEATHER_API_KEY`

## 🆓 Services Available Locally (No API Key Required)

These services can run locally without external accounts:
- Redis (caching)
- PostgreSQL (if not using Supabase)
- Elasticsearch (search, alternative to Algolia)
- MinIO (file storage, alternative to Google Drive)
- MailHog (email testing, alternative to SendGrid)
- Grafana + Prometheus (monitoring, alternative to Datadog)

## 🎯 Recommended Priority

1. **Critical** (needed immediately):
   - Regenerate GitHub and Supabase tokens
   - OpenWeather (for weather widget)
   - SendGrid or local MailHog (for auth emails)

2. **Important** (core features):
   - Cloudflare (CDN integration)
   - Redis or local Redis (caching)
   - Sentry (error tracking)
   - DeepL or Google Translate (multi-language)

3. **Nice to have** (enhanced features):
   - Analytics services
   - Social media integrations
   - Advanced monitoring

## 📝 Next Steps

1. Copy `.env.mcp.example` to `.env.mcp`
2. Add API keys as you obtain them
3. Test each service after configuration
4. Use local alternatives where possible during development