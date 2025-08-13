/**
 * AI Usage Tracking Service for MyDub.ai
 * Tracks AI API usage, costs, and implements budget controls
 */

import { supabase } from '@/shared/lib/supabase'

// AI Service providers and their pricing models
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  inputTokenCost: number  // Cost per 1K input tokens in USD
  outputTokenCost: number // Cost per 1K output tokens in USD
  requestCost?: number    // Fixed cost per request if applicable
  maxTokens?: number      // Model's maximum token limit
}

// AI service configurations with current pricing (January 2025)
const AI_SERVICE_CONFIGS: Record<string, AIServiceConfig> = {
  // OpenAI Models
  'openai-gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    inputTokenCost: 0.005,   // $5 per 1M input tokens
    outputTokenCost: 0.015,  // $15 per 1M output tokens
    maxTokens: 128000
  },
  'openai-gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    inputTokenCost: 0.00015, // $0.15 per 1M input tokens
    outputTokenCost: 0.0006, // $0.6 per 1M output tokens
    maxTokens: 128000
  },
  'openai-gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    inputTokenCost: 0.0005,  // $0.5 per 1M input tokens
    outputTokenCost: 0.0015, // $1.5 per 1M output tokens
    maxTokens: 16385
  },

  // Anthropic Models
  'anthropic-claude-3.5-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    inputTokenCost: 0.003,   // $3 per 1M input tokens
    outputTokenCost: 0.015,  // $15 per 1M output tokens
    maxTokens: 200000
  },
  'anthropic-claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    inputTokenCost: 0.00025, // $0.25 per 1M input tokens
    outputTokenCost: 0.00125, // $1.25 per 1M output tokens
    maxTokens: 200000
  },

  // Google Models
  'google-gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
    inputTokenCost: 0.0005,  // $0.5 per 1M input tokens
    outputTokenCost: 0.0015, // $1.5 per 1M output tokens
    maxTokens: 32768
  }
}

export interface AIUsageRecord {
  id?: string
  user_id: string
  session_id?: string
  service_type: 'chat' | 'content_generation' | 'translation' | 'summarization' | 'search' | 'other'
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost: number
  actual_cost?: number
  request_timestamp: string
  response_timestamp?: string
  request_duration_ms?: number
  metadata?: {
    endpoint?: string
    feature?: string
    user_prompt?: string
    system_prompt?: string
    temperature?: number
    max_tokens?: number
    error?: string
    response_quality?: 'good' | 'poor' | 'excellent'
  }
}

export interface UsageBudget {
  id?: string
  user_id?: string
  organization_id?: string
  budget_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  budget_limit: number // In USD
  current_usage: number // In USD
  reset_date: string
  is_active: boolean
  alert_thresholds: number[] // Percentages like [50, 75, 90]
  created_at?: string
  updated_at?: string
}

export interface UsageAlert {
  id?: string
  user_id: string
  budget_id: string
  alert_type: 'threshold' | 'limit_exceeded' | 'daily_summary'
  threshold_percentage?: number
  current_usage: number
  budget_limit: number
  message: string
  is_read: boolean
  created_at?: string
}

export class AIUsageTrackingService {
  private static instance: AIUsageTrackingService
  private currentSession: string = this.generateSessionId()

