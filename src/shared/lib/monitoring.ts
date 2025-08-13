import * as Sentry from '@sentry/react'

// Performance monitoring interface
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  apiResponseTime: number
  bundleSize: number
  memoryUsage: number
  errorCount: number
  timestamp: number
}

// Health check interface
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  services: {
    supabase: boolean
    ai: boolean
    analytics: boolean
    sentry: boolean
  }
  metrics: PerformanceMetrics
}

class MonitoringService {
  private isInitialized = false
  private performanceMetrics: PerformanceMetrics[] = []
  private alertThresholds = {
    loadTime: 3000, // 3 seconds
    errorRate: 0.05, // 5%
    memoryUsage: 100 * 1024 * 1024, // 100MB
    apiResponseTime: 2000, // 2 seconds
  }

  /**
   * Initialize Sentry for error tracking and performance monitoring
   */
  initSentry(dsn: string, environment: string = 'production') {
    if (this.isInitialized || !dsn) return

    Sentry.init({
      dsn,
      environment,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Error sampling
      sampleRate: 1.0,
      // Set user context
      beforeSend: (event) => {
        // Filter out development errors
        if (environment === 'development' && event.level === 'error') {
          return null
        }
        return event
      },
      // Custom release tracking
      release: `mydub-ai@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    })

    this.isInitialized = true
      }

  /**
   * Track custom errors with context
   */
  captureError(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized) return

    Sentry.captureException(error, {
      extra: context,
    })
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; role?: string }) {
    if (!this.isInitialized) return

    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: Partial<PerformanceMetrics>) {
    const fullMetrics: PerformanceMetrics = {
      loadTime: metrics.loadTime || 0,
      renderTime: metrics.renderTime || 0,
      apiResponseTime: metrics.apiResponseTime || 0,
      bundleSize: metrics.bundleSize || 0,
      memoryUsage: this.getMemoryUsage(),
      errorCount: metrics.errorCount || 0,
      timestamp: Date.now(),
    }

    this.performanceMetrics.push(fullMetrics)

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100)
    }

    // Check for performance issues
    this.checkPerformanceAlerts(fullMetrics)

    // Send to Sentry
    if (this.isInitialized) {
      Sentry.addBreadcrumb({
        message: 'Performance metrics collected',
        category: 'performance',
        data: fullMetrics,
        level: 'info',
      })
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    const alerts: string[] = []

    if (metrics.loadTime > this.alertThresholds.loadTime) {
      alerts.push(`High load time: ${metrics.loadTime}ms`)
    }

    if (metrics.apiResponseTime > this.alertThresholds.apiResponseTime) {
      alerts.push(`Slow API response: ${metrics.apiResponseTime}ms`)
    }

    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`)
    }

    if (alerts.length > 0) {
      this.triggerAlert('performance_degradation', {
        alerts,
        metrics,
      })
    }
  }

  /**
   * Trigger monitoring alerts
   */
  private triggerAlert(type: string, data: any) {
    if (this.isInitialized) {
      Sentry.captureMessage(`Monitoring Alert: ${type}`, {
        level: 'warning',
        extra: data,
      })
    }

    // In production, this could send to external alerting systems
    // like PagerDuty, Slack, etc.
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, data?: Record<string, any>) {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      message: eventName,
      category: 'custom',
      data,
      level: 'info',
    })
  }

  /**
   * Get performance metrics for dashboard
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics]
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthCheck> {
    const metrics = this.getLatestMetrics()

    // Check service availability
    const services = {
      supabase: await this.checkSupabaseHealth(),
      ai: await this.checkAIServicesHealth(),
      analytics: this.checkAnalyticsHealth(),
      sentry: this.isInitialized,
    }

    // Determine overall health
    const healthyServices = Object.values(services).filter(Boolean).length
    const totalServices = Object.keys(services).length

    let status: HealthCheck['status'] = 'healthy'
    if (healthyServices < totalServices) {
      status = healthyServices < totalServices * 0.5 ? 'unhealthy' : 'degraded'
    }

    return {
      status,
      timestamp: Date.now(),
      services,
      metrics,
    }
  }

  /**
   * Get latest performance metrics
   */
  private getLatestMetrics(): PerformanceMetrics {
    if (this.performanceMetrics.length === 0) {
      return {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: 0,
        bundleSize: 0,
        memoryUsage: this.getMemoryUsage(),
        errorCount: 0,
        timestamp: Date.now(),
      }
    }
    return this.performanceMetrics[this.performanceMetrics.length - 1]
  }

  /**
   * Check Supabase connectivity
   */
  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      // This would make a simple health check to Supabase
      // For now, just check if the client is available
      return typeof window !== 'undefined' && !!window.supabase
    } catch {
      return false
    }
  }

  /**
   * Check AI services health
   */
  private async checkAIServicesHealth(): Promise<boolean> {
    try {
      // Check if AI services are responding
      // This is a simplified check
      // TODO: Implement actual AI service health check
      const isHealthy = true // Placeholder
      return isHealthy
    } catch {
      return false
    }
  }

  /**
   * Check analytics health
   */
  private checkAnalyticsHealth(): boolean {
    return typeof window !== 'undefined' && !!window.gtag
  }

  /**
   * Measure and track page load performance
   */
  measurePageLoad() {
    if (typeof window === 'undefined') return

    // Wait for page to be fully loaded
    window.addEventListener('load', () => {
      const perfData = performance.timing
      const loadTime = perfData.loadEventEnd - perfData.navigationStart
      const renderTime = perfData.domComplete - perfData.domLoading

      this.trackPerformance({
        loadTime,
        renderTime,
      })
    })
  }

  /**
   * Measure API response times
   */
  measureApiCall<T>(apiCall: () => Promise<T>, endpoint: string): Promise<T> {
    const startTime = performance.now()

    return apiCall()
      .then((result) => {
        const responseTime = performance.now() - startTime
        this.trackPerformance({
          apiResponseTime: responseTime,
        })

        this.trackEvent('api_call_success', {
          endpoint,
          responseTime,
        })

        return result
      })
      .catch((error) => {
        const responseTime = performance.now() - startTime

        this.captureError(error, {
          endpoint,
          responseTime,
        })

        this.trackEvent('api_call_error', {
          endpoint,
          responseTime,
          error: error.message,
        })

        throw error
      })
  }
}

// Export singleton instance
export const monitoring = new MonitoringService()

// React Hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([])
  const [healthStatus, setHealthStatus] = React.useState<HealthCheck | null>(null)

  React.useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      setMetrics(monitoring.getPerformanceMetrics())
      monitoring.getHealthStatus().then(setHealthStatus)
    }, 30000)

    // Initial load
    setMetrics(monitoring.getPerformanceMetrics())
    monitoring.getHealthStatus().then(setHealthStatus)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    healthStatus,
    trackEvent: monitoring.trackEvent.bind(monitoring),
    captureError: monitoring.captureError.bind(monitoring),
  }
}

// Higher-order component for error boundaries with Sentry
export const withErrorBoundary = Sentry.withErrorBoundary

// Export Sentry for direct use
export { Sentry }

// Add React import for hooks
import React from 'react'
import { matchPath } from 'react-router-dom'
