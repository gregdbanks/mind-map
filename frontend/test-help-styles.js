import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('🔍 Debug Help Modal Styles');
  console.log('=========================');
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Open a mind map
  const firstMindMap = await page.$('.mind-map-item');
  await firstMindMap.click();
  await page.waitForTimeout(2000);
  
  // Open help modal
  await page.click('button[title="Help"]');
  await page.waitForTimeout(1000);
  
  // Inspect the help text elements
  const textElements = await page.evaluate(() => {
    const helpTexts = document.querySelectorAll('.help-text');
    const firstFewTexts = Array.from(helpTexts).slice(0, 5);
    
    return firstFewTexts.map(el => {
      const computed = window.getComputedStyle(el);
      const parent = el.parentElement;
      const parentComputed = parent ? window.getComputedStyle(parent) : null;
      
      return {
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.trim(),
        computedStyles: {
          display: computed.display,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
          border: computed.border
        },
        parentTagName: parent?.tagName,
        parentClass: parent?.className,
        parentDisplay: parentComputed?.display
      };
    });
  });
  
  console.log('\nHelp text elements analysis:');
  textElements.forEach((el, i) => {
    console.log(`\nElement ${i + 1}:`);
    console.log('  Tag:', el.tagName);
    console.log('  Text:', el.textContent);
    console.log('  Styles:', el.computedStyles);
  });
  
  // Check for any unexpected elements
  const unexpectedElements = await page.evaluate(() => {
    const helpItems = document.querySelectorAll('.help-item');
    const results = [];
    
    helpItems.forEach(item => {
      const children = Array.from(item.children);
      children.forEach(child => {
        if (!child.classList.contains('help-kbd') && !child.classList.contains('help-text') && child.tagName !== 'DIV') {
          results.push({
            tagName: child.tagName,
            className: child.className,
            textContent: child.textContent?.substring(0, 50)
          });
        }
      });
    });
    
    return results;
  });
  
  if (unexpectedElements.length > 0) {
    console.log('\nUnexpected elements found:');
    console.log(unexpectedElements);
  }
  
  console.log('\nKeeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();