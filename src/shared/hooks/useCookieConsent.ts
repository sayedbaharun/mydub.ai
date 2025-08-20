import { useEffect, useState } from 'react'
import { SecureStorage } from '@/shared/lib/security'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  monitoring: boolean
  preferences: boolean
  performance: boolean
  functional: boolean
}

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_PREFERENCES_KEY = 'cookie_preferences'

export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    monitoring: false,
    preferences: false,
    performance: false,
    functional: false,
  })

  useEffect(() => {
    const consent = SecureStorage.getItem(COOKIE_CONSENT_KEY)
    const prefs = SecureStorage.getItem(COOKIE_PREFERENCES_KEY)

    setHasConsented(!!consent)
    if (prefs) {
      setPreferences(prefs)
    }
  }, [])

  return { hasConsented, preferences }
}
