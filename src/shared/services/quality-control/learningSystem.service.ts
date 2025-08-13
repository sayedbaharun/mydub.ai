import { supabase } from '@/shared/lib/supabase'
import { qualityRulesEngine } from './qualityRules'

export interface FeedbackRecord {
  id: string
  content_id: string
  user_id: string
  feedback_type: 'quality_rating' | 'content_correction' | 'rule_feedback' | 'general_feedback'
  rating: number // 1-5 scale
  feedback_text: string
  specific_issues: string[]
  suggested_improvements: string[]
  ai_agent_id?: string
  ai_decision_correct: boolean
  human_override_reason?: string
  feedback_category: 'grammar' | 'content_quality' | 'cultural_sensitivity' | 'fact_accuracy' | 'bias' | 'readability' | 'seo' | 'other'
  created_at: string
  processed: boolean
  impact_score: number
}

export interface LearningPattern {
  id: string
  pattern_type: 'approval_pattern' | 'rejection_pattern' | 'quality_correlation' | 'bias_pattern' | 'cultural_pattern'
  pattern_data: any
  confidence: number
  frequency: number
  last_observed: string
  suggested_rules: QualityRuleAdjustment[]
  pattern_description: string
  impact_assessment: string
}

export interface QualityRuleAdjustment {
  rule_id: string
  adjustment_type: 'threshold_change' | 'weight_change' | 'condition_modification' | 'new_rule' | 'rule_deactivation'
  current_value: any
  suggested_value: any
  confidence: number
  reasoning: string
  expected_impact: string
}

export interface PerformanceMetrics {
  agent_id?: string
  content_type: string
  time_period: string
  total_content: number
  auto_approved: number
  manual_reviews: number
  auto_rejected: number
  human_overrides: number
  accuracy_score: number
  false_positive_rate: number
  false_negative_rate: number
  average_quality_score: number
  common_issues: Array<{ issue: string; frequency: number }>
  improvement_trends: Array<{ metric: string; trend: 'improving' | 'declining' | 'stable'; change_rate: number }>
}

export interface ImprovementSuggestion {
  id: string
  suggestion_type: 'rule_adjustment' | 'threshold_change' | 'new_feature' | 'process_improvement'
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  expected_benefit: string
  implementation_effort: 'low' | 'medium' | 'high'
  confidence: number
  supporting_data: any
  estimated_impact: number
  created_at: string
  status: 'pending' | 'under_review' | 'approved' | 'implemented' | 'rejected'
}

export interface ContentAnalysisReport {
  content_id: string
  ai_predictions: any
  human_decisions: any
  discrepancies: Array<{
    area: string
    ai_assessment: any
    human_assessment: any
    difference_score: number
    learning_opportunity: string
  }>
  feedback_summary: string
  recommended_adjustments: QualityRuleAdjustment[]
}

export class LearningSystemService {
  private readonly LEARNING_THRESHOLDS = {
    min_feedback_for_pattern: 5,
    confidence_threshold: 0.7,
    pattern_significance_threshold: 0.05,
    adjustment_confidence_threshold: 0.8
  }

  async recordFeedback(feedback: Omit<FeedbackRecord, 'id' | 'created_at' | 'processed' | 'impact_score'>): Promise<FeedbackRecord> {
    const feedbackRecord: FeedbackRecord = {
      ...feedback,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      processed: false,
      impact_score: this.calculateImpactScore(feedback)
    }

    await supabase.from('quality_feedback').insert(feedbackRecord)

    // Process feedback immediately if it's high impact
    if (feedbackRecord.impact_score > 80) {
      await this.processFeedback(feedbackRecord.id)
    }

    return feedbackRecord
  }

