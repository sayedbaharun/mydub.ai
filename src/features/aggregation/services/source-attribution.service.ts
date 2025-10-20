/**
 * Source Attribution and Citation Service
 * Phase 2.2.4: Proper source attribution and citation system
 *
 * Features:
 * - Multi-source attribution tracking
 * - Citation generation (APA, MLA, Chicago styles)
 * - Source transparency reporting
 * - Attribution display components
 * - Citation verification and validation
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface SourceAttribution {
  articleId: string
  sourceId: string
  sourceName: string
  sourceUrl: string
  contributionType: 'primary' | 'supplementary' | 'verification' | 'quote'
  contributionPercentage: number // 0-100 (how much of article came from this source)
  citationText: string
  citationStyle: 'apa' | 'mla' | 'chicago'
  verifiedAt: Date
  credibilityScore: number
}

export interface Citation {
  id: string
  author?: string
  title: string
  sourceName: string
  publishDate: Date
  accessDate: Date
  url: string
  citationAPA: string
  citationMLA: string
  citationChicago: string
}

export interface AttributionReport {
  articleId: string
  totalSources: number
  primarySources: number
  supplementarySources: number
  citationStyle: 'apa' | 'mla' | 'chicago'
  attributions: SourceAttribution[]
  citations: Citation[]
  transparencyScore: number // 0-100 (how well sources are attributed)
}

export interface SourceContribution {
  sourceId: string
  sourceName: string
  excerpts: string[] // Text excerpts from this source
  percentage: number
  credibilityScore: number
}

// =============================================================================
// Source Attribution Service
// =============================================================================

export class SourceAttributionService {
  /**
   * Create attribution records for an article
   */
  static async createAttributions(
    articleId: string,
    contributions: SourceContribution[]
  ): Promise<SourceAttribution[]> {
    const attributions: SourceAttribution[] = []

    for (const contribution of contributions) {
      // Get source details
      const { data: source } = await supabase
        .from('content_sources')
        .select('*')
        .eq('id', contribution.sourceId)
        .single()

      if (!source) continue

      // Determine contribution type based on percentage
      let contributionType: SourceAttribution['contributionType'] = 'supplementary'
      if (contribution.percentage >= 60) {
        contributionType = 'primary'
      } else if (contribution.percentage >= 20) {
        contributionType = 'supplementary'
      } else {
        contributionType = 'verification'
      }

      // Generate citation
      const citation = await this.generateCitation({
        title: source.name,
        sourceName: source.name,
        publishDate: new Date(),
        accessDate: new Date(),
        url: source.url,
      })

      const attribution: SourceAttribution = {
        articleId,
        sourceId: contribution.sourceId,
        sourceName: contribution.sourceName,
        sourceUrl: source.url,
        contributionType,
        contributionPercentage: contribution.percentage,
        citationText: citation.citationAPA, // Default to APA
        citationStyle: 'apa',
        verifiedAt: new Date(),
        credibilityScore: contribution.credibilityScore,
      }

      attributions.push(attribution)

      // Save to database
      await this.saveAttribution(attribution)
    }

    return attributions
  }

  /**
   * Generate citations in multiple formats
   */
  static async generateCitation(params: {
    author?: string
    title: string
    sourceName: string
    publishDate: Date
    accessDate: Date
    url: string
  }): Promise<Citation> {
    const { author, title, sourceName, publishDate, accessDate, url } = params

    const year = publishDate.getFullYear()
    const month = publishDate.toLocaleString('en-US', { month: 'long' })
    const day = publishDate.getDate()

    const accessYear = accessDate.getFullYear()
    const accessMonth = accessDate.toLocaleString('en-US', { month: 'long' })
    const accessDay = accessDate.getDate()

    // APA Style: Author. (Year, Month Day). Title. Source Name. URL
    const citationAPA = author
      ? `${author}. (${year}, ${month} ${day}). ${title}. ${sourceName}. ${url}`
      : `${sourceName}. (${year}, ${month} ${day}). ${title}. ${url}`

    // MLA Style: Author. "Title." Source Name, Day Month Year, URL. Accessed Day Month Year.
    const citationMLA = author
      ? `${author}. "${title}." ${sourceName}, ${day} ${month} ${year}, ${url}. Accessed ${accessDay} ${accessMonth} ${accessYear}.`
      : `"${title}." ${sourceName}, ${day} ${month} ${year}, ${url}. Accessed ${accessDay} ${accessMonth} ${accessYear}.`

    // Chicago Style: Author. "Title." Source Name. Month Day, Year. URL.
    const citationChicago = author
      ? `${author}. "${title}." ${sourceName}. ${month} ${day}, ${year}. ${url}.`
      : `"${title}." ${sourceName}. ${month} ${day}, ${year}. ${url}.`

    return {
      id: crypto.randomUUID(),
      author,
      title,
      sourceName,
      publishDate,
      accessDate,
      url,
      citationAPA,
      citationMLA,
      citationChicago,
    }
  }

  /**
   * Get attribution report for an article
   */
  static async getAttributionReport(articleId: string): Promise<AttributionReport> {
    // Get article attributions from database
    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) {
      throw new Error('Article not found')
    }

    // In production: fetch from source_attributions table
    // For now, generate mock attributions based on source_name
    const attributions = await this.getArticleAttributions(articleId)

    const citations = await Promise.all(
      attributions.map((attr) =>
        this.generateCitation({
          title: article.title,
          sourceName: attr.sourceName,
          publishDate: new Date(article.published_at || Date.now()),
          accessDate: new Date(),
          url: attr.sourceUrl,
        })
      )
    )

    const totalSources = attributions.length
    const primarySources = attributions.filter((a) => a.contributionType === 'primary').length
    const supplementarySources = attributions.filter((a) => a.contributionType === 'supplementary').length

    // Calculate transparency score
    const transparencyScore = this.calculateTransparencyScore(attributions, article)

    return {
      articleId,
      totalSources,
      primarySources,
      supplementarySources,
      citationStyle: 'apa',
      attributions,
      citations,
      transparencyScore,
    }
  }

  /**
   * Calculate transparency score for attribution
   */
  private static calculateTransparencyScore(
    attributions: SourceAttribution[],
    article: any
  ): number {
    let score = 0

    // Base score: Has attributions (0-40 points)
    if (attributions.length > 0) {
      score += 20 // Has sources
      if (attributions.length >= 2) score += 10 // Multiple sources
      if (attributions.length >= 3) score += 10 // Diverse sources
    }

    // Citation quality (0-20 points)
    const avgCredibility = attributions.reduce((sum, a) => sum + a.credibilityScore, 0) / attributions.length
    score += Math.round(avgCredibility * 0.2)

    // Primary source attribution (0-20 points)
    const hasPrimarySource = attributions.some((a) => a.contributionType === 'primary')
    if (hasPrimarySource) score += 20

    // URL accessibility (0-10 points)
    const hasValidUrls = attributions.every((a) => a.sourceUrl && a.sourceUrl.startsWith('http'))
    if (hasValidUrls) score += 10

    // Source diversity (0-10 points)
    const uniqueSources = new Set(attributions.map((a) => a.sourceName)).size
    if (uniqueSources === attributions.length) score += 10 // All sources are unique

    return Math.min(100, score)
  }

  /**
   * Get attributions for an article
   */
  private static async getArticleAttributions(articleId: string): Promise<SourceAttribution[]> {
    // In production: query source_attributions table
    // For now, generate mock data based on article source

    const { data: article } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!article) return []

    // Mock attribution based on article's source_name
    const { data: source } = await supabase
      .from('content_sources')
      .select('*')
      .eq('name', article.source_name)
      .single()

    if (!source) return []

    return [
      {
        articleId,
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: article.source_url || source.url,
        contributionType: 'primary',
        contributionPercentage: 100,
        citationText: `${source.name}. ${new Date(article.published_at || Date.now()).getFullYear()}. "${article.title}." ${article.source_url || source.url}`,
        citationStyle: 'apa',
        verifiedAt: new Date(),
        credibilityScore: source.credibility_score,
      },
    ]
  }

  /**
   * Save attribution to database
   */
  private static async saveAttribution(attribution: SourceAttribution): Promise<void> {
    // In production: insert into source_attributions table
    // For now, log the attribution
    console.log('📚 Source Attribution Created:', {
      article: attribution.articleId,
      source: attribution.sourceName,
      type: attribution.contributionType,
      percentage: attribution.contributionPercentage,
    })
  }

  /**
   * Format attribution for display in article
   */
  static formatAttributionDisplay(attributions: SourceAttribution[]): string {
    if (attributions.length === 0) {
      return 'Sources not available'
    }

    if (attributions.length === 1) {
      const attr = attributions[0]
      return `Source: ${attr.sourceName}`
    }

    // Multiple sources
    const primarySources = attributions.filter((a) => a.contributionType === 'primary')
    const otherSources = attributions.filter((a) => a.contributionType !== 'primary')

    let display = ''

    if (primarySources.length > 0) {
      const names = primarySources.map((a) => a.sourceName).join(', ')
      display += `Primary Sources: ${names}`
    }

    if (otherSources.length > 0) {
      const names = otherSources.map((a) => a.sourceName).join(', ')
      if (display) display += '; '
      display += `Additional Sources: ${names}`
    }

    return display
  }

  /**
   * Validate citation format
   */
  static validateCitation(citation: string, style: 'apa' | 'mla' | 'chicago'): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Basic validation
    if (!citation || citation.trim().length === 0) {
      errors.push('Citation is empty')
      return { isValid: false, errors }
    }

    // Style-specific validation
    switch (style) {
      case 'apa':
        // APA should have: Author. (Year). Title. Source. URL
        if (!citation.includes('(') || !citation.includes(')')) {
          errors.push('APA citation missing year in parentheses')
        }
        if (!citation.includes('.')) {
          errors.push('APA citation missing periods')
        }
        break

      case 'mla':
        // MLA should have: Author. "Title." Source, Date, URL. Accessed Date.
        if (!citation.includes('"')) {
          errors.push('MLA citation missing quotation marks around title')
        }
        if (!citation.toLowerCase().includes('accessed')) {
          errors.push('MLA citation missing access date')
        }
        break

      case 'chicago':
        // Chicago should have: Author. "Title." Source. Date. URL.
        if (!citation.includes('"')) {
          errors.push('Chicago citation missing quotation marks around title')
        }
        break
    }

    // Check for URL
    if (!citation.includes('http://') && !citation.includes('https://')) {
      errors.push('Citation missing URL')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get citation statistics
   */
  static async getCitationStats(days: number = 30): Promise<{
    totalArticlesWithCitations: number
    avgSourcesPerArticle: number
    mostCitedSources: Array<{ sourceName: string; citationCount: number }>
    avgTransparencyScore: number
  }> {
    // In production: query from database
    // For now, return mock statistics

    const { data: articles } = await supabase
      .from('news_articles')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    const totalArticles = articles?.length || 0
    const articlesWithSources = articles?.filter((a) => a.source_name)?.length || 0

    // Mock data for most cited sources
    const sourceCounts: Record<string, number> = {}
    articles?.forEach((article) => {
      if (article.source_name) {
        sourceCounts[article.source_name] = (sourceCounts[article.source_name] || 0) + 1
      }
    })

    const mostCitedSources = Object.entries(sourceCounts)
      .map(([sourceName, citationCount]) => ({ sourceName, citationCount }))
      .sort((a, b) => b.citationCount - a.citationCount)
      .slice(0, 10)

    return {
      totalArticlesWithCitations: articlesWithSources,
      avgSourcesPerArticle: totalArticles > 0 ? articlesWithSources / totalArticles : 0,
      mostCitedSources,
      avgTransparencyScore: 85.5, // Mock average
    }
  }

  /**
   * Generate bibliography for article
   */
  static generateBibliography(
    citations: Citation[],
    style: 'apa' | 'mla' | 'chicago' = 'apa'
  ): string {
    if (citations.length === 0) {
      return 'No sources cited'
    }

    const heading = '**References**\n\n'
    let bibliography = heading

    citations.forEach((citation, index) => {
      let formattedCitation = ''

      switch (style) {
        case 'apa':
          formattedCitation = citation.citationAPA
          break
        case 'mla':
          formattedCitation = citation.citationMLA
          break
        case 'chicago':
          formattedCitation = citation.citationChicago
          break
      }

      bibliography += `${index + 1}. ${formattedCitation}\n\n`
    })

    return bibliography
  }
}
