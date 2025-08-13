import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    isLoading,
    user,
    isAuthenticated: !!session,
    accessToken: session?.access_token,
    refreshToken: session?.refresh_token,
  }
}

// Hook to refresh the session
export function useRefreshSession() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      return { success: true, session: data.session }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh session'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    refreshSession,
    isRefreshing,
    error,
  }
}