#!/usr/bin/env node

/**
 * Setup script for AI Reporter System
 * 
 * This script initializes the AI Reporter system by:
 * 1. Applying database migrations
 * 2. Seeding reporter agents
 * 3. Setting up external data sources
 * 4. Creating initial tasks
 * 5. Testing the system
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('📄 Applying AI Reporter database migration...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250205_ai_reporter_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await supabase.rpc('exec_sql', { sql: statement })
      }
    }
    
    console.log('✅ Migration applied successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

async function seedReporterAgents() {
  console.log('🤖 Creating AI Reporter agents...')
  
  const agents = [
    {
      name: 'News Reporter',
      type: 'news',
      config: {
        update_frequency: '15m',
        priority_keywords: ['breaking', 'government', 'official', 'announcement'],
        quality_threshold: 0.8,
        auto_publish: false
      },
      capabilities: ['government_data', 'breaking_news', 'business_updates'],
      schedule: { cron: '*/15 * * * *' }, // Every 15 minutes
      performance_metrics: {
        success_rate: 0,
        quality_score: 0,
        articles_generated: 0,
        articles_approved: 0
      }
    },
    {
      name: 'Lifestyle Reporter',
      type: 'lifestyle',
      config: {
        update_frequency: '2h',
        priority_keywords: ['restaurant', 'event', 'nightlife', 'entertainment'],
        quality_threshold: 0.75,
        auto_publish: false
      },
      capabilities: ['events', 'dining', 'entertainment', 'social_media'],
      schedule: { cron: '0 */2 * * *' }, // Every 2 hours
      performance_metrics: {
        success_rate: 0,
        quality_score: 0,
        articles_generated: 0,
        articles_approved: 0
      }
    },
    {
      name: 'Business Reporter',
      type: 'business',
      config: {
        update_frequency: '1h',
        priority_keywords: ['market', 'economy', 'real estate', 'investment'],
        quality_threshold: 0.85,
        auto_publish: false
      },
      capabilities: ['market_data', 'real_estate', 'economic_indicators'],
      schedule: { cron: '0 * * * *' }, // Every hour
      performance_metrics: {
        success_rate: 0,
        quality_score: 0,
        articles_generated: 0,
        articles_approved: 0
      }
    },
    {
      name: 'Tourism Reporter',
      type: 'tourism',
      config: {
        update_frequency: '4h',
        priority_keywords: ['attraction', 'tourism', 'visitor', 'travel'],
        quality_threshold: 0.75,
        auto_publish: false
      },
      capabilities: ['attractions', 'travel_tips', 'visitor_info'],
      schedule: { cron: '0 */4 * * *' }, // Every 4 hours
      performance_metrics: {
        success_rate: 0,
        quality_score: 0,
        articles_generated: 0,
        articles_approved: 0
      }
    },
    {
      name: 'Weather & Traffic Reporter',
      type: 'weather',
      config: {
        update_frequency: '30m',
        priority_keywords: ['weather', 'traffic', 'alert', 'condition'],
        quality_threshold: 0.7,
        auto_publish: true // Weather updates can be auto-published
      },
      capabilities: ['weather_data', 'traffic_data', 'alerts'],
      schedule: { cron: '*/30 * * * *' }, // Every 30 minutes
      performance_metrics: {
        success_rate: 0,
        quality_score: 0,
        articles_generated: 0,
        articles_approved: 0
      }
    }
  ]

  const { data, error } = await supabase
    .from('ai_reporter_agents')
    .insert(agents)
    .select()

  if (error) {
    console.error('❌ Failed to create agents:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} AI Reporter agents`)
  return data
}

async function seedDataSources(agents: any[]) {
  console.log('📡 Setting up data sources...')
  
  // RSS feeds configuration
  const sources = [
    // Government sources for News Reporter
    {
      name: 'Dubai Media Office',
      type: 'rss',
      url: 'https://www.dubai.ae/en/media-centre/rss',
      agent_id: agents.find(a => a.type === 'news')?.id,
      fetch_interval: '15 minutes',
      config: { priority: 'high', keywords: ['government', 'official'] }
    },
    {
      name: 'RTA Dubai',
      type: 'rss', 
      url: 'https://www.rta.ae/wps/portal/rta/ae/public-transport/rta-news',
      agent_id: agents.find(a => a.type === 'news')?.id,
      fetch_interval: '30 minutes',
      config: { priority: 'medium', keywords: ['transport', 'traffic'] }
    },
    // News sources
    {
      name: 'Gulf News UAE',
      type: 'rss',
      url: 'https://gulfnews.com/uae/rss',
      agent_id: agents.find(a => a.type === 'news')?.id,
      fetch_interval: '30 minutes',
      config: { priority: 'high', keywords: ['UAE', 'Dubai'] }
    },
    // Event sources for Lifestyle Reporter
    {
      name: 'Dubai Calendar',
      type: 'api',
      url: 'https://www.dubaiarts.gov.ae/en/api/events',
      agent_id: agents.find(a => a.type === 'lifestyle')?.id,
      fetch_interval: '2 hours',
      config: { priority: 'medium', keywords: ['events', 'culture'] }
    },
    {
      name: 'Time Out Dubai Events',
      type: 'rss',
      url: 'https://www.timeoutdubai.com/rss/events',
      agent_id: agents.find(a => a.type === 'lifestyle')?.id,
      fetch_interval: '4 hours',
      config: { priority: 'medium', keywords: ['dining', 'nightlife'] }
    },
    // Business sources
    {
      name: 'Dubai Chamber',
      type: 'rss',
      url: 'https://www.dubaichamber.com/news/rss',
      agent_id: agents.find(a => a.type === 'business')?.id,
      fetch_interval: '1 hour',
      config: { priority: 'high', keywords: ['business', 'economy'] }
    },
    // Tourism sources
    {
      name: 'Visit Dubai',
      type: 'api',
      url: 'https://www.visitdubai.com/api/attractions',
      agent_id: agents.find(a => a.type === 'tourism')?.id,
      fetch_interval: '6 hours',
      config: { priority: 'medium', keywords: ['attractions', 'tourism'] }
    },
    // Weather sources
    {
      name: 'OpenWeather Dubai',
      type: 'api',
      url: 'https://api.openweathermap.org/data/2.5/weather?q=Dubai,AE',
      agent_id: agents.find(a => a.type === 'weather')?.id,
      fetch_interval: '30 minutes',
      config: { priority: 'high', keywords: ['weather', 'temperature'] },
      credentials: { api_key: process.env.VITE_OPENWEATHER_API_KEY }
    }
  ]

  const { data, error } = await supabase
    .from('agent_sources')
    .insert(sources)
    .select()

  if (error) {
    console.error('❌ Failed to create sources:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} data sources`)
  return data
}

async function createInitialTasks(sources: any[]) {
  console.log('📋 Creating initial monitoring tasks...')
  
  const tasks = sources.map(source => ({
    agent_id: source.agent_id,
    type: 'monitor_source',
    priority: 'medium',
    status: 'pending',
    source_url: source.url,
    metadata: {
      source_id: source.id,
      source_name: source.name,
      initial_task: true
    }
  }))

  const { data, error } = await supabase
    .from('agent_tasks')
    .insert(tasks)
    .select()

  if (error) {
    console.error('❌ Failed to create tasks:', error)
    throw error
  }

  console.log(`✅ Created ${data.length} initial tasks`)
  return data
}

async function testSystemHealth() {
  console.log('🔍 Testing system health...')
  
  try {
    // Test agent orchestrator
    const orchestratorResponse = await fetch(`${supabaseUrl}/functions/v1/agent-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ action: 'get_status' })
    })

    if (orchestratorResponse.ok) {
      console.log('✅ Agent orchestrator is responding')
    } else {
      console.log('⚠️  Agent orchestrator test failed')
    }

    // Test source monitor
    const monitorResponse = await fetch(`${supabaseUrl}/functions/v1/source-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ action: 'get_status' })
    })

    if (monitorResponse.ok) {
      console.log('✅ Source monitor is responding')
    } else {
      console.log('⚠️  Source monitor test failed')
    }

    console.log('✅ System health check completed')
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
}

async function main() {
  console.log('🚀 Setting up AI Reporter System...\n')
  
  try {
    // 1. Apply database migration
    await applyMigration()
    
    // 2. Seed reporter agents
    const agents = await seedReporterAgents()
    
    // 3. Set up data sources
    const sources = await seedDataSources(agents)
    
    // 4. Create initial tasks
    await createInitialTasks(sources)
    
    // 5. Test system health
    await testSystemHealth()
    
    console.log('\n🎉 AI Reporter System setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Visit /dashboard/ai-reporters to monitor agents')
    console.log('2. Visit /dashboard/content-approval to review generated content')
    console.log('3. Configure additional data sources as needed')
    console.log('4. Set up automated scheduling for content generation')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
main()