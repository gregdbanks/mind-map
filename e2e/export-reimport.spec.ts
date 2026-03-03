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

  test('14.6 — Import JSON loads map with correct nodes', async ({ page }) => {
    // Prepare a valid JSON fixture
    const fixture = JSON.stringify({
      nodes: [
        { id: 'imported-1', text: 'Imported Root', x: 0, y: 0, parent: null, collapsed: false, color: '#4a90d9' },
        { id: 'imported-2', text: 'Imported Child', x: 100, y: 100, parent: 'imported-1', collapsed: false, color: '#7bc67e' },
      ],
      links: [
        { source: 'imported-1', target: 'imported-2' },
      ],
    });

    // Click the import button on the toolbar
    await page.locator('button[title="Import JSON data"]').click();
    await page.waitForTimeout(500);

    // Paste JSON into the textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    await textarea.fill(fixture);
    await page.waitForTimeout(300);

    // Verify validation success message
    await expect(page.getByText('Valid JSON detected')).toBeVisible();

    // Click Import button
    await page.getByRole('button', { name: 'Import Mind Map' }).click();
    await page.waitForTimeout(1000);

    // Verify nodes loaded
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    const nodes = page.locator('[data-testid="mind-map-node"]');
    expect(await nodes.count()).toBeGreaterThanOrEqual(2);

    // Verify the imported text is present
    const allText = await page.locator('[data-testid="mind-map-node"] text').allTextContents();
    expect(allText).toContain('Imported Root');
    expect(allText).toContain('Imported Child');
  });
});
