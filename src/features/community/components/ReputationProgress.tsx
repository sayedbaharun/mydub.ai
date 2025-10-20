/**
 * Reputation Progress Component
 * Phase 3.5.2: Show user's progress to next level
 */

import { useEffect, useState } from 'react'
import { ReputationService, UserReputation, ReputationLevelInfo } from '../services/reputation.service'
import { Progress } from '@/shared/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface ReputationProgressProps {
  userId: string
}

export function ReputationProgress({ userId }: ReputationProgressProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null)
  const [currentLevelInfo, setCurrentLevelInfo] = useState<ReputationLevelInfo | null>(null)
  const [pointsToNext, setPointsToNext] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [userId])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const rep = await ReputationService.getUserReputation(userId)
      if (!rep) return

      setReputation(rep)

      const levelInfo = await ReputationService.getLevelInfo(rep.level)
      setCurrentLevelInfo(levelInfo)

      const toNext = await ReputationService.getPointsToNextLevel(userId)
      setPointsToNext(toNext)

      const prog = await ReputationService.getProgressToNextLevel(userId)
      setProgress(prog)
    } catch (error) {
      console.error('Error loading reputation progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !reputation || !currentLevelInfo) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{currentLevelInfo.icon}</span>
          {currentLevelInfo.displayName}
        </CardTitle>
        <CardDescription>{currentLevelInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Score */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Reputation Score</span>
            <span className="font-medium">{reputation.reputationScore} points</span>
          </div>

          {/* Progress Bar */}
          {pointsToNext !== null ? (
            <>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{progress}% to next level</span>
                <span>{pointsToNext} points needed</span>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-500">
              🎉 Maximum level reached!
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold">{reputation.commentsPosted}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{reputation.commentsUpvoted}</div>
              <div className="text-xs text-gray-500">Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{reputation.totalPointsEarned}</div>
              <div className="text-xs text-gray-500">Total Points</div>
            </div>
          </div>

          {/* Privileges */}
          {currentLevelInfo.privileges.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Your Privileges</h4>
              <ul className="space-y-1 text-xs text-gray-600">
                {currentLevelInfo.privileges.map(privilege => (
                  <li key={privilege} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="capitalize">{privilege.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
