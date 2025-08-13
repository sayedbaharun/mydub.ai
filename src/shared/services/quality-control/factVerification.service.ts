import { supabase } from '@/shared/lib/supabase'

export interface FactVerificationResult {
  overall_confidence: number
  total_claims: number
  verified_claims: number
  unverified_claims: number
  disputed_claims: number
  claim_details: FactClaim[]
  verification_sources: VerificationSource[]
  recommendations: string[]
  warnings: string[]
  requires_manual_review: boolean
}

export interface FactClaim {
  id: string
  claim_text: string
  claim_type: 'statistic' | 'date' | 'location' | 'person' | 'organization' | 'event' | 'general'
  confidence_score: number
  verification_status: 'verified' | 'unverified' | 'disputed' | 'pending'
  supporting_sources: string[]
  contradicting_sources: string[]
  verification_notes: string
  extracted_entities: ExtractedEntity[]
  context_importance: 'high' | 'medium' | 'low'
}

export interface ExtractedEntity {
  entity: string
  entity_type: 'person' | 'organization' | 'location' | 'date' | 'number' | 'event'
  confidence: number
  context: string
}

export interface VerificationSource {
  id: string
  name: string
  url: string
  reliability_score: number
  source_type: 'government' | 'news' | 'academic' | 'official' | 'social' | 'commercial'
  last_updated: string
  verification_method: 'api' | 'web_scraping' | 'manual' | 'database_lookup'
}

export interface TrustedSource {
  id: string
  name: string
  domain: string
  reliability_score: number
  source_type: string
  api_endpoint?: string
  api_key?: string
  active: boolean
  specialties: string[]
  geographic_focus: string[]
}

export class FactVerificationService {
  private readonly TRUSTED_SOURCES_UAE = [
    'government.ae',
    'dubai.ae',
    'adda.gov.ae',
    'mof.gov.ae',
    'ncema.gov.ae',
    'dha.gov.ae',
    'dewa.gov.ae',
    'khaleej.ae',
    'gulf-news.com',
    'thenational.ae',
    'emirates247.com',
    'timeoutdubai.com',
  ]

