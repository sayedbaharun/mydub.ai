import { supabase } from '@/shared/lib/supabase'
import { qualityAssessmentService, QualityAssessmentResult } from './qualityAssessment.service'
import { duplicateDetectionService, DuplicateDetectionResult } from './duplicateDetection.service'
import { factVerificationService, FactVerificationResult } from './factVerification.service'
import { contentModerationService, ContentModerationResult } from './contentModeration.service'

export interface QualityRule {
  id: string
  name: string
  description: string
  rule_type: 'threshold' | 'condition' | 'pattern' | 'composite'
  category: 'quality' | 'moderation' | 'duplicate' | 'fact_check' | 'seo' | 'brand_voice' | 'cultural'
  content_types: string[]
  geographic_scope: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  active: boolean
  auto_action: 'approve' | 'reject' | 'flag' | 'review' | 'none'
  conditions: RuleCondition[]
  actions: RuleAction[]
  created_at: string
  updated_at: string
  created_by: string
}

export interface RuleCondition {
  field: string
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains' | 'regex' | 'in' | 'not_in'
  value: any
  weight: number
}

export interface RuleAction {
  action_type: 'set_status' | 'add_flag' | 'send_notification' | 'assign_reviewer' | 'modify_score' | 'add_recommendation'
  parameters: Record<string, any>
}

export interface QualityRuleSet {
  id: string
  name: string
  description: string
  content_type: string
  rules: string[] // Rule IDs
  default_thresholds: QualityThresholds
  active: boolean
}

export interface QualityThresholds {
  // Quality Assessment Thresholds
  min_overall_score: number
  min_content_quality: number
  min_grammar_score: number
  min_readability_score: number
  min_seo_score: number
  min_brand_voice_score: number
  min_cultural_sensitivity_score: number
  min_factual_accuracy_score: number
  min_image_quality_score: number

  // Moderation Thresholds
  min_safety_score: number
  max_bias_issues: number
  max_cultural_issues: number
  max_legal_issues: number

  // Duplicate Detection Thresholds
  max_similarity_score: number
  max_duplicate_matches: number

  // Fact Verification Thresholds
  min_fact_confidence: number
  max_unverified_claims: number
  max_disputed_claims: number

  // Auto-approval criteria
  auto_approve_threshold: number
  manual_review_threshold: number
  auto_reject_threshold: number
}

export interface RuleEvaluationResult {
  rule_id: string
  rule_name: string
  passed: boolean
  score: number
  triggered_conditions: string[]
  applied_actions: RuleAction[]
  recommendation: string
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export interface QualityDecision {
  content_id: string
  overall_score: number
  decision: 'auto_approve' | 'manual_review' | 'auto_reject' | 'conditional_approve'
  triggered_rules: RuleEvaluationResult[]
  quality_scores: {
    assessment: QualityAssessmentResult
    moderation: ContentModerationResult
    duplicate: DuplicateDetectionResult
    fact_check: FactVerificationResult
  }
  recommendations: string[]
  warnings: string[]
  required_actions: string[]
  assigned_reviewers: string[]
  estimated_review_time: number
  confidence: number
}

export class QualityRulesEngine {
  private rules: Map<string, QualityRule> = new Map()
  private ruleSets: Map<string, QualityRuleSet> = new Map()
  private defaultThresholds: Map<string, QualityThresholds> = new Map()

  async initialize(): Promise<void> {
    await this.loadRules()
    await this.loadRuleSets()
    await this.loadDefaultThresholds()
  }

