import { openai, isOpenAIConfigured, safeOpenAICall } from '@/shared/lib/openai'
import { supabase } from '@/shared/lib/supabase'

// UAE-specific content guidelines
const UAE_CONTENT_GUIDELINES = {
  // Based on UAE Cybercrime Law and media regulations
  prohibitedCategories: [
    'hate_speech',
    'violence',
    'terrorism',
    'adult_content',
    'gambling',
    'drugs',
    'political_extremism',
    'religious_offense',
    'misinformation',
    'privacy_violation',
    'copyright_infringement',
    'defamation'
  ],
  
  // Cultural sensitivities specific to UAE
  culturalSensitivities: [
    'religious_content', // Must be respectful
    'political_content', // Must be balanced
    'cultural_criticism', // Must be constructive
    'gender_relations', // Must respect local norms
  ],
  
  // Severity levels for different violations
  severityLevels: {
    critical: ['terrorism', 'hate_speech', 'violence'],
    high: ['adult_content', 'drugs', 'gambling'],
    medium: ['misinformation', 'defamation'],
    low: ['copyright_infringement', 'spam']
  }
}

export interface ModerationResult {
  id: string
  content: string
  userId: string
  timestamp: Date
  flagged: boolean
  categories: string[]
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe'
  scores: Record<string, number>
  action: 'approved' | 'blocked' | 'review' | 'warning'
  reason?: string
  reviewRequired: boolean
}

export interface ContentReport {
  id: string
  contentId: string
  contentType: 'chat' | 'comment' | 'post' | 'profile'
  reporterId: string
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  resolution?: string
}

class ContentModerationService {
  private readonly OPENAI_MODERATION_THRESHOLD = 0.7
  private readonly UAE_CUSTOM_THRESHOLD = 0.6

  async moderateContent(
    content: string,
    userId: string,
    contentType: 'chat' | 'comment' | 'post' | 'profile' = 'chat'
  ): Promise<ModerationResult> {
    try {
      // Step 1: OpenAI Moderation API
      const openAIResult = await this.checkOpenAIModeration(content)
      
      // Step 2: UAE-specific checks
      const uaeChecks = await this.checkUAEGuidelines(content)
      
      // Step 3: Combine results
      const combinedResult = this.combineResults(
        content,
        userId,
        openAIResult,
        uaeChecks
      )
      
      // Step 4: Log the moderation decision
      await this.logModeration(combinedResult, contentType)
      
      // Step 5: Take action if needed
      if (combinedResult.action === 'blocked' || combinedResult.action === 'review') {
        await this.handleViolation(combinedResult, contentType)
      }
      
      return combinedResult
    } catch (error) {
      console.error('Content moderation error:', error)
      // In case of error, flag for manual review
      return this.createReviewResult(content, userId, 'Moderation service error')
    }
  }

  private async checkOpenAIModeration(content: string) {
    if (!isOpenAIConfigured()) {
            return null
    }
    
    try {
      const response = await openai.moderations.create({
        input: content,
      })
      
      return response.results[0]
    } catch (error) {
      console.error('OpenAI moderation error:', error)
      return null
    }
  }

  private async checkUAEGuidelines(content: string): Promise<{
    violations: string[]
    scores: Record<string, number>
  }> {
    const violations: string[] = []
    const scores: Record<string, number> = {}
    
    // Check for UAE-specific content violations
    const contentLower = content.toLowerCase()
    
    // Religious sensitivity check
    const religiousTerms = ['allah', 'prophet', 'quran', 'islam', 'muslim']
    const hasReligiousContent = religiousTerms.some(term => contentLower.includes(term))
    if (hasReligiousContent) {
      // Use AI to check if religious content is respectful
      const isRespectful = await this.checkReligiousRespect(content)
      if (!isRespectful) {
        violations.push('religious_offense')
        scores.religious_offense = 0.9
      }
    }
    
    // Political content check
    const politicalTerms = ['government', 'ruler', 'sheikh', 'ministry', 'law']
    const hasPoliticalContent = politicalTerms.some(term => contentLower.includes(term))
    if (hasPoliticalContent) {
      const isBalanced = await this.checkPoliticalBalance(content)
      if (!isBalanced) {
        violations.push('political_extremism')
        scores.political_extremism = 0.8
      }
    }
    
    // Gambling and alcohol references (regulated in UAE)
    if (/\b(casino|betting|gambling|alcohol|beer|wine|liquor)\b/i.test(content)) {
      violations.push('gambling')
      scores.gambling = 0.7
    }
    
    return { violations, scores }
  }

