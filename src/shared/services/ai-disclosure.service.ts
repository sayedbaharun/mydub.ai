import { supabase } from '@/shared/lib/supabase'

export interface AIDecision {
  id: string
  userId: string
  sessionId?: string
  feature: string // 'chatbot' | 'recommendations' | 'search' | 'content_generation'
  model: string // 'gpt-4' | 'claude-3' | 'gemini-pro'
  input: string
  output: string
  reasoning?: string
  confidence?: number
  tokens_used?: number
  processing_time_ms?: number
  metadata?: Record<string, any>
  timestamp: Date
}

export interface AIPreferences {
  userId: string
  ai_enabled: boolean
  features: {
    chatbot: boolean
    recommendations: boolean
    search_enhancement: boolean
    content_generation: boolean
    sentiment_analysis: boolean
  }
  data_usage: {
    allow_training: boolean
    allow_improvement: boolean
    allow_analytics: boolean
  }
  transparency_level: 'minimal' | 'standard' | 'detailed'
  updated_at: Date
}

export interface AIUsageStats {
  userId: string
  period: 'day' | 'week' | 'month' | 'all'
  total_interactions: number
  by_feature: Record<string, number>
  by_model: Record<string, number>
  tokens_consumed: number
  decisions_made: number
  opt_out_count: number
}

class AIDisclosureService {
  private readonly AI_MODELS = {
    'gpt-4': 'OpenAI GPT-4',
    'gpt-4-turbo': 'OpenAI GPT-4 Turbo',
    'claude-3-opus': 'Anthropic Claude 3 Opus',
    'claude-3-sonnet': 'Anthropic Claude 3 Sonnet',
    'gemini-pro': 'Google Gemini Pro',
    'gemini-pro-vision': 'Google Gemini Pro Vision'
  }

  private readonly AI_FEATURES = {
    chatbot: 'AI Chatbot Assistant',
    recommendations: 'Personalized Recommendations',
    search_enhancement: 'AI-Enhanced Search',
    content_generation: 'Content Generation',
    sentiment_analysis: 'Sentiment Analysis',
    moderation: 'Content Moderation',
    translation: 'AI Translation'
  }

  // Log an AI decision with full transparency
  async logAIDecision(
    userId: string,
    feature: string,
    model: string,
    input: string,
    output: string,
    options?: {
      sessionId?: string
      reasoning?: string
      confidence?: number
      tokens_used?: number
      processing_time_ms?: number
      metadata?: Record<string, any>
    }
  ): Promise<AIDecision> {
    const decision: AIDecision = {
      id: crypto.randomUUID(),
      userId,
      sessionId: options?.sessionId,
      feature,
      model,
      input,
      output,
      reasoning: options?.reasoning,
      confidence: options?.confidence,
      tokens_used: options?.tokens_used,
      processing_time_ms: options?.processing_time_ms,
      metadata: options?.metadata,
      timestamp: new Date()
    }

    // Check if user has opted out of this feature
    const preferences = await this.getUserPreferences(userId)
    if (preferences && !this.isFeatureEnabled(preferences, feature)) {
      throw new Error(`User has opted out of AI ${feature}`)
    }

    // Log the decision
    const { error } = await supabase.from('ai_decision_logs').insert({
      id: decision.id,
      user_id: userId,
      session_id: decision.sessionId,
      feature,
      model,
      input: this.sanitizeForLogging(input),
      output: this.sanitizeForLogging(output),
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      tokens_used: decision.tokens_used,
      processing_time_ms: decision.processing_time_ms,
      metadata: decision.metadata,
      created_at: decision.timestamp
    })

    if (error) {
      console.error('Failed to log AI decision:', error)
    }

    // Update usage statistics
    await this.updateUsageStats(userId, feature, model, decision.tokens_used || 0)

    return decision
  }

  // Get user's AI preferences
  async getUserPreferences(userId: string): Promise<AIPreferences | null> {
    const { data, error } = await supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Return default preferences if none exist
      return this.getDefaultPreferences(userId)
    }

