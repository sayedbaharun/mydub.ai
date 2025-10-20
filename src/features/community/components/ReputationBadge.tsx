/**
 * Reputation Badge Component
 * Phase 3.5.2: Display user's reputation level
 */

import { useEffect, useState } from 'react'
import { ReputationService, ReputationLevel, ReputationLevelInfo } from '../services/reputation.service'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface ReputationBadgeProps {
  userId: string
  showScore?: boolean
}

export function ReputationBadge({ userId, showScore = false }: ReputationBadgeProps) {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState<ReputationLevel>('newcomer')
  const [levelInfo, setLevelInfo] = useState<ReputationLevelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReputation()
  }, [userId])

  const loadReputation = async () => {
    try {
      setLoading(true)
      const reputation = await ReputationService.getUserReputation(userId)
      if (reputation) {
        setScore(reputation.reputationScore)
        setLevel(reputation.level)

        const info = await ReputationService.getLevelInfo(reputation.level)
        setLevelInfo(info)
      }
    } catch (error) {
      console.error('Error loading reputation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !levelInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1">
            <span className="text-sm" role="img" aria-label={levelInfo.displayName}>
              {levelInfo.icon}
            </span>
            {showScore && (
              <span
                className="text-xs font-medium"
                style={{ color: levelInfo.color || '#64748b' }}
              >
                {score}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{levelInfo.displayName}</p>
            <p className="text-xs text-gray-500">{score} reputation points</p>
            {levelInfo.description && (
              <p className="max-w-xs text-xs text-gray-400">{levelInfo.description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
