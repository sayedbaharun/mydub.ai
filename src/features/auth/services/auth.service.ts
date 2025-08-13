import { supabase } from '@/shared/lib/supabase'
import { User, UserRole } from '@/shared/types'
import { SignUpFormData, SignInFormData, SocialProvider } from '../types'
import { EmailService } from '@/shared/services/email.service'

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(data: SignUpFormData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            user_type: data.userType,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      // Create user profile in database
      if (authData.user) {
        // Default role is 'user', admin role will be assigned by database trigger
        const userRole = 'user'
        
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          user_type: data.userType,
          role: userRole as UserRole,
          language: 'en',
        })

        if (profileError) {
          // If profile creation fails, it might be because it already exists
          // Try to update instead
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: data.fullName,
              user_type: data.userType,
            })
            .eq('id', authData.user.id)

          if (updateError) {
            console.error('Profile creation/update error:', updateError)
          }
        }

        // Send welcome email (but don't block on it)
        EmailService.sendWelcomeEmail(data.email, data.fullName).catch((err) =>
          console.error('Failed to send welcome email:', err)
        )

        // Don't auto sign-in after signup - let user do it manually
        // This prevents session conflicts and logout issues
      }

      return { user: authData.user, error: null }
    } catch (error: any) {
      console.error('SignUp error:', error)
      return { user: null, error: error.message || 'Failed to sign up' }
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(data: SignInFormData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      // Fetch user profile - simplified
      if (authData.user) {
        // Admin role is now managed by database triggers
        
        const profile = await this.getUserProfile(authData.user.id)
        return { user: profile, session: authData.session, error: null }
      }

      return { user: null, session: null, error: 'No user found' }
    } catch (error: any) {
      return { user: null, session: null, error: error.message || 'Failed to sign in' }
    }
  }

  /**
   * Sign in with social provider
   */
  static async signInWithSocial(provider: SocialProvider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to sign in with social provider' }
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to sign out' }
    }
  }

  /**
   * Get current session with improved error handling
   */
  static async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        // Always try to get profile, but fallback gracefully
        let profile = null
        try {
          profile = (await Promise.race([
            this.getUserProfile(session.user.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile timeout')), 3000)
            ),
          ])) as any
        } catch (profileError) {
                    // Create profile from session data as fallback
          profile = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'User',
            role: session.user.user_metadata?.role || 'user',
            userType: 'resident',
            language: 'en',
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          }
        }

        return { session, user: profile, error: null }
      }

      return { session: null, user: null, error: null }
    } catch (error: any) {
      console.error('Session check failed:', error)
      return { session: null, user: null, error: error.message }
    }
  }

  /**
   * Get user profile from database
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        // Profile might not exist yet
        // Profile not found - let the trigger handle creation
        if (error.code === 'PGRST116') {
          return null
        }

        return null
      }

      // Map database schema (snake_case) to User interface (camelCase)
      if (data) {
        // Admin role is now managed by database triggers
        
        const mappedUser = {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          avatar: data.avatar_url,
          role: data.role,
          userType: data.user_type || 'resident',
          language: data.language || 'en',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        } as User

        return mappedUser
      }

      return null
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>) {
    try {
      // Map User interface (camelCase) to database schema (snake_case)
      const dbUpdates: any = {}

      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar
      if (updates.userType !== undefined) dbUpdates.user_type = updates.userType
      if (updates.role !== undefined) dbUpdates.role = updates.role
      if (updates.language !== undefined) dbUpdates.language = updates.language
      if (updates.email !== undefined) dbUpdates.email = updates.email

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Map response back to User interface format
      const mappedData = data
        ? ({
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            avatar: data.avatar_url,
            role: data.role,
            userType: data.user_type || 'resident',
            language: data.language || 'en',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          } as User)
        : null

      return { data: mappedData, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Failed to update profile' }
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      // Send password reset email via our email service
      try {
        const resetLink = `${window.location.origin}/auth/reset-password`
        if (EmailService?.sendPasswordResetEmail) {
          await EmailService.sendPasswordResetEmail(email, resetLink)
        }
      } catch (err) {
        console.error('Failed to send password reset email:', err)
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to send reset email' }
    }
  }

  /**
   * Update password (with optional tokens for reset flow)
   */
  static async updatePassword(newPassword: string, accessToken?: string, refreshToken?: string) {
    try {
      // If tokens are provided, set the session first (for password reset)
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) throw sessionError
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to update password' }
    }
  }

  /**
   * Verify email with OTP
   */
  static async verifyEmail(email: string, token: string) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Failed to verify email' }
    }
  }
}
