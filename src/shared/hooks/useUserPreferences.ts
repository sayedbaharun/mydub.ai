/**
 * User Preferences Hook
 * Provides a unified interface for managing user preferences
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { UserPreferences, PreferenceCategory } from '@/shared/types/preferences'
import { 
  getUserPreferences, 
  updatePreferences, 
  updateAllPreferences,
  applyAllPreferences,
  applyTheme,
  applyLanguage
} from '@/shared/services/user-preferences.service'
import { useToast } from '@/shared/hooks/use-toast'

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
  updatePreference: <K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K],
    value: any
  ) => Promise<void>
  updateCategory: (category: PreferenceCategory, data: any) => Promise<void>
  refreshPreferences: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load preferences on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadPreferences()
    } else {
      // Use default preferences for non-authenticated users
      setPreferences(null)
      setIsLoading(false)
      setError(null)
    }
  }, [user?.id])

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const prefs = await getUserPreferences(user.id)
      setPreferences(prefs)
      
      // Apply preferences to DOM
      await applyAllPreferences(prefs)
      setError(null)
    } catch (err) {
      console.error('Failed to load preferences:', err)
      setError('Failed to load preferences. Using defaults.')
      // Use default preferences on error
      const defaultPrefs = await getUserPreferences()
      setPreferences(defaultPrefs)
      await applyAllPreferences(defaultPrefs)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K],
    value: any
  ) => {
    if (!preferences) return

    // Optimistically update local state
    const newPreferences = {
      ...preferences,
      [category]: typeof preferences[category] === 'object' 
        ? { ...preferences[category] as any, [key]: value }
        : value
    }
    setPreferences(newPreferences)

    // Apply changes immediately for better UX
    switch (`${category}.${String(key)}`) {
      case 'theme.theme':
        applyTheme(value)
        break
      case 'language.language':
        applyLanguage(value)
        break
      case 'accessibility.reduceMotion':
        document.documentElement.classList.toggle('reduce-motion', value)
        break
      case 'accessibility.highContrast':
        document.documentElement.classList.toggle('high-contrast', value)
        break
      case 'accessibility.largeFonts':
        document.documentElement.classList.toggle('large-fonts', value)
        break
    }

    // Update in database
    try {
      const updatedData = typeof preferences[category] === 'object'
        ? { ...preferences[category] as any, [key]: value }
        : value
        
      const result = await updatePreferences(category as PreferenceCategory, updatedData, user?.id)
      
      if (result) {
        setPreferences(result)
      } else {
        throw new Error('Failed to update preferences')
      }
    } catch (err) {
      console.error('Failed to update preference:', err)
      // Revert optimistic update
      setPreferences(preferences)
      toast({
        title: 'Error',
        description: 'Failed to save preference',
        variant: 'destructive'
      })
    }
  }, [preferences, user?.id, toast])

  const updateCategory = useCallback(async (
    category: PreferenceCategory,
    data: any
  ) => {
    if (!preferences) return

    // Optimistically update
    const newPreferences = {
      ...preferences,
      [category]: data
    }
    setPreferences(newPreferences)

    try {
      const result = await updatePreferences(category, data, user?.id)
      
      if (result) {
        setPreferences(result)
        toast({
          title: 'Preferences Updated',
          description: 'Your preferences have been saved'
        })
      } else {
        throw new Error('Failed to update preferences')
      }
    } catch (err) {
      console.error('Failed to update category:', err)
      // Revert optimistic update
      setPreferences(preferences)
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      })
    }
  }, [preferences, user?.id, toast])

  const refreshPreferences = useCallback(async () => {
    await loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    updateCategory,
    refreshPreferences
  }
}