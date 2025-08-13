import { BaseContent } from '@/shared/types'

interface UserPreferences {
  interests: string[]
  favoriteDistricts: string[]
  language: string
  viewHistory: string[]
  bookmarks: string[]
}

interface ContentScore {
  content: BaseContent
  score: number
  reasons: string[]
}

export class RecommendationService {
  /**
   * Calculate content relevance score based on user preferences
   */
  static calculateScore(
    content: BaseContent,
    preferences: UserPreferences
  ): ContentScore {
    let score = 0
    const reasons: string[] = []

    // Interest matching (40% weight)
    if (preferences.interests.includes(content.type)) {
      score += 40
      reasons.push('Matches your interests')
    }

    // Check if content mentions favorite districts (20% weight)
    const contentText = `${content.title} ${content.description}`.toLowerCase()
    const matchedDistricts = preferences.favoriteDistricts.filter(district =>
      contentText.includes(district.toLowerCase())
    )
    if (matchedDistricts.length > 0) {
      score += 20
      reasons.push(`Related to ${matchedDistricts.join(', ')}`)
    }

    // Recency bonus (20% weight)
    const hoursSinceCreated = 
      (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreated < 24) {
      score += 20
      reasons.push('Recently published')
    } else if (hoursSinceCreated < 72) {
      score += 10
      reasons.push('Published this week')
    }

    // Trending content (20% weight)
    // In a real app, this would be based on view counts, shares, etc.
    if (Math.random() > 0.7) { // Mock trending
      score += 20
      reasons.push('Trending now')
    }

    return { content, score, reasons }
  }

  /**
   * Get personalized content recommendations
   */
  static getRecommendations(
    allContent: BaseContent[],
    preferences: UserPreferences,
    limit: number = 10
  ): ContentScore[] {
    // Calculate scores for all content
    const scoredContent = allContent.map(content =>
      this.calculateScore(content, preferences)
    )

    // Sort by score (highest first)
    scoredContent.sort((a, b) => b.score - a.score)

    // Return top recommendations
    return scoredContent.slice(0, limit)
  }

  /**
   * Get content similar to a given piece of content
   */
  static getSimilarContent(
    targetContent: BaseContent,
    allContent: BaseContent[],
    limit: number = 5
  ): BaseContent[] {
    return allContent
      .filter(content => 
        content.id !== targetContent.id && 
        content.type === targetContent.type
      )
      .slice(0, limit)
  }

  /**
   * Track user interaction for improving recommendations
   */
  static trackInteraction(
    _userId: string,
    contentId: string,
    interactionType: 'view' | 'bookmark' | 'share' | 'click'
  ) {
    // In a real app, this would send data to analytics
    console.log('Track interaction:', {
      userId: _userId,
      contentId,
      interactionType,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get user's content preferences from their activity
   */
  static async getUserPreferences(_userId: string): Promise<UserPreferences> {
    // Mock implementation - in real app, fetch from database
    return {
      interests: ['news', 'government', 'events'],
      favoriteDistricts: ['Downtown Dubai', 'Dubai Marina'],
      language: 'en',
      viewHistory: [],
      bookmarks: [],
    }
  }

  /**
   * Update user preferences based on behavior
   */
  static async updatePreferences(
    _userId: string,
    updates: Partial<UserPreferences>
  ): Promise<void> {
    // In real app, update database
    }
}

// Hook for using recommendations in components
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'

export function useRecommendations(content: BaseContent[]) {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<ContentScore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRecommendations() {
      if (!user) {
        setRecommendations([])
        setIsLoading(false)
        return
      }

      try {
        const preferences = await RecommendationService.getUserPreferences(user.id)
        const recs = RecommendationService.getRecommendations(content, preferences)
        setRecommendations(recs)
      } catch (error) {
        console.error('Failed to load recommendations:', error)
        setRecommendations([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendations()
  }, [content, user])

  return { recommendations, isLoading }
}