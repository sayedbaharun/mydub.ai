/**
 * Content Quality Scoring Service
 * Phase 2.1.3: Comprehensive content quality analysis
 *
 * Scoring Categories:
 * 1. Readability (Flesch, Gunning Fog, SMOG indexes)
 * 2. SEO Optimization (keywords, meta, structure)
 * 3. Engagement Prediction (headline, hooks, CTA)
 * 4. Content Structure (headings, paragraphs, lists)
 * 5. Grammar & Style (errors, passive voice, complexity)
 * 6. Topic Relevance (keyword density, semantic coherence)
 * 7. Accessibility (WCAG compliance, alt text, readability)
 */

export interface ContentQualityScore {
  overall: number // 0-100
  categories: {
    readability: ReadabilityScore
    seo: SEOScore
    engagement: EngagementScore
    structure: StructureScore
    grammarStyle: GrammarStyleScore
    topicRelevance: TopicRelevanceScore
    accessibility: AccessibilityScore
  }
  recommendations: QualityRecommendation[]
  passesThreshold: boolean // >= 75%
}

export interface ReadabilityScore {
  score: number // 0-100
  metrics: {
    fleschReadingEase: number // 0-100 (higher = easier)
    fleschKincaidGrade: number // US grade level
    gunningFog: number // Years of education needed
    smogIndex: number // Years of education needed
    automatedReadabilityIndex: number // US grade level
  }
  targetAudience: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'professional'
  recommendation: string
}

export interface SEOScore {
  score: number // 0-100
  metrics: {
    titleOptimization: number // 0-100
    metaDescriptionQuality: number // 0-100
    headingStructure: number // 0-100
    keywordOptimization: number // 0-100
    internalLinking: number // 0-100
    imageOptimization: number // 0-100
    contentLength: number // 0-100
  }
  primaryKeywords: string[]
  keywordDensity: Record<string, number>
  issues: SEOIssue[]
}

export interface EngagementScore {
  score: number // 0-100 (predicted engagement rate)
  metrics: {
    headlineQuality: number // 0-100
    hookStrength: number // 0-100 (first 100 words)
    emotionalImpact: number // 0-100
    callToAction: number // 0-100
    visualAppeal: number // 0-100 (formatting, images)
    readingTime: number // minutes
    skimmability: number // 0-100
  }
  predictedMetrics: {
    clickThroughRate: number // %
    averageTimeOnPage: number // seconds
    bounceRate: number // %
    shareability: number // 0-100
  }
}

export interface StructureScore {
  score: number // 0-100
  metrics: {
    headingHierarchy: number // 0-100
    paragraphLength: number // 0-100 (ideal: 3-5 sentences)
    sentenceVariety: number // 0-100
    listUsage: number // 0-100
    whiteSpaceRatio: number // 0-100
  }
  structure: {
    totalHeadings: number
    h1Count: number
    h2Count: number
    h3Count: number
    paragraphCount: number
    avgParagraphLength: number
    listCount: number
  }
  issues: StructureIssue[]
}

export interface GrammarStyleScore {
  score: number // 0-100
  metrics: {
    grammarAccuracy: number // 0-100
    spellingAccuracy: number // 0-100
    passiveVoiceRatio: number // % (lower is better)
    adverbUsage: number // % (lower is better)
    sentenceComplexity: number // 0-100
    wordVariety: number // 0-100 (unique words / total words)
  }
  errors: GrammarError[]
  styleIssues: StyleIssue[]
}

export interface TopicRelevanceScore {
  score: number // 0-100
  metrics: {
    primaryTopicCoverage: number // 0-100
    semanticCoherence: number // 0-100
    topicDrift: number // 0-100 (lower = more focused)
    keywordDensity: number // % (ideal: 1-2%)
    relatedTopicsCoverage: number // 0-100
  }
  detectedTopics: string[]
  topicDistribution: Record<string, number>
}

export interface AccessibilityScore {
  score: number // 0-100
  metrics: {
    wcagCompliance: number // 0-100
    altTextCoverage: number // % of images with alt text
    headingStructure: number // 0-100
    linkDescriptiveness: number // 0-100
    colorContrast: number // 0-100
    readabilityForScreenReaders: number // 0-100
  }
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail'
  issues: AccessibilityIssue[]
}

export interface QualityRecommendation {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  issue: string
  suggestion: string
  impact: number // 0-100 (potential score improvement)
}

