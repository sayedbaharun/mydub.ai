import { test, expect } from '@playwright/test'
import {
  generateTestUser,
  signUpUser,
  signInUser,
  navigateToCategory,
  searchContent,
  likeArticle,
  shareArticle,
  switchLanguage,
  waitForToast,
  mockArticles,
  viewports
} from '../utils/test-helpers'

test.describe('Complete User Journey', () => {
  test.describe('New User Onboarding Journey', () => {
    test('should complete full onboarding flow', async ({ page }) => {
      const testUser = generateTestUser()
      
      // 1. Land on homepage as guest
      await page.goto('/')
      await expect(page).toHaveTitle(/MyDub\.AI/)
      
      // 2. Browse content as guest
      await expect(page.locator('h1')).toContainText('Welcome to MyDub.AI')
      await expect(page.locator('article').first()).toBeVisible()
      
      // 3. Try to interact with content (should prompt sign in)
      await page.locator('article').first().getByRole('button', { name: /like/i }).click()
      await expect(page).toHaveURL('/signin')
      
      // 4. Navigate to sign up
      await page.getByText('Sign up').click()
      await expect(page).toHaveURL('/signup')
      
      // 5. Complete sign up process
      await signUpUser(page, testUser)
      
      // 6. Verify email (mock verification)
      await page.route('**/auth/v1/verify**', async route => {
        await route.fulfill({ status: 200 })
      })
      
      // 7. Complete profile setup
      await expect(page).toHaveURL('/onboarding/profile')
      await page.getByLabel('Phone Number').fill('+971501234567')
      await page.getByLabel('Preferred Language').selectOption('en')
      await page.getByLabel('I want to receive').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      
      // 8. Select interests
      await expect(page).toHaveURL('/onboarding/interests')
      await page.getByText('Tourism & Attractions').click()
      await page.getByText('Restaurants & Cafes').click()
      await page.getByText('Shopping & Retail').click()
      await page.getByRole('button', { name: 'Complete Setup' }).click()
      
      // 9. Land on personalized homepage
      await expect(page).toHaveURL('/')
      await waitForToast(page, 'Welcome to MyDub.AI!')
      
      // 10. Verify personalized content
      await expect(page.getByText('Recommended for you')).toBeVisible()
    })
    
    test('should handle onboarding interruption and resume', async ({ page, context }) => {
      const testUser = generateTestUser()
      
      // Start sign up process
      await page.goto('/signup')
      await page.getByLabel('Full Name').fill(testUser.fullName)
      await page.getByLabel('Email').fill(testUser.email)
      
      // Simulate browser close/interruption
      await page.reload()
      
      // Form should retain some data (if implemented)
      // Continue with sign up
      await signUpUser(page, testUser)
      
      // Should resume onboarding where left off
      await expect(page).toHaveURL(/\/onboarding/)
    })
  })
  
  test.describe('Content Browsing Journey', () => {
    test('should browse and interact with content across categories', async ({ page }) => {
      const testUser = generateTestUser()
      await signUpUser(page, testUser)
      await signInUser(page, testUser)
      
      // 1. Browse Latest content
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Latest' })).toBeVisible()
      const latestArticles = await page.locator('article').count()
      expect(latestArticles).toBeGreaterThan(0)
      
      // 2. Navigate to Tourism category
      await navigateToCategory(page, 'Tourism')
      await expect(page).toHaveURL('/tourism')
      await expect(page.getByRole('heading', { name: 'Tourism' })).toBeVisible()
      
      // 3. View article details
      const firstArticle = page.locator('article').first()
      const articleTitle = await firstArticle.locator('h2').textContent()
      await firstArticle.click()
      await expect(page.locator('h1')).toContainText(articleTitle!)
      
      // 4. Like the article
      await page.getByRole('button', { name: /like/i }).click()
      await waitForToast(page, 'Added to favorites')
      
      // 5. Share the article
      await page.getByRole('button', { name: /share/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Copy Link' }).click()
      await waitForToast(page, 'Link copied')
      
      // 6. Navigate to Eat & Drink
      await navigateToCategory(page, 'Eat & Drink')
      await expect(page).toHaveURL('/eatanddrink')
      
      // 7. Filter restaurants
      await page.getByRole('button', { name: 'Filter' }).click()
      await page.getByLabel('Cuisine').selectOption('italian')
      await page.getByLabel('Price Range').selectOption('moderate')
      await page.getByRole('button', { name: 'Apply Filters' }).click()
      
      // 8. View restaurant details
      await page.locator('article').first().click()
      await expect(page.getByText('Opening Hours')).toBeVisible()
      await expect(page.getByText('Location')).toBeVisible()
      
      // 9. Save to collection
      await page.getByRole('button', { name: /save/i }).click()
      await page.getByRole('menuitem', { name: 'My Favorites' }).click()
      await waitForToast(page, 'Saved to collection')
    })
    
    test('should use search effectively', async ({ page }) => {
      await page.goto('/')
      
      // 1. Search for specific content
      await searchContent(page, 'Dubai Frame')
      await expect(page).toHaveURL(/\/search\?q=Dubai\+Frame/)
      await expect(page.locator('article').filter({ hasText: 'Dubai Frame' })).toBeVisible()
      
      // 2. Filter search results
      await page.getByRole('button', { name: 'Filter Results' }).click()
      await page.getByLabel('Category').selectOption('tourism')
      await page.getByLabel('Date Range').selectOption('last-week')
      await page.getByRole('button', { name: 'Apply' }).click()
      
      // 3. Sort results
      await page.getByLabel('Sort by').selectOption('relevance')
      
      // 4. No results scenario
      await searchContent(page, 'xyznonexistentquery123')
      await expect(page.getByText('No results found')).toBeVisible()
      await expect(page.getByText('Try different keywords')).toBeVisible()
      
      // 5. Search suggestions
      await page.getByPlaceholder(/search/i).fill('dub')
      await expect(page.getByRole('listbox')).toBeVisible()
      await expect(page.getByRole('option').first()).toContainText('Dubai')
    })
  })
  
  test.describe('AI Chatbot Journey', () => {
    test('should interact with AI assistant', async ({ page }) => {
      await page.goto('/')
      
      // 1. Open chatbot
      // Try multiple selectors for chat button
      const chatButton = page.getByRole('button', { name: /chat|ai|assistant/i }).or(page.getByRole('button').filter({ hasText: /chat|ai|assistant/i }))
      await expect(chatButton).toBeVisible({ timeout: 5000 })
      await chatButton.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      
      // 2. Send initial query
      await page.getByPlaceholder(/ask.*anything/i).fill('What are the best beaches in Dubai?')
      await page.keyboard.press('Enter')
      
      // 3. Receive response
      await expect(page.locator('.ai-response').first()).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.ai-response').first()).toContainText(/beach/i)
      
      // 4. Follow-up question
      await page.getByPlaceholder(/ask.*anything/i).fill('Which one is best for families?')
      await page.keyboard.press('Enter')
      await expect(page.locator('.ai-response').nth(1)).toBeVisible({ timeout: 10000 })
      
      // 5. Change AI model
      await page.getByRole('button', { name: /model/i }).click()
      await page.getByRole('menuitem', { name: 'Claude' }).click()
      
      // 6. Ask in different language
      await switchLanguage(page, 'ar')
      await page.getByPlaceholder(/اسأل/i).fill('ما هي أفضل الشواطئ في دبي؟')
      await page.keyboard.press('Enter')
      await expect(page.locator('.ai-response').last()).toBeVisible({ timeout: 10000 })
      
      // 7. Save conversation
      await page.getByRole('button', { name: /save.*conversation/i }).click()
      await waitForToast(page, 'Conversation saved')
      
      // 8. View conversation history
      await page.getByRole('button', { name: /history/i }).click()
      await expect(page.getByText('What are the best beaches')).toBeVisible()
    })
    
    test('should handle AI errors gracefully', async ({ page }) => {
      await page.goto('/')
      const chatButton = page.getByRole('button', { name: /chat|ai|assistant/i }).or(page.getByRole('button').filter({ hasText: /chat|ai|assistant/i }))
      await expect(chatButton).toBeVisible({ timeout: 5000 })
      await chatButton.click()
      
      // Mock AI service error
      await page.route('**/api/ai/chat**', async route => {
        await route.fulfill({ 
          status: 503,
          body: JSON.stringify({ error: 'Service temporarily unavailable' })
        })
      })
      
      await page.getByPlaceholder(/ask.*anything/i).fill('Test query')
      await page.keyboard.press('Enter')
      
      await expect(page.getByText(/temporarily unavailable/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
    })
  })
  
  test.describe('Multi-language Journey', () => {
    test('should support complete RTL experience', async ({ page }) => {
      await page.goto('/')
      
      // 1. Switch to Arabic
      await switchLanguage(page, 'ar')
      
      // 2. Verify RTL layout
      const html = page.locator('html')
      await expect(html).toHaveAttribute('dir', 'rtl')
      await expect(html).toHaveAttribute('lang', 'ar')
      
      // 3. Verify navigation is RTL
      const nav = page.getByRole('navigation')
      await expect(nav).toHaveCSS('direction', 'rtl')
      
      // 4. Browse content in Arabic
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/مرحبا/i)
      
      // 5. Search in Arabic
      await searchContent(page, 'برج خليفة')
      await expect(page.locator('article').first()).toBeVisible()
      
      // 6. Switch to Hindi
      await switchLanguage(page, 'hi')
      await expect(html).toHaveAttribute('lang', 'hi')
      await expect(html).toHaveAttribute('dir', 'ltr')
      
      // 7. Switch to Urdu (RTL)
      await switchLanguage(page, 'ur')
      await expect(html).toHaveAttribute('dir', 'rtl')
      await expect(html).toHaveAttribute('lang', 'ur')
    })
    
    test('should persist language preference', async ({ page, context }) => {
      await page.goto('/')
      
      // Switch to Arabic
      await switchLanguage(page, 'ar')
      
      // Reload page
      await page.reload()
      
      // Should still be in Arabic
      const html = page.locator('html')
      await expect(html).toHaveAttribute('lang', 'ar')
      
      // Open new tab
      const newPage = await context.newPage()
      await newPage.goto('/')
      
      // New tab should also be in Arabic
      await expect(newPage.locator('html')).toHaveAttribute('lang', 'ar')
    })
  })
  
  test.describe('Profile Management Journey', () => {
    test('should manage user profile and preferences', async ({ page }) => {
      const testUser = generateTestUser()
      await signUpUser(page, testUser)
      await signInUser(page, testUser)
      
      // 1. Navigate to profile
      await page.getByRole('button', { name: /user menu/i }).click()
      await page.getByRole('menuitem', { name: 'Profile' }).click()
      await expect(page).toHaveURL('/profile')
      
      // 2. Update basic info
      await page.getByRole('tab', { name: 'Basic Info' }).click()
      await page.getByLabel('Display Name').clear()
      await page.getByLabel('Display Name').fill('John Dubai')
      await page.getByLabel('Bio').fill('Living in Dubai since 2020')
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await waitForToast(page, 'Profile updated')
      
      // 3. Update preferences
      await page.getByRole('tab', { name: 'Preferences' }).click()
      await page.getByLabel('Email Notifications').uncheck()
      await page.getByLabel('Push Notifications').check()
      await page.getByLabel('Newsletter').selectOption('weekly')
      await page.getByRole('button', { name: 'Save Preferences' }).click()
      await waitForToast(page, 'Preferences updated')
      
      // 4. Manage saved content
      await page.getByRole('tab', { name: 'Saved Content' }).click()
      await expect(page.getByText('My Collections')).toBeVisible()
      await page.getByRole('button', { name: 'Create Collection' }).click()
      await page.getByLabel('Collection Name').fill('Best Restaurants')
      await page.getByLabel('Description').fill('My favorite dining spots')
      await page.getByRole('button', { name: 'Create' }).click()
      await waitForToast(page, 'Collection created')
      
      // 5. View activity history
      await page.getByRole('tab', { name: 'Activity' }).click()
      await expect(page.getByText('Recent Activity')).toBeVisible()
      await expect(page.getByText('Profile updated')).toBeVisible()
      
      // 6. Privacy settings
      await page.getByRole('tab', { name: 'Privacy' }).click()
      await page.getByLabel('Profile Visibility').selectOption('private')
      await page.getByLabel('Show Activity').uncheck()
      await page.getByRole('button', { name: 'Update Privacy' }).click()
      await waitForToast(page, 'Privacy settings updated')
    })
  })
  
  test.describe('Guest to User Conversion', () => {
    test('should convert guest to registered user seamlessly', async ({ page }) => {
      // 1. Browse as guest
      await page.goto('/')
      await navigateToCategory(page, 'Tourism')
      
      // 2. Try premium feature
      await page.getByRole('button', { name: /download.*guide/i }).click()
      await expect(page.getByText('Sign up to download')).toBeVisible()
      
      // 3. Sign up from modal
      await page.getByRole('button', { name: 'Sign Up Now' }).click()
      await expect(page).toHaveURL('/signup?redirect=/tourism')
      
      // 4. Complete sign up
      const testUser = generateTestUser()
      await signUpUser(page, testUser)
      
      // 5. Return to previous action
      await expect(page).toHaveURL('/tourism')
      await expect(page.getByRole('dialog', { name: /download/i })).toBeVisible()
      
      // 6. Complete the action
      await page.getByRole('button', { name: 'Download' }).click()
      await waitForToast(page, 'Download started')
    })
  })
})

test.describe('Mobile User Journey', () => {
  test.use(viewports.mobile)
  
  test('should provide optimized mobile experience', async ({ page }) => {
    await page.goto('/')
    
    // 1. Mobile menu navigation
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // 2. Swipe gestures for content
    const article = page.locator('article').first()
    await article.scrollIntoViewIfNeeded()
    
    // 3. Mobile-optimized forms
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email')
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email')
    
    // 4. Touch-friendly interactions
    const touchTargets = await page.locator('button, a').all()
    for (const target of touchTargets.slice(0, 5)) {
      const box = await target.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
    
    // 5. Responsive images
    const images = await page.locator('img').all()
    for (const img of images.slice(0, 3)) {
      await expect(img).toHaveAttribute('loading', 'lazy')
      const srcset = await img.getAttribute('srcset')
      expect(srcset).toBeTruthy()
    }
  })
})

test.describe('Offline Capability', () => {
  test('should work offline with cached content', async ({ page, context }) => {
    // 1. Visit pages online
    await page.goto('/')
    await navigateToCategory(page, 'Tourism')
    await page.goto('/practical')
    
    // 2. Go offline
    await context.setOffline(true)
    
    // 3. Navigate to cached pages
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // 4. Show offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible()
    
    // 5. Queue actions for sync
    await page.locator('article').first().getByRole('button', { name: /like/i }).click()
    await expect(page.getByText(/saved.*offline/i)).toBeVisible()
    
    // 6. Go back online
    await context.setOffline(false)
    
    // 7. Sync queued actions
    await page.reload()
    await expect(page.getByText(/synced/i)).toBeVisible()
  })
})