  public static getInstance(): AIUsageTrackingService {
    if (!AIUsageTrackingService.instance) {
      AIUsageTrackingService.instance = new AIUsageTrackingService()
    }
    return AIUsageTrackingService.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Calculate the cost of an AI request
   */
  calculateCost(
    serviceKey: string, 
    inputTokens: number, 
    outputTokens: number
  ): number {
    const config = AI_SERVICE_CONFIGS[serviceKey]
    if (!config) {
      console.warn(`Unknown AI service: ${serviceKey}`)
      return 0
    }

    const inputCost = (inputTokens / 1000) * config.inputTokenCost
    const outputCost = (outputTokens / 1000) * config.outputTokenCost
    const requestCost = config.requestCost || 0

    return inputCost + outputCost + requestCost
  }

  /**
   * Track AI usage
   */
  async trackUsage(usage: Omit<AIUsageRecord, 'id' | 'estimated_cost' | 'total_tokens'>): Promise<string | null> {
    try {
      const serviceKey = `${usage.provider}-${usage.model}`
      const estimatedCost = this.calculateCost(serviceKey, usage.input_tokens, usage.output_tokens)
      const totalTokens = usage.input_tokens + usage.output_tokens

      const usageRecord: AIUsageRecord = {
        ...usage,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost,
        session_id: this.currentSession
      }

      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .insert(usageRecord)
        .select('id')
        .single()

      if (error) {
        console.error('Failed to track AI usage:', error)
        return null
      }

      // Check budget limits after tracking usage
      await this.checkBudgetLimits(usage.user_id)

      return data.id
    } catch (error) {
      console.error('Error tracking AI usage:', error)
      return null
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsage(
    userId: string, 
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    totalCost: number
    totalTokens: number
    totalRequests: number
    byService: Record<string, { cost: number; tokens: number; requests: number }>
    byDay: Array<{ date: string; cost: number; tokens: number; requests: number }>
  }> {
    try {
      const periodStart = this.getPeriodStart(period)
      
      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('request_timestamp', periodStart.toISOString())
        .order('request_timestamp', { ascending: true })

      if (error) throw error

      const stats = {
        totalCost: 0,
        totalTokens: 0,
        totalRequests: data.length,
        byService: {} as Record<string, { cost: number; tokens: number; requests: number }>,
        byDay: [] as Array<{ date: string; cost: number; tokens: number; requests: number }>
      }

      const dailyStats: Record<string, { cost: number; tokens: number; requests: number }> = {}

      data.forEach(record => {
        // Total stats
        stats.totalCost += record.estimated_cost
        stats.totalTokens += record.total_tokens

        // By service stats
        const serviceKey = `${record.provider}-${record.model}`
        if (!stats.byService[serviceKey]) {
          stats.byService[serviceKey] = { cost: 0, tokens: 0, requests: 0 }
        }
        stats.byService[serviceKey].cost += record.estimated_cost
        stats.byService[serviceKey].tokens += record.total_tokens
        stats.byService[serviceKey].requests += 1

        // Daily stats
        const date = new Date(record.request_timestamp).toISOString().split('T')[0]
        if (!dailyStats[date]) {
          dailyStats[date] = { cost: 0, tokens: 0, requests: 0 }
        }
        dailyStats[date].cost += record.estimated_cost
        dailyStats[date].tokens += record.total_tokens
        dailyStats[date].requests += 1
      })

      // Convert daily stats to array
      stats.byDay = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      }))

      return stats
    } catch (error) {
      console.error('Error getting user usage:', error)
      return {
        totalCost: 0,
        totalTokens: 0,
        totalRequests: 0,
        byService: {},
        byDay: []
      }
    }
  }

