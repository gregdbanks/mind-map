import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('🧪 Help Modal Test');
  console.log('==================');
  
  // Load homepage
  console.log('\n1. Loading homepage...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Click on first mind map
  console.log('2. Opening mind map...');
  const firstMindMap = await page.$('.mind-map-item');
  if (!firstMindMap) {
    console.error('❌ No mind maps found!');
    await browser.close();
    return;
  }
  
  await firstMindMap.click();
  await page.waitForTimeout(2000);
  
  // Test help button
  console.log('\n3. Testing help button:');
  
  // Find help button
  const helpButton = await page.$('button[title="Help"]');
  if (!helpButton) {
    console.error('❌ Help button not found!');
    await browser.close();
    return;
  }
  
  // Click help button
  console.log('   - Clicking help button...');
  await helpButton.click();
  await page.waitForTimeout(1000);
  
  // Check if modal appeared
  const modalVisible = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-75');
    const modalContent = document.querySelector('.bg-white.rounded-lg.shadow-2xl');
    const helpTitle = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Mind Map Help');
    
    return {
      modalBackdrop: modal ? window.getComputedStyle(modal).display !== 'none' : false,
      modalContent: modalContent ? window.getComputedStyle(modalContent).display !== 'none' : false,
      helpTitle: !!helpTitle,
      zIndex: modal ? window.getComputedStyle(modal).zIndex : 'none'
    };
  });
  
  console.log('\n4. Modal visibility:', modalVisible);
  
  // Check modal content
  const contentCheck = await page.evaluate(() => {
    const sections = document.querySelectorAll('.bg-white.rounded-lg.p-6.shadow-sm');
    const closeButton = document.querySelector('button[aria-label="Close help"]');
    const kbdElements = document.querySelectorAll('kbd');
    
    return {
      sectionCount: sections.length,
      hasCloseButton: !!closeButton,
      keyboardShortcutCount: kbdElements.length,
      firstKbdStyle: kbdElements[0] ? window.getComputedStyle(kbdElements[0]).backgroundColor : 'none'
    };
  });
  
  console.log('5. Content check:', contentCheck);
  
  // Take screenshot with modal open
  await page.screenshot({ path: 'help-modal-open.png', fullPage: true });
  console.log('\n✅ Screenshot saved: help-modal-open.png');
  
  // Test close button
  console.log('\n6. Testing close button...');
  await page.click('button[aria-label="Close help"]');
  await page.waitForTimeout(500);
  
  const modalClosed = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-75');
    return !modal;
  });
  
  console.log('   Modal closed:', modalClosed);
  
  console.log('\nKeeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();