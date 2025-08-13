import { Page, expect } from '@playwright/test'

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

export async function checkAccessibility(page: Page, options = {}) {
  // Inject axe-core
  await page.addScriptTag({
    path: require.resolve('axe-core/axe.min.js')
  })

  // Run accessibility checks
  const results = await page.evaluate((options) => {
    // @ts-ignore
    return window.axe.run(document, options)
  }, options)

  // Check for violations
  if (results.violations.length > 0) {
    console.error('Accessibility violations found:')
    results.violations.forEach((violation: any) => {
      console.error(`- ${violation.description} (${violation.id})`)
      violation.nodes.forEach((node: any) => {
        console.error(`  - ${node.target.join(', ')}`)
      })
    })
  }

  return results
}

export async function mockAPIResponse(page: Page, pattern: string, response: any) {
  await page.route(pattern, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    })
  })
}

export async function waitForAPICall(page: Page, urlPattern: string) {
  return page.waitForRequest(request => 
    request.url().includes(urlPattern)
  )
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true
  })
}

export async function measurePerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    }
  })
  
  return metrics
}

export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    const selector = `[data-testid="${field}"], [name="${field}"], #${field}`
    await page.fill(selector, value)
  }
}

export async function selectOption(page: Page, selector: string, value: string) {
  await page.click(selector)
  await page.click(`[role="option"][data-value="${value}"]`)
}

export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = await page.locator(selector)
  await fileInput.setInputFiles(filePath)
}

export async function checkToast(page: Page, message: string) {
  const toast = page.locator('[data-testid="toast"]').filter({ hasText: message })
  await expect(toast).toBeVisible()
}

export async function switchLanguage(page: Page, lang: 'en' | 'ar' | 'hi' | 'ur') {
  await page.click('[data-testid="language-switcher"]')
  await page.click(`[data-testid="language-${lang}"]`)
  
  // Wait for language change
  await page.waitForFunction((lang) => {
    return document.documentElement.lang === lang
  }, lang)
  
  // Check RTL for Arabic/Urdu
  if (lang === 'ar' || lang === 'ur') {
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  } else {
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  }
}