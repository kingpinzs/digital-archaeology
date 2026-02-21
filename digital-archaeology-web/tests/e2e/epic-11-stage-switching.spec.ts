/**
 * Epic 11: Stage Switching - E2E Tests
 * Tests Stories 11.1, 11.2, 11.3, 11.4
 *
 * Note: Only Micro4 is currently a ready and unlocked stage.
 * Other stages are locked in the selector, so full WASM reload
 * E2E testing is limited until additional stages are built.
 * These tests verify:
 * - Stage selector UI is present and renders all stages
 * - Locked stages display lock icon and are not selectable
 * - Selecting current stage (micro4) closes dropdown without errors
 * - No JavaScript errors during stage selector interactions
 * - Editor has correct syntax language for the active stage (Story 11.4)
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

      // WHEN: User clicks Micro8 (locked) — force: true bypasses Playwright's
      // actionability checks since the element has aria-disabled="true"
      await page.locator('[data-stage="micro8"]').click({ force: true });

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
      await page.locator('[data-stage="micro8"]').click({ force: true }); // locked, no-op

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
      await page.locator('[data-stage="micro8"]').click({ force: true }); // locked, no-op
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

  test.describe('Story 11.5: Stage-Specific Circuit Loading', () => {
    test('[11.5] should have circuit panel with canvas on initial Micro4 load', async ({ page }) => {
      // GIVEN: App loads in Lab Mode with Micro4 (default)
      // THEN: Circuit panel should be visible
      const circuitPanel = page.locator('.da-circuit-panel');
      await expect(circuitPanel).toBeVisible();

      // THEN: Circuit panel should have canvas element (CircuitRenderer mounted)
      const canvas = circuitPanel.locator('canvas');
      await expect(canvas).toBeVisible();
    });

    test('[11.5] should retain circuit panel after reselecting current stage', async ({ page }) => {
      // GIVEN: Circuit panel has canvas on initial load
      await expect(page.locator('.da-circuit-panel canvas')).toBeVisible();

      // WHEN: User opens stage selector and re-selects Micro4 (same stage)
      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('[data-stage="micro4"]').click();

      // THEN: Circuit panel should still have canvas (same stage, circuit preserved)
      const canvas = page.locator('.da-circuit-panel canvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Story 11.6: Stage-Specific Examples', () => {
    test('[11.6] should show File menu with Examples menu item', async ({ page }) => {
      // GIVEN: App loads in Lab Mode
      // WHEN: User opens File menu
      await page.locator('[data-menu="file"]').click();

      // THEN: Examples menu item should be visible
      const examplesItem = page.locator('[data-action="examples"]');
      await expect(examplesItem).toBeVisible();
    });

    test('[11.6] should open example browser with programs on Micro4 initial load', async ({ page }) => {
      // GIVEN: App loads in Lab Mode with Micro4 (default)
      // WHEN: User opens File > Examples
      await page.locator('[data-menu="file"]').click();
      await expect(page.locator('[data-action="examples"]')).toBeVisible();
      await page.locator('[data-action="examples"]').click();

      // THEN: Example browser should be visible with program items
      const browserContainer = page.locator('.da-example-browser');
      await expect(browserContainer).toBeVisible();

      // THEN: Should show Micro4 example program items (Code Review M3: verify count AND content)
      const items = browserContainer.locator('.da-example-item');
      await expect(items).toHaveCount(12);

      // THEN: Should contain known Micro4 programs (not just a count)
      await expect(browserContainer.locator('.da-menu-item-label', { hasText: 'Add Two Numbers' })).toBeVisible();
      await expect(browserContainer.locator('.da-menu-item-label', { hasText: 'Fibonacci' })).toBeVisible();
    });

    test('[11.6] should close example browser on Escape', async ({ page }) => {
      // GIVEN: Example browser is open
      await page.locator('[data-menu="file"]').click();
      await expect(page.locator('[data-action="examples"]')).toBeVisible();
      await page.locator('[data-action="examples"]').click();
      await expect(page.locator('.da-example-browser')).toBeVisible();

      // Ensure focus is on the example browser before pressing Escape
      await page.locator('.da-example-browser').click();

      // WHEN: User presses Escape
      await page.keyboard.press('Escape');

      // THEN: Browser should be closed
      await expect(page.locator('.da-example-browser')).not.toBeVisible();
    });
  });

  test.describe('Story 11.4: Stage-Specific Syntax Highlighting', () => {
    test('[11.4] should have Monaco editor with micro4 language for default stage', async ({ page }) => {
      // THEN: Monaco editor should be present
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();

      // THEN: The editor model should be set to micro4 language
      // Monaco attaches a data-mode-id attribute to the editor container
      const monacoContainer = page.locator('[data-mode-id]');
      await expect(monacoContainer).toHaveAttribute('data-mode-id', 'micro4');
    });

    test('[11.4] should retain syntax highlighting after stage selector interaction', async ({ page }) => {
      // GIVEN: Editor has micro4 syntax highlighting
      await expect(page.locator('.monaco-editor')).toBeVisible();

      // WHEN: User opens and closes stage selector (no stage change)
      await page.locator('.da-stage-selector-trigger').click();
      await page.locator('[data-stage="micro4"]').click();

      // THEN: Editor language should still be micro4
      const monacoContainer = page.locator('[data-mode-id]');
      await expect(monacoContainer).toHaveAttribute('data-mode-id', 'micro4');
    });
  });

  test.describe('Story 11.7: URL Routing', () => {
    test('[11.7] should set URL hash to #/lab/micro4 on initial load', async ({ page }) => {
      // GIVEN: App loads with no hash
      // (beforeEach navigates to '/')

      // THEN: URL should be set to default route
      await expect(page).toHaveURL(/#\/lab\/micro4/);
    });

    test('[11.7] should navigate to lab/micro4 when visiting #/lab/micro4', async ({ page }) => {
      // WHEN: Navigate directly to a stage URL
      await page.goto('/#/lab/micro4');
      await page.waitForLoadState('networkidle');

      // THEN: Stage selector should show Micro4
      const trigger = page.locator('.da-stage-selector-trigger');
      await expect(trigger).toContainText('Micro4');

      // AND: URL should remain
      await expect(page).toHaveURL(/#\/lab\/micro4/);
    });

    test('[11.7] should fallback to micro4 for invalid stage URL', async ({ page }) => {
      // WHEN: Navigate to an invalid stage hash (triggers hashchange on already-loaded page)
      await page.evaluate(() => { window.location.hash = '#/lab/invalid'; });

      // THEN: App normalizes the URL via handleRouteChange → replaceState
      await expect(async () => {
        const hash = await page.evaluate(() => window.location.hash);
        expect(hash).toBe('#/lab/micro4');
      }).toPass({ timeout: 5000 });

      // AND: Stage selector should still show Micro4
      const trigger = page.locator('.da-stage-selector-trigger');
      await expect(trigger).toContainText('Micro4');
    });

    test('[11.7] should show #/story when switching to story mode', async ({ page }) => {
      // GIVEN: App is in lab mode
      await expect(page).toHaveURL(/#\/lab\/micro4/);

      // WHEN: Click story mode toggle in MenuBar (use first match to avoid strict mode)
      const storyBtn = page.locator('.da-menubar-toggle [data-mode="story"]');
      await storyBtn.click();

      // THEN: URL should change to story mode
      await expect(page).toHaveURL(/#\/story/);
    });

    test('[11.7] should switch back to lab URL when returning from story mode', async ({ page }) => {
      // GIVEN: Switch to story mode via MenuBar
      await page.locator('.da-menubar-toggle [data-mode="story"]').click();
      await expect(page).toHaveURL(/#\/story/);

      // WHEN: Switch back to lab via StoryNav's mode toggle (visible in story mode)
      // The MenuBar toggle is covered by story overlay, so use the story nav's toggle
      const labBtn = page.locator('.da-mode-toggle-btn[data-mode="lab"]');
      await labBtn.click();

      // THEN: URL should return to lab with stage
      await expect(page).toHaveURL(/#\/lab\/micro4/);
    });

    test('[11.7] should navigate via browser back button between mode changes', async ({ page }) => {
      // GIVEN: Start in lab mode
      await expect(page).toHaveURL(/#\/lab\/micro4/);

      // WHEN: Switch to story mode (pushes history) via MenuBar
      await page.locator('.da-menubar-toggle [data-mode="story"]').click();
      await expect(page).toHaveURL(/#\/story/);

      // AND: Press browser back button
      await page.goBack();

      // THEN: Should return to lab mode URL
      await expect(page).toHaveURL(/#\/lab\/micro4/);
    });
  });
});
