/**
 * Seed Reporter Sources Script
 * Populates the agent_sources table with all configured RSS feeds and API sources
 */

import { createClient } from '@supabase/supabase-js';
import { RSS_FEEDS } from '@/shared/config/rss-feeds.config';
import { API_SOURCES, getActiveAPISources } from '@/shared/config/api-sources.config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Agent type mappings
const AGENT_MAPPINGS = {
  news: 'news-reporter',
  lifestyle: 'lifestyle-reporter',
  business: 'business-reporter',
  tourism: 'tourism-reporter',
  weather: 'weather-traffic-reporter',
};

async function getOrCreateAgents() {
  const agents = [];
  
  for (const [type, name] of Object.entries(AGENT_MAPPINGS)) {
    // Check if agent exists
    const { data: existing } = await supabase
      .from('ai_reporter_agents')
      .select('id, name, type')
      .eq('name', name)
      .single();
    
    if (existing) {
      agents.push(existing);
    } else {
      // Create agent
      const { data: newAgent, error } = await supabase
        .from('ai_reporter_agents')
        .insert({
          name,
          type: type as any,
          config: {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000,
          },
          capabilities: ['fetch', 'analyze', 'write', 'review'],
          schedule: {
            cron: '0 */2 * * *', // Every 2 hours
            timezone: 'Asia/Dubai',
          },
          is_active: true,
        })
        .select()
        .single();
      
      if (error) {
        
        continue;
      }
      
      agents.push(newAgent);
    }
  }
  
  return agents;
}

async function seedRSSFeeds(agents: any[]) {
    const sources = [];
  
  for (const feed of RSS_FEEDS) {
    // Find matching agents for this feed
    const matchingAgents = agents.filter(agent => 
      feed.agentTypes.includes(agent.type)
    );
    
    for (const agent of matchingAgents) {
      const source = {
        name: feed.name,
        type: 'rss' as const,
        url: feed.url,
        credentials: {}, // RSS feeds don't need credentials
        fetch_interval: `${feed.fetchInterval} minutes`,
        is_active: true,
        agent_id: agent.id,
        config: {
          priority: feed.priority,
          language: feed.language,
          category: feed.category,
          parseConfig: feed.parseConfig || {},
        },
      };
      
      sources.push(source);
    }
  }
  
  // Insert sources in batches
  const batchSize = 50;
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('agent_sources')
      .upsert(batch, {
        onConflict: 'agent_id,url',
        ignoreDuplicates: false,
      });
    
    if (error) {
      
    } else {
          }
  }
  
  return sources.length;
}

async function seedAPISources(agents: any[]) {
    const sources = [];
  const activeAPIs = getActiveAPISources();
  
  for (const apiSource of activeAPIs) {
    // Find matching agents for this API
    const matchingAgents = agents.filter(agent => 
      apiSource.agentTypes.includes(agent.type)
    );
    
    for (const agent of matchingAgents) {
      for (const endpoint of apiSource.endpoints) {
        const source = {
          name: `${apiSource.name} - ${endpoint.name}`,
          type: 'api' as const,
          url: `${apiSource.baseUrl}${endpoint.path}`,
          credentials: {
            // Store encrypted reference, not actual keys
            authType: apiSource.authentication.type,
            configuredAt: new Date().toISOString(),
          },
          fetch_interval: `${Math.floor(60 / apiSource.rateLimit.requestsPerMinute)} minutes`,
          is_active: true,
          agent_id: agent.id,
          config: {
            priority: apiSource.priority,
            endpoint: endpoint.name,
            method: endpoint.method,
            parameters: endpoint.parameters || {},
            headers: endpoint.headers || {},
            responseFormat: endpoint.responseFormat,
            dataPath: endpoint.dataPath,
            rateLimit: apiSource.rateLimit,
          },
        };
        
        sources.push(source);
      }
    }
  }
  
  // Insert sources in batches
  const batchSize = 50;
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('agent_sources')
      .upsert(batch, {
        onConflict: 'agent_id,url',
        ignoreDuplicates: false,
      });
    
    if (error) {
      
    } else {
          }
  }
  
  return sources.length;
}

async function updateSourcePriorities() {
    // Set high priority sources to fetch more frequently
  const { error: highPriorityError } = await supabase
    .from('agent_sources')
    .update({ fetch_interval: '15 minutes' })
    .eq('config->priority', 'high');
  
  if (highPriorityError) {
    
  }
  
  // Set low priority sources to fetch less frequently
  const { error: lowPriorityError } = await supabase
    .from('agent_sources')
    .update({ fetch_interval: '4 hours' })
    .eq('config->priority', 'low');
  
  if (lowPriorityError) {
    
  }
}

async function createInitialTasks(agents: any[]) {
    const tasks = [];
  
  for (const agent of agents) {
    // Get sources for this agent
    const { data: sources, error } = await supabase
      .from('agent_sources')
      .select('id, url, name')
      .eq('agent_id', agent.id)
      .eq('is_active', true)
      .limit(5); // Start with top 5 sources per agent
    
    if (error || !sources) continue;
    
    for (const source of sources) {
      tasks.push({
        agent_id: agent.id,
        type: 'fetch',
        priority: 'medium',
        status: 'pending',
        source_url: source.url,
        metadata: {
          source_id: source.id,
          source_name: source.name,
        },
      });
    }
  }
  
  // Insert tasks
  if (tasks.length > 0) {
    const { error } = await supabase
      .from('agent_tasks')
      .insert(tasks);
    
    if (error) {
      
    } else {
          }
  }
}

async function generateSummaryReport() {
    // Count sources by type
  const { data: sourceStats } = await supabase
    .from('agent_sources')
    .select('type, agent_id')
    .order('type');
  
  if (sourceStats) {
    const typeCount = sourceStats.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
        Object.entries(typeCount).forEach(([type, count]) => {
          });
  }
  
  // Count sources by agent
  const { data: agents } = await supabase
    .from('ai_reporter_agents')
    .select('name, type');
  
  if (agents) {
        for (const agent of agents) {
      const { count } = await supabase
        .from('agent_sources')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);
      
          }
  }
  
  // Active vs inactive sources
  const { count: activeCount } = await supabase
    .from('agent_sources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  const { count: totalCount } = await supabase
    .from('agent_sources')
    .select('*', { count: 'exact', head: true });
  
      }

async function main() {
  try {
        // Step 1: Create or get agents
    const agents = await getOrCreateAgents();
        // Step 2: Seed RSS feeds
    const rssCount = await seedRSSFeeds(agents);
        // Step 3: Seed API sources
    const apiCount = await seedAPISources(agents);
        // Step 4: Update priorities
    await updateSourcePriorities();
    
    // Step 5: Create initial tasks
    await createInitialTasks(agents);
    
    // Step 6: Generate summary report
    await generateSummaryReport();
    
      } catch (error) {
    console.error('Error seeding reporter sources:', error);
    process.exit(1);
  }
}

// Run the seeder
main();