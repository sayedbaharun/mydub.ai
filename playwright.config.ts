import { defineConfig, devices } from '@playwright/test'
import path from 'path'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Test timeout */
  timeout: 30 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Maximum time each action can take */
    actionTimeout: 10 * 1000,
    
    /* Test id attribute */
    testIdAttribute: 'data-testid',
    
    /* Emulate user locale and timezone */
    locale: 'en-US',
    timezoneId: 'Asia/Dubai',
    
    /* Viewport for tests */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Permissions */
    permissions: ['geolocation'],
    
    /* Geolocation for Dubai */
    geolocation: { latitude: 25.2048, longitude: 55.2708 },
  },

  /* Configure projects for major browsers */
  projects: [
    /* Desktop Browsers */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile Browsers */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        locale: 'ar-AE',
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        locale: 'ar-AE',
      },
    },

    /* Tablet */
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },

    /* Accessibility Testing */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force color scheme for contrast testing
        colorScheme: 'dark',
      },
    },

    /* Performance Testing */
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials'
          ]
        },
        // Slow down to simulate slower devices
        slowMo: 500,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global setup */
  globalSetup: path.join(__dirname, './tests/e2e/global-setup.ts'),
  
  /* Global teardown */
  globalTeardown: path.join(__dirname, './tests/e2e/global-teardown.ts'),
})