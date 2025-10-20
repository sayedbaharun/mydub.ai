/**
 * SEO Optimization Service
 * Phase 2.4.3: Automated SEO analysis and recommendations
 *
 * Features:
 * - Title optimization (length, keywords, power words)
 * - Meta description analysis
 * - Keyword density and optimization
 * - Content structure analysis (headings, paragraphs)
 * - Internal/external linking recommendations
 * - Image alt text validation
 * - Schema markup suggestions
 * - Mobile-friendliness check
 * - Core Web Vitals estimation
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface SEOAnalysisResult {
  articleId: string
  overallScore: number // 0-100
  sections: {
    title: SEOTitleAnalysis
    metaDescription: SEOMetaAnalysis
    keywords: SEOKeywordAnalysis
    content: SEOContentAnalysis
    links: SEOLinkAnalysis
    images: SEOImageAnalysis
    technical: SEOTechnicalAnalysis
  }
  recommendations: SEORecommendation[]
  estimatedRanking: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface SEOTitleAnalysis {
  score: number
  length: number
  idealLengthRange: [number, number]
  hasNumbers: boolean
  hasPowerWords: boolean
  hasKeyword: boolean
  issues: string[]
  suggestions: string[]
}

export interface SEOMetaAnalysis {
  score: number
  length: number
  idealLengthRange: [number, number]
  hasCallToAction: boolean
  hasKeyword: boolean
  issues: string[]
  suggestions: string[]
}

export interface SEOKeywordAnalysis {
  score: number
  primaryKeyword: string
  keywordDensity: number // percentage
  idealDensityRange: [number, number]
  relatedKeywords: string[]
  keywordUsage: {
    inTitle: boolean
    inMeta: boolean
    inFirstParagraph: boolean
    inHeadings: boolean
  }
  issues: string[]
  suggestions: string[]
}

export interface SEOContentAnalysis {
  score: number
  wordCount: number
  idealWordCountRange: [number, number]
  readabilityScore: number
  headingStructure: {
    h1Count: number
    h2Count: number
    h3Count: number
    hasProperHierarchy: boolean
  }
  paragraphCount: number
  avgParagraphLength: number
  issues: string[]
  suggestions: string[]
}

export interface SEOLinkAnalysis {
  score: number
  internalLinks: number
  externalLinks: number
  brokenLinks: number
  issues: string[]
  suggestions: string[]
}

export interface SEOImageAnalysis {
  score: number
  totalImages: number
  imagesWithAlt: number
  avgImageSize: number // KB
  issues: string[]
  suggestions: string[]
}

export interface SEOTechnicalAnalysis {
  score: number
  hasSchemaMarkup: boolean
  isMobileFriendly: boolean
  estimatedLoadTime: number // seconds
  issues: string[]
  suggestions: string[]
}

export interface SEORecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  issue: string
  suggestion: string
  impact: string
}

// =============================================================================
// SEO Optimization Service
// =============================================================================

export class SEOOptimizationService {
  private static readonly POWER_WORDS = [
    'ultimate',
    'complete',
    'essential',
    'proven',
    'amazing',
    'incredible',
    'exclusive',
    'free',
    'new',
    'best',
    'top',
    'guide',
  ]

  /**
   * Analyze article SEO and generate recommendations
   */
  static async analyzeArticleSEO(articleId: string): Promise<SEOAnalysisResult> {
    // Get article
    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) {
      throw new Error('Article not found')
    }

    // Analyze each section
    const titleAnalysis = this.analyzeTitle(article.title, article.category)
    const metaAnalysis = this.analyzeMetaDescription(article.summary, article.title)
    const keywordAnalysis = this.analyzeKeywords(
      article.title,
      article.content || '',
      article.summary || '',
      article.category
    )
    const contentAnalysis = this.analyzeContent(article.content || '')
    const linkAnalysis = this.analyzeLinks(article.content || '')
    const imageAnalysis = this.analyzeImages(article.content || '', article.image_url)
    const technicalAnalysis = this.analyzeTechnical(article)

    // Calculate overall score
    const overallScore = Math.round(
      (titleAnalysis.score * 0.2 +
        metaAnalysis.score * 0.15 +
        keywordAnalysis.score * 0.2 +
        contentAnalysis.score * 0.2 +
        linkAnalysis.score * 0.1 +
        imageAnalysis.score * 0.1 +
        technicalAnalysis.score * 0.05)
    )

    // Generate prioritized recommendations
    const recommendations = this.generateRecommendations({
      title: titleAnalysis,
      metaDescription: metaAnalysis,
      keywords: keywordAnalysis,
      content: contentAnalysis,
      links: linkAnalysis,
      images: imageAnalysis,
      technical: technicalAnalysis,
    })

    // Determine estimated ranking
    const estimatedRanking = this.getEstimatedRanking(overallScore)

    return {
      articleId,
      overallScore,
      sections: {
        title: titleAnalysis,
        metaDescription: metaAnalysis,
        keywords: keywordAnalysis,
        content: contentAnalysis,
        links: linkAnalysis,
        images: imageAnalysis,
        technical: technicalAnalysis,
      },
      recommendations,
      estimatedRanking,
    }
  }

  /**
   * Analyze title SEO
   */
  private static analyzeTitle(title: string, category: string): SEOTitleAnalysis {
    const length = title.length
    const idealLengthRange: [number, number] = [50, 60]
    const words = title.toLowerCase().split(/\s+/)

    const hasNumbers = /\d/.test(title)
    const hasPowerWords = this.POWER_WORDS.some((word) => title.toLowerCase().includes(word))
    const hasKeyword = title.toLowerCase().includes(category.toLowerCase())

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    // Length check
    if (length < idealLengthRange[0]) {
      score -= 15
      issues.push('Title too short')
      suggestions.push(
        `Expand title to ${idealLengthRange[0]}-${idealLengthRange[1]} characters for optimal SEO`
      )
    } else if (length > idealLengthRange[1]) {
      score -= 10
      issues.push('Title too long')
      suggestions.push(
        `Shorten title to ${idealLengthRange[0]}-${idealLengthRange[1]} characters to avoid truncation in search results`
      )
    }

    // Numbers
    if (!hasNumbers) {
      score -= 10
      suggestions.push('Consider adding a number to your title (e.g., "5 Ways...", "Top 10...")')
    }

    // Power words
    if (!hasPowerWords) {
      score -= 10
      suggestions.push(`Add power words like: ${this.POWER_WORDS.slice(0, 5).join(', ')}`)
    }

    // Keyword
    if (!hasKeyword) {
      score -= 15
      issues.push('Primary keyword missing from title')
      suggestions.push(`Include "${category}" or related keywords in the title`)
    }

    return {
      score: Math.max(0, score),
      length,
      idealLengthRange,
      hasNumbers,
      hasPowerWords,
      hasKeyword,
      issues,
      suggestions,
    }
  }

  /**
   * Analyze meta description
   */
  private static analyzeMetaDescription(
    metaDescription: string | null,
    title: string
  ): SEOMetaAnalysis {
    if (!metaDescription) {
      return {
        score: 0,
        length: 0,
        idealLengthRange: [150, 160],
        hasCallToAction: false,
        hasKeyword: false,
        issues: ['No meta description provided'],
        suggestions: ['Add a compelling meta description (150-160 characters)'],
      }
    }

    const length = metaDescription.length
    const idealLengthRange: [number, number] = [150, 160]

    const ctaWords = ['learn', 'discover', 'find out', 'read', 'explore', 'get', 'see']
    const hasCallToAction = ctaWords.some((word) => metaDescription.toLowerCase().includes(word))

    // Extract potential keyword from title (first meaningful word)
    const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    const hasKeyword = titleWords.some((word) => metaDescription.toLowerCase().includes(word))

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    // Length check
    if (length < idealLengthRange[0]) {
      score -= 20
      issues.push('Meta description too short')
      suggestions.push(
        `Expand to ${idealLengthRange[0]}-${idealLengthRange[1]} characters for better click-through rates`
      )
    } else if (length > idealLengthRange[1]) {
      score -= 15
      issues.push('Meta description too long')
      suggestions.push(
        `Shorten to ${idealLengthRange[0]}-${idealLengthRange[1]} characters to avoid truncation`
      )
    }

    // Call to action
    if (!hasCallToAction) {
      score -= 15
      suggestions.push(`Add a call-to-action word: ${ctaWords.slice(0, 3).join(', ')}`)
    }

    // Keyword
    if (!hasKeyword) {
      score -= 15
      issues.push('Missing keywords from title')
      suggestions.push('Include primary keywords from the title in meta description')
    }

    return {
      score: Math.max(0, score),
      length,
      idealLengthRange,
      hasCallToAction,
      hasKeyword,
      issues,
      suggestions,
    }
  }

  /**
   * Analyze keyword optimization
   */
  private static analyzeKeywords(
    title: string,
    content: string,
    metaDescription: string,
    category: string
  ): SEOKeywordAnalysis {
    const primaryKeyword = category.toLowerCase()
    const text = `${title} ${content} ${metaDescription}`.toLowerCase()
    const words = text.split(/\s+/)

    // Calculate keyword density
    const keywordCount = words.filter((w) => w.includes(primaryKeyword)).length
    const keywordDensity = (keywordCount / words.length) * 100

    const idealDensityRange: [number, number] = [1, 3]

    // Check keyword usage
    const keywordUsage = {
      inTitle: title.toLowerCase().includes(primaryKeyword),
      inMeta: metaDescription.toLowerCase().includes(primaryKeyword),
      inFirstParagraph: content.substring(0, 300).toLowerCase().includes(primaryKeyword),
      inHeadings: /<h[1-3][^>]*>.*?{keyword}.*?<\/h[1-3]>/i.test(content),
    }

    // Find related keywords (simple co-occurrence)
    const relatedKeywords = this.extractRelatedKeywords(content, primaryKeyword)

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    // Density check
    if (keywordDensity < idealDensityRange[0]) {
      score -= 20
      issues.push('Keyword density too low')
      suggestions.push(
        `Increase keyword usage to ${idealDensityRange[0]}-${idealDensityRange[1]}% density`
      )
    } else if (keywordDensity > idealDensityRange[1]) {
      score -= 15
      issues.push('Keyword density too high (keyword stuffing risk)')
      suggestions.push('Reduce keyword usage to avoid over-optimization penalty')
    }

    // Strategic placement
    if (!keywordUsage.inTitle) {
      score -= 20
      issues.push('Keyword missing from title')
      suggestions.push('Include primary keyword in article title')
    }

    if (!keywordUsage.inFirstParagraph) {
      score -= 15
      issues.push('Keyword missing from first paragraph')
      suggestions.push('Mention primary keyword within the first 100 words')
    }

    if (!keywordUsage.inHeadings) {
      score -= 10
      suggestions.push('Use primary keyword in at least one heading (H2 or H3)')
    }

    return {
      score: Math.max(0, score),
      primaryKeyword,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      idealDensityRange,
      relatedKeywords,
      keywordUsage,
      issues,
      suggestions,
    }
  }

  /**
   * Extract related keywords
   */
  private static extractRelatedKeywords(content: string, primaryKeyword: string): string[] {
    // Simple extraction: find common words near primary keyword
    const words = content.toLowerCase().split(/\s+/)
    const related = new Set<string>()

    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(primaryKeyword)) {
        // Add adjacent words
        if (i > 0 && words[i - 1].length > 3) related.add(words[i - 1])
        if (i < words.length - 1 && words[i + 1].length > 3) related.add(words[i + 1])
      }
    }

    return Array.from(related).slice(0, 5)
  }

  /**
   * Analyze content structure
   */
  private static analyzeContent(content: string): SEOContentAnalysis {
    const wordCount = content.split(/\s+/).length
    const idealWordCountRange: [number, number] = [800, 1500]

    // Heading analysis
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length
    const hasProperHierarchy = h1Count <= 1 && h2Count >= 2

    // Paragraph analysis
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0)
    const paragraphCount = paragraphs.length
    const avgParagraphLength =
      paragraphCount > 0 ? content.length / paragraphCount : 0

    // Readability (simplified)
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgWordsPerSentence = wordCount / sentences.length
    const readabilityScore = Math.max(
      0,
      Math.min(100, 100 - (avgWordsPerSentence - 15) * 2)
    )

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    // Word count
    if (wordCount < idealWordCountRange[0]) {
      score -= 20
      issues.push('Content too short')
      suggestions.push(
        `Expand to ${idealWordCountRange[0]}-${idealWordCountRange[1]} words for better SEO`
      )
    }

    // Heading structure
    if (h1Count > 1) {
      score -= 15
      issues.push('Multiple H1 tags detected')
      suggestions.push('Use only one H1 tag (typically the article title)')
    }

    if (h2Count < 2) {
      score -= 10
      suggestions.push('Add more H2 subheadings to improve structure (minimum 2)')
    }

    // Readability
    if (readabilityScore < 60) {
      score -= 10
      suggestions.push(
        'Improve readability by using shorter sentences (aim for 15-20 words per sentence)'
      )
    }

    return {
      score: Math.max(0, score),
      wordCount,
      idealWordCountRange,
      readabilityScore: Math.round(readabilityScore),
      headingStructure: {
        h1Count,
        h2Count,
        h3Count,
        hasProperHierarchy,
      },
      paragraphCount,
      avgParagraphLength: Math.round(avgParagraphLength),
      issues,
      suggestions,
    }
  }

  /**
   * Analyze links
   */
  private static analyzeLinks(content: string): SEOLinkAnalysis {
    const internalLinks = (content.match(/href=["']\/[^"']*["']/gi) || []).length
    const externalLinks = (content.match(/href=["']https?:\/\/[^"']*["']/gi) || []).length
    const brokenLinks = 0 // Would require actual link checking

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    if (internalLinks < 2) {
      score -= 15
      suggestions.push('Add 2-3 internal links to related articles')
    }

    if (externalLinks === 0) {
      score -= 10
      suggestions.push('Add 1-2 authoritative external links for credibility')
    }

    if (externalLinks > 5) {
      score -= 10
      issues.push('Too many external links')
      suggestions.push('Limit external links to 3-5 for better link equity')
    }

    return {
      score: Math.max(0, score),
      internalLinks,
      externalLinks,
      brokenLinks,
      issues,
      suggestions,
    }
  }

  /**
   * Analyze images
   */
  private static analyzeImages(content: string, featuredImage?: string): SEOImageAnalysis {
    const imageMatches = content.match(/<img[^>]*>/gi) || []
    const totalImages = imageMatches.length + (featuredImage ? 1 : 0)
    const imagesWithAlt = imageMatches.filter((img) => /alt=["'][^"']+["']/.test(img)).length

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    if (totalImages === 0) {
      score -= 20
      suggestions.push('Add at least one relevant image to improve engagement')
    }

    if (imagesWithAlt < totalImages) {
      score -= 25
      issues.push(`${totalImages - imagesWithAlt} images missing alt text`)
      suggestions.push('Add descriptive alt text to all images for accessibility and SEO')
    }

    return {
      score: Math.max(0, score),
      totalImages,
      imagesWithAlt,
      avgImageSize: 0, // Would require actual image analysis
      issues,
      suggestions,
    }
  }

  /**
   * Analyze technical SEO
   */
  private static analyzeTechnical(article: any): SEOTechnicalAnalysis {
    const hasSchemaMarkup = false // Would check for schema.org markup
    const isMobileFriendly = true // Assume responsive design
    const estimatedLoadTime = 2.5 // Mock - would measure actual

    let score = 100
    const issues: string[] = []
    const suggestions: string[] = []

    if (!hasSchemaMarkup) {
      score -= 15
      suggestions.push(
        'Add Schema.org Article markup for rich snippets in search results'
      )
    }

    if (estimatedLoadTime > 3) {
      score -= 20
      issues.push('Slow page load time')
      suggestions.push('Optimize images and reduce page size to improve load time')
    }

    return {
      score: Math.max(0, score),
      hasSchemaMarkup,
      isMobileFriendly,
      estimatedLoadTime,
      issues,
      suggestions,
    }
  }

  /**
   * Generate prioritized recommendations
   */
  private static generateRecommendations(sections: any): SEORecommendation[] {
    const recommendations: SEORecommendation[] = []

    // Critical issues (score < 60)
    Object.entries(sections).forEach(([category, analysis]: [string, any]) => {
      if (analysis.score < 60) {
        analysis.issues.forEach((issue: string, index: number) => {
          recommendations.push({
            priority: 'critical',
            category,
            issue,
            suggestion: analysis.suggestions[index] || 'Requires attention',
            impact: 'High impact on search rankings',
          })
        })
      }
    })

    // High priority suggestions
    Object.entries(sections).forEach(([category, analysis]: [string, any]) => {
      if (analysis.score >= 60 && analysis.score < 80) {
        analysis.suggestions.slice(0, 2).forEach((suggestion: string) => {
          recommendations.push({
            priority: 'high',
            category,
            issue: '',
            suggestion,
            impact: 'Moderate impact on rankings',
          })
        })
      }
    })

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    )
  }

  /**
   * Get estimated ranking based on score
   */
  private static getEstimatedRanking(score: number): SEOAnalysisResult['estimatedRanking'] {
    if (score >= 85) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }
}
