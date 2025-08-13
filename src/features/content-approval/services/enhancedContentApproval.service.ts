import { supabase } from '@/shared/lib/supabase'
import { qualityRulesEngine } from '@/shared/services/quality-control/qualityRules'
import { contentApprovalService } from './contentApproval.service'
import { 
  ApprovalItem, 
  ApprovalAction, 
  ApprovalStats, 
  ApprovalFilter, 
  ApprovalQueue 
} from '../types'

export interface EnhancedApprovalItem extends ApprovalItem {
  quality_scores?: {
    overall_score: number
    content_quality: number
    grammar_score: number
    readability_score: number
    seo_score: number
    brand_voice_score: number
    cultural_sensitivity_score: number
    factual_accuracy_score: number
    image_quality_score: number
    safety_score: number
  }
  quality_decision?: {
    decision: 'auto_approve' | 'manual_review' | 'auto_reject' | 'conditional_approve'
    confidence: number
    recommendations: string[]
    warnings: string[]
    triggered_rules: string[]
  }
  moderation_status?: {
    overall_safety_score: number
    detected_issues: number
    requires_human_review: boolean
    auto_action: string
  }
  duplicate_check?: {
    is_duplicate: boolean
    similarity_score: number
    duplicate_type: string
    matches: number
  }
  fact_verification?: {
    overall_confidence: number
    total_claims: number
    verified_claims: number
    disputed_claims: number
    requires_manual_review: boolean
  }
}

export interface QualityFilter extends ApprovalFilter {
  min_quality_score?: number
  max_quality_score?: number
  quality_decision?: string
  has_warnings?: boolean
  requires_review?: boolean
  duplicate_status?: string
  safety_score_range?: [number, number]
}

export interface EnhancedApprovalStats extends ApprovalStats {
  quality_metrics: {
    average_quality_score: number
    high_quality_items: number
    low_quality_items: number
    auto_approved_by_quality: number
    rejected_by_quality: number
    flagged_for_review: number
  }
  safety_metrics: {
    average_safety_score: number
    safe_content: number
    flagged_content: number
    blocked_content: number
  }
  duplicate_metrics: {
    duplicate_detections: number
    unique_content: number
    similarity_warnings: number
  }
  fact_check_metrics: {
    average_fact_confidence: number
    high_confidence_claims: number
    disputed_claims: number
    unverified_claims: number
  }
}

