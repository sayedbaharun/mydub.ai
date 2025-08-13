import { test, expect } from '@playwright/test'
import { waitForPageLoad, mockAPIResponse, measurePerformance } from '../utils/test-helpers'

test.describe('News Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/news')
    await waitForPageLoad(page)
  })

  test('should display news feed with articles', async ({ page }) => {
    // Check main elements
    await expect(page.locator('[data-testid="news-feed"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    
    // Check articles loaded
    const articles = page.locator('[data-testid="news-article"]')
    await expect(articles).toHaveCount(10) // Default page size
    
    // Check article structure
    const firstArticle = articles.first()
    await expect(firstArticle.locator('[data-testid="article-title"]')).toBeVisible()
    await expect(firstArticle.locator('[data-testid="article-summary"]')).toBeVisible()
    await expect(firstArticle.locator('[data-testid="article-date"]')).toBeVisible()
    await expect(firstArticle.locator('[data-testid="article-source"]')).toBeVisible()
  })

  test('should filter news by category', async ({ page }) => {
    // Click business category
    await page.click('[data-testid="category-business"]')
    
    // Wait for filtered results
    await page.waitForResponse(response => 
      response.url().includes('/news') && response.url().includes('category=business')
    )
    
    // Check all articles are business category
    const articles = page.locator('[data-testid="news-article"]')
    const count = await articles.count()
    
    for (let i = 0; i < count; i++) {
      await expect(articles.nth(i).locator('[data-testid="article-category"]')).toContainText('Business')
    }
  })

  test('should search news articles', async ({ page }) => {
    const searchTerm = 'Dubai Expo'
    
    // Type in search
    await page.fill('[data-testid="search-input"]', searchTerm)
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/news') && response.url().includes(`search=${searchTerm}`)
    )
    
    // Check results contain search term
    const articles = page.locator('[data-testid="news-article"]')
    const firstArticle = articles.first()
    const title = await firstArticle.locator('[data-testid="article-title"]').textContent()
    const summary = await firstArticle.locator('[data-testid="article-summary"]').textContent()
    
    expect((title + summary).toLowerCase()).toContain(searchTerm.toLowerCase())
  })

  test('should load more articles on scroll', async ({ page }) => {
    // Initial article count
    const initialCount = await page.locator('[data-testid="news-article"]').count()
    expect(initialCount).toBe(10)
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Wait for more articles to load
    await page.waitForResponse(response => 
      response.url().includes('/news') && response.url().includes('page=2')
    )
    
    // Check more articles loaded
    await expect(page.locator('[data-testid="news-article"]')).toHaveCount(20)
  })

  test('should open article detail on click', async ({ page }) => {
    // Click first article
    const firstArticle = page.locator('[data-testid="news-article"]').first()
    const articleTitle = await firstArticle.locator('[data-testid="article-title"]').textContent()
    
    await firstArticle.click()
    
    // Should navigate to article detail
    await page.waitForURL(/\/news\/\d+/)
    
    // Check article detail page
    await expect(page.locator('[data-testid="article-detail-title"]')).toContainText(articleTitle!)
    await expect(page.locator('[data-testid="article-detail-content"]')).toBeVisible()
  })

  test('should save article to favorites when logged in', async ({ page }) => {
    // Mock logged in state
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    await page.reload()
    
    // Click favorite button on first article
    const firstArticle = page.locator('[data-testid="news-article"]').first()
    await firstArticle.locator('[data-testid="favorite-button"]').click()
    
    // Check success feedback
    await expect(page.locator('[data-testid="toast"]')).toContainText('Article saved to favorites')
    
    // Button should show as favorited
    await expect(firstArticle.locator('[data-testid="favorite-button"]')).toHaveAttribute('data-favorited', 'true')
  })

  test('should show trending articles', async ({ page }) => {
    // Check trending section
    await expect(page.locator('[data-testid="trending-section"]')).toBeVisible()
    
    const trendingArticles = page.locator('[data-testid="trending-article"]')
    await expect(trendingArticles).toHaveCount(5)
    
    // Each should have a trend indicator
    const firstTrending = trendingArticles.first()
    await expect(firstTrending.locator('[data-testid="trend-badge"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/news*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    await page.reload()
    
    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load news')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should measure and meet performance targets', async ({ page }) => {
    const metrics = await measurePerformance(page)
    
    // Performance assertions
    expect(metrics.firstContentfulPaint).toBeLessThan(1500) // FCP < 1.5s
    expect(metrics.domContentLoaded).toBeLessThan(2000) // DOM < 2s
    expect(metrics.loadComplete).toBeLessThan(3000) // Load < 3s
  })

  test('should display article images with lazy loading', async ({ page }) => {
    // Check initial images
    const images = page.locator('[data-testid="article-image"]')
    const firstImage = images.first()
    
    // Should have loading="lazy"
    await expect(firstImage).toHaveAttribute('loading', 'lazy')
    
    // Scroll to load more images
    await page.evaluate(() => window.scrollTo(0, 1000))
    
    // Wait for images to load
    await page.waitForTimeout(500)
    
    // Check images are loaded
    const loadedImage = images.nth(5)
    await expect(loadedImage).toHaveAttribute('complete', 'true')
  })
})