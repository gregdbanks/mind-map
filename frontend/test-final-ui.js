import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down to see actions
  });
  
  const page = await browser.newPage();
  
  console.log('🧪 Final UI Test');
  console.log('================');
  
  console.log('\n1. Loading homepage...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Click on first mind map
  console.log('2. Opening mind map...');
  const firstMindMap = await page.$('.mind-map-item');
  if (firstMindMap) {
    await firstMindMap.click();
    await page.waitForTimeout(2000);
    
    console.log('\n3. Testing UI elements:');
    
    // Test help button
    console.log('   - Clicking Help button...');
    const helpClicked = await page.evaluate(() => {
      const button = document.querySelector('button[title="Help"]');
      if (button) {
        button.click();
        return true;
      }
      return false;
    });
    console.log('     ✓ Help button clicked:', helpClicked);
    await page.waitForTimeout(1000);
    
    // Close help modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Check if help button is visible
    const visibility = await page.evaluate(() => {
      const helpButton = document.querySelector('button[title="Help"]');
      
      return {
        helpButtonVisible: helpButton ? window.getComputedStyle(helpButton).display !== 'none' : false,
        helpButtonInHeader: helpButton ? helpButton.closest('.canvas-header') !== null : false
      };
    });
    
    console.log('\n4. Visibility check:', visibility);
    
    // Take final screenshot
    await page.screenshot({ path: 'final-ui-test.png', fullPage: true });
    console.log('\n✅ Test complete! Screenshot saved as final-ui-test.png');
  }
  
  console.log('\nKeeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();