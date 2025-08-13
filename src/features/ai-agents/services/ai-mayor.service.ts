import { 
  AIMayor, 
  AIAgent, 
  IntelligentQuery, 
  AgentResponse, 
  OrchestrationRule,
  AgentAllocation
} from '../types/agent.types'
import { supabase } from '@/shared/lib/supabase'
import { specializedAgentServices } from './specialized-agents.service'

/**
 * AI Mayor - The central orchestrator of all Dubai AI agents
 * This is the brain that coordinates all specialized agents to provide
 * comprehensive, intelligent responses about Dubai
 */
export class AIMayorService {
  private static instance: AIMayorService
  private aiMayor!: AIMayor
  private agents: Map<string, AIAgent> = new Map()
  private orchestrationRules: OrchestrationRule[] = []

  constructor() {
    this.initializeAIMayor()
    this.loadAgents()
    this.setupOrchestrationRules()
  }

  static getInstance(): AIMayorService {
    if (!AIMayorService.instance) {
      AIMayorService.instance = new AIMayorService()
    }
    return AIMayorService.instance
  }

  private initializeAIMayor() {
    this.aiMayor = {
      id: 'ai_mayor',
      name: 'Dubai AI Mayor',
      nameAr: 'عمدة دبي الذكي',
      agents: [],
      orchestrationRules: [],
      cityKnowledge: {
        realTimeData: [],
        historicalPatterns: [],
        predictiveModels: [],
        optimizationTargets: []
      },
      decisionMaking: {
        consensusThreshold: 0.8,
        escalationRules: [],
        confidenceRequirement: 0.7,
        learningRate: 0.1
      },
      publicServices: []
    }
  }

