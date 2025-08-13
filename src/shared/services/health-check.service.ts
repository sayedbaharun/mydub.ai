import { monitoring } from '@/shared/lib/monitoring';
import { analytics } from './analytics.service';
import { supabase } from '@/shared/lib/supabase';

// Health check interfaces
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: number;
  uptime: number;
  version: string;
}

// Alert interfaces
export interface Alert {
  id: string;
  type: 'error' | 'performance' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: {
    console: boolean;
    webhook?: string;
    email?: string;
  };
  thresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    downtime: number;
  };
}

class HealthCheckService {
  private alerts: Alert[] = [];
  private alertingConfig: AlertingConfig = {
    enabled: true,
    channels: {
      console: true,
    },
    thresholds: {
      errorRate: 0.05, // 5%
      responseTime: 2000, // 2 seconds
      memoryUsage: 100 * 1024 * 1024, // 100MB
      downtime: 30000, // 30 seconds
    },
  };
  private startTime = Date.now();

  /**
   * Configure alerting system
   */
  configureAlerting(config: Partial<AlertingConfig>) {
    this.alertingConfig = { ...this.alertingConfig, ...config };
    }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const services: ServiceHealth[] = [];

    // Check Supabase
    services.push(await this.checkSupabase());

    // Check Analytics
    services.push(this.checkAnalytics());

    // Check Monitoring
    services.push(this.checkMonitoring());

    // Check Frontend Performance
    services.push(await this.checkFrontendPerformance());

    // Determine overall health
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: SystemHealth['overall'] = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    const systemHealth: SystemHealth = {
      overall,
      services,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };

    // Check for alerts
    this.checkForAlerts(systemHealth);

