import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('2.7 — Create map from dashboard appears in map list', async ({ page }) => {
    // Click Create Map
    const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();

    // Should navigate to editor
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Go back to dashboard (back button goes to /, so navigate directly)
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    // The new map should appear in the list — look for card title elements
    const cardTitles = page.locator('[class*="cardTitle"]');
    await expect(cardTitles.first()).toBeVisible({ timeout: 5000 });
    expect(await cardTitles.count()).toBeGreaterThanOrEqual(1);
  });

  test('18.9 — Navigate dashboard to editor and back', async ({ page }) => {
    // Create a map first
    const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Verify we are in the editor
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();

    // Navigate back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    // Verify we are on dashboard
    await expect(page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first()).toBeVisible();
  });

  test('18.10 — Rename map from dashboard', async ({ page }) => {
    // Create a map first
    const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Go back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    // Find the first map card and hover to show action buttons
    const cardTitle = page.locator('[class*="cardTitle"]').first();
    await expect(cardTitle).toBeVisible({ timeout: 5000 });

    const card = cardTitle.locator('..');
    await card.hover();
    await page.waitForTimeout(300);

    // Click the rename button (pencil icon)
    const renameButton = page.locator('button[title="Rename"]').first();
    await renameButton.click();
    await page.waitForTimeout(200);

    // Clear the title input and type new name
    const titleInput = page.locator('input[class*="titleInput"]').first();
    await titleInput.fill('Renamed Test Map');
    await titleInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify the new name is displayed
    await expect(page.locator('[class*="cardTitle"]').first()).toContainText('Renamed Test Map');
  });

  test('18.11 — Delete map from dashboard removes it from list', async ({ page }) => {
    // Create a map first
    const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Go back
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    const cardTitles = page.locator('[class*="cardTitle"]');
    await expect(cardTitles.first()).toBeVisible({ timeout: 5000 });
    const countBefore = await cardTitles.count();
    expect(countBefore).toBeGreaterThanOrEqual(1);

    // Hover card and click delete (requires double click to confirm)
    const firstCardTitle = cardTitles.first();
    const card = firstCardTitle.locator('..');
    await card.hover();
    await page.waitForTimeout(300);

    const deleteButton = page.locator('button[title="Delete"]').first();
    await deleteButton.click();
    await page.waitForTimeout(200);

    // Second click to confirm
    const confirmButton = page.locator('button[title="Click again to confirm"]').first();
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Card count should decrease
    const countAfter = await cardTitles.count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('18.12 — Create multiple maps, all appear in list', async ({ page }) => {
    // Create first map
    let createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Go back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    // Create second map
    createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });

    // Go back to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(1000);

    // Verify at least 2 cards
    const cardTitles = page.locator('[class*="cardTitle"]');
    await expect(cardTitles.first()).toBeVisible({ timeout: 5000 });
    expect(await cardTitles.count()).toBeGreaterThanOrEqual(2);
  });
});
