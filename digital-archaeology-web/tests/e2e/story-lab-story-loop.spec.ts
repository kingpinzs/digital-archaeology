/**
 * Story-Lab-Story Loop E2E Tests (TD-2)
 *
 * Tests the complete story → lab → story cycle:
 * - Entering lab from story mode and returning
 * - Returning via mode toggle stays on same scene
 * - Multiple consecutive cycles work without state corruption
 */

import { test, expect } from '../support/fixtures';

/**
 * Helper: Navigate to story mode and wait for content to load.
 */
async function enterStoryMode(page: import('@playwright/test').Page) {
  // Skip discoverer so story loads directly
  await page.addInitScript(() => {
    localStorage.setItem('digital-archaeology-discoverer-complete', 'true');
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Switch to story mode
  await page.evaluate(() => {
    const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
    if (storyBtn) storyBtn.click();
  });
  await page.waitForTimeout(1000);

  // Verify story mode is active
  await expect(page.locator('.da-story-mode-container')).toBeVisible();

  // Wait for story content to fully load (Continue button becomes enabled)
  const continueBtn = page.locator('.da-story-action-btn--primary');
  try {
    await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
    // Wait a bit more for it to become enabled
    await page.waitForTimeout(500);
  } catch {
    // Story may not have a continue button on first scene - that's ok
  }
}

/**
 * Helper: Try to advance to next scene. Returns true if advanced, false if not possible.
 */
async function tryAdvanceScene(page: import('@playwright/test').Page): Promise<boolean> {
  // First try the Continue button
  const continueBtn = page.locator('.da-story-action-btn--primary');
  if (await continueBtn.count() > 0 && await continueBtn.isVisible()) {
    // Wait for button to become enabled (may be disabled during scene load)
    for (let retry = 0; retry < 10; retry++) {
      if (!(await continueBtn.isDisabled())) break;
      await page.waitForTimeout(300);
    }

    if (!(await continueBtn.isDisabled())) {
      await continueBtn.click();
      await page.waitForTimeout(800);
      return true;
    }
  }

  // If Continue is disabled, we may be on a choice scene — click first choice
  const choiceCard = page.locator('.da-choice-card');
  if (await choiceCard.count() > 0 && await choiceCard.first().isVisible()) {
    await choiceCard.first().click();
    await page.waitForTimeout(800);
    return true;
  }

  // If neither works, we may be on a persona scene — look for persona continue
  const personaBtn = page.locator('.da-persona-card, .da-persona-profile-continue');
  if (await personaBtn.count() > 0 && await personaBtn.first().isVisible()) {
    await personaBtn.first().click();
    await page.waitForTimeout(800);
    return true;
  }

  return false;
}

/**
 * Helper: Navigate forward through scenes until an Enter Lab button is found.
 * Returns true if found, false if exhausted scene navigation.
 */
async function navigateToEnterLab(page: import('@playwright/test').Page): Promise<boolean> {
  const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab');

  for (let i = 0; i < 15; i++) {
    // Check if Enter Lab button exists on current scene
    if (await enterLabBtn.count() > 0 && await enterLabBtn.first().isVisible()) {
      return true;
    }

    // Try to advance to next scene
    if (!(await tryAdvanceScene(page))) {
      return false;
    }
  }

  return await enterLabBtn.count() > 0 && await enterLabBtn.first().isVisible();
}

/**
 * Helper: Switch to Story mode via the MenuBar toggle.
 * Uses the menubar toggle specifically (not the StoryNav one which may be hidden).
 */
async function switchToStoryViaMenubar(page: import('@playwright/test').Page) {
  // Use Playwright locator which handles visibility automatically
  await page.locator('.da-menubar-toggle [data-mode="story"]').click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Get the current scene content text for comparison.
 */
async function getSceneContent(page: import('@playwright/test').Page): Promise<string> {
  const content = page.locator('.da-story-content');
  return (await content.textContent()) ?? '';
}

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
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab');
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
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab');
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
      const labBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab');
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
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab');
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