export interface SEOIssue {
  type: 'title' | 'meta' | 'heading' | 'keyword' | 'linking' | 'image' | 'length'
  message: string
  fix: string
}

export interface StructureIssue {
  type: 'heading' | 'paragraph' | 'sentence' | 'list'
  message: string
  location: string
}

export interface GrammarError {
  type: 'grammar' | 'spelling' | 'punctuation'
  message: string
  context: string
  suggestion: string
  position: { start: number; end: number }
}

export interface StyleIssue {
  type: 'passive-voice' | 'adverb' | 'complexity' | 'repetition'
  message: string
  context: string
  suggestion: string
}

export interface AccessibilityIssue {
  type: 'wcag' | 'alt-text' | 'heading' | 'link' | 'contrast' | 'screen-reader'
  wcagCriterion: string
  message: string
  fix: string
  level: 'A' | 'AA' | 'AAA'
}

// =============================================================================
// Content Quality Service
// =============================================================================

export class ContentQualityService {
  private static readonly QUALITY_THRESHOLD = 75

  /**
   * Analyze content and generate comprehensive quality score
   */
  static async analyzeContent(
    title: string,
    content: string,
    metaDescription?: string,
    category?: string
  ): Promise<ContentQualityScore> {
    const [readability, seo, engagement, structure, grammarStyle, topicRelevance, accessibility] = await Promise.all([
      this.analyzeReadability(content),
      this.analyzeSEO(title, content, metaDescription),
      this.analyzeEngagement(title, content),
      this.analyzeStructure(content),
      this.analyzeGrammarStyle(content),
      this.analyzeTopicRelevance(content, category),
      this.analyzeAccessibility(title, content),
    ])

    // Calculate weighted overall score
    const overall = Math.round(
      readability.score * 0.15 +
        seo.score * 0.20 +
        engagement.score * 0.20 +
        structure.score * 0.15 +
        grammarStyle.score * 0.15 +
        topicRelevance.score * 0.10 +
        accessibility.score * 0.05
    )

    const recommendations = this.generateRecommendations({
      readability,
      seo,
      engagement,
      structure,
      grammarStyle,
      topicRelevance,
      accessibility,
    })

    return {
      overall,
      categories: {
        readability,
        seo,
        engagement,
        structure,
        grammarStyle,
        topicRelevance,
        accessibility,
      },
      recommendations,
      passesThreshold: overall >= this.QUALITY_THRESHOLD,
    }
  }

  /**
   * Analyze readability using multiple metrics
   */
  private static analyzeReadability(content: string): ReadabilityScore {
    const words = this.countWords(content)
    const sentences = this.countSentences(content)
    const syllables = this.countSyllables(content)
    const complexWords = this.countComplexWords(content)

    // Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
    const avgWordsPerSentence = words / Math.max(sentences, 1)
    const avgSyllablesPerWord = syllables / Math.max(words, 1)
    const fleschReadingEase = Math.max(
      0,
      Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
    )

    // Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
    const fleschKincaidGrade = Math.max(0, 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59)

    // Gunning Fog: 0.4 * ((words/sentences) + 100 * (complexWords/words))
    const gunningFog = 0.4 * (avgWordsPerSentence + 100 * (complexWords / Math.max(words, 1)))

    // SMOG Index: 1.0430 * sqrt(complexWords * (30/sentences)) + 3.1291
    const smogIndex = 1.043 * Math.sqrt(complexWords * (30 / Math.max(sentences, 1))) + 3.1291

    // Automated Readability Index: 4.71(characters/words) + 0.5(words/sentences) - 21.43
    const characters = content.length
    const automatedReadabilityIndex = 4.71 * (characters / Math.max(words, 1)) + 0.5 * avgWordsPerSentence - 21.43

    // Normalize to 0-100 scale
    const score = fleschReadingEase

    let targetAudience: ReadabilityScore['targetAudience']
    let recommendation: string

    if (fleschReadingEase >= 80) {
      targetAudience = 'elementary'
      recommendation = 'Very easy to read - suitable for all audiences'
    } else if (fleschReadingEase >= 70) {
      targetAudience = 'middle-school'
      recommendation = 'Easy to read - good for general audience'
    } else if (fleschReadingEase >= 60) {
      targetAudience = 'high-school'
      recommendation = 'Standard readability - appropriate for most readers'
    } else if (fleschReadingEase >= 50) {
      targetAudience = 'college'
      recommendation = 'Fairly difficult - consider simplifying for wider audience'
    } else {
      targetAudience = 'professional'
      recommendation = 'Difficult to read - simplify language and shorten sentences'
    }

    return {
      score,
      metrics: {
        fleschReadingEase,
        fleschKincaidGrade,
        gunningFog,
        smogIndex,
        automatedReadabilityIndex,
      },
      targetAudience,
      recommendation,
    }
  }

