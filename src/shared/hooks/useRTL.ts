import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { isRTL, getDirection } from '@/i18n/config'

export function useRTL() {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language
  const isRTLLanguage = isRTL(currentLanguage)
  const direction = getDirection(currentLanguage)

  useEffect(() => {
    // Update document direction
    document.documentElement.dir = direction
    document.documentElement.lang = currentLanguage
    
    // Add RTL class for Tailwind utilities
    if (isRTLLanguage) {
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.classList.remove('rtl')
    }
  }, [currentLanguage, direction, isRTLLanguage])

  return {
    isRTL: isRTLLanguage,
    direction,
    language: currentLanguage,
  }
}

// Hook to switch language
export function useLanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language)
      // Language change will trigger useRTL effect
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    languages: i18n.languages,
  }
}