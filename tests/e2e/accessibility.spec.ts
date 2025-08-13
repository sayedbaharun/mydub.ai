import { test, expect, Page } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

// Test configuration for different viewport sizes
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
]

// Pages to test
const pagesToTest = [
  { path: '/', name: 'Home' },
  { path: '/news', name: 'News' },
  { path: '/eatanddrink', name: 'Dining' },
  { path: '/tourism', name: 'Tourism' },
  { path: '/government', name: 'Government' },
  { path: '/chat', name: 'AI Chat' },
  { path: '/search', name: 'Search' },
]

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into the page
    await injectAxe(page)
  })

  // Test each page for accessibility violations
  pagesToTest.forEach(({ path, name }) => {
    test(`${name} page should have no accessibility violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      
      // Check for accessibility violations
      const violations = await getViolations(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      })
      
      // Log violations for debugging
      if (violations.length > 0) {
        console.log(`Accessibility violations on ${name} page:`)
        violations.forEach((violation) => {
          console.log(`- ${violation.id}: ${violation.description}`)
          console.log(`  Impact: ${violation.impact}`)
          console.log(`  Affected elements: ${violation.nodes.length}`)
        })
      }
      
      expect(violations).toHaveLength(0)
    })
  })

  // Test keyboard navigation
  test('should be fully navigable using keyboard only', async ({ page }) => {
    await page.goto('/')
    
    // Test tab navigation through interactive elements
    const interactiveElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab')
      
      // Check if an element has focus
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el?.tagName,
          className: el?.className,
          hasVisibleFocus: window.getComputedStyle(el as Element).outlineStyle !== 'none',
        }
      })
      
      expect(focusedElement.tagName).toBeTruthy()
      expect(focusedElement.hasVisibleFocus).toBe(true)
    }
  })

  // Test focus trapping in modals
  test('should handle focus trapping in modals', async ({ page }) => {
    await page.goto('/')
    
    // Open a modal (assuming there's a button that opens a modal)
    const modalTrigger = await page.$('[data-testid="modal-trigger"], button:has-text("Sign In")')
    if (modalTrigger) {
      await modalTrigger.click()
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })
      
      // Test that focus is trapped within the modal
      const focusableInModal = await page.$$('[role="dialog"] a, [role="dialog"] button, [role="dialog"] input')
      
      if (focusableInModal.length > 0) {
        // Tab through all elements and verify focus stays in modal
        for (let i = 0; i < focusableInModal.length + 2; i++) {
          await page.keyboard.press('Tab')
        }
        
        const focusedElement = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]')
          return dialog?.contains(document.activeElement)
        })
        
        expect(focusedElement).toBe(true)
      }
    }
  })

  // Test screen reader announcements
  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/')
    
    // Check for live regions
    const liveRegions = await page.$$('[aria-live], [role="alert"], [role="status"]')
    expect(liveRegions.length).toBeGreaterThan(0)
    
    // Test search functionality announces results
    const searchInput = await page.$('input[type="search"]')
    if (searchInput) {
      await searchInput.fill('dubai mall')
      await page.keyboard.press('Enter')
      
      // Wait for results and check for announcement
      await page.waitForTimeout(1000)
      
      const announcement = await page.$('[aria-live="polite"], [role="status"]')
      expect(announcement).toBeTruthy()
    }
  })

  // Test color contrast
  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast'],
      },
    })
    
    expect(violations).toHaveLength(0)
  })

  // Test form accessibility
  test('should have accessible forms', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check form labels
    const inputs = await page.$$('input:not([type="hidden"])')
    
    for (const input of inputs) {
      const hasLabel = await input.evaluate((el) => {
        const id = el.id
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          if (label) return true
        }
        
        // Check for aria-label or aria-labelledby
        return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
      })
      
      expect(hasLabel).toBe(true)
    }
    
    // Check error states
    const submitButton = await page.$('button[type="submit"]')
    if (submitButton) {
      await submitButton.click()
      
      // Wait for validation
      await page.waitForTimeout(500)
      
      // Check for error messages with proper ARIA
      const errorMessages = await page.$$('[role="alert"], [aria-live="assertive"]')
      expect(errorMessages.length).toBeGreaterThan(0)
    }
  })

  // Test responsive design and touch targets
  viewports.forEach(({ name, width, height }) => {
    test(`should have accessible touch targets on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      
      // Check minimum touch target size (44x44 pixels)
      const buttons = await page.$$('button, a, [role="button"]')
      
      for (const button of buttons.slice(0, 10)) {
        const box = await button.boundingBox()
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })
  })

  // Test RTL support
  test('should properly handle RTL languages', async ({ page }) => {
    await page.goto('/')
    
    // Switch to Arabic
    const langSwitcher = await page.$('[data-testid="language-switcher"], select')
    if (langSwitcher) {
      await langSwitcher.selectOption('ar')
      await page.waitForTimeout(500)
      
      // Check document direction
      const dir = await page.evaluate(() => document.documentElement.dir)
      expect(dir).toBe('rtl')
      
      // Check that layout is properly mirrored
      const header = await page.$('header')
      if (header) {
        const styles = await header.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            direction: computed.direction,
            textAlign: computed.textAlign,
          }
        })
        
        expect(styles.direction).toBe('rtl')
      }
    }
  })

  // Test image alt texts
  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.$$('img')
    
    for (const img of images) {
      const hasAltText = await img.evaluate((el) => {
        // Decorative images should have empty alt text
        // Informative images should have descriptive alt text
        return el.hasAttribute('alt')
      })
      
      expect(hasAltText).toBe(true)
    }
  })

  // Test skip links
  test('should have skip links for navigation', async ({ page }) => {
    await page.goto('/')
    
    // Focus the skip link (usually hidden until focused)
    await page.keyboard.press('Tab')
    
    const skipLink = await page.$('a[href="#main"], a[href="#content"], [data-testid="skip-link"]')
    expect(skipLink).toBeTruthy()
    
    if (skipLink) {
      const isVisible = await skipLink.isVisible()
      expect(isVisible).toBe(true)
    }
  })

  // Test ARIA landmarks
  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/')
    
    const landmarks = {
      banner: await page.$('[role="banner"], header'),
      navigation: await page.$('[role="navigation"], nav'),
      main: await page.$('[role="main"], main'),
      contentinfo: await page.$('[role="contentinfo"], footer'),
    }
    
    Object.entries(landmarks).forEach(([name, element]) => {
      expect(element).toBeTruthy()
    })
  })

  // Test heading hierarchy
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    const headings = await page.evaluate(() => {
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      return allHeadings.map((h) => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent,
      }))
    })
    
    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length
    expect(h1Count).toBe(1)
    
    // Check for skipped heading levels
    const levels = headings.map(h => h.level)
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1]
      expect(diff).toBeLessThanOrEqual(1)
    }
  })

  // Test error handling and recovery
  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page')
    
    // Should show an accessible error page
    const heading = await page.$('h1')
    expect(heading).toBeTruthy()
    
    // Should provide a way to navigate back
    const homeLink = await page.$('a[href="/"]')
    expect(homeLink).toBeTruthy()
    
    // Check accessibility of error page
    await checkA11y(page)
  })

  // Test loading states
  test('should have accessible loading states', async ({ page }) => {
    await page.goto('/news')
    
    // Check for loading indicators with proper ARIA
    const loadingIndicators = await page.$$('[aria-busy="true"], [role="status"]')
    
    for (const indicator of loadingIndicators) {
      const hasAriaLabel = await indicator.evaluate((el) => {
        return el.hasAttribute('aria-label') || el.textContent?.trim().length > 0
      })
      expect(hasAriaLabel).toBe(true)
    }
  })
})

// Additional test for mobile-specific accessibility
test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } })
  
  test('should have accessible mobile navigation', async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
    
    // Check for mobile menu button
    const menuButton = await page.$('[aria-label*="menu"], button:has-text("Menu")')
    expect(menuButton).toBeTruthy()
    
    if (menuButton) {
      // Check ARIA attributes
      const ariaExpanded = await menuButton.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)
      
      // Open menu
      await menuButton.click()
      await page.waitForTimeout(300)
      
      // Check focus management
      const firstMenuItem = await page.$('[role="menu"] a, [role="menuitem"]')
      if (firstMenuItem) {
        const isFocused = await firstMenuItem.evaluate((el) => el === document.activeElement)
        expect(isFocused).toBe(true)
      }
    }
    
    // Check mobile-specific accessibility
    await checkA11y(page)
  })
})

// Performance-related accessibility tests
test.describe('Performance Accessibility', () => {
  test('should maintain accessibility during slow connections', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100)
    })
    
    await page.goto('/')
    await injectAxe(page)
    
    // Even with slow loading, basic accessibility should be maintained
    await checkA11y(page, null, {
      runOnly: {
        type: 'rule',
        values: ['document-title', 'html-has-lang', 'bypass'],
      },
    })
  })
})