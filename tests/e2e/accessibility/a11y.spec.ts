import { test, expect } from '@playwright/test'
import { checkAccessibility, switchLanguage } from '../utils/test-helpers'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('home page should have no accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check h1 exists and is unique
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    // Check heading order
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({ 
        level: parseInt(el.tagName[1]), 
        text: el.textContent 
      }))
    )
    
    // Verify no heading level is skipped
    let previousLevel = 0
    for (const heading of headings) {
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1)
      previousLevel = heading.level
    }
  })

  test('all interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    
    // Tab through page
    let activeElement
    const interactiveElements = []
    
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab')
      activeElement = await page.evaluate(() => document.activeElement?.tagName)
      if (activeElement === 'BODY') break
      interactiveElements.push(activeElement)
    }
    
    // Check we found interactive elements
    expect(interactiveElements.length).toBeGreaterThan(0)
    
    // Verify all buttons and links are reachable
    const buttonCount = await page.locator('button:visible').count()
    const linkCount = await page.locator('a:visible').count()
    const totalInteractive = buttonCount + linkCount
    
    expect(interactiveElements.length).toBeGreaterThanOrEqual(totalInteractive * 0.8) // 80% coverage
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const src = await img.getAttribute('src')
      
      // Decorative images should have empty alt=""
      // Content images should have descriptive alt text
      if (src?.includes('decoration') || src?.includes('background')) {
        expect(alt).toBe('')
      } else {
        expect(alt).toBeTruthy()
        expect(alt!.length).toBeGreaterThan(0)
      }
    }
  })

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check all inputs have labels
    const inputs = page.locator('input:not([type="hidden"])')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`)
        const labelExists = await label.count() > 0
        
        // Input should have either label, aria-label, or aria-labelledby
        expect(labelExists || ariaLabel || ariaLabelledby).toBeTruthy()
      }
    }
  })

  test('color contrast should meet WCAG standards', async ({ page }) => {
    await page.goto('/')
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ 
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze()
    
    const contrastViolations = results.violations.filter(v => v.id === 'color-contrast')
    expect(contrastViolations).toHaveLength(0)
  })

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/')
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Get focused element
    const focusedElement = page.locator(':focus')
    
    // Check focus styles
    const outlineWidth = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineWidth
    )
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineStyle
    )
    
    // Should have visible outline
    expect(parseInt(outlineWidth)).toBeGreaterThan(0)
    expect(outlineStyle).not.toBe('none')
  })

  test('ARIA landmarks should be properly used', async ({ page }) => {
    await page.goto('/')
    
    // Check for main landmark
    await expect(page.locator('main, [role="main"]')).toHaveCount(1)
    
    // Check for navigation
    await expect(page.locator('nav, [role="navigation"]')).toHaveCount(1)
    
    // Check for banner (header)
    await expect(page.locator('header, [role="banner"]')).toHaveCount(1)
    
    // Check for contentinfo (footer)
    await expect(page.locator('footer, [role="contentinfo"]')).toHaveCount(1)
  })

  test('RTL languages should have proper accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Switch to Arabic
    await switchLanguage(page, 'ar')
    
    // Run accessibility scan in RTL mode
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()
    
    expect(results.violations).toHaveLength(0)
    
    // Check reading order
    const htmlDir = await page.locator('html').getAttribute('dir')
    expect(htmlDir).toBe('rtl')
    
    // Check text alignment
    const bodyTextAlign = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).textAlign
    )
    expect(['right', 'start']).toContain(bodyTextAlign)
  })

  test('error messages should be accessible', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Submit empty form to trigger errors
    await page.click('[data-testid="login-button"]')
    
    // Check error messages have proper ARIA
    const errorMessages = page.locator('[role="alert"], [aria-live="polite"]')
    await expect(errorMessages).toHaveCount(2) // Email and password errors
    
    // Errors should be associated with inputs
    const emailInput = page.locator('[data-testid="email-input"]')
    const emailErrorId = await emailInput.getAttribute('aria-describedby')
    expect(emailErrorId).toBeTruthy()
    
    const emailError = page.locator(`#${emailErrorId}`)
    await expect(emailError).toBeVisible()
  })

  test('modal dialogs should trap focus', async ({ page }) => {
    await page.goto('/')
    
    // Open a modal (assuming there's a search modal)
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[role="dialog"]')
    
    // Tab through modal
    const focusableElements = []
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      const tagName = await page.evaluate(() => document.activeElement?.tagName)
      focusableElements.push(tagName)
      
      // Check if we've cycled back
      if (i > 5 && focusableElements[i] === focusableElements[0]) {
        break
      }
    }
    
    // Focus should be trapped within modal
    const uniqueElements = [...new Set(focusableElements)]
    expect(uniqueElements.length).toBeGreaterThan(1) // Multiple focusable elements
    expect(uniqueElements.length).toBeLessThan(10) // But limited to modal
  })
})