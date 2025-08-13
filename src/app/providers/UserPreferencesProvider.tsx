/**
 * User Preferences Provider
 * Manages user preferences state and applies them globally
 */

import React, { createContext, useContext, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getUserPreferences, applyAllPreferences } from '@/shared/services/user-preferences.service'
import { UserPreferences } from '@/shared/types/preferences'

interface UserPreferencesContextType {
  preferences: UserPreferences | null
  isLoading: boolean
  refreshPreferences: () => Promise<void>
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAndApplyPreferences()
    } else {
      // Apply default preferences for non-authenticated users
      applyDefaultPreferences()
      setIsLoading(false)
    }
  }, [isAuthenticated, user?.id])

  const loadAndApplyPreferences = async () => {
    try {
      setIsLoading(true)
      const prefs = await getUserPreferences(user?.id)
      setPreferences(prefs)
      await applyAllPreferences(prefs)
    } catch (error) {
      console.error('Failed to load user preferences:', error)
      applyDefaultPreferences()
    } finally {
      setIsLoading(false)
    }
  }

  const applyDefaultPreferences = () => {
    // Apply system defaults
    const theme = localStorage.getItem('theme') || 'system'
    const language = localStorage.getItem('language') || 'en'
    
    document.documentElement.classList.toggle('dark', 
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    )
    document.documentElement.lang = language
    document.documentElement.dir = ['ar', 'ur'].includes(language) ? 'rtl' : 'ltr'
  }

  const refreshPreferences = async () => {
    if (isAuthenticated && user?.id) {
      await loadAndApplyPreferences()
    }
  }

  // Listen for preference changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userPreferences' && e.newValue) {
        try {
          const newPrefs = JSON.parse(e.newValue)
          setPreferences(newPrefs)
          applyAllPreferences(newPrefs)
        } catch (error) {
          console.error('Failed to sync preferences:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (preferences?.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [preferences?.theme])

  return (
    <UserPreferencesContext.Provider value={{ preferences, isLoading, refreshPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function usePreferencesContext() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferencesContext must be used within a UserPreferencesProvider')
  }
  return context
}