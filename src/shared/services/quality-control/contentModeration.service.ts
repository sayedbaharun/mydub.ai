import { supabase } from '@/shared/lib/supabase'

export interface ContentModerationResult {
  overall_safety_score: number
  moderation_status: 'safe' | 'needs_review' | 'unsafe' | 'blocked'
  detected_issues: ModerationIssue[]
  cultural_sensitivity_score: number
  bias_analysis: BiasAnalysis
  legal_compliance: LegalCompliance
  recommendations: string[]
  warnings: string[]
  requires_human_review: boolean
  auto_action: 'approve' | 'reject' | 'flag' | 'none'
}

export interface ModerationIssue {
  id: string
  issue_type: 'inappropriate_content' | 'hate_speech' | 'harassment' | 'violence' | 'adult_content' | 'spam' | 'misinformation' | 'cultural_insensitivity' | 'bias' | 'legal_concern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  location: string
  flagged_text: string
  context: string
  suggested_action: string
}

export interface BiasAnalysis {
  overall_bias_score: number
  detected_biases: DetectedBias[]
  demographic_representation: DemographicAnalysis
  language_bias: LanguageBias
  cultural_bias: CulturalBias
}

export interface DetectedBias {
  bias_type: 'gender' | 'age' | 'race' | 'religion' | 'nationality' | 'socioeconomic' | 'political' | 'cultural'
  confidence: number
  examples: string[]
  severity: 'low' | 'medium' | 'high'
  suggested_corrections: string[]
}

export interface DemographicAnalysis {
  gender_balance: number
  age_representation: string[]
  cultural_groups_mentioned: string[]
  representation_score: number
  inclusive_language_score: number
}

export interface LanguageBias {
  loaded_language_count: number
  emotional_manipulation_score: number
  objectivity_score: number
  examples: string[]
}

export interface CulturalBias {
  cultural_sensitivity_score: number
  stereotyping_detected: boolean
  local_context_awareness: number
  respectful_representation: number
  issues: string[]
}

export interface LegalCompliance {
  overall_compliance_score: number
  uae_law_compliance: boolean
  privacy_compliance: boolean
  copyright_concerns: boolean
  defamation_risk: boolean
  regulatory_compliance: boolean
  compliance_issues: string[]
  legal_recommendations: string[]
}

export interface ModerationRule {
  id: string
  rule_type: 'content_filter' | 'keyword_filter' | 'pattern_match' | 'ml_classification' | 'cultural_rule' | 'legal_rule'
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'flag' | 'review' | 'reject' | 'auto_correct'
  patterns: string[]
  whitelist_exceptions: string[]
  active: boolean
  content_types: string[]
  geographic_scope: string[]
}

export class ContentModerationService {
  private readonly INAPPROPRIATE_CONTENT_PATTERNS = [
    // Violence and harm
    { pattern: /\b(kill|murder|death|violence|harm|hurt|attack|assault|weapon|gun|knife|bomb|terror|threat)\b/gi, severity: 'high' as const },
    
    // Adult content
    { pattern: /\b(sex|sexual|nude|naked|porn|adult|intimate|erotic)\b/gi, severity: 'medium' as const },
    
    // Hate speech
    { pattern: /\b(hate|racist|discrimination|prejudice|bigot|supremacist)\b/gi, severity: 'high' as const },
    
    // Harassment
    { pattern: /\b(bully|harassment|abuse|victim|target|stalk|threaten)\b/gi, severity: 'medium' as const },
    
    // Profanity (mild examples)
    { pattern: /\b(damn|hell|stupid|idiot|moron|fool)\b/gi, severity: 'low' as const }
  ]

  private readonly CULTURAL_SENSITIVITY_PATTERNS = [
    // Religious sensitivity
    { pattern: /\b(islam|muslim|christian|hindu|jewish|buddhist|religion|faith|belief|worship|prayer|mosque|church|temple)\b/gi, context: 'religious' },
    
    // Cultural terms
    { pattern: /\b(arab|emirati|expatriate|local|foreign|western|eastern|traditional|modern|conservative|liberal)\b/gi, context: 'cultural' },
    
    // Social issues
    { pattern: /\b(gender|women|men|equality|rights|freedom|democracy|politics|government|law|regulation)\b/gi, context: 'social' }
  ]