  async evaluateContent(content: {
    id: string
    title: string
    content: string
    content_type: string
    images?: string[]
    author_id?: string
    target_audience?: string
    geographic_scope?: string
  }): Promise<QualityDecision> {
    try {
      // Run all quality checks in parallel
      const [assessmentResult, moderationResult, duplicateResult, factCheckResult] = await Promise.all([
        qualityAssessmentService.assessContent(content),
        contentModerationService.moderateContent(content),
        duplicateDetectionService.detectDuplicates(content),
        factVerificationService.verifyContent(content)
      ])

      // Get applicable rules for this content
      const applicableRules = await this.getApplicableRules(content)

      // Evaluate all rules
      const ruleResults = await Promise.all(
        applicableRules.map(rule => this.evaluateRule(rule, {
          assessment: assessmentResult,
          moderation: moderationResult,
          duplicate: duplicateResult,
          fact_check: factCheckResult
        }, content))
      )

      // Calculate overall score
      const overallScore = this.calculateOverallScore(assessmentResult, moderationResult, duplicateResult, factCheckResult, ruleResults)

      // Make quality decision
      const decision = this.makeQualityDecision(overallScore, ruleResults, assessmentResult, moderationResult, duplicateResult, factCheckResult)

      // Generate recommendations and warnings
      const recommendations = this.generateRecommendations(ruleResults, assessmentResult, moderationResult, duplicateResult, factCheckResult)
      const warnings = this.generateWarnings(ruleResults, assessmentResult, moderationResult, duplicateResult, factCheckResult)

      // Determine required actions
      const requiredActions = this.determineRequiredActions(ruleResults, decision)

      // Assign reviewers if needed
      const assignedReviewers = await this.assignReviewers(decision, ruleResults, content)

      // Estimate review time
      const estimatedReviewTime = this.estimateReviewTime(ruleResults, content)

      // Calculate confidence
      const confidence = this.calculateConfidence(ruleResults, assessmentResult, moderationResult, duplicateResult, factCheckResult)

      const qualityDecision: QualityDecision = {
        content_id: content.id,
        overall_score: overallScore,
        decision,
        triggered_rules: ruleResults,
        quality_scores: {
          assessment: assessmentResult,
          moderation: moderationResult,
          duplicate: duplicateResult,
          fact_check: factCheckResult
        },
        recommendations,
        warnings,
        required_actions: requiredActions,
        assigned_reviewers: assignedReviewers,
        estimated_review_time: estimatedReviewTime,
        confidence
      }

      // Store quality decision
      await this.storeQualityDecision(qualityDecision)

      return qualityDecision
    } catch (error) {
      console.error('Error evaluating content quality:', error)
      throw error
    }
  }