  async processFeedback(feedbackId: string): Promise<void> {
    const { data: feedback } = await supabase
      .from('quality_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single()

    if (!feedback || feedback.processed) return

    try {
      // Analyze the feedback for learning opportunities
      const analysisReport = await this.analyzeFeedback(feedback)

      // Update quality rules based on feedback
      await this.updateRulesFromFeedback(feedback, analysisReport)

      // Look for patterns
      await this.detectLearningPatterns(feedback)

      // Generate improvement suggestions
      await this.generateImprovementSuggestions(feedback, analysisReport)

      // Mark as processed
      await supabase
        .from('quality_feedback')
        .update({ processed: true })
        .eq('id', feedbackId)

    } catch (error) {
      console.error('Error processing feedback:', error)
    }
  }

  async processAllPendingFeedback(): Promise<void> {
    const { data: pendingFeedback } = await supabase
      .from('quality_feedback')
      .select('id')
      .eq('processed', false)
      .order('impact_score', { ascending: false })
      .limit(50)

    if (pendingFeedback) {
      for (const feedback of pendingFeedback) {
        await this.processFeedback(feedback.id)
      }
    }
  }

  async detectLearningPatterns(): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = []

    // Detect approval patterns
    const approvalPatterns = await this.detectApprovalPatterns()
    patterns.push(...approvalPatterns)

    // Detect rejection patterns
    const rejectionPatterns = await this.detectRejectionPatterns()
    patterns.push(...rejectionPatterns)

    // Detect quality correlations
    const qualityCorrelations = await this.detectQualityCorrelations()
    patterns.push(...qualityCorrelations)

    // Detect bias patterns
    const biasPatterns = await this.detectBiasPatterns()
    patterns.push(...biasPatterns)

    // Detect cultural sensitivity patterns
    const culturalPatterns = await this.detectCulturalPatterns()
    patterns.push(...culturalPatterns)

    // Store patterns
    for (const pattern of patterns) {
      await this.storeLearningPattern(pattern)
    }

    return patterns
  }

  async generatePerformanceMetrics(
    agentId?: string,
    contentType?: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<PerformanceMetrics[]> {
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

    let query = supabase
      .from('quality_decisions')
      .select(`
        *,
        content:content_id(content_type, ai_agent_id),
        feedback:quality_feedback(rating, ai_decision_correct)
      `)
      .gte('created_at', since.toISOString())

    if (agentId) {
      query = query.eq('content.ai_agent_id', agentId)
    }

    if (contentType) {
      query = query.eq('content.content_type', contentType)
    }

    const { data: decisions } = await query

    if (!decisions) return []

    // Group by agent and content type
    const groupedData = this.groupDecisionsByAgentAndType(decisions)

    const metrics: PerformanceMetrics[] = []

    for (const [key, data] of groupedData.entries()) {
      const [agent_id, content_type] = key.split('|')
      
      const totalContent = data.length
      const autoApproved = data.filter(d => d.decision === 'auto_approve').length
      const manualReviews = data.filter(d => d.decision === 'manual_review').length
      const autoRejected = data.filter(d => d.decision === 'auto_reject').length
      
      const humanOverrides = data.filter(d => 
        d.feedback?.some((f: any) => !f.ai_decision_correct)
      ).length

      const accuracyScore = this.calculateAccuracyScore(data)
      const falsePositiveRate = this.calculateFalsePositiveRate(data)
      const falseNegativeRate = this.calculateFalseNegativeRate(data)
      const averageQualityScore = data.reduce((sum, d) => sum + d.overall_score, 0) / totalContent

      const commonIssues = this.extractCommonIssues(data)
      const improvementTrends = await this.calculateImprovementTrends(agent_id, content_type, timeframe)

      metrics.push({
        agent_id: agent_id === 'undefined' ? undefined : agent_id,
        content_type,
        time_period: timeframe,
        total_content: totalContent,
        auto_approved: autoApproved,
        manual_reviews: manualReviews,
        auto_rejected: autoRejected,
        human_overrides: humanOverrides,
        accuracy_score: accuracyScore,
        false_positive_rate: falsePositiveRate,
        false_negative_rate: falseNegativeRate,
        average_quality_score: averageQualityScore,
        common_issues: commonIssues,
        improvement_trends: improvementTrends
      })
    }

    return metrics
  }

  async adjustQualityThresholds(
    adjustments: QualityRuleAdjustment[],
    approvedBy: string
  ): Promise<void> {
    for (const adjustment of adjustments) {
      if (adjustment.confidence >= this.LEARNING_THRESHOLDS.adjustment_confidence_threshold) {
        try {
          switch (adjustment.adjustment_type) {
            case 'threshold_change':
              await this.adjustThreshold(adjustment)
              break
            case 'weight_change':
              await this.adjustWeight(adjustment)
              break
            case 'condition_modification':
              await this.modifyCondition(adjustment)
              break
            case 'new_rule':
              await this.createNewRule(adjustment)
              break
            case 'rule_deactivation':
              await this.deactivateRule(adjustment)
              break
          }

          // Log the adjustment
          await this.logAdjustment(adjustment, approvedBy)
        } catch (error) {
          console.error('Error applying adjustment:', error)
        }
      }
    }
  }

  async getImprovementSuggestions(
    limit: number = 10,
    priority?: ImprovementSuggestion['priority']
  ): Promise<ImprovementSuggestion[]> {
    let query = supabase
      .from('improvement_suggestions')
      .select('*')
      .in('status', ['pending', 'under_review'])
      .order('confidence', { ascending: false })
      .limit(limit)

    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: suggestions } = await query
    return suggestions || []
  }