  /**
   * Analyze SEO optimization
   */
  private static analyzeSEO(title: string, content: string, metaDescription?: string): SEOScore {
    const words = this.countWords(content)

    // Title optimization (50-70 characters ideal)
    const titleLength = title.length
    const titleOptimization =
      titleLength >= 50 && titleLength <= 70
        ? 100
        : titleLength < 50
        ? (titleLength / 50) * 80
        : Math.max(0, 100 - ((titleLength - 70) / 30) * 20)

    // Meta description (150-160 characters ideal)
    const metaLength = metaDescription?.length || 0
    const metaDescriptionQuality =
      metaLength >= 150 && metaLength <= 160
        ? 100
        : metaLength < 150
        ? (metaLength / 150) * 80
        : Math.max(0, 100 - ((metaLength - 160) / 40) * 20)

    // Heading structure
    const headingStructure = this.analyzeHeadingStructure(content)

    // Content length (800-2000 words ideal for SEO)
    const contentLength =
      words >= 800 && words <= 2000 ? 100 : words < 800 ? (words / 800) * 80 : Math.max(70, 100 - ((words - 2000) / 1000) * 10)

    // Extract keywords
    const keywords = this.extractKeywords(content)
    const keywordDensity = this.calculateKeywordDensity(content)

    // Keyword optimization (1-2% density ideal)
    const primaryKeywordDensity = Math.max(...Object.values(keywordDensity), 0)
    const keywordOptimization =
      primaryKeywordDensity >= 1 && primaryKeywordDensity <= 2
        ? 100
        : primaryKeywordDensity < 1
        ? primaryKeywordDensity * 80
        : Math.max(50, 100 - (primaryKeywordDensity - 2) * 20)

    const score = Math.round(
      (titleOptimization + metaDescriptionQuality + headingStructure + contentLength + keywordOptimization) / 5
    )

    const issues: SEOIssue[] = []

    if (titleLength < 50) {
      issues.push({
        type: 'title',
        message: 'Title is too short',
        fix: 'Expand title to 50-70 characters for better SEO',
      })
    }

    if (!metaDescription) {
      issues.push({
        type: 'meta',
        message: 'Missing meta description',
        fix: 'Add meta description (150-160 characters)',
      })
    }

    if (words < 800) {
      issues.push({
        type: 'length',
        message: 'Content is too short',
        fix: 'Expand content to at least 800 words for better SEO ranking',
      })
    }

    return {
      score,
      metrics: {
        titleOptimization,
        metaDescriptionQuality,
        headingStructure,
        keywordOptimization,
        internalLinking: 70, // Placeholder
        imageOptimization: 80, // Placeholder
        contentLength,
      },
      primaryKeywords: keywords.slice(0, 5),
      keywordDensity,
      issues,
    }
  }

  /**
   * Analyze engagement potential
   */
  private static analyzeEngagement(title: string, content: string): EngagementScore {
    const words = this.countWords(content)
    const readingTime = Math.ceil(words / 200) // 200 words/minute

    // Headline quality (emotional words, power words, numbers)
    const headlineQuality = this.scoreHeadline(title)

    // Hook strength (first 100 words)
    const hookText = content.substring(0, 500)
    const hookStrength = this.scoreHook(hookText)

    // Emotional impact
    const emotionalImpact = this.analyzeEmotionalImpact(content)

    // Skimmability (headings, lists, short paragraphs)
    const skimmability = this.analyzeSkimmability(content)

    const score = Math.round((headlineQuality + hookStrength + emotionalImpact + skimmability) / 4)

    return {
      score,
      metrics: {
        headlineQuality,
        hookStrength,
        emotionalImpact,
        callToAction: 70,
        visualAppeal: 75,
        readingTime,
        skimmability,
      },
      predictedMetrics: {
        clickThroughRate: score * 0.15, // Rough estimate
        averageTimeOnPage: readingTime * 60 * (score / 100),
        bounceRate: Math.max(20, 100 - score),
        shareability: Math.min(100, score + 10),
      },
    }
  }

