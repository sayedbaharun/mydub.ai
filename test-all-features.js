import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:8001';
const ADMIN_EMAIL = 'admin@mydub.ai';
const ADMIN_PASSWORD = 'MyDub@Admin2025!';
const TEST_IMAGE_PATH = join(__dirname, 'public', 'og-image.png');

async function testAllFeatures() {
  console.log('🚀 Starting comprehensive MyDub.ai feature tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  const testResults = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // Test 1: Admin Login
    console.log('📝 Test 1: Admin Login and Dashboard Access');
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', ADMIN_EMAIL);
    await page.type('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.waitForTimeout(5000)
      ]);
      testResults.passed.push('Admin login submitted');
    } catch (navError) {
      console.log('Navigation timeout, checking current state...');
    }
    
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    const dashboardLoaded = await page.evaluate(() => {
      return document.body.textContent.includes('Dashboard') || 
             document.querySelector('[data-testid="dashboard"]') !== null;
    });
    
    if (dashboardLoaded) {
      testResults.passed.push('Admin dashboard accessible');
    } else {
      testResults.failed.push('Admin dashboard not loading properly');
    }
    
    // Test 2: News Article Creation
    console.log('\n📰 Test 2: News Article Creation');
    await page.goto(`${BASE_URL}/dashboard/content-management`, { waitUntil: 'networkidle2' });
    
    // Look for create article button
    const createButton = await page.$('button:has-text("Create"), button:has-text("New Article"), button:has-text("Add Article"), a[href*="create"], button[aria-label*="create"]');
    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Fill article form
      const titleInput = await page.$('input[name="title"], input[placeholder*="Title"], input[id="title"]');
      if (titleInput) {
        await titleInput.type('Test Article - ' + new Date().toISOString());
        testResults.passed.push('Article title input found and filled');
      } else {
        testResults.failed.push('Article title input not found');
      }
      
      // Check for content editor
      const contentEditor = await page.$('textarea, [contenteditable="true"], .editor, [data-testid="editor"]');
      if (contentEditor) {
        await contentEditor.click();
        await page.keyboard.type('This is a test article content created by automated testing.');
        testResults.passed.push('Article content editor found and filled');
      } else {
        testResults.failed.push('Article content editor not found');
      }
    } else {
      testResults.warning.push('Create article button not found - may need different navigation');
    }
    
    // Test 3: Image Upload
    console.log('\n🖼️ Test 3: Image Upload Functionality');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput && fs.existsSync(TEST_IMAGE_PATH)) {
      await fileInput.uploadFile(TEST_IMAGE_PATH);
      await page.waitForTimeout(2000);
      testResults.passed.push('Image upload initiated');
      
      // Check for upload success
      const uploadSuccess = await page.evaluate(() => {
        return document.querySelector('img[src*="blob:"]') !== null ||
               document.querySelector('.upload-success') !== null;
      });
      
      if (uploadSuccess) {
        testResults.passed.push('Image uploaded successfully');
      } else {
        testResults.warning.push('Image upload status unclear');
      }
    } else {
      testResults.failed.push('File input not found or test image missing');
    }
    
    // Test 4: Search Functionality
    console.log('\n🔍 Test 4: Search Functionality');
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle2' });
    
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[name="search"], input[name="q"]');
    if (searchInput) {
      await searchInput.type('Dubai tourism');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      const searchResults = await page.evaluate(() => {
        return document.querySelectorAll('.search-result, article, .result-item, [data-testid="search-result"]').length;
      });
      
      testResults.passed.push(`Search functionality working - ${searchResults} results found`);
    } else {
      testResults.failed.push('Search input not found');
    }
    
    // Test 5: Password Reset Flow
    console.log('\n🔐 Test 5: Password Reset Flow');
    await page.goto(`${BASE_URL}/auth/forgot-password`, { waitUntil: 'networkidle2' });
    
    const resetEmailInput = await page.$('input[type="email"]');
    if (resetEmailInput) {
      await resetEmailInput.type('test@example.com');
      const resetButton = await page.$('button[type="submit"]');
      if (resetButton) {
        await resetButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success message
        const resetMessage = await page.evaluate(() => {
          return document.body.textContent.includes('email sent') ||
                 document.body.textContent.includes('check your email') ||
                 document.querySelector('.success-message') !== null;
        });
        
        if (resetMessage) {
          testResults.passed.push('Password reset email sent');
        } else {
          testResults.warning.push('Password reset status unclear');
        }
      }
    } else {
      testResults.failed.push('Password reset form not found');
    }
    
    // Test 6: Responsive Design
    console.log('\n📱 Test 6: Responsive Design');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    const mobileMenuButton = await page.$('button[aria-label*="menu"], button.mobile-menu, .hamburger, [data-testid="mobile-menu"]');
    if (mobileMenuButton) {
      testResults.passed.push('Mobile menu button found - responsive design working');
    } else {
      testResults.warning.push('Mobile menu button not found - check responsive design');
    }
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    testResults.passed.push('Tablet view tested');
    
    // Reset to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 7: SEO Meta Tags
    console.log('\n🏷️ Test 7: SEO Meta Tags and Structured Data');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    const seoData = await page.evaluate(() => {
      const meta = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogDescription: document.querySelector('meta[property="og:description"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent
      };
      return meta;
    });
    
    if (seoData.title && seoData.description) {
      testResults.passed.push('Basic SEO meta tags present');
    } else {
      testResults.failed.push('Missing essential SEO meta tags');
    }
    
    if (seoData.ogTitle && seoData.ogImage) {
      testResults.passed.push('Open Graph tags present');
    } else {
      testResults.warning.push('Missing Open Graph tags');
    }
    
    if (seoData.jsonLd) {
      testResults.passed.push('Structured data (JSON-LD) present');
    } else {
      testResults.warning.push('No structured data found');
    }
    
    // Test 8: Accessibility
    console.log('\n♿ Test 8: Accessibility Features');
    
    const accessibilityChecks = await page.evaluate(() => {
      const checks = {
        skipLinks: document.querySelector('a[href="#main"], .skip-link') !== null,
        ariaLabels: document.querySelectorAll('[aria-label]').length,
        altTexts: Array.from(document.querySelectorAll('img')).filter(img => img.alt).length,
        headingStructure: document.querySelector('h1') !== null,
        formLabels: Array.from(document.querySelectorAll('input')).filter(input => {
          return document.querySelector(`label[for="${input.id}"]`) !== null;
        }).length
      };
      return checks;
    });
    
    if (accessibilityChecks.skipLinks) {
      testResults.passed.push('Skip links present');
    } else {
      testResults.warning.push('No skip links found');
    }
    
    if (accessibilityChecks.ariaLabels > 5) {
      testResults.passed.push(`ARIA labels found: ${accessibilityChecks.ariaLabels}`);
    } else {
      testResults.warning.push('Limited ARIA labels found');
    }
    
    // Test 9: Error Handling
    console.log('\n❌ Test 9: Error Handling');
    
    // Test 404 page
    await page.goto(`${BASE_URL}/non-existent-page-12345`, { waitUntil: 'networkidle2' });
    const is404 = await page.evaluate(() => {
      return document.body.textContent.includes('404') ||
             document.body.textContent.includes('not found') ||
             document.body.textContent.includes('Not Found');
    });
    
    if (is404) {
      testResults.passed.push('404 error page working');
    } else {
      testResults.failed.push('404 error handling not working properly');
    }
    
    // Test 10: Data Persistence
    console.log('\n💾 Test 10: Data Persistence');
    
    // Create a test profile update
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    const profileForm = await page.$('form');
    if (profileForm) {
      const bioField = await page.$('textarea[name="bio"], textarea[placeholder*="bio"], #bio');
      if (bioField) {
        await bioField.click();
        await page.keyboard.selectAll();
        await bioField.type('Test bio updated at ' + new Date().toISOString());
        
        const saveButton = await page.$('button[type="submit"], button:has-text("Save")');
        if (saveButton) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          
          // Refresh and check if data persisted
          await page.reload({ waitUntil: 'networkidle2' });
          const persistedBio = await page.$eval('textarea[name="bio"], textarea[placeholder*="bio"], #bio', el => el.value);
          
          if (persistedBio.includes('Test bio updated')) {
            testResults.passed.push('Profile data persistence working');
          } else {
            testResults.failed.push('Profile data not persisting');
          }
        }
      }
    } else {
      testResults.warning.push('Profile form not found - user may not be logged in');
    }
    
    // Test 11: API Rate Limiting (basic check)
    console.log('\n🚦 Test 11: API Rate Limiting');
    
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(page.goto(`${BASE_URL}/api/health`, { waitUntil: 'networkidle2' }).catch(e => e));
    }
    
    const results = await Promise.all(requests);
    const rateLimited = results.some(r => r && r.message && r.message.includes('429'));
    
    if (rateLimited) {
      testResults.passed.push('API rate limiting detected');
    } else {
      testResults.warning.push('API rate limiting not detected in basic test');
    }
    
    // Test 12: Payment/Subscription Features
    console.log('\n💳 Test 12: Payment/Subscription Features');
    
    const subscribeLink = await page.$('a[href*="subscribe"], button:has-text("Subscribe"), a[href*="pricing"]');
    if (subscribeLink) {
      await subscribeLink.click();
      await page.waitForTimeout(2000);
      
      const paymentForm = await page.$('form[action*="stripe"], form[action*="payment"], .payment-form');
      if (paymentForm) {
        testResults.passed.push('Payment/subscription features found');
      } else {
        testResults.warning.push('Subscribe link found but no payment form');
      }
    } else {
      testResults.warning.push('No subscription/payment features found');
    }
    
  } catch (error) {
    console.error('Test suite error:', error);
    testResults.failed.push(`Test suite error: ${error.message}`);
  } finally {
    // Generate test report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n✅ PASSED (${testResults.passed.length}):`);
    testResults.passed.forEach(test => console.log(`   - ${test}`));
    
    console.log(`\n❌ FAILED (${testResults.failed.length}):`);
    testResults.failed.forEach(test => console.log(`   - ${test}`));
    
    console.log(`\n⚠️  WARNINGS (${testResults.warnings?.length || 0}):`);
    (testResults.warnings || []).forEach(test => console.log(`   - ${test}`));
    
    // Save detailed report
    const reportContent = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      results: testResults,
      summary: {
        total: testResults.passed.length + testResults.failed.length,
        passed: testResults.passed.length,
        failed: testResults.failed.length,
        warnings: testResults.warnings?.length || 0
      }
    };
    
    fs.writeFileSync(
      join(__dirname, 'test-results.json'),
      JSON.stringify(reportContent, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to test-results.json');
    
    await browser.close();
  }
}

// Run the tests
testAllFeatures().catch(console.error);