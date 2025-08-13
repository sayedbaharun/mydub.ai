/**
 * User Preferences Type Definitions
 * Matches the database schema for user_preferences table
 */

export interface UserPreferences {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ar' | 'hi' | 'ur'
  timezone: string
  notifications: NotificationPreferences
  accessibility: AccessibilityPreferences
  tts_settings: TTSPreferences
  ai_preferences: AIPreferences
  content_preferences: ContentPreferences
  privacy_preferences: PrivacyPreferences
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  marketing: boolean
}

export interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeFonts: boolean
  screenReader: boolean
}

export interface TTSPreferences {
  voice: string
  rate: number
  pitch: number
  volume: number
  autoPlay: boolean
  highlightText: boolean
  pauseOnPunctuation: boolean
  enableShortcuts: boolean
}

export interface AIPreferences {
  responseStyle: 'concise' | 'detailed' | 'conversational'
  confidenceThreshold: number
  biasAwareness: boolean
  explainDecisions: boolean
}

export interface ContentPreferences {
  autoPlayVideos: boolean
  showImages: boolean
  compactMode: boolean
  articlesPerPage: number
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'friends'
  dataCollection: boolean
  analyticsOptIn: boolean
  marketingOptIn: boolean
}

// Update types for partial updates
export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>

// Category types for updates
export type PreferenceCategory = 
  | 'theme'
  | 'language'
  | 'timezone'
  | 'notifications'
  | 'accessibility'
  | 'tts_settings'
  | 'ai_preferences'
  | 'content_preferences'
  | 'privacy_preferences'