    return systemHealth;
  }

  /**
   * Check Supabase connectivity and performance
   */
  private async checkSupabase(): Promise<ServiceHealth> {
    const startTime = performance.now();
    
    try {
      // Simple connectivity test
      const { data, error } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);

      const responseTime = performance.now() - startTime;

      if (error && !error.message.includes('relation "health_check" does not exist')) {
        return {
          name: 'Supabase',
          status: 'unhealthy',
          responseTime,
          lastChecked: Date.now(),
          error: error.message,
        };
      }

      const status = responseTime > 2000 ? 'degraded' : 'healthy';
      
      return {
        name: 'Supabase',
        status,
        responseTime,
        lastChecked: Date.now(),
        metadata: {
          url: supabase.supabaseUrl,
          connected: true,
        },
      };
    } catch (error) {
      return {
        name: 'Supabase',
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check analytics service health
   */
  private checkAnalytics(): ServiceHealth {
    const status = analytics.getStatus();
    
    let healthStatus: ServiceHealth['status'] = 'healthy';
    let error: string | undefined;

    if (!status.initialized) {
      healthStatus = 'unhealthy';
      error = 'Analytics not initialized';
    } else if (status.queuedEvents > 10) {
      healthStatus = 'degraded';
      error = `${status.queuedEvents} events queued`;
    }

    return {
      name: 'Analytics',
      status: healthStatus,
      responseTime: 0,
      lastChecked: Date.now(),
      error,
      metadata: {
        initialized: status.initialized,
        consentGiven: status.consentGiven,
        queuedEvents: status.queuedEvents,
      },
    };
  }

  /**
   * Check monitoring service health
   */
  private checkMonitoring(): ServiceHealth {
    const metrics = monitoring.getPerformanceMetrics();
    const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

    let status: ServiceHealth['status'] = 'healthy';
    let error: string | undefined;

    if (!latestMetric) {
      status = 'degraded';
      error = 'No performance metrics available';
    } else if (latestMetric.errorCount > 5) {
      status = 'unhealthy';
      error = `High error count: ${latestMetric.errorCount}`;
    } else if (latestMetric.errorCount > 0) {
      status = 'degraded';
      error = `${latestMetric.errorCount} errors detected`;
    }

    return {
      name: 'Monitoring',
      status,
      responseTime: 0,
      lastChecked: Date.now(),
      error,
      metadata: {
        metricsCount: metrics.length,
        latestErrorCount: latestMetric?.errorCount || 0,
      },
    };
  }

  /**
   * Check frontend performance metrics
   */
  private async checkFrontendPerformance(): Promise<ServiceHealth> {
    const metrics = monitoring.getPerformanceMetrics();
    const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

    if (!latestMetric) {
      return {
        name: 'Frontend Performance',
        status: 'degraded',
        responseTime: 0,
        lastChecked: Date.now(),
        error: 'No performance data available',
      };
    }

    let status: ServiceHealth['status'] = 'healthy';
    let error: string | undefined;

    if (latestMetric.loadTime > 5000 || latestMetric.memoryUsage > 150 * 1024 * 1024) {
      status = 'unhealthy';
      error = 'Critical performance issues detected';
    } else if (latestMetric.loadTime > 3000 || latestMetric.memoryUsage > 100 * 1024 * 1024) {
      status = 'degraded';
      error = 'Performance degradation detected';
    }

    return {
      name: 'Frontend Performance',
      status,
      responseTime: latestMetric.apiResponseTime,
      lastChecked: Date.now(),
      error,
      metadata: {
        loadTime: latestMetric.loadTime,
        memoryUsage: Math.round(latestMetric.memoryUsage / 1024 / 1024),
        apiResponseTime: latestMetric.apiResponseTime,
      },
    };
  }

  /**
   * Check for alerts based on system health
   */
  private checkForAlerts(systemHealth: SystemHealth) {
    if (!this.alertingConfig.enabled) return;

    // Check for service failures
    systemHealth.services.forEach(service => {
      if (service.status === 'unhealthy') {
        this.createAlert({
          type: 'availability',
          severity: 'critical',
          title: `Service ${service.name} is unhealthy`,
          message: service.error || 'Unknown error',
          metadata: { service: service.name, responseTime: service.responseTime },
        });
      } else if (service.status === 'degraded') {
        this.createAlert({
          type: 'performance',
          severity: 'medium',
          title: `Service ${service.name} is degraded`,
          message: service.error || 'Performance issues detected',
          metadata: { service: service.name, responseTime: service.responseTime },
        });
      }
    });

    // Check overall system health
    if (systemHealth.overall === 'unhealthy') {
      this.createAlert({
        type: 'availability',
        severity: 'critical',
        title: 'System is unhealthy',
        message: 'Multiple services are experiencing issues',
        metadata: { services: systemHealth.services.length },
      });
    }
  }

  /**
   * Create and dispatch an alert
   */
  private createAlert(alertData: {
    type: Alert['type'];
    severity: Alert['severity'];
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      timestamp: Date.now(),
      resolved: false,
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(
      a => !a.resolved && a.type === alert.type && a.title === alert.title
    );

    if (existingAlert) {
      // Update existing alert timestamp
      existingAlert.timestamp = Date.now();
      return;
    }

    this.alerts.push(alert);

    // Dispatch alert
    this.dispatchAlert(alert);

    // Clean up old alerts (keep last 50)
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  /**
   * Dispatch alert to configured channels
   */
  private async dispatchAlert(alert: Alert) {
    const { channels } = this.alertingConfig;

    // Console logging
    if (channels.console) {
      const emoji = this.getAlertEmoji(alert.severity);
      console.warn(`${emoji} ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`, {
        message: alert.message,
        metadata: alert.metadata,
        timestamp: new Date(alert.timestamp).toISOString(),
      });
    }

    // Webhook notification
    if (channels.webhook) {
      try {
        await fetch(channels.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...alert,
            timestamp: new Date(alert.timestamp).toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // Send to monitoring service for tracking
    monitoring.trackEvent('alert_triggered', {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
    });
  }

  /**
   * Get emoji for alert severity
   */
  private getAlertEmoji(severity: Alert['severity']): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🔵';
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(resolved?: boolean): Alert[] {
    if (resolved !== undefined) {
      return this.alerts.filter(alert => alert.resolved === resolved);
    }
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all resolved alerts
   */
  clearResolvedAlerts(): number {
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    const cleared = before - this.alerts.length;
    return cleared;
  }

  /**
   * Get system uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Export health data for external monitoring
   */
  async exportHealthData(): Promise<{
    health: SystemHealth;
    alerts: Alert[];
    metrics: any[];
  }> {
    const health = await this.performHealthCheck();
    const alerts = this.getAlerts();
    const metrics = monitoring.getPerformanceMetrics();

    return {
      health,
      alerts,
      metrics,
    };
  }
}

// Export singleton instance
export const healthCheck = new HealthCheckService();

// React hook for health monitoring
export function useHealthMonitoring() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await healthCheck.performHealthCheck();
        setHealth(healthData);
        setAlerts(healthCheck.getAlerts(false)); // Only unresolved alerts
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    health,
    alerts,
    loading,
    resolveAlert: healthCheck.resolveAlert.bind(healthCheck),
    refreshHealth: () => healthCheck.performHealthCheck().then(setHealth),
  };
}

// Add React import
import React from 'react';