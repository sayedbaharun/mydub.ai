/**
 * Verification Badge Component
 * Phase 3.5.1: Display user verification badges
 */

import { useEffect, useState } from 'react'
import { VerificationService, UserBadge } from '../services/verification.service'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface VerificationBadgeProps {
  userId: string
  showAll?: boolean // Show all badges or just the highest
}

export function VerificationBadge({ userId, showAll = false }: VerificationBadgeProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBadges()
  }, [userId])

  const loadBadges = async () => {
    try {
      setLoading(true)
      const data = await VerificationService.getUserBadges(userId)
      setBadges(data)
    } catch (error) {
      console.error('Error loading badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || badges.length === 0) {
    return null
  }

  const displayBadges = showAll ? badges : [badges[0]]

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map(badge => (
        <TooltipProvider key={badge.id}>
          <Tooltip>
            <TooltipTrigger>
              <span
                className="inline-flex items-center justify-center text-sm"
                role="img"
                aria-label={badge.badgeName}
              >
                {badge.badgeIcon}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{badge.badgeName}</p>
              {badge.metadata?.business_name && (
                <p className="text-xs text-gray-500">{badge.metadata.business_name}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
