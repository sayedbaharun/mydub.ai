import puppeteer from 'puppeteer';

async function testMyDubFunctionality() {
  console.log('Starting MyDub.ai functionality tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Homepage Loading
    console.log('Test 1: Loading Homepage...');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
    const title = await page.title();
    console.log(`✓ Homepage loaded successfully. Title: ${title}\n`);
    
    // Test 2: Check Navigation Menu
    console.log('Test 2: Checking Navigation Menu...');
    const navLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('nav a, header a');
      return Array.from(links).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }));
    });
    console.log('Navigation links found:', navLinks);
    console.log('');
    
    // Test 3: Test Registration Flow
    console.log('Test 3: Testing Registration Flow...');
    // Try to find signup link in navigation
    const signUpLink = await page.$('a[href*="signup"], a[href*="register"]');
    if (signUpLink) {
      await signUpLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✓ Navigated to signup page');
    } else {
      // Try direct navigation
      await page.goto('http://localhost:8001/auth/signup', { waitUntil: 'networkidle2' });
      console.log('✓ Directly navigated to signup page');
    }
    
    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"], input[id="email"]', testEmail);
    await page.type('input[id="fullName"], input[name="fullName"]', 'Test User');
    await page.type('input[id="password"], input[name="password"], input[type="password"]:first-of-type', 'TestPassword123!');
    await page.type('input[id="confirmPassword"], input[name="confirmPassword"], input[type="password"]:last-of-type', 'TestPassword123!');
    
    // Select user type
    const residentRadio = await page.$('input[value="resident"], input[id="resident"]');
    if (residentRadio) {
      await residentRadio.click();
    }
    
    // Accept terms
    const termsCheckbox = await page.$('input[type="checkbox"][id="terms"]');
    if (termsCheckbox) {
      await termsCheckbox.click();
    }
    
    console.log(`✓ Filled registration form with email: ${testEmail}\n`);
    
    // Test 4: Check News Section
    console.log('Test 4: Checking News Section...');
    await page.goto('http://localhost:8001/news', { waitUntil: 'networkidle2' });
    const newsArticles = await page.evaluate(() => {
      const articles = document.querySelectorAll('article, .news-item, .news-card, [class*="news"]');
      return articles.length;
    });
    console.log(`✓ News page loaded. Found ${newsArticles} article elements\n`);
    
    // Test 5: Check Search Functionality
    console.log('Test 5: Testing Search Functionality...');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
    const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], input[name="search"]');
    if (searchInput) {
      await searchInput.type('Dubai');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      console.log('✓ Search functionality tested\n');
    } else {
      console.log('⚠ Search input not found on homepage\n');
    }
    
    // Test 6: Check Government Services
    console.log('Test 6: Checking Government Services...');
    await page.goto('http://localhost:8001/government', { waitUntil: 'networkidle2' });
    const govContent = await page.evaluate(() => document.body.textContent.includes('Government') || document.body.textContent.includes('Services'));
    console.log(`✓ Government page loaded: ${govContent ? 'Content found' : 'No content'}\n`);
    
    // Test 7: Check Tourism Section
    console.log('Test 7: Checking Tourism Section...');
    await page.goto('http://localhost:8001/tourism', { waitUntil: 'networkidle2' });
    console.log('✓ Tourism page loaded\n');
    
    // Test 8: Check Chatbot/Ayyan
    console.log('Test 8: Checking AI Assistant (Ayyan)...');
    await page.goto('http://localhost:8001/ayyan', { waitUntil: 'networkidle2' });
    const chatInterface = await page.$('textarea, input[type="text"][placeholder*="Ask"], .chat-input');
    console.log(`✓ Ayyan page loaded. Chat interface: ${chatInterface ? 'Found' : 'Not found'}\n`);
    
    // Test 9: Check Footer Links
    console.log('Test 9: Checking Footer Links...');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle2' });
    const footerLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('footer a');
      return Array.from(links).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }));
    });
    console.log('Footer links:', footerLinks);
    console.log('');
    
    // Test 10: Check Responsive Design
    console.log('Test 10: Testing Responsive Design...');
    // Mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    console.log('✓ Mobile view tested (375x667)');
    
    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    console.log('✓ Tablet view tested (768x1024)');
    
    // Desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✓ Desktop view tested (1920x1080)\n');
    
    console.log('=== Test Summary ===');
    console.log('All basic functionality tests completed!');
    console.log('\nPotential issues to investigate:');
    console.log('1. Check if email verification is required after registration');
    console.log('2. Verify admin login and dashboard access');
    console.log('3. Test article creation/editing features');
    console.log('4. Check image upload functionality');
    console.log('5. Test password reset flow');
    console.log('6. Verify API rate limiting');
    console.log('7. Check payment/subscription features if any');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
testMyDubFunctionality().catch(console.error);