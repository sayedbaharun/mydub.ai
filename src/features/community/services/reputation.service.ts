/**
 * Reputation Service
 * Phase 3.5.2: User reputation and gamification system
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export type ReputationLevel = 'newcomer' | 'regular' | 'contributor' | 'expert' | 'authority'

export interface UserReputation {
  userId: string
  reputationScore: number
  level: ReputationLevel
  totalPointsEarned: number
  pointsSpent: number
  commentsPosted: number
  commentsUpvoted: number
  helpfulFlags: number
  createdAt: Date
  updatedAt: Date
}

export interface ReputationHistory {
  id: string
  userId: string
  action: string
  pointsChange: number
  reason: string | null
  metadata: any | null
  createdAt: Date
}

export interface ReputationLevelInfo {
  level: ReputationLevel
  minScore: number
  maxScore: number | null
  displayName: string
  color: string | null
  icon: string | null
  privileges: string[]
  description: string | null
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  reputationScore: number
  level: ReputationLevel
  rank: number
}

// =============================================================================
// Point Actions (for reference)
// =============================================================================

export const POINT_ACTIONS = {
  COMMENT_POSTED: 5,
  COMMENT_5_UPVOTES: 10,
  COMMENT_10_UPVOTES: 20,
  COMMENT_25_UPVOTES: 50,
  COMMENT_50_UPVOTES: 100,
  COMMENT_FLAGGED: -20,
  ACCURATE_FLAG: 15,
  FIRST_COMMENT: 10,
  PROFILE_COMPLETED: 20,
} as const

// =============================================================================
// Reputation Service
// =============================================================================

export class ReputationService {
  /**
   * Get user's reputation
   */
  static async getUserReputation(userId: string): Promise<UserReputation | null> {
    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If user doesn't have reputation yet, create default
        if (error.code === 'PGRST116') {
          return this.createDefaultReputation(userId)
        }
        throw error
      }

      return {
        userId: data.user_id,
        reputationScore: data.reputation_score,
        level: data.level as ReputationLevel,
        totalPointsEarned: data.total_points_earned,
        pointsSpent: data.points_spent,
        commentsPosted: data.comments_posted,
        commentsUpvoted: data.comments_upvoted,
        helpfulFlags: data.helpful_flags,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error fetching user reputation:', error)
      return null
    }
  }

  /**
   * Create default reputation for user
   */
  private static async createDefaultReputation(userId: string): Promise<UserReputation> {
    const { data, error } = await supabase
      .from('user_reputation')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) throw error

    return {
      userId: data.user_id,
      reputationScore: data.reputation_score,
      level: data.level as ReputationLevel,
      totalPointsEarned: data.total_points_earned,
      pointsSpent: data.points_spent,
      commentsPosted: data.comments_posted,
      commentsUpvoted: data.comments_upvoted,
      helpfulFlags: data.helpful_flags,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  /**
   * Get user's reputation history
   */
  static async getReputationHistory(userId: string, limit: number = 50): Promise<ReputationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('reputation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      if (!data) return []

      return data.map(h => ({
        id: h.id,
        userId: h.user_id,
        action: h.action,
        pointsChange: h.points_change,
        reason: h.reason,
        metadata: h.metadata,
        createdAt: new Date(h.created_at),
      }))
    } catch (error) {
      console.error('Error fetching reputation history:', error)
      return []
    }
  }

  /**
   * Get all reputation levels
   */
  static async getReputationLevels(): Promise<ReputationLevelInfo[]> {
    try {
      const { data, error } = await supabase
        .from('reputation_levels')
        .select('*')
        .order('min_score', { ascending: true })

      if (error) throw error
      if (!data) return []

      return data.map(l => ({
        level: l.level as ReputationLevel,
        minScore: l.min_score,
        maxScore: l.max_score,
        displayName: l.display_name,
        color: l.color,
        icon: l.icon,
        privileges: l.privileges || [],
        description: l.description,
      }))
    } catch (error) {
      console.error('Error fetching reputation levels:', error)
      return []
    }
  }

  /**
   * Get level info for specific level
   */
  static async getLevelInfo(level: ReputationLevel): Promise<ReputationLevelInfo | null> {
    try {
      const { data, error } = await supabase
        .from('reputation_levels')
        .select('*')
        .eq('level', level)
        .single()

      if (error) throw error

      return {
        level: data.level as ReputationLevel,
        minScore: data.min_score,
        maxScore: data.max_score,
        displayName: data.display_name,
        color: data.color,
        icon: data.icon,
        privileges: data.privileges || [],
        description: data.description,
      }
    } catch (error) {
      console.error('Error fetching level info:', error)
      return null
    }
  }

  /**
   * Get reputation leaderboard
   */
  static async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_reputation_leaderboard', {
        p_limit: limit,
      })

      if (error) throw error
      if (!data) return []

      return data.map((entry: any) => ({
        userId: entry.user_id,
        displayName: entry.display_name,
        reputationScore: entry.reputation_score,
        level: entry.level as ReputationLevel,
        rank: entry.rank,
      }))
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }
  }

  /**
   * Get user's rank
   */
  static async getUserRank(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_reputation_rank', {
        p_user_id: userId,
      })

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('Error fetching user rank:', error)
      return 0
    }
  }

  /**
   * Check if user has privilege
   */
  static async userHasPrivilege(userId: string, privilege: string): Promise<boolean> {
    try {
      const reputation = await this.getUserReputation(userId)
      if (!reputation) return false

      const levelInfo = await this.getLevelInfo(reputation.level)
      if (!levelInfo) return false

      return levelInfo.privileges.includes(privilege)
    } catch (error) {
      console.error('Error checking privilege:', error)
      return false
    }
  }

  /**
   * Award points manually (admin only)
   */
  static async awardPoints(
    userId: string,
    points: number,
    action: string,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.rpc('add_reputation_points', {
        p_user_id: userId,
        p_action: action,
        p_points: points,
        p_reason: reason || null,
        p_metadata: metadata || null,
      })
    } catch (error) {
      console.error('Error awarding points:', error)
      throw error
    }
  }

  /**
   * Get points needed for next level
   */
  static async getPointsToNextLevel(userId: string): Promise<number | null> {
    try {
      const reputation = await this.getUserReputation(userId)
      if (!reputation) return null

      const levels = await this.getReputationLevels()
      const currentLevelIndex = levels.findIndex(l => l.level === reputation.level)

      // Already at max level
      if (currentLevelIndex === levels.length - 1) {
        return null
      }

      const nextLevel = levels[currentLevelIndex + 1]
      return nextLevel.minScore - reputation.reputationScore
    } catch (error) {
      console.error('Error calculating points to next level:', error)
      return null
    }
  }

  /**
   * Get progress to next level (0-100%)
   */
  static async getProgressToNextLevel(userId: string): Promise<number> {
    try {
      const reputation = await this.getUserReputation(userId)
      if (!reputation) return 0

      const levels = await this.getReputationLevels()
      const currentLevelIndex = levels.findIndex(l => l.level === reputation.level)

      // Already at max level
      if (currentLevelIndex === levels.length - 1) {
        return 100
      }

      const currentLevel = levels[currentLevelIndex]
      const nextLevel = levels[currentLevelIndex + 1]

      const pointsInLevel = reputation.reputationScore - currentLevel.minScore
      const pointsNeededForLevel = nextLevel.minScore - currentLevel.minScore

      return Math.round((pointsInLevel / pointsNeededForLevel) * 100)
    } catch (error) {
      console.error('Error calculating progress:', error)
      return 0
    }
  }
}