  private async loadAgents() {
    // Initialize all specialized agents
    const agentConfigs = [
      {
        id: 'government_agent',
        name: 'Government Services Assistant',
        nameAr: 'مساعد الخدمات الحكومية',
        personality: {
          tone: 'professional' as const,
          culturalContext: 'local' as const,
          languages: ['en', 'ar'],
          emoji: '🏛️',
          greeting: 'I can help you with all Dubai government services and procedures.',
          greetingAr: 'يمكنني مساعدتك في جميع الخدمات والإجراءات الحكومية في دبي.',
          signature: 'Dubai Government Services AI'
        },
        specialties: [
          'visa_applications', 'permits', 'licenses', 'municipality_services',
          'rta_services', 'health_authority', 'business_registration'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Real-time government service availability and processing times',
            confidence: 0.95,
            dataSource: 'dubai_government_apis',
            updateFrequency: 'minute' as const
          },
          {
            type: 'autonomous_action' as const,
            description: 'Can initiate government applications and track status',
            confidence: 0.85,
            dataSource: 'government_portals',
            updateFrequency: 'instant' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.95,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['visa', 'permit', 'license', 'government', 'municipality', 'rta'],
            action: 'direct_response' as const,
            dataSources: ['government_services', 'processing_times', 'requirements'],
            priority: 'high' as const
          }
        ],
        collaborationRules: []
      },
      {
        id: 'transport_agent',
        name: 'Dubai Transport Navigator',
        nameAr: 'ملاح المواصلات في دبي',
        personality: {
          tone: 'helpful' as const,
          culturalContext: 'local' as const,
          languages: ['en', 'ar'],
          emoji: '🚇',
          greeting: 'I know every route, schedule, and transport option in Dubai.',
          greetingAr: 'أعرف كل طريق وجدول زمني وخيار نقل في دبي.',
          signature: 'Dubai Transport AI'
        },
        specialties: [
          'metro_schedules', 'bus_routes', 'taxi_services', 'traffic_conditions',
          'parking_availability', 'ride_sharing', 'route_optimization'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Live traffic, metro delays, parking availability',
            confidence: 0.92,
            dataSource: 'rta_apis',
            updateFrequency: 'instant' as const
          },
          {
            type: 'predictive' as const,
            description: 'Predicts optimal travel times and routes',
            confidence: 0.88,
            dataSource: 'traffic_patterns',
            updateFrequency: 'minute' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.92,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['metro', 'bus', 'taxi', 'traffic', 'parking', 'route', 'transport'],
            action: 'direct_response' as const,
            dataSources: ['rta_data', 'traffic_data', 'schedules'],
            priority: 'high' as const
          }
        ],
        collaborationRules: []
      },
      {
        id: 'business_agent',
        name: 'Dubai Business Advisor',
        nameAr: 'مستشار الأعمال في دبي',
        personality: {
          tone: 'professional' as const,
          culturalContext: 'business' as const,
          languages: ['en', 'ar'],
          emoji: '🏢',
          greeting: 'I provide expert guidance on business opportunities and regulations in Dubai.',
          greetingAr: 'أقدم إرشادات خبيرة حول الفرص التجارية واللوائح في دبي.',
          signature: 'Dubai Business Intelligence AI'
        },
        specialties: [
          'company_formation', 'trade_licenses', 'free_zones', 'regulations',
          'market_analysis', 'networking', 'investment_opportunities'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Market trends, regulatory updates, business opportunities',
            confidence: 0.90,
            dataSource: 'ded_apis',
            updateFrequency: 'hourly' as const
          },
          {
            type: 'learning' as const,
            description: 'Learns from successful business patterns',
            confidence: 0.85,
            dataSource: 'business_analytics',
            updateFrequency: 'daily' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.90,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['business', 'company', 'license', 'investment', 'market', 'freezone'],
            action: 'direct_response' as const,
            dataSources: ['business_data', 'regulations', 'market_data'],
            priority: 'high' as const
          }
        ],
        collaborationRules: []
      },
      {
        id: 'culture_agent',
        name: 'Dubai Culture Expert',
        nameAr: 'خبير الثقافة في دبي',
        personality: {
          tone: 'enthusiastic' as const,
          culturalContext: 'local' as const,
          languages: ['en', 'ar', 'ur', 'hi'],
          emoji: '🕌',
          greeting: 'I share the rich culture, traditions, and customs of Dubai and the UAE.',
          greetingAr: 'أشارككم الثقافة الغنية والتقاليد والعادات في دبي والإمارات.',
          signature: 'Dubai Cultural Heritage AI'
        },
        specialties: [
          'traditions', 'customs', 'etiquette', 'festivals', 'heritage',
          'art_culture', 'religious_practices', 'local_customs'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Current events, festivals, cultural activities',
            confidence: 0.88,
            dataSource: 'cultural_apis',
            updateFrequency: 'hourly' as const
          },
          {
            type: 'learning' as const,
            description: 'Adapts cultural advice based on user background',
            confidence: 0.82,
            dataSource: 'cultural_interactions',
            updateFrequency: 'daily' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.88,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['culture', 'tradition', 'custom', 'etiquette', 'festival', 'heritage'],
            action: 'direct_response' as const,
            dataSources: ['cultural_data', 'events', 'traditions'],
            priority: 'normal' as const
          }
        ],
        collaborationRules: []
      },
      {
        id: 'lifestyle_agent',
        name: 'Dubai Lifestyle Concierge',
        nameAr: 'كونسيرج نمط الحياة في دبي',
        personality: {
          tone: 'friendly' as const,
          culturalContext: 'international' as const,
          languages: ['en', 'ar'],
          emoji: '🌟',
          greeting: 'I help you discover the best dining, entertainment, and lifestyle experiences in Dubai.',
          greetingAr: 'أساعدك في اكتشاف أفضل تجارب الطعام والترفيه ونمط الحياة في دبي.',
          signature: 'Dubai Lifestyle AI'
        },
        specialties: [
          'restaurants', 'entertainment', 'shopping', 'wellness', 'nightlife',
          'sports', 'recreation', 'events', 'experiences'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Restaurant availability, event schedules, entertainment options',
            confidence: 0.85,
            dataSource: 'lifestyle_apis',
            updateFrequency: 'minute' as const
          },
          {
            type: 'predictive' as const,
            description: 'Recommends experiences based on preferences',
            confidence: 0.80,
            dataSource: 'user_preferences',
            updateFrequency: 'hourly' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.85,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['restaurant', 'food', 'entertainment', 'shopping', 'fun', 'activity'],
            action: 'direct_response' as const,
            dataSources: ['venues', 'events', 'reviews'],
            priority: 'normal' as const
          }
        ],
        collaborationRules: []
      },
      {
        id: 'environment_agent',
        name: 'Dubai Environment Monitor',
        nameAr: 'مراقب البيئة في دبي',
        personality: {
          tone: 'authoritative' as const,
          culturalContext: 'local' as const,
          languages: ['en', 'ar'],
          emoji: '🌦️',
          greeting: 'I provide real-time environmental conditions and weather forecasts for Dubai.',
          greetingAr: 'أقدم الظروف البيئية الحالية وتوقعات الطقس لدبي.',
          signature: 'Dubai Environmental AI'
        },
        specialties: [
          'weather_forecasting', 'air_quality', 'environmental_alerts',
          'sustainability', 'climate_data', 'seasonal_patterns'
        ],
        capabilities: [
          {
            type: 'realtime_data' as const,
            description: 'Weather, air quality, environmental conditions',
            confidence: 0.95,
            dataSource: 'weather_apis',
            updateFrequency: 'minute' as const
          },
          {
            type: 'predictive' as const,
            description: 'Weather and environmental predictions',
            confidence: 0.90,
            dataSource: 'meteorological_data',
            updateFrequency: 'hourly' as const
          }
        ],
        status: 'active' as const,
        confidence: 0.95,
        lastUpdated: new Date(),
        responsePatterns: [
          {
            trigger: ['weather', 'temperature', 'rain', 'wind', 'air quality', 'climate'],
            action: 'direct_response' as const,
            dataSources: ['weather_data', 'environmental_data'],
            priority: 'high' as const
          }
        ],
        collaborationRules: []
      }
    ]

    // Load agents into memory
    agentConfigs.forEach(config => {
      this.agents.set(config.id, config as AIAgent)
    })

    }

  private setupOrchestrationRules() {
    this.orchestrationRules = [
      {
        scenario: 'complex_multi_domain_query',
        priority: 1,
        agentAllocation: [
          { agentId: 'government_agent', role: 'primary', weight: 0.3 },
          { agentId: 'transport_agent', role: 'supporting', weight: 0.2 },
          { agentId: 'business_agent', role: 'supporting', weight: 0.2 },
          { agentId: 'culture_agent', role: 'validator', weight: 0.15 },
          { agentId: 'lifestyle_agent', role: 'supporting', weight: 0.15 }
        ],
        responseStrategy: 'hierarchical',
        timeoutMs: 5000
      },
      {
        scenario: 'urgent_safety_query',
        priority: 1,
        agentAllocation: [
          { agentId: 'environment_agent', role: 'primary', weight: 0.4 },
          { agentId: 'transport_agent', role: 'supporting', weight: 0.3 },
          { agentId: 'government_agent', role: 'supporting', weight: 0.3 }
        ],
        responseStrategy: 'expert',
        timeoutMs: 2000
      },
      {
        scenario: 'business_inquiry',
        priority: 2,
        agentAllocation: [
          { agentId: 'business_agent', role: 'primary', weight: 0.6 },
          { agentId: 'government_agent', role: 'supporting', weight: 0.4 }
        ],
        responseStrategy: 'unanimous',
        timeoutMs: 3000
      },
      {
        scenario: 'tourism_lifestyle_query',
        priority: 3,
        agentAllocation: [
          { agentId: 'lifestyle_agent', role: 'primary', weight: 0.5 },
          { agentId: 'culture_agent', role: 'supporting', weight: 0.3 },
          { agentId: 'transport_agent', role: 'supporting', weight: 0.2 }
        ],
        responseStrategy: 'majority',
        timeoutMs: 4000
      }
    ]
  }

  /**
   * Main orchestration method - processes intelligent queries and coordinates agents
   */
  async processIntelligentQuery(query: IntelligentQuery, userId?: string): Promise<AgentResponse> {
    try {
      // Analyze query and determine agent allocation
      const allocation = this.determineAgentAllocation(query)
      
      // Gather responses from allocated agents
      const agentResponses = await this.gatherAgentResponses(query, allocation)
      
      // Synthesize final response
      const finalResponse = await this.synthesizeResponse(agentResponses, allocation)
      
      // Learn from interaction
      if (userId) {
        await this.recordInteraction(userId, query, finalResponse)
      }
      
      return finalResponse
      
    } catch (error) {
      console.error('AI Mayor orchestration error:', error)
      return this.getFallbackResponse(query)
    }
  }

  /**
   * Process a simple text query from chat interface
   */
  async processSimpleQuery(message: string, userId?: string): Promise<string> {
    // Convert simple message to IntelligentQuery
    const query: IntelligentQuery = {
      originalQuery: message,
      processedQuery: {
        cleanedQuery: message.toLowerCase().trim(),
        entities: [],
        intents: [],
        sentiment: { polarity: 'neutral', confidence: 0.7, urgency: 0.3 },
        language: 'en'
      },
      intentAnalysis: {
        primaryIntent: this.detectPrimaryIntent(message),
        secondaryIntents: [],
        domainMapping: [],
        collaborationNeeded: false,
        estimatedComplexity: 0.5
      },
      contextualFactors: [],
      urgency: this.detectUrgency(message),
      complexity: this.detectComplexity(message)
    }

    const response = await this.processIntelligentQuery(query, userId)
    return response.content
  }

  private detectPrimaryIntent(message: string): string {
    const messageLower = message.toLowerCase()
    
    if (messageLower.includes('weather') || messageLower.includes('temperature')) {
      return 'weather_inquiry'
    }
    if (messageLower.includes('transport') || messageLower.includes('metro') || messageLower.includes('bus')) {
      return 'transport_inquiry'
    }
    if (messageLower.includes('business') || messageLower.includes('company') || messageLower.includes('license')) {
      return 'business_inquiry'
    }
    if (messageLower.includes('culture') || messageLower.includes('tradition') || messageLower.includes('custom')) {
      return 'culture_inquiry'
    }
    if (messageLower.includes('restaurant') || messageLower.includes('food') || messageLower.includes('entertainment')) {
      return 'lifestyle_inquiry'
    }
    if (messageLower.includes('visa') || messageLower.includes('permit') || messageLower.includes('government')) {
      return 'government_inquiry'
    }
    
    return 'general_inquiry'
  }

  private detectUrgency(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const messageLower = message.toLowerCase()
    
    if (messageLower.includes('urgent') || messageLower.includes('emergency') || messageLower.includes('asap')) {
      return 'critical'
    }
    if (messageLower.includes('today') || messageLower.includes('now') || messageLower.includes('immediately')) {
      return 'high'
    }
    if (messageLower.includes('soon') || messageLower.includes('this week')) {
      return 'medium'
    }
    
    return 'low'
  }

  private detectComplexity(message: string): 'simple' | 'moderate' | 'complex' | 'multi_domain' {
    const domains = ['weather', 'transport', 'business', 'culture', 'lifestyle', 'government']
    const domainMatches = domains.filter(domain => message.toLowerCase().includes(domain))
    
    if (domainMatches.length > 2) {
      return 'multi_domain'
    }
    if (domainMatches.length > 1 || message.split(' ').length > 15) {
      return 'complex'
    }
    if (message.split(' ').length > 8) {
      return 'moderate'
    }
    
    return 'simple'
  }

  private determineAgentAllocation(query: IntelligentQuery): AgentAllocation[] {
    // Analyze query intent and complexity to determine which agents to involve
    const intentMapping = this.mapIntentsToAgents(query.intentAnalysis)
    
    // Find matching orchestration rule
    const rule = this.findMatchingRule(query, intentMapping)
    
    if (rule) {
      return rule.agentAllocation
    }
    
    // Default allocation based on intent analysis
    return this.createDefaultAllocation(intentMapping)
  }

  private mapIntentsToAgents(intentAnalysis: any): Map<string, number> {
    const mapping = new Map<string, number>()
    
    // Simple intent-to-agent mapping (would be more sophisticated in production)
    if (intentAnalysis.primaryIntent.includes('government')) {
      mapping.set('government_agent', 0.8)
    }
    if (intentAnalysis.primaryIntent.includes('transport')) {
      mapping.set('transport_agent', 0.8)
    }
    if (intentAnalysis.primaryIntent.includes('business')) {
      mapping.set('business_agent', 0.8)
    }
    if (intentAnalysis.primaryIntent.includes('culture')) {
      mapping.set('culture_agent', 0.8)
    }
    if (intentAnalysis.primaryIntent.includes('lifestyle')) {
      mapping.set('lifestyle_agent', 0.8)
    }
    if (intentAnalysis.primaryIntent.includes('weather')) {
      mapping.set('environment_agent', 0.9)
    }
    
    return mapping
  }

  private findMatchingRule(query: IntelligentQuery, intentMapping: Map<string, number>): OrchestrationRule | null {
    // Logic to find the best matching orchestration rule
    for (const rule of this.orchestrationRules) {
      if (this.ruleMatches(rule, query, intentMapping)) {
        return rule
      }
    }
    return null
  }

  private ruleMatches(rule: OrchestrationRule, query: IntelligentQuery, intentMapping: Map<string, number>): boolean {
    // Simplified rule matching logic
    switch (rule.scenario) {
      case 'complex_multi_domain_query':
        return query.complexity === 'complex' || query.complexity === 'multi_domain'
      case 'urgent_safety_query':
        return query.urgency === 'critical' || query.urgency === 'high'
      case 'business_inquiry':
        return intentMapping.has('business_agent')
      case 'tourism_lifestyle_query':
        return intentMapping.has('lifestyle_agent') || intentMapping.has('culture_agent')
      default:
        return false
    }
  }

  private createDefaultAllocation(intentMapping: Map<string, number>): AgentAllocation[] {
    const allocation: AgentAllocation[] = []
    
    intentMapping.forEach((weight, agentId) => {
      allocation.push({
        agentId,
        role: weight > 0.7 ? 'primary' : 'supporting',
        weight
      })
    })
    
    return allocation
  }

  private async gatherAgentResponses(
    query: IntelligentQuery, 
    allocation: AgentAllocation[]
  ): Promise<Map<string, AgentResponse>> {
    const responses = new Map<string, AgentResponse>()
    
    // Execute agent queries in parallel
    const promises = allocation.map(async (alloc) => {
      const agent = this.agents.get(alloc.agentId)
      if (agent) {
        try {
          const response = await this.queryAgent(agent, query, alloc.role)
          responses.set(alloc.agentId, response)
        } catch (error) {
          console.error(`Error querying agent ${alloc.agentId}:`, error)
        }
      }
    })
    
    await Promise.all(promises)
    return responses
  }

  private async queryAgent(
    agent: AIAgent, 
    query: IntelligentQuery, 
    role: string
  ): Promise<AgentResponse> {
    // Check relevance first
    const isRelevant = agent.specialties.some(specialty => 
      query.originalQuery.toLowerCase().includes(specialty.toLowerCase())
    )
    
    if (!isRelevant && role !== 'primary') {
      return {
        content: '',
        confidence: 0,
        dataSources: [],
        emotionalTone: 'informative'
      }
    }
    
    // Route to specialized agent services based on agent ID
    try {
      switch (agent.id) {
        case 'government_agent':
          return await specializedAgentServices.government.processQuery(agent, query)
        
        case 'transport_agent':
          return await specializedAgentServices.transport.processQuery(agent, query)
        
        case 'lifestyle_agent':
          return await specializedAgentServices.lifestyle.processQuery(agent, query)
        
        case 'environment_agent':
          return await specializedAgentServices.environment.processQuery(agent, query)
        
        case 'business_agent':
        case 'culture_agent':
        default:
          // Fallback for agents without specialized services yet
          return {
            content: `${agent.personality.greeting} Based on your query about "${query.originalQuery}", I can provide specialized assistance in ${agent.specialties.join(', ')}.`,
            contentAr: agent.personality.greetingAr,
            confidence: agent.confidence,
            dataSources: [`${agent.id}_knowledge_base`],
            collaboratingAgents: [],
            predictiveInsights: [],
            actionableItems: [],
            followUpQuestions: [`Would you like more specific information about ${agent.specialties[0]}?`],
            emotionalTone: 'informative'
          }
      }
    } catch (error) {
      console.error(`Error in specialized agent ${agent.id}:`, error)
      
      // Fallback response on error
      return {
        content: `I apologize, but I encountered an issue processing your ${agent.specialties[0]} query. However, I'm here to help with Dubai information. Could you please rephrase your question?`,
        confidence: 0.6,
        dataSources: ['fallback_system'],
        emotionalTone: 'empathetic'
      }
    }
  }

  private async synthesizeResponse(
    agentResponses: Map<string, AgentResponse>,
    allocation: AgentAllocation[]
  ): Promise<AgentResponse> {
    // Find primary agent response
    const primaryAllocation = allocation.find(alloc => alloc.role === 'primary')
    const primaryResponse = primaryAllocation ? 
      agentResponses.get(primaryAllocation.agentId) : null
    
    if (!primaryResponse) {
      throw new Error('No primary agent response available')
    }
    
    // Collect supporting information
    const supportingInfo: string[] = []
    const allDataSources: string[] = []
    const allCollaboratingAgents: string[] = []
    
    agentResponses.forEach((response) => {
      if (response.content && response.content !== primaryResponse.content) {
        supportingInfo.push(response.content)
      }
      allDataSources.push(...response.dataSources)
      if (response.collaboratingAgents) {
        allCollaboratingAgents.push(...response.collaboratingAgents)
      }
    })
    
    // Synthesize comprehensive response
    let synthesizedContent = primaryResponse.content
    
    if (supportingInfo.length > 0) {
      synthesizedContent += '\n\nAdditional information:\n' + supportingInfo.join('\n')
    }
    
    return {
      content: synthesizedContent,
      contentAr: primaryResponse.contentAr,
      confidence: this.calculateConfidence(agentResponses, allocation),
      dataSources: [...new Set(allDataSources)],
      collaboratingAgents: [...new Set(allCollaboratingAgents)],
      predictiveInsights: [],
      actionableItems: [],
      followUpQuestions: primaryResponse.followUpQuestions,
      emotionalTone: primaryResponse.emotionalTone
    }
  }

  private calculateConfidence(
    responses: Map<string, AgentResponse>,
    allocation: AgentAllocation[]
  ): number {
    let weightedConfidence = 0
    let totalWeight = 0
    
    allocation.forEach(alloc => {
      const response = responses.get(alloc.agentId)
      if (response) {
        weightedConfidence += response.confidence * alloc.weight
        totalWeight += alloc.weight
      }
    })
    
    return totalWeight > 0 ? weightedConfidence / totalWeight : 0
  }

  private async recordInteraction(
    userId: string,
    query: IntelligentQuery,
    response: AgentResponse
  ): Promise<void> {
    // Record interaction for learning and improvement
    try {
      await supabase
        .from('ai_agent_interactions')
        .insert({
          user_id: userId,
          query: query.originalQuery,
          processed_query: query.processedQuery,
          intent_analysis: query.intentAnalysis,
          response_content: response.content,
          confidence: response.confidence,
          data_sources: response.dataSources,
          collaborating_agents: response.collaboratingAgents,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to record interaction:', error)
    }
  }

  private getFallbackResponse(query: IntelligentQuery): AgentResponse {
    return {
      content: `I apologize, but I encountered an issue processing your query: "${query.originalQuery}". However, I'm here to help with all aspects of Dubai - from government services to lifestyle recommendations. Could you please rephrase your question?`,
      confidence: 0.5,
      dataSources: ['fallback_system'],
      emotionalTone: 'empathetic'
    }
  }

  /**
   * Get the status of all agents
   */
  getAgentStatus(): Map<string, AIAgent> {
    return new Map(this.agents)
  }

  /**
   * Get AI Mayor system status
   */
  getSystemStatus() {
    return {
      aiMayor: this.aiMayor,
      agentCount: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(agent => agent.status === 'active').length,
      orchestrationRules: this.orchestrationRules.length,
      lastUpdate: new Date()
    }
  }
}