  async createRule(rule: Omit<QualityRule, 'id' | 'created_at' | 'updated_at'>): Promise<QualityRule> {
    const newRule: QualityRule = {
      ...rule,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await supabase.from('quality_rules').insert(newRule)
    this.rules.set(newRule.id, newRule)

    return newRule
  }

  async updateRule(ruleId: string, updates: Partial<QualityRule>): Promise<QualityRule> {
    const existingRule = this.rules.get(ruleId)
    if (!existingRule) throw new Error('Rule not found')

    const updatedRule: QualityRule = {
      ...existingRule,
      ...updates,
      updated_at: new Date().toISOString()
    }

    await supabase.from('quality_rules').update(updatedRule).eq('id', ruleId)
    this.rules.set(ruleId, updatedRule)

    return updatedRule
  }

  async deleteRule(ruleId: string): Promise<void> {
    await supabase.from('quality_rules').delete().eq('id', ruleId)
    this.rules.delete(ruleId)
  }

  async createRuleSet(ruleSet: Omit<QualityRuleSet, 'id'>): Promise<QualityRuleSet> {
    const newRuleSet: QualityRuleSet = {
      ...ruleSet,
      id: crypto.randomUUID()
    }

    await supabase.from('quality_rule_sets').insert(newRuleSet)
    this.ruleSets.set(newRuleSet.id, newRuleSet)

    return newRuleSet
  }

  async updateThresholds(contentType: string, thresholds: Partial<QualityThresholds>): Promise<QualityThresholds> {
    const existing = this.defaultThresholds.get(contentType) || this.getDefaultThresholds(contentType)
    const updated = { ...existing, ...thresholds }

    await supabase.from('quality_thresholds').upsert({
      content_type: contentType,
      ...updated
    })

    this.defaultThresholds.set(contentType, updated)
    return updated
  }

  async getQualityStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    total_evaluated: number
    auto_approved: number
    manual_reviews: number
    auto_rejected: number
    average_score: number
    common_issues: Array<{ issue: string; count: number }>
    rule_triggers: Array<{ rule_name: string; count: number }>
  }> {
    const since = new Date()
    switch (timeframe) {
      case 'day':
        since.setDate(since.getDate() - 1)
        break
      case 'week':
        since.setDate(since.getDate() - 7)
        break
      case 'month':
        since.setMonth(since.getMonth() - 1)
        break
    }

    const { data: decisions } = await supabase
      .from('quality_decisions')
      .select('*')
      .gte('created_at', since.toISOString())

    if (!decisions) return {
      total_evaluated: 0,
      auto_approved: 0,
      manual_reviews: 0,
      auto_rejected: 0,
      average_score: 0,
      common_issues: [],
      rule_triggers: []
    }

    const stats = {
      total_evaluated: decisions.length,
      auto_approved: decisions.filter(d => d.decision === 'auto_approve').length,
      manual_reviews: decisions.filter(d => d.decision === 'manual_review').length,
      auto_rejected: decisions.filter(d => d.decision === 'auto_reject').length,
      average_score: decisions.reduce((sum, d) => sum + d.overall_score, 0) / decisions.length,
      common_issues: [] as Array<{ issue: string; count: number }>,
      rule_triggers: [] as Array<{ rule_name: string; count: number }>
    }

    // Aggregate common issues
    const issueCount = new Map<string, number>()
    const ruleCount = new Map<string, number>()

    for (const decision of decisions) {
      // Count warnings as issues
      for (const warning of decision.warnings || []) {
        issueCount.set(warning, (issueCount.get(warning) || 0) + 1)
      }

      // Count rule triggers
      for (const rule of decision.triggered_rules || []) {
        if (!rule.passed) {
          ruleCount.set(rule.rule_name, (ruleCount.get(rule.rule_name) || 0) + 1)
        }
      }
    }

    stats.common_issues = Array.from(issueCount.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    stats.rule_triggers = Array.from(ruleCount.entries())
      .map(([rule_name, count]) => ({ rule_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  private async loadRules(): Promise<void> {
    const { data: rules } = await supabase
      .from('quality_rules')
      .select('*')
      .eq('active', true)

    if (rules) {
      for (const rule of rules) {
        this.rules.set(rule.id, rule)
      }
    }

    // Load default rules if none exist
    if (this.rules.size === 0) {
      await this.createDefaultRules()
    }
  }

  private async loadRuleSets(): Promise<void> {
    const { data: ruleSets } = await supabase
      .from('quality_rule_sets')
      .select('*')
      .eq('active', true)

    if (ruleSets) {
      for (const ruleSet of ruleSets) {
        this.ruleSets.set(ruleSet.id, ruleSet)
      }
    }
  }

  private async loadDefaultThresholds(): Promise<void> {
    const { data: thresholds } = await supabase
      .from('quality_thresholds')
      .select('*')

    if (thresholds) {
      for (const threshold of thresholds) {
        this.defaultThresholds.set(threshold.content_type, threshold)
      }
    }

    // Create default thresholds for common content types
    const contentTypes = ['news', 'tourism', 'government', 'events', 'practical']
    for (const contentType of contentTypes) {
      if (!this.defaultThresholds.has(contentType)) {
        const defaultThreshold = this.getDefaultThresholds(contentType)
        this.defaultThresholds.set(contentType, defaultThreshold)
        await supabase.from('quality_thresholds').insert({
          content_type: contentType,
          ...defaultThreshold
        })
      }
    }
  }

  private async createDefaultRules(): Promise<void> {
    const defaultRules: Omit<QualityRule, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        name: 'Minimum Overall Quality Score',
        description: 'Content must meet minimum overall quality threshold',
        rule_type: 'threshold',
        category: 'quality',
        content_types: ['all'],
        geographic_scope: ['all'],
        priority: 'high',
        active: true,
        auto_action: 'flag',
        conditions: [{
          field: 'assessment.overall_score',
          operator: 'gte',
          value: 70,
          weight: 1.0
        }],
        actions: [{
          action_type: 'add_flag',
          parameters: { flag_type: 'low_quality', severity: 'medium' }
        }],
        created_by: 'system'
      },
      {
        name: 'Cultural Sensitivity Check',
        description: 'Content must be culturally appropriate for UAE audience',
        rule_type: 'threshold',
        category: 'cultural',
        content_types: ['all'],
        geographic_scope: ['uae', 'gcc'],
        priority: 'critical',
        active: true,
        auto_action: 'review',
        conditions: [{
          field: 'assessment.cultural_sensitivity_score',
          operator: 'gte',
          value: 85,
          weight: 1.0
        }],
        actions: [{
          action_type: 'assign_reviewer',
          parameters: { reviewer_type: 'cultural_expert' }
        }],
        created_by: 'system'
      },
      {
        name: 'Duplicate Content Detection',
        description: 'Content must not be a duplicate or near-duplicate',
        rule_type: 'condition',
        category: 'duplicate',
        content_types: ['all'],
        geographic_scope: ['all'],
        priority: 'high',
        active: true,
        auto_action: 'reject',
        conditions: [{
          field: 'duplicate.duplicate_type',
          operator: 'neq',
          value: 'exact',
          weight: 1.0
        }],
        actions: [{
          action_type: 'set_status',
          parameters: { status: 'rejected', reason: 'duplicate_content' }
        }],
        created_by: 'system'
      },
      {
        name: 'Safety and Moderation Check',
        description: 'Content must pass safety and moderation standards',
        rule_type: 'composite',
        category: 'moderation',
        content_types: ['all'],
        geographic_scope: ['all'],
        priority: 'critical',
        active: true,
        auto_action: 'reject',
        conditions: [
          {
            field: 'moderation.overall_safety_score',
            operator: 'gte',
            value: 70,
            weight: 0.6
          },
          {
            field: 'moderation.moderation_status',
            operator: 'neq',
            value: 'blocked',
            weight: 0.4
          }
        ],
        actions: [{
          action_type: 'set_status',
          parameters: { status: 'blocked', reason: 'safety_violation' }
        }],
        created_by: 'system'
      },
      {
        name: 'Fact Verification Requirements',
        description: 'Content with factual claims must pass verification',
        rule_type: 'threshold',
        category: 'fact_check',
        content_types: ['news', 'government'],
        geographic_scope: ['all'],
        priority: 'high',
        active: true,
        auto_action: 'review',
        conditions: [{
          field: 'fact_check.overall_confidence',
          operator: 'gte',
          value: 75,
          weight: 1.0
        }],
        actions: [{
          action_type: 'assign_reviewer',
          parameters: { reviewer_type: 'fact_checker' }
        }],
        created_by: 'system'
      }
    ]

    for (const rule of defaultRules) {
      await this.createRule(rule)
    }
  }

  private getDefaultThresholds(contentType: string): QualityThresholds {
    const baseThresholds: QualityThresholds = {
      min_overall_score: 70,
      min_content_quality: 65,
      min_grammar_score: 75,
      min_readability_score: 60,
      min_seo_score: 65,
      min_brand_voice_score: 70,
      min_cultural_sensitivity_score: 85,
      min_factual_accuracy_score: 70,
      min_image_quality_score: 60,
      min_safety_score: 75,
      max_bias_issues: 2,
      max_cultural_issues: 1,
      max_legal_issues: 0,
      max_similarity_score: 0.7,
      max_duplicate_matches: 1,
      min_fact_confidence: 75,
      max_unverified_claims: 3,
      max_disputed_claims: 0,
      auto_approve_threshold: 85,
      manual_review_threshold: 60,
      auto_reject_threshold: 40
    }

    // Adjust thresholds based on content type
    switch (contentType) {
      case 'news':
        return {
          ...baseThresholds,
          min_factual_accuracy_score: 80,
          min_fact_confidence: 80,
          max_unverified_claims: 2,
          auto_approve_threshold: 90
        }
      case 'government':
        return {
          ...baseThresholds,
          min_overall_score: 80,
          min_grammar_score: 85,
          min_cultural_sensitivity_score: 95,
          min_factual_accuracy_score: 85,
          auto_approve_threshold: 95,
          manual_review_threshold: 70
        }
      case 'tourism':
        return {
          ...baseThresholds,
          min_brand_voice_score: 80,
          min_cultural_sensitivity_score: 90,
          min_seo_score: 75,
          auto_approve_threshold: 80
        }
      default:
        return baseThresholds
    }
  }

  private async getApplicableRules(content: any): Promise<QualityRule[]> {
    const applicableRules: QualityRule[] = []

    for (const rule of this.rules.values()) {
      if (!rule.active) continue

      // Check content type match
      if (!rule.content_types.includes('all') && !rule.content_types.includes(content.content_type)) {
        continue
      }

      // Check geographic scope
      if (content.geographic_scope && 
          !rule.geographic_scope.includes('all') && 
          !rule.geographic_scope.includes(content.geographic_scope)) {
        continue
      }

      applicableRules.push(rule)
    }

    return applicableRules
  }

  private async evaluateRule(
    rule: QualityRule,
    qualityResults: {
      assessment: QualityAssessmentResult
      moderation: ContentModerationResult
      duplicate: DuplicateDetectionResult
      fact_check: FactVerificationResult
    },
    content: any
  ): Promise<RuleEvaluationResult> {
    const triggeredConditions: string[] = []
    const appliedActions: RuleAction[] = []
    let passed = true
    let score = 100

    // Evaluate conditions
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(condition.field, qualityResults, content)
      const conditionPassed = this.evaluateCondition(condition, fieldValue)

      if (!conditionPassed) {
        passed = false
        score -= (100 * condition.weight) / rule.conditions.length
        triggeredConditions.push(`${condition.field} ${condition.operator} ${condition.value}`)
      }
    }

    // Apply actions if rule failed
    if (!passed) {
      appliedActions.push(...rule.actions)
    }

    // Determine severity
    let severity: RuleEvaluationResult['severity'] = 'info'
    if (!passed) {
      switch (rule.priority) {
        case 'critical':
          severity = 'critical'
          break
        case 'high':
          severity = 'error'
          break
        case 'medium':
          severity = 'warning'
          break
        default:
          severity = 'info'
      }
    }

    // Generate recommendation
    const recommendation = passed ? 
      `Rule "${rule.name}" passed successfully` :
      `Rule "${rule.name}" failed: ${triggeredConditions.join(', ')}`

    return {
      rule_id: rule.id,
      rule_name: rule.name,
      passed,
      score: Math.max(0, score),
      triggered_conditions: triggeredConditions,
      applied_actions: appliedActions,
      recommendation,
      severity
    }
  }

  private getFieldValue(field: string, qualityResults: any, content: any): any {
    const parts = field.split('.')
    let value = { ...qualityResults, content }

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  private evaluateCondition(condition: RuleCondition, value: any): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.value
      case 'gte':
        return value >= condition.value
      case 'lt':
        return value < condition.value
      case 'lte':
        return value <= condition.value
      case 'eq':
        return value === condition.value
      case 'neq':
        return value !== condition.value
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value)
      case 'not_contains':
        return typeof value === 'string' && !value.includes(condition.value)
      case 'regex':
        return new RegExp(condition.value).test(String(value))
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value)
      default:
        return false
    }
  }

