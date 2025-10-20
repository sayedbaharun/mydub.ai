import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { SecureStorage } from '@/shared/lib/secure-storage'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderContext {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark' // The actual theme being used (resolves 'system')
}

const ThemeContext = createContext<ThemeProviderContext | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'mydub-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = SecureStorage.getItem(storageKey) as Theme | null
      return stored || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  })

  useEffect(() => {
    const root = window.document.documentElement

    // Remove previous theme classes
    root.classList.remove('light', 'dark')

    let computedTheme: 'light' | 'dark'

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      computedTheme = systemTheme
    } else {
      computedTheme = theme
    }

    root.classList.add(computedTheme)
    setEffectiveTheme(computedTheme)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        computedTheme === 'dark' ? '#0F0F0F' : '#FAFAFA'
      )
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setEffectiveTheme(newTheme)
      window.document.documentElement.classList.remove('light', 'dark')
      window.document.documentElement.classList.add(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    try {
      SecureStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.error('Error saving theme preference:', error)
      setThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
