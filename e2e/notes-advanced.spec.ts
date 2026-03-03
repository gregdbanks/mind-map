import { test, expect } from '@playwright/test';
import { createMapAndNavigate } from './helpers';

test.describe('Notes Advanced', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  /** Helper: expand inline note on a node by clicking the purple button. */
  async function expandNote(page: import('@playwright/test').Page, nodeIndex = 0) {
    await page.locator('[data-testid="mind-map-node"]').nth(nodeIndex).hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#9C27B0"]').first().click({ force: true });
    await page.waitForTimeout(1000);
  }

  test('5.12 — Note indicator (purple dot) shows on nodes with notes', async ({ page }) => {
    // Initially, note indicator should be hidden (display: none)
    const indicator = page.locator('.note-indicator').first();
    const initialDisplay = await indicator.evaluate(el => el.style.display);
    expect(initialDisplay).toBe('none');

    // Expand note and type content
    await expandNote(page, 0);
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click({ force: true });
    await editor.pressSequentially('Note for indicator test', { delay: 30 });
    await page.waitForTimeout(1200); // Wait for auto-save debounce

    // Collapse the note
    await expandNote(page, 0);
    await page.waitForTimeout(500);

    // Now the note indicator should be visible (display: block)
    const afterDisplay = await indicator.evaluate(el => el.style.display);
    expect(afterDisplay).toBe('block');
  });

  test('5.13 — Edit button on expanded note opens edit modal', async ({ page }) => {
    // Expand note on root node
    await expandNote(page, 0);

    // Verify contenteditable editor is visible
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();

    // Click the blue edit action button while note is expanded
    // Hover the root node first to show action buttons
    await page.locator('[data-testid="mind-map-node"]').first().hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#2196F3"]').first().click({ force: true });
    await page.waitForTimeout(500);

    // The edit modal should appear
    const modal = page.locator('[class*="modalBackdrop"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // The inline note editor should be collapsed (no contenteditable visible)
    await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
  });
});