  private calculateOverallScore(
    assessment: QualityAssessmentResult,
    moderation: ContentModerationResult,
    duplicate: DuplicateDetectionResult,
    factCheck: FactVerificationResult,
    ruleResults: RuleEvaluationResult[]
  ): number {
    const weights = {
      assessment: 0.35,
      moderation: 0.25,
      duplicate: 0.15,
      factCheck: 0.15,
      rules: 0.10
    }

    const scores = {
      assessment: assessment.overall_score,
      moderation: moderation.overall_safety_score,
      duplicate: duplicate.is_duplicate ? 0 : 100,
      factCheck: factCheck.overall_confidence,
      rules: ruleResults.reduce((sum, r) => sum + r.score, 0) / Math.max(1, ruleResults.length)
    }

    return Math.round(
      scores.assessment * weights.assessment +
      scores.moderation * weights.moderation +
      scores.duplicate * weights.duplicate +
      scores.factCheck * weights.factCheck +
      scores.rules * weights.rules
    )
  }

  private makeQualityDecision(
    overallScore: number,
    ruleResults: RuleEvaluationResult[],
    assessment: QualityAssessmentResult,
    moderation: ContentModerationResult,
    duplicate: DuplicateDetectionResult,
    factCheck: FactVerificationResult
  ): QualityDecision['decision'] {
    // Check for critical rule failures
    const criticalFailures = ruleResults.filter(r => !r.passed && r.severity === 'critical')
    if (criticalFailures.length > 0) {
      return 'auto_reject'
    }

    // Check for safety violations
    if (moderation.moderation_status === 'blocked' || moderation.moderation_status === 'unsafe') {
      return 'auto_reject'
    }

    // Check for exact duplicates
    if (duplicate.duplicate_type === 'exact') {
      return 'auto_reject'
    }

    // Check for manual review requirements
    if (
      assessment.manual_review_required ||
      moderation.requires_human_review ||
      factCheck.requires_manual_review ||
      ruleResults.some(r => !r.passed && r.severity === 'error')
    ) {
      return 'manual_review'
    }

    // Auto-approve if score is high enough
    if (overallScore >= 85 && ruleResults.every(r => r.passed || r.severity === 'info')) {
      return 'auto_approve'
    }

    // Conditional approve for moderate scores
    if (overallScore >= 70) {
      return 'conditional_approve'
    }

    return 'manual_review'
  }