  private readonly BIAS_INDICATORS = {
    gender: [
      { pattern: /\b(men are|women are|males are|females are)\b/gi, type: 'generalization' },
      { pattern: /\b(manly|feminine|girly|masculine|effeminate)\b/gi, type: 'stereotyping' },
      { pattern: /\b(guys|boys|girls|ladies|gentlemen)\b/gi, type: 'gendered_language' }
    ],
    age: [
      { pattern: /\b(young people|old people|millennials|boomers|seniors|youth)\b/gi, type: 'age_stereotyping' },
      { pattern: /\b(too young|too old|age appropriate)\b/gi, type: 'age_discrimination' }
    ],
    cultural: [
      { pattern: /\b(all Arabs|all Muslims|all Christians|all Hindus|all foreigners|all locals)\b/gi, type: 'cultural_generalization' },
      { pattern: /\b(backward|primitive|modern|advanced|civilized|uncivilized)\b/gi, type: 'cultural_hierarchy' }
    ],
    nationality: [
      { pattern: /\b(Americans always|Indians always|Pakistanis always|Filipinos always|British always)\b/gi, type: 'nationality_stereotyping' }
    ]
  }

  private readonly UAE_LEGAL_CONCERNS = [
    { pattern: /\b(gambling|casino|bet|poker|lottery|alcohol|drinking|drunk|intoxicated)\b/gi, concern: 'regulated_activities' },
    { pattern: /\b(defame|slander|libel|false accusation|fake news|misleading information)\b/gi, concern: 'defamation' },
    { pattern: /\b(protest|demonstration|strike|boycott|opposition|rebel|revolution)\b/gi, concern: 'political_activity' },
    { pattern: /\b(cryptocurrency|bitcoin|trading|investment|forex|binary options)\b/gi, concern: 'financial_regulation' }
  ]

  private readonly LOADED_LANGUAGE_PATTERNS = [
    { pattern: /\b(obviously|clearly|undoubtedly|certainly|definitely|absolutely|without question|everyone knows)\b/gi, type: 'absolute_statements' },
    { pattern: /\b(shocking|outrageous|disgusting|terrible|awful|amazing|incredible|unbelievable)\b/gi, type: 'emotional_manipulation' },
    { pattern: /\b(you should|you must|you need to|you have to|everyone should)\b/gi, type: 'directive_language' }
  ]

  async moderateContent(content: {
    id: string
    title: string
    content: string
    content_type: string
    images?: string[]
    author_id?: string
    target_audience?: string
    geographic_scope?: string
  }): Promise<ContentModerationResult> {
    try {
      // Perform parallel moderation checks
      const [
        inappropriateContent,
        culturalSensitivity,
        biasAnalysis,
        legalCompliance,
        spamDetection
      ] = await Promise.all([
        this.checkInappropriateContent(content),
        this.checkCulturalSensitivity(content),
        this.analyzeBias(content),
        this.checkLegalCompliance(content),
        this.checkSpamPatterns(content)
      ])

      // Combine all detected issues
      const allIssues = [
        ...inappropriateContent,
        ...culturalSensitivity,
        ...biasAnalysis.detected_biases.map(bias => this.biasToModerationIssue(bias)),
        ...legalCompliance.compliance_issues.map(issue => this.legalToModerationIssue(issue)),
        ...spamDetection
      ]

      // Calculate overall safety score
      const overallSafetyScore = this.calculateOverallSafetyScore(allIssues, biasAnalysis, legalCompliance)

      // Determine moderation status
      const moderationStatus = this.determineModerationStatus(overallSafetyScore, allIssues)

      // Generate recommendations and warnings
      const recommendations = this.generateModerationRecommendations(allIssues, biasAnalysis, legalCompliance)
      const warnings = this.generateModerationWarnings(allIssues, biasAnalysis, legalCompliance)

      // Determine if human review is required
      const requiresHumanReview = this.requiresHumanReview(allIssues, overallSafetyScore, biasAnalysis, legalCompliance)

      // Determine auto action
      const autoAction = this.determineAutoAction(moderationStatus, allIssues, overallSafetyScore)

      const result: ContentModerationResult = {
        overall_safety_score: overallSafetyScore,
        moderation_status: moderationStatus,
        detected_issues: allIssues,
        cultural_sensitivity_score: this.calculateCulturalSensitivityScore(culturalSensitivity),
        bias_analysis: biasAnalysis,
        legal_compliance: legalCompliance,
        recommendations,
        warnings,
        requires_human_review: requiresHumanReview,
        auto_action: autoAction
      }

      // Store moderation result
      await this.storeModerationResult(content.id, result)

      return result
    } catch (error) {
      console.error('Error in content moderation:', error)
      throw error
    }
  }

