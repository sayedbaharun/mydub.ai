import { supabase } from '@/shared/lib/supabase'
import { culturalContextService } from './culturalContext.service'

export interface QualityAssessmentResult {
  overall_score: number
  content_quality: number
  grammar_score: number
  readability_score: number
  seo_score: number
  brand_voice_score: number
  cultural_sensitivity_score: number
  factual_accuracy_score: number
  image_quality_score: number
  recommendations: string[]
  warnings: string[]
  auto_approve_eligible: boolean
  manual_review_required: boolean
  details: {
    word_count: number
    sentence_count: number
    paragraph_count: number
    readability_level: string
    seo_keywords: string[]
    brand_voice_issues: string[]
    cultural_concerns: string[]
    grammar_errors: string[]
    fact_check_claims: string[]
  }
}

export interface ContentInput {
  id: string
  title: string
  title_ar?: string
  content: string
  content_ar?: string
  excerpt?: string
  excerpt_ar?: string
  content_type: string
  images?: string[]
  metadata?: any
  author_id?: string
  ai_agent_id?: string
  source_id?: string
}

export interface QualityThresholds {
  content_type: string
  min_overall_score: number
  min_content_quality: number
  min_grammar_score: number
  min_readability_score: number
  min_seo_score: number
  min_brand_voice_score: number
  min_cultural_sensitivity_score: number
  auto_approve_threshold: number
  manual_review_threshold: number
}

export class QualityAssessmentService {
  private readonly UAE_CULTURAL_KEYWORDS = [
    'ramadan', 'eid', 'dubai', 'uae', 'emirates', 'sheikh', 'arab', 'islamic', 'halal', 'mosque',
    'cultural', 'traditional', 'heritage', 'local', 'expatriate', 'resident', 'tourist', 'business'
  ]

  private readonly BRAND_VOICE_KEYWORDS = [
    'mydub', 'dubai', 'uae', 'emirates', 'lifestyle', 'culture', 'modern', 'tradition',
    'innovation', 'luxury', 'authentic', 'vibrant', 'dynamic', 'cosmopolitan'
  ]

  private readonly READABILITY_WEIGHTS = {
    sentence_length: 0.3,
    word_complexity: 0.2,
    paragraph_structure: 0.2,
    transition_words: 0.15,
    active_voice: 0.15
  }

  private readonly SEO_FACTORS = {
    title_length: { min: 30, max: 60 },
    meta_description_length: { min: 120, max: 160 },
    heading_structure: true,
    keyword_density: { min: 0.5, max: 3.0 },
    internal_links: true,
    image_alt_text: true
  }

  async assessContent(content: ContentInput): Promise<QualityAssessmentResult> {
    try {
      // Parallel assessment of different quality dimensions
      const [
        contentQuality,
        grammarScore,
        readabilityScore,
        seoScore,
        brandVoiceScore,
        culturalSensitivityScore,
        factualAccuracyScore,
        imageQualityScore
      ] = await Promise.all([
        this.assessContentQuality(content),
        this.assessGrammar(content),
        this.assessReadability(content),
        this.assessSEO(content),
        this.assessBrandVoice(content),
        this.assessCulturalSensitivity(content),
        this.assessFactualAccuracy(content),
        this.assessImageQuality(content)
      ])

      // Calculate overall score with weights
      const overallScore = this.calculateOverallScore({
        contentQuality,
        grammarScore,
        readabilityScore,
        seoScore,
        brandVoiceScore,
        culturalSensitivityScore,
        factualAccuracyScore,
        imageQualityScore
      })

      // Get quality thresholds for content type
      const thresholds = await this.getQualityThresholds(content.content_type)

      // Generate recommendations and warnings
      const recommendations = this.generateRecommendations(content, {
        contentQuality,
        grammarScore,
        readabilityScore,
        seoScore,
        brandVoiceScore,
        culturalSensitivityScore,
        factualAccuracyScore,
        imageQualityScore
      })

      const warnings = this.generateWarnings(content, {
        contentQuality,
        grammarScore,
        readabilityScore,
        seoScore,
        brandVoiceScore,
        culturalSensitivityScore,
        factualAccuracyScore,
        imageQualityScore
      }, thresholds)

      // Determine approval eligibility
      const autoApproveEligible = overallScore >= thresholds.auto_approve_threshold
      const manualReviewRequired = overallScore < thresholds.manual_review_threshold

      // Get content details
      const details = await this.getContentDetails(content)

      const result: QualityAssessmentResult = {
        overall_score: overallScore,
        content_quality: contentQuality,
        grammar_score: grammarScore,
        readability_score: readabilityScore,
        seo_score: seoScore,
        brand_voice_score: brandVoiceScore,
        cultural_sensitivity_score: culturalSensitivityScore,
        factual_accuracy_score: factualAccuracyScore,
        image_quality_score: imageQualityScore,
        recommendations,
        warnings,
        auto_approve_eligible: autoApproveEligible,
        manual_review_required: manualReviewRequired,
        details
      }

      // Store assessment result
      await this.storeAssessmentResult(content.id, result)

      return result
    } catch (error) {
      console.error('Error in quality assessment:', error)
      throw error
    }
  }

