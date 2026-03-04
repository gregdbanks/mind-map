import { test, expect } from '@playwright/test';
import { createMapAndNavigate } from './helpers';

test.describe('Node Sizing and Multi-Select', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  test('3.15 — Change node size via edit modal', async ({ page }) => {
    // Get initial root node rect dimensions
    const initialWidth = await page.locator('[data-testid="mind-map-node"] .node-main').first().getAttribute('width');

    // Open edit modal by clicking the blue edit action button
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#2196F3"]').first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify modal is open
    const modal = page.locator('[class*="modalBackdrop"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click XL size button (title="XL size")
    await page.locator('button[title="XL size"]').click();
    await page.waitForTimeout(200);

    // Save the modal — use exact match to avoid "Saved locally"
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(500);

    // Verify the node rect width changed to XL preset (240)
    const newWidth = await page.locator('[data-testid="mind-map-node"] .node-main').first().getAttribute('width');
    expect(Number(newWidth)).toBe(240);
    expect(newWidth).not.toBe(initialWidth);
  });

  test('3.16 — Multi-select with Ctrl+click shows selection indicators', async ({ page }) => {
    // Add a child node so we have 2+ nodes to select
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    // Use Meta key (macOS) for multi-select — the code checks event.ctrlKey || event.metaKey
    // On macOS Playwright, 'Meta' maps to the Command key which sets event.metaKey
    await page.locator('[data-testid="mind-map-node"]').first().click({ modifiers: ['ControlOrMeta'] });
    await page.waitForTimeout(500);

    // Verify multi-select indicator appears (it's an SVG rect element)
    const indicators = page.locator('.multi-select-indicator');
    const count1 = await indicators.count();
    expect(count1).toBeGreaterThanOrEqual(1);

    // Meta+click the second node to add it to selection
    await page.locator('[data-testid="mind-map-node"]').nth(1).click({ modifiers: ['ControlOrMeta'] });
    await page.waitForTimeout(500);

    // Should have 2 multi-select indicators
    expect(await indicators.count()).toBe(2);

    // Normal click to clear multi-selection
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.waitForTimeout(300);

    // Multi-select indicators should be gone
    expect(await page.locator('.multi-select-indicator').count()).toBe(0);
  });
});
