import { test, expect } from '@playwright/test'
import { TEST_USERS } from '../fixtures/auth.fixture'
import { waitForPageLoad, checkToast, fillForm } from '../utils/test-helpers'

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await waitForPageLoad(page)
  })

  test('should display login form correctly', async ({ page }) => {
    // Check form elements
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="signup-link"]')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await fillForm(page, {
      'email-input': TEST_USERS.regular.email,
      'password-input': TEST_USERS.regular.password
    })

    // Submit form
    await page.click('[data-testid="login-button"]')

    // Should redirect to home
    await page.waitForURL('/')
    
    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Should show success toast
    await checkToast(page, 'Welcome back!')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill with invalid credentials
    await fillForm(page, {
      'email-input': 'invalid@email.com',
      'password-input': 'wrongpassword'
    })

    // Submit form
    await page.click('[data-testid="login-button"]')

    // Should show error
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid login credentials')
    
    // Should not redirect
    await expect(page).toHaveURL('/auth/login')
  })

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.fill('[data-testid="email-input"]', 'notanemail')
    await page.fill('[data-testid="password-input"]', 'password123')
    
    // Try to submit
    await page.click('[data-testid="login-button"]')

    // Should show validation error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email')
  })

  test('should require password', async ({ page }) => {
    // Only fill email
    await page.fill('[data-testid="email-input"]', TEST_USERS.regular.email)
    
    // Try to submit
    await page.click('[data-testid="login-button"]')

    // Should show validation error
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
  })

  test('should navigate to forgot password', async ({ page }) => {
    await page.click('[data-testid="forgot-password-link"]')
    await page.waitForURL('/auth/forgot-password')
    await expect(page.locator('[data-testid="reset-password-form"]')).toBeVisible()
  })

  test('should navigate to signup', async ({ page }) => {
    await page.click('[data-testid="signup-link"]')
    await page.waitForURL('/auth/signup')
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible()
  })

  test('should remember user with remember me checkbox', async ({ page, context }) => {
    // Check remember me
    await page.check('[data-testid="remember-me-checkbox"]')
    
    // Login
    await fillForm(page, {
      'email-input': TEST_USERS.regular.email,
      'password-input': TEST_USERS.regular.password
    })
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/')

    // Check cookies persist
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name.includes('auth'))
    expect(authCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400) // More than 1 day
  })

  test('should handle OAuth login - Google', async ({ page }) => {
    await page.click('[data-testid="google-login-button"]')
    
    // Should redirect to Google OAuth
    await page.waitForURL(/accounts\.google\.com/)
    expect(page.url()).toContain('accounts.google.com')
  })

  test('should show loading state during login', async ({ page }) => {
    // Fill form
    await fillForm(page, {
      'email-input': TEST_USERS.regular.email,
      'password-input': TEST_USERS.regular.password
    })

    // Click login and check loading state
    const loginButton = page.locator('[data-testid="login-button"]')
    await loginButton.click()
    
    // Button should be disabled and show loading
    await expect(loginButton).toBeDisabled()
    await expect(loginButton).toContainText('Logging in...')
  })
})