  private generateRecommendations(
    ruleResults: RuleEvaluationResult[],
    assessment: QualityAssessmentResult,
    moderation: ContentModerationResult,
    duplicate: DuplicateDetectionResult,
    factCheck: FactVerificationResult
  ): string[] {
    const recommendations = new Set<string>()

    // Add recommendations from individual checks
    assessment.recommendations.forEach(r => recommendations.add(r))
    moderation.recommendations.forEach(r => recommendations.add(r))
    duplicate.recommendations.forEach(r => recommendations.add(r))
    factCheck.recommendations.forEach(r => recommendations.add(r))

    // Add recommendations from failed rules
    const failedRules = ruleResults.filter(r => !r.passed)
    for (const rule of failedRules) {
      recommendations.add(rule.recommendation)
    }

    return Array.from(recommendations)
  }

  private generateWarnings(
    ruleResults: RuleEvaluationResult[],
    assessment: QualityAssessmentResult,
    moderation: ContentModerationResult,
    duplicate: DuplicateDetectionResult,
    factCheck: FactVerificationResult
  ): string[] {
    const warnings = new Set<string>()

    // Add warnings from individual checks
    assessment.warnings.forEach(w => warnings.add(w))
    moderation.warnings.forEach(w => warnings.add(w))
    duplicate.warnings.forEach(w => warnings.add(w))
    factCheck.warnings.forEach(w => warnings.add(w))

    // Add warnings from critical/error rule failures
    const criticalErrors = ruleResults.filter(r => !r.passed && (r.severity === 'critical' || r.severity === 'error'))
    for (const rule of criticalErrors) {
      warnings.add(`${rule.severity.toUpperCase()}: ${rule.rule_name} failed`)
    }

    return Array.from(warnings)
  }

