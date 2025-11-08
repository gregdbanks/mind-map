import { test, expect } from '@playwright/test';

test.describe('Mind Map Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
  });

  test('should render canvas and toolbar', async ({ page }) => {
    // Basic smoke test - app loads without crashing
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    await expect(page.locator('svg')).toHaveCount(5); // 3 toolbar SVGs (including layout selector) + 1 search SVG + 1 main canvas
  });

  test('should have initial root node', async ({ page }) => {
    // Core data loading functionality
    const nodes = page.locator('[data-testid="mind-map-node"]');
    await expect(nodes.first()).toBeVisible();
    expect(await nodes.count()).toBe(1); // Should start with root node
  });

  test('should create child nodes via action buttons', async ({ page }) => {
    // Start with the initial root node
    
    const initialNodes = page.locator('[data-testid="mind-map-node"]');
    const initialCount = await initialNodes.count();
    
    // Hover over first node to show action buttons
    await initialNodes.first().hover();
    await page.waitForTimeout(500);
    
    // Click the add button (green + button)
    const addButton = page.locator('.node-actions circle[fill="#4CAF50"]').first();
    await addButton.click();
    await page.waitForTimeout(500);
    
    await expect(initialNodes).toHaveCount(initialCount + 1);
  });

  test('should export JSON', async ({ page }) => {
    // Core export functionality - create some nodes first
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.locator('[data-testid="add-child-button"]').first().click();
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[title="Export as JSON"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/mindmap-\d+\.json/);
  });

  test('should have working toolbar buttons', async ({ page }) => {
    // Core UI functionality
    const toolbar = page.locator('[data-testid="toolbar"]');
    
    // Check all essential buttons are visible and clickable
    await expect(toolbar.locator('button[title="Fit all nodes in viewport"]')).toBeVisible();
    await expect(toolbar.locator('button[title="Export as JSON"]')).toBeVisible();
    await expect(toolbar.locator('button[title="Import JSON data"]')).toBeVisible();
    
    // Test toolbar buttons are clickable
    await toolbar.locator('button[title="Export as JSON"]').click({ trial: true });
    
    // Should have loaded nodes
    const nodes = page.locator('[data-testid="mind-map-node"]');
    expect(await nodes.count()).toBeGreaterThan(0);
  });
});