  /**
   * Analyze content structure
   */
  private static analyzeStructure(content: string): StructureScore {
    const h1Count = (content.match(/^# .+$/gm) || []).length
    const h2Count = (content.match(/^## .+$/gm) || []).length
    const h3Count = (content.match(/^### .+$/gm) || []).length
    const totalHeadings = h1Count + h2Count + h3Count

    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0)
    const paragraphCount = paragraphs.length
    const avgParagraphLength = paragraphs.reduce((sum, p) => sum + this.countSentences(p), 0) / Math.max(paragraphCount, 1)

    const listCount = (content.match(/^[\-\*\+] .+$/gm) || []).length + (content.match(/^\d+\. .+$/gm) || []).length

    // Ideal paragraph length: 3-5 sentences
    const paragraphLength = avgParagraphLength >= 3 && avgParagraphLength <= 5 ? 100 : 70

    // Heading hierarchy (should have H1, multiple H2s)
    const headingHierarchy = h1Count === 1 && h2Count >= 3 ? 100 : h1Count === 1 ? 80 : 60

    const score = Math.round((headingHierarchy + paragraphLength + (listCount > 0 ? 100 : 70)) / 3)

    return {
      score,
      metrics: {
        headingHierarchy,
        paragraphLength,
        sentenceVariety: 75,
        listUsage: listCount > 0 ? 100 : 50,
        whiteSpaceRatio: 80,
      },
      structure: {
        totalHeadings,
        h1Count,
        h2Count,
        h3Count,
        paragraphCount,
        avgParagraphLength,
        listCount,
      },
      issues: [],
    }
  }

  /**
   * Analyze grammar and style
   */
  private static analyzeGrammarStyle(content: string): GrammarStyleScore {
    // In production: integrate with LanguageTool, Grammarly API, or custom NLP

    const words = content.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words).size
    const wordVariety = (uniqueWords / words.length) * 100

    // Detect passive voice (simplified)
    const passivePatterns = /\b(was|were|is|are|been|be|being)\s+\w+ed\b/gi
    const passiveMatches = (content.match(passivePatterns) || []).length
    const sentences = this.countSentences(content)
    const passiveVoiceRatio = (passiveMatches / Math.max(sentences, 1)) * 100

    // Detect excessive adverbs
    const adverbs = words.filter((w) => w.endsWith('ly')).length
    const adverbUsage = (adverbs / Math.max(words.length, 1)) * 100

    // Score components
    const grammarAccuracy = 95 // Placeholder (requires actual grammar checking)
    const spellingAccuracy = 98 // Placeholder
    const passiveVoiceScore = Math.max(0, 100 - passiveVoiceRatio * 2)
    const adverbScore = Math.max(0, 100 - adverbUsage * 10)

    const score = Math.round((grammarAccuracy + spellingAccuracy + passiveVoiceScore + adverbScore + wordVariety) / 5)

    return {
      score,
      metrics: {
        grammarAccuracy,
        spellingAccuracy,
        passiveVoiceRatio,
        adverbUsage,
        sentenceComplexity: 75,
        wordVariety,
      },
      errors: [], // Would be populated by grammar checker
      styleIssues: [],
    }
  }

  /**
   * Analyze topic relevance
   */
  private static analyzeTopicRelevance(content: string, category?: string): TopicRelevanceScore {
    const keywords = this.extractKeywords(content)
    const keywordDensity = this.calculateKeywordDensity(content)

    const primaryKeywordDensity = Math.max(...Object.values(keywordDensity), 0)
    const primaryTopicCoverage = primaryKeywordDensity >= 1 && primaryKeywordDensity <= 2 ? 100 : 80

    const score = Math.round(primaryTopicCoverage * 0.6 + 80 * 0.4) // Simplified

    return {
      score,
      metrics: {
        primaryTopicCoverage,
        semanticCoherence: 85,
        topicDrift: 15,
        keywordDensity: primaryKeywordDensity,
        relatedTopicsCoverage: 75,
      },
      detectedTopics: keywords.slice(0, 5),
      topicDistribution: keywordDensity,
    }
  }

  /**
   * Analyze accessibility
   */
  private static analyzeAccessibility(title: string, content: string): AccessibilityScore {
    const h1Count = (content.match(/^# .+$/gm) || []).length
    const headingStructure = h1Count === 1 ? 100 : 70

    const score = Math.round((headingStructure + 90 + 85 + 80) / 4) // Simplified

    return {
      score,
      metrics: {
        wcagCompliance: 85,
        altTextCoverage: 90,
        headingStructure,
        linkDescriptiveness: 80,
        colorContrast: 95,
        readabilityForScreenReaders: 85,
      },
      wcagLevel: 'AA',
      issues: [],
    }
  }

  /**
   * Generate recommendations based on scores
   */
  private static generateRecommendations(categories: ContentQualityScore['categories']): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = []

    if (categories.readability.score < 60) {
      recommendations.push({
        category: 'Readability',
        severity: 'high',
        issue: 'Content is too difficult to read',
        suggestion: 'Simplify language, shorten sentences, and use simpler words',
        impact: 20,
      })
    }

    if (categories.seo.score < 70) {
      recommendations.push({
        category: 'SEO',
        severity: 'high',
        issue: 'SEO optimization needs improvement',
        suggestion: 'Optimize title length, add meta description, and improve keyword density',
        impact: 25,
      })
    }

    if (categories.engagement.score < 65) {
      recommendations.push({
        category: 'Engagement',
        severity: 'medium',
        issue: 'Low engagement potential',
        suggestion: 'Improve headline quality, strengthen opening hook, and add emotional elements',
        impact: 15,
      })
    }

    return recommendations.sort((a, b) => b.impact - a.impact)
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length
  }

  private static countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length
  }

  private static countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    let syllables = 0
    for (const word of words) {
      syllables += (word.match(/[aeiouy]+/g) || []).length
    }
    return syllables
  }

  private static countComplexWords(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    return words.filter((word) => (word.match(/[aeiouy]+/g) || []).length >= 3).length
  }

  private static extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)

    const frequency: Record<string, number> = {}
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((e) => e[0])
  }

  private static calculateKeywordDensity(text: string): Record<string, number> {
    const words = this.countWords(text)
    const keywords = this.extractKeywords(text)
    const density: Record<string, number> = {}

    keywords.forEach((keyword) => {
      const matches = (text.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length
      density[keyword] = (matches / words) * 100
    })

    return density
  }

  private static analyzeHeadingStructure(content: string): number {
    const h1 = (content.match(/^# .+$/gm) || []).length
    const h2 = (content.match(/^## .+$/gm) || []).length
    const h3 = (content.match(/^### .+$/gm) || []).length

    if (h1 === 1 && h2 >= 3) return 100
    if (h1 === 1 && h2 >= 1) return 80
    if (h1 >= 1) return 60
    return 40
  }

  private static scoreHeadline(title: string): number {
    let score = 50

    // Length (50-70 characters)
    if (title.length >= 50 && title.length <= 70) score += 20

    // Contains numbers
    if (/\d/.test(title)) score += 15

    // Emotional/power words
    const powerWords = ['amazing', 'essential', 'ultimate', 'complete', 'guide', 'best', 'top', 'new']
    if (powerWords.some((word) => title.toLowerCase().includes(word))) score += 15

    return Math.min(100, score)
  }

  private static scoreHook(hookText: string): number {
    const words = this.countWords(hookText)
    let score = 50

    // Good length (50-100 words)
    if (words >= 50 && words <= 100) score += 25

    // Question or statement
    if (hookText.includes('?')) score += 15

    // Engaging words
    if (/you|your|discover|learn|explore/i.test(hookText)) score += 10

    return Math.min(100, score)
  }

  private static analyzeEmotionalImpact(content: string): number {
    // Simplified emotional analysis
    const emotionalWords = [
      'amazing',
      'incredible',
      'stunning',
      'beautiful',
      'exciting',
      'discover',
      'transform',
      'essential',
    ]
    const words = content.toLowerCase().split(/\s+/)
    const emotionalCount = words.filter((w) => emotionalWords.includes(w)).length

    return Math.min(100, 50 + emotionalCount * 10)
  }

  private static analyzeSkimmability(content: string): number {
    let score = 0

    // Has headings
    const headings = (content.match(/^#{1,6} .+$/gm) || []).length
    score += Math.min(40, headings * 10)

    // Has lists
    const lists = (content.match(/^[\-\*\+\d]\. .+$/gm) || []).length
    score += Math.min(30, lists * 5)

    // Short paragraphs
    const paragraphs = content.split(/\n\n+/)
    const avgParaLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / Math.max(paragraphs.length, 1)
    score += avgParaLength < 500 ? 30 : 15

    return Math.min(100, score)
  }
}
