/**
 * User Preferences Service
 * Handles loading, saving, and syncing user preferences with Supabase
 */

import { supabase } from '@/shared/lib/supabase'
import { UserPreferences, UserPreferencesUpdate } from '@/shared/types/preferences'

export class UserPreferencesService {
  /**
   * Get user preferences with defaults
   * Creates preferences if they don't exist
   */
  static async getUserPreferences(userId?: string): Promise<UserPreferences> {
    try {
      // Use the database function that handles defaults
      const { data, error } = await supabase
        .rpc('get_user_preferences', { user_uuid: userId })
        .single()

      if (error) {
        console.error('Error fetching user preferences:', error)
        // Return defaults on error
        return this.getDefaultPreferences()
      }

      // Transform database format to app format
      return this.transformDbToApp(data)
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  /**
   * Update user preferences for a specific category
   */
  static async updatePreferences(
    category: keyof UserPreferences,
    data: any,
    userId?: string
  ): Promise<UserPreferences | null> {
    try {
      // Transform category name to match database column
      const dbCategory = this.mapCategoryToDb(category)
      
      // Use the database function for safe updates
      const { data: updated, error } = await supabase
        .rpc('update_user_preferences', {
          preference_category: dbCategory,
          preference_data: data,
          user_uuid: userId
        })

      if (error) {
        console.error('Error updating preferences:', error)
        return null
      }

      // Fetch full preferences after update
      return this.getUserPreferences(userId)
    } catch (error) {
      console.error('Failed to update preferences:', error)
      return null
    }
  }

  /**
   * Update multiple preference categories at once
   */
  static async updateAllPreferences(
    preferences: Partial<UserPreferences>,
    userId?: string
  ): Promise<UserPreferences | null> {
    try {
      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) throw new Error('No user ID available')

      // Transform app format to database format
      const dbUpdate = this.transformAppToDb(preferences)
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUserId,
          ...dbUpdate,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating all preferences:', error)
        return null
      }

      return this.getUserPreferences(currentUserId)
    } catch (error) {
      console.error('Failed to update all preferences:', error)
      return null
    }
  }

  /**
   * Apply theme preference to DOM
   */
  static applyTheme(theme: 'light' | 'dark' | 'system') {
    const root = document.documentElement
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemPrefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
    
    localStorage.setItem('theme', theme)
  }

  /**
   * Apply language preference
   */
  static applyLanguage(language: string) {
    document.documentElement.lang = language
    document.documentElement.dir = ['ar', 'ur'].includes(language) ? 'rtl' : 'ltr'
    localStorage.setItem('language', language)
    
    // Trigger i18n language change
    const event = new CustomEvent('languageChange', { detail: { language } })
    window.dispatchEvent(event)
  }

  /**
   * Apply all preferences to the DOM
   */
  static async applyAllPreferences(preferences: UserPreferences) {
    // Theme
    this.applyTheme(preferences.theme)
    
    // Language
    this.applyLanguage(preferences.language)
    
    // Accessibility
    document.documentElement.classList.toggle('reduce-motion', preferences.accessibility.reduceMotion)
    document.documentElement.classList.toggle('high-contrast', preferences.accessibility.highContrast)
    document.documentElement.classList.toggle('large-fonts', preferences.accessibility.largeFonts)
    
    // Store in localStorage for quick access
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      user_id: '',
      theme: 'system',
      language: 'en',
      timezone: 'Asia/Dubai',
      notifications: {
        email: true,
        push: false,
        sms: false,
        marketing: false
      },
      accessibility: {
        reduceMotion: false,
        highContrast: false,
        largeFonts: false,
        screenReader: false
      },
      tts_settings: {
        voice: '',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        autoPlay: false,
        highlightText: true,
        pauseOnPunctuation: true,
        enableShortcuts: true
      },
      ai_preferences: {
        responseStyle: 'conversational',
        confidenceThreshold: 80,
        biasAwareness: true,
        explainDecisions: true
      },
      content_preferences: {
        autoPlayVideos: false,
        showImages: true,
        compactMode: false,
        articlesPerPage: 20
      },
      privacy_preferences: {
        profileVisibility: 'public',
        dataCollection: true,
        analyticsOptIn: true,
        marketingOptIn: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Transform database format to app format
   */
  private static transformDbToApp(dbData: any): UserPreferences {
    return {
      user_id: dbData.user_id,
      theme: dbData.theme || 'system',
      language: dbData.language || 'en',
      timezone: dbData.timezone || 'Asia/Dubai',
      notifications: dbData.notifications || {},
      accessibility: dbData.accessibility || {},
      tts_settings: dbData.tts_settings || {},
      ai_preferences: dbData.ai_preferences || {},
      content_preferences: dbData.content_preferences || {},
      privacy_preferences: dbData.privacy_preferences || {},
      created_at: dbData.created_at,
      updated_at: dbData.updated_at
    }
  }

  /**
   * Transform app format to database format
   */
  private static transformAppToDb(appData: Partial<UserPreferences>): any {
    const dbData: any = {}
    
    if (appData.theme !== undefined) dbData.theme = appData.theme
    if (appData.language !== undefined) dbData.language = appData.language
    if (appData.timezone !== undefined) dbData.timezone = appData.timezone
    if (appData.notifications !== undefined) dbData.notifications = appData.notifications
    if (appData.accessibility !== undefined) dbData.accessibility = appData.accessibility
    if (appData.tts_settings !== undefined) dbData.tts_settings = appData.tts_settings
    if (appData.ai_preferences !== undefined) dbData.ai_preferences = appData.ai_preferences
    if (appData.content_preferences !== undefined) dbData.content_preferences = appData.content_preferences
    if (appData.privacy_preferences !== undefined) dbData.privacy_preferences = appData.privacy_preferences
    
    return dbData
  }

  /**
   * Map app category names to database column names
   */
  private static mapCategoryToDb(category: keyof UserPreferences): string {
    const mapping: Record<string, string> = {
      notifications: 'notifications',
      accessibility: 'accessibility',
      tts_settings: 'tts_settings',
      ai_preferences: 'ai_preferences',
      content_preferences: 'content_preferences',
      privacy_preferences: 'privacy_preferences'
    }
    
    return mapping[category] || category
  }
}

// Export convenience functions
export const getUserPreferences = UserPreferencesService.getUserPreferences
export const updatePreferences = UserPreferencesService.updatePreferences
export const updateAllPreferences = UserPreferencesService.updateAllPreferences
export const applyTheme = UserPreferencesService.applyTheme
export const applyLanguage = UserPreferencesService.applyLanguage
export const applyAllPreferences = UserPreferencesService.applyAllPreferences