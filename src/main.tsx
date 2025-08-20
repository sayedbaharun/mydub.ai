import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { validateEnvironment } from './shared/lib/env-validation'

// Initialize Google Analytics only when configured and in production
function initGoogleAnalytics() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!id) return
  if (!import.meta.env.PROD && import.meta.env.VITE_VERBOSE_DEBUG !== 'true') return

  // Inject gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)

  // Configure gtag
  ;(window as any).dataLayer = (window as any).dataLayer || []
  function gtag(...args: any[]) {
    ;(window as any).dataLayer.push(args)
  }
  ;(window as any).gtag = gtag
  gtag('js', new Date())
  gtag('config', id)
}

// Validate environment variables on app startup
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
  // In production, this will prevent the app from starting with missing config
}

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

// Initialize GA after Sentry
initGoogleAnalytics()

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
