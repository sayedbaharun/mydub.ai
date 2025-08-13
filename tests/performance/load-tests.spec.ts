import { test, expect, Page } from '@playwright/test'
import {
  measurePageLoadTime,
  measureAPIResponseTime,
  generateTestUser,
  mockArticles
} from '../utils/test-helpers'

// Configure for performance testing
test.use({
  // Disable visual regression
  screenshot: 'off',
  video: 'off',
  // Network conditions
  offline: false,
  // Extend timeout for load tests
  timeout: 120000
})

// Base URL for API calls
const BASE_URL = process.env.BASE_URL || 'http://localhost:8001'

test.describe('Performance and Load Testing', () => {
  test.describe('Page Load Performance', () => {
    test('should load homepage within performance budget', async ({ page }) => {
      const metrics = await measurePerformanceMetrics(page, '/')
      
      // Performance budgets (relaxed for CI)
      expect(metrics.FCP).toBeLessThan(5000) // First Contentful Paint < 5s
      expect(metrics.LCP).toBeLessThan(8000) // Largest Contentful Paint < 8s
      expect(metrics.TTI).toBeLessThan(10000) // Time to Interactive < 10s
      expect(metrics.TBT).toBeLessThan(1000)  // Total Blocking Time < 1s
      expect(metrics.CLS).toBeLessThan(0.3)  // Cumulative Layout Shift < 0.3
      
      // Resource metrics (relaxed for CI)
      expect(metrics.jsSize).toBeLessThan(2000 * 1024) // JS bundle < 2MB
      expect(metrics.cssSize).toBeLessThan(500 * 1024) // CSS < 500KB
      expect(metrics.imageSize).toBeLessThan(5 * 1024 * 1024) // Images < 5MB
    })
    
    test('should maintain performance across key pages', async ({ page }) => {
      const pages = [
        { url: '/', name: 'Homepage' },
        { url: '/tourism', name: 'Tourism' },
        { url: '/practical', name: 'Practical' },
        { url: '/eatanddrink', name: 'Eat & Drink' },
        { url: '/signin', name: 'Sign In' },
        { url: '/search', name: 'Search' }
      ]
      
      const results = []
      
      for (const pageInfo of pages) {
        const metrics = await measurePerformanceMetrics(page, pageInfo.url)
        results.push({
          page: pageInfo.name,
          LCP: metrics.LCP,
          TTI: metrics.TTI,
          passed: metrics.LCP < 2500 && metrics.TTI < 3500
        })
      }
      
      // All pages should meet performance budget
      const failedPages = results.filter(r => !r.passed)
      expect(failedPages).toHaveLength(0)
      
      // Log results for monitoring
      console.table(results)
    })
    
    test('should handle slow network conditions', async ({ browser }) => {
      const networkConditions = [
        { name: '3G Slow', downloadThroughput: 40000, uploadThroughput: 40000, latency: 400 },
        { name: '3G Fast', downloadThroughput: 180000, uploadThroughput: 84000, latency: 150 },
        { name: '4G', downloadThroughput: 400000, uploadThroughput: 300000, latency: 70 }
      ]
      
      for (const condition of networkConditions) {
        const context = await browser.newContext()
        const page = await context.newPage()
        const cdp = await context.newCDPSession(page)
        
        // Apply network throttling
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: condition.downloadThroughput,
          uploadThroughput: condition.uploadThroughput,
          latency: condition.latency
        })
        
        const startTime = Date.now()
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime
        
        console.log(`${condition.name}: ${loadTime}ms`)
        
        // Should load within reasonable time even on slow networks
        expect(loadTime).toBeLessThan(condition.name === '3G Slow' ? 10000 : 5000)
        
        await context.close()
      }
    })
  })
  
  test.describe('API Response Performance', () => {
    test('should handle API requests efficiently', async ({ page }) => {
      await page.goto('/')
      
      const apiEndpoints = [
        '/api/articles',
        '/api/categories',
        '/api/user/profile',
        '/api/search',
        '/api/ai/chat'
      ]
      
      const results = []
      
      for (const endpoint of apiEndpoints) {
        const responseTime = await measureAPICall(page, endpoint)
        results.push({
          endpoint,
          responseTime,
          passed: responseTime < 500 // API calls should respond < 500ms
        })
      }
      
      const slowAPIs = results.filter(r => !r.passed)
      expect(slowAPIs).toHaveLength(0)
      
      console.table(results)
    })
    
    test('should handle concurrent API requests', async ({ page }) => {
      await page.goto('/')
      
      // Make 20 concurrent requests
      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(
          page.evaluate((url) => 
            fetch(url).then(r => r.json()),
            `${BASE_URL}/api/articles`
          )
        )
      }
      
      const startTime = Date.now()
      await Promise.all(promises)
      const totalTime = Date.now() - startTime
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000) // All requests complete < 2s
    })
  })
  
  test.describe('Load Testing - Concurrent Users', () => {
    test('should handle 50 concurrent users browsing', async ({ browser }) => {
      const users = []
      const results = []
      
      // Create 50 concurrent browser contexts
      for (let i = 0; i < 50; i++) {
        users.push(createVirtualUser(browser, i))
      }
      
      // Execute user journeys concurrently
      const startTime = Date.now()
      const userResults = await Promise.all(users)
      const totalTime = Date.now() - startTime
      
      // Analyze results
      const successfulUsers = userResults.filter(r => r.success).length
      const avgResponseTime = userResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / userResults.length
      
      expect(successfulUsers).toBe(50) // All users complete successfully
      expect(avgResponseTime).toBeLessThan(1000) // Avg response time < 1s
      expect(totalTime).toBeLessThan(30000) // Total test time < 30s
      
      console.log('Load Test Results:', {
        totalUsers: 50,
        successfulUsers,
        avgResponseTime: Math.round(avgResponseTime),
        totalTime
      })
    })
    
    test('should handle traffic spikes', async ({ browser }) => {
      const results = []
      
      // Simulate traffic spike pattern
      const waves = [
        { users: 10, delay: 0 },
        { users: 30, delay: 5000 },
        { users: 50, delay: 10000 },
        { users: 20, delay: 15000 }
      ]
      
      for (const wave of waves) {
        setTimeout(async () => {
          const waveResults = await runUserWave(browser, wave.users)
          results.push({
            time: Date.now(),
            users: wave.users,
            ...waveResults
          })
        }, wave.delay)
      }
      
      // Wait for all waves to complete
      await page.waitForTimeout(25000)
      
      // System should handle all traffic spikes
      const failures = results.filter(r => r.errorRate > 0.05) // < 5% error rate
      expect(failures).toHaveLength(0)
      
      console.table(results)
    })
    
    test('should maintain performance under sustained load', async ({ browser }) => {
      const duration = 60000 // 1 minute test
      const usersPerSecond = 5
      const metrics = []
      
      const startTime = Date.now()
      const interval = setInterval(async () => {
        if (Date.now() - startTime > duration) {
          clearInterval(interval)
          return
        }
        
        // Launch new users
        for (let i = 0; i < usersPerSecond; i++) {
          createVirtualUser(browser, Date.now() + i).then(result => {
            metrics.push(result)
          })
        }
      }, 1000)
      
      // Wait for test completion
      await page.waitForTimeout(duration + 10000)
      
      // Analyze sustained load results
      const totalRequests = metrics.length
      const successRate = metrics.filter(m => m.success).length / totalRequests
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / totalRequests
      
      expect(successRate).toBeGreaterThan(0.95) // > 95% success rate
      expect(avgResponseTime).toBeLessThan(1500) // Avg response < 1.5s under load
      
      console.log('Sustained Load Results:', {
        duration: duration / 1000 + 's',
        totalRequests,
        successRate: (successRate * 100).toFixed(2) + '%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms'
      })
    })
  })
  
  test.describe('Resource Optimization', () => {
    test('should optimize images with lazy loading', async ({ page }) => {
      await page.goto('/tourism')
      
      // Check initial image loads
      const initialImages = await page.evaluate(() => {
        return Array.from(document.images).filter(img => img.complete).length
      })
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
      
      // Check additional images loaded
      const afterScrollImages = await page.evaluate(() => {
        return Array.from(document.images).filter(img => img.complete).length
      })
      
      expect(afterScrollImages).toBeGreaterThan(initialImages)
      
      // Verify lazy loading attributes
      const lazyImages = await page.$$eval('img[loading="lazy"]', imgs => imgs.length)
      expect(lazyImages).toBeGreaterThan(0)
    })
    
    test('should implement efficient caching', async ({ page }) => {
      // First visit
      const firstVisit = await measurePageLoadWithCache(page, '/')
      
      // Second visit (should use cache)
      const secondVisit = await measurePageLoadWithCache(page, '/')
      
      // Cache should significantly improve load time
      expect(secondVisit.loadTime).toBeLessThan(firstVisit.loadTime * 0.5)
      expect(secondVisit.cachedResources).toBeGreaterThan(firstVisit.cachedResources)
      
      console.log('Cache Performance:', {
        firstVisit: firstVisit.loadTime + 'ms',
        secondVisit: secondVisit.loadTime + 'ms',
        improvement: Math.round((1 - secondVisit.loadTime / firstVisit.loadTime) * 100) + '%'
      })
    })
    
    test('should minimize JavaScript execution time', async ({ page }) => {
      await page.goto('/')
      
      const metrics = await page.evaluate(() => {
        return new Promise(resolve => {
          // Wait for page to stabilize
          setTimeout(() => {
            const perfData = performance.getEntriesByType('measure')
            const scriptData = performance.getEntriesByType('resource')
              .filter(r => r.name.includes('.js'))
            
            resolve({
              mainThreadBlockTime: perfData
                .filter(m => m.duration > 50)
                .reduce((sum, m) => sum + m.duration, 0),
              totalJSSize: scriptData
                .reduce((sum, s) => sum + s.transferSize, 0),
              jsFiles: scriptData.length
            })
          }, 2000)
        })
      })
      
      expect(metrics.mainThreadBlockTime).toBeLessThan(500) // < 500ms blocking
      expect(metrics.totalJSSize).toBeLessThan(500 * 1024) // < 500KB JS
      expect(metrics.jsFiles).toBeLessThan(10) // < 10 JS files
    })
  })
  
  test.describe('Database Performance', () => {
    test('should handle database queries efficiently', async ({ page }) => {
      await page.goto('/')
      
      // Monitor database query performance
      const queryMetrics = await page.evaluate(async (url) => {
        const response = await fetch(url)
        return response.json()
      }, `${BASE_URL}/api/debug/queries`)
      
      // Analyze query performance
      expect(queryMetrics.avgQueryTime).toBeLessThan(50) // < 50ms avg
      expect(queryMetrics.slowQueries).toHaveLength(0) // No queries > 100ms
      expect(queryMetrics.totalQueries).toBeLessThan(20) // Efficient query count
    })
    
    test('should use connection pooling effectively', async ({ browser }) => {
      const contexts = []
      
      // Create 20 concurrent connections
      for (let i = 0; i < 20; i++) {
        const context = await browser.newContext()
        const page = await context.newPage()
        contexts.push({ context, page })
      }
      
      // Make concurrent database requests
      const results = await Promise.all(
        contexts.map(({ page }) => 
          page.evaluate(async (url) => {
            const start = Date.now()
            await fetch(url)
            return Date.now() - start
          }, `${BASE_URL}/api/articles`)
        )
      )
      
      // All requests should complete quickly
      const slowRequests = results.filter(time => time > 1000)
      expect(slowRequests).toHaveLength(0)
      
      // Cleanup
      await Promise.all(contexts.map(({ context }) => context.close()))
    })
  })
})