  async checkImageContent(imageUrls: string[]): Promise<{
    is_safe: boolean
    detected_issues: Array<{
      image_url: string
      issues: string[]
      safety_score: number
    }>
  }> {
    try {
      const results = await Promise.all(
        imageUrls.map(async (url) => {
          // In a real implementation, this would use image recognition APIs
          // For now, we'll do basic checks
          const issues = []
          let safetyScore = 100

          // Check image URL for inappropriate content
          if (url.toLowerCase().includes('adult') || url.toLowerCase().includes('explicit')) {
            issues.push('Potentially inappropriate image URL')
            safetyScore -= 50
          }

          // Check file extension
          const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
          const hasValidExtension = validExtensions.some(ext => url.toLowerCase().endsWith(ext))
          
          if (!hasValidExtension) {
            issues.push('Suspicious file type')
            safetyScore -= 20
          }

          return {
            image_url: url,
            issues,
            safety_score: safetyScore
          }
        })
      )

      const overallSafe = results.every(r => r.safety_score >= 70)

      return {
        is_safe: overallSafe,
        detected_issues: results.filter(r => r.issues.length > 0)
      }
    } catch (error) {
      console.error('Error checking image content:', error)
      return { is_safe: false, detected_issues: [] }
    }
  }

  async updateModerationRules(rules: ModerationRule[]): Promise<void> {
    try {
      await supabase.from('moderation_rules').upsert(rules)
    } catch (error) {
      console.error('Error updating moderation rules:', error)
      throw error
    }
  }

  async getModerationRules(contentType?: string): Promise<ModerationRule[]> {
    try {
      let query = supabase.from('moderation_rules').select('*').eq('active', true)

      if (contentType) {
        query = query.contains('content_types', [contentType])
      }

      const { data } = await query
      return data || []
    } catch (error) {
      console.error('Error getting moderation rules:', error)
      return []
    }
  }

