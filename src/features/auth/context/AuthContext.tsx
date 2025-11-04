import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/shared/types'
import { AuthService } from '../services/auth.service'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { SessionManager } from '@/shared/lib/security'
import { SimpleAuthErrorBoundary } from '../components/AuthErrorBoundary'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: any) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Check if auth is disabled for testing (dev mode)
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

  useEffect(() => {
    let mounted = true

    // Initialize auth state
    initializeAuth()

    async function initializeAuth() {
      try {
        // DEV MODE: Auto-login as admin if auth is disabled
        if (skipAuth) {
          const mockAdminUser: User = {
            id: 'dev-mode-admin-id',
            email: 'admin@mydub.ai',
            fullName: 'Admin (Dev Mode)',
            role: 'admin',
            userType: 'resident',
            language: 'en',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          if (mounted) {
            setUser(mockAdminUser)
            setIsInitialized(true)
            setIsLoading(false)
            console.log('⚠️ DEV MODE: Authentication disabled - logged in as admin')
          }
          return
        }

        // Wait for Supabase to recover session from localStorage
        const { data: { session: recoveredSession }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Session recovery error:', error)
          localStorage.removeItem('mydub_auth_state')
        }

        if (recoveredSession) {
                    setSession(recoveredSession)
          
          // Set user immediately with session data
          const fallbackUser = {
            id: recoveredSession.user.id,
            email: recoveredSession.user.email || '',
            fullName: recoveredSession.user.user_metadata?.full_name || 'User',
            role: recoveredSession.user.email === 'admin@mydub.ai' ? 'admin' : (recoveredSession.user.user_metadata?.role || 'user'),
            userType: 'resident',
            language: 'en',
            createdAt: recoveredSession.user.created_at,
            updatedAt: recoveredSession.user.updated_at || recoveredSession.user.created_at
          } as User
          
          setUser(fallbackUser)
          localStorage.setItem('mydub_auth_state', 'authenticated')
          
          // Try to load full profile in background
          AuthService.getUserProfile(recoveredSession.user.id).then(profile => {
            if (mounted && profile) {
              setUser(profile)
            }
          }).catch(err => {
                      })
          
          // Start session manager
          SessionManager.startSession(
            24 * 60 * 60 * 1000, // 24 hours
            () => signOut()
          )
        } else {
                    localStorage.removeItem('mydub_auth_state')
        }

        setIsInitialized(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
      }
    }

    // Listen for auth changes with improved session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
            // Skip initial session event if we're still initializing
      if (event === 'INITIAL_SESSION' && !isInitialized) {
                return
      }

      // Simple session persistence tracking
      if (session) {
        localStorage.setItem('mydub_auth_state', 'authenticated')
      } else {
        localStorage.removeItem('mydub_auth_state')
      }

      setSession(session)

      if (session?.user) {
        try {
          // First set the user from session immediately to prevent logout
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'User',
            role: session.user.email === 'admin@mydub.ai' ? 'admin' : (session.user.user_metadata?.role || 'user'),
            userType: 'resident',
            language: 'en',
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at
          } as User

          // Set fallback user immediately to prevent logout flash
          if (mounted) {
            setUser(fallbackUser)
          }

          // Then try to load full profile with shorter timeout
          try {
            const profile = await Promise.race([
              AuthService.getUserProfile(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile loading timeout')), 1500)
              )
            ]) as any
            
            if (mounted && profile) {
              setUser(profile)
            }
          } catch (profileError) {
                        // Keep the fallback user we already set - this ensures user stays signed in
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
          // Keep the fallback user we already set
        }
      } else {
        setUser(null)
      }

      // Handle specific auth events
      if (mounted) {
        switch (event) {
          case 'SIGNED_IN':
            // Start session manager for automatic timeout
            SessionManager.startSession(
              24 * 60 * 60 * 1000, // 24 hours
              () => {
                signOut()
              },
              () => {
                // Could show a warning modal here
              }
            )
            break
          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            SessionManager.clearSession()
            break
          case 'TOKEN_REFRESHED':
            // Reset session timeout
            SessionManager.resetSession()
            break
          case 'USER_UPDATED':
            if (session?.user) {
              try {
                AuthService.getUserProfile(session.user.id).then(updatedProfile => {
                  if (mounted && updatedProfile) setUser(updatedProfile)
                })
              } catch (error) {
                console.error('Error updating user profile:', error)
              }
            }
            break
        }
        
        // Ensure loading is set to false after processing
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isInitialized])

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true)
      const { user, session, error } = await AuthService.signIn({ 
        email, 
        password, 
        rememberMe: true 
      })

      if (error) {
        console.error('Sign in error:', error)
        setIsLoading(false)
        localStorage.removeItem('mydub_auth_state')
        return { error }
      }

      // Auth state change handler will update session/user
      setIsLoading(false)
      return { error: null }
    } catch (error: any) {
      console.error('Sign in exception:', error)
      setIsLoading(false)
      localStorage.removeItem('mydub_auth_state')
      return { error: error.message || 'Failed to sign in' }
    }
  }

  async function signUp(data: any) {
    try {
      const { error } = await AuthService.signUp(data)

      if (error) {
        return { error }
      }

      // Note: User will need to verify email before they can sign in
      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to sign up' }
    }
  }

  async function signOut() {
    try {
      // Clear session manager first
      SessionManager.clearSession()
      localStorage.removeItem('mydub_auth_state')
      
      const { error } = await AuthService.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Clear state immediately regardless of error
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
      // Still clear state even if signout fails
      setUser(null)
      setSession(null)
      SessionManager.clearSession()
      localStorage.removeItem('mydub_auth_state')
    }
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await AuthService.updateProfile(user.id, updates)

      if (error) {
        return { error }
      }

      setUser(data as User)
      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to update profile' }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  return (
    <SimpleAuthErrorBoundary>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </SimpleAuthErrorBoundary>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hook to check if user has specific role
export function useRole(allowedRoles: string[]) {
  const { user } = useAuth()
  return user ? allowedRoles.includes(user.role) : false
}

// Helper hook to require authentication
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, redirectTo])

  return { isAuthenticated, isLoading }
}