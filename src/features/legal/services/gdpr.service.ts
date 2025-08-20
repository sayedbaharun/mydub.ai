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
  // Cache and backoff that survive Vite HMR by living on globalThis
  private static LEGAL_DOC_TTL_MS = 5 * 60 * 1000 // 5 minutes
  private static getGlobalCache(): {
    map: Map<string, { data: LegalDocument | null; ts: number }>
    disabledUntil: number
  } {
    const g = globalThis as any
    if (!g.__gdprLegalDocCache) {
      g.__gdprLegalDocCache = {
        map: new Map<string, { data: LegalDocument | null; ts: number }>(),
        disabledUntil: 0,
      }
    }
    return g.__gdprLegalDocCache as {
      map: Map<string, { data: LegalDocument | null; ts: number }>
      disabledUntil: number
    }
  }
  // Privacy Settings
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

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

  // Minimal implementations to satisfy exports and enable basic data export behavior
  private static async collectUserData(
    userId: string,
    dataCategories: string[]
  ): Promise<Record<string, any>> {
    // In a full implementation, fetch data per-category. Here we return a minimal structure.
    return {
      userId,
      categories: dataCategories,
      generatedAt: new Date().toISOString(),
      data: {},
    }
  }

  private static formatExportData(
    userData: Record<string, any>,
    format: DataExportRequest['export_format']
  ): Blob {
    try {
      if (format === 'csv') {
        // Very simple CSV with two columns; real implementation would flatten userData
        const header = 'key,value\n'
        const rows = Object.entries(userData)
          .map(([k, v]) => `${k},${JSON.stringify(v)}`)
          .join('\n')
        return new Blob([header + rows], { type: 'text/csv' })
      }
      if (format === 'pdf') {
        // Not generating a true PDF; provide JSON content as placeholder
        return new Blob([JSON.stringify(userData, null, 2)], { type: 'application/pdf' })
      }
      // Default JSON
      return new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
    } catch (e) {
      return new Blob([JSON.stringify({ error: 'failed_to_format', userData })], {
        type: 'application/json',
      })
    }
  }

  // Legal Documents
  static async getActiveLegalDocument(
    documentType: string,
    language: string
  ): Promise<LegalDocument | null> {
    try {
      const cacheKey = `${documentType}:${language}`
      const now = Date.now()
      const { map, disabledUntil } = this.getGlobalCache()
      const cached = map.get(cacheKey)
      if (cached && now - cached.ts < this.LEGAL_DOC_TTL_MS) {
        return cached.data
      }

      // If we recently detected missing table/rows, return fallback without a network request
      if (now < disabledUntil) {
        const fallback = this.buildFallbackDoc(documentType, language)
        map.set(cacheKey, { data: fallback, ts: now })
        return fallback
      }
      const { data, error, status } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', documentType)
        .eq('language', language)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!error && data) {
        const doc = data as unknown as LegalDocument
        map.set(cacheKey, { data: doc, ts: now })
        return doc
      }

      // Try language fallback to 'en' if variant like 'en-US' didn't return data
      const baseLang = language.split('-')[0]
      if (baseLang && baseLang !== language) {
        const { data: dataEn, error: errorEn } = await supabase
          .from('legal_documents')
          .select('*')
          .eq('document_type', documentType)
          .eq('language', baseLang)
          .eq('is_active', true)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!errorEn && dataEn) {
          const doc = dataEn as unknown as LegalDocument
          map.set(cacheKey, { data: doc, ts: now })
          return doc
        }
      }

      // Any error/404 or no data: return a minimal fallback document to keep UI working
      if (import.meta.env.VITE_VERBOSE_DEBUG === 'true') {
        console.error('Active legal document not found, returning fallback:', { documentType, language, status, error })
      }
      // Back off further network calls for a short duration to avoid repeated 404s
      const gc = this.getGlobalCache()
      gc.disabledUntil = now + 2 * 60 * 1000 // 2 minutes
      const fallback = this.buildFallbackDoc(documentType, language)
      gc.map.set(cacheKey, { data: fallback, ts: now })
      return fallback
    } catch (err) {
      if (import.meta.env.VITE_VERBOSE_DEBUG === 'true') {
        console.error('Error in getActiveLegalDocument:', err)
      }
      return null
    }
  }

  private static buildFallbackDoc(documentType: string, language: string): LegalDocument {
    return {
      id: 'fallback-privacy-policy',
      document_type: documentType,
      language,
      version: '1.0',
      effective_date: new Date().toISOString(),
      is_active: true,
      title: 'Privacy Policy',
      content:
        'This is a fallback privacy policy. The legal documents table is not available in this environment.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as LegalDocument
  }

  static async getUserConsents(userId: string): Promise<UserConsent[]> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('consent_date', { ascending: false })

      if (error) {
        // Missing table => treat as no consents yet
        if (error.code === '42P01') {
          return []
        }
        if (import.meta.env.VITE_VERBOSE_DEBUG === 'true') {
          console.error('Error fetching user consents:', error)
        }
        return []
      }

      return (data as unknown as UserConsent[]) || []
    } catch (err) {
      if (import.meta.env.VITE_VERBOSE_DEBUG === 'true') {
        console.error('Error in getUserConsents:', err)
      }
      return []
    }
  }

  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings | null> {
    try {
      // Ensure session user matches userId for RLS
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.id || user.user.id !== userId) {
        return null
      }

      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error && error.code !== '42P01') {
        console.error('Error updating privacy settings:', error)
        return null
      }

      // Return the latest settings from DB
      const { data } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      return data as unknown as PrivacySettings | null
    } catch (error) {
      console.error('Error in updatePrivacySettings:', error)
      return null
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
