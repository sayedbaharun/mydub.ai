/**
 * Source Credibility Scoring Service
 * Phase 2.2.2: Dynamic credibility assessment for news sources
 *
 * Scoring Factors:
 * 1. Historical Accuracy (30%) - Fact-check history
 * 2. Editorial Standards (25%) - Corrections, retractions, citations
 * 3. Reliability (20%) - Uptime, fetch success rate
 * 4. Transparency (15%) - Source attribution, author disclosure
 * 5. Journalistic Integrity (10%) - Awards, certifications, reputation
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface CredibilityScore {
  overall: number // 0-100
  factors: {
    historicalAccuracy: number // 0-100
    editorialStandards: number // 0-100
    reliability: number // 0-100
    transparency: number // 0-100
    journalisticIntegrity: number // 0-100
  }
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  trustLevel: 'very-high' | 'high' | 'medium' | 'low' | 'very-low'
  lastUpdated: Date
  trends: CredibilityTrend[]
  warnings: string[]
}

export interface CredibilityTrend {
  date: Date
  score: number
  reason: string
}

export interface FactCheckResult {
  articleId: string
  sourceId: string
  claimAccurate: boolean
  verificationDate: Date
  verifiedBy: string
  confidence: number
}

export interface SourceCorrection {
  articleId: string
  sourceId: string
  correctionType: 'minor' | 'major' | 'retraction'
  originalClaim: string
  correctedClaim: string
  correctionDate: Date
}

export interface SourceMetrics {
  totalArticles: number
  factChecksPassed: number
  factChecksFailed: number
  correctionsIssued: number
  retractionsIssued: number
  avgCitationsPerArticle: number
  fetchSuccessRate: number
  avgResponseTime: number
}

// =============================================================================
// Source Credibility Service
// =============================================================================

export class SourceCredibilityService {
  private static readonly WEIGHTS = {
    historicalAccuracy: 0.30,
    editorialStandards: 0.25,
    reliability: 0.20,
    transparency: 0.15,
    journalisticIntegrity: 0.10,
  }

  /**
   * Calculate comprehensive credibility score for a source
   */
  static async calculateCredibilityScore(sourceId: string): Promise<CredibilityScore> {
    const metrics = await this.getSourceMetrics(sourceId)
    const factChecks = await this.getFactCheckHistory(sourceId)
    const corrections = await this.getCorrectionHistory(sourceId)

    // Calculate individual factors
    const historicalAccuracy = this.calculateHistoricalAccuracy(metrics, factChecks)
    const editorialStandards = this.calculateEditorialStandards(metrics, corrections)
    const reliability = this.calculateReliability(metrics)
    const transparency = this.calculateTransparency(metrics)
    const journalisticIntegrity = await this.calculateJournalisticIntegrity(sourceId)

    // Calculate weighted overall score
    const overall = Math.round(
      historicalAccuracy * this.WEIGHTS.historicalAccuracy +
        editorialStandards * this.WEIGHTS.editorialStandards +
        reliability * this.WEIGHTS.reliability +
        transparency * this.WEIGHTS.transparency +
        journalisticIntegrity * this.WEIGHTS.journalisticIntegrity
    )

    const grade = this.scoreToGrade(overall)
    const trustLevel = this.scoreToTrustLevel(overall)
    const warnings = this.generateWarnings(overall, metrics, corrections)
    const trends = await this.getCredibilityTrends(sourceId)

    // Save score to database
    await this.saveCredibilityScore(sourceId, overall, {
      historicalAccuracy,
      editorialStandards,
      reliability,
      transparency,
      journalisticIntegrity,
    })

    return {
      overall,
      factors: {
        historicalAccuracy,
        editorialStandards,
        reliability,
        transparency,
        journalisticIntegrity,
      },
      grade,
      trustLevel,
      lastUpdated: new Date(),
      trends,
      warnings,
    }
  }

  /**
   * Calculate historical accuracy based on fact-checks
   */
  private static calculateHistoricalAccuracy(
    metrics: SourceMetrics,
    factChecks: FactCheckResult[]
  ): number {
    if (factChecks.length === 0) {
      // No fact-check history - assume neutral
      return 70
    }

    const totalChecks = factChecks.length
    const passedChecks = factChecks.filter((fc) => fc.claimAccurate).length
    const accuracyRate = (passedChecks / totalChecks) * 100

    // Weight recent checks more heavily
    const recentChecks = factChecks.filter(
      (fc) => Date.now() - fc.verificationDate.getTime() < 90 * 24 * 60 * 60 * 1000 // 90 days
    )

    if (recentChecks.length >= 5) {
      const recentAccuracy = (recentChecks.filter((fc) => fc.claimAccurate).length / recentChecks.length) * 100
      return Math.round(accuracyRate * 0.6 + recentAccuracy * 0.4)
    }

    return Math.round(accuracyRate)
  }

  /**
   * Calculate editorial standards based on corrections
   */
  private static calculateEditorialStandards(
    metrics: SourceMetrics,
    corrections: SourceCorrection[]
  ): number {
    let score = 100

    // Penalty for corrections (but credit for transparency in issuing them)
    const correctionRate = metrics.totalArticles > 0 ? (metrics.correctionsIssued / metrics.totalArticles) * 100 : 0

    if (correctionRate > 5) {
      score -= 30 // High correction rate
    } else if (correctionRate > 2) {
      score -= 15 // Moderate correction rate
    } else if (correctionRate > 0) {
      score -= 5 // Low correction rate (actually positive - shows transparency)
    }

    // Heavy penalty for retractions
    const retractionRate = metrics.totalArticles > 0 ? (metrics.retractionsIssued / metrics.totalArticles) * 100 : 0

    if (retractionRate > 1) {
      score -= 50 // Very concerning
    } else if (retractionRate > 0.5) {
      score -= 25
    } else if (retractionRate > 0.1) {
      score -= 10
    }

    // Bonus for good citation practices
    if (metrics.avgCitationsPerArticle >= 5) {
      score += 10
    } else if (metrics.avgCitationsPerArticle >= 3) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate reliability based on fetch success rate
   */
  private static calculateReliability(metrics: SourceMetrics): number {
    let score = 0

    // Fetch success rate (0-60 points)
    score += metrics.fetchSuccessRate * 0.6

    // Response time (0-20 points)
    const responseTimeScore =
      metrics.avgResponseTime < 1000
        ? 20
        : metrics.avgResponseTime < 3000
        ? 15
        : metrics.avgResponseTime < 5000
        ? 10
        : 5

    score += responseTimeScore

    // Publishing frequency (0-20 points)
    const articlesPerDay = metrics.totalArticles / 30 // Last 30 days
    const frequencyScore =
      articlesPerDay >= 10
        ? 20
        : articlesPerDay >= 5
        ? 15
        : articlesPerDay >= 2
        ? 10
        : 5

    score += frequencyScore

    return Math.round(Math.min(100, score))
  }

  /**
   * Calculate transparency based on attribution
   */
  private static calculateTransparency(metrics: SourceMetrics): number {
    let score = 50 // Base score

    // Citation practices (0-30 points)
    if (metrics.avgCitationsPerArticle >= 7) {
      score += 30
    } else if (metrics.avgCitationsPerArticle >= 5) {
      score += 25
    } else if (metrics.avgCitationsPerArticle >= 3) {
      score += 15
    } else if (metrics.avgCitationsPerArticle >= 1) {
      score += 5
    }

    // Correction transparency (0-20 points)
    // Issuing corrections is good (shows transparency)
    if (metrics.correctionsIssued > 0 && metrics.correctionsIssued / metrics.totalArticles < 0.05) {
      score += 20 // Healthy correction rate
    } else if (metrics.correctionsIssued > 0) {
      score += 10 // Some corrections
    }

    return Math.min(100, score)
  }

  /**
   * Calculate journalistic integrity (awards, certifications)
   */
  private static async calculateJournalisticIntegrity(sourceId: string): Promise<number> {
    const { data: source } = await supabase
      .from('content_sources')
      .select('name, credibility_score')
      .eq('id', sourceId)
      .single()

    if (!source) return 50

    // Check if source is a recognized news organization
    const recognizedSources = [
      'Gulf News',
      'The National UAE',
      'Khaleej Times',
      'Dubai Media Office',
      'WAM (Emirates News Agency)',
    ]

    let score = 60 // Base score

    if (recognizedSources.includes(source.name)) {
      score += 30 // Established media organization
    }

    // Check for government/official sources
    if (source.name.toLowerCase().includes('government') ||
        source.name.toLowerCase().includes('official') ||
        source.name.toLowerCase().includes('media office')) {
      score += 40 // Official government source
    }

    return Math.min(100, score)
  }

  /**
   * Get source metrics
   */
  private static async getSourceMetrics(sourceId: string): Promise<SourceMetrics> {
    const { data: source } = await supabase
      .from('content_sources')
      .select('*')
      .eq('id', sourceId)
      .single()

    if (!source) {
      throw new Error('Source not found')
    }

    const totalFetches = (source.successful_fetches || 0) + (source.failed_fetches || 0)
    const fetchSuccessRate = totalFetches > 0 ? ((source.successful_fetches || 0) / totalFetches) * 100 : 0

    // Get article count for this source
    const { count: articleCount } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true })
      .eq('source_name', source.name)

    return {
      totalArticles: articleCount || source.total_articles_fetched || 0,
      factChecksPassed: 0, // Would be populated from fact_check_results table
      factChecksFailed: 0,
      correctionsIssued: 0, // Would be populated from corrections table
      retractionsIssued: 0,
      avgCitationsPerArticle: 3, // Placeholder - would analyze actual articles
      fetchSuccessRate,
      avgResponseTime: 2000, // Placeholder - would track actual response times
    }
  }

  /**
   * Get fact-check history for source
   */
  private static async getFactCheckHistory(sourceId: string): Promise<FactCheckResult[]> {
    // In production: query fact_check_results table
    // For now, return mock data based on source credibility

    const { data: source } = await supabase
      .from('content_sources')
      .select('credibility_score')
      .eq('id', sourceId)
      .single()

    if (!source) return []

    // Simulate fact-check history
    const checksCount = Math.floor(Math.random() * 20) + 10
    const passRate = source.credibility_score / 100

    return Array.from({ length: checksCount }, (_, i) => ({
      articleId: crypto.randomUUID(),
      sourceId,
      claimAccurate: Math.random() < passRate,
      verificationDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      verifiedBy: 'FactCheckTeam',
      confidence: 80 + Math.random() * 20,
    }))
  }

  /**
   * Get correction history for source
   */
  private static async getCorrectionHistory(sourceId: string): Promise<SourceCorrection[]> {
    // In production: query corrections table
    // For now, return empty array (no corrections recorded)
    return []
  }

  /**
   * Get credibility trends over time
   */
  private static async getCredibilityTrends(sourceId: string): Promise<CredibilityTrend[]> {
    // In production: query historical credibility scores
    // For now, generate sample trend
    const now = Date.now()
    return [
      {
        date: new Date(now - 30 * 24 * 60 * 60 * 1000),
        score: 85,
        reason: 'Initial assessment',
      },
      {
        date: new Date(now - 15 * 24 * 60 * 60 * 1000),
        score: 87,
        reason: 'Improved accuracy',
      },
      {
        date: new Date(now),
        score: 90,
        reason: 'Consistent performance',
      },
    ]
  }

  /**
   * Generate warnings based on credibility factors
   */
  private static generateWarnings(
    overall: number,
    metrics: SourceMetrics,
    corrections: SourceCorrection[]
  ): string[] {
    const warnings: string[] = []

    if (overall < 60) {
      warnings.push('Low overall credibility score - use with caution')
    }

    if (metrics.fetchSuccessRate < 80) {
      warnings.push('Unreliable source availability')
    }

    const retractionRate = metrics.totalArticles > 0 ? (metrics.retractionsIssued / metrics.totalArticles) * 100 : 0
    if (retractionRate > 0.5) {
      warnings.push('High retraction rate detected')
    }

    if (metrics.avgCitationsPerArticle < 2) {
      warnings.push('Poor source attribution practices')
    }

    return warnings
  }

  /**
   * Convert score to letter grade
   */
  private static scoreToGrade(score: number): CredibilityScore['grade'] {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Convert score to trust level
   */
  private static scoreToTrustLevel(score: number): CredibilityScore['trustLevel'] {
    if (score >= 90) return 'very-high'
    if (score >= 75) return 'high'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'low'
    return 'very-low'
  }

  /**
   * Save credibility score to database
   */
  private static async saveCredibilityScore(
    sourceId: string,
    score: number,
    factors: CredibilityScore['factors']
  ): Promise<void> {
    await supabase
      .from('content_sources')
      .update({
        credibility_score: score,
        fact_check_history: {
          lastUpdated: new Date().toISOString(),
          factors,
        },
      })
      .eq('id', sourceId)
  }

  /**
   * Get credibility rankings for all sources
   */
  static async getSourceRankings(): Promise<Array<{
    sourceId: string
    sourceName: string
    score: number
    grade: string
    trustLevel: string
  }>> {
    const { data: sources } = await supabase
      .from('content_sources')
      .select('*')
      .order('credibility_score', { ascending: false })

    if (!sources) return []

    return sources.map((source) => ({
      sourceId: source.id,
      sourceName: source.name,
      score: source.credibility_score,
      grade: this.scoreToGrade(source.credibility_score),
      trustLevel: this.scoreToTrustLevel(source.credibility_score),
    }))
  }

  /**
   * Recalculate all source credibility scores
   */
  static async recalculateAllScores(): Promise<void> {
    const { data: sources } = await supabase
      .from('content_sources')
      .select('id')

    if (!sources) return

    console.log(`🔄 Recalculating credibility for ${sources.length} sources...`)

    for (const source of sources) {
      try {
        await this.calculateCredibilityScore(source.id)
      } catch (error) {
        console.error(`Failed to calculate score for ${source.id}:`, error)
      }
    }

    console.log('✅ Credibility recalculation complete')
  }
}
