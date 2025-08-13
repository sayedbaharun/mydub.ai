import { supabase } from '@/shared/lib/supabase'
import crypto from 'crypto'

export interface DuplicateDetectionResult {
  is_duplicate: boolean
  similarity_score: number
  duplicate_type: 'exact' | 'near_duplicate' | 'similar_content' | 'none'
  matches: DuplicateMatch[]
  content_fingerprint: string
  recommendations: string[]
  warnings: string[]
}

export interface DuplicateMatch {
  content_id: string
  title: string
  similarity_score: number
  match_type: 'exact' | 'near_duplicate' | 'similar_content'
  matched_sections: string[]
  content_type: string
  published_at?: string
  url?: string
}

export interface ContentFingerprint {
  content_id: string
  content_hash: string
  title_hash: string
  semantic_hash: string
  image_hashes: string[]
  url_hash?: string
  created_at: string
  content_type: string
  word_count: number
  key_phrases: string[]
}

export interface SimilarityThresholds {
  exact_match: number
  near_duplicate: number
  similar_content: number
  title_similarity: number
  image_similarity: number
}

export class DuplicateDetectionService {
  private readonly SIMILARITY_THRESHOLDS: SimilarityThresholds = {
    exact_match: 0.95,
    near_duplicate: 0.85,
    similar_content: 0.70,
    title_similarity: 0.80,
    image_similarity: 0.90
  }

