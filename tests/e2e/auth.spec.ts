import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display sign in page', async ({ page }) => {
    await page.goto('/signin')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Sign In')
    
    // Check form elements
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    
    // Check links
    await expect(page.getByText('Forgot password?')).toBeVisible()
    await expect(page.getByText("Don't have an account?")).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/signin')
    
    // Click submit without filling form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Check validation messages
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/signin')
    
    // Enter invalid email
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').click() // Trigger blur
    
    // Check validation message
    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/signin')
    
    // Click sign up link
    await page.getByText('Sign up').click()
    
    // Check navigation
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('h1')).toContainText('Create Account')
  })

  test('should display sign up page with all fields', async ({ page }) => {
    await page.goto('/signup')
    
    // Check form elements
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
    await expect(page.getByLabel('I am a')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('should validate password match', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill form with mismatched passwords
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm Password').fill('password456')
    
    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Check validation message
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should show/hide password', async ({ page }) => {
    await page.goto('/signin')
    
    const passwordInput = page.getByLabel('Password')
    const toggleButton = page.locator('button[aria-label*="password"]')
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle successful sign in', async ({ page }) => {
    await page.goto('/signin')
    
    // Mock successful API response
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'user',
          }
        })
      })
    })
    
    // Fill and submit form
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
  })

  test('should handle sign in error', async ({ page }) => {
    await page.goto('/signin')
    
    // Mock error response
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials'
        })
      })
    })
    
    // Fill and submit form
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show error message
    await expect(page.getByText('Invalid login credentials')).toBeVisible()
  })

  test('should persist auth state', async ({ page, context }) => {
    // Set auth cookie/storage
    await context.addCookies([{
      name: 'sb-access-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/')
    
    // Should not redirect to sign in
    await expect(page).not.toHaveURL('/signin')
  })

  test('should handle sign out', async ({ page, context }) => {
    // Set auth state
    await context.addCookies([{
      name: 'sb-access-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/')
    
    // Click user menu and sign out
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: 'Sign Out' }).click()
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/signin')
  })
})

test.describe('Authentication - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/signin')
    
    // Check that form is properly displayed on mobile
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    
    // Check that layout is mobile-friendly
    const form = page.locator('form')
    const box = await form.boundingBox()
    expect(box?.width).toBeLessThan(375)
  })
})

test.describe('Authentication - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/signin')
    
    // Tab through form elements
    await page.keyboard.press('Tab') // Focus email
    await expect(page.getByLabel('Email')).toBeFocused()
    
    await page.keyboard.press('Tab') // Focus password
    await expect(page.getByLabel('Password')).toBeFocused()
    
    await page.keyboard.press('Tab') // Focus submit button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeFocused()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/signin')
    
    // Check form has proper role
    await expect(page.locator('form')).toHaveAttribute('role', 'form')
    
    // Check inputs have labels
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-label', 'Email')
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-label', 'Password')
    
    // Check error messages are announced
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Email is required')).toHaveAttribute('role', 'alert')
  })
})