import { supabase } from '@/shared/lib/supabase'

// UAE data residency requirements based on Federal Law No. 45 of 2021
const UAE_DATA_RESIDENCY_RULES = {
  // Data that must remain in UAE
  criticalData: [
    'government_records',
    'health_records',
    'financial_transactions',
    'personal_identification',
    'minors_data' // Data of users under 18
  ],
  
  // Allowed regions for data transfer (with conditions)
  allowedRegions: [
    'AE', // United Arab Emirates
    'SA', // Saudi Arabia (GCC agreement)
    'KW', // Kuwait (GCC agreement)
    'QA', // Qatar (GCC agreement)
    'BH', // Bahrain (GCC agreement)
    'OM'  // Oman (GCC agreement)
  ],
  
  // Countries with adequate data protection (EU GDPR compliant)
  adequateProtection: [
    'EU', // European Union countries
    'GB', // United Kingdom
    'CH', // Switzerland
    'CA', // Canada
    'JP', // Japan
    'SG', // Singapore
    'NZ', // New Zealand
  ]
}

export interface DataLocation {
  userId: string
  dataType: string
  location: string
  region: string
  encryptionStatus: boolean
  lastAccessed: Date
  accessCount: number
}

export interface DataTransferRequest {
  id: string
  userId: string
  dataType: string
  sourceRegion: string
  targetRegion: string
  reason: string
  status: 'pending' | 'approved' | 'denied' | 'completed'
  requestedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface DataAccessLog {
  id: string
  userId: string
  accessorId: string
  dataType: string
  accessLocation: string
  accessIp: string
  accessTime: Date
  purpose: string
  authorized: boolean
}

class DataResidencyService {
  private userLocationCache = new Map<string, string>()
  
  // Check if user is in UAE or allowed region
  async checkUserLocation(userId: string, ipAddress?: string): Promise<{
    location: string
    region: string
    isUAE: boolean
    isAllowed: boolean
  }> {
    // Check cache first
    const cached = this.userLocationCache.get(userId)
    if (cached) {
      return this.parseLocationResult(cached)
    }
    
    try {
      // Get user's registered location from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('country, region')
        .eq('id', userId)
        .single()
      
      if (profile?.country) {
        const locationStr = `${profile.country}:${profile.region || 'unknown'}`
        this.userLocationCache.set(userId, locationStr)
        return this.parseLocationResult(locationStr)
      }
      
      // If no profile location and IP provided, use IP geolocation
      if (ipAddress) {
        const location = await this.geolocateIP(ipAddress)
        const locationStr = `${location.country}:${location.region}`
        this.userLocationCache.set(userId, locationStr)
        return this.parseLocationResult(locationStr)
      }
      
      // Default to unknown
      return {
        location: 'unknown',
        region: 'unknown',
        isUAE: false,
        isAllowed: false
      }
    } catch (error) {
      console.error('Failed to check user location:', error)
      return {
        location: 'unknown',
        region: 'unknown',
        isUAE: false,
        isAllowed: false
      }
    }
  }
  
  // Validate data access based on residency rules
  async validateDataAccess(
    userId: string,
    dataType: string,
    accessLocation: string,
    purpose: string
  ): Promise<{
    allowed: boolean
    reason?: string
    requiresAudit: boolean
  }> {
    // Check if data type is critical
    const isCritical = UAE_DATA_RESIDENCY_RULES.criticalData.includes(dataType)
    
    // Get user location
    const userLocation = await this.checkUserLocation(userId)
    
    // Check if user is a minor
    const isMinor = await this.checkIfMinor(userId)
    
    // Critical data rules
    if (isCritical || isMinor) {
      // Must be accessed from UAE or allowed GCC countries
      if (!UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(accessLocation)) {
        return {
          allowed: false,
          reason: 'Critical data must be accessed from UAE or approved GCC countries',
          requiresAudit: true
        }
      }
    }
    
    // Check if access location has adequate protection
    const hasAdequateProtection = 
      UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(accessLocation) ||
      UAE_DATA_RESIDENCY_RULES.adequateProtection.includes(accessLocation)
    
    if (!hasAdequateProtection) {
      return {
        allowed: false,
        reason: 'Access location does not meet data protection requirements',
        requiresAudit: true
      }
    }
    
    // Log the access attempt
    await this.logDataAccess(userId, dataType, accessLocation, purpose, true)
    
    return {
      allowed: true,
      requiresAudit: isCritical || isMinor
    }
  }
  
