import { test, expect } from '@playwright/test'
import {
  generateTestUser,
  signUpUser,
  signInUser,
  setAuthState,
  waitForToast,
  mockAPIResponse,
  mockAPIError,
  viewports
} from '../utils/test-helpers'

test.describe('Authentication Flows - Complete Validation', () => {
  test.describe('Sign Up Flow', () => {
    test('should complete full sign up with email verification', async ({ page }) => {
      const testUser = generateTestUser()
      
      // 1. Navigate to sign up
      await page.goto('/signup')
      await expect(page).toHaveTitle(/Sign Up.*MyDub\.AI/)
      
      // 2. Fill form with validation
      await page.getByLabel('Full Name').fill('A') // Too short
      await page.getByLabel('Email').fill('invalid-email') // Invalid format
      await page.getByLabel('Password', { exact: true }).fill('weak') // Too weak
      await page.getByRole('button', { name: 'Create Account' }).click()
      
      // 3. Check validation messages
      await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
      await expect(page.getByText('Invalid email address')).toBeVisible()
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
      
      // 4. Fill with valid data
      await page.getByLabel('Full Name').clear()
      await page.getByLabel('Full Name').fill(testUser.fullName)
      await page.getByLabel('Email').clear()
      await page.getByLabel('Email').fill(testUser.email)
      await page.getByLabel('Password', { exact: true }).clear()
      await page.getByLabel('Password', { exact: true }).fill(testUser.password)
      await page.getByLabel('Confirm Password').fill(testUser.password)
      await page.getByLabel('I am a').selectOption('resident')
      
      // 5. Check password strength indicator
      await expect(page.getByText('Strong password')).toBeVisible()
      
      // 6. Accept terms
      await page.getByLabel('I agree to the Terms').check()
      
      // 7. Submit form
      await page.getByRole('button', { name: 'Create Account' }).click()
      
      // 8. Check email verification screen
      await expect(page).toHaveURL('/verify-email')
      await expect(page.getByText(`We've sent a verification email to ${testUser.email}`)).toBeVisible()
      
      // 9. Simulate email verification click
      await page.goto(`/auth/verify?token=mock-verification-token&email=${testUser.email}`)
      await expect(page).toHaveURL('/onboarding/welcome')
      await waitForToast(page, 'Email verified successfully')
    })
    
    test('should handle duplicate email registration', async ({ page }) => {
      const existingEmail = 'existing@example.com'
      
      // Mock API to return duplicate error
      await mockAPIError(page, '**/auth/v1/signup', 'User already registered')
      
      await page.goto('/signup')
      await page.getByLabel('Full Name').fill('Test User')
      await page.getByLabel('Email').fill(existingEmail)
      await page.getByLabel('Password', { exact: true }).fill('Test123!@#')
      await page.getByLabel('Confirm Password').fill('Test123!@#')
      await page.getByLabel('I am a').selectOption('resident')
      await page.getByLabel('I agree to the Terms').check()
      await page.getByRole('button', { name: 'Create Account' }).click()
      
      await expect(page.getByText('User already registered')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign in instead' })).toBeVisible()
    })
    
    test('should validate all form fields', async ({ page }) => {
      await page.goto('/signup')
      
      // Test each field validation
      const validations = [
        {
          field: 'Full Name',
          invalid: ['', 'A', '123', '!!!'],
          valid: 'John Doe',
          error: /name.*must be/i
        },
        {
          field: 'Email',
          invalid: ['', 'notanemail', 'missing@', '@missing.com', 'spaces in@email.com'],
          valid: 'valid@email.com',
          error: /invalid.*email/i
        },
        {
          field: 'Password',
          invalid: ['', 'short', '12345678', 'nouppercaseletters', 'NOLOWERCASE', 'NoNumbers!'],
          valid: 'ValidPass123!',
          error: /password.*must/i
        }
      ]
      
      for (const validation of validations) {
        for (const invalidValue of validation.invalid) {
          await page.getByLabel(validation.field).clear()
          await page.getByLabel(validation.field).fill(invalidValue)
          await page.getByLabel(validation.field).blur()
          await expect(page.getByText(validation.error)).toBeVisible()
        }
        
        await page.getByLabel(validation.field).clear()
        await page.getByLabel(validation.field).fill(validation.valid)
        await page.getByLabel(validation.field).blur()
        await expect(page.getByText(validation.error)).not.toBeVisible()
      }
    })
  })
  
  test.describe('Sign In Flow', () => {
    test('should sign in with email and password', async ({ page }) => {
      await page.goto('/signin')
      
      // 1. Check remember me functionality
      const rememberMe = page.getByLabel('Remember me')
      await rememberMe.check()
      await expect(rememberMe).toBeChecked()
      
      // 2. Sign in
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('Test123!@#')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // 3. Check redirect
      await expect(page).toHaveURL('/')
      await waitForToast(page, 'Welcome back!')
      
      // 4. Verify auth state persistence
      await page.reload()
      await expect(page).not.toHaveURL('/signin')
    })
    
    test('should handle invalid credentials', async ({ page }) => {
      await mockAPIError(page, '**/auth/v1/token**', 'Invalid login credentials')
      
      await page.goto('/signin')
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await expect(page.getByText('Invalid login credentials')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeFocused()
      await expect(page.getByLabel('Password')).toHaveValue('')
    })
    
    test('should handle account lockout', async ({ page }) => {
      await page.goto('/signin')
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await mockAPIError(page, '**/auth/v1/token**', 'Invalid credentials')
        await page.getByLabel('Email').fill('test@example.com')
        await page.getByLabel('Password').fill('wrongpassword')
        await page.getByRole('button', { name: 'Sign In' }).click()
        await page.waitForTimeout(1000)
      }
      
      // Fourth attempt should show lockout
      await mockAPIError(page, '**/auth/v1/token**', 'Account locked. Too many failed attempts.')
      await page.getByLabel('Password').fill('anotherpassword')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await expect(page.getByText('Account locked')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible()
    })
    
    test('should redirect to intended page after sign in', async ({ page }) => {
      // Try to access protected page
      await page.goto('/profile')
      await expect(page).toHaveURL('/signin?redirect=/profile')
      
      // Sign in
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('Test123!@#')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should redirect to originally intended page
      await expect(page).toHaveURL('/profile')
    })
  })
  
  test.describe('Password Reset Flow', () => {
    test('should complete password reset flow', async ({ page }) => {
      // 1. Request password reset
      await page.goto('/signin')
      await page.getByText('Forgot password?').click()
      await expect(page).toHaveURL('/forgot-password')
      
      // 2. Enter email
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByRole('button', { name: 'Send Reset Link' }).click()
      
      // 3. Check confirmation
      await expect(page.getByText('Check your email')).toBeVisible()
      await expect(page.getByText('sent a password reset link to test@example.com')).toBeVisible()
      
      // 4. Simulate clicking reset link
      const resetToken = 'mock-reset-token'
      await page.goto(`/reset-password?token=${resetToken}`)
      
      // 5. Enter new password
      await page.getByLabel('New Password').fill('NewPass123!@#')
      await page.getByLabel('Confirm Password').fill('NewPass123!@#')
      await page.getByRole('button', { name: 'Reset Password' }).click()
      
      // 6. Success and redirect
      await waitForToast(page, 'Password reset successfully')
      await expect(page).toHaveURL('/signin')
      
      // 7. Sign in with new password
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('NewPass123!@#')
      await page.getByRole('button', { name: 'Sign In' }).click()
      await expect(page).toHaveURL('/')
    })
    
    test('should handle expired reset token', async ({ page }) => {
      await page.goto('/reset-password?token=expired-token')
      
      await mockAPIError(page, '**/auth/v1/user**', 'Reset token has expired')
      
      await page.getByLabel('New Password').fill('NewPass123!@#')
      await page.getByLabel('Confirm Password').fill('NewPass123!@#')
      await page.getByRole('button', { name: 'Reset Password' }).click()
      
      await expect(page.getByText('Reset token has expired')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Request new reset link' })).toBeVisible()
    })
  })
  
  test.describe('Session Management', () => {
    test('should maintain session across browser refresh', async ({ page, context }) => {
      // Set auth tokens
      await setAuthState(context, {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      })
      
      await page.goto('/')
      await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
      
      // Refresh page
      await page.reload()
      await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
      
      // Hard refresh
      await page.reload({ waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
    })
    
    test('should refresh expired token automatically', async ({ page, context }) => {
      // Set expired access token
      await setAuthState(context, {
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: -1 // Already expired
      })
      
      // Mock refresh token endpoint
      await mockAPIResponse(page, '**/auth/v1/token?grant_type=refresh_token', {
        access_token: 'new-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token'
      })
      
      await page.goto('/')
      
      // Should automatically refresh and stay logged in
      await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
      
      // Verify new token is used
      const cookies = await context.cookies()
      const accessToken = cookies.find(c => c.name === 'sb-access-token')
      expect(accessToken?.value).toBe('new-access-token')
    })
    
    test('should handle refresh token failure', async ({ page, context }) => {
      // Set expired tokens
      await setAuthState(context, {
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresIn: -1
      })
      
      // Mock refresh failure
      await mockAPIError(page, '**/auth/v1/token?grant_type=refresh_token', 'Invalid refresh token')
      
      await page.goto('/profile')
      
      // Should redirect to sign in
      await expect(page).toHaveURL('/signin?redirect=/profile')
      await expect(page.getByText('Session expired. Please sign in again.')).toBeVisible()
    })
    
    test('should handle concurrent requests with expired token', async ({ page, context }) => {
      await setAuthState(context, {
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: -1
      })
      
      let refreshCount = 0
      await page.route('**/auth/v1/token?grant_type=refresh_token', async route => {
        refreshCount++
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            access_token: 'new-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'new-refresh-token'
          })
        })
      })
      
      // Make multiple concurrent requests
      await page.goto('/')
      await Promise.all([
        page.waitForRequest('**/api/user**'),
        page.waitForRequest('**/api/articles**'),
        page.waitForRequest('**/api/categories**')
      ])
      
      // Should only refresh token once
      expect(refreshCount).toBe(1)
    })
  })
  
  test.describe('Social Authentication', () => {
    test('should sign in with Google', async ({ page }) => {
      await page.goto('/signin')
      
      // Mock Google OAuth
      await page.route('**/auth/v1/authorize**', async route => {
        if (route.request().url().includes('provider=google')) {
          await route.fulfill({
            status: 302,
            headers: {
              'Location': 'http://localhost:5173/auth/callback?code=google-auth-code'
            }
          })
        }
      })
      
      await page.getByRole('button', { name: /sign in with google/i }).click()
      
      // Handle callback
      await expect(page).toHaveURL(/\/auth\/callback/)
      await waitForToast(page, 'Signed in with Google')
      await expect(page).toHaveURL('/')
    })
    
    test('should handle social auth errors', async ({ page }) => {
      await page.goto('/signin')
      
      await mockAPIError(page, '**/auth/v1/authorize**', 'OAuth provider error')
      
      await page.getByRole('button', { name: /sign in with google/i }).click()
      
      await expect(page.getByText('Failed to sign in with Google')).toBeVisible()
      await expect(page).toHaveURL('/signin')
    })
  })
  
  test.describe('Multi-device Authentication', () => {
    test('should sync auth across multiple tabs', async ({ context }) => {
      // Sign in on first tab
      const page1 = await context.newPage()
      await page1.goto('/signin')
      await signInUser(page1, { email: 'test@example.com', password: 'Test123!@#' })
      await expect(page1).toHaveURL('/')
      
      // Open second tab
      const page2 = await context.newPage()
      await page2.goto('/')
      
      // Should be signed in
      await expect(page2.getByRole('button', { name: /user menu/i })).toBeVisible()
      
      // Sign out from first tab
      await page1.getByRole('button', { name: /user menu/i }).click()
      await page1.getByRole('menuitem', { name: 'Sign Out' }).click()
      
      // Second tab should detect sign out
      await page2.reload()
      await expect(page2).toHaveURL('/signin')
    })
  })
  
  test.describe('Security Features', () => {
    test('should enforce password requirements', async ({ page }) => {
      await page.goto('/signup')
      
      const passwords = [
        { pass: 'short', error: 'at least 8 characters' },
        { pass: 'alllowercase', error: 'uppercase letter' },
        { pass: 'ALLUPPERCASE', error: 'lowercase letter' },
        { pass: 'NoNumbers', error: 'number' },
        { pass: 'NoSpecial8', error: 'special character' },
        { pass: 'Valid123!', error: null }
      ]
      
      for (const { pass, error } of passwords) {
        await page.getByLabel('Password', { exact: true }).clear()
        await page.getByLabel('Password', { exact: true }).fill(pass)
        await page.getByLabel('Password', { exact: true }).blur()
        
        if (error) {
          await expect(page.getByText(error)).toBeVisible()
        } else {
          await expect(page.getByText('Strong password')).toBeVisible()
        }
      }
    })
    
    test('should prevent XSS in authentication forms', async ({ page }) => {
      await page.goto('/signin')
      
      const xssPayload = '<script>alert("XSS")</script>'
      await page.getByLabel('Email').fill(xssPayload)
      await page.getByLabel('Password').fill(xssPayload)
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      // Should sanitize input and show validation error
      await expect(page.getByText('Invalid email address')).toBeVisible()
      
      // Check no script execution
      const alerts = []
      page.on('dialog', dialog => alerts.push(dialog))
      await page.waitForTimeout(1000)
      expect(alerts).toHaveLength(0)
    })
    
    test('should implement CSRF protection', async ({ page }) => {
      await page.goto('/signin')
      
      // Check for CSRF token
      const csrfToken = await page.evaluate(() => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      })
      expect(csrfToken).toBeTruthy()
      
      // Verify token is sent with requests
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/auth/v1/token') &&
        request.headers()['x-csrf-token'] === csrfToken
      )
      
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('Test123!@#')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      await requestPromise
    })
  })
})