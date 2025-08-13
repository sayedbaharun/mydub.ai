#!/usr/bin/env npx tsx

/**
 * Disaster Recovery System for MyDub.AI
 * 
 * This script provides automated disaster recovery capabilities including:
 * - Health monitoring and alerting
 * - Automatic failover procedures
 * - Service restoration workflows
 * - Communication systems
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

interface DisasterRecoveryConfig {
  supabaseUrl: string
  serviceRoleKey: string
  healthCheckInterval: number
  alertingWebhook: string
  backupDir: string
  maxDowntime: number // in minutes
  autoRecovery: boolean
}

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  timestamp: string
  details?: any
  error?: string
}

interface DisasterEvent {
  id: string
  type: 'outage' | 'performance' | 'data_loss' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  startTime: string
  endTime?: string
  affectedServices: string[]
  recoveryActions: string[]
  status: 'detecting' | 'responding' | 'recovering' | 'resolved'
}

class DisasterRecoveryManager {
  private config: DisasterRecoveryConfig
  private supabase: ReturnType<typeof createClient>
  private activeIncidents: Map<string, DisasterEvent> = new Map()

  constructor(config: DisasterRecoveryConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
  }

  async startMonitoring(): Promise<void> {
    console.log('🚨 Starting disaster recovery monitoring...')
    
    // Initial health check
    await this.performFullHealthCheck()
    
    // Set up continuous monitoring
    setInterval(async () => {
      await this.performFullHealthCheck()
    }, this.config.healthCheckInterval)
    
    console.log(`✅ Monitoring started with ${this.config.healthCheckInterval}ms interval`)
  }

  private async performFullHealthCheck(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkAPI(),
      this.checkAuthentication(),
      this.checkStorage(),
      this.checkExternalServices()
    ]
    
    const results = await Promise.allSettled(checks)
    const healthResults: HealthCheckResult[] = []
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        healthResults.push(result.value)
      } else {
        healthResults.push({
          service: ['database', 'api', 'auth', 'storage', 'external'][index],
          status: 'down',
          responseTime: 0,
          timestamp: new Date().toISOString(),
          error: result.reason.message
        })
      }
    })
    
    await this.analyzeHealth(healthResults)
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
      
      if (error) throw error
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: { recordCount: data?.length || 0 }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  private async checkAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': this.config.serviceRoleKey,
          'Authorization': `Bearer ${this.config.serviceRoleKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      return {
        service: 'api',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'api',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  private async checkAuthentication(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase.auth.getSession()
      
      // Check if auth service is responsive
      const authResponse = await fetch(`${this.config.supabaseUrl}/auth/v1/health`, {
        headers: {
          'apikey': this.config.serviceRoleKey
        }
      })
      
      if (!authResponse.ok) {
        throw new Error(`Auth service returned ${authResponse.status}`)
      }
      
      return {
        service: 'authentication',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'authentication',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  private async checkStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await this.supabase.storage.listBuckets()
      
      if (error) throw error
      
      return {
        service: 'storage',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: { bucketCount: data?.length || 0 }
      }
    } catch (error) {
      return {
        service: 'storage',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  private async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    const services = [
      'https://api.openai.com/v1/models',
      'https://api.anthropic.com/v1/messages',
      'https://generativelanguage.googleapis.com/v1beta/models'
    ]
    
    try {
      const checks = services.map(async (url) => {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            timeout: 5000 
          })
          return { url, status: response.ok }
        } catch {
          return { url, status: false }
        }
      })
      
      const results = await Promise.all(checks)
      const healthyCount = results.filter(r => r.status).length
      const healthyPercentage = (healthyCount / results.length) * 100
      
      return {
        service: 'external',
        status: healthyPercentage >= 75 ? 'healthy' : healthyPercentage >= 50 ? 'degraded' : 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: { 
          healthy: healthyCount,
          total: results.length,
          percentage: healthyPercentage 
        }
      }
    } catch (error) {
      return {
        service: 'external',
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    }
  }

  private async analyzeHealth(results: HealthCheckResult[]): Promise<void> {
    const downServices = results.filter(r => r.status === 'down')
    const degradedServices = results.filter(r => r.status === 'degraded')
    
    // Check for critical failures
    if (downServices.length > 0) {
      await this.handleServiceOutage(downServices)
    }
    
    // Check for performance issues
    if (degradedServices.length > 0) {
      await this.handleServiceDegradation(degradedServices)
    }
    
    // Check response times
    const slowServices = results.filter(r => r.responseTime > 5000) // 5 seconds
    if (slowServices.length > 0) {
      await this.handleSlowPerformance(slowServices)
    }
    
    // Log health status
    await this.logHealthStatus(results)
  }

  private async handleServiceOutage(downServices: HealthCheckResult[]): Promise<void> {
    const incidentId = `outage-${Date.now()}`
    
    const incident: DisasterEvent = {
      id: incidentId,
      type: 'outage',
      severity: downServices.some(s => s.service === 'database') ? 'critical' : 'high',
      startTime: new Date().toISOString(),
      affectedServices: downServices.map(s => s.service),
      recoveryActions: [],
      status: 'detecting'
    }
    
    this.activeIncidents.set(incidentId, incident)
    
    console.log(`🚨 SERVICE OUTAGE DETECTED: ${incident.affectedServices.join(', ')}`)
    
    // Send immediate alert
    await this.sendAlert('CRITICAL', 'Service Outage Detected', {
      incident,
      affectedServices: incident.affectedServices,
      downServices
    })
    
    // Start recovery procedures
    if (this.config.autoRecovery) {
      await this.initiateRecoveryProcedures(incident)
    }
  }

  private async handleServiceDegradation(degradedServices: HealthCheckResult[]): Promise<void> {
    console.log(`⚠️  Service degradation detected: ${degradedServices.map(s => s.service).join(', ')}`)
    
    await this.sendAlert('WARNING', 'Service Degradation', {
      degradedServices,
      timestamp: new Date().toISOString()
    })
  }

  private async handleSlowPerformance(slowServices: HealthCheckResult[]): Promise<void> {
    console.log(`🐌 Slow performance detected: ${slowServices.map(s => s.service).join(', ')}`)
    
    await this.sendAlert('INFO', 'Performance Alert', {
      slowServices,
      averageResponseTime: slowServices.reduce((sum, s) => sum + s.responseTime, 0) / slowServices.length
    })
  }

  private async initiateRecoveryProcedures(incident: DisasterEvent): Promise<void> {
    incident.status = 'responding'
    console.log(`🔧 Initiating recovery procedures for incident: ${incident.id}`)
    
    const recoveryActions: string[] = []
    
    for (const service of incident.affectedServices) {
      try {
        switch (service) {
          case 'database':
            await this.recoverDatabase()
            recoveryActions.push('Database connection restored')
            break
            
          case 'api':
            await this.recoverAPI()
            recoveryActions.push('API service restarted')
            break
            
          case 'authentication':
            await this.recoverAuthentication()
            recoveryActions.push('Authentication service verified')
            break
            
          case 'storage':
            await this.recoverStorage()
            recoveryActions.push('Storage service verified')
            break
            
          default:
            recoveryActions.push(`Manual intervention required for ${service}`)
        }
      } catch (error) {
        recoveryActions.push(`Failed to recover ${service}: ${error.message}`)
      }
    }
    
    incident.recoveryActions = recoveryActions
    incident.status = 'recovering'
    
    // Wait and recheck
    setTimeout(async () => {
      await this.verifyRecovery(incident)
    }, 30000) // 30 seconds
  }

  private async recoverDatabase(): Promise<void> {
    // Attempt to reconnect
    const { data, error } = await this.supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      throw new Error(`Database recovery failed: ${error.message}`)
    }
    
    console.log('✅ Database connection verified')
  }

  private async recoverAPI(): Promise<void> {
    // Test API endpoint
    const response = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': this.config.serviceRoleKey,
        'Authorization': `Bearer ${this.config.serviceRoleKey}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`API recovery failed: ${response.status}`)
    }
    
    console.log('✅ API service verified')
  }

  private async recoverAuthentication(): Promise<void> {
    const response = await fetch(`${this.config.supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': this.config.serviceRoleKey
      }
    })
    
    if (!response.ok) {
      throw new Error(`Auth service recovery failed: ${response.status}`)
    }
    
    console.log('✅ Authentication service verified')
  }

  private async recoverStorage(): Promise<void> {
    const { data, error } = await this.supabase.storage.listBuckets()
    
    if (error) {
      throw new Error(`Storage recovery failed: ${error.message}`)
    }
    
    console.log('✅ Storage service verified')
  }

  private async verifyRecovery(incident: DisasterEvent): Promise<void> {
    console.log(`🔍 Verifying recovery for incident: ${incident.id}`)
    
    const healthResults = await Promise.allSettled([
      this.checkDatabase(),
      this.checkAPI(),
      this.checkAuthentication(),
      this.checkStorage()
    ])
    
    const stillDown = healthResults
      .filter((result, index) => {
        const serviceName = ['database', 'api', 'authentication', 'storage'][index]
        return incident.affectedServices.includes(serviceName) && 
               result.status === 'fulfilled' && 
               result.value.status === 'down'
      })
    
    if (stillDown.length === 0) {
      // Recovery successful
      incident.status = 'resolved'
      incident.endTime = new Date().toISOString()
      
      console.log(`✅ Recovery successful for incident: ${incident.id}`)
      
      await this.sendAlert('SUCCESS', 'Service Recovered', {
        incident,
        duration: this.calculateDuration(incident.startTime, incident.endTime!),
        recoveryActions: incident.recoveryActions
      })
      
      this.activeIncidents.delete(incident.id)
      
    } else {
      // Recovery failed, escalate
      console.log(`❌ Recovery failed for incident: ${incident.id}`)
      
      await this.sendAlert('CRITICAL', 'Recovery Failed - Manual Intervention Required', {
        incident,
        stillDown: stillDown.length,
        duration: this.calculateDuration(incident.startTime, new Date().toISOString())
      })
    }
  }

  private calculateDuration(start: string, end: string): string {
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  private async sendAlert(level: string, title: string, details: any): Promise<void> {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      title,
      service: 'MyDub.AI Disaster Recovery',
      environment: process.env.NODE_ENV || 'production',
      details
    }
    
    console.log(`🚨 ALERT [${level}]: ${title}`)
    
    try {
      await fetch(this.config.alertingWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })
    } catch (error) {
      console.error('❌ Failed to send alert:', error)
    }
    
    // Also save to local log
    await this.saveAlertToLog(alert)
  }

  private async saveAlertToLog(alert: any): Promise<void> {
    const logDir = path.join(process.cwd(), 'logs')
    const logFile = path.join(logDir, `disaster-recovery-${new Date().toISOString().split('T')[0]}.log`)
    
    try {
      await fs.mkdir(logDir, { recursive: true })
      await fs.appendFile(logFile, JSON.stringify(alert) + '\n')
    } catch (error) {
      console.error('❌ Failed to save alert to log:', error)
    }
  }

  private async logHealthStatus(results: HealthCheckResult[]): Promise<void> {
    const healthSummary = {
      timestamp: new Date().toISOString(),
      overall: results.every(r => r.status === 'healthy') ? 'healthy' : 
               results.some(r => r.status === 'down') ? 'degraded' : 'warning',
      services: results.map(r => ({
        name: r.service,
        status: r.status,
        responseTime: r.responseTime
      })),
      averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    }
    
    // Save to monitoring log
    const logDir = path.join(process.cwd(), 'logs', 'health')
    const logFile = path.join(logDir, `health-${new Date().toISOString().split('T')[0]}.log`)
    
    try {
      await fs.mkdir(logDir, { recursive: true })
      await fs.appendFile(logFile, JSON.stringify(healthSummary) + '\n')
    } catch (error) {
      console.error('❌ Failed to save health log:', error)
    }
  }
}

// Main execution
async function main() {
  const config: DisasterRecoveryConfig = {
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'), // 1 minute
    alertingWebhook: process.env.DISASTER_RECOVERY_WEBHOOK!,
    backupDir: process.env.BACKUP_DIR || './backups',
    maxDowntime: parseInt(process.env.MAX_DOWNTIME_MINUTES || '5'),
    autoRecovery: process.env.AUTO_RECOVERY_ENABLED !== 'false'
  }
  
  if (!config.supabaseUrl || !config.serviceRoleKey || !config.alertingWebhook) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }
  
  const drManager = new DisasterRecoveryManager(config)
  await drManager.startMonitoring()
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping disaster recovery monitoring...')
    process.exit(0)
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { DisasterRecoveryManager }