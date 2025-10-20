import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/routes/router'
import { AuthProvider } from './features/auth/context/AuthContext'
import { I18nProvider } from './app/providers/I18nProvider'
import { MonitoringProvider } from './app/providers/MonitoringProvider'
import { UserPreferencesProvider } from './app/providers/UserPreferencesProvider'
import { OnboardingProvider } from './app/providers/OnboardingProvider'
import { PWAProvider } from '@/shared/components/pwa'
import { ThemeProvider } from '@/shared/components/theme/ThemeProvider'
import { Toaster } from '@/shared/components/ui/sonner'
import { PWAInstallPrompt } from '@/shared/components/PWAInstallPrompt'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'
import { CookieConsent } from '@/shared/components/CookieConsent'
import { SkipLinks } from '@/shared/components/accessibility/SkipLinks'
import { ScreenReaderProvider, RouteAnnouncer } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { FocusIndicator } from '@/shared/components/accessibility/FocusIndicator'
import { AriaLabelProvider } from '@/shared/components/accessibility/AriaLabelProvider'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { initPerformanceMonitoring } from '@/shared/lib/performance'
import { setupFocusVisible } from '@/shared/lib/accessibility-utils'
import { preloadCriticalComponents, reportPerformanceMetrics, initWebVitals } from '@/shared/lib/performance-optimizer'
import { initGoogleAnalytics } from '@/shared/lib/analytics'
import './app/styles/index.css'

function App() {
  // Initialize performance monitoring and accessibility
  useEffect(() => {
    initPerformanceMonitoring()
    setupFocusVisible()
    
    // Initialize Google Analytics
    initGoogleAnalytics()
    
    // Initialize Web Vitals monitoring
    initWebVitals()
    
    // Report performance metrics after page load
    if ('addEventListener' in window) {
      window.addEventListener('load', () => {
        setTimeout(reportPerformanceMetrics, 1000)
      })
    }
    
    // Preload critical components
    preloadCriticalComponents()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <I18nProvider>
          <ScreenReaderProvider>
            <AuthProvider>
              <MonitoringProvider>
                <UserPreferencesProvider>
                  <OnboardingProvider>
                    <PWAProvider>
                      <SkipLinks />
                      <FocusIndicator />
                      <AriaLabelProvider />
                      <RouteAnnouncer />
                      <OfflineIndicator />
                      <RouterProvider router={router} />
                      <PWAInstallPrompt />
                      <CookieConsent />
                      <Toaster />
                    </PWAProvider>
                  </OnboardingProvider>
                </UserPreferencesProvider>
              </MonitoringProvider>
            </AuthProvider>
          </ScreenReaderProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
