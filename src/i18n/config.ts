import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export const defaultNS = 'common'
export const supportedLngs = ['en', 'ar', 'hi', 'ur']
export const namespaces = ['common', 'auth', 'dashboard', 'government', 'news', 'tourism', 'practical', 'search', 'faq', 'about']

// We'll load translations dynamically to avoid import errors
const loadResources = async () => {
  const resources: any = {}
  
  for (const lng of supportedLngs) {
    resources[lng] = {}
    for (const ns of namespaces) {
      try {
        const translation = await import(`./locales/${lng}/${ns}.json`)
        resources[lng][ns] = translation.default || translation
      } catch (error) {
                resources[lng][ns] = {}
      }
    }
  }
  
  return resources
}

// Initialize i18n without resources first
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    ns: namespaces,
    defaultNS,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false, // Disable suspense to handle loading states manually
    },
    
    // We'll add resources after loading them
    resources: {},
  })

// Add direction to i18n instance
i18n.dir = (lng?: string) => {
  const language = lng || i18n.language
  return getDirection(language)
}

// Load resources after initialization
loadResources().then((resources) => {
  Object.keys(resources).forEach((lng) => {
    Object.keys(resources[lng]).forEach((ns) => {
      i18n.addResourceBundle(lng, ns, resources[lng][ns])
    })
  })
})

export default i18n

// Helper function to check if language is RTL
export const isRTL = (language: string): boolean => {
  return ['ar', 'ur'].includes(language)
}

// Helper function to get language direction
export const getDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr'
}