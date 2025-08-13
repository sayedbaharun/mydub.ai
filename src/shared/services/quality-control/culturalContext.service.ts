export interface CulturalContext {
  region: string
  culture: string
  language: string
  religious_considerations: string[]
  cultural_values: string[]
  social_norms: string[]
  business_etiquette: string[]
  sensitive_topics: string[]
  preferred_language_patterns: string[]
  calendar_considerations: string[]
  local_references: string[]
}

export interface CulturalAssessment {
  overall_score: number
  cultural_awareness: number
  religious_sensitivity: number
  local_relevance: number
  language_appropriateness: number
  social_sensitivity: number
  business_appropriateness: number
  identified_issues: CulturalIssue[]
  recommendations: string[]
  compliance_level: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'inappropriate'
}

export interface CulturalIssue {
  type: 'religious' | 'social' | 'language' | 'business' | 'calendar' | 'reference' | 'value'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  suggestion: string
  cultural_context: string
}

export class CulturalContextService {
  private readonly UAE_CULTURAL_CONTEXT: CulturalContext = {
    region: 'UAE',
    culture: 'Emirati/Arab',
    language: 'Arabic/English',
    religious_considerations: [
      'Islam is the official religion',
      'Respect for Islamic practices and beliefs',
      'Prayer times (5 times daily)',
      'Friday as holy day',
      'Ramadan observance',
      'Eid celebrations',
      'Halal dietary requirements',
      'Modest dress expectations',
      'Alcohol restrictions',
      'Respect for mosques and religious sites'
    ],
    cultural_values: [
      'Hospitality and generosity',
      'Respect for elders and authority',
      'Family honor and reputation',
      'Community harmony',
      'Traditional values alongside modernity',
      'National pride and heritage',
      'Education and knowledge',
      'Business excellence',
      'Environmental sustainability',
      'Tolerance and diversity'
    ],
    social_norms: [
      'Formal greetings and titles',
      'Respect for personal space',
      'Gender-appropriate interactions',
      'Conservative public behavior',
      'Respect for local customs',
      'Community-mindedness',
      'Punctuality in business',
      'Dress modestly in public',
      'Respect for local laws',
      'Environmental consciousness'
    ],
    business_etiquette: [
      'Relationship building is crucial',
      'Patience in negotiations',
      'Respect for hierarchy',
      'Conservative dress code',
      'Understanding of Islamic calendar',
      'Flexibility during Ramadan',
      'Emphasis on trust and credibility',
      'Long-term partnership approach',
      'Quality and excellence focus',
      'Innovation and technology embrace'
    ],
    sensitive_topics: [
      'Political criticism',
      'Religious comparisons or criticism',
      'Alcohol and gambling',
      'Inappropriate relationships',
      'Controversial historical events',
      'Internal family matters',
      'Financial speculation',
      'Environmental damage',
      'Social inequality',
      'Regional conflicts'
    ],
    preferred_language_patterns: [
      'Respectful and formal tone',
      'Positive and optimistic language',
      'Inclusive and welcoming expressions',
      'Professional terminology',
      'Clear and direct communication',
      'Culturally neutral references',
      'Emphasis on quality and excellence',
      'Future-focused language',
      'Community-oriented messaging',
      'Value-driven content'
    ],
    calendar_considerations: [
      'Islamic calendar dates',
      'Ramadan timing variations',
      'Eid holidays',
      'UAE National Day',
      'International holidays',
      'Academic calendar',
      'Business calendar',
      'Cultural festivals',
      'Seasonal considerations',
      'Prayer time awareness'
    ],
    local_references: [
      'UAE landmarks and locations',
      'Local businesses and brands',
      'Cultural heritage sites',
      'Government institutions',
      'Educational institutions',
      'Healthcare facilities',
      'Transportation systems',
      'Tourism destinations',
      'Sports and entertainment venues',
      'Shopping and dining locations'
    ]
  }

