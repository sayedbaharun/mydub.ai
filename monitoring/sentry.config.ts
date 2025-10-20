import * as Sentry from '@sentry/react'
import { captureConsoleIntegration } from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.MODE
  
  if (!dsn) {
    console.warn('Sentry DSN not configured')
    return
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Release Tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Error Filtering
    beforeSend(event, hint) {
      // Filter out non-error events in production
      if (environment === 'production') {
        // Ignore specific errors
        const error = hint.originalException
        if (error && error instanceof Error) {
          // Ignore network errors that are expected
          if (error.message?.includes('NetworkError')) {
            return null
          }
          // Ignore browser extension errors
          if (error.message?.includes('extension://')) {
            return null
          }
          // Ignore ResizeObserver errors (common and harmless)
          if (error.message?.includes('ResizeObserver loop limit exceeded')) {
            return null
          }
        }
      }
      
      // Add user context if available
      const user = getUserContext()
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.username,
        }
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          locale: localStorage.getItem('i18nextLng') || 'en',
          theme: localStorage.getItem('theme') || 'light',
          feature_flags: getFeatureFlags(),
        },
      }
      
      return event
    },
    
    // Breadcrumb Configuration
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null
      }
      
      // Add more context to navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: new Date().toISOString(),
        }
      }
      
      return breadcrumb
    },
  })
}

// Helper functions
function getUserContext() {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

function getFeatureFlags() {
  return {
    ai_chat_enabled: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
    weather_enabled: import.meta.env.VITE_ENABLE_WEATHER === 'true',
    news_enabled: import.meta.env.VITE_ENABLE_NEWS === 'true',
  }
}

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary

// Performance monitoring utilities
export const withProfiler = Sentry.withProfiler

// Custom error capture
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

// Track custom events
export function trackEvent(name: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: name,
    category: 'custom',
    level: 'info',
    data,
  })
}