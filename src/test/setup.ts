import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Setup before all tests
beforeAll(() => {
  // Add global test utilities
  global.testHelpers = {
    delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    mockDate: (date: string) => vi.setSystemTime(new Date(date)),
    resetDate: () => vi.useRealTimers(),
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    userAgent: 'Mozilla/5.0 (Testing) Vitest',
  },
  writable: true,
})

// Mock fetch for tests
global.fetch = vi.fn()

// Mock Supabase client
vi.mock('@/shared/lib/supabase', () => {
  const createMockQueryBuilder = () => {
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      neq: vi.fn(() => builder),
      gt: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lt: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      like: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      in: vi.fn(() => builder),
      contains: vi.fn(() => builder),
      containedBy: vi.fn(() => builder),
      range: vi.fn(() => builder),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      textSearch: vi.fn(() => builder),
      match: vi.fn(() => builder),
      not: vi.fn(() => builder),
      or: vi.fn(() => builder),
      filter: vi.fn(() => builder),
    }
    return builder
  }

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      from: vi.fn(() => createMockQueryBuilder()),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      }),
      removeChannel: vi.fn(),
    },
  }
})

// Mock SessionManager and SecureStorage - but only for non-security tests
vi.mock('@/shared/lib/security', async () => {
  const actual = await vi.importActual('@/shared/lib/security')

  // Check if we're in a security test file - if so, return actual implementation
  const testPath = expect.getState().testPath
  if (testPath && testPath.includes('security.test')) {
    return actual
  }

  // For other tests, provide mocks
  const mockStorage = new Map<string, any>()

  return {
    ...actual,
    SessionManager: {
      startSession: vi.fn(),
      stopSession: vi.fn(),
      clearSession: vi.fn(),
      resetSession: vi.fn(),
    },
    SecureStorage: {
      getItem: vi.fn((key: string) => mockStorage.get(key) || null),
      setItem: vi.fn((key: string, value: any) => mockStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockStorage.delete(key)),
      clear: vi.fn(() => mockStorage.clear()),
    },
  }
})

// Mock MonitoringProvider
vi.mock('@/app/providers/MonitoringProvider', () => ({
  useMonitoring: () => ({
    isMonitoringInitialized: true,
    isAnalyticsInitialized: true,
    consentGiven: false,
    setConsent: vi.fn(),
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
  }),
  MonitoringProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock useSession hook
vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    session: null,
    isLoading: false,
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
  }),
}))

// Mock AuthContext
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock useToast hook
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [], // Ensure toasts is always an array
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
  toast: vi.fn(),
}))

// Mock GDPR Service
vi.mock('@/features/legal/services/gdpr.service', () => ({
  GDPRService: {
    getPrivacySettings: vi.fn().mockResolvedValue(null),
    recordConsent: vi.fn().mockResolvedValue(undefined),
    updatePrivacySettings: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'cookies.title': 'Cookie Preferences',
        'cookies.description':
          'We use cookies to enhance your experience, analyze traffic, and provide personalized content.',
        'cookies.necessary': 'Necessary Cookies',
        'cookies.necessaryDescription': 'Essential cookies for website functionality.',
        'cookies.preferences': 'Preference Cookies',
        'cookies.preferencesDescription': 'Cookies that remember your preferences.',
        'cookies.customize': 'Customize',
        'cookies.acceptAll': 'Accept All',
        'cookies.rejectAll': 'Reject All',
        'cookies.acceptSelected': 'Accept Selected',
        'cookies.settings': 'Cookie Settings',
        'cookies.learnMore': 'Learn more in our',
        'cookies.and': 'and',
        'common.back': 'Back',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
      }
      return translations[key] || key
    },
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}))

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_ANTHROPIC_API_KEY: 'test-anthropic-key',
    VITE_GOOGLE_GEMINI_API_KEY: 'test-gemini-key',
    VITE_NEWS_API_KEY: 'test-news-key',
  },
}))

// Mock Canvas API for fingerprinting tests
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      fillText: vi.fn(),
      textBaseline: 'top',
      font: '14px Arial',
      canvas: document.createElement('canvas'),
    } as any
  }
  return null
})

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')
