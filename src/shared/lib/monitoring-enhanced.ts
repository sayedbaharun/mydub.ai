import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

/**
 * Enhanced Sentry configuration with user context and custom error handling
 */
export const initEnhancedMonitoring = () => {
  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD

  // Only initialize if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    if (isProduction) {
      console.warn('Sentry DSN not configured - error tracking disabled')
    }
    return
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Integrations
    integrations: [
      new BrowserTracing({
        // Set sampling to 100% for development, 10% for production
        tracingOrigins: ['localhost', 'mydub.ai', /^\//],
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
        // Only record when there's an error
        sessionSampleRate: isProduction ? 0.1 : 0,
        errorSampleRate: 1.0,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    
    // Release Health
    autoSessionTracking: true,
    
    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // User cancellations
      'AbortError',
      'cancelled',
      // Common browser quirks
      'Non-Error promise rejection',
      'ResizeObserver loop completed',
    ],
    
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
    ],
    
    // Hooks
    beforeSend(event, hint) {
      // Filter out events from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension://')
      )) {
        return null
      }
      
      // Add custom context
      event.tags = {
        ...event.tags,
        component: hint.originalException?.component || 'unknown',
      }
      
      // In development, log to console as well
      if (isDevelopment) {
        console.error('Sentry Event:', event, hint)
      }
      
      return event
    },
    
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null
      }
      
      // Enhance navigation breadcrumbs
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

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string
  email?: string
  username?: string
  role?: string
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    segment: user.role,
  })
}

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null)
}

/**
 * Add custom context to errors
 */
export const addErrorContext = (context: Record<string, any>) => {
  Sentry.setContext('custom', context)
}

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(eventName, {
    level,
    tags: {
      type: 'custom_event',
    },
    extra: data,
  })
}

/**
 * Performance monitoring helper
 */
export const measurePerformance = (
  transactionName: string,
  operation: string,
  callback: () => Promise<any>
) => {
  const transaction = Sentry.startTransaction({
    name: transactionName,
    op: operation,
  })
  
  Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction))
  
  return callback()
    .then(result => {
      transaction.setStatus('ok')
      return result
    })
    .catch(error => {
      transaction.setStatus('internal_error')
      throw error
    })
    .finally(() => {
      transaction.finish()
    })
}

/**
 * Error boundary fallback component
 */
export const ErrorFallback = ({ error, resetError }: {
  error: Error
  resetError: () => void
}) => {
  React.useEffect(() => {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'ErrorBoundary',
      },
    })
  }, [error])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          We've been notified of this error and are working to fix it.
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// Export Sentry for direct use
export { Sentry }