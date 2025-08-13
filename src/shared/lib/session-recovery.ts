import { supabase } from '@/shared/lib/supabase'

/**
 * Session recovery utilities for debugging authentication issues
 */
export const SessionRecovery = {
  /**
   * Check if session exists in localStorage
   */
  hasStoredSession(): boolean {
    try {
      const storageKey = 'mydub-auth-token'
      const storedSession = localStorage.getItem(storageKey)
      return !!storedSession
    } catch (error) {
      console.error('Error checking stored session:', error)
      return false
    }
  },

  /**
   * Get session details from localStorage (for debugging)
   */
  getStoredSessionDetails(): any {
    try {
      const storageKey = 'mydub-auth-token'
      const storedSession = localStorage.getItem(storageKey)
      if (!storedSession) return null
      
      const parsed = JSON.parse(storedSession)
      return {
        hasSession: !!parsed.access_token,
        expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000) : null,
        isExpired: parsed.expires_at ? new Date(parsed.expires_at * 1000) < new Date() : true,
        user: parsed.user
      }
    } catch (error) {
      console.error('Error parsing stored session:', error)
      return null
    }
  },

  /**
   * Force refresh session from Supabase
   */
  async forceRefreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) throw error
      return { session, error: null }
    } catch (error: any) {
      return { session: null, error: error.message }
    }
  },

  /**
   * Clear all auth-related storage
   */
  clearAllAuthStorage() {
    try {
      localStorage.removeItem('mydub-auth-token')
      localStorage.removeItem('mydub_auth_state')
      sessionStorage.clear()
    } catch (error) {
      console.error('Error clearing auth storage:', error)
    }
  },

  /**
   * Debug current auth state
   */
  async debugAuthState() {
    const hasStored = this.hasStoredSession()
    const storedDetails = this.getStoredSessionDetails()
    const { data: { session } } = await supabase.auth.getSession()
    
    console.group('🔐 Auth State Debug')
                    console.groupEnd()
    
    return {
      hasStoredSession: hasStored,
      storedDetails,
      currentSession: session,
      authStateMarker: localStorage.getItem('mydub_auth_state')
    }
  }
}

// Export for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).SessionRecovery = SessionRecovery
}