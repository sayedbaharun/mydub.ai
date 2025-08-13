import { test, expect } from '@playwright/test'
import { viewports } from '../utils/test-helpers'

test.describe('Visual Regression Testing', () => {
  // Increase timeout for visual tests
  test.setTimeout(30000);
  test.describe('Desktop Screenshots', () => {
    test.beforeEach(async ({ page }) => {
      // Set consistent viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Disable animations for consistent screenshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      })
      
      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready)
    })
    
    test('homepage visual consistency', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        animations: 'disabled',
        timeout: 15000
      })
      
      // Component-level screenshots
      await expect(page.getByRole('banner')).toHaveScreenshot('homepage-header.png', { timeout: 10000 })
      await expect(page.getByRole('main')).toHaveScreenshot('homepage-main.png', { timeout: 10000 })
      await expect(page.getByRole('contentinfo')).toHaveScreenshot('homepage-footer.png', { timeout: 10000 })
    })
    
    test('category pages visual consistency', async ({ page }) => {
      const categories = [
        { url: '/tourism', name: 'tourism' },
        { url: '/practical', name: 'practical' },
        { url: '/eatanddrink', name: 'eat-drink' }
      ]
      
      for (const category of categories) {
        await page.goto(category.url)
        await page.waitForLoadState('networkidle')
        
        await expect(page).toHaveScreenshot(`${category.name}-page.png`, {
          fullPage: true,
          animations: 'disabled'
        })
        
        // Article grid screenshot
        const grid = page.locator('.article-grid, [class*="grid"]').first()
        await expect(grid).toHaveScreenshot(`${category.name}-grid.png`)
      }
    })
    
    test('authentication pages visual consistency', async ({ page }) => {
      // Sign in page
      await page.goto('/signin')
      await expect(page).toHaveScreenshot('signin-page.png', {
        fullPage: true
      })
      
      // Sign up page
      await page.goto('/signup')
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true
      })
      
      // Password reset page
      await page.goto('/forgot-password')
      await expect(page).toHaveScreenshot('forgot-password-page.png', {
        fullPage: true
      })
    })
    
    test('interactive elements visual states', async ({ page }) => {
      await page.goto('/')
      
      // Button states
      const button = page.getByRole('button').first()
      await expect(button).toHaveScreenshot('button-default.png')
      
      await button.hover()
      await expect(button).toHaveScreenshot('button-hover.png')
      
      await button.focus()
      await expect(button).toHaveScreenshot('button-focus.png')
      
      // Input states
      await page.goto('/signin')
      const input = page.getByLabel('Email')
      
      await expect(input).toHaveScreenshot('input-default.png')
      
      await input.focus()
      await expect(input).toHaveScreenshot('input-focus.png')
      
      await input.fill('test@example.com')
      await expect(input).toHaveScreenshot('input-filled.png')
      
      // Error state
      await page.getByRole('button', { name: 'Sign In' }).click()
      await expect(input).toHaveScreenshot('input-error.png')
    })
  })
  
  test.describe('Mobile Screenshots', () => {
    test.use(viewports.mobile)
    
    test('mobile navigation visual consistency', async ({ page }) => {
      await page.goto('/')
      
      // Closed menu
      await expect(page).toHaveScreenshot('mobile-homepage.png')
      
      // Open menu
      await page.getByRole('button', { name: /menu/i }).click()
      await expect(page).toHaveScreenshot('mobile-menu-open.png')
    })
    
    test('mobile forms visual consistency', async ({ page }) => {
      await page.goto('/signin')
      await expect(page).toHaveScreenshot('mobile-signin.png', {
        fullPage: true
      })
      
      // Keyboard open state
      await page.getByLabel('Email').focus()
      await page.waitForTimeout(500) // Wait for keyboard animation
      await expect(page).toHaveScreenshot('mobile-signin-keyboard.png')
    })
  })
  
  test.describe('Dark Mode Visual Testing', () => {
    test('dark mode visual consistency', async ({ page }) => {
      await page.goto('/')
      
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      
      await page.waitForTimeout(100) // Wait for transition
      
      // Homepage dark mode
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true
      })
      
      // Components in dark mode
      await expect(page.getByRole('banner')).toHaveScreenshot('header-dark.png')
      
      // Forms in dark mode
      await page.goto('/signin')
      await expect(page).toHaveScreenshot('signin-dark.png', {
        fullPage: true
      })
    })
  })
  
  test.describe('RTL Visual Testing', () => {
    test('arabic layout visual consistency', async ({ page }) => {
      await page.goto('/')
      
      // Switch to Arabic
      await page.evaluate(() => {
        document.documentElement.setAttribute('lang', 'ar')
        document.documentElement.setAttribute('dir', 'rtl')
      })
      
      await page.waitForTimeout(100)
      
      await expect(page).toHaveScreenshot('homepage-rtl.png', {
        fullPage: true
      })
      
      // Navigation in RTL
      await expect(page.getByRole('navigation')).toHaveScreenshot('navigation-rtl.png')
      
      // Forms in RTL
      await page.goto('/signin')
      await expect(page).toHaveScreenshot('signin-rtl.png', {
        fullPage: true
      })
    })
  })
  
  test.describe('Component Visual Testing', () => {
    test('card components visual consistency', async ({ page }) => {
      await page.goto('/tourism')
      
      // Article cards
      const articleCard = page.locator('article').first()
      await expect(articleCard).toHaveScreenshot('article-card.png')
      
      // Hover state
      await articleCard.hover()
      await expect(articleCard).toHaveScreenshot('article-card-hover.png')
    })
    
    test('modal components visual consistency', async ({ page }) => {
      await page.goto('/')
      
      // Search modal
      await page.getByRole('button', { name: /search/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('dialog')).toHaveScreenshot('search-modal.png', { timeout: 15000 })
      
      // Share modal
      await page.goto('/tourism')
      await page.waitForLoadState('networkidle')
      await page.locator('article').first().getByRole('button', { name: /share/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('dialog')).toHaveScreenshot('share-modal.png', { timeout: 15000 })
    })
    
    test('loading states visual consistency', async ({ page }) => {
      // Intercept API calls to show loading states
      await page.route('**/api/**', async route => {
        await page.waitForTimeout(1000)
        await route.continue()
      })
      
      await page.goto('/')
      
      // Capture loading skeleton
      await expect(page.locator('.skeleton, [class*="loading"]').first()).toHaveScreenshot('loading-skeleton.png')
      
      // Spinner
      await expect(page.locator('.spinner, [class*="spin"]').first()).toHaveScreenshot('loading-spinner.png')
    })
  })
  
  test.describe('Cross-browser Visual Testing', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`${browserName} rendering consistency`, async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
          fullPage: true
        })
      })
    })
  })
  
  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ]
    
    breakpoints.forEach(({ name, width, height }) => {
      test(`${name} breakpoint visual consistency`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
          fullPage: true
        })
      })
    })
  })
  
  test.describe('Dynamic Content Visual Testing', () => {
    test('chat interface visual consistency', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /chat.*ai/i }).click()
      
      // Empty chat
      await expect(page.getByRole('dialog')).toHaveScreenshot('chat-empty.png')
      
      // With messages
      await page.getByPlaceholder(/ask.*anything/i).fill('Hello')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      await expect(page.getByRole('dialog')).toHaveScreenshot('chat-with-messages.png')
    })
    
    test('notification states visual consistency', async ({ page }) => {
      await page.goto('/')
      
      // Trigger different notification types
      await page.evaluate(() => {
        // Mock notification system
        const notifications = [
          { type: 'success', message: 'Operation successful!' },
          { type: 'error', message: 'An error occurred' },
          { type: 'warning', message: 'Please note this warning' },
          { type: 'info', message: 'Here is some information' }
        ]
        
        notifications.forEach((notif, index) => {
          setTimeout(() => {
            const toast = document.createElement('div')
            toast.className = `toast toast-${notif.type}`
            toast.textContent = notif.message
            toast.style.position = 'fixed'
            toast.style.top = `${20 + index * 60}px`
            toast.style.right = '20px'
            document.body.appendChild(toast)
          }, index * 100)
        })
      })
      
      await page.waitForTimeout(500)
      await expect(page).toHaveScreenshot('notifications-all-types.png')
    })
  })
})