  private readonly FACT_PATTERNS = {
    statistics: /\b\d+(\.\d+)?(%|percent|percentage|million|billion|thousand|k|m|b)\b/gi,
    dates:
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4})\b/gi,
    locations:
      /\b(dubai|abu dhabi|sharjah|ajman|umm al quwain|ras al khaimah|fujairah|uae|emirates|middle east|gcc|gulf)\b/gi,
    organizations: /\b([A-Z][a-z]+ [A-Z][a-z]+( [A-Z][a-z]+)*|[A-Z]{2,})\b/g,
    people:
      /\b(sheikh|his highness|president|minister|director|ceo|founder)\s+[A-Z][a-z]+ [A-Z][a-z]+/gi,
    events:
      /\b(expo|festival|conference|summit|forum|world cup|olympics|ramadan|eid|national day)\b/gi,
  }

  private readonly CLAIM_INDICATORS = [
    'according to',
    'study shows',
    'research indicates',
    'data suggests',
    'statistics show',
    'survey found',
    'report states',
    'analysis reveals',
    'confirmed that',
    'announced that',
    'reported that',
    'estimated that',
    'projected that',
  ]

  private readonly HIGH_RISK_CLAIMS = [
    'always',
    'never',
    'all',
    'none',
    'every',
    'completely',
    'totally',
    'absolutely',
    'definitely',
    'certainly',
    'undoubtedly',
    'without question',
    'guaranteed',
    'proven',
    'scientific fact',
    'experts agree',
  ]

  async verifyContent(content: {
    id: string
    title: string
    content: string
    content_type: string
    source_url?: string
    publication_date?: string
  }): Promise<FactVerificationResult> {
    try {
      // Extract claims from content
      const claims = await this.extractClaims(content)

      // Verify each claim
      const verifiedClaims = await Promise.all(claims.map((claim) => this.verifyClaim(claim)))

      // Get verification sources
      const verificationSources = await this.getVerificationSources(content.content_type)

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(verifiedClaims)

      // Generate recommendations and warnings
      const recommendations = this.generateRecommendations(verifiedClaims, content)
      const warnings = this.generateWarnings(verifiedClaims, content)

      // Determine if manual review is required
      const requiresManualReview = this.requiresManualReview(verifiedClaims, overallConfidence)

      const result: FactVerificationResult = {
        overall_confidence: overallConfidence,
        total_claims: verifiedClaims.length,
        verified_claims: verifiedClaims.filter((c) => c.verification_status === 'verified').length,
        unverified_claims: verifiedClaims.filter((c) => c.verification_status === 'unverified')
          .length,
        disputed_claims: verifiedClaims.filter((c) => c.verification_status === 'disputed').length,
        claim_details: verifiedClaims,
        verification_sources: verificationSources,
        recommendations,
        warnings,
        requires_manual_review: requiresManualReview,
      }

      // Store verification result
      await this.storeVerificationResult(content.id, result)

      return result
    } catch (error) {
      console.error('Error in fact verification:', error)
      throw error
    }
  }

  async verifySpecificClaim(claimText: string, context?: string): Promise<FactClaim> {
    const claim = await this.createFactClaim(claimText, context || '')
    return this.verifyClaim(claim)
  }

  async checkGovernmentData(
    query: string,
    dataType: 'statistics' | 'regulations' | 'announcements'
  ): Promise<{
    found: boolean
    data: any[]
    source: string
    confidence: number
  }> {
    try {
      // Check UAE government data sources
      const governmentSources = await this.getTrustedSources(['government'])

      for (const source of governmentSources) {
        if (source.api_endpoint) {
          const result = await this.queryGovernmentAPI(source, query, dataType)
          if (result.found) {
            return result
          }
        }
      }

      // Fallback to web scraping government websites
      const webResult = await this.scrapeGovernmentWebsites(query, dataType)
      return webResult
    } catch (error) {
      console.error('Error checking government data:', error)
      return { found: false, data: [], source: '', confidence: 0 }
    }
  }

  async crossReferenceNews(
    claim: string,
    timeframe: number = 30
  ): Promise<{
    supporting_articles: Array<{ title: string; url: string; date: string; source: string }>
    contradicting_articles: Array<{ title: string; url: string; date: string; source: string }>
    confidence: number
  }> {
    try {
      // Search trusted news sources
      const newsQuery = this.createNewsQuery(claim)
      const since = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)

      const trustedNewsSources = await this.getTrustedSources(['news'])

      const supporting: any[] = []
      const contradicting: any[] = []

      for (const source of trustedNewsSources) {
        const articles = await this.searchNewsSource(source, newsQuery, since)

        for (const article of articles) {
          const relevance = await this.calculateRelevance(claim, article.content)

          if (relevance > 0.7) {
            supporting.push({
              title: article.title,
              url: article.url,
              date: article.date,
              source: source.name,
            })
          } else if (relevance < -0.3) {
            contradicting.push({
              title: article.title,
              url: article.url,
              date: article.date,
              source: source.name,
            })
          }
        }
      }

      const confidence = this.calculateNewsConfidence(supporting, contradicting)

      return {
        supporting_articles: supporting,
        contradicting_articles: contradicting,
        confidence,
      }
    } catch (error) {
      console.error('Error cross-referencing news:', error)
      return { supporting_articles: [], contradicting_articles: [], confidence: 0 }
    }
  }

  private async extractClaims(content: {
    title: string
    content: string
    content_type: string
  }): Promise<FactClaim[]> {
    const claims: FactClaim[] = []
    const text = `${content.title} ${content.content}`

    // Extract sentences with claim indicators
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()

      // Check for claim indicators
      const hasClaimIndicator = this.CLAIM_INDICATORS.some((indicator) =>
        trimmedSentence.toLowerCase().includes(indicator)
      )

      // Check for factual patterns
      const hasFactualPattern = Object.values(this.FACT_PATTERNS).some((pattern) =>
        pattern.test(trimmedSentence)
      )

      // Check for high-risk claims
      const hasHighRiskClaim = this.HIGH_RISK_CLAIMS.some((risk) =>
        trimmedSentence.toLowerCase().includes(risk)
      )

      if (hasClaimIndicator || hasFactualPattern || hasHighRiskClaim) {
        const claim = await this.createFactClaim(trimmedSentence, content.content_type)
        claims.push(claim)
      }
    }

    return claims
  }

  private async createFactClaim(claimText: string, context: string): Promise<FactClaim> {
    const claimType = this.determineClaimType(claimText)
    const entities = this.extractEntities(claimText)
    const importance = this.assessClaimImportance(claimText, context)

    return {
      id: crypto.randomUUID(),
      claim_text: claimText,
      claim_type: claimType,
      confidence_score: 0,
      verification_status: 'pending',
      supporting_sources: [],
      contradicting_sources: [],
      verification_notes: '',
      extracted_entities: entities,
      context_importance: importance,
    }
  }

  private async verifyClaim(claim: FactClaim): Promise<FactClaim> {
    try {
      let verificationScore = 0
      let supportingCount = 0
      let contradictingCount = 0

      // Check against trusted sources
      const trustedSources = await this.getTrustedSources()

      for (const source of trustedSources) {
        const verification = await this.checkAgainstSource(claim, source)

        if (verification.supports) {
          supportingCount++
          verificationScore += source.reliability_score
          claim.supporting_sources.push(source.domain)
        } else if (verification.contradicts) {
          contradictingCount++
          verificationScore -= source.reliability_score
          claim.contradicting_sources.push(source.domain)
        }
      }

      // Verify specific claim types
      if (claim.claim_type === 'date') {
        const dateVerification = await this.verifyDate(claim)
        verificationScore += dateVerification.score
        claim.verification_notes += dateVerification.notes
      } else if (claim.claim_type === 'location') {
        const locationVerification = await this.verifyLocation(claim)
        verificationScore += locationVerification.score
        claim.verification_notes += locationVerification.notes
      } else if (claim.claim_type === 'statistic') {
        const statisticVerification = await this.verifyStatistic(claim)
        verificationScore += statisticVerification.score
        claim.verification_notes += statisticVerification.notes
      }

      // Calculate final confidence score
      const maxPossibleScore = trustedSources.length * 100
      claim.confidence_score = Math.max(
        0,
        Math.min(100, (verificationScore / maxPossibleScore) * 100)
      )

      // Determine verification status
      if (claim.confidence_score >= 80) {
        claim.verification_status = 'verified'
      } else if (claim.confidence_score >= 50) {
        claim.verification_status = 'unverified'
      } else if (contradictingCount > supportingCount) {
        claim.verification_status = 'disputed'
      } else {
        claim.verification_status = 'unverified'
      }

      return claim
    } catch (error) {
      console.error('Error verifying claim:', error)
      claim.verification_status = 'unverified'
      claim.verification_notes = 'Verification error occurred'
      return claim
    }
  }

  private determineClaimType(claimText: string): FactClaim['claim_type'] {
    const text = claimText.toLowerCase()

    if (this.FACT_PATTERNS.statistics.test(text)) return 'statistic'
    if (this.FACT_PATTERNS.dates.test(text)) return 'date'
    if (this.FACT_PATTERNS.locations.test(text)) return 'location'
    if (this.FACT_PATTERNS.people.test(text)) return 'person'
    if (this.FACT_PATTERNS.organizations.test(text)) return 'organization'
    if (this.FACT_PATTERNS.events.test(text)) return 'event'

    return 'general'
  }

  private extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []

    // Extract different types of entities
    const entityTypes = [
      { type: 'person', pattern: this.FACT_PATTERNS.people },
      { type: 'location', pattern: this.FACT_PATTERNS.locations },
      { type: 'organization', pattern: this.FACT_PATTERNS.organizations },
      { type: 'event', pattern: this.FACT_PATTERNS.events },
      { type: 'date', pattern: this.FACT_PATTERNS.dates },
      { type: 'number', pattern: this.FACT_PATTERNS.statistics },
    ]

    for (const entityType of entityTypes) {
      const matches = text.match(entityType.pattern)
      if (matches) {
        for (const match of matches) {
          entities.push({
            entity: match,
            entity_type: entityType.type as ExtractedEntity['entity_type'],
            confidence: 0.8,
            context: text.substring(
              Math.max(0, text.indexOf(match) - 50),
              Math.min(text.length, text.indexOf(match) + match.length + 50)
            ),
          })
        }
      }
    }

    return entities
  }

  private assessClaimImportance(claimText: string, context: string): 'high' | 'medium' | 'low' {
    const text = claimText.toLowerCase()

    // High importance indicators
    if (
      text.includes('death') ||
      text.includes('injury') ||
      text.includes('emergency') ||
      text.includes('outbreak') ||
      text.includes('crisis') ||
      text.includes('government') ||
      text.includes('policy') ||
      text.includes('law') ||
      text.includes('regulation')
    ) {
      return 'high'
    }

    // Medium importance indicators
    if (
      text.includes('announcement') ||
      text.includes('launch') ||
      text.includes('opening') ||
      text.includes('event') ||
      text.includes('statistics') ||
      text.includes('report')
    ) {
      return 'medium'
    }

    return 'low'
  }

  private async getTrustedSources(types?: string[]): Promise<TrustedSource[]> {
    let query = supabase.from('trusted_sources').select('*').eq('active', true)

    if (types && types.length > 0) {
      query = query.in('source_type', types)
    }

    const { data } = await query
    return data || []
  }

  private async checkAgainstSource(
    claim: FactClaim,
    source: TrustedSource
  ): Promise<{
    supports: boolean
    contradicts: boolean
    confidence: number
  }> {
    try {
      if (source.api_endpoint) {
        return await this.checkViaAPI(claim, source)
      } else {
        return await this.checkViaWebScraping(claim, source)
      }
    } catch (error) {
      console.error(`Error checking against source ${source.name}:`, error)
      return { supports: false, contradicts: false, confidence: 0 }
    }
  }

  private async checkViaAPI(
    claim: FactClaim,
    source: TrustedSource
  ): Promise<{
    supports: boolean
    contradicts: boolean
    confidence: number
  }> {
    // This would implement actual API calls to fact-checking services
    // For now, return a mock response
    return { supports: false, contradicts: false, confidence: 0 }
  }

  private async checkViaWebScraping(
    claim: FactClaim,
    source: TrustedSource
  ): Promise<{
    supports: boolean
    contradicts: boolean
    confidence: number
  }> {
    // This would implement web scraping of trusted sources
    // For now, return a mock response
    return { supports: false, contradicts: false, confidence: 0 }
  }

  private async verifyDate(claim: FactClaim): Promise<{ score: number; notes: string }> {
    const dateMatches = claim.claim_text.match(this.FACT_PATTERNS.dates)
    if (!dateMatches) return { score: 0, notes: 'No date found' }

    const extractedDate = dateMatches[0]
    const parsedDate = new Date(extractedDate)

    if (isNaN(parsedDate.getTime())) {
      return { score: -10, notes: 'Invalid date format' }
    }

    const now = new Date()
    const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    if (parsedDate > futureDate) {
      return { score: -5, notes: 'Date is too far in the future' }
    }

    return { score: 10, notes: 'Date format is valid' }
  }

  private async verifyLocation(claim: FactClaim): Promise<{ score: number; notes: string }> {
    const locationMatches = claim.claim_text.match(this.FACT_PATTERNS.locations)
    if (!locationMatches) return { score: 0, notes: 'No location found' }

    const extractedLocation = locationMatches[0].toLowerCase()

    // Check against known UAE locations
    const uaeLocations = [
      'dubai',
      'abu dhabi',
      'sharjah',
      'ajman',
      'umm al quwain',
      'ras al khaimah',
      'fujairah',
      'uae',
      'emirates',
    ]

    if (uaeLocations.includes(extractedLocation)) {
      return { score: 10, notes: 'Location is a valid UAE location' }
    }

    return { score: 5, notes: 'Location exists but not specifically UAE' }
  }

  private async verifyStatistic(claim: FactClaim): Promise<{ score: number; notes: string }> {
    const statisticMatches = claim.claim_text.match(this.FACT_PATTERNS.statistics)
    if (!statisticMatches) return { score: 0, notes: 'No statistics found' }

    let score = 0
    let notes = ''

    for (const stat of statisticMatches) {
      const numericValue = parseFloat(stat.replace(/[^\d.]/g, ''))

      // Check for reasonable ranges
      if (stat.includes('%') || stat.includes('percent')) {
        if (numericValue > 100) {
          score -= 5
          notes += 'Percentage over 100% detected. '
        } else {
          score += 5
        }
      }

      // Check for suspiciously precise numbers
      if (stat.includes('.') && stat.split('.')[1].length > 2) {
        score -= 2
        notes += 'Suspiciously precise statistic. '
      }
    }

    return { score, notes }
  }

  private calculateOverallConfidence(claims: FactClaim[]): number {
    if (claims.length === 0) return 100 // No claims = no verification needed

    const totalWeight = claims.reduce((sum, claim) => {
      const weight =
        claim.context_importance === 'high' ? 3 : claim.context_importance === 'medium' ? 2 : 1
      return sum + weight
    }, 0)

    const weightedScore = claims.reduce((sum, claim) => {
      const weight =
        claim.context_importance === 'high' ? 3 : claim.context_importance === 'medium' ? 2 : 1
      return sum + claim.confidence_score * weight
    }, 0)

    return Math.round(weightedScore / totalWeight)
  }

  private generateRecommendations(claims: FactClaim[], content: any): string[] {
    const recommendations: string[] = []

    const unverifiedClaims = claims.filter((c) => c.verification_status === 'unverified')
    const disputedClaims = claims.filter((c) => c.verification_status === 'disputed')

    if (unverifiedClaims.length > 0) {
      recommendations.push(`${unverifiedClaims.length} claims need verification`)
    }

    if (disputedClaims.length > 0) {
      recommendations.push(`${disputedClaims.length} claims are disputed and need review`)
    }

    const highImportanceClaims = claims.filter((c) => c.context_importance === 'high')
    if (highImportanceClaims.length > 0) {
      recommendations.push('High-importance claims require careful verification')
    }

    if (claims.length > 10) {
      recommendations.push(
        'Large number of claims detected - consider breaking into smaller pieces'
      )
    }

    return recommendations
  }

  private generateWarnings(claims: FactClaim[], content: any): string[] {
    const warnings: string[] = []

    const disputedClaims = claims.filter((c) => c.verification_status === 'disputed')
    if (disputedClaims.length > 0) {
      warnings.push(`${disputedClaims.length} claims are disputed by trusted sources`)
    }

    const lowConfidenceClaims = claims.filter((c) => c.confidence_score < 50)
    if (lowConfidenceClaims.length > 0) {
      warnings.push(`${lowConfidenceClaims.length} claims have low confidence scores`)
    }

    const highRiskClaims = claims.filter((c) =>
      this.HIGH_RISK_CLAIMS.some((risk) => c.claim_text.toLowerCase().includes(risk))
    )
    if (highRiskClaims.length > 0) {
      warnings.push(`${highRiskClaims.length} claims use absolute language`)
    }

    return warnings
  }

  private requiresManualReview(claims: FactClaim[], overallConfidence: number): boolean {
    if (overallConfidence < 70) return true
    if (claims.some((c) => c.verification_status === 'disputed')) return true
    if (claims.some((c) => c.context_importance === 'high' && c.confidence_score < 80)) return true
    return false
  }

  private async storeVerificationResult(
    contentId: string,
    result: FactVerificationResult
  ): Promise<void> {
    await supabase.from('fact_verification_results').upsert({
      content_id: contentId,
      overall_confidence: result.overall_confidence,
      total_claims: result.total_claims,
      verified_claims: result.verified_claims,
      unverified_claims: result.unverified_claims,
      disputed_claims: result.disputed_claims,
      claim_details: result.claim_details,
      verification_sources: result.verification_sources,
      recommendations: result.recommendations,
      warnings: result.warnings,
      requires_manual_review: result.requires_manual_review,
      verified_at: new Date().toISOString(),
    })
  }

  private async queryGovernmentAPI(
    source: TrustedSource,
    query: string,
    dataType: string
  ): Promise<any> {
    // Implementation would depend on specific government APIs
    return { found: false, data: [], source: source.name, confidence: 0 }
  }

  private async scrapeGovernmentWebsites(query: string, dataType: string): Promise<any> {
    // Implementation would scrape government websites
    return { found: false, data: [], source: 'government_websites', confidence: 0 }
  }

  private createNewsQuery(claim: string): string {
    const entities = this.extractEntities(claim)
    const keywords = entities.map((e) => e.entity).join(' ')
    return keywords || claim.substring(0, 100)
  }

  private async searchNewsSource(
    source: TrustedSource,
    query: string,
    since: Date
  ): Promise<any[]> {
    // Implementation would search news sources
    return []
  }

  private async calculateRelevance(claim: string, articleContent: string): Promise<number> {
    // Simple relevance calculation based on keyword overlap
    const claimWords = claim.toLowerCase().split(/\s+/)
    const articleWords = articleContent.toLowerCase().split(/\s+/)

    const intersection = claimWords.filter((word) => articleWords.includes(word))
    return intersection.length / Math.max(claimWords.length, articleWords.length)
  }

  private calculateNewsConfidence(supporting: any[], contradicting: any[]): number {
    const totalSources = supporting.length + contradicting.length
    if (totalSources === 0) return 0

    const supportingScore = supporting.length / totalSources
    const contradictingScore = contradicting.length / totalSources

    return Math.round((supportingScore - contradictingScore) * 100)
  }

  private async getVerificationSources(contentType: string): Promise<VerificationSource[]> {
    const trustedSources = await this.getTrustedSources()

    return trustedSources.map((source) => ({
      id: source.id,
      name: source.name,
      url: source.domain,
      reliability_score: source.reliability_score,
      source_type: source.source_type as VerificationSource['source_type'],
      last_updated: new Date().toISOString(),
      verification_method: source.api_endpoint ? 'api' : 'web_scraping',
    }))
  }
}

export const factVerificationService = new FactVerificationService()