  private determineRequiredActions(ruleResults: RuleEvaluationResult[], decision: QualityDecision['decision']): string[] {
    const actions = new Set<string>()

    // Add actions from failed rules
    for (const rule of ruleResults.filter(r => !r.passed)) {
      for (const action of rule.applied_actions) {
        switch (action.action_type) {
          case 'set_status':
            actions.add(`Set status to ${action.parameters.status}`)
            break
          case 'add_flag':
            actions.add(`Add flag: ${action.parameters.flag_type}`)
            break
          case 'assign_reviewer':
            actions.add(`Assign ${action.parameters.reviewer_type} reviewer`)
            break
          case 'send_notification':
            actions.add(`Send notification to ${action.parameters.recipient}`)
            break
        }
      }
    }

    // Add decision-based actions
    switch (decision) {
      case 'auto_reject':
        actions.add('Automatically reject content')
        break
      case 'manual_review':
        actions.add('Assign to manual review queue')
        break
      case 'conditional_approve':
        actions.add('Approve with conditions')
        break
    }

    return Array.from(actions)
  }

  private async assignReviewers(decision: QualityDecision['decision'], ruleResults: RuleEvaluationResult[], content: any): Promise<string[]> {
    const reviewers: string[] = []

    if (decision === 'manual_review' || decision === 'conditional_approve') {
      // Extract reviewer requirements from failed rules
      for (const rule of ruleResults.filter(r => !r.passed)) {
        for (const action of rule.applied_actions) {
          if (action.action_type === 'assign_reviewer') {
            // In a real implementation, this would query the database for available reviewers
            reviewers.push(`${action.parameters.reviewer_type}_reviewer`)
          }
        }
      }
    }

    return reviewers
  }

