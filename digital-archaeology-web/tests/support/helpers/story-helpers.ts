/**
 * Shared story mode E2E test helpers.
 *
 * Used by: story-journeys.spec.ts, story-lab-story-loop.spec.ts
 *
 * These helpers handle common story mode navigation patterns:
 * - Entering story mode with discoverer skipped
 * - Advancing through scenes (Continue, Choice, Persona)
 * - Navigating to specific scene types (choice, challenge/lab)
 * - Reading scene content for comparison
 */

import type { Page } from '@playwright/test';
import { expect } from '../../support/fixtures';

/**
 * Enter story mode with discoverer skipped.
 * Sets localStorage flag BEFORE page load to avoid discoverer experience.
 */
export async function enterStoryMode(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('digital-archaeology-discoverer-complete', 'true');
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
    if (storyBtn) storyBtn.click();
  });

  await expect(page.locator('.da-story-mode-container')).toBeVisible({ timeout: 5000 });

  const continueBtn = page.locator('.da-story-action-btn--primary');
  try {
    await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);
  } catch {
    // First scene may not have a continue button
  }
}

/**
 * Try to advance to the next scene. Handles Continue, Choice, and Persona buttons.
 * Returns true if advanced, false if stuck.
 */
export async function tryAdvanceScene(page: Page): Promise<boolean> {
  // Try Continue button
  const continueBtn = page.locator('.da-story-action-btn--primary');
  try {
    await continueBtn.waitFor({ state: 'visible', timeout: 2000 });
    await expect(continueBtn).toBeEnabled({ timeout: 3000 });
    await continueBtn.click();
    await page.waitForTimeout(800);
    return true;
  } catch {
    // Continue button not available or disabled
  }

  // Try Choice card
  const choiceCard = page.locator('.da-choice-card').first();
  try {
    await choiceCard.waitFor({ state: 'visible', timeout: 1000 });
    await choiceCard.click();
    await page.waitForTimeout(800);
    return true;
  } catch {
    // Choice card not available
  }

  // Try Persona button
  const personaBtn = page.locator('.da-persona-card, .da-persona-profile-continue').first();
  try {
    await personaBtn.waitFor({ state: 'visible', timeout: 1000 });
    await personaBtn.click();
    await page.waitForTimeout(800);
    return true;
  } catch {
    // Persona button not available
  }

  return false;
}

/**
 * Get the current scene content text for comparison.
 */
export async function getSceneContent(page: Page): Promise<string> {
  const content = page.locator('.da-story-content');
  return (await content.textContent()) ?? '';
}

/**
 * Navigate forward through scenes until a choice scene is found.
 * Returns true if found, false if exhausted.
 */
export async function navigateToChoiceScene(page: Page): Promise<boolean> {
  const choiceCard = page.locator('.da-choice-card');

  for (let i = 0; i < 25; i++) {
    if (await choiceCard.count() > 0 && await choiceCard.first().isVisible()) {
      return true;
    }

    // Only use Continue and Persona buttons (not choice cards) to reach a choice scene
    const continueBtn = page.locator('.da-story-action-btn--primary');
    try {
      await continueBtn.waitFor({ state: 'visible', timeout: 2000 });
      await expect(continueBtn).toBeEnabled({ timeout: 3000 });
      await continueBtn.click();
      await page.waitForTimeout(800);
      continue;
    } catch {
      // Continue not available
    }

    const personaBtn = page.locator('.da-persona-card, .da-persona-profile-continue').first();
    try {
      await personaBtn.waitFor({ state: 'visible', timeout: 1000 });
      await personaBtn.click();
      await page.waitForTimeout(800);
      continue;
    } catch {
      // Persona not available either — stuck
      return false;
    }
  }

  return await choiceCard.count() > 0 && await choiceCard.first().isVisible();
}

/**
 * Navigate forward through scenes until an Enter Lab button is found.
 * Returns true if found, false if exhausted.
 */
export async function navigateToEnterLab(page: Page): Promise<boolean> {
  const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');

  for (let i = 0; i < 15; i++) {
    if (await enterLabBtn.count() > 0 && await enterLabBtn.first().isVisible()) {
      return true;
    }
    if (!(await tryAdvanceScene(page))) {
      return false;
    }
  }

  return await enterLabBtn.count() > 0 && await enterLabBtn.first().isVisible();
}

/**
 * Switch to Story mode via the MenuBar toggle.
 * Uses page.evaluate to avoid overlay interception from .da-story-nav-logo.
 */
export async function switchToStoryViaMenubar(page: Page) {
  await page.locator('.da-menubar-toggle [data-mode="story"]').click();
  await page.waitForTimeout(1000);
}