  // Request data transfer approval
  async requestDataTransfer(
    userId: string,
    dataType: string,
    targetRegion: string,
    reason: string
  ): Promise<DataTransferRequest> {
    const sourceRegion = 'AE' // Always from UAE
    
    // Check if transfer is automatically allowed
    const isAllowed = this.isTransferAllowed(dataType, targetRegion)
    
    const request: DataTransferRequest = {
      id: crypto.randomUUID(),
      userId,
      dataType,
      sourceRegion,
      targetRegion,
      reason,
      status: isAllowed ? 'approved' : 'pending',
      requestedAt: new Date(),
      reviewedAt: isAllowed ? new Date() : undefined,
      reviewedBy: isAllowed ? 'system' : undefined
    }
    
    // Save request to database
    await supabase.from('data_transfer_requests').insert({
      id: request.id,
      user_id: userId,
      data_type: dataType,
      source_region: sourceRegion,
      target_region: targetRegion,
      reason,
      status: request.status,
      requested_at: request.requestedAt,
      reviewed_at: request.reviewedAt,
      reviewed_by: request.reviewedBy
    })
    
    // If not automatically approved, notify compliance team
    if (!isAllowed) {
      await this.notifyComplianceTeam(request)
    }
    
    return request
  }
  
  // Enforce data localization for specific data types
  async enforceDataLocalization(
    userId: string,
    dataType: string,
    data: any
  ): Promise<{
    stored: boolean
    location: string
    encrypted: boolean
  }> {
    // Check if data requires UAE localization
    const requiresUAEStorage = UAE_DATA_RESIDENCY_RULES.criticalData.includes(dataType)
    
    // For critical data, ensure it's stored in UAE region
    if (requiresUAEStorage) {
      // In production, this would use region-specific storage
      // For now, we'll add metadata to track location
      const metadata = {
        user_id: userId,
        data_type: dataType,
        storage_region: 'AE',
        encryption_status: true,
        stored_at: new Date()
      }
      
      // Store location metadata
      await supabase.from('data_location_registry').insert(metadata)
      
      return {
        stored: true,
        location: 'AE',
        encrypted: true
      }
    }
    
    // Non-critical data can be stored in any allowed region
    return {
      stored: true,
      location: 'GLOBAL',
      encrypted: true
    }
  }
  
