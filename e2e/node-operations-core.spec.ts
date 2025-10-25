import { test, expect } from '@playwright/test';

test.describe('Node Operations Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
  });

  test('should create child node with Enter key', async ({ page }) => {
    // Click on the initial node to select it
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.waitForTimeout(200);
    
    // Press Enter to create child
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Should now have 2 nodes
    const nodes = page.locator('[data-testid="mind-map-node"]');
    await expect(nodes).toHaveCount(2);
  });

  test('should delete node with Delete key', async ({ page }) => {
    // Create a child first
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Select the child and delete it
    await page.locator('[data-testid="mind-map-node"]').nth(1).click();
    await page.waitForTimeout(200);
    
    // Accept the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Should be back to 1 node
    const nodes = page.locator('[data-testid="mind-map-node"]');
    await expect(nodes).toHaveCount(1);
  });

  test('should maintain consistent positioning', async ({ page }) => {
    // Load demo map twice to test positioning consistency
    await page.click('button[title="Load Demo Map"]');
    await page.waitForTimeout(1000);
    
    // Get position of first node
    const firstNode = page.locator('[data-testid="mind-map-node"]').first();
    const initialTransform = await firstNode.getAttribute('transform');
    
    // Load demo again
    await page.click('button[title="Load Demo Map"]');
    await page.waitForTimeout(1000);
    
    // Position should be the same (consistent positioning)
    const finalTransform = await firstNode.getAttribute('transform');
    expect(finalTransform).toBe(initialTransform);
  });
});