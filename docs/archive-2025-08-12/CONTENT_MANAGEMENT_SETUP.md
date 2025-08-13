# MyDub.AI Content Management System Setup Guide

This guide will help you set up and deploy the comprehensive content management and automation system for MyDub.AI.

## 🚀 Quick Start

### 1. Import Existing Articles

First, import the 15 pre-written articles from the `news_articles` directory:

```bash
npm run content:import
```

This will:
- Import all 15 articles with proper categorization and tagging
- Set up SEO metadata and reading time calculations
- Configure image references and attribution
- Apply content priority and quality scoring

### 2. Activate Content Automation

Set up the automation system with templates, rules, and sources:

```bash
npm run content:activate
```

This will:
- Configure content sources (Dubai Government, TimeOut Dubai, etc.)
- Create content templates for different article types
- Set up automation rules for categorization and filtering
- Initialize the content scheduling system

### 3. Complete Setup (Both Steps)

Run both import and activation in sequence:

```bash
npm run content:setup
```

## 📊 Content Management Features

### Automated Content Creation

- **AI Reporter Agents**: Specialized agents for News, Tourism, Business, Lifestyle, and Weather/Traffic
- **External API Integration**: News API, Dubai Calendar, TimeOut Dubai, government sources
- **Content Templates**: Pre-built structures for different content types
- **Quality Assessment**: AI-powered relevance, priority, and quality scoring

### Content Processing Pipeline

1. **Content Fetching**: Automated retrieval from configured sources
2. **Content Analysis**: AI-powered relevance and quality assessment
3. **Rule Application**: Automated categorization, tagging, and filtering
4. **Template Generation**: Structured article creation using AI
5. **Approval Workflow**: Human review for sensitive content
6. **Scheduled Publishing**: Timed release to optimize engagement

### Content Approval System

- **Multi-level Approval**: Different approval requirements by content type
- **Editorial Dashboard**: Visual interface for content review
- **Quality Metrics**: Automated scoring and human feedback integration
- **Content Moderation**: Spam and inappropriate content filtering

## 🔧 Configuration

### Environment Variables

Required for full functionality:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External APIs (Optional but recommended)
VITE_NEWS_API_KEY=your_newsapi_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
FIXER_API_KEY=your_fixer_io_key

# AI Services (Required for content generation)
VITE_OPENAI_API_KEY=your_openai_key
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

### Content Sources Configuration

The system comes pre-configured with Dubai-focused content sources:

1. **Government Sources**:
   - Dubai Government News (RSS)
   - Dubai Municipality Updates (Web scraping)
   - RTA Dubai Transport Updates

2. **Tourism & Events**:
   - Dubai Calendar Events (RSS)
   - Visit Dubai Blog (Web scraping)
   - TimeOut Dubai (RSS)

3. **News & Media**:
   - UAE News Outlets (RSS/API)
   - International Dubai Coverage (News API)

### Content Templates

Pre-built templates include:

- **Breaking News Template**: For urgent announcements
- **Event Announcement Template**: For festivals and activities
- **Restaurant Review Template**: For dining content
- **Tourism Guide Template**: For attractions and experiences
- **Government Update Template**: For official communications

## 📈 Content Automation Dashboard

Access the dashboard at `/dashboard/content-automation` to:

- Monitor content generation statistics
- Review scheduled content queue
- Manage templates and automation rules
- Process content manually when needed
- View performance metrics and error logs

### Dashboard Features

- **Real-time Statistics**: Live metrics on content production
- **Content Queue Management**: View and modify scheduled content
- **Template Editor**: Customize content generation templates
- **Rule Configuration**: Set up automated content processing rules
- **Performance Analytics**: Track content engagement and success rates

## 🛠 Advanced Configuration

### Custom Content Sources

Add new content sources programmatically:

```typescript
const newSource = {
  name: 'Custom Source',
  url: 'https://example.com/feed.xml',
  type: 'rss' as const,
  category: 'custom',
  priority: 'medium' as const,
  check_frequency: 60, // minutes
  is_active: true,
  metadata: { 
    official: false, 
    language: 'en' 
  }
}

await supabase.from('content_sources').insert(newSource)
```

### Custom Content Templates