  private async checkInappropriateContent(content: any): Promise<ModerationIssue[]> {
    const issues: ModerationIssue[] = []
    const text = `${content.title} ${content.content}`.toLowerCase()

    for (const { pattern, severity } of this.INAPPROPRIATE_CONTENT_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          issues.push({
            id: crypto.randomUUID(),
            issue_type: 'inappropriate_content',
            severity,
            confidence: 0.8,
            description: `Potentially inappropriate content detected: "${match}"`,
            location: 'content_text',
            flagged_text: match,
            context: this.getContext(text, match),
            suggested_action: severity === 'high' ? 'Remove or rephrase' : 'Review and consider alternatives'
          })
        }
      }
    }

    return issues
  }

  private async checkCulturalSensitivity(content: any): Promise<ModerationIssue[]> {
    const issues: ModerationIssue[] = []
    const text = `${content.title} ${content.content}`.toLowerCase()

    for (const { pattern, context } of this.CULTURAL_SENSITIVITY_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          // Check if the usage is respectful
          const contextText = this.getContext(text, match)
          const isRespectful = this.assessRespectfulUsage(contextText, match, context)
          
          if (!isRespectful) {
            issues.push({
              id: crypto.randomUUID(),
              issue_type: 'cultural_insensitivity',
              severity: 'medium',
              confidence: 0.7,
              description: `Cultural sensitivity concern in ${context} context: "${match}"`,
              location: 'content_text',
              flagged_text: match,
              context: contextText,
              suggested_action: 'Review for cultural sensitivity and respectful representation'
            })
          }
        }
      }
    }

    return issues
  }

  private async analyzeBias(content: any): Promise<BiasAnalysis> {
    const text = `${content.title} ${content.content}`.toLowerCase()
    const detectedBiases: DetectedBias[] = []

    // Check for different types of bias
    for (const [biasType, indicators] of Object.entries(this.BIAS_INDICATORS)) {
      for (const indicator of indicators) {
        const matches = text.match(indicator.pattern)
        if (matches) {
          const examples = matches.slice(0, 3) // Limit examples
          detectedBiases.push({
            bias_type: biasType as DetectedBias['bias_type'],
            confidence: 0.7,
            examples,
            severity: 'medium',
            suggested_corrections: this.generateBiasCorrections(biasType, indicator.type, examples)
          })
        }
      }
    }

    // Analyze demographic representation
    const demographicAnalysis = this.analyzeDemographicRepresentation(content)

    // Analyze language bias
    const languageBias = this.analyzeLanguageBias(content)

    // Analyze cultural bias
    const culturalBias = this.analyzeCulturalBias(content)

    // Calculate overall bias score
    const overallBiasScore = this.calculateOverallBiasScore(detectedBiases, demographicAnalysis, languageBias, culturalBias)

    return {
      overall_bias_score: overallBiasScore,
      detected_biases: detectedBiases,
      demographic_representation: demographicAnalysis,
      language_bias: languageBias,
      cultural_bias: culturalBias
    }
  }

  private async checkLegalCompliance(content: any): Promise<LegalCompliance> {
    const text = `${content.title} ${content.content}`.toLowerCase()
    const complianceIssues: string[] = []

    // Check UAE-specific legal concerns
    for (const { pattern, concern } of this.UAE_LEGAL_CONCERNS) {
      const matches = text.match(pattern)
      if (matches) {
        complianceIssues.push(`${concern}: ${matches.join(', ')}`)
      }
    }

    // Check for potential defamation
    const defamationRisk = this.checkDefamationRisk(content)

    // Check for privacy concerns
    const privacyCompliance = this.checkPrivacyCompliance(content)

    // Check for copyright concerns
    const copyrightConcerns = this.checkCopyrightConcerns(content)

    const overallComplianceScore = this.calculateComplianceScore(complianceIssues, defamationRisk, privacyCompliance, copyrightConcerns)

    return {
      overall_compliance_score: overallComplianceScore,
      uae_law_compliance: complianceIssues.length === 0,
      privacy_compliance: privacyCompliance,
      copyright_concerns: copyrightConcerns,
      defamation_risk: defamationRisk,
      regulatory_compliance: overallComplianceScore >= 80,
      compliance_issues: complianceIssues,
      legal_recommendations: this.generateLegalRecommendations(complianceIssues, defamationRisk, privacyCompliance, copyrightConcerns)
    }
  }

  private async checkSpamPatterns(content: any): Promise<ModerationIssue[]> {
    const issues: ModerationIssue[] = []
    const text = content.content

    // Check for excessive repetition
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const duplicateSentences = sentences.filter((sentence, index) => 
      sentences.indexOf(sentence) !== index
    )

    if (duplicateSentences.length > 2) {
      issues.push({
        id: crypto.randomUUID(),
        issue_type: 'spam',
        severity: 'medium',
        confidence: 0.8,
        description: 'Excessive repetition detected',
        location: 'content_text',
        flagged_text: duplicateSentences.join(', '),
        context: 'Multiple duplicate sentences',
        suggested_action: 'Remove duplicate content'
      })
    }

    // Check for excessive links
    const linkPattern = /https?:\/\/[^\s]+/g
    const links = text.match(linkPattern)
    if (links && links.length > 5) {
      issues.push({
        id: crypto.randomUUID(),
        issue_type: 'spam',
        severity: 'medium',
        confidence: 0.9,
        description: 'Excessive links detected',
        location: 'content_text',
        flagged_text: links.slice(0, 3).join(', '),
        context: `${links.length} links found`,
        suggested_action: 'Reduce number of links'
      })
    }

    // Check for excessive capitalization
    const caps = text.match(/[A-Z]{5,}/g)
    if (caps && caps.length > 3) {
      issues.push({
        id: crypto.randomUUID(),
        issue_type: 'spam',
        severity: 'low',
        confidence: 0.7,
        description: 'Excessive capitalization detected',
        location: 'content_text',
        flagged_text: caps.slice(0, 3).join(', '),
        context: 'Multiple instances of excessive caps',
        suggested_action: 'Use normal capitalization'
      })
    }

    return issues
  }

  private getContext(text: string, match: string): string {
    const index = text.indexOf(match.toLowerCase())
    const start = Math.max(0, index - 50)
    const end = Math.min(text.length, index + match.length + 50)
    return text.substring(start, end)
  }

  private assessRespectfulUsage(contextText: string, match: string, context: string): boolean {
    const respectfulIndicators = ['respect', 'honor', 'tradition', 'culture', 'heritage', 'sacred', 'important', 'valuable']
    const disrespectfulIndicators = ['weird', 'strange', 'backward', 'primitive', 'outdated', 'ridiculous']

    const hasRespectfulContext = respectfulIndicators.some(indicator => 
      contextText.includes(indicator)
    )
    const hasDisrespectfulContext = disrespectfulIndicators.some(indicator => 
      contextText.includes(indicator)
    )

    return hasRespectfulContext || !hasDisrespectfulContext
  }

  private generateBiasCorrections(biasType: string, indicatorType: string, examples: string[]): string[] {
    const corrections: string[] = []

    switch (biasType) {
      case 'gender':
        corrections.push('Use gender-neutral language where possible')
        corrections.push('Avoid generalizations about gender')
        corrections.push('Include diverse perspectives')
        break
      case 'cultural':
        corrections.push('Avoid cultural generalizations')
        corrections.push('Use respectful and inclusive language')
        corrections.push('Acknowledge cultural diversity')
        break
      case 'age':
        corrections.push('Avoid age-based assumptions')
        corrections.push('Use inclusive age-neutral language')
        break
    }

    return corrections
  }

  private analyzeDemographicRepresentation(content: any): DemographicAnalysis {
    const text = content.content.toLowerCase()
    
    // Simple demographic analysis
    const genderMentions = {
      male: (text.match(/\b(he|his|him|man|men|male|father|son|brother|husband)\b/g) || []).length,
      female: (text.match(/\b(she|her|hers|woman|women|female|mother|daughter|sister|wife)\b/g) || []).length
    }

    const genderBalance = genderMentions.male === 0 && genderMentions.female === 0 ? 100 :
      100 - Math.abs(genderMentions.male - genderMentions.female) / (genderMentions.male + genderMentions.female) * 100

    const culturalGroups = []
    const culturalGroupPatterns = ['emirati', 'arab', 'indian', 'pakistani', 'filipino', 'british', 'american', 'european', 'african', 'asian']
    
    for (const group of culturalGroupPatterns) {
      if (text.includes(group)) {
        culturalGroups.push(group)
      }
    }

    return {
      gender_balance: genderBalance,
      age_representation: [],
      cultural_groups_mentioned: culturalGroups,
      representation_score: culturalGroups.length > 0 ? 80 : 60,
      inclusive_language_score: 75
    }
  }

  private analyzeLanguageBias(content: any): LanguageBias {
    const text = content.content.toLowerCase()
    const examples: string[] = []

    let loadedLanguageCount = 0
    let emotionalManipulationScore = 0

    for (const { pattern, type } of this.LOADED_LANGUAGE_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        loadedLanguageCount += matches.length
        examples.push(...matches.slice(0, 2))
        
        if (type === 'emotional_manipulation') {
          emotionalManipulationScore += matches.length * 10
        }
      }
    }

    const objectivityScore = Math.max(0, 100 - loadedLanguageCount * 5)

    return {
      loaded_language_count: loadedLanguageCount,
      emotional_manipulation_score: Math.min(100, emotionalManipulationScore),
      objectivity_score: objectivityScore,
      examples: examples.slice(0, 5)
    }
  }

  private analyzeCulturalBias(content: any): CulturalBias {
    const text = content.content.toLowerCase()
    const issues: string[] = []

    // Check for stereotyping
    const stereotypingPatterns = [
      /\ball (arabs|muslims|christians|hindus|locals|foreigners|expatriates) are\b/gi,
      /\b(typical|stereotypical|usual|common) (arab|muslim|christian|local|foreign)\b/gi
    ]

    let stereotypingDetected = false
    for (const pattern of stereotypingPatterns) {
      if (pattern.test(text)) {
        stereotypingDetected = true
        issues.push('Stereotyping language detected')
        break
      }
    }

    // Check for local context awareness
    const localContextTerms = ['dubai', 'uae', 'emirates', 'local', 'region', 'community', 'culture', 'tradition']
    const localContextScore = localContextTerms.filter(term => text.includes(term)).length * 10

    // Check for respectful representation
    const respectfulTerms = ['respect', 'honor', 'tradition', 'heritage', 'culture', 'community', 'diversity', 'inclusion']
    const respectfulScore = respectfulTerms.filter(term => text.includes(term)).length * 15

    const culturalSensitivityScore = Math.min(100, localContextScore + respectfulScore - (stereotypingDetected ? 30 : 0))

    return {
      cultural_sensitivity_score: culturalSensitivityScore,
      stereotyping_detected: stereotypingDetected,
      local_context_awareness: Math.min(100, localContextScore),
      respectful_representation: Math.min(100, respectfulScore),
      issues
    }
  }

  private checkDefamationRisk(content: any): boolean {
    const text = content.content.toLowerCase()
    const defamationPatterns = [
      /\b(accuse|accused|blame|guilty|criminal|fraud|scam|lie|liar|cheat|corrupt)\b/gi,
      /\b(false|fake|untrue|misleading|deceptive|dishonest)\b/gi
    ]

    return defamationPatterns.some(pattern => pattern.test(text))
  }

  private checkPrivacyCompliance(content: any): boolean {
    const text = content.content.toLowerCase()
    const privacyPatterns = [
      /\b(personal data|private information|confidential|contact details|phone number|email address|address|location)\b/gi
    ]

    return !privacyPatterns.some(pattern => pattern.test(text))
  }

  private checkCopyrightConcerns(content: any): boolean {
    const text = content.content.toLowerCase()
    const copyrightPatterns = [
      /\b(copyright|trademark|patent|intellectual property|all rights reserved)\b/gi
    ]

    return copyrightPatterns.some(pattern => pattern.test(text))
  }

  private calculateOverallSafetyScore(issues: ModerationIssue[], biasAnalysis: BiasAnalysis, legalCompliance: LegalCompliance): number {
    let score = 100

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 30
          break
        case 'high':
          score -= 20
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    // Factor in bias analysis
    score = (score + biasAnalysis.overall_bias_score) / 2

    // Factor in legal compliance
    score = (score + legalCompliance.overall_compliance_score) / 2

    return Math.max(0, Math.min(100, score))
  }

  private calculateCulturalSensitivityScore(issues: ModerationIssue[]): number {
    let score = 100
    const culturalIssues = issues.filter(i => i.issue_type === 'cultural_insensitivity')
    
    for (const issue of culturalIssues) {
      score -= issue.severity === 'high' ? 25 : issue.severity === 'medium' ? 15 : 10
    }

    return Math.max(0, score)
  }

  private calculateOverallBiasScore(detectedBiases: DetectedBias[], demographicAnalysis: DemographicAnalysis, languageBias: LanguageBias, culturalBias: CulturalBias): number {
    let score = 100

    // Deduct for detected biases
    for (const bias of detectedBiases) {
      score -= bias.severity === 'high' ? 20 : bias.severity === 'medium' ? 10 : 5
    }

    // Factor in demographic representation
    score = (score + demographicAnalysis.representation_score) / 2

    // Factor in language bias
    score = (score + languageBias.objectivity_score) / 2

    // Factor in cultural bias
    score = (score + culturalBias.cultural_sensitivity_score) / 2

    return Math.max(0, Math.min(100, score))
  }

  private calculateComplianceScore(complianceIssues: string[], defamationRisk: boolean, privacyCompliance: boolean, copyrightConcerns: boolean): number {
    let score = 100

    score -= complianceIssues.length * 15
    if (defamationRisk) score -= 25
    if (!privacyCompliance) score -= 20
    if (copyrightConcerns) score -= 15

    return Math.max(0, score)
  }

  private determineModerationStatus(safetyScore: number, issues: ModerationIssue[]): ContentModerationResult['moderation_status'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const highIssues = issues.filter(i => i.severity === 'high')

    if (criticalIssues.length > 0 || safetyScore < 30) {
      return 'blocked'
    }
    if (highIssues.length > 0 || safetyScore < 60) {
      return 'unsafe'
    }
    if (safetyScore < 80) {
      return 'needs_review'
    }
    return 'safe'
  }

  private generateModerationRecommendations(issues: ModerationIssue[], biasAnalysis: BiasAnalysis, legalCompliance: LegalCompliance): string[] {
    const recommendations: string[] = []

    if (issues.length > 0) {
      recommendations.push(`Address ${issues.length} content issues detected`)
    }

    if (biasAnalysis.overall_bias_score < 70) {
      recommendations.push('Review content for bias and inclusive language')
    }

    if (legalCompliance.overall_compliance_score < 80) {
      recommendations.push('Review legal compliance concerns')
    }

    return recommendations
  }

  private generateModerationWarnings(issues: ModerationIssue[], biasAnalysis: BiasAnalysis, legalCompliance: LegalCompliance): string[] {
    const warnings: string[] = []

    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const highIssues = issues.filter(i => i.severity === 'high')

    if (criticalIssues.length > 0) {
      warnings.push(`${criticalIssues.length} critical issues detected`)
    }

    if (highIssues.length > 0) {
      warnings.push(`${highIssues.length} high-severity issues detected`)
    }

    if (legalCompliance.defamation_risk) {
      warnings.push('Potential defamation risk detected')
    }

    if (!legalCompliance.uae_law_compliance) {
      warnings.push('UAE law compliance issues detected')
    }

    return warnings
  }

  private requiresHumanReview(issues: ModerationIssue[], safetyScore: number, biasAnalysis: BiasAnalysis, legalCompliance: LegalCompliance): boolean {
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const highIssues = issues.filter(i => i.severity === 'high')

    return (
      criticalIssues.length > 0 ||
      highIssues.length > 2 ||
      safetyScore < 60 ||
      biasAnalysis.overall_bias_score < 60 ||
      legalCompliance.overall_compliance_score < 70 ||
      legalCompliance.defamation_risk
    )
  }

  private determineAutoAction(moderationStatus: ContentModerationResult['moderation_status'], issues: ModerationIssue[], safetyScore: number): ContentModerationResult['auto_action'] {
    if (moderationStatus === 'blocked') return 'reject'
    if (moderationStatus === 'unsafe') return 'flag'
    if (moderationStatus === 'needs_review') return 'flag'
    if (moderationStatus === 'safe' && safetyScore >= 90) return 'approve'
    return 'none'
  }

  private biasToModerationIssue(bias: DetectedBias): ModerationIssue {
    return {
      id: crypto.randomUUID(),
      issue_type: 'bias',
      severity: bias.severity,
      confidence: bias.confidence,
      description: `${bias.bias_type} bias detected`,
      location: 'content_text',
      flagged_text: bias.examples.join(', '),
      context: `${bias.bias_type} bias in content`,
      suggested_action: bias.suggested_corrections.join('; ')
    }
  }

  private legalToModerationIssue(issue: string): ModerationIssue {
    return {
      id: crypto.randomUUID(),
      issue_type: 'legal_concern',
      severity: 'high',
      confidence: 0.8,
      description: `Legal compliance concern: ${issue}`,
      location: 'content_text',
      flagged_text: issue,
      context: 'Legal compliance check',
      suggested_action: 'Review legal implications'
    }
  }

  private generateLegalRecommendations(complianceIssues: string[], defamationRisk: boolean, privacyCompliance: boolean, copyrightConcerns: boolean): string[] {
    const recommendations: string[] = []

    if (complianceIssues.length > 0) {
      recommendations.push('Review UAE legal compliance')
    }

    if (defamationRisk) {
      recommendations.push('Review content for potential defamation')
    }

    if (!privacyCompliance) {
      recommendations.push('Ensure privacy compliance')
    }

    if (copyrightConcerns) {
      recommendations.push('Review copyright and IP concerns')
    }

    return recommendations
  }

  private async storeModerationResult(contentId: string, result: ContentModerationResult): Promise<void> {
    await supabase.from('content_moderation_results').upsert({
      content_id: contentId,
      overall_safety_score: result.overall_safety_score,
      moderation_status: result.moderation_status,
      detected_issues: result.detected_issues,
      cultural_sensitivity_score: result.cultural_sensitivity_score,
      bias_analysis: result.bias_analysis,
      legal_compliance: result.legal_compliance,
      recommendations: result.recommendations,
      warnings: result.warnings,
      requires_human_review: result.requires_human_review,
      auto_action: result.auto_action,
      moderated_at: new Date().toISOString()
    })
  }
}

export const contentModerationService = new ContentModerationService()