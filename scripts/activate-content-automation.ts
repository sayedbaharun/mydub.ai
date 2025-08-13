#!/usr/bin/env tsx

/**
 * Content Automation Activation Script
 * Sets up and activates AI Reporter agents, content scheduling, and automation workflows
 */

import { createClient } from '@supabase/supabase-js'
import { ContentAutomationService } from '../src/shared/services/content-automation.service'
import { ExternalAPIsService } from '../src/shared/services/external-apis'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ContentSource {
  name: string
  url: string
  type: 'rss' | 'api' | 'web'
  category: string
  priority: 'high' | 'medium' | 'low'
  check_frequency: number // minutes
  is_active: boolean
  metadata: Record<string, any>
}

interface ContentTemplate {
  name: string
  name_ar?: string
  description: string
  content_type: string
  template_data: {
    title_template: string
    content_template: string
    default_tags: string[]
    default_category: string
    required_fields: string[]
  }
  is_active: boolean
  created_by: string
}

interface ContentRule {
  name: string
  description: string
  rule_type: 'auto_publish' | 'auto_categorize' | 'auto_tag' | 'content_filter'
  conditions: Record<string, any>
  actions: Record<string, any>
  is_active: boolean
  priority: number
  created_by: string
}

// Default content sources for Dubai
const defaultContentSources: ContentSource[] = [
  {
    name: 'Dubai Government News',
    url: 'https://www.dubai.ae/rss',
    type: 'rss',
    category: 'government',
    priority: 'high',
    check_frequency: 30,
    is_active: true,
    metadata: { official: true, language: 'en' }
  },
  {
    name: 'Dubai Calendar Events',
    url: 'https://www.dubaicalendar.ae/rss/events.xml',
    type: 'rss',
    category: 'events',
    priority: 'high',
    check_frequency: 60,
    is_active: true,
    metadata: { official: true, language: 'en' }
  },
  {
    name: 'TimeOut Dubai RSS',
    url: 'https://www.timeoutdubai.com/rss/things-to-do',
    type: 'rss',
    category: 'tourism',
    priority: 'medium',
    check_frequency: 120,
    is_active: true,
    metadata: { source_type: 'lifestyle', language: 'en' }
  },
  {
    name: 'Dubai Municipality News',
    url: 'https://www.dm.gov.ae/news',
    type: 'web',
    category: 'government',
    priority: 'high',
    check_frequency: 60,
    is_active: true,
    metadata: { official: true, requires_scraping: true }
  },
  {
    name: 'RTA Dubai Updates',
    url: 'https://www.rta.ae/wps/portal/rta/ae/public-transport',
    type: 'web',
    category: 'transport',
    priority: 'medium',
    check_frequency: 60,
    is_active: true,
    metadata: { official: true, transport_authority: true }
  },
  {
    name: 'Visit Dubai Blog',
    url: 'https://www.visitdubai.com/en/articles',
    type: 'web',
    category: 'tourism',
    priority: 'medium',
    check_frequency: 180,
    is_active: true,
    metadata: { official: true, tourism_board: true }
  }
]