  private readonly CULTURAL_KEYWORDS = {
    positive: [
      'tradition', 'heritage', 'culture', 'respect', 'honor', 'family', 'community',
      'hospitality', 'generosity', 'tolerance', 'diversity', 'harmony', 'excellence',
      'innovation', 'progress', 'development', 'sustainability', 'quality', 'pride',
      'celebration', 'festival', 'unity', 'cooperation', 'partnership', 'collaboration'
    ],
    neutral: [
      'dubai', 'uae', 'emirates', 'arab', 'emirati', 'muslim', 'islamic', 'mosque',
      'ramadan', 'eid', 'halal', 'prayer', 'traditional', 'modern', 'local', 'expat',
      'resident', 'visitor', 'tourist', 'business', 'government', 'education'
    ],
    sensitive: [
      'alcohol', 'gambling', 'pork', 'dating', 'relationships', 'politics', 'religion',
      'criticism', 'controversy', 'conflict', 'inappropriate', 'offensive', 'forbidden',
      'banned', 'illegal', 'prohibited', 'restricted', 'violation', 'disrespect'
    ],
    inappropriate: [
      'backward', 'primitive', 'oppressive', 'restrictive', 'extremist', 'fanatical',
      'barbaric', 'uncivilized', 'strange', 'weird', 'bizarre', 'ridiculous',
      'stupid', 'ignorant', 'inferior', 'superior', 'better', 'worse'
    ]
  }

  private readonly RELIGIOUS_TERMS = {
    respectful: [
      'Islamic tradition', 'Muslim community', 'religious observance', 'spiritual practice',
      'cultural heritage', 'traditional values', 'community celebration', 'religious holiday',
      'place of worship', 'cultural site', 'traditional architecture', 'heritage location'
    ],
    neutral: [
      'mosque', 'prayer', 'ramadan', 'eid', 'islamic', 'muslim', 'halal', 'haram',
      'quran', 'hadith', 'sunnah', 'imam', 'minaret', 'mihrab', 'qibla'
    ],
    avoid: [
      'radical', 'extremist', 'fundamentalist', 'fanatic', 'terrorist', 'jihad',
      'infidel', 'blasphemy', 'sacrilege', 'heretic', 'apostate'
    ]
  }

  async assessCulturalSensitivity(content: {
    title: string
    content: string
    content_type: string
    target_audience?: string
    publication_context?: string
  }): Promise<CulturalAssessment> {
    try {
      const text = `${content.title} ${content.content}`.toLowerCase()
      const issues: CulturalIssue[] = []
      
      // Assess different cultural dimensions
      const religiousSensitivity = this.assessReligiousSensitivity(text, issues)
      const socialSensitivity = this.assessSocialSensitivity(text, issues)
      const languageAppropriateness = this.assessLanguageAppropriateness(text, issues)
      const localRelevance = this.assessLocalRelevance(text, issues)
      const businessAppropriateness = this.assessBusinessAppropriateness(text, issues)
      const culturalAwareness = this.assessCulturalAwareness(text, issues)

      // Calculate overall score
      const overallScore = Math.round(
        (religiousSensitivity * 0.25) +
        (socialSensitivity * 0.20) +
        (languageAppropriateness * 0.20) +
        (localRelevance * 0.15) +
        (businessAppropriateness * 0.10) +
        (culturalAwareness * 0.10)
      )

      // Determine compliance level
      const complianceLevel = this.determineComplianceLevel(overallScore, issues)

      // Generate recommendations
      const recommendations = this.generateCulturalRecommendations(issues, content)

      return {
        overall_score: overallScore,
        cultural_awareness: culturalAwareness,
        religious_sensitivity: religiousSensitivity,
        local_relevance: localRelevance,
        language_appropriateness: languageAppropriateness,
        social_sensitivity: socialSensitivity,
        business_appropriateness: businessAppropriateness,
        identified_issues: issues,
        recommendations,
        compliance_level: complianceLevel
      }
    } catch (error) {
      console.error('Error in cultural sensitivity assessment:', error)
      throw error
    }
  }

