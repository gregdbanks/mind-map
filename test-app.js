const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Check if the page loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any error messages
    const errorElements = await page.$$('.error');
    if (errorElements.length > 0) {
      console.log('Found error elements on page');
      for (const el of errorElements) {
        const text = await el.textContent();
        console.log('Error text:', text);
      }
    }

    // Check if the canvas is present
    const canvas = await page.$('svg');
    if (canvas) {
      console.log('SVG canvas found!');
      
      // Check for toolbar
      const toolbar = await page.$('.toolbar');
      if (toolbar) {
        console.log('Toolbar found!');
      }
      
      // Try to create a node
      await page.click('svg', { position: { x: 400, y: 300 } });
      await page.waitForTimeout(500);
      
      // Check if a node was created
      const nodes = await page.$$('[data-testid="mind-map-node"]');
      console.log('Number of nodes:', nodes.length);
    } else {
      console.log('SVG canvas NOT found');
      
      // Get the page content to see what's there
      const bodyText = await page.evaluate(() => document.body.textContent);
      console.log('Page body text:', bodyText);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved as test-screenshot.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();