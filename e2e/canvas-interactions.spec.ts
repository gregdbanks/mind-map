import { test, expect } from '@playwright/test';
import { createMapAndNavigate, getSvgTransform, getNodeCount } from './helpers';

test.describe('Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  test('3.15 - Pan canvas via drag on empty space', async ({ page }) => {
    const initialTransform = await getSvgTransform(page);

    const svg = page.locator('svg[role="img"]');
    const box = await svg.boundingBox();

    // Drag from one corner area to another while holding Space (pan mode)
    await page.mouse.move(box!.x + 50, box!.y + 50);
    await page.keyboard.down('Space');
    await page.mouse.down();
    await page.mouse.move(box!.x + 200, box!.y + 200, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Space');

    await page.waitForTimeout(500);

    const newTransform = await getSvgTransform(page);
    expect(newTransform).not.toBe(initialTransform);
  });

  test('3.16 - Zoom in/out via scroll wheel', async ({ page }) => {
    const initialTransform = await getSvgTransform(page);

    const svg = page.locator('svg[role="img"]');
    const box = await svg.boundingBox();

    // Move mouse to center of SVG and scroll up to zoom in
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -300);

    await page.waitForTimeout(500);

    const newTransform = await getSvgTransform(page);
    expect(newTransform).not.toBe(initialTransform);
  });

  test('3.17 - Zoom controls - Fit button works', async ({ page }) => {
    const svg = page.locator('svg[role="img"]');
    const box = await svg.boundingBox();

    // Zoom in via scroll wheel to change the view
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    const zoomedTransform = await getSvgTransform(page);

    // Click the fit button to reset/adjust the view
    await page.locator('button[title="Fit all nodes in viewport"]').click();
    await page.waitForTimeout(500);

    const fitTransform = await getSvgTransform(page);
    expect(fitTransform).not.toBe(zoomedTransform);
  });

  test('3.18 - Fit-to-view button resets zoom', async ({ page }) => {
    const svg = page.locator('svg[role="img"]');
    const box = await svg.boundingBox();

    // Zoom out significantly
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);

    const zoomedOutTransform = await getSvgTransform(page);

    // Click fit-to-view button to recalculate optimal zoom
    await page.locator('button[title="Fit all nodes in viewport"]').click();
    await page.waitForTimeout(500);

    const resetTransform = await getSvgTransform(page);
    expect(resetTransform).not.toBe(zoomedOutTransform);
  });

  test('3.21 - Undo (Ctrl+Z) after deleting a node restores it', async ({ page }) => {
    const initialCount = await getNodeCount(page);

    // Create a child node by selecting root and pressing Enter
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify node was created
    await expect(page.locator('[data-testid="mind-map-node"]')).toHaveCount(initialCount + 1);

    // Select the new node (last one) and delete it
    await page.locator('[data-testid="mind-map-node"]').last().click();
    await page.waitForTimeout(200);

    page.on('dialog', dialog => dialog.accept());
    await page.keyboard.press('Delete');
    await page.waitForTimeout(500);

    // Verify node was deleted
    await expect(page.locator('[data-testid="mind-map-node"]')).toHaveCount(initialCount);

    // Undo the deletion
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(500);

    // Verify node was restored
    await expect(page.locator('[data-testid="mind-map-node"]')).toHaveCount(initialCount + 1);
  });

  test('6.7 - Search highlights matching nodes', async ({ page }) => {
    // Get the root node text
    const rootText = await page.locator('[data-testid="mind-map-node"] text').first().textContent();
    expect(rootText).toBeTruthy();

    // Type the root text into the search input
    const searchInput = page.locator('input[placeholder*="Search nodes"]');
    await searchInput.fill(rootText!);
    await page.waitForTimeout(500);

    // Verify dropdown appears with matching results
    const dropdown = page.locator('[class*="dropdown"]').filter({
      has: page.locator('[class*="dropdownItem"]'),
    });
    await expect(dropdown).toBeVisible();

    // The dropdown should contain at least one item with the matching text
    const firstResult = dropdown.locator('[class*="dropdownItem"]').first();
    await expect(firstResult).toContainText(rootText!);

    // Click the first result
    await firstResult.click();
    await page.waitForTimeout(500);

    // Verify the search input shows the selected node text
    await expect(searchInput).toHaveValue(rootText!);
  });
});