  private assessReligiousSensitivity(text: string, issues: CulturalIssue[]): number {
    let score = 100

    // Check for inappropriate religious references
    for (const term of this.RELIGIOUS_TERMS.avoid) {
      if (text.includes(term)) {
        score -= 30
        issues.push({
          type: 'religious',
          severity: 'critical',
          description: `Inappropriate religious term: "${term}"`,
          location: 'content',
          suggestion: 'Remove or replace with respectful language',
          cultural_context: 'This term may be offensive to Muslim readers'
        })
      }
    }

    // Check for religious terms without respectful context
    const religiousTermsFound = this.RELIGIOUS_TERMS.neutral.filter(term => text.includes(term))
    for (const term of religiousTermsFound) {
      const context = this.getTermContext(text, term)
      if (!this.hasRespectfulContext(context)) {
        score -= 10
        issues.push({
          type: 'religious',
          severity: 'medium',
          description: `Religious term "${term}" may need more respectful context`,
          location: 'content',
          suggestion: 'Add respectful context when mentioning religious terms',
          cultural_context: 'Religious terms should be mentioned with appropriate respect'
        })
      }
    }

    // Check for alcohol/gambling references
    const restrictedTerms = ['alcohol', 'drink', 'bar', 'pub', 'casino', 'gambling', 'bet', 'poker']
    for (const term of restrictedTerms) {
      if (text.includes(term)) {
        score -= 15
        issues.push({
          type: 'religious',
          severity: 'high',
          description: `Reference to restricted activity: "${term}"`,
          location: 'content',
          suggestion: 'Consider removing or providing appropriate context',
          cultural_context: 'These activities are restricted in Islamic culture'
        })
      }
    }

    return Math.max(0, score)
  }

  private assessSocialSensitivity(text: string, issues: CulturalIssue[]): number {
    let score = 100

    // Check for culturally insensitive terms
    for (const term of this.CULTURAL_KEYWORDS.inappropriate) {
      if (text.includes(term)) {
        score -= 25
        issues.push({
          type: 'social',
          severity: 'high',
          description: `Culturally insensitive term: "${term}"`,
          location: 'content',
          suggestion: 'Replace with respectful, neutral language',
          cultural_context: 'This term may be perceived as disrespectful to local culture'
        })
      }
    }

    // Check for gender-related sensitivity
    const genderSensitiveTerms = ['ladies', 'gentlemen', 'girls', 'boys', 'guys']
    for (const term of genderSensitiveTerms) {
      if (text.includes(term)) {
        score -= 5
        issues.push({
          type: 'social',
          severity: 'low',
          description: `Consider gender-neutral language instead of "${term}"`,
          location: 'content',
          suggestion: 'Use inclusive, gender-neutral terms',
          cultural_context: 'Gender-neutral language is more inclusive and appropriate'
        })
      }
    }

    // Check for family/relationship references
    const relationshipTerms = ['boyfriend', 'girlfriend', 'dating', 'hookup', 'singles']
    for (const term of relationshipTerms) {
      if (text.includes(term)) {
        score -= 10
        issues.push({
          type: 'social',
          severity: 'medium',
          description: `Sensitive relationship reference: "${term}"`,
          location: 'content',
          suggestion: 'Use more conservative language about relationships',
          cultural_context: 'Traditional values emphasize family and appropriate relationships'
        })
      }
    }

    return Math.max(0, score)
  }

  private assessLanguageAppropriateness(text: string, issues: CulturalIssue[]): number {
    let score = 100

    // Check for positive cultural keywords
    const positiveTermsFound = this.CULTURAL_KEYWORDS.positive.filter(term => text.includes(term))
    score += positiveTermsFound.length * 2 // Bonus for positive terms

    // Check for formal vs informal language
    const informalTerms = ['gonna', 'wanna', 'yeah', 'nah', 'cool', 'awesome', 'super', 'mega']
    for (const term of informalTerms) {
      if (text.includes(term)) {
        score -= 5
        issues.push({
          type: 'language',
          severity: 'low',
          description: `Informal language: "${term}"`,
          location: 'content',
          suggestion: 'Use more formal, professional language',
          cultural_context: 'Formal language is preferred in UAE business and public communication'
        })
      }
    }

    // Check for slang or inappropriate expressions
    const slangTerms = ['dude', 'bro', 'chick', 'dope', 'sick', 'wicked', 'crazy good']
    for (const term of slangTerms) {
      if (text.includes(term)) {
        score -= 10
        issues.push({
          type: 'language',
          severity: 'medium',
          description: `Inappropriate slang: "${term}"`,
          location: 'content',
          suggestion: 'Replace with professional vocabulary',
          cultural_context: 'Professional communication requires appropriate language choices'
        })
      }
    }

    return Math.max(0, Math.min(110, score)) // Cap at 110 to account for bonus
  }

