import { test, expect } from '@playwright/test';
import { createMapAndNavigate } from './helpers';

test.describe('Layouts and Backgrounds', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  const getNodePositions = async (page: import('@playwright/test').Page) => {
    const nodes = page.locator('[data-testid="mind-map-node"]');
    const count = await nodes.count();
    const positions: (string | null)[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(await nodes.nth(i).getAttribute('transform'));
    }
    return positions;
  };

  test('4.1 — Apply Tree Layout and verify persistence', async ({ page }) => {
    // Add a child node so layout has something to rearrange
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    const initialPositions = await getNodePositions(page);

    // Open layout dropdown and select Tree Layout
    await page.locator('button[aria-label="Select layout"]').click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Tree Layout/ }).click();
    await page.waitForTimeout(1000);

    const newPositions = await getNodePositions(page);
    expect(newPositions).not.toEqual(initialPositions);

    // Verify persistence via localStorage
    const savedLayout = await page.evaluate(() =>
      localStorage.getItem('thoughtnet-preferred-layout')
    );
    expect(savedLayout).toBe('hierarchical');
  });

  test('4.2 — Apply Smart Radial Layout', async ({ page }) => {
    // Add a child node
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    // First switch to tree so we have a known starting point
    await page.locator('button[aria-label="Select layout"]').click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Tree Layout/ }).click();
    await page.waitForTimeout(1000);

    const treePositions = await getNodePositions(page);

    // Now switch to Smart Radial
    await page.locator('button[aria-label="Select layout"]').click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Smart Radial/ }).click();
    await page.waitForTimeout(1000);

    const radialPositions = await getNodePositions(page);
    expect(radialPositions).not.toEqual(treePositions);
  });

  test('4.3 — Apply Force Physics Layout', async ({ page }) => {
    // Add a child node
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    const initialPositions = await getNodePositions(page);

    // Open layout dropdown and select Force Physics
    await page.locator('button[aria-label="Select layout"]').click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Force Physics/ }).click();
    await page.waitForTimeout(1500);

    const forcePositions = await getNodePositions(page);
    expect(forcePositions).not.toEqual(initialPositions);
  });

  test('4.4 — Background selector changes and persists', async ({ page }) => {
    // Open background dropdown
    await page.locator('button[aria-label="Select canvas background"]').click();
    await page.waitForTimeout(200);

    // Select Dark background — use role selector to be precise
    await page.getByRole('button', { name: /^Dark\b/ }).click();
    await page.waitForTimeout(500);

    // Verify localStorage saved the choice
    const savedBg = await page.evaluate(() =>
      localStorage.getItem('mindmap-canvas-background')
    );
    expect(savedBg).toBe('dark');

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    const persistedBg = await page.evaluate(() =>
      localStorage.getItem('mindmap-canvas-background')
    );
    expect(persistedBg).toBe('dark');
  });

  test('4.5 — Dark background adjusts node text color for contrast', async ({ page }) => {
    // Get text fill on default (light) background
    const lightFill = await page.locator('[data-testid="mind-map-node"] text').first().getAttribute('fill');

    // Switch to Dark background
    await page.locator('button[aria-label="Select canvas background"]').click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Dark\b/ }).click();
    await page.waitForTimeout(500);

    // Get text fill on dark background
    const darkFill = await page.locator('[data-testid="mind-map-node"] text').first().getAttribute('fill');

    // Text color should have changed for contrast
    expect(darkFill).not.toBe(lightFill);

    // On dark background, text should be light (white or near-white)
    // #ffffff is the expected output from getAutoTextColor for dark backgrounds
    expect(darkFill).toMatch(/^#[fF]{6}$|^white$|^rgb\(255/);
  });
});
