import { Page } from '@playwright/test';

/**
 * Navigate to the dashboard, create a new map, and wait for the editor to load.
 * Returns once mind map nodes are visible.
 */
export async function createMapAndNavigate(page: Page) {
  await page.goto('http://localhost:3000');

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
