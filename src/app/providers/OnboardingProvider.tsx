/**
 * Onboarding Provider
 * Manages onboarding state and provides context for the entire app
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { onboardingService, OnboardingState } from '@/shared/services/onboarding.service'

interface OnboardingContextType {
  isOnboardingComplete: boolean
  isLoading: boolean
  currentStep: number
  totalSteps: number
  onboardingState: OnboardingState | null
  startOnboarding: () => void
  completeStep: (stepId: string) => Promise<void>
  completeOnboarding: () => Promise<void>
  skipOnboarding: () => Promise<void>
  updatePreferences: (preferences: Partial<OnboardingState['preferences']>) => Promise<void>
  resetOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const ONBOARDING_STEPS = [
  'welcome',
  'features',
  'ai-assistant',
  'preferences',
  'account-benefits'
]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Load onboarding state on mount and auth changes
  useEffect(() => {
    loadOnboardingState()
  }, [isAuthenticated, user?.id])

  // Merge onboarding state when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      onboardingService.mergeOnboardingState(user.id)
    }
  }, [isAuthenticated, user?.id])

  const loadOnboardingState = async () => {
    try {
      setIsLoading(true)
      const state = await onboardingService.getOnboardingState(user?.id)
      setOnboardingState(state)
      
      // Determine if we should show onboarding
      const shouldShow = await onboardingService.shouldShowOnboarding(user?.id)
      setShowOnboarding(shouldShow)
      
      // Set current step based on completed steps
      if (state?.completedSteps) {
        const lastCompletedIndex = ONBOARDING_STEPS.findLastIndex(
          step => state.completedSteps.includes(step)
        )
        setCurrentStep(Math.min(lastCompletedIndex + 1, ONBOARDING_STEPS.length - 1))
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startOnboarding = () => {
    setShowOnboarding(true)
    setCurrentStep(0)
  }

  const completeStep = async (stepId: string) => {
    await onboardingService.completeStep(stepId, user?.id)
    
    // Update local state
    const updatedState = await onboardingService.getOnboardingState(user?.id)
    setOnboardingState(updatedState)
    
    // Move to next step
    const currentIndex = ONBOARDING_STEPS.indexOf(stepId)
    if (currentIndex !== -1 && currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentIndex + 1)
    }
  }

  const completeOnboarding = async () => {
    await onboardingService.completeOnboarding(user?.id)
    setShowOnboarding(false)
    
    // Update local state
    const updatedState = await onboardingService.getOnboardingState(user?.id)
    setOnboardingState(updatedState)
  }

  const skipOnboarding = async () => {
    // Mark all steps as completed but set a flag that it was skipped
    await onboardingService.saveOnboardingState({
      hasCompletedOnboarding: true,
      completedSteps: ONBOARDING_STEPS,
      preferences: { ...onboardingState?.preferences, skipped: true },
      completedAt: new Date().toISOString()
    }, user?.id)
    
    setShowOnboarding(false)
    loadOnboardingState()
  }

  const updatePreferences = async (preferences: Partial<OnboardingState['preferences']>) => {
    await onboardingService.saveOnboardingState({
      preferences: { ...onboardingState?.preferences, ...preferences }
    }, user?.id)
    
    // Update local state
    const updatedState = await onboardingService.getOnboardingState(user?.id)
    setOnboardingState(updatedState)
  }

  const resetOnboarding = async () => {
    await onboardingService.resetOnboarding(user?.id)
    await loadOnboardingState()
    setShowOnboarding(true)
    setCurrentStep(0)
  }

  const value: OnboardingContextType = {
    isOnboardingComplete: onboardingState?.hasCompletedOnboarding || false,
    isLoading,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    onboardingState,
    startOnboarding,
    completeStep,
    completeOnboarding,
    skipOnboarding,
    updatePreferences,
    resetOnboarding
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {showOnboarding && !isLoading && (
        <div id="onboarding-portal" />
      )}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}