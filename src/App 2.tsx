import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/routes/router'
import { AuthProvider } from './features/auth/context/AuthContext'
import { I18nProvider } from './app/providers/I18nProvider'
import { UserPreferencesProvider } from './app/providers/UserPreferencesProvider'
import { OnboardingProvider } from './app/providers/OnboardingProvider'
import { PWAProvider } from '@/shared/components/pwa'
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
import './app/styles/index.css'

function App() {
  // Initialize performance monitoring and accessibility
  useEffect(() => {
    initPerformanceMonitoring()
    setupFocusVisible()
    
    // Preload critical routes after initial load
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload common routes
        import('./pages/HomePage')
        import('./features/government/pages/GovernmentPage')
        import('./features/news/pages/NewsPage')
      })
    }
  }, [])

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ScreenReaderProvider>
          <AuthProvider>
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
          </AuthProvider>
        </ScreenReaderProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}

export default App
