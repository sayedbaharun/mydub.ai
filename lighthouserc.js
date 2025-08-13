module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Accessibility
        'aria-*': 'error',
        'color-contrast': 'error',
        'heading-order': 'error',
        'image-alt': 'error',
        'label': 'error',
        
        // Best Practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',
        'uses-https': 'error',
        'csp-xss': 'warn',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'structured-data': 'warn',
        
        // PWA
        'service-worker': 'error',
        'installable-manifest': 'error',
        'apple-touch-icon': 'error',
        'maskable-icon': 'error',
        'offline-start-url': 'warn',
        
        // Budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 300000 }], // 300KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:total:size': ['error', { maxNumericValue: 1500000 }], // 1.5MB
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}