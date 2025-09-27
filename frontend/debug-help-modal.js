import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('🔍 Debug Help Modal');
  console.log('==================');
  
  // Load homepage
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Click on first mind map
  const firstMindMap = await page.$('.mind-map-item');
  await firstMindMap.click();
  await page.waitForTimeout(2000);
  
  // Check state before clicking
  console.log('\n1. State BEFORE clicking help button:');
  const stateBefore = await page.evaluate(() => {
    const helpButton = document.querySelector('button[title="Help"]');
    return {
      helpButtonExists: !!helpButton,
      helpButtonText: helpButton?.textContent?.trim(),
      showHelpState: window.showHelp || 'undefined'
    };
  });
  console.log(stateBefore);
  
  // Click help button
  console.log('\n2. Clicking help button...');
  await page.click('button[title="Help"]');
  await page.waitForTimeout(1000);
  
  // Check state after clicking
  console.log('\n3. State AFTER clicking help button:');
  const stateAfter = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    const allDivs = document.querySelectorAll('div');
    const fixedDivs = Array.from(allDivs).filter(div => 
      window.getComputedStyle(div).position === 'fixed'
    );
    
    return {
      modalExists: !!modal,
      modalClasses: modal?.className,
      fixedElementCount: fixedDivs.length,
      fixedElementClasses: fixedDivs.map(el => el.className).slice(0, 5),
      bodyContent: document.body.children.length
    };
  });
  console.log(stateAfter);
  
  // Check React component state
  console.log('\n4. Checking React state:');
  const reactState = await page.evaluate(() => {
    // Try to find React fiber
    const findReactFiber = (element) => {
      const keys = Object.keys(element);
      return keys.find(key => key.startsWith('__reactFiber')) || 
             keys.find(key => key.startsWith('__reactInternalInstance'));
    };
    
    const helpButton = document.querySelector('button[title="Help"]');
    if (helpButton) {
      const fiberKey = findReactFiber(helpButton);
      if (fiberKey) {
        return { hasFiber: true, fiberKey };
      }
    }
    return { hasFiber: false };
  });
  console.log(reactState);
  
  await page.screenshot({ path: 'debug-help-modal.png', fullPage: true });
  console.log('\n✅ Screenshot saved: debug-help-modal.png');
  
  console.log('\nKeeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();