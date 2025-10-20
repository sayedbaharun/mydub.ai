/**
 * User Profile Service
 * Phase 3.1.1: Manage user profiles, preferences, and reading history
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export interface UserProfile {
  userId: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null // Dubai neighborhood
  privacyLevel: 'public' | 'private' | 'friends'
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  categories: string[] // Preferred news categories
  notifications: {
    breaking_news: boolean
    comments: boolean
    weekly_digest: boolean
    quiet_hours: {
      enabled: boolean
      start: string // "22:00"
      end: string // "08:00"
    }
  }
  language: 'en' | 'ar'
  theme: 'light' | 'dark' | 'auto'
}

export interface ReadingHistoryEntry {
  id: string
  userId: string
  articleId: string
  readAt: Date
  timeSpentSeconds: number
  completionPercentage: number
}

export interface Bookmark {
  id: string
  userId: string
  articleId: string
  collection: string | null
  notes: string | null
  createdAt: Date
}

// =============================================================================
// Profile Service
// =============================================================================

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    if (!data) return null

    return {
      userId: data.user_id,
      displayName: data.display_name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      location: data.location,
      privacyLevel: data.privacy_level,
      preferences: data.preferences as UserPreferences,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  /**
   * Get current user's profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return this.getProfile(user.id)
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        display_name: updates.displayName,
        bio: updates.bio,
        avatar_url: updates.avatarUrl,
        location: updates.location,
        privacy_level: updates.privacyLevel,
        preferences: updates.preferences,
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return {
      userId: data.user_id,
      displayName: data.display_name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      location: data.location,
      privacyLevel: data.privacy_level,
      preferences: data.preferences as UserPreferences,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const currentProfile = await this.getProfile(userId)
    if (!currentProfile) throw new Error('Profile not found')

    const updatedPreferences = {
      ...currentProfile.preferences,
      ...preferences,
    }

    await supabase
      .from('user_profiles')
      .update({ preferences: updatedPreferences })
      .eq('user_id', userId)
  }

  /**
   * Upload avatar image
   */
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatarUrl: publicUrl })

    return publicUrl
  }

  // =============================================================================
  // Reading History
  // =============================================================================

  /**
   * Track article read
   */
  static async trackArticleRead(
    userId: string,
    articleId: string,
    timeSpentSeconds: number,
    completionPercentage: number
  ): Promise<void> {
    const { error } = await supabase
      .from('user_reading_history')
      .insert({
        user_id: userId,
        article_id: articleId,
        time_spent_seconds: timeSpentSeconds,
        completion_percentage: completionPercentage,
      })

    if (error && !error.message.includes('duplicate')) {
      console.error('Error tracking article read:', error)
    }
  }

  /**
   * Get user's reading history
   */
  static async getReadingHistory(
    userId: string,
    limit: number = 50
  ): Promise<ReadingHistoryEntry[]> {
    const { data, error } = await supabase
      .from('user_reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('read_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching reading history:', error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      articleId: entry.article_id,
      readAt: new Date(entry.read_at),
      timeSpentSeconds: entry.time_spent_seconds,
      completionPercentage: entry.completion_percentage,
    }))
  }

  /**
   * Get user's reading stats
   */
  static async getReadingStats(userId: string): Promise<{
    totalArticlesRead: number
    totalTimeSpentMinutes: number
    averageCompletionRate: number
    topCategories: string[]
  }> {
    const history = await this.getReadingHistory(userId, 1000)

    const totalArticlesRead = history.length
    const totalTimeSpentMinutes = Math.round(
      history.reduce((sum, entry) => sum + entry.timeSpentSeconds, 0) / 60
    )
    const averageCompletionRate = history.length > 0
      ? Math.round(
          history.reduce((sum, entry) => sum + entry.completionPercentage, 0) / history.length
        )
      : 0

    // Get top categories from read articles
    const articleIds = history.map(h => h.articleId)
    const { data: articles } = await supabase
      .from('news_articles')
      .select('category')
      .in('id', articleIds.slice(0, 100)) // Limit to recent 100 articles

    const categoryCounts = articles?.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category)

    return {
      totalArticlesRead,
      totalTimeSpentMinutes,
      averageCompletionRate,
      topCategories,
    }
  }

  // =============================================================================
  // Bookmarks
  // =============================================================================

  /**
   * Add bookmark
   */
  static async addBookmark(
    userId: string,
    articleId: string,
    collection?: string,
    notes?: string
  ): Promise<Bookmark> {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        article_id: articleId,
        collection,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding bookmark:', error)
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      articleId: data.article_id,
      collection: data.collection,
      notes: data.notes,
      createdAt: new Date(data.created_at),
    }
  }

  /**
   * Remove bookmark
   */
  static async removeBookmark(userId: string, articleId: string): Promise<void> {
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId)

    if (error) {
      console.error('Error removing bookmark:', error)
      throw error
    }
  }

  /**
   * Get user's bookmarks
   */
  static async getBookmarks(userId: string, collection?: string): Promise<Bookmark[]> {
    let query = supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (collection) {
      query = query.eq('collection', collection)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return []
    }

    return data.map(bookmark => ({
      id: bookmark.id,
      userId: bookmark.user_id,
      articleId: bookmark.article_id,
      collection: bookmark.collection,
      notes: bookmark.notes,
      createdAt: new Date(bookmark.created_at),
    }))
  }

  /**
   * Check if article is bookmarked
   */
  static async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .single()

    return !error && !!data
  }

  /**
   * Get bookmark collections
   */
  static async getCollections(userId: string): Promise<Array<{ name: string; count: number }>> {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('collection')
      .eq('user_id', userId)

    if (error || !data) return []

    const collections = data.reduce((acc, bookmark) => {
      if (bookmark.collection) {
        acc[bookmark.collection] = (acc[bookmark.collection] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(collections).map(([name, count]) => ({ name, count }))
  }
}
