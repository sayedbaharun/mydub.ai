import { supabase } from '@/shared/lib/supabase'
import {
  DataSubjectRequest,
  UserConsent,
  DataProcessingRecord,
  ComplianceAuditLog,
  DataExportRequest,
  PrivacySettings,
  CookieConsent,
  LegalDocument,
  LegalNotification,
} from '../types'

export class GDPRService {
  // Privacy Settings
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Table doesn't exist or no rows returned
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching privacy settings:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getPrivacySettings:', error)
      return null
    }
  }

  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })

      if (error && error.code !== '42P01') {
        console.error('Error updating privacy settings:', error)
      }
      // Silently ignore if table doesn't exist (42P01)
    } catch (error) {
      console.error('Error in updatePrivacySettings:', error)
    }
  }

  // Consent Management
  static async recordConsent(
    userId: string,
    consentType: string,
    consentGiven: boolean,
    consentVersion: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_consents')
        .insert({
          user_id: userId,
          consent_type: consentType,
          consent_given: consentGiven,
          consent_version: consentVersion,
          ip_address: ipAddress,
          user_agent: userAgent,
          consent_date: new Date().toISOString(),
        })

      if (error && error.code !== '42P01') {
        console.error('Error recording consent:', error)
      }
      // Silently ignore if table doesn't exist (42P01)
    } catch (error) {
      console.error('Error in recordConsent:', error)
    }
  }

  // Compliance Logging
  private static async logComplianceEvent(
    eventType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_audit_logs')
        .insert({
          event_type: eventType,
          user_id: userId,
          metadata,
          timestamp: new Date().toISOString(),
        })

      if (error && error.code !== '42P01') {
        console.error('Error logging compliance event:', error)
      }
      // Silently ignore if table doesn't exist (42P01)
    } catch (error) {
      console.error('Error in logComplianceEvent:', error)
    }
  }

  // Data Subject Rights
  static async submitDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['request_type'],
    description: string
  ): Promise<DataSubjectRequest> {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert({
        user_id: userId,
        request_type: requestType,
        status: 'pending',
        request_date: new Date().toISOString(),
        description,
      })
      .select()
      .single()

    if (error) throw error

    // Log the request
    await this.logComplianceEvent('data_request_submitted', userId, {
      request_type: requestType,
      request_id: data.id,
    })

    return data
  }

  static async getUserDataSubjectRequests(userId: string): Promise<DataSubjectRequest[]> {
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async processDataSubjectRequest(
    requestId: string,
    status: DataSubjectRequest['status'],
    response?: string,
    adminId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('data_subject_requests')
      .update({
        status,
        response,
        completion_date: status === 'completed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) throw error

    // Log admin action
    await this.logComplianceEvent('data_request_processed', undefined, {
      request_id: requestId,
      status,
      admin_id: adminId,
    })
  }

  // Data Export
  static async requestDataExport(
    userId: string,
    format: DataExportRequest['export_format'] = 'json',
    dataCategories: string[] = ['all']
  ): Promise<DataExportRequest> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        export_format: format,
        data_categories: dataCategories,
        status: 'pending',
        request_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Process export in background
    this.processDataExport(data.id, userId, format, dataCategories)

    return data
  }

  private static async processDataExport(
    requestId: string,
    userId: string,
    format: DataExportRequest['export_format'],
    dataCategories: string[]
  ): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('data_export_requests')
        .update({ status: 'processing' })
        .eq('id', requestId)

      // Collect user data from all relevant tables
      const userData = await this.collectUserData(userId, dataCategories)

      // Generate export file
      const exportData = this.formatExportData(userData, format)

      // Store file in Supabase Storage
      const fileName = `data-export-${userId}-${Date.now()}.${format}`
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('legal-exports')
        .upload(fileName, exportData, {
          contentType:
            format === 'json'
              ? 'application/json'
              : format === 'csv'
                ? 'text/csv'
                : 'application/pdf',
        })

      if (uploadError) throw uploadError

      // Get download URL
      const { data: urlData } = await supabase.storage
        .from('legal-exports')
        .createSignedUrl(fileName, 3600 * 24 * 7) // 7 days

      // Update request with download URL
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          download_url: urlData?.signedUrl,
          completion_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', requestId)

      await this.logComplianceEvent('data_exported', userId, {
        request_id: requestId,
        format,
        categories: dataCategories,
      })
    } catch (error) {
      // Update request status to failed
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          completion_date: new Date().toISOString(),
        })
        .eq('id', requestId)
    }
  }

  // Get request context information
  static getRequestContext(): { ipAddress: string; userAgent: string } {
    // In a real application, you'd get this from the request context
    return {
      ipAddress: '0.0.0.0', // This would come from the request
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    }
  }

  // Compliance Health Check
  static async getComplianceStatus(): Promise<{
    gdprCompliant: boolean
    totalUsers: number
    activeConsents: number
    pendingRequests: number
    recentAudits: number
    lastAuditDate: Date | null
    complianceScore: number
  }> {
    // Get compliance metrics
    const [
      { count: totalUsers },
      { count: activeConsents },
      { count: pendingRequests },
      { data: recentAudits },
      { data: lastAudit },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_consents')
        .select('*', { count: 'exact', head: true })
        .eq('consent_given', true),
      supabase
        .from('data_subject_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('compliance_audit_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('compliance_audit_logs')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single(),
    ])

    const complianceScore = this.calculateComplianceScore({
      totalUsers: totalUsers || 0,
      activeConsents: activeConsents || 0,
      pendingRequests: pendingRequests || 0,
      recentAudits: recentAudits?.length || 0,
    })

    return {
      gdprCompliant: complianceScore >= 90,
      totalUsers: totalUsers || 0,
      activeConsents: activeConsents || 0,
      pendingRequests: pendingRequests || 0,
      recentAudits: recentAudits?.length || 0,
      lastAuditDate: lastAudit?.timestamp ? new Date(lastAudit.timestamp) : null,
      complianceScore,
    }
  }

  private static calculateComplianceScore(metrics: {
    totalUsers: number
    activeConsents: number
    pendingRequests: number
    recentAudits: number
  }): number {
    let score = 100

    // Penalize for pending requests
    if (metrics.pendingRequests > 0) {
      score -= Math.min(metrics.pendingRequests * 5, 30)
    }

    // Penalize for low consent rate
    if (metrics.totalUsers > 0) {
      const consentRate = (metrics.activeConsents / metrics.totalUsers) * 100
      if (consentRate < 80) {
        score -= (80 - consentRate) * 0.5
      }
    }

    // Bonus for recent audit activity
    if (metrics.recentAudits > 100) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }
}
