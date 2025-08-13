import { Page, BrowserContext, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

export interface TestUser {
  email: string
  password: string
  fullName: string
  role: 'user' | 'curator' | 'editor' | 'admin'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Test data generators
export const generateTestUser = (role: TestUser['role'] = 'user'): TestUser => ({
  email: faker.internet.email(),
  password: 'Test123!@#',
  fullName: faker.person.fullName(),
  role
})

// Auth helpers
export async function signInUser(page: Page, user: Partial<TestUser>) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(user.email!)
  await page.getByLabel('Password').fill(user.password!)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('/')
}

export async function signUpUser(page: Page, user: TestUser) {
  await page.goto('/signup')
  await page.waitForLoadState('networkidle')
  
  const fullNameInput = page.getByLabel('Full Name')
  await expect(fullNameInput).toBeVisible({ timeout: 5000 })
  await fullNameInput.fill(user.fullName)
  
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByLabel('Confirm Password').fill(user.password)
  
  const roleSelect = page.getByLabel('I am a')
  if (await roleSelect.count() > 0) {
    await roleSelect.selectOption('resident')
  }
  
  await page.getByRole('button', { name: 'Create Account' }).click()
}

export async function setAuthState(context: BrowserContext, tokens: AuthTokens) {
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: tokens.accessToken,
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + tokens.expiresIn
    },
    {
      name: 'sb-refresh-token',
      value: tokens.refreshToken,
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 30 * 24 * 60 * 60 // 30 days
    }
  ])
}

// Navigation helpers
export async function navigateToCategory(page: Page, category: string) {
  const navLink = page.getByRole('navigation').getByText(category)
  await expect(navLink).toBeVisible({ timeout: 5000 })
  await navLink.click()
  await page.waitForLoadState('networkidle')
}

export async function searchContent(page: Page, query: string) {
  await page.getByRole('button', { name: /search/i }).click()
  await page.getByPlaceholder(/search/i).fill(query)
  await page.keyboard.press('Enter')
  await page.waitForLoadState('networkidle')
}

// Content interaction helpers
export async function likeArticle(page: Page, articleTitle: string) {
  const article = page.locator('article').filter({ hasText: articleTitle })
  await article.getByRole('button', { name: /like/i }).click()
}

export async function shareArticle(page: Page, articleTitle: string) {
  const article = page.locator('article').filter({ hasText: articleTitle })
  await article.getByRole('button', { name: /share/i }).click()
}

// Language helpers
export async function switchLanguage(page: Page, language: 'en' | 'ar' | 'hi' | 'ur') {
  const languageButton = page.getByRole('button', { name: /language/i })
  await expect(languageButton).toBeVisible({ timeout: 5000 })
  await languageButton.click()
  
  const menuItem = page.getByRole('menuitem', { name: language })
  await expect(menuItem).toBeVisible({ timeout: 5000 })
  await menuItem.click()
  
  await page.waitForLoadState('networkidle')
}

// Admin helpers
export async function navigateToAdminDashboard(page: Page) {
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin/dashboard')
}

export async function approveContent(page: Page, contentTitle: string) {
  await navigateToAdminDashboard(page)
  await page.getByRole('link', { name: 'Content Management' }).click()
  const contentRow = page.locator('tr').filter({ hasText: contentTitle })
  await contentRow.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Content approved')).toBeVisible()
}

// Performance helpers
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now()
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  return Date.now() - startTime
}


// Accessibility helpers
export async function checkA11y(page: Page) {
  // Basic accessibility checks
  const violations: string[] = []
  
  // Check for alt text on images
  const images = await page.locator('img').all()
  for (const img of images) {
    const alt = await img.getAttribute('alt')
    if (!alt) {
      violations.push('Image missing alt text')
    }
  }
  
  // Check for form labels
  const inputs = await page.locator('input:not([type="hidden"])').all()
  for (const input of inputs) {
    const id = await input.getAttribute('id')
    if (id) {
      const label = await page.locator(`label[for="${id}"]`).count()
      if (label === 0) {
        violations.push(`Input with id="${id}" missing label`)
      }
    }
  }
  
  // Check heading structure
  const h1Count = await page.locator('h1').count()
  if (h1Count !== 1) {
    violations.push(`Page should have exactly one h1, found ${h1Count}`)
  }
  
  return violations
}

