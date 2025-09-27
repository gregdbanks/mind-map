import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('🧪 Modal Tests');
  console.log('==============');
  
  // Load homepage
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Click on first mind map
  const firstMindMap = await page.$('.mind-map-item');
  await firstMindMap.click();
  await page.waitForTimeout(2000);
  
  // Test 1: Help modal
  console.log('\n1. Testing Help Modal:');
  await page.click('button[title="Help"]');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-help-modal.png', fullPage: true });
  console.log('   ✓ Help modal screenshot saved');
  
  // Close help modal
  await page.click('button[aria-label="Close help"]');
  await page.waitForTimeout(500);
  
  // Test 2: Delete confirmation - select a node first
  console.log('\n2. Testing Delete Confirmation:');
  
  // Click on a node to select it
  const canvasRect = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });
  
  // Click in the center of canvas (hopefully hitting a node)
  await page.click(`canvas`, { position: { x: canvasRect.width / 2, y: canvasRect.height / 2 } });
  await page.waitForTimeout(1000);
  
  // Press Delete key
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  
  // Check if delete dialog appeared
  const deleteDialogVisible = await page.evaluate(() => {
    const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    const dialog = Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Delete Node');
    return {
      backdropVisible: backdrop ? true : false,
      dialogVisible: dialog ? true : false,
      dialogParentClasses: dialog ? dialog.parentElement.parentElement.className : null
    };
  });
  
  console.log('   Delete dialog:', deleteDialogVisible);
  
  await page.screenshot({ path: 'test-delete-modal.png', fullPage: true });
  console.log('   ✓ Delete modal screenshot saved');
  
  console.log('\nKeeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();