    return {
      userId: data.user_id,
      ai_enabled: data.ai_enabled,
      features: data.features,
      data_usage: data.data_usage,
      transparency_level: data.transparency_level,
      updated_at: new Date(data.updated_at)
    }
  }

  // Update user's AI preferences
  async updateUserPreferences(
    userId: string,
    preferences: Partial<AIPreferences>
  ): Promise<AIPreferences> {
    const currentPrefs = await this.getUserPreferences(userId)
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
      userId,
      updated_at: new Date()
    }

    const { error } = await supabase.from('ai_preferences').upsert({
      user_id: userId,
      ai_enabled: updatedPrefs.ai_enabled,
      features: updatedPrefs.features,
      data_usage: updatedPrefs.data_usage,
      transparency_level: updatedPrefs.transparency_level,
      updated_at: updatedPrefs.updated_at
    })

    if (error) {
      throw new Error(`Failed to update AI preferences: ${error.message}`)
    }

    // Log preference change
    await this.logPreferenceChange(userId, currentPrefs, updatedPrefs)

    return updatedPrefs
  }

  // Enable/disable AI globally for a user
  async setAIEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.updateUserPreferences(userId, { ai_enabled: enabled })
    
    if (!enabled) {
      // Log opt-out event
      await supabase.from('ai_opt_out_logs').insert({
        user_id: userId,
        opted_out: true,
        reason: 'User disabled AI features',
        created_at: new Date()
      })
    }
  }

  // Enable/disable specific AI feature
  async setFeatureEnabled(
    userId: string,
    feature: keyof AIPreferences['features'],
    enabled: boolean
  ): Promise<void> {
    const prefs = await this.getUserPreferences(userId)
    if (!prefs) return

    const updatedFeatures = {
      ...prefs.features,
      [feature]: enabled
    }

    await this.updateUserPreferences(userId, {
      features: updatedFeatures
    })
  }

  // Get user's AI usage statistics
  async getUserStats(
    userId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'month'
  ): Promise<AIUsageStats> {
    const startDate = this.getStartDateForPeriod(period)
    
    const { data, error } = await supabase
      .from('ai_decision_logs')
      .select('feature, model, tokens_used')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      throw new Error(`Failed to fetch AI usage stats: ${error.message}`)
    }

    // Aggregate statistics
    const stats: AIUsageStats = {
      userId,
      period,
      total_interactions: data?.length || 0,
      by_feature: {},
      by_model: {},
      tokens_consumed: 0,
      decisions_made: data?.length || 0,
      opt_out_count: 0
    }

    if (data) {
      data.forEach(log => {
        // By feature
        stats.by_feature[log.feature] = (stats.by_feature[log.feature] || 0) + 1
        
        // By model
        stats.by_model[log.model] = (stats.by_model[log.model] || 0) + 1
        
        // Tokens
        stats.tokens_consumed += log.tokens_used || 0
      })
    }

    // Get opt-out count
    const { count } = await supabase
      .from('ai_opt_out_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    stats.opt_out_count = count || 0

    return stats
  }

  // Get AI decision history for a user
  async getUserDecisionHistory(
    userId: string,
    options?: {
      feature?: string
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
    }
  ): Promise<AIDecision[]> {
    let query = supabase
      .from('ai_decision_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.feature) {
      query = query.eq('feature', options.feature)
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch decision history: ${error.message}`)
    }

    return data?.map(log => ({
      id: log.id,
      userId: log.user_id,
      sessionId: log.session_id,
      feature: log.feature,
      model: log.model,
      input: log.input,
      output: log.output,
      reasoning: log.reasoning,
      confidence: log.confidence,
      tokens_used: log.tokens_used,
      processing_time_ms: log.processing_time_ms,
      metadata: log.metadata,
      timestamp: new Date(log.created_at)
    })) || []
  }

  // Export user's AI data (for GDPR compliance)
  async exportUserAIData(userId: string): Promise<{
    preferences: AIPreferences | null
    decisions: AIDecision[]
    statistics: AIUsageStats
  }> {
    const [preferences, decisions, statistics] = await Promise.all([
      this.getUserPreferences(userId),
      this.getUserDecisionHistory(userId),
      this.getUserStats(userId, 'all')
    ])

    return {
      preferences,
      decisions,
      statistics
    }
  }

  // Delete user's AI data (for GDPR compliance)
  async deleteUserAIData(userId: string): Promise<void> {
    // Delete all AI decision logs
    await supabase
      .from('ai_decision_logs')
      .delete()
      .eq('user_id', userId)

    // Delete AI preferences
    await supabase
      .from('ai_preferences')
      .delete()
      .eq('user_id', userId)

    // Delete opt-out logs
    await supabase
      .from('ai_opt_out_logs')
      .delete()
      .eq('user_id', userId)

    // Log the deletion
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_data_deletion',
      details: { reason: 'User requested AI data deletion' },
      created_at: new Date()
    })
  }

  // Get AI model information for transparency
  getModelInfo(modelKey: string): {
    name: string
    provider: string
    capabilities: string[]
    limitations: string[]
  } {
    const modelInfo = {
      'gpt-4': {
        name: 'GPT-4',
        provider: 'OpenAI',
        capabilities: [
          'Natural language understanding',
          'Code generation',
          'Creative writing',
          'Multilingual support'
        ],
        limitations: [
          'Knowledge cutoff date',
          'Cannot access real-time information',
          'May occasionally generate incorrect information'
        ]
      },
      'claude-3-opus': {
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        capabilities: [
          'Complex reasoning',
          'Long context understanding',
          'Nuanced responses',
          'Safety-focused design'
        ],
        limitations: [
          'Knowledge cutoff date',
          'Cannot browse the internet',
          'May refuse certain requests for safety'
        ]
      },
      'gemini-pro': {
        name: 'Gemini Pro',
        provider: 'Google',
        capabilities: [
          'Multimodal understanding',
          'Efficient processing',
          'Strong multilingual support',
          'Integration with Google services'
        ],
        limitations: [
          'Knowledge cutoff date',
          'Region-specific availability',
          'Usage quotas may apply'
        ]
      }
    }

    return modelInfo[modelKey as keyof typeof modelInfo] || {
      name: modelKey,
      provider: 'Unknown',
      capabilities: [],
      limitations: []
    }
  }

  // Private helper methods
  private getDefaultPreferences(userId: string): AIPreferences {
    return {
      userId,
      ai_enabled: true,
      features: {
        chatbot: true,
        recommendations: true,
        search_enhancement: true,
        content_generation: true,
        sentiment_analysis: true
      },
      data_usage: {
        allow_training: false,
        allow_improvement: true,
        allow_analytics: true
      },
      transparency_level: 'standard',
      updated_at: new Date()
    }
  }

  private isFeatureEnabled(
    preferences: AIPreferences,
    feature: string
  ): boolean {
    if (!preferences.ai_enabled) return false
    
    const featureKey = feature as keyof AIPreferences['features']
    return preferences.features[featureKey] !== false
  }

  private sanitizeForLogging(text: string): string {
    // Remove sensitive information before logging
    // This is a basic implementation - enhance based on your needs
    return text
      .replace(/\b\d{4,}\b/g, '[REDACTED_NUMBER]') // Redact long numbers
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]') // Redact emails
      .substring(0, 1000) // Limit length
  }

  private async updateUsageStats(
    userId: string,
    feature: string,
    model: string,
    tokens: number
  ): Promise<void> {
    // Update daily usage stats
    const today = new Date().toISOString().split('T')[0]
    
    await supabase.from('ai_usage_stats').upsert({
      user_id: userId,
      date: today,
      feature,
      model,
      interaction_count: 1,
      tokens_used: tokens
    }, {
      onConflict: 'user_id,date,feature,model',
      count: 'exact'
    })
  }

  private async logPreferenceChange(
    userId: string,
    oldPrefs: AIPreferences | null,
    newPrefs: AIPreferences
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_preference_change',
      details: {
        old_preferences: oldPrefs,
        new_preferences: newPrefs,
        changed_at: new Date()
      },
      created_at: new Date()
    })
  }

  private getStartDateForPeriod(period: string): Date {
    const now = new Date()
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1))
      case 'week':
        return new Date(now.setDate(now.getDate() - 7))
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1))
      case 'all':
      default:
        return new Date(0) // Beginning of time
    }
  }
}

export const aiDisclosureService = new AIDisclosureService()