// Default content templates
const defaultTemplates: ContentTemplate[] = [
  {
    name: 'Breaking News Template',
    name_ar: 'قالب الأخبار العاجلة',
    description: 'Template for urgent news and announcements',
    content_type: 'news',
    template_data: {
      title_template: 'Breaking: {{headline}}',
      content_template: `
# {{headline}}

{{summary}}

## Key Details

{{key_points}}

## Background

{{background_info}}

## What This Means

{{implications}}

## Next Steps

{{next_steps}}

---
*This is a developing story and will be updated as more information becomes available.*
      `.trim(),
      default_tags: ['breaking', 'news', 'dubai', 'urgent'],
      default_category: 'news',
      required_fields: ['headline', 'summary', 'key_points']
    },
    is_active: true,
    created_by: 'system'
  },
  {
    name: 'Event Announcement Template',
    description: 'Template for event and festival announcements',
    content_type: 'events',
    template_data: {
      title_template: '{{event_name}}: {{event_description}}',
      content_template: `
# {{event_name}}: {{event_description}}

{{event_summary}}

## Event Details

- **Date**: {{event_date}}
- **Time**: {{event_time}}
- **Location**: {{event_location}}
- **Price**: {{event_price}}

## What to Expect

{{event_highlights}}

## How to Attend

{{booking_info}}

## Additional Information

{{additional_details}}
      `.trim(),
      default_tags: ['events', 'dubai', 'entertainment', 'activities'],
      default_category: 'events',
      required_fields: ['event_name', 'event_date', 'event_location']
    },
    is_active: true,
    created_by: 'system'
  },
  {
    name: 'Restaurant Review Template',
    description: 'Template for restaurant and dining content',
    content_type: 'dining',
    template_data: {
      title_template: '{{restaurant_name}}: {{review_summary}}',
      content_template: `
# {{restaurant_name}}: {{review_summary}}

{{restaurant_intro}}

## The Experience

{{dining_experience}}

## Menu Highlights

{{menu_highlights}}

## Atmosphere & Service

{{atmosphere_service}}

## Practical Information

- **Location**: {{location}}
- **Cuisine**: {{cuisine_type}}
- **Price Range**: {{price_range}}
- **Reservations**: {{reservation_info}}

## Verdict

{{final_verdict}}
      `.trim(),
      default_tags: ['dining', 'restaurants', 'food', 'dubai', 'review'],
      default_category: 'dining',
      required_fields: ['restaurant_name', 'location', 'cuisine_type']
    },
    is_active: true,
    created_by: 'system'
  }
]

// Default content rules
const defaultContentRules: ContentRule[] = [
  {
    name: 'Auto-publish verified government content',
    description: 'Automatically publish content from verified government sources',
    rule_type: 'auto_publish',
    conditions: {
      source_type: 'official',
      category: 'government',
      content_length: { min: 100 }
    },
    actions: {
      auto_publish: true,
      set_priority: 'high',
      add_tags: ['official', 'government']
    },
    is_active: true,
    priority: 100,
    created_by: 'system'
  },
  {
    name: 'Categorize tourism content',
    description: 'Automatically categorize and tag tourism-related content',
    rule_type: 'auto_categorize',
    conditions: {
      keywords: ['attractions', 'tourism', 'sightseeing', 'visit', 'experience']
    },
    actions: {
      set_category: 'tourism',
      add_tags: ['tourism', 'attractions', 'experiences']
    },
    is_active: true,
    priority: 80,
    created_by: 'system'
  },
  {
    name: 'Filter spam content',
    description: 'Filter out low-quality or spam content',
    rule_type: 'content_filter',
    conditions: {
      content_length: { max: 50 },
      spam_indicators: ['click here', 'limited time', 'act now']
    },
    actions: {
      reject: true,
      flag_for_review: true
    },
    is_active: true,
    priority: 90,
    created_by: 'system'
  },
  {
    name: 'Breaking news priority',
    description: 'Set high priority for breaking news content',
    rule_type: 'auto_tag',
    conditions: {
      keywords: ['breaking', 'urgent', 'emergency', 'alert'],
      recency: { hours: 2 }
    },
    actions: {
      set_priority: 'high',
      add_tags: ['breaking', 'urgent'],
      notify_editors: true
    },
    is_active: true,
    priority: 95,
    created_by: 'system'
  }
]

async function setupContentSources() {
  console.log('📡 Setting up content sources...')
  
  try {
    for (const source of defaultContentSources) {
      const { data, error } = await supabase
        .from('content_sources')
        .upsert({
          ...source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name'
        })
        .select('id, name')
      
      if (error) {
        console.error(`❌ Failed to create source "${source.name}":`, error.message)
      } else {
        console.log(`✅ Content source "${source.name}" configured`)
      }
    }
  } catch (error) {
    console.error('❌ Error setting up content sources:', error)
  }
}

async function setupContentTemplates() {
  console.log('📝 Setting up content templates...')
  
  try {
    for (const template of defaultTemplates) {
      const templateData = await ContentAutomationService.createTemplate(template)
      if (templateData) {
        console.log(`✅ Template "${template.name}" created (ID: ${templateData.id})`)
      }
    }
  } catch (error) {
    console.error('❌ Error setting up templates:', error)
  }
}

