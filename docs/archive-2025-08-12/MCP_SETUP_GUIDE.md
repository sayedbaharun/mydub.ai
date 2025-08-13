# MCP (Model Context Protocol) Setup Guide

This guide explains how to configure and use the MCP servers for the MyDub.ai project.

## Overview

MCP servers provide integration with various external services and tools. We've configured servers for:

### Content & Media
- **gdrive**: Google Drive integration for document and media management
- **cloudflare**: CDN and edge computing management
- **image-generation**: AI-powered image generation for articles

### Data & Analytics
- **google-analytics**: Website analytics and user behavior tracking
- **mixpanel**: Product analytics and user engagement
- **segment**: Customer data platform for unified analytics

### Communication
- **sendgrid**: Email delivery service for newsletters and notifications
- **twilio**: SMS notifications (important for Dubai market)
- **slack**: Team collaboration and content approval workflows

### Localization & Translation
- **deepl**: High-quality translation service
- **google-translate**: Alternative translation service with broader language support

### Search & Discovery
- **algolia**: Advanced search functionality with Arabic support
- **redis**: High-performance caching for frequently accessed content

### Monitoring & Performance
- **sentry**: Error tracking and monitoring
- **datadog**: Comprehensive application performance monitoring

### Social Media
- **twitter**: Twitter/X integration for Dubai news and trends
- **instagram**: Instagram content for Dubai lifestyle articles

## Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp .env.mcp.example .env.mcp
   ```

2. **Configure API Keys:**
   Edit `.env.mcp` and add your actual API keys for each service you want to use.

3. **Update your shell profile:**
   Add the following to your `.bashrc`, `.zshrc`, or equivalent:
   ```bash
   # Load MCP environment variables
   if [ -f "$HOME/path/to/project/.env.mcp" ]; then
     export $(cat $HOME/path/to/project/.env.mcp | grep -v '^#' | xargs)
   fi
   ```

4. **Restart Claude Code:**
   After configuring the environment variables, restart Claude Code for the changes to take effect.

## Service-Specific Setup

### Google Services (Drive, Analytics, Translate)
1. Create a Google Cloud Project
2. Enable the required APIs
3. Create service account credentials
4. Download the JSON key file

### Cloudflare
1. Get your API token from Cloudflare dashboard
2. Note your Account ID

### SendGrid
1. Create a SendGrid account
2. Generate an API key with appropriate permissions

### Twilio
1. Sign up for Twilio
2. Get your Account SID and Auth Token
3. Purchase a phone number for SMS

### Algolia
1. Create an Algolia account
2. Create an index for your content
3. Generate API keys

### Social Media APIs
- Twitter: Apply for developer access
- Instagram: Set up Facebook/Meta developer account

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.mcp` or `mcp.json.secure` to version control
- Use environment variables instead of hardcoding API keys
- Regularly rotate API keys
- Use least-privilege principle for API permissions

## Testing MCP Servers

After setup, you can test each server:

```bash
# Test if a server is working (example with Cloudflare)
# In Claude Code, try using the Cloudflare MCP functions
```

## Troubleshooting

1. **Server not responding**: Check if the API key is correctly set
2. **Permission errors**: Verify API key has required permissions
3. **Rate limiting**: Some services have rate limits, implement caching where possible

## Next Steps

1. Prioritize which services to implement first based on immediate needs
2. Set up monitoring for API usage and costs
3. Implement fallback mechanisms for critical services
4. Document any custom configurations or workflows