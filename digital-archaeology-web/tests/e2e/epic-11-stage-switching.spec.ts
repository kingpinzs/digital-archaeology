/**
 * Epic 11: Stage Switching - E2E Tests
 * Tests Stories 11.1, 11.2, 11.3
 *
 * Note: Only Micro4 is currently a ready and unlocked stage.
 * Other stages are locked in the selector, so full WASM reload
 * E2E testing is limited until additional stages are built.
 * These tests verify:
 * - Stage selector UI is present and renders all stages
 * - Locked stages display lock icon and are not selectable
 * - Selecting current stage (micro4) closes dropdown without errors
 * - No JavaScript errors during stage selector interactions
 */

import { test, expect } from '../support/fixtures';

test.describe('Epic 11: Stage Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Story 11.1: Stage Selector UI', () => {
    test('[11.1] should display the stage selector in the menu bar', async ({ page }) => {
      // THEN: Stage selector trigger button is visible
      const trigger = page.locator('.da-stage-selector-trigger');
      await expect(trigger).toBeVisible();
    });

    test('[11.1] should show Micro4 as the default selected stage', async ({ page }) => {
      // THEN: Trigger label shows Micro4
      const label = page.locator('.da-stage-selector-trigger-label');
      await expect(label).toHaveText(/Micro4/i);
    });

    test('[11.1] should open dropdown on trigger click', async ({ page }) => {
      // WHEN: User clicks the stage selector trigger
      await page.locator('.da-stage-selector-trigger').click();

      // THEN: Dropdown is visible with stage items
      const dropdown = page.locator('.da-stage-selector-dropdown');
      await expect(dropdown).toBeVisible();

      // THEN: Has all 6 stage items
      const items = page.locator('[data-stage]');
      await expect(items).toHaveCount(6);
    });

    test('[11.1] should mark Micro4 as active in dropdown', async ({ page }) => {
      // WHEN: Dropdown is opened
      await page.locator('.da-stage-selector-trigger').click();

      // THEN: Micro4 item has active class
      const micro4Item = page.locator('[data-stage="micro4"]');
      await expect(micro4Item).toHaveClass(/da-stage-selector-item--active/);
      await expect(micro4Item).toHaveAttribute('aria-selected', 'true');
    });

    test('[11.1] should close dropdown on outside click', async ({ page }) => {
      // GIVEN: Dropdown is open
      await page.locator('.da-stage-selector-trigger').click();
      await expect(page.locator('.da-stage-selector-dropdown')).toBeVisible();

      // WHEN: User clicks outside the selector
      await page.locator('.da-code-panel').click();

      // THEN: Dropdown is hidden
      await expect(page.locator('.da-stage-selector-dropdown')).toBeHidden();
    });

    test('[11.1] should close dropdown when clicking current stage', async ({ page }) => {
      // GIVEN: Dropdown is open
      await page.locator('.da-stage-selector-trigger').click();

      // WHEN: User clicks Micro4 (already selected)
      await page.locator('[data-stage="micro4"]').click();

      // THEN: Dropdown closes, label unchanged
      await expect(page.locator('.da-stage-selector-dropdown')).toBeHidden();
      await expect(page.locator('.da-stage-selector-trigger-label')).toHaveText(/Micro4/i);
    });
  });

  test.describe('Story 11.2: Locked Stages', () => {
    test('[11.2] should show lock icon on unready stages', async ({ page }) => {
      // WHEN: Dropdown is opened
      await page.locator('.da-stage-selector-trigger').click();

      // THEN: Non-micro4 stages should have locked class
      const lockedStages = ['micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const stage of lockedStages) {
        const item = page.locator(`[data-stage="${stage}"]`);
        await expect(item).toHaveClass(/da-stage-selector-item--locked/);
        await expect(item).toHaveAttribute('aria-disabled', 'true');
      }
    });

    test('[11.2] should not select locked stages when clicked', async ({ page }) => {
      // GIVEN: Dropdown is open
      await page.locator('.da-stage-selector-trigger').click();

      // WHEN: User clicks Micro8 (locked)
      await page.locator('[data-stage="micro8"]').click();

      // THEN: Label should still show Micro4
      await expect(page.locator('.da-stage-selector-trigger-label')).toHaveText(/Micro4/i);
    });
  });

  test.describe('Story 11.3: No JavaScript Errors', () => {
    test('[11.3] should not produce errors when interacting with stage selector', async ({ page }) => {
      // GIVEN: We're monitoring console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // WHEN: User opens and closes stage selector multiple times
      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('[data-stage="micro4"]').click();

      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('[data-stage="micro8"]').click(); // locked, no-op

      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('.da-code-panel').click(); // close via outside click

      // Give time for any async errors
      await page.waitForTimeout(500);

      // THEN: No console errors
      expect(errors).toHaveLength(0);
    });

    test('[11.3] should maintain app functionality after stage selector interaction', async ({ page }) => {
      // GIVEN: User has interacted with stage selector
      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('[data-stage="micro8"]').click(); // locked, no-op
      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('.da-code-panel').click(); // close

      // THEN: Editor should still be functional
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();

      // THEN: Toolbar should still be visible
      await expect(page.locator('.da-toolbar')).toBeVisible();

      // THEN: Status bar should still be visible
      await expect(page.locator('.da-statusbar')).toBeVisible();
    });
  });
});
