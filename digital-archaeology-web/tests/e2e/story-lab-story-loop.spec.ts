/**
 * Story-Lab-Story Loop E2E Tests (TD-2)
 *
 * Tests the complete story → lab → story cycle:
 * - Entering lab from story mode and returning
 * - Returning via mode toggle stays on same scene
 * - Multiple consecutive cycles work without state corruption
 */

import { test, expect } from '../support/fixtures';
import {
  enterStoryMode,
  getSceneContent,
  navigateToEnterLab,
  switchToStoryViaMenubar,
} from '../support/helpers/story-helpers';

test.describe('TD-2: Story-Lab-Story Loop', () => {
  test('should enter lab from challenge scene and return to story', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to a challenge scene with an Enter Lab button
    const foundLab = await navigateToEnterLab(page);

    // Fail loudly if challenge scene unreachable — content may have changed
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    // Record the scene content BEFORE entering lab
    const contentBeforeLab = await getSceneContent(page);
    expect(contentBeforeLab.length).toBeGreaterThan(0);

    // Click "Enter Lab" to switch to lab mode
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
    await enterLabBtn.first().click();
    await page.waitForTimeout(1000);

    // Verify we're in lab mode
    const inLabMode = await page.evaluate(() =>
      document.documentElement.classList.contains('lab-mode')
    );
    expect(inLabMode).toBe(true);

    // Return to story via menubar mode toggle (must use menubar one, not hidden story nav)
    await switchToStoryViaMenubar(page);

    // Verify we're back in story mode
    const inStoryMode = await page.evaluate(() =>
      document.documentElement.classList.contains('story-mode')
    );
    expect(inStoryMode).toBe(true);

    // Verify story container is visible
    await expect(page.locator('.da-story-mode-container')).toBeVisible();
  });

  test('should stay on same scene when returning via mode toggle', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to a challenge scene
    const foundLab = await navigateToEnterLab(page);
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    // Record scene content before entering lab
    const contentBeforeLab = await getSceneContent(page);

    // Click "Enter Lab"
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
    await enterLabBtn.first().click();
    await page.waitForTimeout(1000);

    // Return to story via menubar mode toggle WITHOUT completing objectives
    await switchToStoryViaMenubar(page);

    // Verify we're back in story mode
    const inStoryMode = await page.evaluate(() =>
      document.documentElement.classList.contains('story-mode')
    );
    expect(inStoryMode).toBe(true);

    // Verify the scene content has NOT changed (same scene — no advancement)
    const contentAfterReturn = await getSceneContent(page);
    expect(contentAfterReturn).toBe(contentBeforeLab);
  });

  test('should handle 3 consecutive story-lab-story cycles via mode toggle', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to a challenge scene
    const foundLab = await navigateToEnterLab(page);
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    // Record initial scene content
    const initialContent = await getSceneContent(page);

    // Cycle 1-3: Enter lab and return via mode toggle (incomplete)
    for (let cycle = 0; cycle < 3; cycle++) {
      // Enter lab
      const labBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
      if (await labBtn.count() === 0 || !(await labBtn.first().isVisible())) break;

      await labBtn.first().click();
      await page.waitForTimeout(800);

      // Verify lab mode active
      const inLabMode = await page.evaluate(() =>
        document.documentElement.classList.contains('lab-mode')
      );
      expect(inLabMode).toBe(true);

      // Return to story via menubar mode toggle
      await switchToStoryViaMenubar(page);

      // Verify story mode is active
      const inStoryMode = await page.evaluate(() =>
        document.documentElement.classList.contains('story-mode')
      );
      expect(inStoryMode).toBe(true);

      // Verify story container is visible
      await expect(page.locator('.da-story-mode-container')).toBeVisible();

      // Verify scene content hasn't changed (incomplete return = no advancement)
      const currentContent = await getSceneContent(page);
      expect(currentContent).toBe(initialContent);
    }
  });

  test('should show Return to Story button (hidden) and challenge station UI in lab', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to a challenge scene
    const foundLab = await navigateToEnterLab(page);
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    // Enter lab
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
    await enterLabBtn.first().click();
    await page.waitForTimeout(1000);

    // Verify we're in lab mode
    const inLabMode = await page.evaluate(() =>
      document.documentElement.classList.contains('lab-mode')
    );
    expect(inLabMode).toBe(true);

    // Verify challenge station UI is present
    await expect(page.locator('.da-challenge-station')).toBeVisible();
    await expect(page.locator('.da-challenge-station-simulator')).toBeVisible();
    await expect(page.locator('.da-challenge-station-sidebar')).toBeVisible();

    // Verify Return to Story button exists (hidden until objectives complete)
    const returnBtn = page.locator('.da-challenge-station-return-btn');
    expect(await returnBtn.count()).toBe(1);

    // Verify it has the hidden class (objectives not yet complete)
    const isHidden = await returnBtn.evaluate((el) =>
      el.classList.contains('da-challenge-station-return-btn--hidden')
    );
    expect(isHidden).toBe(true);

    // Return via mode toggle
    await switchToStoryViaMenubar(page);
    await expect(page.locator('.da-story-mode-container')).toBeVisible();
  });
});
