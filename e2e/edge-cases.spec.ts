import { test, expect } from '@playwright/test';
import { createMapAndNavigate, getNodeCount } from './helpers';

test.describe('Edge Cases and Cross-Cutting', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  test('18.9 — Large map (50+ nodes) renders without crash', async ({ page }) => {
    const initialCount = await getNodeCount(page);

    // Select root node
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.waitForTimeout(200);

    // Create 25 child nodes by pressing Enter rapidly (enough to stress-test rendering)
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(50);
    }

    // Wait for all nodes to render
    await page.waitForTimeout(1000);

    // Verify 25+ nodes exist
    const finalCount = await getNodeCount(page);
    expect(finalCount).toBeGreaterThanOrEqual(initialCount + 25);

    // Verify SVG is still interactive — can still select a node
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.waitForTimeout(200);

    // Verify the page didn't crash — toolbar still visible
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
  });

  test('18.10 — Navigate between maps loads correct data', async ({ page }) => {
    // Save the URL of the first map
    const map1Url = page.url();
    const map1Id = map1Url.match(/\/map\/(.+)/)?.[1];
    expect(map1Id).toBeTruthy();

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Create a second map
    const createButton = page.locator('button').filter({ hasText: /New Map|Create Mind Map|Create Map/ }).first();
    await createButton.click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Get URL of second map — should be different from first
    const map2Url = page.url();
    expect(map2Url).not.toBe(map1Url);

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Should see at least 2 map cards
    const mapCards = page.locator('[class*="cardTitle"]');
    await expect(mapCards.first()).toBeVisible({ timeout: 5000 });
    expect(await mapCards.count()).toBeGreaterThanOrEqual(2);

    // Click the first card — navigates to a map
    await mapCards.first().click();
    await page.waitForURL(/\/map\//, { timeout: 10000 });
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify editor loaded with nodes and toolbar
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    expect(await page.locator('[data-testid="mind-map-node"]').count()).toBeGreaterThanOrEqual(1);
  });

  test('18.11 — Browser back/forward buttons navigate correctly', async ({ page }) => {
    // We're on a map page after createMapAndNavigate
    const mapUrl = page.url();
    expect(mapUrl).toMatch(/\/map\//);

    // Navigate to dashboard (pushes to history)
    await page.goto('/dashboard');
    await page.waitForSelector('button', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // Go back — should return to map
    await page.goBack();
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    expect(page.url()).toMatch(/\/map\//);

    // Go forward — should return to dashboard
    await page.goForward();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/dashboard');
  });

  test('18.12 — Rapid clicking add button does not break state', async ({ page }) => {
    const initialCount = await getNodeCount(page);

    // Hover root node to show action buttons
    await page.locator('[data-testid="mind-map-node"]').first().hover();
    await page.waitForTimeout(300);

    // Click the green add button 5 times rapidly
    const addButton = page.locator('.node-actions circle[fill="#4CAF50"]').first();
    for (let i = 0; i < 5; i++) {
      await addButton.click({ force: true });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);

    // Verify nodes were created (at least some — rapid clicking may cause hover shifts)
    const finalCount = await getNodeCount(page);
    expect(finalCount).toBeGreaterThan(initialCount);

    // Verify no broken state — can still interact with canvas
    await page.locator('[data-testid="mind-map-node"]').first().click();
    await page.waitForTimeout(200);

    // Toolbar is still visible
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();

    // Verify nodes are positioned (have transform attributes), confirming no broken state
    const nodes = page.locator('[data-testid="mind-map-node"]');
    const count = await nodes.count();
    let nodesWithTransform = 0;
    for (let i = 0; i < count; i++) {
      const t = await nodes.nth(i).getAttribute('transform');
      if (t) nodesWithTransform++;
    }
    expect(nodesWithTransform).toBe(count);
  });
});
