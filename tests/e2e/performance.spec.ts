import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Homepage should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check that main content is visible
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve({
            lcp: lastEntry.startTime,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            cls: 0, // Would need more complex measurement
            fid: 0  // Would need user interaction
          })
        }).observe({ entryTypes: ['largest-contentful-paint'] })
      })
    })
    
    // LCP should be under 2.5s for good performance
    expect(metrics.lcp).toBeLessThan(2500)
    
    // FCP should be under 1.8s for good performance
    expect(metrics.fcp).toBeLessThan(1800)
  })

  test('should lazy load images properly', async ({ page }) => {
    await page.goto('/')
    
    // Get all images
    const images = await page.locator('img').all()
    
    // Check that images have loading="lazy" attribute
    for (const img of images) {
      const loading = await img.getAttribute('loading')
      if (await img.isVisible()) {
        // Visible images might not have lazy loading
        continue
      }
      expect(loading).toBe('lazy')
    }
  })

  test('should cache static assets', async ({ page, context }) => {
    // First visit
    await page.goto('/')
    
    // Get response headers for static assets
    const responses: any[] = []
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          headers: response.headers()
        })
      }
    })
    
    // Second visit should use cache
    await page.reload()
    
    // Check that static assets have cache headers
    for (const response of responses) {
      const cacheControl = response.headers['cache-control']
      if (cacheControl) {
        expect(cacheControl).toContain('max-age')
      }
    }
  })

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Navigate through pages
    await page.goto('/news')
    await page.goto('/events')
    await page.goto('/weather')
    await page.goto('/')
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Memory shouldn't increase by more than 50MB
    const memoryIncrease = finalMemory - initialMemory
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })
})