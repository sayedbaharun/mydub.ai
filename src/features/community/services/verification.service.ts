/**
 * Verification Service
 * Phase 3.5.1: User verification and badge system
 */

import { supabase } from '@/shared/lib/supabase'

// =============================================================================
// Types
// =============================================================================

export type VerificationType = 'resident' | 'business' | 'contributor'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type BadgeType = 'resident' | 'business' | 'contributor' | 'moderator' | 'admin'

export interface UserVerification {
  id: string
  userId: string
  verificationType: VerificationType
  status: VerificationStatus
  badgeName: string | null
  badgeIcon: string | null
  proofData: any | null
  verifiedAt: Date | null
  expiresAt: Date | null
  rejectionReason: string | null
  createdAt: Date
}

export interface UserBadge {
  id: string
  userId: string
  badgeType: BadgeType
  badgeName: string
  badgeIcon: string
  displayOrder: number
  metadata: any | null
  earnedAt: Date
}

// =============================================================================
// Verification Service
// =============================================================================

export class VerificationService {
  /**
   * Request Dubai Resident verification
   */
  static async requestResidentVerification(phoneNumber: string): Promise<UserVerification | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate UAE phone number format
      if (!this.isValidUAEPhone(phoneNumber)) {
        throw new Error('Invalid UAE phone number. Must start with +971')
      }

      const { data, error } = await supabase
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'resident',
          proof_data: { phone_number: phoneNumber },
        })
        .select()
        .single()

      if (error) throw error

      return this.mapVerification(data)
    } catch (error) {
      console.error('Error requesting resident verification:', error)
      throw error
    }
  }

  /**
   * Request Business Owner verification
   */
  static async requestBusinessVerification(
    businessName: string,
    tradeLicense: string,
    linkedInProfile?: string
  ): Promise<UserVerification | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'business',
          proof_data: {
            business_name: businessName,
            trade_license: tradeLicense,
            linkedin_profile: linkedInProfile,
          },
        })
        .select()
        .single()

      if (error) throw error

      return this.mapVerification(data)
    } catch (error) {
      console.error('Error requesting business verification:', error)
      throw error
    }
  }

  /**
   * Get user's verifications
   */
  static async getUserVerifications(userId: string): Promise<UserVerification[]> {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data) return []

      return data.map(v => this.mapVerification(v))
    } catch (error) {
      console.error('Error fetching verifications:', error)
      return []
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })

      if (error) throw error
      if (!data) return []

      return data.map(b => ({
        id: b.id,
        userId: b.user_id,
        badgeType: b.badge_type as BadgeType,
        badgeName: b.badge_name,
        badgeIcon: b.badge_icon,
        displayOrder: b.display_order,
        metadata: b.metadata,
        earnedAt: new Date(b.earned_at),
      }))
    } catch (error) {
      console.error('Error fetching badges:', error)
      return []
    }
  }

  /**
   * Approve verification (admin only)
   */
  static async approveVerification(verificationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.rpc('approve_verification', {
        p_verification_id: verificationId,
        p_reviewer_id: user.id,
      })
    } catch (error) {
      console.error('Error approving verification:', error)
      throw error
    }
  }

  /**
   * Reject verification (admin only)
   */
  static async rejectVerification(verificationId: string, reason: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.rpc('reject_verification', {
        p_verification_id: verificationId,
        p_reviewer_id: user.id,
        p_reason: reason,
      })
    } catch (error) {
      console.error('Error rejecting verification:', error)
      throw error
    }
  }

  /**
   * Get pending verifications (admin only)
   */
  static async getPendingVerifications(): Promise<UserVerification[]> {
    try {
      const { data, error } = await supabase
        .from('user_verifications')
        .select(`
          *,
          user_profiles!inner(display_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!data) return []

      return data.map(v => this.mapVerification(v))
    } catch (error) {
      console.error('Error fetching pending verifications:', error)
      return []
    }
  }

  /**
   * Validate UAE phone number
   */
  private static isValidUAEPhone(phone: string): boolean {
    // UAE phone numbers start with +971 and have 9 more digits
    const uaePhoneRegex = /^\+971[0-9]{9}$/
    return uaePhoneRegex.test(phone.replace(/\s/g, ''))
  }

  /**
   * Map database verification to UserVerification
   */
  private static mapVerification(data: any): UserVerification {
    return {
      id: data.id,
      userId: data.user_id,
      verificationType: data.verification_type as VerificationType,
      status: data.status as VerificationStatus,
      badgeName: data.badge_name,
      badgeIcon: data.badge_icon,
      proofData: data.proof_data,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      rejectionReason: data.rejection_reason,
      createdAt: new Date(data.created_at),
    }
  }

  /**
   * Check if user has specific badge
   */
  static async hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badgeType)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }
}