  // Get data residency report for a user
  async getUserDataResidencyReport(userId: string): Promise<{
    dataLocations: DataLocation[]
    transferRequests: DataTransferRequest[]
    accessLogs: DataAccessLog[]
    compliance: {
      status: 'compliant' | 'non_compliant' | 'review_needed'
      issues: string[]
    }
  }> {
    // Get data locations
    const { data: locations } = await supabase
      .from('data_location_registry')
      .select('*')
      .eq('user_id', userId)
    
    // Get transfer requests
    const { data: transfers } = await supabase
      .from('data_transfer_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(50)
    
    // Get access logs
    const { data: accessLogs } = await supabase
      .from('data_access_logs')
      .select('*')
      .eq('user_id', userId)
      .order('access_time', { ascending: false })
      .limit(100)
    
    // Check compliance status
    const compliance = await this.checkComplianceStatus(userId, locations, transfers, accessLogs)
    
    return {
      dataLocations: locations?.map(this.mapDataLocation) || [],
      transferRequests: transfers?.map(this.mapTransferRequest) || [],
      accessLogs: accessLogs?.map(this.mapAccessLog) || [],
      compliance
    }
  }
  
  // Restrict data export based on user location and data type
  async validateDataExport(
    userId: string,
    dataTypes: string[],
    exportLocation: string
  ): Promise<{
    allowed: boolean
    allowedTypes: string[]
    restrictedTypes: string[]
    reason?: string
  }> {
    const allowedTypes: string[] = []
    const restrictedTypes: string[] = []
    
    for (const dataType of dataTypes) {
      // Check if data type is critical
      if (UAE_DATA_RESIDENCY_RULES.criticalData.includes(dataType)) {
        // Critical data can only be exported to allowed regions
        if (UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(exportLocation)) {
          allowedTypes.push(dataType)
        } else {
          restrictedTypes.push(dataType)
        }
      } else {
        // Non-critical data can be exported to adequate protection regions
        if (
          UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(exportLocation) ||
          UAE_DATA_RESIDENCY_RULES.adequateProtection.includes(exportLocation)
        ) {
          allowedTypes.push(dataType)
        } else {
          restrictedTypes.push(dataType)
        }
      }
    }
    
    // Log export attempt
    await supabase.from('data_export_logs').insert({
      user_id: userId,
      data_types: dataTypes,
      export_location: exportLocation,
      allowed_types: allowedTypes,
      restricted_types: restrictedTypes,
      attempted_at: new Date()
    })
    
    return {
      allowed: restrictedTypes.length === 0,
      allowedTypes,
      restrictedTypes,
      reason: restrictedTypes.length > 0 
        ? `The following data types cannot be exported to ${exportLocation}: ${restrictedTypes.join(', ')}`
        : undefined
    }
  }
  
  // Private helper methods
  private parseLocationResult(locationStr: string) {
    const [country, region] = locationStr.split(':')
    return {
      location: country,
      region: region || 'unknown',
      isUAE: country === 'AE',
      isAllowed: UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(country)
    }
  }
  
  private async geolocateIP(ipAddress: string): Promise<{ country: string; region: string }> {
    // In production, use a proper IP geolocation service
    // For now, return a mock result
    if (ipAddress.startsWith('10.') || ipAddress.startsWith('192.168.')) {
      return { country: 'AE', region: 'Dubai' }
    }
    return { country: 'US', region: 'Unknown' }
  }
  
  private async checkIfMinor(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('date_of_birth')
      .eq('id', userId)
      .single()
    
    if (!data?.date_of_birth) return false
    
    const age = this.calculateAge(new Date(data.date_of_birth))
    return age < 18
  }
  
  private calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
  
  private isTransferAllowed(dataType: string, targetRegion: string): boolean {
    // Critical data can only go to GCC countries
    if (UAE_DATA_RESIDENCY_RULES.criticalData.includes(dataType)) {
      return UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(targetRegion)
    }
    
    // Other data can go to adequate protection countries
    return UAE_DATA_RESIDENCY_RULES.allowedRegions.includes(targetRegion) ||
           UAE_DATA_RESIDENCY_RULES.adequateProtection.includes(targetRegion)
  }
  
  private async logDataAccess(
    userId: string,
    dataType: string,
    accessLocation: string,
    purpose: string,
    authorized: boolean
  ): Promise<void> {
    await supabase.from('data_access_logs').insert({
      user_id: userId,
      accessor_id: userId, // In real implementation, this would be the actual accessor
      data_type: dataType,
      access_location: accessLocation,
      access_ip: '0.0.0.0', // Would be actual IP in production
      access_time: new Date(),
      purpose,
      authorized
    })
  }
  
  private async notifyComplianceTeam(request: DataTransferRequest): Promise<void> {
    // In production, send email or notification to compliance team
      }
  
  private async checkComplianceStatus(
    userId: string,
    locations: any[],
    transfers: any[],
    accessLogs: any[]
  ): Promise<{
    status: 'compliant' | 'non_compliant' | 'review_needed'
    issues: string[]
  }> {
    const issues: string[] = []
    
    // Check for unauthorized access attempts
    const unauthorizedAccess = accessLogs?.filter(log => !log.authorized) || []
    if (unauthorizedAccess.length > 0) {
      issues.push(`${unauthorizedAccess.length} unauthorized access attempts detected`)
    }
    
    // Check for pending transfer requests
    const pendingTransfers = transfers?.filter(t => t.status === 'pending') || []
    if (pendingTransfers.length > 0) {
      issues.push(`${pendingTransfers.length} data transfer requests pending review`)
    }
    
    // Check for data stored outside UAE
    const nonUAEData = locations?.filter(l => l.storage_region !== 'AE') || []
    if (nonUAEData.length > 0) {
      // Check if any critical data is stored outside UAE
      const criticalNonUAE = nonUAEData.filter(l => 
        UAE_DATA_RESIDENCY_RULES.criticalData.includes(l.data_type)
      )
      if (criticalNonUAE.length > 0) {
        issues.push(`${criticalNonUAE.length} critical data items stored outside UAE`)
      }
    }
    
    // Determine overall status
    let status: 'compliant' | 'non_compliant' | 'review_needed' = 'compliant'
    if (issues.length > 0) {
      status = issues.some(i => i.includes('critical')) ? 'non_compliant' : 'review_needed'
    }
    
    return { status, issues }
  }
  
  private mapDataLocation(record: any): DataLocation {
    return {
      userId: record.user_id,
      dataType: record.data_type,
      location: record.storage_region,
      region: record.storage_region,
      encryptionStatus: record.encryption_status,
      lastAccessed: new Date(record.last_accessed || record.stored_at),
      accessCount: record.access_count || 0
    }
  }
  
  private mapTransferRequest(record: any): DataTransferRequest {
    return {
      id: record.id,
      userId: record.user_id,
      dataType: record.data_type,
      sourceRegion: record.source_region,
      targetRegion: record.target_region,
      reason: record.reason,
      status: record.status,
      requestedAt: new Date(record.requested_at),
      reviewedAt: record.reviewed_at ? new Date(record.reviewed_at) : undefined,
      reviewedBy: record.reviewed_by
    }
  }
  
  private mapAccessLog(record: any): DataAccessLog {
    return {
      id: record.id,
      userId: record.user_id,
      accessorId: record.accessor_id,
      dataType: record.data_type,
      accessLocation: record.access_location,
      accessIp: record.access_ip,
      accessTime: new Date(record.access_time),
      purpose: record.purpose,
      authorized: record.authorized
    }
  }
}

export const dataResidencyService = new DataResidencyService()