Create templates for specific content types:

```typescript
const customTemplate = {
  name: 'Custom Template',
  description: 'Template for custom content',
  content_type: 'custom',
  template_data: {
    title_template: '{{headline}}',
    content_template: `
# {{headline}}

{{introduction}}

## Key Points

{{key_points}}

## Conclusion

{{conclusion}}
    `.trim(),
    default_tags: ['custom', 'dubai'],
    default_category: 'general',
    required_fields: ['headline', 'introduction']
  },
  is_active: true,
  created_by: 'admin'
}

await ContentAutomationService.createTemplate(customTemplate)
```

### Custom Automation Rules

Set up intelligent content processing:

```typescript
const customRule = {
  name: 'High Priority Events',
  description: 'Auto-prioritize event content',
  rule_type: 'auto_tag' as const,
  conditions: {
    category: 'events',
    keywords: ['festival', 'concert', 'exhibition']
  },
  actions: {
    set_priority: 'high',
    add_tags: ['priority', 'featured'],
    notify_editors: true
  },
  is_active: true,
  priority: 85,
  created_by: 'admin'
}

await ContentAutomationService.createContentRule(customRule)
```

## 🔄 Monitoring and Maintenance

### Automated Processing

The system runs background jobs to:

- Fetch content from sources every 30-180 minutes
- Process scheduled content every 5 minutes
- Generate new content every 30 minutes
- Clean up old content and cache data

### Manual Operations

Use these commands for manual control:

```bash
# Process scheduled content immediately
npm run content:process

# Generate new content from external sources
npm run content:generate

# View automation statistics
npm run content:stats
```

### Performance Monitoring

Key metrics to monitor:

- **Content Generation Rate**: Target 50-100 articles per week
- **Approval Rate**: Should maintain 80%+ approval rate
- **Source Reliability**: Monitor API response rates and errors
- **Publication Timeliness**: Track scheduled vs actual publication times
- **Quality Scores**: Monitor AI assessment accuracy

## 🚨 Troubleshooting

### Common Issues

1. **No Content Being Generated**:
   - Check API keys configuration
   - Verify content sources are accessible
   - Review automation rules for conflicts

2. **Content Not Publishing**:
   - Check approval workflows
   - Verify scheduled times are in the future
   - Review content quality scores

3. **Poor Content Quality**:
   - Adjust content templates
   - Modify automation rules
   - Update AI model parameters

4. **High Error Rates**:
   - Monitor external API limits
   - Check database connection
   - Review system logs

### Support and Logs

- Check browser console for frontend errors
- Review Supabase logs for database issues
- Monitor Vercel function logs for API errors
- Use dashboard error reporting for automation issues

## 📝 Content Guidelines

### Best Practices

1. **Content Quality**:
   - Minimum 300 words for articles
   - Include proper headings and structure
   - Add relevant tags and categories
   - Ensure Dubai relevance

2. **SEO Optimization**:
   - Use descriptive titles and meta descriptions
   - Include relevant keywords naturally
   - Optimize images with alt text
   - Structure content with proper headings

3. **Cultural Sensitivity**:
   - Respect local customs and traditions
   - Use appropriate language and terminology
   - Consider religious and cultural contexts
   - Maintain factual accuracy

4. **Legal Compliance**:
   - Respect copyright and attribution
   - Follow UAE media regulations
   - Ensure content moderation
   - Maintain editorial standards

## 🎯 Success Metrics

Track these KPIs to measure system effectiveness:

- **Content Volume**: 50-100 articles per week
- **Content Quality**: 4.0+ average rating
- **Publication Speed**: <24 hours for breaking news
- **Audience Engagement**: Track views, shares, comments
- **System Uptime**: 99%+ availability
- **Processing Efficiency**: <5% error rate

## 🔮 Future Enhancements

Planned improvements include:

- **Multi-language Support**: Arabic content generation and translation
- **Video Content**: Integration with video processing and creation
- **Social Media Integration**: Cross-platform content distribution
- **Advanced Analytics**: Deeper audience insights and content optimization
- **Voice Content**: Integration with text-to-speech for accessibility
- **Mobile App**: Native mobile content management interface

---

For additional support or questions, refer to the main project documentation or contact the development team.