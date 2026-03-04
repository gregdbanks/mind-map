import { Page } from '@playwright/test';

/**
 * Navigate to the dashboard, create a new map, and wait for the editor to load.
 * Returns once mind map nodes are visible.
 */
export async function createMapAndNavigate(page: Page) {
  await page.goto('/dashboard');

  // Wait for the dashboard to load
  await page.waitForSelector('button', { timeout: 10000 });

  // Click the "New Map" or "Create Mind Map" button
  const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map/ }).first();
  await createButton.click();

  // Wait for navigation to the editor and mind map nodes to be visible
  await page.waitForURL(/\/map\//, { timeout: 10000 });
  await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
  await page.waitForTimeout(500); // Additional time for animations
}

/**
 * Add a child node to a given parent node by clicking the green (+) action button.
 * Optionally type text into the new node.
 */
export async function addChildNode(page: Page, parentText: string, childText?: string) {
  const parentNode = page.locator('[data-testid="mind-map-node"]').filter({ hasText: parentText }).first();
  await parentNode.hover();
  await page.waitForTimeout(300);

  // Click the green add button
  const addButton = page.locator('.node-actions circle[fill="#4CAF50"]').first();
  await addButton.click();
  await page.waitForTimeout(500);

  if (childText) {
    // The new node should trigger an edit modal or inline edit
    // Type the text and confirm
    await page.keyboard.type(childText);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
}

/**
 * Select (click on) a node with the given text.
 */
export async function selectNode(page: Page, nodeText: string) {
  const node = page.locator('[data-testid="mind-map-node"]').filter({ hasText: nodeText }).first();
  await node.click();
  await page.waitForTimeout(200);
}

/**
 * Open a toolbar dropdown by its button title attribute.
 */
export async function openToolbarDropdown(page: Page, buttonTitle: string) {
  const toolbar = page.locator('[data-testid="toolbar"]');
  await toolbar.locator(`button[title*="${buttonTitle}"]`).click();
  await page.waitForTimeout(200);
}

/**
 * Navigate back to the dashboard from the editor via the back button.
 */
export async function navigateToDashboard(page: Page) {
  await page.locator('button[aria-label="Back to Dashboard"]').click();
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 10000 });
  await page.waitForTimeout(500);
}

/**
 * Get the current SVG transform (translate + scale) of the main group.
 * Returns the raw transform attribute string.
 */
export async function getSvgTransform(page: Page): Promise<string | null> {
  return page.locator('svg[role="img"] .main-group').getAttribute('transform');
}

/**
 * Wait for the mind map editor to be fully loaded and interactive.
 */
export async function waitForEditor(page: Page) {
  await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="toolbar"]', { timeout: 5000 });
  await page.waitForTimeout(500);
}

/**
 * Get the count of mind map nodes currently visible.
 */
export async function getNodeCount(page: Page): Promise<number> {
  return page.locator('[data-testid="mind-map-node"]').count();
}
