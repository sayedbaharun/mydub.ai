import { ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { useRTL } from '@/shared/hooks/useRTL'

interface I18nProviderProps {
  children: ReactNode
}

// Component to handle RTL updates
function RTLHandler({ children }: { children: ReactNode }) {
  useRTL() // This hook handles all RTL logic
  return <>{children}</>
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // Initialize i18n if not already initialized
    if (!i18n.isInitialized) {
      i18n.init()
    }
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <RTLHandler>{children}</RTLHandler>
    </I18nextProvider>
  )
}