  async implementSuggestion(suggestionId: string, implementedBy: string): Promise<void> {
    const { data: suggestion } = await supabase
      .from('improvement_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single()

    if (!suggestion) throw new Error('Suggestion not found')

    try {
      // Apply the suggestion based on its type
      await this.applySuggestion(suggestion)

      // Update status
      await supabase
        .from('improvement_suggestions')
        .update({ 
          status: 'implemented',
          implemented_by: implementedBy,
          implemented_at: new Date().toISOString()
        })
        .eq('id', suggestionId)

    } catch (error) {
      console.error('Error implementing suggestion:', error)
      throw error
    }
  }

  async generateQualityTrendReport(timeframe: number = 30): Promise<{
    overall_trends: any
    agent_performance: any[]
    content_type_trends: any[]
    quality_improvements: any[]
    areas_for_improvement: any[]
  }> {
    const since = new Date()
    since.setDate(since.getDate() - timeframe)

    // Get quality decisions
    const { data: decisions } = await supabase
      .from('quality_decisions')
      .select('*')
      .gte('created_at', since.toISOString())

    // Get feedback
    const { data: feedback } = await supabase
      .from('quality_feedback')
      .select('*')
      .gte('created_at', since.toISOString())

    // Get performance metrics
    const performanceMetrics = await this.generatePerformanceMetrics()

    // Get learning patterns
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .gte('last_observed', since.toISOString())

    return {
      overall_trends: this.calculateOverallTrends(decisions || [], feedback || []),
      agent_performance: performanceMetrics,
      content_type_trends: this.calculateContentTypeTrends(decisions || []),
      quality_improvements: this.identifyQualityImprovements(decisions || [], patterns || []),
      areas_for_improvement: this.identifyAreasForImprovement(feedback || [], patterns || [])
    }
  }

  private calculateImpactScore(feedback: Partial<FeedbackRecord>): number {
    let score = 50 // Base score

    // Adjust based on rating
    if (feedback.rating) {
      if (feedback.rating <= 2) score += 30 // Poor rating = high impact
      else if (feedback.rating >= 4) score += 10 // Good rating = low impact
    }

    // Adjust based on feedback type
    switch (feedback.feedback_type) {
      case 'quality_rating':
        score += 10
        break
      case 'content_correction':
        score += 25
        break
      case 'rule_feedback':
        score += 20
        break
    }

    // Adjust based on AI decision correctness
    if (feedback.ai_decision_correct === false) {
      score += 30
    }

    // Adjust based on category
    switch (feedback.feedback_category) {
      case 'cultural_sensitivity':
        score += 20
        break
      case 'fact_accuracy':
        score += 15
        break
      case 'bias':
        score += 15
        break
    }

    return Math.min(100, score)
  }

  private async analyzeFeedback(feedback: FeedbackRecord): Promise<ContentAnalysisReport> {
    // Get the original AI assessment
    const { data: qualityDecision } = await supabase
      .from('quality_decisions')
      .select('*')
      .eq('content_id', feedback.content_id)
      .single()

    if (!qualityDecision) {
      throw new Error('Quality decision not found')
    }

    const discrepancies = []

    // Analyze discrepancies between AI and human assessment
    if (feedback.rating <= 2 && qualityDecision.overall_score >= 70) {
      discrepancies.push({
        area: 'overall_quality',
        ai_assessment: qualityDecision.overall_score,
        human_assessment: feedback.rating * 20,
        difference_score: Math.abs(qualityDecision.overall_score - (feedback.rating * 20)),
        learning_opportunity: 'AI overestimated content quality'
      })
    }

    // Analyze specific category feedback
    if (feedback.feedback_category && feedback.rating <= 2) {
      const categoryScore = this.getCategoryScore(qualityDecision, feedback.feedback_category)
      if (categoryScore > 70) {
        discrepancies.push({
          area: feedback.feedback_category,
          ai_assessment: categoryScore,
          human_assessment: feedback.rating * 20,
          difference_score: Math.abs(categoryScore - (feedback.rating * 20)),
          learning_opportunity: `AI overestimated ${feedback.feedback_category}`
        })
      }
    }

    // Generate recommended adjustments based on discrepancies
    const recommendedAdjustments = this.generateAdjustmentsFromDiscrepancies(discrepancies, feedback)

    return {
      content_id: feedback.content_id,
      ai_predictions: qualityDecision.quality_scores,
      human_decisions: {
        rating: feedback.rating,
        category: feedback.feedback_category,
        issues: feedback.specific_issues,
        suggestions: feedback.suggested_improvements
      },
      discrepancies,
      feedback_summary: this.generateFeedbackSummary(feedback, discrepancies),
      recommended_adjustments: recommendedAdjustments
    }
  }

  private getCategoryScore(qualityDecision: any, category: string): number {
    const scores = qualityDecision.quality_scores
    switch (category) {
      case 'grammar':
        return scores.assessment?.grammar_score || 0
      case 'content_quality':
        return scores.assessment?.content_quality || 0
      case 'cultural_sensitivity':
        return scores.assessment?.cultural_sensitivity_score || 0
      case 'fact_accuracy':
        return scores.assessment?.factual_accuracy_score || 0
      case 'bias':
        return scores.moderation?.bias_analysis?.overall_bias_score || 0
      case 'readability':
        return scores.assessment?.readability_score || 0
      case 'seo':
        return scores.assessment?.seo_score || 0
      default:
        return scores.assessment?.overall_score || 0
    }
  }

  private generateAdjustmentsFromDiscrepancies(discrepancies: any[], feedback: FeedbackRecord): QualityRuleAdjustment[] {
    const adjustments: QualityRuleAdjustment[] = []

    for (const discrepancy of discrepancies) {
      if (discrepancy.difference_score > 30) {
        adjustments.push({
          rule_id: `${discrepancy.area}_threshold`,
          adjustment_type: 'threshold_change',
          current_value: discrepancy.ai_assessment,
          suggested_value: Math.max(50, discrepancy.ai_assessment - 15),
          confidence: Math.min(0.9, discrepancy.difference_score / 100),
          reasoning: `Human feedback indicates AI overestimated ${discrepancy.area}`,
          expected_impact: 'Reduce false positives in quality assessment'
        })
      }
    }

    return adjustments
  }

  private generateFeedbackSummary(feedback: FeedbackRecord, discrepancies: any[]): string {
    let summary = `User provided ${feedback.rating}/5 rating for ${feedback.feedback_category}`
    
    if (feedback.specific_issues.length > 0) {
      summary += `. Issues identified: ${feedback.specific_issues.join(', ')}`
    }

    if (discrepancies.length > 0) {
      summary += `. AI assessment discrepancies found in: ${discrepancies.map(d => d.area).join(', ')}`
    }

    return summary
  }

  private async updateRulesFromFeedback(feedback: FeedbackRecord, analysis: ContentAnalysisReport): Promise<void> {
    if (analysis.recommended_adjustments.length > 0) {
      // Only apply high-confidence adjustments automatically
      const highConfidenceAdjustments = analysis.recommended_adjustments.filter(
        adj => adj.confidence >= this.LEARNING_THRESHOLDS.adjustment_confidence_threshold
      )

      if (highConfidenceAdjustments.length > 0) {
        await this.adjustQualityThresholds(highConfidenceAdjustments, 'system_learning')
      }
    }
  }

  private async detectApprovalPatterns(): Promise<LearningPattern[]> {
    // Implementation for detecting approval patterns
    // This would analyze successful approvals to find common characteristics
    return []
  }

  private async detectRejectionPatterns(): Promise<LearningPattern[]> {
    // Implementation for detecting rejection patterns
    // This would analyze rejected content to find common issues
    return []
  }

  private async detectQualityCorrelations(): Promise<LearningPattern[]> {
    // Implementation for detecting quality correlations
    // This would find relationships between different quality metrics
    return []
  }

  private async detectBiasPatterns(): Promise<LearningPattern[]> {
    // Implementation for detecting bias patterns
    // This would identify recurring bias issues
    return []
  }

  private async detectCulturalPatterns(): Promise<LearningPattern[]> {
    // Implementation for detecting cultural sensitivity patterns
    // This would identify cultural issues specific to UAE context
    return []
  }

  private async storeLearningPattern(pattern: LearningPattern): Promise<void> {
    await supabase.from('learning_patterns').upsert(pattern)
  }

  private groupDecisionsByAgentAndType(decisions: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()

    for (const decision of decisions) {
      const agentId = decision.content?.ai_agent_id || 'undefined'
      const contentType = decision.content?.content_type || 'unknown'
      const key = `${agentId}|${contentType}`

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(decision)
    }

    return grouped
  }

  private calculateAccuracyScore(decisions: any[]): number {
    const decisionsWithFeedback = decisions.filter(d => d.feedback && d.feedback.length > 0)
    if (decisionsWithFeedback.length === 0) return 0

    const correctDecisions = decisionsWithFeedback.filter(d => 
      d.feedback.some((f: any) => f.ai_decision_correct)
    ).length

    return (correctDecisions / decisionsWithFeedback.length) * 100
  }

  private calculateFalsePositiveRate(decisions: any[]): number {
    const autoApproved = decisions.filter(d => d.decision === 'auto_approve')
    const falsePositives = autoApproved.filter(d => 
      d.feedback?.some((f: any) => !f.ai_decision_correct)
    ).length

    return autoApproved.length > 0 ? (falsePositives / autoApproved.length) * 100 : 0
  }

  private calculateFalseNegativeRate(decisions: any[]): number {
    const autoRejected = decisions.filter(d => d.decision === 'auto_reject')
    const falseNegatives = autoRejected.filter(d => 
      d.feedback?.some((f: any) => !f.ai_decision_correct)
    ).length

    return autoRejected.length > 0 ? (falseNegatives / autoRejected.length) * 100 : 0
  }

  private extractCommonIssues(decisions: any[]): Array<{ issue: string; frequency: number }> {
    const issueCount = new Map<string, number>()

    for (const decision of decisions) {
      for (const warning of decision.warnings || []) {
        issueCount.set(warning, (issueCount.get(warning) || 0) + 1)
      }
    }

    return Array.from(issueCount.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  private async calculateImprovementTrends(agentId: string, contentType: string, timeframe: string): Promise<Array<{ metric: string; trend: 'improving' | 'declining' | 'stable'; change_rate: number }>> {
    // This would compare current metrics with previous periods
    // For now, return mock data
    return [
      { metric: 'accuracy_score', trend: 'improving', change_rate: 5.2 },
      { metric: 'false_positive_rate', trend: 'declining', change_rate: -2.1 },
      { metric: 'average_quality_score', trend: 'stable', change_rate: 0.8 }
    ]
  }

  private async adjustThreshold(adjustment: QualityRuleAdjustment): Promise<void> {
    // Implementation for adjusting quality thresholds
  }

  private async adjustWeight(adjustment: QualityRuleAdjustment): Promise<void> {
    // Implementation for adjusting rule weights
  }

  private async modifyCondition(adjustment: QualityRuleAdjustment): Promise<void> {
    // Implementation for modifying rule conditions
  }

  private async createNewRule(adjustment: QualityRuleAdjustment): Promise<void> {
    // Implementation for creating new rules
  }

  private async deactivateRule(adjustment: QualityRuleAdjustment): Promise<void> {
    // Implementation for deactivating rules
  }

  private async logAdjustment(adjustment: QualityRuleAdjustment, approvedBy: string): Promise<void> {
    await supabase.from('quality_adjustments').insert({
      rule_id: adjustment.rule_id,
      adjustment_type: adjustment.adjustment_type,
      previous_value: adjustment.current_value,
      new_value: adjustment.suggested_value,
      confidence: adjustment.confidence,
      reasoning: adjustment.reasoning,
      approved_by: approvedBy,
      applied_at: new Date().toISOString()
    })
  }

  private async applySuggestion(suggestion: ImprovementSuggestion): Promise<void> {
    // Implementation for applying improvement suggestions
  }

  private calculateOverallTrends(decisions: any[], feedback: any[]): any {
    // Implementation for calculating overall quality trends
    return {
      quality_score_trend: 'improving',
      accuracy_trend: 'stable',
      user_satisfaction_trend: 'improving'
    }
  }

  private calculateContentTypeTrends(decisions: any[]): any[] {
    // Implementation for calculating content type specific trends
    return []
  }

  private identifyQualityImprovements(decisions: any[], patterns: any[]): any[] {
    // Implementation for identifying quality improvements
    return []
  }

  private identifyAreasForImprovement(feedback: any[], patterns: any[]): any[] {
    // Implementation for identifying areas needing improvement
    return []
  }

  private async generateImprovementSuggestions(feedback: FeedbackRecord, analysis: ContentAnalysisReport): Promise<void> {
    // Generate and store improvement suggestions based on feedback analysis
    if (analysis.discrepancies.length > 0) {
      const suggestion: Omit<ImprovementSuggestion, 'id' | 'created_at'> = {
        suggestion_type: 'rule_adjustment',
        priority: 'medium',
        description: `Adjust quality assessment based on user feedback for ${feedback.feedback_category}`,
        expected_benefit: 'Improved accuracy in quality assessment',
        implementation_effort: 'low',
        confidence: 0.75,
        supporting_data: analysis,
        estimated_impact: 15,
        status: 'pending'
      }

      await supabase.from('improvement_suggestions').insert({
        ...suggestion,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      })
    }
  }
}

export const learningSystemService = new LearningSystemService()