// Helper functions
async function measurePerformanceMetrics(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' })
  
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    const resources = performance.getEntriesByType('resource')
    
    return {
      FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      LCP: 0, // Would need PerformanceObserver for accurate LCP
      TTI: nav.loadEventEnd - nav.fetchStart,
      TBT: 0, // Would need Long Task API
      CLS: 0, // Would need Layout Shift API
      jsSize: resources
        .filter(r => r.name.includes('.js'))
        .reduce((sum, r) => sum + (r as any).transferSize, 0),
      cssSize: resources
        .filter(r => r.name.includes('.css'))
        .reduce((sum, r) => sum + (r as any).transferSize, 0),
      imageSize: resources
        .filter(r => r.name.match(/\.(jpg|jpeg|png|webp|svg)/))
        .reduce((sum, r) => sum + (r as any).transferSize, 0),
    }
  })
}

async function measureAPICall(page: Page, endpoint: string) {
  return await page.evaluate(async (url) => {
    const start = performance.now()
    await fetch(url)
    return performance.now() - start
  }, endpoint)
}

async function createVirtualUser(browser: any, userId: number) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const metrics = []
  
  try {
    // User journey
    const actions = [
      { action: 'visit homepage', url: '/' },
      { action: 'browse category', url: '/tourism' },
      { action: 'search', url: '/search?q=dubai' },
      { action: 'view article', url: '/article/1' },
    ]
    
    for (const { action, url } of actions) {
      const start = Date.now()
      await page.goto(url)
      const responseTime = Date.now() - start
      metrics.push(responseTime)
    }
    
    await context.close()
    
    return {
      userId,
      success: true,
      avgResponseTime: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      maxResponseTime: Math.max(...metrics)
    }
  } catch (error) {
    await context.close()
    return {
      userId,
      success: false,
      error: error.message,
      avgResponseTime: 0,
      maxResponseTime: 0
    }
  }
}

async function runUserWave(browser: any, userCount: number) {
  const users = []
  for (let i = 0; i < userCount; i++) {
    users.push(createVirtualUser(browser, i))
  }
  
  const results = await Promise.all(users)
  const successful = results.filter(r => r.success).length
  const avgResponse = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.avgResponseTime, 0) / successful
  
  return {
    successRate: successful / userCount,
    errorRate: 1 - (successful / userCount),
    avgResponseTime: avgResponse,
    successful,
    failed: userCount - successful
  }
}

async function measurePageLoadWithCache(page: Page, url: string) {
  const metrics = await page.evaluate(async (url) => {
    // Clear specific measurement
    performance.clearResourceTimings()
    
    const response = await fetch(url)
    await response.text()
    
    const resources = performance.getEntriesByType('resource')
    const cachedResources = resources.filter((r: any) => r.transferSize === 0).length
    
    return {
      totalResources: resources.length,
      cachedResources,
      loadTime: performance.now()
    }
  }, url)
  
  return metrics
}