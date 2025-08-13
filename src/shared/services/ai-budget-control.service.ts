/**
 * AI Budget Control Service for MyDub.ai
 * Implements budget enforcement, rate limiting, and cost optimization
 */

import { supabase } from '@/shared/lib/supabase'
import AIUsageTrackingService, { UsageBudget, UsageAlert } from './ai-usage-tracking.service'

export interface BudgetRule {
  id?: string
  user_id?: string
  organization_id?: string
  rule_type: 'daily_limit' | 'monthly_limit' | 'per_request_limit' | 'service_limit' | 'rate_limit'
  rule_value: number // Dollar amount or request count
  applies_to: 'all' | 'specific_service' | 'specific_user'
  service_filter?: string // e.g., 'openai-gpt-4o'
  user_filter?: string
  is_active: boolean
  enforcement_action: 'block' | 'warn' | 'throttle' | 'downgrade'
  alternative_service?: string // For downgrade action
  created_at?: string
  updated_at?: string
}

export interface CostOptimizationSuggestion {
  type: 'model_downgrade' | 'reduce_tokens' | 'batch_requests' | 'cache_results'
  current_cost: number
  optimized_cost: number
  savings: number
  description: string
  implementation_difficulty: 'easy' | 'medium' | 'hard'
  impact: 'low' | 'medium' | 'high'
}

export interface RequestQuota {
  user_id: string
  service_type: string
  requests_remaining: number
  reset_time: Date
  blocked_until?: Date
}

export class AIBudgetControlService {
  private static instance: AIBudgetControlService
  private requestQuotas = new Map<string, RequestQuota>()
  private usageTracker = AIUsageTrackingService.getInstance()

  public static getInstance(): AIBudgetControlService {
    if (!AIBudgetControlService.instance) {
      AIBudgetControlService.instance = new AIBudgetControlService()
    }
    return AIBudgetControlService.instance
  }