  /**
   * Set or update budget for a user
   */
  async setBudget(budget: Omit<UsageBudget, 'id' | 'current_usage' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage_budgets')
        .upsert({
          ...budget,
          current_usage: 0,
          updated_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Error setting budget:', error)
      return false
    }
  }

  /**
   * Check if user is within budget limits
   */
  async checkBudgetLimits(userId: string): Promise<void> {
    try {
      const { data: budgets, error } = await supabase
        .from('usage_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error || !budgets) return

      for (const budget of budgets) {
        const periodStart = this.getPeriodStart(budget.budget_type as any)
        const currentUsage = await this.getCurrentPeriodUsage(userId, periodStart)

        // Update current usage
        await supabase
          .from('usage_budgets')
          .update({ 
            current_usage: currentUsage,
            updated_at: new Date().toISOString()
          })
          .eq('id', budget.id)

        // Check thresholds
        const usagePercentage = (currentUsage / budget.budget_limit) * 100

        for (const threshold of budget.alert_thresholds) {
          if (usagePercentage >= threshold) {
            await this.createUsageAlert(userId, budget.id!, 'threshold', {
              threshold_percentage: threshold,
              current_usage: currentUsage,
              budget_limit: budget.budget_limit,
              message: `You have used ${usagePercentage.toFixed(1)}% of your ${budget.budget_type} AI budget ($${currentUsage.toFixed(2)} of $${budget.budget_limit.toFixed(2)})`
            })
          }
        }

        // Check if budget exceeded
        if (currentUsage >= budget.budget_limit) {
          await this.createUsageAlert(userId, budget.id!, 'limit_exceeded', {
            current_usage: currentUsage,
            budget_limit: budget.budget_limit,
            message: `You have exceeded your ${budget.budget_type} AI budget limit of $${budget.budget_limit.toFixed(2)}`
          })
        }
      }
    } catch (error) {
      console.error('Error checking budget limits:', error)
    }
  }

  /**
   * Check if user can make an AI request (within budget)
   */
  async canMakeRequest(userId: string, estimatedCost: number): Promise<{
    allowed: boolean
    reason?: string
    currentUsage?: number
    budgetLimit?: number
  }> {
    try {
      const { data: budgets, error } = await supabase
        .from('usage_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error || !budgets || budgets.length === 0) {
        return { allowed: true } // No budget restrictions
      }

      for (const budget of budgets) {
        const periodStart = this.getPeriodStart(budget.budget_type as any)
        const currentUsage = await this.getCurrentPeriodUsage(userId, periodStart)

        if (currentUsage + estimatedCost > budget.budget_limit) {
          return {
            allowed: false,
            reason: `This request would exceed your ${budget.budget_type} budget limit`,
            currentUsage,
            budgetLimit: budget.budget_limit
          }
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking request permission:', error)
      return { allowed: true } // Allow on error to avoid blocking service
    }
  }

  private async getCurrentPeriodUsage(userId: string, periodStart: Date): Promise<number> {
    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('estimated_cost')
      .eq('user_id', userId)
      .gte('request_timestamp', periodStart.toISOString())

    if (error) return 0

    return data.reduce((total, record) => total + record.estimated_cost, 0)
  }

  private async createUsageAlert(
    userId: string, 
    budgetId: string, 
    alertType: UsageAlert['alert_type'],
    alertData: Partial<UsageAlert>
  ): Promise<void> {
    try {
      // Check if similar alert already exists recently
      const recentAlert = await supabase
        .from('usage_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('budget_id', budgetId)
        .eq('alert_type', alertType)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .single()

      if (recentAlert.data) return // Don't create duplicate alerts

      await supabase
        .from('usage_alerts')
        .insert({
          user_id: userId,
          budget_id: budgetId,
          alert_type: alertType,
          is_read: false,
          created_at: new Date().toISOString(),
          ...alertData
        })
    } catch (error) {
      console.error('Error creating usage alert:', error)
    }
  }

  private getPeriodStart(period: 'day' | 'week' | 'month' | 'year'): Date {
    const now = new Date()
    const start = new Date(now)

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start.setDate(now.getDate() - now.getDay())
        start.setHours(0, 0, 0, 0)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'year':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
    }

    return start
  }

  /**
   * Get service configuration
   */
  getServiceConfig(provider: string, model: string): AIServiceConfig | null {
    const serviceKey = `${provider}-${model}`
    return AI_SERVICE_CONFIGS[serviceKey] || null
  }

  /**
   * Estimate cost before making request
   */
  estimateRequestCost(
    provider: string, 
    model: string, 
    inputTokens: number, 
    expectedOutputTokens: number = 1000
  ): number {
    const serviceKey = `${provider}-${model}`
    return this.calculateCost(serviceKey, inputTokens, expectedOutputTokens)
  }
}

export default AIUsageTrackingService