  private assessLocalRelevance(text: string, issues: CulturalIssue[]): number {
    let score = 70 // Base score

    // Check for UAE/Dubai references
    const localTerms = ['dubai', 'uae', 'emirates', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain']
    const localTermsFound = localTerms.filter(term => text.includes(term))
    score += localTermsFound.length * 5 // Bonus for local relevance

    // Check for local landmarks and institutions
    const landmarks = ['burj khalifa', 'palm jumeirah', 'dubai mall', 'emirates palace', 'sheikh zayed mosque', 'dubai marina']
    const landmarksFound = landmarks.filter(landmark => text.includes(landmark))
    score += landmarksFound.length * 3

    // Check for local business context
    const businessTerms = ['business bay', 'difc', 'dubai world trade centre', 'abu dhabi global market']
    const businessTermsFound = businessTerms.filter(term => text.includes(term))
    score += businessTermsFound.length * 4

    // Penalize for irrelevant regional references
    const irrelevantTerms = ['new york', 'london', 'paris', 'tokyo', 'sydney', 'american', 'european']
    for (const term of irrelevantTerms) {
      if (text.includes(term) && !this.hasGlobalContext(text, term)) {
        score -= 5
        issues.push({
          type: 'reference',
          severity: 'low',
          description: `Irrelevant regional reference: "${term}"`,
          location: 'content',
          suggestion: 'Focus on local or regionally relevant examples',
          cultural_context: 'Content should prioritize local relevance for UAE audience'
        })
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  private assessBusinessAppropriateness(text: string, issues: CulturalIssue[]): number {
    let score = 100

    // Check for appropriate business language
    const businessValues = ['excellence', 'quality', 'innovation', 'sustainability', 'partnership', 'trust']
    const valuesFound = businessValues.filter(value => text.includes(value))
    score += valuesFound.length * 2 // Bonus for business values

    // Check for inappropriate business practices
    const inappropriatePractices = ['bribery', 'corruption', 'tax evasion', 'money laundering', 'fraud']
    for (const practice of inappropriatePractices) {
      if (text.includes(practice)) {
        score -= 20
        issues.push({
          type: 'business',
          severity: 'critical',
          description: `Reference to inappropriate business practice: "${practice}"`,
          location: 'content',
          suggestion: 'Remove references to illegal or unethical practices',
          cultural_context: 'UAE maintains high standards of business ethics and compliance'
        })
      }
    }

    // Check for speculative language
    const speculativeTerms = ['get rich quick', 'guaranteed returns', 'easy money', 'instant profit']
    for (const term of speculativeTerms) {
      if (text.includes(term)) {
        score -= 15
        issues.push({
          type: 'business',
          severity: 'high',
          description: `Speculative language: "${term}"`,
          location: 'content',
          suggestion: 'Use conservative, factual business language',
          cultural_context: 'Responsible financial communication is important in UAE business culture'
        })
      }
    }

    return Math.max(0, score)
  }

  private assessCulturalAwareness(text: string, issues: CulturalIssue[]): number {
    let score = 80 // Base score

    // Check for cultural awareness indicators
    const awarenessTerms = ['tradition', 'heritage', 'culture', 'respect', 'diversity', 'tolerance']
    const awarenessFound = awarenessTerms.filter(term => text.includes(term))
    score += awarenessFound.length * 3

    // Check for calendar sensitivity
    const calendarTerms = ['ramadan', 'eid', 'national day', 'islamic calendar']
    const calendarFound = calendarTerms.filter(term => text.includes(term))
    score += calendarFound.length * 4

    // Check for community focus
    const communityTerms = ['community', 'society', 'together', 'unity', 'collaboration', 'partnership']
    const communityFound = communityTerms.filter(term => text.includes(term))
    score += communityFound.length * 2

    // Penalize for lack of cultural context
    if (text.length > 500 && awarenessFound.length === 0) {
      score -= 10
      issues.push({
        type: 'value',
        severity: 'low',
        description: 'Content lacks cultural awareness indicators',
        location: 'content',
        suggestion: 'Consider adding references to local culture and values',
        cultural_context: 'Content should demonstrate awareness of local culture and values'
      })
    }

    return Math.max(0, Math.min(100, score))
  }

  private determineComplianceLevel(score: number, issues: CulturalIssue[]): CulturalAssessment['compliance_level'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length

    if (criticalIssues > 0) return 'inappropriate'
    if (score >= 90 && highIssues === 0) return 'excellent'
    if (score >= 80 && highIssues <= 1) return 'good'
    if (score >= 70 && highIssues <= 2) return 'acceptable'
    return 'needs_improvement'
  }

  private generateCulturalRecommendations(issues: CulturalIssue[], content: any): string[] {
    const recommendations: string[] = []

    const issueTypes = new Set(issues.map(i => i.type))

    if (issueTypes.has('religious')) {
      recommendations.push('Review religious references for respectful context and appropriate language')
    }

    if (issueTypes.has('social')) {
      recommendations.push('Ensure social references align with local cultural values and norms')
    }

    if (issueTypes.has('language')) {
      recommendations.push('Use formal, professional language appropriate for UAE business context')
    }

    if (issueTypes.has('reference')) {
      recommendations.push('Focus on locally relevant examples and references')
    }

    if (issueTypes.has('business')) {
      recommendations.push('Ensure business content reflects UAE ethical standards and practices')
    }

    if (issueTypes.has('value')) {
      recommendations.push('Incorporate awareness of local cultural values and community focus')
    }

    // Content-type specific recommendations
    if (content.content_type === 'tourism') {
      recommendations.push('Highlight cultural heritage and respect for local traditions')
    } else if (content.content_type === 'business') {
      recommendations.push('Emphasize quality, excellence, and long-term partnership values')
    } else if (content.content_type === 'government') {
      recommendations.push('Ensure alignment with national values and community welfare focus')
    }

    return recommendations
  }

  private getTermContext(text: string, term: string): string {
    const index = text.indexOf(term)
    const start = Math.max(0, index - 50)
    const end = Math.min(text.length, index + term.length + 50)
    return text.substring(start, end)
  }

  private hasRespectfulContext(context: string): boolean {
    const respectfulTerms = ['respect', 'honor', 'tradition', 'heritage', 'culture', 'community', 'celebration', 'important', 'significant']
    return respectfulTerms.some(term => context.includes(term))
  }

  private hasGlobalContext(text: string, term: string): boolean {
    const globalIndicators = ['international', 'global', 'worldwide', 'compared to', 'similar to', 'like in']
    const termContext = this.getTermContext(text, term)
    return globalIndicators.some(indicator => termContext.includes(indicator))
  }

  getCulturalContext(): CulturalContext {
    return this.UAE_CULTURAL_CONTEXT
  }

  getCulturalGuidelines(contentType: string): string[] {
    const baseGuidelines = [
      'Use respectful and inclusive language',
      'Be aware of religious sensitivities',
      'Respect local customs and traditions',
      'Use formal, professional tone',
      'Focus on local relevance',
      'Emphasize community and family values',
      'Avoid controversial or sensitive topics',
      'Use culturally appropriate examples',
      'Respect business ethics and standards',
      'Be mindful of calendar and timing considerations'
    ]

    const specificGuidelines: Record<string, string[]> = {
      tourism: [
        'Highlight cultural heritage and traditions',
        'Respect religious sites and practices',
        'Promote sustainable and responsible tourism',
        'Emphasize family-friendly activities',
        'Use modest and appropriate imagery'
      ],
      business: [
        'Emphasize long-term partnerships',
        'Focus on quality and excellence',
        'Respect business hierarchy and protocols',
        'Be aware of Islamic calendar impacts',
        'Promote ethical business practices'
      ],
      government: [
        'Align with national values and vision',
        'Emphasize community welfare',
        'Respect official protocols',
        'Use formal, respectful language',
        'Support national development goals'
      ],
      news: [
        'Maintain objectivity and balance',
        'Respect privacy and dignity',
        'Be sensitive to cultural implications',
        'Verify facts with local context',
        'Avoid sensationalism'
      ]
    }

    return [...baseGuidelines, ...(specificGuidelines[contentType] || [])]
  }
}

export const culturalContextService = new CulturalContextService()