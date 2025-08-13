// Alert configuration for monitoring various aspects of the application

export interface AlertThreshold {
  warning: number
  critical: number
  unit: 'ms' | 'percent' | 'count' | 'bytes'
}

export interface AlertConfig {
  name: string
  description: string
  metric: string
  thresholds: AlertThreshold
  window: number // in minutes
  notifications: NotificationChannel[]
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sentry'
  config: Record<string, any>
}

// Performance Alerts
export const performanceAlerts: AlertConfig[] = [
  {
    name: 'High Page Load Time',
    description: 'Page load time exceeds acceptable threshold',
    metric: 'navigation.loadComplete',
    thresholds: {
      warning: 3000,
      critical: 5000,
      unit: 'ms'
    },
    window: 5,
    notifications: [
      {
        type: 'sentry',
        config: { level: 'warning' }
      }
    ]
  },
  {
    name: 'Poor LCP Score',
    description: 'Largest Contentful Paint is too slow',
    metric: 'webvitals.LCP',
    thresholds: {
      warning: 2500,
      critical: 4000,
      unit: 'ms'
    },
    window: 15,
    notifications: [
      {
        type: 'sentry',
        config: { level: 'warning' }
      }
    ]
  },
  {
    name: 'High Cumulative Layout Shift',
    description: 'Page has too much layout shift',
    metric: 'webvitals.CLS',
    thresholds: {
      warning: 0.1,
      critical: 0.25,
      unit: 'count'
    },
    window: 15,
    notifications: [
      {
        type: 'sentry',
        config: { level: 'warning' }
      }
    ]
  },
  {
    name: 'Slow API Response',
    description: 'API endpoints responding slowly',
    metric: 'api.response_time',
    thresholds: {
      warning: 1000,
      critical: 3000,
      unit: 'ms'
    },
    window: 5,
    notifications: [
      {
        type: 'slack',
        config: { channel: '#alerts' }
      }
    ]
  }
]

// Error Rate Alerts
export const errorAlerts: AlertConfig[] = [
  {
    name: 'High Error Rate',
    description: 'Application error rate is above threshold',
    metric: 'errors.rate',
    thresholds: {
      warning: 5,
      critical: 10,
      unit: 'percent'
    },
    window: 10,
    notifications: [
      {
        type: 'email',
        config: { to: ['dev-team@mydub.ai'] }
      },
      {
        type: 'sentry',
        config: { level: 'error' }
      }
    ]
  },
  {
    name: 'Authentication Failures',
    description: 'High rate of authentication failures',
    metric: 'auth.failure_rate',
    thresholds: {
      warning: 10,
      critical: 25,
      unit: 'percent'
    },
    window: 15,
    notifications: [
      {
        type: 'slack',
        config: { channel: '#security' }
      }
    ]
  },
  {
    name: 'Database Connection Errors',
    description: 'Database connection failures detected',
    metric: 'database.connection_errors',
    thresholds: {
      warning: 5,
      critical: 10,
      unit: 'count'
    },
    window: 5,
    notifications: [
      {
        type: 'webhook',
        config: { url: process.env.ALERT_WEBHOOK_URL }
      }
    ]
  }
]

// Business Metrics Alerts
export const businessAlerts: AlertConfig[] = [
  {
    name: 'Low User Engagement',
    description: 'User engagement metrics dropping',
    metric: 'business.active_users',
    thresholds: {
      warning: 80, // 80% of normal
      critical: 60, // 60% of normal
      unit: 'percent'
    },
    window: 60,
    notifications: [
      {
        type: 'email',
        config: { to: ['product-team@mydub.ai'] }
      }
    ]
  },
  {
    name: 'Search Performance',
    description: 'Search results taking too long',
    metric: 'search.response_time',
    thresholds: {
      warning: 500,
      critical: 1000,
      unit: 'ms'
    },
    window: 10,
    notifications: [
      {
        type: 'slack',
        config: { channel: '#search-team' }
      }
    ]
  },
  {
    name: 'AI Service Failures',
    description: 'AI service request failures',
    metric: 'ai.failure_rate',
    thresholds: {
      warning: 5,
      critical: 10,
      unit: 'percent'
    },
    window: 15,
    notifications: [
      {
        type: 'sentry',
        config: { level: 'error' }
      }
    ]
  }
]

// Security Alerts
export const securityAlerts: AlertConfig[] = [
  {
    name: 'Suspicious Login Activity',
    description: 'Multiple failed login attempts detected',
    metric: 'security.failed_logins',
    thresholds: {
      warning: 10,
      critical: 20,
      unit: 'count'
    },
    window: 5,
    notifications: [
      {
        type: 'email',
        config: { to: ['security@mydub.ai'] }
      },
      {
        type: 'slack',
        config: { channel: '#security-alerts' }
      }
    ]
  },
  {
    name: 'Rate Limit Violations',
    description: 'API rate limits being exceeded',
    metric: 'security.rate_limit_violations',
    thresholds: {
      warning: 50,
      critical: 100,
      unit: 'count'
    },
    window: 10,
    notifications: [
      {
        type: 'webhook',
        config: { url: process.env.SECURITY_WEBHOOK_URL }
      }
    ]
  }
]

// Infrastructure Alerts
export const infrastructureAlerts: AlertConfig[] = [
  {
    name: 'High Memory Usage',
    description: 'Application memory usage is high',
    metric: 'system.memory_usage',
    thresholds: {
      warning: 80,
      critical: 90,
      unit: 'percent'
    },
    window: 10,
    notifications: [
      {
        type: 'slack',
        config: { channel: '#ops' }
      }
    ]
  },
  {
    name: 'Storage Space Low',
    description: 'Storage space running low',
    metric: 'system.disk_usage',
    thresholds: {
      warning: 80,
      critical: 90,
      unit: 'percent'
    },
    window: 30,
    notifications: [
      {
        type: 'email',
        config: { to: ['ops-team@mydub.ai'] }
      }
    ]
  }
]

// Combine all alerts
export const allAlerts: AlertConfig[] = [
  ...performanceAlerts,
  ...errorAlerts,
  ...businessAlerts,
  ...securityAlerts,
  ...infrastructureAlerts
]

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Alert evaluation function
export function evaluateAlert(
  alert: AlertConfig,
  currentValue: number
): AlertSeverity | null {
  if (currentValue >= alert.thresholds.critical) {
    return AlertSeverity.CRITICAL
  } else if (currentValue >= alert.thresholds.warning) {
    return AlertSeverity.WARNING
  }
  return null
}

// Export alert groups for easy access
export const alertGroups = {
  performance: performanceAlerts,
  errors: errorAlerts,
  business: businessAlerts,
  security: securityAlerts,
  infrastructure: infrastructureAlerts
}