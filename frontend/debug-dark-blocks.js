import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  console.log('🔍 Debug Dark Blocks');
  console.log('===================');
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Open a mind map
  const firstMindMap = await page.$('.mind-map-item');
  await firstMindMap.click();
  await page.waitForTimeout(2000);
  
  // Open help modal
  await page.click('button[title="Help"]');
  await page.waitForTimeout(1000);
  
  // Get the full HTML of the first few help items
  const helpItemsHTML = await page.evaluate(() => {
    const helpItems = document.querySelectorAll('.help-item');
    const firstThree = Array.from(helpItems).slice(0, 3);
    
    return firstThree.map(item => ({
      outerHTML: item.outerHTML,
      childrenCount: item.children.length,
      children: Array.from(item.children).map(child => ({
        tagName: child.tagName,
        className: child.className,
        textContent: child.textContent?.trim(),
        computedBackground: window.getComputedStyle(child).backgroundColor,
        computedDisplay: window.getComputedStyle(child).display
      }))
    }));
  });
  
  console.log('\nFirst 3 help items:');
  helpItemsHTML.forEach((item, i) => {
    console.log(`\nItem ${i + 1}:`);
    console.log('Children count:', item.childrenCount);
    console.log('Children details:');
    item.children.forEach((child, j) => {
      console.log(`  Child ${j + 1}:`, child);
    });
  });
  
  // Look for any elements with dark backgrounds
  const darkElements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('.help-modal-body *');
    const dark = [];
    
    Array.from(allElements).forEach(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      // Check for dark colors (not transparent or white)
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)' && bg !== 'transparent') {
        const rgb = bg.match(/\d+/g);
        if (rgb) {
          const [r, g, b] = rgb.map(Number);
          // Dark color detection
          if (r < 100 && g < 100 && b < 150) {
            dark.push({
              tagName: el.tagName,
              className: el.className,
              backgroundColor: bg,
              width: window.getComputedStyle(el).width,
              height: window.getComputedStyle(el).height,
              textContent: el.textContent?.substring(0, 30)
            });
          }
        }
      }
    });
    
    return dark;
  });
  
  if (darkElements.length > 0) {
    console.log('\nDark elements found:');
    darkElements.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tagName}.${el.className} - bg: ${el.backgroundColor} - size: ${el.width} x ${el.height}`);
    });
  }
  
  console.log('\nKeeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();