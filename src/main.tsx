import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/routes/router'
import { AuthProvider } from './features/auth/context/AuthContext'
import { I18nProvider } from './app/providers/I18nProvider'
import { MonitoringProvider } from './app/providers/MonitoringProvider'
import { Toaster } from '@/shared/components/ui/toaster'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { getPerformanceMonitor, reportWebVitals } from '@/shared/lib/performance-monitor'
import './app/styles/index.css'

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 404s or auth errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status === 404 || status === 401 || status === 403) {
            return false
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
    },
    mutations: {
      retry: false,
    },
  },
})

// Initialize performance monitoring
if (import.meta.env.PROD) {
  const perfMonitor = getPerformanceMonitor()

  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      perfMonitor.reportMetrics()
      const { passed, issues } = perfMonitor.checkPerformanceThresholds()
      if (!passed) {
        console.warn('Performance thresholds not met:', issues);
      }
    }, 2000)
  })

  // Report Web Vitals
  reportWebVitals()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MonitoringProvider>
          <I18nProvider>
            <AuthProvider>
              <RouterProvider router={router} />
              <Toaster />
            </AuthProvider>
          </I18nProvider>
        </MonitoringProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
)
