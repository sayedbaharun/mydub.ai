/**
 * Onboarding Modal
 * Main container for the onboarding flow
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { useOnboarding } from '@/app/providers/OnboardingProvider'
import { WelcomeStep } from './steps/WelcomeStep'
import { FeaturesStep } from './steps/FeaturesStep'
import { AIAssistantStep } from './steps/AIAssistantStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { AccountBenefitsStep } from './steps/AccountBenefitsStep'
import { cn } from '@/shared/lib/utils'

const STEP_COMPONENTS = [
  WelcomeStep,
  FeaturesStep,
  AIAssistantStep,
  PreferencesStep,
  AccountBenefitsStep
]

export function OnboardingModal() {
  const {
    currentStep,
    totalSteps,
    isOnboardingComplete,
    completeStep,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding()

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show modal after a short delay for better UX
    if (!isOnboardingComplete) {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isOnboardingComplete])

  if (isOnboardingComplete || !isVisible) return null

  const CurrentStepComponent = STEP_COMPONENTS[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleNext = async () => {
    const stepId = ['welcome', 'features', 'ai-assistant', 'preferences', 'account-benefits'][currentStep]
    await completeStep(stepId)
    
    if (isLastStep) {
      await completeOnboarding()
    }
  }

  const handlePrevious = () => {
    // This would need to be implemented in the provider
    // For now, we'll just prevent going back from the first step
  }

  const handleSkip = async () => {
    if (window.confirm('Are you sure you want to skip the onboarding? You can always access this later from settings.')) {
      await skipOnboarding()
    }
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleSkip()
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={cn(
            'relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden',
            'max-h-[90vh] flex flex-col'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="ml-4"
              aria-label="Skip onboarding"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <CurrentStepComponent onNext={handleNext} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500"
            >
              Skip Tour
            </Button>
            
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="min-w-[100px]"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  // Portal to render modal at root level
  const portalElement = document.getElementById('onboarding-portal')
  if (!portalElement) {
    // Fallback to body if portal element doesn't exist
    return createPortal(modalContent, document.body)
  }

  return createPortal(modalContent, portalElement)
}