  private readonly STOP_WORDS = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]

  async detectDuplicates(content: {
    id: string
    title: string
    content: string
    content_type: string
    images?: string[]
    url?: string
  }): Promise<DuplicateDetectionResult> {
    try {
      // Generate content fingerprint
      const fingerprint = await this.generateContentFingerprint(content)

      // Check for exact matches first
      const exactMatches = await this.findExactMatches(fingerprint)
      if (exactMatches.length > 0) {
        return this.buildDuplicateResult(exactMatches, 'exact', fingerprint)
      }

      // Check for near duplicates
      const nearDuplicates = await this.findNearDuplicates(fingerprint)
      if (nearDuplicates.length > 0) {
        return this.buildDuplicateResult(nearDuplicates, 'near_duplicate', fingerprint)
      }

      // Check for similar content
      const similarContent = await this.findSimilarContent(fingerprint)
      if (similarContent.length > 0) {
        return this.buildDuplicateResult(similarContent, 'similar_content', fingerprint)
      }

      // Store fingerprint for future comparisons
      await this.storeContentFingerprint(fingerprint)

      return {
        is_duplicate: false,
        similarity_score: 0,
        duplicate_type: 'none',
        matches: [],
        content_fingerprint: fingerprint.content_hash,
        recommendations: [],
        warnings: []
      }
    } catch (error) {
      console.error('Error in duplicate detection:', error)
      throw error
    }
  }

  async findSimilarArticles(contentId: string, limit: number = 10): Promise<DuplicateMatch[]> {
    try {
      const { data: content } = await supabase
        .from('ai_generated_content')
        .select('title, content, content_type, images, url')
        .eq('id', contentId)
        .single()

      if (!content) throw new Error('Content not found')

      const fingerprint = await this.generateContentFingerprint({
        id: contentId,
        ...content
      })

      const similarContent = await this.findSimilarContent(fingerprint, limit)
      return similarContent
    } catch (error) {
      console.error('Error finding similar articles:', error)
      throw error
    }
  }

  async detectImageDuplicates(imageUrls: string[]): Promise<{
    is_duplicate: boolean
    matches: Array<{ image_url: string; similarity_score: number; matched_content_id: string }>
  }> {
    try {
      const imageHashes = await Promise.all(
        imageUrls.map(url => this.generateImageHash(url))
      )

      const matches = []
      for (let i = 0; i < imageHashes.length; i++) {
        const hash = imageHashes[i]
        const { data: similarImages } = await supabase
          .from('content_fingerprints')
          .select('content_id, image_hashes')
          .contains('image_hashes', [hash])

        if (similarImages && similarImages.length > 0) {
          matches.push({
            image_url: imageUrls[i],
            similarity_score: 1.0, // Exact hash match
            matched_content_id: similarImages[0].content_id
          })
        }
      }

      return {
        is_duplicate: matches.length > 0,
        matches
      }
    } catch (error) {
      console.error('Error detecting image duplicates:', error)
      throw error
    }
  }

  async detectUrlDuplicates(url: string): Promise<{
    is_duplicate: boolean
    matches: Array<{ content_id: string; title: string; published_at?: string }>
  }> {
    try {
      const urlHash = this.generateTextHash(this.normalizeUrl(url))
      
      const { data: matches } = await supabase
        .from('content_fingerprints')
        .select('content_id')
        .eq('url_hash', urlHash)

      if (!matches || matches.length === 0) {
        return { is_duplicate: false, matches: [] }
      }

      const contentIds = matches.map(m => m.content_id)
      const { data: contentDetails } = await supabase
        .from('ai_generated_content')
        .select('id, title, published_at')
        .in('id', contentIds)

      return {
        is_duplicate: true,
        matches: contentDetails || []
      }
    } catch (error) {
      console.error('Error detecting URL duplicates:', error)
      throw error
    }
  }

  async clusterSimilarContent(contentType?: string): Promise<Array<{
    cluster_id: string
    topic: string
    content_ids: string[]
    similarity_score: number
    representative_content: {
      id: string
      title: string
      excerpt: string
    }
  }>> {
    try {
      // Get all content fingerprints
      let query = supabase
        .from('content_fingerprints')
        .select('content_id, key_phrases, word_count, content_type')

      if (contentType) {
        query = query.eq('content_type', contentType)
      }

      const { data: fingerprints } = await query

      if (!fingerprints || fingerprints.length < 2) {
        return []
      }

      // Simple clustering based on key phrases similarity
      const clusters = await this.performTopicClustering(fingerprints)

      // Get representative content for each cluster
      const clustersWithDetails = await Promise.all(
        clusters.map(async (cluster) => {
          const { data: contentDetails } = await supabase
            .from('ai_generated_content')
            .select('id, title, excerpt')
            .in('id', cluster.content_ids)
            .limit(1)

          return {
            cluster_id: cluster.cluster_id,
            topic: cluster.topic,
            content_ids: cluster.content_ids,
            similarity_score: cluster.similarity_score,
            representative_content: contentDetails?.[0] || {
              id: cluster.content_ids[0],
              title: 'Unknown Title',
              excerpt: 'No excerpt available'
            }
          }
        })
      )

      return clustersWithDetails
    } catch (error) {
      console.error('Error clustering similar content:', error)
      throw error
    }
  }

  private async generateContentFingerprint(content: {
    id: string
    title: string
    content: string
    content_type: string
    images?: string[]
    url?: string
  }): Promise<ContentFingerprint> {
    const normalizedContent = this.normalizeText(content.content)
    const normalizedTitle = this.normalizeText(content.title)
    
    const contentHash = this.generateTextHash(normalizedContent)
    const titleHash = this.generateTextHash(normalizedTitle)
    const semanticHash = this.generateSemanticHash(normalizedContent)
    
    const imageHashes = content.images ? 
      await Promise.all(content.images.map(img => this.generateImageHash(img))) : []
    
    const urlHash = content.url ? this.generateTextHash(this.normalizeUrl(content.url)) : undefined

    const keyPhrases = this.extractKeyPhrases(normalizedContent)
    const wordCount = normalizedContent.split(/\s+/).filter(w => w.length > 0).length

    return {
      content_id: content.id,
      content_hash: contentHash,
      title_hash: titleHash,
      semantic_hash: semanticHash,
      image_hashes: imageHashes,
      url_hash: urlHash,
      created_at: new Date().toISOString(),
      content_type: content.content_type,
      word_count: wordCount,
      key_phrases: keyPhrases
    }
  }

  private async findExactMatches(fingerprint: ContentFingerprint): Promise<DuplicateMatch[]> {
    const { data: matches } = await supabase
      .from('content_fingerprints')
      .select('content_id, content_type')
      .eq('content_hash', fingerprint.content_hash)
      .neq('content_id', fingerprint.content_id)

    if (!matches || matches.length === 0) return []

    return this.buildMatchDetails(matches, 1.0, 'exact')
  }

  private async findNearDuplicates(fingerprint: ContentFingerprint): Promise<DuplicateMatch[]> {
    // Check title similarity first
    const { data: titleMatches } = await supabase
      .from('content_fingerprints')
      .select('content_id, title_hash, content_type')
      .eq('title_hash', fingerprint.title_hash)
      .neq('content_id', fingerprint.content_id)

    if (titleMatches && titleMatches.length > 0) {
      return this.buildMatchDetails(titleMatches, 0.9, 'near_duplicate')
    }

    // Check semantic similarity
    const { data: semanticMatches } = await supabase
      .from('content_fingerprints')
      .select('content_id, semantic_hash, content_type')
      .eq('semantic_hash', fingerprint.semantic_hash)
      .neq('content_id', fingerprint.content_id)

    if (semanticMatches && semanticMatches.length > 0) {
      return this.buildMatchDetails(semanticMatches, 0.85, 'near_duplicate')
    }

    return []
  }

  private async findSimilarContent(fingerprint: ContentFingerprint, limit: number = 5): Promise<DuplicateMatch[]> {
    // Find content with similar key phrases
    const { data: allFingerprints } = await supabase
      .from('content_fingerprints')
      .select('content_id, key_phrases, content_type, word_count')
      .eq('content_type', fingerprint.content_type)
      .neq('content_id', fingerprint.content_id)

    if (!allFingerprints || allFingerprints.length === 0) return []

    const similarities = allFingerprints.map(fp => {
      const similarity = this.calculatePhraseSimilarity(fingerprint.key_phrases, fp.key_phrases)
      return {
        content_id: fp.content_id,
        similarity_score: similarity,
        content_type: fp.content_type
      }
    })

    const significantMatches = similarities
      .filter(s => s.similarity_score >= this.SIMILARITY_THRESHOLDS.similar_content)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit)

    return this.buildMatchDetails(significantMatches, 0, 'similar_content')
  }

  private async buildMatchDetails(
    matches: Array<{ content_id: string; similarity_score?: number; content_type: string }>,
    defaultScore: number,
    matchType: 'exact' | 'near_duplicate' | 'similar_content'
  ): Promise<DuplicateMatch[]> {
    const contentIds = matches.map(m => m.content_id)
    
    const { data: contentDetails } = await supabase
      .from('ai_generated_content')
      .select('id, title, published_at, metadata')
      .in('id', contentIds)

    if (!contentDetails) return []

    return contentDetails.map(content => {
      const match = matches.find(m => m.content_id === content.id)
      return {
        content_id: content.id,
        title: content.title,
        similarity_score: match?.similarity_score || defaultScore,
        match_type: matchType,
        matched_sections: [], // Would be populated with actual matching sections
        content_type: match?.content_type || 'unknown',
        published_at: content.published_at,
        url: content.metadata?.url
      }
    })
  }

  private buildDuplicateResult(
    matches: DuplicateMatch[],
    duplicateType: 'exact' | 'near_duplicate' | 'similar_content',
    fingerprint: ContentFingerprint
  ): DuplicateDetectionResult {
    const highestSimilarity = Math.max(...matches.map(m => m.similarity_score))
    
    const recommendations = this.generateDuplicateRecommendations(duplicateType, matches)
    const warnings = this.generateDuplicateWarnings(duplicateType, matches)

    return {
      is_duplicate: true,
      similarity_score: highestSimilarity,
      duplicate_type: duplicateType,
      matches,
      content_fingerprint: fingerprint.content_hash,
      recommendations,
      warnings
    }
  }

  private generateDuplicateRecommendations(
    duplicateType: string,
    matches: DuplicateMatch[]
  ): string[] {
    const recommendations: string[] = []

    switch (duplicateType) {
      case 'exact':
        recommendations.push('Content appears to be an exact duplicate')
        recommendations.push('Consider rejecting or merging with existing content')
        break
      case 'near_duplicate':
        recommendations.push('Content is very similar to existing articles')
        recommendations.push('Review for unique value or angle')
        recommendations.push('Consider updating existing content instead')
        break
      case 'similar_content':
        recommendations.push('Similar content exists on this topic')
        recommendations.push('Ensure new content provides unique insights')
        recommendations.push('Consider cross-referencing related articles')
        break
    }

    if (matches.length > 1) {
      recommendations.push(`Found ${matches.length} similar articles`)
    }

    return recommendations
  }

  private generateDuplicateWarnings(
    duplicateType: string,
    matches: DuplicateMatch[]
  ): string[] {
    const warnings: string[] = []

    if (duplicateType === 'exact') {
      warnings.push('EXACT DUPLICATE DETECTED - Content should be rejected')
    }

    if (duplicateType === 'near_duplicate') {
      warnings.push('NEAR DUPLICATE DETECTED - Manual review required')
    }

    const recentMatches = matches.filter(m => 
      m.published_at && new Date(m.published_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    if (recentMatches.length > 0) {
      warnings.push(`${recentMatches.length} similar articles published in the last 30 days`)
    }

    return warnings
  }

  private async storeContentFingerprint(fingerprint: ContentFingerprint): Promise<void> {
    await supabase.from('content_fingerprints').upsert(fingerprint)
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }

  private generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }

  private generateSemanticHash(text: string): string {
    // Simple semantic hash based on key phrases
    const phrases = this.extractKeyPhrases(text)
    const sortedPhrases = phrases.sort().join(' ')
    return this.generateTextHash(sortedPhrases)
  }

  private async generateImageHash(imageUrl: string): Promise<string> {
    // In a real implementation, this would download and hash the image
    // For now, we'll use the URL as a simple hash
    return this.generateTextHash(imageUrl)
  }

  private extractKeyPhrases(text: string): string[] {
    const words = text.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.STOP_WORDS.includes(word))

    // Count word frequency
    const wordFreq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Extract top phrases
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word)

    return topWords
  }

  private calculatePhraseSimilarity(phrases1: string[], phrases2: string[]): number {
    if (phrases1.length === 0 || phrases2.length === 0) return 0

    const set1 = new Set(phrases1)
    const set2 = new Set(phrases2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  private async performTopicClustering(fingerprints: Array<{
    content_id: string
    key_phrases: string[]
    content_type: string
  }>): Promise<Array<{
    cluster_id: string
    topic: string
    content_ids: string[]
    similarity_score: number
  }>> {
    const clusters: Array<{
      cluster_id: string
      topic: string
      content_ids: string[]
      similarity_score: number
    }> = []

    const processed = new Set<string>()

    for (const fingerprint of fingerprints) {
      if (processed.has(fingerprint.content_id)) continue

      const similarContent = fingerprints.filter(other => {
        if (other.content_id === fingerprint.content_id) return false
        if (processed.has(other.content_id)) return false
        
        const similarity = this.calculatePhraseSimilarity(
          fingerprint.key_phrases,
          other.key_phrases
        )
        
        return similarity >= this.SIMILARITY_THRESHOLDS.similar_content
      })

      if (similarContent.length > 0) {
        const clusterContentIds = [fingerprint.content_id, ...similarContent.map(c => c.content_id)]
        const avgSimilarity = similarContent.reduce((sum, content) => {
          return sum + this.calculatePhraseSimilarity(fingerprint.key_phrases, content.key_phrases)
        }, 0) / similarContent.length

        clusters.push({
          cluster_id: crypto.randomUUID(),
          topic: fingerprint.key_phrases.slice(0, 3).join(', '),
          content_ids: clusterContentIds,
          similarity_score: avgSimilarity
        })

        clusterContentIds.forEach(id => processed.add(id))
      }
    }

    return clusters
  }
}

export const duplicateDetectionService = new DuplicateDetectionService()