  private estimateReviewTime(ruleResults: RuleEvaluationResult[], content: any): number {
    let baseTime = 15 // minutes

    // Add time for each failed rule
    const failedRules = ruleResults.filter(r => !r.passed)
    baseTime += failedRules.length * 5

    // Add time based on content length
    const contentLength = content.content.length
    if (contentLength > 2000) baseTime += 10
    if (contentLength > 5000) baseTime += 20

    // Add time for specific issues
    if (failedRules.some(r => r.severity === 'critical')) baseTime += 30
    if (failedRules.some(r => r.rule_name.includes('Cultural'))) baseTime += 20
    if (failedRules.some(r => r.rule_name.includes('Fact'))) baseTime += 25

    return baseTime
  }

  private calculateConfidence(
    ruleResults: RuleEvaluationResult[],
    assessment: QualityAssessmentResult,
    moderation: ContentModerationResult,
    duplicate: DuplicateDetectionResult,
    factCheck: FactVerificationResult
  ): number {
    const failedRules = ruleResults.filter(r => !r.passed)
    const criticalFailures = failedRules.filter(r => r.severity === 'critical')

    let confidence = 90

    // Reduce confidence for failures
    confidence -= failedRules.length * 10
    confidence -= criticalFailures.length * 20

    // Factor in individual check confidence
    if (!assessment.auto_approve_eligible) confidence -= 10
    if (moderation.requires_human_review) confidence -= 15
    if (duplicate.is_duplicate) confidence -= 20
    if (factCheck.requires_manual_review) confidence -= 10

    return Math.max(0, Math.min(100, confidence))
  }

  private async storeQualityDecision(decision: QualityDecision): Promise<void> {
    await supabase.from('quality_decisions').upsert({
      content_id: decision.content_id,
      overall_score: decision.overall_score,
      decision: decision.decision,
      triggered_rules: decision.triggered_rules,
      quality_scores: decision.quality_scores,
      recommendations: decision.recommendations,
      warnings: decision.warnings,
      required_actions: decision.required_actions,
      assigned_reviewers: decision.assigned_reviewers,
      estimated_review_time: decision.estimated_review_time,
      confidence: decision.confidence,
      created_at: new Date().toISOString()
    })
  }
}

export const qualityRulesEngine = new QualityRulesEngine()