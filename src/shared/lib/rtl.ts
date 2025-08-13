/**
 * RTL (Right-to-Left) Language Support Utilities
 * Provides comprehensive support for Arabic and Urdu languages
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Languages that require RTL layout
 */
export const RTL_LANGUAGES = ['ar', 'ur'] as const

/**
 * Check if a language requires RTL layout
 */
export function isRTLLanguage(language: string): boolean {
  return RTL_LANGUAGES.includes(language as any)
}

/**
 * Get text direction for a language
 */
export function getTextDirection(language: string): 'rtl' | 'ltr' {
  return isRTLLanguage(language) ? 'rtl' : 'ltr'
}

/**
 * Hook to manage RTL layout
 * Updates HTML dir attribute and returns current direction
 */
export function useRTL() {
  const { i18n } = useTranslation()
  const direction = getTextDirection(i18n.language)

  useEffect(() => {
    // Update HTML dir attribute
    document.documentElement.dir = direction
    document.documentElement.setAttribute('lang', i18n.language)
    
    // Add RTL class for additional styling hooks
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl')
    } else {
      document.documentElement.classList.remove('rtl')
    }
  }, [i18n.language, direction])

  return {
    direction,
    isRTL: direction === 'rtl',
    language: i18n.language,
  }
}

/**
 * RTL-aware spacing utilities
 * Automatically flips start/end based on direction
 */
export const rtlSpace = {
  marginStart: (value: string) => ({
    marginInlineStart: value,
  }),
  marginEnd: (value: string) => ({
    marginInlineEnd: value,
  }),
  paddingStart: (value: string) => ({
    paddingInlineStart: value,
  }),
  paddingEnd: (value: string) => ({
    paddingInlineEnd: value,
  }),
}

/**
 * RTL-aware positioning utilities
 */
export const rtlPosition = {
  start: (value: string) => ({
    insetInlineStart: value,
  }),
  end: (value: string) => ({
    insetInlineEnd: value,
  }),
}

/**
 * RTL-aware flex utilities
 */
export const rtlFlex = {
  rowReverse: (isRTL: boolean) => ({
    flexDirection: isRTL ? 'row-reverse' : 'row',
  }),
  justifyStart: () => ({
    justifyContent: 'flex-start',
  }),
  justifyEnd: () => ({
    justifyContent: 'flex-end',
  }),
}

/**
 * Get RTL-aware icon position
 */
export function getIconPosition(position: 'left' | 'right', isRTL: boolean): 'left' | 'right' {
  if (isRTL) {
    return position === 'left' ? 'right' : 'left'
  }
  return position
}

/**
 * Format numbers for Arabic locale
 * Converts Western digits to Eastern Arabic digits
 */
export function formatArabicNumber(number: number | string, locale: string): string {
  if (locale !== 'ar') return String(number)
  
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(number).replace(/[0-9]/g, (digit) => arabicDigits[parseInt(digit)])
}

/**
 * Format currency for Dubai/UAE
 */
export function formatCurrency(amount: number, locale: string): string {
  const currency = 'AED'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for different locales
 */
export function formatLocalizedDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }
  
  // Use Islamic calendar for Arabic
  if (locale === 'ar') {
    return new Intl.DateTimeFormat(`${locale}-AE`, {
      ...defaultOptions,
      calendar: 'islamic-civil',
    }).format(date)
  }
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(date)
}

/**
 * Get culturally appropriate greeting based on time of day
 */
export function getLocalizedGreeting(locale: string): string {
  const hour = new Date().getHours()
  
  const greetings = {
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    ar: {
      morning: 'صباح الخير',
      afternoon: 'مساء الخير',
      evening: 'مساء الخير',
      night: 'تصبح على خير',
    },
    hi: {
      morning: 'सुप्रभात',
      afternoon: 'नमस्ते',
      evening: 'शुभ संध्या',
      night: 'शुभ रात्रि',
    },
    ur: {
      morning: 'صبح بخیر',
      afternoon: 'السلام علیکم',
      evening: 'شام بخیر',
      night: 'شب بخیر',
    },
  }
  
  let timeOfDay: keyof typeof greetings.en
  if (hour < 12) timeOfDay = 'morning'
  else if (hour < 17) timeOfDay = 'afternoon'
  else if (hour < 20) timeOfDay = 'evening'
  else timeOfDay = 'night'
  
  const langGreetings = greetings[locale as keyof typeof greetings] || greetings.en
  return langGreetings[timeOfDay]
}

/**
 * RTL-aware text alignment classes
 */
export const rtlTextAlign = {
  start: 'text-start',
  end: 'text-end',
  center: 'text-center',
}

/**
 * Component to handle RTL text rendering
 */
export function RTLText({ 
  children, 
  className = '', 
  forceDirection 
}: { 
  children: React.ReactNode
  className?: string
  forceDirection?: 'rtl' | 'ltr'
}) {
  const { direction } = useRTL()
  const dir = forceDirection || direction
  
  return (
    <span dir={dir} className={className}>
      {children}
    </span>
  )
}