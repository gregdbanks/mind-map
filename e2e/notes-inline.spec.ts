import { test, expect } from '@playwright/test';
import { createMapAndNavigate } from './helpers';

test.describe('Notes Inline', () => {
  test.beforeEach(async ({ page }) => {
    await createMapAndNavigate(page);
  });

  /** Helper: expand inline note on a node by clicking the purple button */
  async function expandNote(page: import('@playwright/test').Page, nodeIndex = 0) {
    await page.locator('[data-testid="mind-map-node"]').nth(nodeIndex).hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#9C27B0"]').first().click({ force: true });
    await page.waitForTimeout(1000);
  }

  /** Helper: type text into the inline note editor */
  async function typeInNote(page: import('@playwright/test').Page, text: string) {
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click({ force: true });
    await editor.pressSequentially(text, { delay: 30 });
    // Wait for debounced auto-save (600ms + buffer)
    await page.waitForTimeout(1200);
  }

  test('5.7 — Purple action button toggles inline note editor', async ({ page }) => {
    await expandNote(page, 0);

    // Inline note editor should appear with contenteditable area
    const editor = page.locator('[contenteditable="true"]');
    await expect(editor.first()).toBeVisible({ timeout: 5000 });
  });

  test('5.8 — Type note content and verify it persists', async ({ page }) => {
    await expandNote(page, 0);
    await typeInNote(page, 'Test note content');

    // Collapse the note
    await expandNote(page, 0);

    // Re-expand to verify content persisted
    await expandNote(page, 0);

    await expect(page.getByText('Test note content')).toBeVisible();
  });

  test('5.9 — Toggle note expansion inline', async ({ page }) => {
    // Expand inline note
    await expandNote(page, 0);

    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();

    await editor.click({ force: true });
    await editor.pressSequentially('Expandable note', { delay: 30 });
    await page.waitForTimeout(1200);

    // Collapse by clicking purple button again
    await expandNote(page, 0);

    // Editor should no longer be visible (collapsed state)
    await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
  });

  test('5.12 — Accordion: expanding one note collapses another', async ({ page }) => {
    // Create a child node
    const rootNode = page.locator('[data-testid="mind-map-node"]').first();
    await rootNode.hover();
    await page.waitForTimeout(300);
    await page.locator('.node-actions circle[fill="#4CAF50"]').first().click();
    await page.waitForTimeout(500);

    // Expand note on root node and type content
    await expandNote(page, 0);
    await typeInNote(page, 'Note A');

    // Root note should be expanded — at least 1 contenteditable visible
    const editorsBeforeAccordion = await page.locator('[contenteditable="true"]').count();
    expect(editorsBeforeAccordion).toBeGreaterThanOrEqual(1);

    // Expand note on child (last) node — accordion collapses root automatically
    // The click handler in MindMapCanvas collapses other expanded notes
    const lastNodeIndex = (await page.locator('[data-testid="mind-map-node"]').count()) - 1;
    await page.locator('[data-testid="mind-map-node"]').nth(lastNodeIndex).hover();
    await page.waitForTimeout(300);
    // Use force:true because the root note foreignObject may overlap
    await page.locator('.node-actions circle[fill="#9C27B0"]').first().click({ force: true });
    await page.waitForTimeout(1500);

    // After accordion, only the last node's note should be expanded (1 editor)
    const editorsAfterAccordion = await page.locator('[contenteditable="true"]').count();
    expect(editorsAfterAccordion).toBe(1);
  });

  test('5.13 — Note survives page reload', async ({ page }) => {
    // Expand note on root node and type content
    await expandNote(page, 0);
    await typeInNote(page, 'Persistent note');

    // Collapse the note and wait for save
    await expandNote(page, 0);
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="mind-map-node"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Re-expand note on root node
    await expandNote(page, 0);

    // Verify the saved note content is still there
    await expect(page.getByText('Persistent note')).toBeVisible({ timeout: 5000 });
  });
});