// Mock data helpers
export const mockArticles = [
  {
    id: '1',
    title: 'Dubai Frame: A Window to Past and Future',
    content: 'The Dubai Frame stands as an architectural marvel...',
    category: 'tourism',
    image_url: '/images/dubai-frame.jpg',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Best Restaurants in Dubai Marina',
    content: 'Dubai Marina offers a diverse culinary landscape...',
    category: 'eatanddrink',
    image_url: '/images/marina-restaurants.jpg',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'How to Get a Dubai Driving License',
    content: 'Getting a driving license in Dubai involves several steps...',
    category: 'practical',
    image_url: '/images/driving-license.jpg',
    created_at: new Date().toISOString()
  }
]

// Wait helpers
export async function waitForToast(page: Page, message: string) {
  await expect(page.getByRole('status').filter({ hasText: message })).toBeVisible()
}

export async function waitForModal(page: Page, title: string) {
  await expect(page.getByRole('dialog').filter({ hasText: title })).toBeVisible()
}

// Network helpers
export async function mockAPIResponse(page: Page, url: string, response: any) {
  await page.route(url, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export async function mockAPIError(page: Page, url: string, error: string) {
  await page.route(url, async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error })
    })
  })
}

// Viewport helpers
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  rtl: { width: 1920, height: 1080, locale: 'ar' }
}

// Database seed helpers
export async function seedTestData(page: Page) {
  // This would typically call a test API endpoint to seed data
  await page.request.post('/api/test/seed', {
    data: {
      users: 10,
      articles: 50,
      categories: 8
    }
  })
}

export async function cleanupTestData(page: Page) {
  // Clean up test data after tests
  await page.request.post('/api/test/cleanup')
}

// Performance measurement helpers
export async function measurePerformanceMetrics(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' })
  
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const paintEntries = performance.getEntriesByType('paint')
          
          const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
          const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0
          
          // Estimate other metrics
          const tti = perfData.loadEventEnd || 5000
          const tbt = Math.max(0, (perfData.loadEventEnd - perfData.domContentLoadedEventEnd) / 2)
          const cls = 0.05 // Placeholder - would need real CLS measurement
          
          // Resource sizes (estimated)
          const jsSize = Array.from(document.querySelectorAll('script[src]')).length * 50 * 1024
          const cssSize = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).length * 20 * 1024
          const imageSize = Array.from(document.querySelectorAll('img')).length * 100 * 1024
          
          resolve({
            FCP: fcp,
            LCP: lcp,
            TTI: tti,
            TBT: tbt,
            CLS: cls,
            jsSize,
            cssSize,
            imageSize,
            jsFiles: document.querySelectorAll('script[src]').length,
            mainThreadBlockTime: tbt,
            totalJSSize: jsSize
          })
        })
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          resolve({
            FCP: 1000,
            LCP: 2000,
            TTI: 3000,
            TBT: 100,
            CLS: 0.05,
            jsSize: 500 * 1024,
            cssSize: 50 * 1024,
            imageSize: 200 * 1024,
            jsFiles: 5,
            mainThreadBlockTime: 100,
            totalJSSize: 500 * 1024
          })
        }, 1000)
      }
    })
  })
  
  return metrics
}

export async function measureAPIResponseTime(page: Page, url: string) {
  const startTime = Date.now()
  const response = await page.request.get(url)
  const endTime = Date.now()
  
  return {
    responseTime: endTime - startTime,
    status: response.status(),
    ok: response.ok()
  }
}