  private async assessContentQuality(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    // Check content length
    const wordCount = this.getWordCount(content.content)
    if (wordCount < 100) {
      score -= 20
      issues.push('Content too short')
    } else if (wordCount > 2000) {
      score -= 10
      issues.push('Content may be too long')
    }

    // Check title quality
    if (!content.title || content.title.length < 10) {
      score -= 15
      issues.push('Title too short or missing')
    }

    // Check excerpt quality
    if (!content.excerpt || content.excerpt.length < 50) {
      score -= 10
      issues.push('Excerpt missing or too short')
    }

    // Check content structure
    const paragraphs = content.content.split('\n\n').filter(p => p.trim().length > 0)
    if (paragraphs.length < 3) {
      score -= 10
      issues.push('Poor paragraph structure')
    }

    // Check for placeholder text
    const placeholderPatterns = [
      /lorem ipsum/i,
      /\[insert.*\]/i,
      /\{.*\}/,
      /placeholder/i,
      /todo/i,
      /xxx/i
    ]
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(content.content)) {
        score -= 25
        issues.push('Placeholder text detected')
        break
      }
    }

    // Check for duplicate content patterns
    const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const duplicateSentences = sentences.filter((sentence, index) => 
      sentences.indexOf(sentence) !== index
    )
    
    if (duplicateSentences.length > 0) {
      score -= 15
      issues.push('Duplicate sentences detected')
    }

    return Math.max(0, Math.min(100, score))
  }

  private async assessGrammar(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    // Basic grammar checks
    const text = content.content

    // Check for common grammar mistakes
    const grammarPatterns = [
      { pattern: /\b(it's|its)\b/gi, rule: 'Possessive its vs contraction it\'s' },
      { pattern: /\b(your|you're)\b/gi, rule: 'Possessive your vs contraction you\'re' },
      { pattern: /\b(there|their|they're)\b/gi, rule: 'There/their/they\'re usage' },
      { pattern: /\b(affect|effect)\b/gi, rule: 'Affect vs effect' },
      { pattern: /\s{2,}/g, rule: 'Multiple spaces' },
      { pattern: /[,;]\s*[A-Z]/g, rule: 'Capitalization after comma/semicolon' },
      { pattern: /\.\s*[a-z]/g, rule: 'Capitalization after period' }
    ]

    for (const { pattern, rule } of grammarPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        score -= Math.min(10, matches.length * 2)
        issues.push(`${rule}: ${matches.length} occurrences`)
      }
    }

    // Check sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length

    if (avgSentenceLength > 25) {
      score -= 10
      issues.push('Sentences too long (average > 25 words)')
    }

    // Check for passive voice overuse
    const passivePatterns = [
      /\b(is|are|was|were|being|been)\s+\w+ed\b/gi,
      /\b(is|are|was|were|being|been)\s+\w+en\b/gi
    ]

    let passiveCount = 0
    for (const pattern of passivePatterns) {
      const matches = text.match(pattern)
      if (matches) passiveCount += matches.length
    }

    const passivePercentage = (passiveCount / sentences.length) * 100
    if (passivePercentage > 25) {
      score -= 15
      issues.push(`Excessive passive voice: ${passivePercentage.toFixed(1)}%`)
    }

    return Math.max(0, Math.min(100, score))
  }

  private async assessReadability(content: ContentInput): Promise<number> {
    const text = content.content
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0)

    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

    // Convert Flesch score to 0-100 scale
    let readabilityScore = Math.max(0, Math.min(100, fleschScore))

    // Adjust for content type
    if (content.content_type === 'news') {
      // News should be more readable
      if (readabilityScore < 60) readabilityScore *= 0.8
    } else if (content.content_type === 'government') {
      // Government content can be more complex
      if (readabilityScore < 50) readabilityScore *= 0.9
    }

    return readabilityScore
  }

  private async assessSEO(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    // Title length check
    if (content.title) {
      const titleLength = content.title.length
      if (titleLength < this.SEO_FACTORS.title_length.min) {
        score -= 15
        issues.push('Title too short for SEO')
      } else if (titleLength > this.SEO_FACTORS.title_length.max) {
        score -= 10
        issues.push('Title too long for SEO')
      }
    }

    // Meta description check
    if (content.excerpt) {
      const excerptLength = content.excerpt.length
      if (excerptLength < this.SEO_FACTORS.meta_description_length.min) {
        score -= 10
        issues.push('Meta description too short')
      } else if (excerptLength > this.SEO_FACTORS.meta_description_length.max) {
        score -= 5
        issues.push('Meta description too long')
      }
    } else {
      score -= 15
      issues.push('Meta description missing')
    }

    // Heading structure check
    const headingPattern = /^#{1,6}\s+.+$/gm
    const headings = content.content.match(headingPattern)
    if (!headings || headings.length === 0) {
      score -= 10
      issues.push('No headings found')
    }

    // Keyword density check (basic)
    const keywords = this.extractKeywords(content.content)
    if (keywords.length === 0) {
      score -= 10
      issues.push('No clear keywords identified')
    }

    // Image alt text check
    if (content.images && content.images.length > 0) {
      // This would need integration with actual image metadata
      // For now, assume images need alt text
      score -= 5
      issues.push('Verify image alt text')
    }

    return Math.max(0, Math.min(100, score))
  }

  private async assessBrandVoice(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    const text = content.content.toLowerCase()
    const title = content.title?.toLowerCase() || ''

    // Check for brand voice keywords
    const brandKeywordCount = this.BRAND_VOICE_KEYWORDS.filter(keyword => 
      text.includes(keyword) || title.includes(keyword)
    ).length

    if (brandKeywordCount === 0) {
      score -= 20
      issues.push('No brand voice keywords found')
    } else if (brandKeywordCount < 3) {
      score -= 10
      issues.push('Limited brand voice alignment')
    }

    // Check tone consistency
    const positiveToneWords = ['amazing', 'excellent', 'wonderful', 'fantastic', 'great', 'vibrant', 'exciting']
    const negativeToneWords = ['terrible', 'awful', 'bad', 'worse', 'disappointing', 'poor']

    const positiveCount = positiveToneWords.filter(word => text.includes(word)).length
    const negativeCount = negativeToneWords.filter(word => text.includes(word)).length

    if (negativeCount > positiveCount) {
      score -= 15
      issues.push('Tone may be too negative for brand voice')
    }

    // Check for inappropriate language
    const inappropriateWords = ['hate', 'stupid', 'ridiculous', 'awful', 'terrible']
    const inappropriateCount = inappropriateWords.filter(word => text.includes(word)).length

    if (inappropriateCount > 0) {
      score -= 20
      issues.push('Potentially inappropriate language detected')
    }

    return Math.max(0, Math.min(100, score))
  }

  private async assessCulturalSensitivity(content: ContentInput): Promise<number> {
    try {
      // Use the specialized cultural context service for comprehensive assessment
      const culturalAssessment = await culturalContextService.assessCulturalSensitivity({
        title: content.title,
        content: content.content,
        content_type: content.content_type,
        target_audience: content.target_audience,
        publication_context: content.publication_context
      })

      // Store detailed cultural assessment for reference
      this.storeCulturalAssessment(content.id, culturalAssessment)

      return culturalAssessment.overall_score
    } catch (error) {
      console.error('Error in cultural sensitivity assessment:', error)
      
      // Fallback to basic assessment
      return this.basicCulturalSensitivityCheck(content)
    }
  }

  private basicCulturalSensitivityCheck(content: ContentInput): number {
    let score = 100

    const text = content.content.toLowerCase()
    const title = content.title?.toLowerCase() || ''

    // Check for cultural awareness
    const culturalKeywordCount = this.UAE_CULTURAL_KEYWORDS.filter(keyword => 
      text.includes(keyword) || title.includes(keyword)
    ).length

    // Positive: content shows cultural awareness
    if (culturalKeywordCount > 0) {
      score += 5 // Bonus for cultural relevance
    }

    // Check for potentially insensitive terms
    const sensitiveTerms = [
      'backward', 'primitive', 'weird', 'strange', 'odd', 'bizarre',
      'foreign', 'alien', 'exotic' // when used inappropriately
    ]

    const sensitiveCount = sensitiveTerms.filter(term => text.includes(term)).length
    if (sensitiveCount > 0) {
      score -= 25
    }

    // Check for religious sensitivity
    const religiousTerms = ['islam', 'muslim', 'ramadan', 'eid', 'hajj', 'mosque', 'prayer']
    const religiousCount = religiousTerms.filter(term => text.includes(term)).length

    if (religiousCount > 0) {
      // Check if religious terms are used respectfully
      const respectfulContext = text.includes('respect') || text.includes('honor') || text.includes('tradition')
      if (!respectfulContext) {
        score -= 10
      }
    }

    // Check for gender sensitivity
    const genderTerms = ['ladies', 'gentlemen', 'guys', 'girls', 'boys']
    const genderCount = genderTerms.filter(term => text.includes(term)).length

    if (genderCount > 0) {
      score -= 5
    }

    return Math.max(0, Math.min(100, score))
  }

  private async storeCulturalAssessment(contentId: string, assessment: any): Promise<void> {
    try {
      await supabase.from('cultural_assessments').upsert({
        content_id: contentId,
        overall_score: assessment.overall_score,
        cultural_awareness: assessment.cultural_awareness,
        religious_sensitivity: assessment.religious_sensitivity,
        local_relevance: assessment.local_relevance,
        language_appropriateness: assessment.language_appropriateness,
        social_sensitivity: assessment.social_sensitivity,
        business_appropriateness: assessment.business_appropriateness,
        identified_issues: assessment.identified_issues,
        recommendations: assessment.recommendations,
        compliance_level: assessment.compliance_level,
        assessed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error storing cultural assessment:', error)
    }
  }

  private async assessFactualAccuracy(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    const text = content.content

    // Check for factual claim patterns
    const factualPatterns = [
      /\b\d+%\b/g, // Percentages
      /\b\d+\s*(million|billion|thousand)\b/gi, // Large numbers
      /\bin\s+\d{4}\b/g, // Years
      /\b(according to|study shows|research indicates|data suggests)\b/gi, // Claim indicators
      /\b(proved|proven|confirmed|established)\b/gi, // Strong claims
      /\b(always|never|all|none|every|completely)\b/gi // Absolute statements
    ]

    let factualClaimCount = 0
    for (const pattern of factualPatterns) {
      const matches = text.match(pattern)
      if (matches) factualClaimCount += matches.length
    }

    // More claims = higher risk, lower initial score
    if (factualClaimCount > 10) {
      score -= 20
      issues.push('High number of factual claims require verification')
    } else if (factualClaimCount > 5) {
      score -= 10
      issues.push('Multiple factual claims require verification')
    }

    // Check for sources/citations
    const sourcePatterns = [
      /\b(source:|according to|via|from)\b/gi,
      /\bhttps?:\/\/\S+\b/g,
      /\b\w+\.com\b/g
    ]

    let sourceCount = 0
    for (const pattern of sourcePatterns) {
      const matches = text.match(pattern)
      if (matches) sourceCount += matches.length
    }

    if (factualClaimCount > 0 && sourceCount === 0) {
      score -= 15
      issues.push('Factual claims without sources')
    }

    // Check for outdated information patterns
    const outdatedPatterns = [
      /\b(last year|recently|soon|upcoming)\b/gi,
      /\b(current|today|now|this year)\b/gi
    ]

    let outdatedRiskCount = 0
    for (const pattern of outdatedPatterns) {
      const matches = text.match(pattern)
      if (matches) outdatedRiskCount += matches.length
    }

    if (outdatedRiskCount > 3) {
      score -= 10
      issues.push('Time-sensitive content may become outdated')
    }

    return Math.max(0, Math.min(100, score))
  }

  private async assessImageQuality(content: ContentInput): Promise<number> {
    let score = 100
    const issues: string[] = []

    if (!content.images || content.images.length === 0) {
      return 80 // Neutral score for no images
    }

    // Basic image quality checks
    // This would integrate with actual image analysis APIs
    // For now, provide basic scoring based on presence and count

    const imageCount = content.images.length
    const contentLength = content.content.length

    // Check image-to-content ratio
    const wordsPerImage = this.getWordCount(content.content) / imageCount
    
    if (wordsPerImage < 50) {
      score -= 10
      issues.push('Too many images relative to content')
    } else if (wordsPerImage > 500) {
      score -= 5
      issues.push('Consider adding more images')
    }

    // Check for image diversity (placeholder logic)
    // In real implementation, this would analyze image content
    if (imageCount > 3) {
      score += 5 // Bonus for multiple images
    }

    return Math.max(0, Math.min(100, score))
  }

  private calculateOverallScore(scores: {
    contentQuality: number
    grammarScore: number
    readabilityScore: number
    seoScore: number
    brandVoiceScore: number
    culturalSensitivityScore: number
    factualAccuracyScore: number
    imageQualityScore: number
  }): number {
    const weights = {
      contentQuality: 0.25,
      grammarScore: 0.15,
      readabilityScore: 0.15,
      seoScore: 0.15,
      brandVoiceScore: 0.10,
      culturalSensitivityScore: 0.10,
      factualAccuracyScore: 0.05,
      imageQualityScore: 0.05
    }

    return Math.round(
      scores.contentQuality * weights.contentQuality +
      scores.grammarScore * weights.grammarScore +
      scores.readabilityScore * weights.readabilityScore +
      scores.seoScore * weights.seoScore +
      scores.brandVoiceScore * weights.brandVoiceScore +
      scores.culturalSensitivityScore * weights.culturalSensitivityScore +
      scores.factualAccuracyScore * weights.factualAccuracyScore +
      scores.imageQualityScore * weights.imageQualityScore
    )
  }

  private generateRecommendations(content: ContentInput, scores: any): string[] {
    const recommendations: string[] = []

    if (scores.contentQuality < 70) {
      recommendations.push('Improve content structure and depth')
    }
    if (scores.grammarScore < 80) {
      recommendations.push('Review grammar and sentence structure')
    }
    if (scores.readabilityScore < 60) {
      recommendations.push('Simplify language for better readability')
    }
    if (scores.seoScore < 70) {
      recommendations.push('Optimize title, meta description, and headings')
    }
    if (scores.brandVoiceScore < 75) {
      recommendations.push('Align content with MyDub brand voice')
    }
    if (scores.culturalSensitivityScore < 85) {
      recommendations.push('Review cultural sensitivity and local context')
    }
    if (scores.factualAccuracyScore < 80) {
      recommendations.push('Verify factual claims and add sources')
    }
    if (scores.imageQualityScore < 70) {
      recommendations.push('Improve image quality and relevance')
    }

    return recommendations
  }

  private generateWarnings(content: ContentInput, scores: any, thresholds: QualityThresholds): string[] {
    const warnings: string[] = []

    if (scores.contentQuality < thresholds.min_content_quality) {
      warnings.push('Content quality below minimum threshold')
    }
    if (scores.grammarScore < thresholds.min_grammar_score) {
      warnings.push('Grammar score below minimum threshold')
    }
    if (scores.culturalSensitivityScore < thresholds.min_cultural_sensitivity_score) {
      warnings.push('Cultural sensitivity concerns detected')
    }
    if (scores.factualAccuracyScore < 60) {
      warnings.push('High risk of factual inaccuracy')
    }

    return warnings
  }

  private async getContentDetails(content: ContentInput): Promise<any> {
    const text = content.content
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)

    return {
      word_count: words.length,
      sentence_count: sentences.length,
      paragraph_count: paragraphs.length,
      readability_level: this.getReadabilityLevel(content),
      seo_keywords: this.extractKeywords(text),
      brand_voice_issues: [],
      cultural_concerns: [],
      grammar_errors: [],
      fact_check_claims: this.extractFactualClaims(text)
    }
  }

  private async getQualityThresholds(contentType: string): Promise<QualityThresholds> {
    // Try to get from database first
    const { data } = await supabase
      .from('quality_thresholds')
      .select('*')
      .eq('content_type', contentType)
      .single()

    if (data) {
      return data
    }

    // Default thresholds
    const defaultThresholds: Record<string, Partial<QualityThresholds>> = {
      news: {
        min_overall_score: 75,
        min_content_quality: 70,
        min_grammar_score: 80,
        min_readability_score: 60,
        min_seo_score: 70,
        min_brand_voice_score: 75,
        min_cultural_sensitivity_score: 85,
        auto_approve_threshold: 85,
        manual_review_threshold: 60
      },
      tourism: {
        min_overall_score: 80,
        min_content_quality: 75,
        min_grammar_score: 85,
        min_readability_score: 70,
        min_seo_score: 80,
        min_brand_voice_score: 80,
        min_cultural_sensitivity_score: 90,
        auto_approve_threshold: 90,
        manual_review_threshold: 70
      },
      government: {
        min_overall_score: 85,
        min_content_quality: 80,
        min_grammar_score: 90,
        min_readability_score: 50,
        min_seo_score: 75,
        min_brand_voice_score: 70,
        min_cultural_sensitivity_score: 95,
        auto_approve_threshold: 95,
        manual_review_threshold: 80
      }
    }

    return {
      content_type: contentType,
      ...defaultThresholds[contentType] || defaultThresholds.news
    } as QualityThresholds
  }

  private async storeAssessmentResult(contentId: string, result: QualityAssessmentResult): Promise<void> {
    await supabase.from('quality_assessments').upsert({
      content_id: contentId,
      overall_score: result.overall_score,
      content_quality: result.content_quality,
      grammar_score: result.grammar_score,
      readability_score: result.readability_score,
      seo_score: result.seo_score,
      brand_voice_score: result.brand_voice_score,
      cultural_sensitivity_score: result.cultural_sensitivity_score,
      factual_accuracy_score: result.factual_accuracy_score,
      image_quality_score: result.image_quality_score,
      recommendations: result.recommendations,
      warnings: result.warnings,
      auto_approve_eligible: result.auto_approve_eligible,
      manual_review_required: result.manual_review_required,
      assessment_details: result.details,
      assessed_at: new Date().toISOString()
    })
  }

  // Helper methods
  private getWordCount(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those']
    
    const keywords = words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private extractFactualClaims(text: string): string[] {
    const claims: string[] = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    for (const sentence of sentences) {
      // Check for factual claim patterns
      if (
        /\b\d+%\b/.test(sentence) ||
        /\b\d+\s*(million|billion|thousand)\b/i.test(sentence) ||
        /\b(according to|study shows|research indicates|data suggests)\b/i.test(sentence) ||
        /\b(proved|proven|confirmed|established)\b/i.test(sentence)
      ) {
        claims.push(sentence.trim())
      }
    }

    return claims
  }

  private getReadabilityLevel(content: ContentInput): string {
    const text = content.content
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0)

    const avgSentenceLength = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

    if (fleschScore >= 90) return 'Very Easy'
    if (fleschScore >= 80) return 'Easy'
    if (fleschScore >= 70) return 'Fairly Easy'
    if (fleschScore >= 60) return 'Standard'
    if (fleschScore >= 50) return 'Fairly Difficult'
    if (fleschScore >= 30) return 'Difficult'
    return 'Very Difficult'
  }
}

export const qualityAssessmentService = new QualityAssessmentService()