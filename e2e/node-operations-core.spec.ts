import { test, expect } from '@playwright/test';

test.describe('Node Operations Core', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for nodes to be visible (app to finish loading)
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    await page.waitForTimeout(500); // Additional time for animations
  });

  test('should create child node with Enter key', async ({ page }) => {
    // Get initial node count
    const initialNodes = page.locator('[data-testid="mind-map-node"]');
    const initialCount = await initialNodes.count();
    
    // Click on the first node to select it
    await initialNodes.first().click();
    await page.waitForTimeout(200);
    
    // Press Enter to create child
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Should have one more node than we started with
    const finalNodes = page.locator('[data-testid="mind-map-node"]');
    await expect(finalNodes).toHaveCount(initialCount + 1);
  });

  test('should delete node with Delete key', async ({ page }) => {
    // Get initial count
    const initialNodes = page.locator('[data-testid="mind-map-node"]');
    const initialCount = await initialNodes.count();
    
    // Create a child first
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Verify node was created
    await expect(initialNodes).toHaveCount(initialCount + 1);
    
    // Select the newly created node and delete it
    await page.locator('[data-testid="mind-map-node"]').last().click();
    await page.waitForTimeout(200);
    
    // Accept the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);
    
    // Should be back to initial count
    const finalNodes = page.locator('[data-testid="mind-map-node"]');
    await expect(finalNodes).toHaveCount(initialCount);
  });

  test('should maintain consistent positioning', async ({ page }) => {
    
    // Get position of first node (should be from demo data)
    const firstNode = page.locator('[data-testid="mind-map-node"]').first();
    const initialTransform = await firstNode.getAttribute('transform');
    
    // Refresh the page to test consistency
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Position should be the same (consistent positioning)
    const finalTransform = await firstNode.getAttribute('transform');
    expect(finalTransform).toBe(initialTransform);
  });
});