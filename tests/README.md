# MyDub.AI Testing Guide

## Overview

This project uses multiple testing strategies to ensure quality:
- **Unit Tests**: Vitest for component and utility testing
- **E2E Tests**: Playwright for end-to-end testing
- **Visual Tests**: Playwright for visual regression testing
- **Performance Tests**: Playwright for performance metrics
- **Accessibility Tests**: Playwright with axe-core for a11y testing

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run specific test suites
npm run test:e2e:auth          # Authentication tests
npm run test:e2e:user-journey  # User journey tests
npm run test:e2e:admin         # Admin workflow tests
```

### Visual Tests
```bash
# Run visual regression tests
npm run test:visual

# Update visual snapshots
npm run test:visual:update
```

### Performance Tests
```bash
# Run performance tests
npm run test:performance

# Run Lighthouse audit
npm run lighthouse:local
```

### Accessibility Tests
```bash
# Run accessibility tests
npm run test:accessibility
```

## Test Structure

```
tests/
├── e2e/
│   ├── accessibility.spec.ts  # A11y tests
│   ├── admin-workflows.spec.ts # Admin functionality
│   ├── auth.spec.ts           # Authentication flows
│   ├── auth-flows.spec.ts     # Advanced auth scenarios
│   ├── performance.spec.ts    # Performance metrics
│   ├── user-journey.spec.ts   # Complete user flows
│   └── visual.spec.ts         # Visual regression tests
└── unit/
    └── (Vitest tests colocated with source files)
```

## Writing Tests

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    await page.click('button')
    await expect(page.locator('h1')).toContainText('Expected Text')
  })
})
```

### Performance Test Example
```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/')
  const loadTime = Date.now() - startTime
  expect(loadTime).toBeLessThan(3000) // 3 seconds
})
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

The CI pipeline:
1. Runs linting and type checking
2. Runs unit tests
3. Builds the application
4. Runs E2E tests
5. Runs performance tests
6. Uploads test artifacts

## Troubleshooting

### Common Issues

1. **Playwright browsers not installed**
   ```bash
   npx playwright install
   ```

2. **Tests timing out**
   - Ensure dev server is running on port 8001
   - Check that environment variables are set

3. **Visual tests failing**
   - Update snapshots if changes are intentional:
   ```bash
   npm run test:visual:update
   ```

4. **E2E tests failing in CI**
   - Check GitHub Actions logs
   - Download artifacts for debugging

## Best Practices

1. **Keep tests focused**: One test should verify one behavior
2. **Use data-testid**: For reliable element selection
3. **Avoid hard waits**: Use Playwright's built-in waiting
4. **Clean state**: Each test should be independent
5. **Meaningful names**: Test names should describe the scenario

## Environment Variables

For E2E tests, ensure these are set:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PLAYWRIGHT_BASE_URL=http://localhost:8001  # Optional, defaults to localhost:8001
```