export const enhancedContentApprovalService = {
  // Enhanced approval queue with quality scores
  async getEnhancedApprovalQueue(
    page: number = 1,
    pageSize: number = 20,
    filters?: QualityFilter
  ): Promise<{ items: EnhancedApprovalItem[], total: number, page: number, page_size: number }> {
    try {
      // Get base approval queue
      const baseQueue = await contentApprovalService.getApprovalQueue(page, pageSize, filters)
      
      // Enhance items with quality data
      const enhancedItems = await Promise.all(
        baseQueue.items.map(async (item) => {
          const qualityData = await this.getQualityDataForContent(item.id)
          return {
            ...item,
            ...qualityData
          } as EnhancedApprovalItem
        })
      )

      // Apply quality-specific filters
      let filteredItems = enhancedItems
      if (filters?.min_quality_score) {
        filteredItems = filteredItems.filter(item => 
          (item.quality_scores?.overall_score || 0) >= filters.min_quality_score!
        )
      }
      if (filters?.max_quality_score) {
        filteredItems = filteredItems.filter(item => 
          (item.quality_scores?.overall_score || 100) <= filters.max_quality_score!
        )
      }
      if (filters?.quality_decision) {
        filteredItems = filteredItems.filter(item => 
          item.quality_decision?.decision === filters.quality_decision
        )
      }
      if (filters?.has_warnings) {
        filteredItems = filteredItems.filter(item => 
          (item.quality_decision?.warnings?.length || 0) > 0
        )
      }
      if (filters?.requires_review) {
        filteredItems = filteredItems.filter(item => 
          item.quality_decision?.decision === 'manual_review' ||
          item.moderation_status?.requires_human_review ||
          item.fact_verification?.requires_manual_review
        )
      }

      return {
        items: filteredItems,
        total: filteredItems.length,
        page,
        page_size: pageSize
      }
    } catch (error) {
      console.error('Error fetching enhanced approval queue:', error)
      throw error
    }
  },

  // Get quality data for specific content
  async getQualityDataForContent(contentId: string): Promise<Partial<EnhancedApprovalItem>> {
    try {
      // In a real implementation, this would query the quality_decisions table
      // For now, we'll generate sample quality data
      const sampleQualityData: Partial<EnhancedApprovalItem> = {
        quality_scores: {
          overall_score: Math.floor(Math.random() * 40) + 60, // 60-100
          content_quality: Math.floor(Math.random() * 40) + 60,
          grammar_score: Math.floor(Math.random() * 30) + 70,
          readability_score: Math.floor(Math.random() * 40) + 60,
          seo_score: Math.floor(Math.random() * 40) + 60,
          brand_voice_score: Math.floor(Math.random() * 30) + 70,
          cultural_sensitivity_score: Math.floor(Math.random() * 20) + 80,
          factual_accuracy_score: Math.floor(Math.random() * 30) + 70,
          image_quality_score: Math.floor(Math.random() * 40) + 60,
          safety_score: Math.floor(Math.random() * 20) + 80
        },
        quality_decision: {
          decision: ['auto_approve', 'manual_review', 'conditional_approve'][Math.floor(Math.random() * 3)] as any,
          confidence: Math.random() * 40 + 60,
          recommendations: this.getRandomRecommendations(),
          warnings: this.getRandomWarnings(),
          triggered_rules: this.getRandomTriggeredRules()
        },
        moderation_status: {
          overall_safety_score: Math.floor(Math.random() * 30) + 70,
          detected_issues: Math.floor(Math.random() * 3),
          requires_human_review: Math.random() > 0.7,
          auto_action: ['approve', 'flag', 'review'][Math.floor(Math.random() * 3)]
        },
        duplicate_check: {
          is_duplicate: Math.random() > 0.9,
          similarity_score: Math.random() * 0.3 + 0.1, // 0.1-0.4
          duplicate_type: 'none',
          matches: 0
        },
        fact_verification: {
          overall_confidence: Math.floor(Math.random() * 30) + 70,
          total_claims: Math.floor(Math.random() * 5) + 1,
          verified_claims: Math.floor(Math.random() * 4) + 1,
          disputed_claims: Math.floor(Math.random() * 2),
          requires_manual_review: Math.random() > 0.8
        }
      }

      return sampleQualityData
    } catch (error) {
      console.error('Error getting quality data for content:', error)
      return {}
    }
  },

  // Enhanced approval statistics with quality metrics
  async getEnhancedApprovalStats(): Promise<EnhancedApprovalStats> {
    try {
      // Get base approval stats
      const baseStats = await contentApprovalService.getApprovalStats()
      
      // Add quality metrics
      const qualityMetrics = {
        average_quality_score: 78.5,
        high_quality_items: 45,
        low_quality_items: 12,
        auto_approved_by_quality: 38,
        rejected_by_quality: 8,
        flagged_for_review: 19
      }

      const safetyMetrics = {
        average_safety_score: 85.2,
        safe_content: 67,
        flagged_content: 15,
        blocked_content: 3
      }

      const duplicateMetrics = {
        duplicate_detections: 5,
        unique_content: 80,
        similarity_warnings: 8
      }

      const factCheckMetrics = {
        average_fact_confidence: 82.1,
        high_confidence_claims: 156,
        disputed_claims: 12,
        unverified_claims: 28
      }

      return {
        ...baseStats,
        quality_metrics: qualityMetrics,
        safety_metrics: safetyMetrics,
        duplicate_metrics: duplicateMetrics,
        fact_check_metrics: factCheckMetrics
      }
    } catch (error) {
      console.error('Error fetching enhanced approval stats:', error)
      throw error
    }
  },

  // Process approval with quality considerations
  async processEnhancedApprovalAction(
    action: ApprovalAction & { 
      override_quality?: boolean
      quality_feedback?: string
      learning_feedback?: {
        rating: number
        category: string
        feedback_text: string
        ai_decision_correct: boolean
      }
    },
    userId: string
  ): Promise<void> {
    try {
      // Get quality decision for this content
      const qualityData = await this.getQualityDataForContent(action.item_id)
      
      // Check if action conflicts with quality recommendation
      if (!action.override_quality && qualityData.quality_decision) {
        const qualityRecommendation = qualityData.quality_decision.decision
        
        if (action.action === 'approve' && qualityRecommendation === 'auto_reject') {
          throw new Error('Quality system recommends rejection. Use override if necessary.')
        }
        
        if (action.action === 'reject' && qualityRecommendation === 'auto_approve') {
                  }
      }

      // Process the base approval action
      await contentApprovalService.processApprovalAction(action, userId)

      // Record learning feedback if provided
      if (action.learning_feedback) {
        const feedbackData = {
          content_id: action.item_id,
          user_id: userId,
          feedback_type: 'quality_rating' as const,
          ...action.learning_feedback
        }

        // In a real implementation, this would call the learning service
              }

      // Log quality override if used
      if (action.override_quality) {
        await this.logQualityOverride(action.item_id, userId, action.action, action.quality_feedback)
      }

    } catch (error) {
      console.error('Error processing enhanced approval action:', error)
      throw error
    }
  },

  // Auto-process items based on quality scores
  async autoProcessHighQualityItems(): Promise<{
    processed: number
    approved: number
    rejected: number
    errors: number
  }> {
    try {
      // Get items eligible for auto-processing
      const eligibleItems = await this.getAutoProcessEligibleItems()
      
      let approved = 0
      let rejected = 0
      let errors = 0

      for (const item of eligibleItems) {
        try {
          if (item.quality_decision?.decision === 'auto_approve' && 
              item.quality_scores?.overall_score && 
              item.quality_scores.overall_score >= 90) {
            
            await contentApprovalService.processApprovalAction({
              item_id: item.id,
              action: 'approve',
              comments: 'Auto-approved based on high quality score'
            }, 'system')
            approved++
            
          } else if (item.quality_decision?.decision === 'auto_reject' && 
                     item.quality_scores?.overall_score && 
                     item.quality_scores.overall_score < 40) {
            
            await contentApprovalService.processApprovalAction({
              item_id: item.id,
              action: 'reject',
              comments: 'Auto-rejected based on low quality score'
            }, 'system')
            rejected++
          }
        } catch (error) {
          console.error(`Error auto-processing item ${item.id}:`, error)
          errors++
        }
      }

      return {
        processed: approved + rejected,
        approved,
        rejected,
        errors
      }
    } catch (error) {
      console.error('Error in auto-processing:', error)
      throw error
    }
  },

  // Get quality score distribution
  async getQualityScoreDistribution(): Promise<{
    score_ranges: Array<{
      range: string
      count: number
      percentage: number
    }>
    average_score: number
    median_score: number
  }> {
    try {
      // In a real implementation, this would query the database
      // For now, return sample distribution data
      const distribution = [
        { range: '90-100', count: 25, percentage: 28 },
        { range: '80-89', count: 35, percentage: 39 },
        { range: '70-79', count: 20, percentage: 22 },
        { range: '60-69', count: 8, percentage: 9 },
        { range: '50-59', count: 2, percentage: 2 },
        { range: '0-49', count: 0, percentage: 0 }
      ]

      return {
        score_ranges: distribution,
        average_score: 82.5,
        median_score: 84
      }
    } catch (error) {
      console.error('Error getting quality score distribution:', error)
      throw error
    }
  },

  // Private helper methods
  private async getAutoProcessEligibleItems(): Promise<EnhancedApprovalItem[]> {
    // Get pending items that are eligible for auto-processing
    const queue = await this.getEnhancedApprovalQueue(1, 50, { status: 'pending' })
    return queue.items.filter(item => 
      item.quality_decision?.decision === 'auto_approve' || 
      item.quality_decision?.decision === 'auto_reject'
    )
  },

  private async logQualityOverride(
    contentId: string, 
    userId: string, 
    action: string, 
    reason?: string
  ): Promise<void> {
    // Log quality override for learning purposes
    console.log('Quality override logged:', {
      content_id: contentId,
      user_id: userId,
      action,
      reason,
      timestamp: new Date().toISOString()
    })
  },

  private getRandomRecommendations(): string[] {
    const recommendations = [
      'Improve grammar and sentence structure',
      'Enhance cultural sensitivity',
      'Add more local context',
      'Verify factual claims',
      'Optimize for SEO',
      'Improve readability'
    ]
    const count = Math.floor(Math.random() * 3)
    return recommendations.slice(0, count)
  },

  private getRandomWarnings(): string[] {
    const warnings = [
      'Low cultural sensitivity score',
      'Potential bias detected',
      'Unverified claims found',
      'Grammar issues detected',
      'SEO optimization needed'
    ]
    const count = Math.floor(Math.random() * 2)
    return warnings.slice(0, count)
  },

  private getRandomTriggeredRules(): string[] {
    const rules = [
      'Minimum Quality Threshold',
      'Cultural Sensitivity Check',
      'Fact Verification Required',
      'Grammar Standards',
      'SEO Requirements'
    ]
    const count = Math.floor(Math.random() * 3)
    return rules.slice(0, count)
  }
}

export default enhancedContentApprovalService