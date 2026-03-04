import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { createMapAndNavigate } from './helpers';

test.describe('Export and Reimport', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  test('14.5 — Export as JSON downloads file with correct structure', async ({ page }) => {
    // Add a child node so we have more data
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    // Open export dropdown
    await page.locator('button[title="Export mind map"]').click();
    await page.waitForTimeout(200);

    // Set up download listener and click JSON option
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('JSON').click();
    const download = await downloadPromise;

    // Verify filename pattern
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // Read and parse the downloaded file
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const content = fs.readFileSync(filePath!, 'utf-8');
    const data = JSON.parse(content);

    // Verify structure
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('links');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.links)).toBe(true);
    expect(data.nodes.length).toBeGreaterThanOrEqual(2);

    // Verify node shape
    const node = data.nodes[0];
    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('text');
  });

});
