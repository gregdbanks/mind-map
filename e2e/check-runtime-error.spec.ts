import { test, expect } from '@playwright/test';

test('check for runtime errors and performance', async ({ page }) => {
  const errors: any[] = [];
  const warnings: string[] = [];
  
  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push({ text, location: msg.location() });
      console.error('ERROR:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      console.warn('WARNING:', text);
    } else {
      console.log(`[${type}]`, text);
    }
  });
  
  page.on('pageerror', err => {
    errors.push({ text: err.message, stack: err.stack });
    console.error('PAGE ERROR:', err.message);
  });

  // Navigate
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Load demo map and wait
  await page.click('button[title="Load Demo Map"]');
  await page.waitForTimeout(2000);
  
  // Check performance
  const performanceMetrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('measure');
    return {
      measures: perf.map(p => ({ name: p.name, duration: p.duration })),
      memory: (performance as any).memory ? (performance as any).memory.usedJSHeapSize / 1048576 : null
    };
  });
  
  console.log('Performance:', performanceMetrics);
  console.log('Total errors:', errors.length);
  console.log('Total warnings:', warnings.length);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshots/runtime-check.png', fullPage: true });
  
  // Check if simulation is causing issues
  const simulationStatus = await page.evaluate(() => {
    // Try to access D3 simulation if it exists
    const svg = document.querySelector('svg');
    return {
      svgExists: !!svg,
      nodeCount: document.querySelectorAll('.node').length,
      linkCount: document.querySelectorAll('.link').length
    };
  });
  
  console.log('Simulation status:', simulationStatus);
  
  expect(errors.length).toBe(0);
});