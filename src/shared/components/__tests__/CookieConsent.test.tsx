import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CookieConsent } from '../CookieConsent'
import { SecureStorage } from '@/shared/lib/security'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock gtag
const gtagMock = vi.fn()
;(window as any).gtag = gtagMock

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Clear the SecureStorage mock
    vi.mocked(SecureStorage.getItem).mockClear()
    vi.mocked(SecureStorage.setItem).mockClear()
    vi.mocked(SecureStorage.removeItem).mockClear()
    vi.mocked(SecureStorage.clear).mockClear()

    // Reset default implementation to return null (no consent)
    vi.mocked(SecureStorage.getItem).mockReturnValue(null)
  })

  test('shows consent banner on first visit', async () => {
    render(<CookieConsent />)

    // Wait for the banner to appear after the setTimeout delay
    await waitFor(
      () => {
        expect(screen.getByText(/We use cookies to enhance your experience/i)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    expect(screen.getByText('Accept All')).toBeInTheDocument()
    expect(screen.getByText('Reject All')).toBeInTheDocument()
    expect(screen.getByText('Customize')).toBeInTheDocument()
  })

  test('hides banner if consent already given', () => {
    // Mock that consent has already been given
    vi.mocked(SecureStorage.getItem).mockReturnValue(true)

    render(<CookieConsent />)

    expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument()
  })

  test('accepts all cookies', async () => {
    render(<CookieConsent />)

    // Wait for the banner to appear
    await waitFor(
      () => {
        expect(screen.getByText('Accept All')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    fireEvent.click(screen.getByText('Accept All'))

    await waitFor(() => {
      // Check that SecureStorage was called with the correct values
      expect(SecureStorage.setItem).toHaveBeenCalledWith('cookie_consent', true)
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        'cookie_preferences',
        expect.objectContaining({
          necessary: true,
          analytics: true,
          marketing: true,
          monitoring: true,
          preferences: true,
          performance: true,
          functional: true,
        })
      )
    })

    // Check Google Analytics is enabled (first call)
    expect(gtagMock).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
    })

    // Check that ads are denied (second call)
    expect(gtagMock).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
  })

  test('rejects all optional cookies', async () => {
    render(<CookieConsent />)

    // Wait for the banner to appear
    await waitFor(
      () => {
        expect(screen.getByText('Reject All')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    fireEvent.click(screen.getByText('Reject All'))

    await waitFor(() => {
      // Check that SecureStorage was called with the correct values for minimal preferences
      expect(SecureStorage.setItem).toHaveBeenCalledWith('cookie_consent', true)
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        'cookie_preferences',
        expect.objectContaining({
          necessary: true,
          analytics: false,
          marketing: false,
          monitoring: false,
          preferences: false,
          performance: false,
          functional: false,
        })
      )
    })

    // Check Google Analytics is denied (first call)
    expect(gtagMock).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'denied',
    })

    // Check that ads are denied (second call)
    expect(gtagMock).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
  })

  test('allows customizing preferences', async () => {
    render(<CookieConsent />)

    // Wait for the banner to appear
    await waitFor(
      () => {
        expect(screen.getByText('Customize')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Open customize dialog
    fireEvent.click(screen.getByText('Customize'))

    // Should see preference options
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.getByText('Necessary Cookies')).toBeInTheDocument()

    // Find analytics toggle - get the second switch (first is necessary, second is analytics)
    const switches = screen.getAllByRole('switch')
    const analyticsToggle = switches[1] // Analytics is the second switch
    expect(analyticsToggle).not.toBeChecked() // Default is unchecked
    // First click to enable it
    fireEvent.click(analyticsToggle)
    expect(analyticsToggle).toBeChecked()
    // Then click again to disable it for the test
    fireEvent.click(analyticsToggle)
    expect(analyticsToggle).not.toBeChecked()

    // Save preferences
    fireEvent.click(screen.getByText('Accept Selected'))

    await waitFor(() => {
      expect(SecureStorage.setItem).toHaveBeenCalledWith('cookie_consent', true)
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        'cookie_preferences',
        expect.objectContaining({
          analytics: false,
        })
      )
    })
  })

  test('shows cookie settings when clicking manage', async () => {
    const { CookieSettingsButton } = await import('../CookieConsent')

    render(<CookieSettingsButton />)

    // Click the cookie settings button
    const cookieButton = screen.getByRole('button', { name: /Cookie Settings/i })
    expect(cookieButton).toBeInTheDocument()
  })

  test('necessary cookies cannot be disabled', async () => {
    render(<CookieConsent />)

    // Wait for the banner to appear
    await waitFor(
      () => {
        expect(screen.getByText('Customize')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    fireEvent.click(screen.getByText('Customize'))

    const switches = screen.getAllByRole('switch')
    const necessarySwitch = switches[0] // Necessary is the first switch
    expect(necessarySwitch).toBeChecked()
    expect(necessarySwitch).toBeDisabled()
  })
})
