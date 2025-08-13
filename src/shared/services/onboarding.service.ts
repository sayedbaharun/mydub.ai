/**
 * Onboarding Service
 * Manages onboarding state and progress for users
 */

import { supabase } from '@/shared/lib/supabase'

export interface OnboardingState {
  hasCompletedOnboarding: boolean
  completedSteps: string[]
  preferences: {
    language?: string
    theme?: string
    interests?: string[]
    notifications?: boolean
  }
  startedAt: string
  completedAt?: string
}

const ONBOARDING_KEY = 'mydub_onboarding'
const DEVICE_ID_KEY = 'mydub_device_id'

class OnboardingService {
  /**
   * Get or create a unique device ID for anonymous users
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    return deviceId
  }

  /**
   * Get onboarding state for the current user
   */
  async getOnboardingState(userId?: string): Promise<OnboardingState | null> {
    try {
      if (userId) {
        // Authenticated user - check database
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error || !data) {
          // Check local storage as fallback
          return this.getLocalOnboardingState()
        }

        return {
          hasCompletedOnboarding: data.has_completed,
          completedSteps: data.completed_steps || [],
          preferences: data.preferences || {},
          startedAt: data.started_at,
          completedAt: data.completed_at
        }
      } else {
        // Anonymous user - check local storage
        return this.getLocalOnboardingState()
      }
    } catch (error) {
      console.error('Error getting onboarding state:', error)
      return this.getLocalOnboardingState()
    }
  }

  /**
   * Get onboarding state from local storage
   */
  private getLocalOnboardingState(): OnboardingState | null {
    try {
      const stored = localStorage.getItem(ONBOARDING_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Save onboarding state
   */
  async saveOnboardingState(
    state: Partial<OnboardingState>,
    userId?: string
  ): Promise<void> {
    try {
      const currentState = await this.getOnboardingState(userId) || {
        hasCompletedOnboarding: false,
        completedSteps: [],
        preferences: {},
        startedAt: new Date().toISOString()
      }

      const updatedState: OnboardingState = {
        ...currentState,
        ...state,
        preferences: {
          ...currentState.preferences,
          ...state.preferences
        }
      }

      // Always save to local storage
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updatedState))

      // Save to database for authenticated users
      if (userId) {
        const { error } = await supabase
          .from('user_onboarding')
          .upsert({
            user_id: userId,
            has_completed: updatedState.hasCompletedOnboarding,
            completed_steps: updatedState.completedSteps,
            preferences: updatedState.preferences,
            started_at: updatedState.startedAt,
            completed_at: updatedState.completedAt,
            device_id: this.getDeviceId(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error saving onboarding state to database:', error)
        }
      }
    } catch (error) {
      console.error('Error saving onboarding state:', error)
    }
  }

  /**
   * Mark a step as completed
   */
  async completeStep(stepId: string, userId?: string): Promise<void> {
    const state = await this.getOnboardingState(userId) || {
      hasCompletedOnboarding: false,
      completedSteps: [],
      preferences: {},
      startedAt: new Date().toISOString()
    }

    if (!state.completedSteps.includes(stepId)) {
      state.completedSteps.push(stepId)
    }

    await this.saveOnboardingState({ completedSteps: state.completedSteps }, userId)
  }

  /**
   * Complete the entire onboarding process
   */
  async completeOnboarding(userId?: string): Promise<void> {
    await this.saveOnboardingState({
      hasCompletedOnboarding: true,
      completedAt: new Date().toISOString()
    }, userId)
  }

  /**
   * Reset onboarding (useful for testing or re-onboarding)
   */
  async resetOnboarding(userId?: string): Promise<void> {
    localStorage.removeItem(ONBOARDING_KEY)

    if (userId) {
      await supabase
        .from('user_onboarding')
        .delete()
        .eq('user_id', userId)
    }
  }

  /**
   * Merge local onboarding state with cloud state on login
   */
  async mergeOnboardingState(userId: string): Promise<void> {
    try {
      const localState = this.getLocalOnboardingState()
      if (!localState) return

      const cloudState = await this.getOnboardingState(userId)

      // If user has completed onboarding in either place, mark as completed
      const hasCompleted = localState.hasCompletedOnboarding || cloudState?.hasCompletedOnboarding || false

      // Merge completed steps
      const allSteps = new Set([
        ...(localState.completedSteps || []),
        ...(cloudState?.completedSteps || [])
      ])

      // Merge preferences (local takes precedence for recent changes)
      const mergedPreferences = {
        ...cloudState?.preferences,
        ...localState.preferences
      }

      await this.saveOnboardingState({
        hasCompletedOnboarding: hasCompleted,
        completedSteps: Array.from(allSteps),
        preferences: mergedPreferences,
        startedAt: cloudState?.startedAt || localState.startedAt,
        completedAt: cloudState?.completedAt || localState.completedAt
      }, userId)
    } catch (error) {
      console.error('Error merging onboarding state:', error)
    }
  }

  /**
   * Check if user should see onboarding
   */
  async shouldShowOnboarding(userId?: string): Promise<boolean> {
    const state = await this.getOnboardingState(userId)
    return !state?.hasCompletedOnboarding
  }
}

export const onboardingService = new OnboardingService()