import { useState } from 'react'
import { Brain, CheckCircle2, Clock, Database, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

interface AIDisclosureBadgeProps {
  variant?: 'compact' | 'expanded'
  sourcesAnalyzed: number
  confidenceScore: number // 0-100
  humanReviewed: boolean
  generatedAt: Date
  className?: string
}

export function AIDisclosureBadge({
  variant = 'compact',
  sourcesAnalyzed,
  confidenceScore,
  humanReviewed,
  generatedAt,
  className
}: AIDisclosureBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Very High'
    if (score >= 80) return 'High'
    if (score >= 70) return 'Medium'
    return 'Low'
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                'flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors cursor-help',
                className
              )}
            >
              <Brain className="h-3 w-3" />
              <span className="text-xs font-medium">AI-Generated</span>
              {humanReviewed && (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2 p-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Brain className="h-4 w-4 text-purple-600" />
                AI-Generated Content
              </div>

              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    Sources analyzed:
                  </span>
                  <span className="font-medium text-gray-900">{sourcesAnalyzed}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    Confidence score:
                  </span>
                  <span className={cn('font-medium', getConfidenceColor(confidenceScore))}>
                    {confidenceScore}% ({getConfidenceLabel(confidenceScore)})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Human review:
                  </span>
                  <span className={cn('font-medium', humanReviewed ? 'text-green-600' : 'text-gray-500')}>
                    {humanReviewed ? '✓ Verified' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Generated:
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatDistanceToNow(generatedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  This article was created by AI and {humanReviewed ? 'verified by our editorial team' : 'is awaiting human review'}.
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Expanded variant
  return (
    <div className={cn('bg-purple-50 border border-purple-200 rounded-lg p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Brain className="h-5 w-5 text-purple-700" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              AI-Generated Content
              {humanReviewed && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </h4>
            <p className="text-xs text-purple-700 mt-1">
              Created using artificial intelligence and {humanReviewed ? 'verified by human editors' : 'pending review'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Database className="h-3 w-3" />
                <span>Sources analyzed</span>
              </div>
              <div className="font-semibold text-gray-900">{sourcesAnalyzed} sources</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-600">
                <AlertCircle className="h-3 w-3" />
                <span>Confidence score</span>
              </div>
              <div className={cn('font-semibold', getConfidenceColor(confidenceScore))}>
                {confidenceScore}% ({getConfidenceLabel(confidenceScore)})
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Human review</span>
              </div>
              <div className={cn('font-semibold', humanReviewed ? 'text-green-600' : 'text-gray-500')}>
                {humanReviewed ? 'Verified ✓' : 'Pending'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="h-3 w-3" />
                <span>Generation time</span>
              </div>
              <div className="font-semibold text-gray-900">
                {formatDistanceToNow(generatedAt, { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