  private async checkReligiousRespect(content: string): Promise<boolean> {
    // Use AI to determine if religious content is respectful
    if (!isOpenAIConfigured()) {
      return true // Default to respectful if OpenAI not configured
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use 3.5 for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a content moderator checking if religious content is respectful and appropriate for UAE cultural standards. Respond with only "true" if respectful or "false" if disrespectful.'
          },
          {
            role: 'user',
            content: `Is this content respectful of religious beliefs? "${content}"`
          }
        ],
        temperature: 0,
        max_tokens: 10
      })
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() === 'true'
    } catch {
      return true // Default to respectful if check fails
    }
  }

  private async checkPoliticalBalance(content: string): Promise<boolean> {
    // Check if political content is balanced and constructive
    if (!isOpenAIConfigured()) {
      return true // Default to balanced if OpenAI not configured
    }
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use 3.5 for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a content moderator checking if political content is balanced, constructive, and appropriate for UAE media standards. Respond with only "true" if balanced or "false" if extremist or inflammatory.'
          },
          {
            role: 'user',
            content: `Is this political content balanced and constructive? "${content}"`
          }
        ],
        temperature: 0,
        max_tokens: 10
      })
      
      return response.choices[0]?.message?.content?.trim().toLowerCase() === 'true'
    } catch {
      return true // Default to balanced if check fails
    }
  }

  private combineResults(
    content: string,
    userId: string,
    openAIResult: any,
    uaeChecks: { violations: string[], scores: Record<string, number> }
  ): ModerationResult {
    const id = crypto.randomUUID()
    const timestamp = new Date()
    const categories: string[] = []
    const scores: Record<string, number> = { ...uaeChecks.scores }
    
    // Process OpenAI results
    if (openAIResult) {
      const flaggedCategories = Object.entries(openAIResult.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category)
      
      categories.push(...flaggedCategories)
      
      // Add OpenAI scores
      Object.entries(openAIResult.category_scores).forEach(([category, score]) => {
        scores[category] = score as number
      })
    }
    
    // Add UAE violations
    categories.push(...uaeChecks.violations)
    
    // Determine severity
    const severity = this.determineSeverity(categories, scores)
    
    // Determine action
    const action = this.determineAction(severity, categories)
    
    // Check if review is required
    const reviewRequired = action === 'review' || severity === 'high' || severity === 'critical'
    
    return {
      id,
      content,
      userId,
      timestamp,
      flagged: categories.length > 0,
      categories,
      severity,
      scores,
      action,
      reason: categories.join(', '),
      reviewRequired
    }
  }

  private determineSeverity(
    categories: string[],
    scores: Record<string, number>
  ): 'critical' | 'high' | 'medium' | 'low' | 'safe' {
    // Check for critical violations
    if (categories.some(cat => UAE_CONTENT_GUIDELINES.severityLevels.critical.includes(cat))) {
      return 'critical'
    }
    
    // Check for high violations
    if (categories.some(cat => UAE_CONTENT_GUIDELINES.severityLevels.high.includes(cat))) {
      return 'high'
    }
    
    // Check for medium violations
    if (categories.some(cat => UAE_CONTENT_GUIDELINES.severityLevels.medium.includes(cat))) {
      return 'medium'
    }
    
    // Check for low violations
    if (categories.some(cat => UAE_CONTENT_GUIDELINES.severityLevels.low.includes(cat))) {
      return 'low'
    }
    
    // Check scores for borderline cases
    const maxScore = Math.max(...Object.values(scores))
    if (maxScore > this.UAE_CUSTOM_THRESHOLD) {
      return 'medium'
    }
    
    return 'safe'
  }

  private determineAction(
    severity: string,
    categories: string[]
  ): 'approved' | 'blocked' | 'review' | 'warning' {
    switch (severity) {
      case 'critical':
        return 'blocked'
      case 'high':
        return 'blocked'
      case 'medium':
        return 'review'
      case 'low':
        return 'warning'
      case 'safe':
        return 'approved'
      default:
        return 'review'
    }
  }

  private async logModeration(result: ModerationResult, contentType: string) {
    try {
      await supabase.from('content_moderation_logs').insert({
        id: result.id,
        user_id: result.userId,
        content_type: contentType,
        content: result.content,
        flagged: result.flagged,
        categories: result.categories,
        severity: result.severity,
        scores: result.scores,
        action: result.action,
        reason: result.reason,
        review_required: result.reviewRequired,
        created_at: result.timestamp
      })
    } catch (error) {
      console.error('Failed to log moderation:', error)
    }
  }

  private async handleViolation(result: ModerationResult, contentType: string) {
    // Create a moderation queue entry for review
    if (result.reviewRequired) {
      await supabase.from('moderation_queue').insert({
        content_id: result.id,
        content_type: contentType,
        user_id: result.userId,
        severity: result.severity,
        categories: result.categories,
        status: 'pending',
        created_at: result.timestamp
      })
    }
    
    // Track user violations
    await this.trackUserViolation(result.userId, result.severity, result.categories)
    
    // Send notification to user if needed
    if (result.action === 'blocked') {
      await this.notifyUserOfViolation(result.userId, result)
    }
  }

  private async trackUserViolation(userId: string, severity: string, categories: string[]) {
    try {
      // Get existing violation count
      const { data: profile } = await supabase
        .from('profiles')
        .select('violation_count, violation_severity')
        .eq('id', userId)
        .single()
      
      const newCount = (profile?.violation_count || 0) + 1
      const severityScore = this.calculateSeverityScore(severity, profile?.violation_severity)
      
      // Update profile with violation info
      await supabase
        .from('profiles')
        .update({
          violation_count: newCount,
          violation_severity: severityScore,
          last_violation_at: new Date().toISOString(),
          last_violation_categories: categories
        })
        .eq('id', userId)
      
      // Check if user should be suspended
      if (newCount >= 3 || severityScore >= 10) {
        await this.suspendUser(userId, 'Multiple content violations')
      }
    } catch (error) {
      console.error('Failed to track user violation:', error)
    }
  }

  private calculateSeverityScore(
    newSeverity: string,
    existingScore?: number
  ): number {
    const severityPoints = {
      critical: 5,
      high: 3,
      medium: 2,
      low: 1,
      safe: 0
    }
    
    return (existingScore || 0) + (severityPoints[newSeverity as keyof typeof severityPoints] || 0)
  }

  private async suspendUser(userId: string, reason: string) {
    // Implement user suspension logic
    await supabase
      .from('profiles')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: reason
      })
      .eq('id', userId)
  }

  private async notifyUserOfViolation(userId: string, result: ModerationResult) {
    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'content_violation',
      title: 'Content Policy Violation',
      message: `Your content was blocked for violating our community guidelines: ${result.reason}`,
      data: {
        moderationId: result.id,
        categories: result.categories,
        severity: result.severity
      },
      created_at: new Date().toISOString()
    })
  }

  private createReviewResult(
    content: string,
    userId: string,
    reason: string
  ): ModerationResult {
    return {
      id: crypto.randomUUID(),
      content,
      userId,
      timestamp: new Date(),
      flagged: true,
      categories: ['review_required'],
      severity: 'medium',
      scores: {},
      action: 'review',
      reason,
      reviewRequired: true
    }
  }

  // Public method to report content
  async reportContent(
    contentId: string,
    contentType: 'chat' | 'comment' | 'post' | 'profile',
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<ContentReport> {
    const report: ContentReport = {
      id: crypto.randomUUID(),
      contentId,
      contentType,
      reporterId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date()
    }
    
    // Save report to database
    await supabase.from('content_reports').insert({
      id: report.id,
      content_id: contentId,
      content_type: contentType,
      reporter_id: reporterId,
      reason,
      description,
      status: 'pending',
      created_at: report.createdAt
    })
    
    // Add to moderation queue for review
    await supabase.from('moderation_queue').insert({
      content_id: contentId,
      content_type: contentType,
      user_id: reporterId,
      severity: 'medium',
      categories: ['user_report', reason],
      status: 'pending',
      created_at: report.createdAt
    })
    
    return report
  }

  // Get moderation history for a user
  async getUserModerationHistory(userId: string) {
    const { data, error } = await supabase
      .from('content_moderation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data
  }

  // Review queued content (for moderators)
  async reviewContent(
    moderationId: string,
    reviewerId: string,
    decision: 'approve' | 'block' | 'warn',
    notes?: string
  ) {
    // Update moderation queue
    await supabase
      .from('moderation_queue')
      .update({
        status: 'reviewed',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        decision,
        review_notes: notes
      })
      .eq('content_id', moderationId)
    
    // Update moderation log
    await supabase
      .from('content_moderation_logs')
      .update({
        final_action: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', moderationId)
    
    return { success: true }
  }
}

export const contentModerationService = new ContentModerationService()