  /**
   * Check if a request is allowed based on budget rules
   */
  async checkRequestPermission(
    userId: string,
    serviceType: string,
    provider: string,
    model: string,
    estimatedCost: number,
    inputTokens: number
  ): Promise<{
    allowed: boolean
    reason?: string
    suggestedAlternative?: string
    remainingBudget?: number
    quotasRemaining?: number
  }> {
    try {
      // Check active budget rules
      const { data: rules, error } = await supabase
        .from('budget_rules')
        .select('*')
        .eq('is_active', true)
        .or(`user_id.eq.${userId},applies_to.eq.all`)

      if (error) {
        console.error('Error fetching budget rules:', error)
        return { allowed: true } // Allow on error to avoid service disruption
      }

      // Check overall budget limits first
      const budgetCheck = await this.usageTracker.canMakeRequest(userId, estimatedCost)
      if (!budgetCheck.allowed) {
        return {
          allowed: false,
          reason: budgetCheck.reason,
          remainingBudget: (budgetCheck.budgetLimit || 0) - (budgetCheck.currentUsage || 0)
        }
      }

      // Check specific budget rules
      for (const rule of rules) {
        const ruleCheck = await this.checkSpecificRule(
          rule,
          userId,
          serviceType,
          provider,
          model,
          estimatedCost,
          inputTokens
        )

        if (!ruleCheck.allowed) {
          return ruleCheck
        }
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(userId, serviceType)
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking request permission:', error)
      return { allowed: true } // Allow on error
    }
  }

  /**
   * Check a specific budget rule
   */
  private async checkSpecificRule(
    rule: BudgetRule,
    userId: string,
    serviceType: string,
    provider: string,
    model: string,
    estimatedCost: number,
    inputTokens: number
  ): Promise<{
    allowed: boolean
    reason?: string
    suggestedAlternative?: string
  }> {
    const serviceKey = `${provider}-${model}`

    // Check if rule applies to this request
    if (rule.applies_to === 'specific_service' && rule.service_filter !== serviceKey) {
      return { allowed: true }
    }

    if (rule.applies_to === 'specific_user' && rule.user_filter !== userId) {
      return { allowed: true }
    }

    switch (rule.rule_type) {
      case 'per_request_limit':
        if (estimatedCost > rule.rule_value) {
          return await this.handleRuleViolation(rule, userId, estimatedCost)
        }
        break

      case 'daily_limit':
      case 'monthly_limit':
        const period = rule.rule_type === 'daily_limit' ? 'day' : 'month'
        const usage = await this.usageTracker.getUserUsage(userId, period)
        
        if (usage.totalCost + estimatedCost > rule.rule_value) {
          return await this.handleRuleViolation(rule, userId, usage.totalCost + estimatedCost)
        }
        break

      case 'service_limit':
        const serviceUsage = await this.getServiceUsage(userId, serviceKey, 'month')
        
        if (serviceUsage + estimatedCost > rule.rule_value) {
          return await this.handleRuleViolation(rule, userId, serviceUsage + estimatedCost)
        }
        break
    }

    return { allowed: true }
  }

  /**
   * Handle rule violation based on enforcement action
   */
  private async handleRuleViolation(
    rule: BudgetRule,
    userId: string,
    violatingAmount: number
  ): Promise<{
    allowed: boolean
    reason?: string
    suggestedAlternative?: string
  }> {
    switch (rule.enforcement_action) {
      case 'block':
        await this.logViolation(rule, userId, violatingAmount, 'blocked')
        return {
          allowed: false,
          reason: `Request blocked: exceeds ${rule.rule_type} limit of $${rule.rule_value}`
        }

      case 'warn':
        await this.logViolation(rule, userId, violatingAmount, 'warned')
        await this.createBudgetWarning(userId, rule, violatingAmount)
        return { allowed: true }

      case 'throttle':
        await this.applyThrottling(userId, rule)
        return {
          allowed: false,
          reason: 'Request throttled due to budget limits. Please try again later.'
        }

      case 'downgrade':
        return {
          allowed: false,
          reason: `Request would exceed budget. Consider using ${rule.alternative_service}`,
          suggestedAlternative: rule.alternative_service
        }

      default:
        return { allowed: true }
    }
  }

  /**
   * Check rate limits for a user and service
   */
  private checkRateLimit(userId: string, serviceType: string): {
    allowed: boolean
    reason?: string
    quotasRemaining?: number
  } {
    const quotaKey = `${userId}-${serviceType}`
    const quota = this.requestQuotas.get(quotaKey)

    if (!quota) {
      // Initialize quota for new user/service combination
      this.requestQuotas.set(quotaKey, {
        user_id: userId,
        service_type: serviceType,
        requests_remaining: this.getDefaultQuota(serviceType),
        reset_time: this.getNextResetTime()
      })
      return { allowed: true, quotasRemaining: this.getDefaultQuota(serviceType) - 1 }
    }

    // Check if quota has reset
    if (new Date() >= quota.reset_time) {
      quota.requests_remaining = this.getDefaultQuota(serviceType)
      quota.reset_time = this.getNextResetTime()
      delete quota.blocked_until
    }

    // Check if user is temporarily blocked
    if (quota.blocked_until && new Date() < quota.blocked_until) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Try again after ${quota.blocked_until.toLocaleTimeString()}`
      }
    }

    // Check remaining quota
    if (quota.requests_remaining <= 0) {
      quota.blocked_until = new Date(Date.now() + 15 * 60 * 1000) // 15 minute block
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Temporarily blocked for 15 minutes.',
        quotasRemaining: 0
      }
    }

    quota.requests_remaining--
    return { 
      allowed: true, 
      quotasRemaining: quota.requests_remaining 
    }
  }

  /**
   * Get cost optimization suggestions for a user
   */
  async getCostOptimizationSuggestions(userId: string): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = []
    
    try {
      const usage = await this.usageTracker.getUserUsage(userId, 'month')
      
      // Analyze usage patterns
      const topServices = Object.entries(usage.byService)
        .sort(([,a], [,b]) => b.cost - a.cost)
        .slice(0, 3)

      for (const [serviceKey, serviceUsage] of topServices) {
        const [provider, model] = serviceKey.split('-')
        
        // Suggest model downgrades
        const downgradeOption = this.getDowngradeOption(provider, model)
        if (downgradeOption) {
          const config = this.usageTracker.getServiceConfig(provider, model)
          const downgradeConfig = this.usageTracker.getServiceConfig(downgradeOption.provider, downgradeOption.model)
          
          if (config && downgradeConfig) {
            const currentAvgCost = config.inputTokenCost + config.outputTokenCost
            const downgradeAvgCost = downgradeConfig.inputTokenCost + downgradeConfig.outputTokenCost
            const potentialSavings = serviceUsage.cost * (1 - downgradeAvgCost / currentAvgCost)
            
            if (potentialSavings > 1) { // Only suggest if savings > $1
              suggestions.push({
                type: 'model_downgrade',
                current_cost: serviceUsage.cost,
                optimized_cost: serviceUsage.cost - potentialSavings,
                savings: potentialSavings,
                description: `Switch from ${model} to ${downgradeOption.model} for routine tasks`,
                implementation_difficulty: 'easy',
                impact: potentialSavings > 10 ? 'high' : 'medium'
              })
            }
          }
        }

        // Suggest token reduction if high token usage
        if (serviceUsage.tokens > 100000) {
          const potentialSavings = serviceUsage.cost * 0.2 // Assume 20% reduction possible
          suggestions.push({
            type: 'reduce_tokens',
            current_cost: serviceUsage.cost,
            optimized_cost: serviceUsage.cost - potentialSavings,
            savings: potentialSavings,
            description: 'Optimize prompts to reduce token usage by 20%',
            implementation_difficulty: 'medium',
            impact: 'medium'
          })
        }
      }

      // Suggest batching for high request volumes
      if (Object.values(usage.byService).some(s => s.requests > 100)) {
        suggestions.push({
          type: 'batch_requests',
          current_cost: usage.totalCost,
          optimized_cost: usage.totalCost * 0.85,
          savings: usage.totalCost * 0.15,
          description: 'Batch multiple requests to reduce API overhead',
          implementation_difficulty: 'hard',
          impact: 'medium'
        })
      }

      return suggestions.sort((a, b) => b.savings - a.savings)
    } catch (error) {
      console.error('Error generating optimization suggestions:', error)
      return []
    }
  }

  /**
   * Set budget rule
   */
  async setBudgetRule(rule: Omit<BudgetRule, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budget_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Error setting budget rule:', error)
      return false
    }
  }

  /**
   * Get user's budget alerts
   */
  async getBudgetAlerts(userId: string, unreadOnly: boolean = false): Promise<UsageAlert[]> {
    try {
      let query = supabase
        .from('usage_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      return error ? [] : data
    } catch (error) {
      console.error('Error fetching budget alerts:', error)
      return []
    }
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage_alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      return !error
    } catch (error) {
      console.error('Error marking alert as read:', error)
      return false
    }
  }

  private async getServiceUsage(userId: string, serviceKey: string, period: 'day' | 'month'): Promise<number> {
    const usage = await this.usageTracker.getUserUsage(userId, period)
    return usage.byService[serviceKey]?.cost || 0
  }

  private getDefaultQuota(serviceType: string): number {
    const quotas: Record<string, number> = {
      'chat': 100,           // 100 requests per hour
      'content_generation': 50,
      'translation': 200,
      'summarization': 100,
      'search': 500,
      'other': 50
    }
    return quotas[serviceType] || 50
  }

  private getNextResetTime(): Date {
    const now = new Date()
    return new Date(now.getTime() + 60 * 60 * 1000) // Reset every hour
  }

  private getDowngradeOption(provider: string, model: string): { provider: string; model: string } | null {
    const downgrades: Record<string, { provider: string; model: string }> = {
      'openai-gpt-4o': { provider: 'openai', model: 'gpt-4o-mini' },
      'openai-gpt-4o-mini': { provider: 'openai', model: 'gpt-3.5-turbo' },
      'anthropic-claude-3.5-sonnet': { provider: 'anthropic', model: 'claude-3-haiku' },
      'google-gemini-pro': { provider: 'openai', model: 'gpt-3.5-turbo' }
    }

    return downgrades[`${provider}-${model}`] || null
  }

  private async logViolation(
    rule: BudgetRule,
    userId: string,
    amount: number,
    action: 'blocked' | 'warned' | 'throttled'
  ): Promise<void> {
    try {
      await supabase
        .from('budget_violations')
        .insert({
          user_id: userId,
          rule_id: rule.id,
          violation_amount: amount,
          rule_limit: rule.rule_value,
          action_taken: action,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging violation:', error)
    }
  }

  private async createBudgetWarning(userId: string, rule: BudgetRule, amount: number): Promise<void> {
    try {
      await supabase
        .from('usage_alerts')
        .insert({
          user_id: userId,
          budget_id: rule.id,
          alert_type: 'threshold',
          current_usage: amount,
          budget_limit: rule.rule_value,
          message: `Warning: You are approaching your ${rule.rule_type} limit of $${rule.rule_value}`,
          is_read: false,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error creating budget warning:', error)
    }
  }

  private async applyThrottling(userId: string, rule: BudgetRule): Promise<void> {
    // Implement throttling logic - for now, just add a delay
    const delay = Math.min(5000, rule.rule_value * 100) // Max 5 second delay
    
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

export default AIBudgetControlService