async function setupContentRules() {
  console.log('⚙️ Setting up content rules...')
  
  try {
    for (const rule of defaultContentRules) {
      const ruleData = await ContentAutomationService.createContentRule(rule)
      if (ruleData) {
        console.log(`✅ Rule "${rule.name}" created (ID: ${ruleData.id})`)
      }
    }
  } catch (error) {
    console.error('❌ Error setting up rules:', error)
  }
}

async function setupScheduledJobs() {
  console.log('⏰ Setting up scheduled content jobs...')
  
  try {
    // Create some initial scheduled content using external APIs
    console.log('🔄 Generating initial content from external sources...')
    
    const result = await ContentAutomationService.generateContentFromExternalSources()
    console.log(`📰 Generated: ${result.generated} articles`)
    console.log(`📅 Scheduled: ${result.scheduled} articles`)
    
    if (result.errors.length > 0) {
      console.log('⚠️ Errors encountered:')
      result.errors.forEach(error => console.log(`   - ${error}`))
    }
    
    // Set up automation statistics tracking
    const stats = await ContentAutomationService.getAutomationStats()
    console.log('📊 Current automation statistics:')
    console.log(`   - Scheduled content: ${stats.scheduledContent}`)
    console.log(`   - Pending approvals: ${stats.pendingApprovals}`)
    console.log(`   - Published today: ${stats.publishedToday}`)
    console.log(`   - Active rules: ${stats.activeRules}`)
    console.log(`   - Templates: ${stats.templateCount}`)
    
  } catch (error) {
    console.error('❌ Error setting up scheduled jobs:', error)
  }
}

async function validateAPIConfiguration() {
  console.log('🔍 Validating API configurations...')
  
  const config = ExternalAPIsService.validateAPIConfiguration()
  
  console.log('📊 API Configuration Status:')
  console.log(`   - News API: ${config.newsAPI ? '✅ Configured' : '❌ Missing'}`)
  console.log(`   - Weather API: ${config.weatherAPI ? '✅ Configured' : '❌ Missing'}`)
  console.log(`   - Maps API: ${config.mapsAPI ? '✅ Configured' : '❌ Missing'}`)
  
  if (!config.newsAPI) {
    console.log('💡 Add VITE_NEWS_API_KEY to enable news content fetching')
  }
  if (!config.weatherAPI) {
    console.log('💡 Add VITE_OPENWEATHER_API_KEY to enable weather content')
  }
  if (!config.mapsAPI) {
    console.log('💡 Add VITE_GOOGLE_MAPS_API_KEY to enable location-based content')
  }
}

async function activateContentAutomation() {
  console.log('🚀 Activating content automation system...')
  console.log('=' .repeat(50))
  
  try {
    // Step 1: Validate API configuration
    await validateAPIConfiguration()
    console.log()
    
    // Step 2: Set up content sources
    await setupContentSources()
    console.log()
    
    // Step 3: Set up content templates
    await setupContentTemplates()
    console.log()
    
    // Step 4: Set up content rules
    await setupContentRules()
    console.log()
    
    // Step 5: Set up scheduled jobs
    await setupScheduledJobs()
    console.log()
    
    console.log('🎉 Content automation system successfully activated!')
    console.log()
    console.log('📋 Next steps:')
    console.log('   1. Configure API keys for external services')
    console.log('   2. Review and approve initial generated content')
    console.log('   3. Customize content templates as needed')
    console.log('   4. Monitor automation performance in the dashboard')
    console.log('   5. Set up Supabase Edge Functions for background processing')
    console.log()
    console.log('🔄 The system will now automatically:')
    console.log('   - Fetch content from configured sources every 30-180 minutes')
    console.log('   - Apply content rules and quality filters')
    console.log('   - Generate articles using AI templates')
    console.log('   - Schedule content for approval and publishing')
    
  } catch (error) {
    console.error('❌ Failed to activate content automation:', error)
    process.exit(1)
  }
}

// Execute the activation (ES Module compatible)
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname
if (isMainModule) {
  activateContentAutomation()
    .then(() => {
      console.log('🏁 Content automation activation completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Activation process failed:', error)
      process.exit(1)
    })
}

export { activateContentAutomation }