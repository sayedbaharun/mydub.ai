// Content Analyzer Utilities for AI Reporter System

import { callOpenRouter, getModelForTask } from '@/shared/lib/ai-services'
import { 
  ContentItem, 
  SentimentAnalysis, 
  ExtractedEntity,
  LocationData,
  DUBAI_KEYWORDS 
} from '@/shared/services/reporter-agents/types/reporter.types'

export class ContentAnalyzer {
  /**
   * Analyzes sentiment of content using AI
   */
  static async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    try {
      const prompt = `
        Analyze the sentiment of this content:
        
        "${content.substring(0, 1000)}..."
        
        Return a JSON object with:
        - score: number between -1 (very negative) and 1 (very positive)
        - magnitude: number between 0 (low emotion) and 1 (high emotion)
        - label: "positive", "negative", "neutral", or "mixed"
        
        Only return the JSON object, no other text.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      const sentiment = JSON.parse(response)
      return {
        score: sentiment.score || 0,
        magnitude: sentiment.magnitude || 0,
        label: sentiment.label || 'neutral'
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return { score: 0, magnitude: 0, label: 'neutral' }
    }
  }

  /**
   * Extracts named entities from content
   */
  static async extractEntities(content: string): Promise<ExtractedEntity[]> {
    try {
      const prompt = `
        Extract named entities from this Dubai-related content:
        
        "${content.substring(0, 1500)}..."
        
        Find and categorize:
        - People (officials, business leaders, celebrities)
        - Organizations (government bodies, companies, institutions)
        - Locations (areas, landmarks, venues in Dubai)
        - Events (conferences, festivals, openings)
        - Products/Services
        
        Return a JSON array of entities with:
        - type: "person", "organization", "location", "event", "product", or "other"
        - name: the entity name
        - relevance: 0-1 score for how relevant/important this entity is
        
        Only return the JSON array, no other text.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      const entities = JSON.parse(response)
      return Array.isArray(entities) ? entities : []
    } catch (error) {
      console.error('Entity extraction failed:', error)
      return []
    }
  }

  /**
   * Extracts location data from content
   */
  static async extractLocation(content: string): Promise<LocationData | undefined> {
    // Common Dubai areas and landmarks
    const dubaiAreas = [
      { name: 'Downtown Dubai', area: 'Downtown', emirate: 'Dubai' },
      { name: 'Dubai Marina', area: 'Marina', emirate: 'Dubai' },
      { name: 'Jumeirah Beach Residence', area: 'JBR', emirate: 'Dubai' },
      { name: 'Business Bay', area: 'Business Bay', emirate: 'Dubai' },
      { name: 'DIFC', area: 'DIFC', emirate: 'Dubai' },
      { name: 'Dubai Creek', area: 'Creek', emirate: 'Dubai' },
      { name: 'Palm Jumeirah', area: 'Palm', emirate: 'Dubai' },
      { name: 'Deira', area: 'Deira', emirate: 'Dubai' },
      { name: 'Bur Dubai', area: 'Bur Dubai', emirate: 'Dubai' },
      { name: 'Dubai Mall', area: 'Downtown', emirate: 'Dubai' },
      { name: 'Mall of the Emirates', area: 'Al Barsha', emirate: 'Dubai' },
      { name: 'Dubai International Airport', area: 'Garhoud', emirate: 'Dubai' },
      { name: 'Expo City Dubai', area: 'Dubai South', emirate: 'Dubai' }
    ]

    const contentLower = content.toLowerCase()
    
    // Find mentioned locations
    for (const location of dubaiAreas) {
      if (contentLower.includes(location.name.toLowerCase())) {
        return {
          name: location.name,
          area: location.area,
          emirate: location.emirate
        }
      }
    }

    // If no specific location found, check if it's Dubai-related
    const isDubaiContent = DUBAI_KEYWORDS.some(keyword => 
      contentLower.includes(keyword)
    )

    if (isDubaiContent) {
      return {
        name: 'Dubai',
        emirate: 'Dubai'
      }
    }

    return undefined
  }

  /**
   * Calculates content quality score
   */
  static calculateQualityScore(content: ContentItem): number {
    let score = 0
    
    // Length score (optimal 500-1200 words)
    const wordCount = content.content.split(/\s+/).length
    if (wordCount >= 500 && wordCount <= 1200) {
      score += 0.2
    } else if (wordCount >= 300 && wordCount <= 2000) {
      score += 0.1
    }

    // Title quality
    if (content.title && content.title.length >= 10 && content.title.length <= 100) {
      score += 0.1
    }

    // Summary presence
    if (content.summary && content.summary.length >= 50) {
      score += 0.1
    }

    // Media presence
    if (content.metadata.imageUrls && content.metadata.imageUrls.length > 0) {
      score += 0.15
    }

    // Entity richness
    if (content.metadata.entities && content.metadata.entities.length >= 3) {
      score += 0.1
    }

    // Location specificity
    if (content.metadata.location && content.metadata.location.area) {
      score += 0.1
    }

    // Source credibility (simplified)
    if (content.source.type === 'government' || content.source.type === 'api') {
      score += 0.15
    }

    // Freshness
    const ageInHours = (Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60)
    if (ageInHours <= 24) {
      score += 0.1
    } else if (ageInHours <= 72) {
      score += 0.05
    }

    return Math.min(score, 1)
  }

  /**
   * Generates a summary of content using AI
   */
  static async generateSummary(content: string, maxLength: number = 150): Promise<string> {
    try {
      const prompt = `
        Summarize this Dubai news content in ${maxLength} characters or less:
        
        "${content.substring(0, 2000)}..."
        
        Focus on the key facts and make it engaging for Dubai residents and visitors.
        Return only the summary text.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('creative')
      )

      return response.trim().substring(0, maxLength)
    } catch (error) {
      console.error('Summary generation failed:', error)
      return content.substring(0, maxLength) + '...'
    }
  }

  /**
   * Checks if content is Dubai-focused
   */
  static isDubaiFocused(content: string): boolean {
    const contentLower = content.toLowerCase()
    const dubaiMentions = DUBAI_KEYWORDS.filter(keyword => 
      contentLower.includes(keyword)
    ).length

    // Need at least 2 Dubai-related keywords
    return dubaiMentions >= 2
  }

  /**
   * Extracts key topics from content
   */
  static async extractTopics(content: string): Promise<string[]> {
    try {
      const prompt = `
        Extract 3-5 key topics from this Dubai content:
        
        "${content.substring(0, 1000)}..."
        
        Return a JSON array of topic strings relevant to Dubai residents.
        Focus on actionable or interesting topics.
        Only return the JSON array.
      `

      const response = await callOpenRouter(
        [{ role: 'user', content: prompt }],
        getModelForTask('analysis')
      )

      const topics = JSON.parse(response)
      return Array.isArray(topics) ? topics.slice(0, 5) : []
    } catch (error) {
      console.error('Topic extraction failed:', error)
      return []
    }
  }

  /**
   * Calculates readability score
   */
  static calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0)

    if (sentences.length === 0 || words.length === 0) return 0

    // Flesch Reading Ease Score (adapted)
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    let score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    
    // Normalize to 0-1 range (0-30 = 0, 60-100 = 1)
    score = Math.max(0, Math.min(100, score))
    return score / 100
  }

  /**
   * Counts syllables in a word (approximation)
   */
  private static countSyllables(word: string): number {
    word = word.toLowerCase()
    let count = 0
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiou'.includes(word[i])
      if (isVowel && !previousWasVowel) {
        count++
      }
      previousWasVowel = isVowel
    }
    
    // Adjust for silent e
    if (word.endsWith('e')) {
      count--
    }
    
    // Ensure at least 1 syllable
    return Math.max(1, count)
  }

  /**
   * Checks for potential duplicate content
   */
  static async checkDuplicate(content: string, existingContents: ContentItem[]): Promise<boolean> {
    const contentWords = new Set(
      content.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    )

    for (const existing of existingContents) {
      const existingWords = new Set(
        existing.content.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3)
      )

      // Calculate Jaccard similarity
      const intersection = new Set([...contentWords].filter(x => existingWords.has(x)))
      const union = new Set([...contentWords, ...existingWords])
      
      const similarity = intersection.size / union.size

      // If more than 70% similar, consider it a duplicate
      if (similarity > 0.7) {
        return true
      }
    }

    return false
  }

  /**
   * Enriches content with additional metadata
   */
  static async enrichContent(content: ContentItem): Promise<ContentItem> {
    // Run all enrichment tasks in parallel
    const [sentiment, entities, location, topics] = await Promise.all([
      this.analyzeSentiment(content.content),
      this.extractEntities(content.content),
      this.extractLocation(content.content),
      this.extractTopics(content.content)
    ])

    // Generate summary if not present
    if (!content.summary) {
      content.summary = await this.generateSummary(content.content)
    }

    // Update metadata
    content.metadata = {
      ...content.metadata,
      sentiment,
      entities,
      location
    }

    // Update tags with topics
    content.tags = [...new Set([...content.tags, ...topics])]

    return content
  }
}