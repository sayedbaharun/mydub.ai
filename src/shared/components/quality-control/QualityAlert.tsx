import { useState } from 'react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { QUALITY_THRESHOLDS, getQualitySeverity } from '@/shared/config/quality'

interface QualityAlertProps {
  score: number
  articleTitle?: string
  onDismiss?: () => void
  className?: string
}

export function QualityAlert({ score, articleTitle, onDismiss, className }: QualityAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || score >= QUALITY_THRESHOLDS.bannerThreshold) {
    return null
  }

  const severity = getQualitySeverity(score)
  const isCritical = severity === 'critical'
  const isWarning = severity === 'warning'

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (isCritical) {
    return (
      <Alert role="alert" aria-live="assertive" className={cn("border-red-200 bg-red-50 text-red-800", className)}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Critical Quality Issues Detected</strong>
            {articleTitle && (
              <span className="block mt-1 text-sm">
                Article "{articleTitle}" scored {score}% - immediate review required
              </span>
            )}
            <span className="block mt-1 text-sm">
              Score: {score}% (Target: 80%+) - Multiple quality criteria below standards
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4 text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isWarning) {
    return (
      <Alert role="alert" aria-live="polite" className={cn("border-yellow-200 bg-yellow-50 text-yellow-800", className)}>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Quality Below Standards</strong>
            {articleTitle && (
              <span className="block mt-1 text-sm">
                Article "{articleTitle}" scored {score}% - review recommended
              </span>
            )}
            <span className="block mt-1 text-sm">
              Score: {score}% (Target: 80%+) - Some quality improvements needed
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

// Hook for managing quality alert state
export function useQualityAlert() {
  const [alertDismissed, setAlertDismissed] = useState(false)
  
  const shouldShowAlert = (score: number) => {
    return !alertDismissed && score < QUALITY_THRESHOLDS.bannerThreshold
  }
  
  const dismissAlert = () => {
    setAlertDismissed(true)
  }
  
  const resetAlert = () => {
    setAlertDismissed(false)
  }
  
  return {
    shouldShowAlert,
    dismissAlert,
    resetAlert
  }
}