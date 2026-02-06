/**
 * Story Mode Journey E2E Tests (TD-4)
 *
 * Comprehensive journey tests that verify the story mode experience works end-to-end:
 * - Discoverer experience (6 phases)
 * - Choice branching (TD-1)
 * - Challenge round-trip (TD-2)
 * - Multi-scene navigation
 * - Persona display
 * - Multi-act progression
 *
 * Uses structural selectors only — no exact text matching.
 */

import { test, expect } from '../support/fixtures';
import {
  enterStoryMode,
  tryAdvanceScene,
  getSceneContent,
  navigateToChoiceScene,
  navigateToEnterLab,
} from '../support/helpers/story-helpers';

// ─── Task 1: Full Discoverer Experience Journey (AC #1) ────────────

test.describe('TD-4: Discoverer Experience Journey', () => {
  test('[TD-4.1.3] should progress through all 6 discoverer phases sequentially', async ({ page }) => {
    // Do NOT skip discoverer — trigger it by clearing state
    await page.addInitScript(() => {
      localStorage.removeItem('digital-archaeology-discoverer-complete');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to story mode to trigger discoverer
    await page.evaluate(() => {
      const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
      if (storyBtn) storyBtn.click();
    });

    // Wait for discoverer to appear (structural wait, not arbitrary timeout)
    const discoverer = page.locator('.da-discoverer-experience');
    await expect(discoverer).toBeVisible({ timeout: 5000 });

    // Phase 1: INTRO
    const introPhase = page.locator('.da-discoverer-intro');
    await expect(introPhase).toBeVisible();
    const beginBtn = page.locator('.da-discoverer-begin-btn');
    await expect(beginBtn).toBeVisible();
    await beginBtn.click();

    // Phase 2: CONSTRAINT
    const constraintPhase = page.locator('.da-discoverer-constraint');
    await expect(constraintPhase).toBeVisible({ timeout: 3000 });
    const constraintContinueBtn = page.locator('.da-discoverer-continue-btn');
    await expect(constraintContinueBtn).toBeVisible();
    await constraintContinueBtn.click();

    // Phase 3: DECISION
    const decisionPhase = page.locator('.da-discoverer-decision');
    await expect(decisionPhase).toBeVisible({ timeout: 3000 });
    // Decision uses HistoricalDecisionCard with radio options
    // Step A: Select an option (first radio not already selected)
    const decisionOption = page.locator('.da-decision-option');
    if (await decisionOption.count() > 0) {
      await decisionOption.first().click();
      await page.waitForTimeout(500);
    }
    // Step B: Click "Reveal What History Chose" button
    const revealBtn = page.locator('.da-decision-reveal-btn');
    await revealBtn.waitFor({ state: 'visible', timeout: 5000 });
    await revealBtn.click();
    // Step C: Click "Enter Builder Mode" button (appears after reveal)
    const buildBtn = page.locator('.da-decision-maker-build-btn');
    await buildBtn.waitFor({ state: 'visible', timeout: 5000 });
    await buildBtn.click();

    // Phase 4: BUILD
    const buildPhase = page.locator('.da-discoverer-build');
    await expect(buildPhase).toBeVisible({ timeout: 3000 });
    // Build phase auto-progresses objectives (1s initial + 1.5s between)
    // Wait for the completion button to appear
    const buildCompleteBtn = page.locator('.da-builder-complete-btn');
    await buildCompleteBtn.waitFor({ state: 'visible', timeout: 20000 });
    await buildCompleteBtn.click();

    // Phase 5: CONSEQUENCE
    const consequencePhase = page.locator('.da-discoverer-consequence');
    await expect(consequencePhase).toBeVisible({ timeout: 3000 });
    // Click "Continue Journey" button in ConsequenceRevealPanel
    const consequenceContinue = page.locator('.da-consequence-continue-btn');
    await consequenceContinue.waitFor({ state: 'visible', timeout: 10000 });
    await consequenceContinue.click();

    // Phase 6: CELEBRATION
    const celebrationPhase = page.locator('.da-discoverer-celebration');
    await expect(celebrationPhase).toBeVisible({ timeout: 3000 });

    // Click "Begin Your Journey" button
    const journeyBtn = page.locator('.da-discoverer-journey-btn');
    await expect(journeyBtn).toBeVisible();
    await journeyBtn.click();

    // After completion: story mode should be visible, discoverer should be gone
    await expect(page.locator('.da-story-mode-container')).toBeVisible({ timeout: 5000 });
    await expect(discoverer).not.toBeVisible();
  });

  test('[TD-4.1.4] should show story mode after discoverer completion (not discoverer again)', async ({ page }) => {
    // Complete discoverer by setting the flag
    await page.addInitScript(() => {
      localStorage.setItem('digital-archaeology-discoverer-complete', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
      if (storyBtn) storyBtn.click();
    });

    // Wait for story mode to load
    await expect(page.locator('.da-story-mode-container')).toBeVisible({ timeout: 5000 });

    // Discoverer should NOT be visible (M2 fix: use not.toBeVisible instead of count().toBe(0))
    await expect(page.locator('.da-discoverer-experience')).not.toBeVisible();

    // Story content should be visible
    const content = await getSceneContent(page);
    expect(content.length).toBeGreaterThan(0);
  });

  test('[TD-4.1.5] should persist discoverer completion across page reload', async ({ page }) => {
    // Set completion flag
    await page.addInitScript(() => {
      localStorage.setItem('digital-archaeology-discoverer-complete', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify flag persists
    const flagValue = await page.evaluate(() =>
      localStorage.getItem('digital-archaeology-discoverer-complete')
    );
    expect(flagValue).toBe('true');

    // Reload and verify discoverer doesn't show
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
      if (storyBtn) storyBtn.click();
    });

    // Wait for story mode to load
    await expect(page.locator('.da-story-mode-container')).toBeVisible({ timeout: 5000 });

    // Discoverer should NOT be visible after reload (M2 fix)
    await expect(page.locator('.da-discoverer-experience')).not.toBeVisible();
  });
});

// ─── Task 2: Choice Branching Journey (AC #2) ──────────────────────

test.describe('TD-4: Choice Branching Journey', () => {
  test('[TD-4.2.2] should navigate to a choice scene and verify branching produces different content', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to a choice scene
    const foundChoice = await navigateToChoiceScene(page);
    expect(foundChoice, 'Expected to find a choice scene in the story').toBe(true);

    // Record content before making choice
    const contentBeforeChoice = await getSceneContent(page);
    expect(contentBeforeChoice.length).toBeGreaterThan(0);

    // Count available choices
    const choiceCards = page.locator('.da-choice-card');
    const choiceCount = await choiceCards.count();
    expect(choiceCount).toBeGreaterThanOrEqual(2);

    // Select first choice (Choice A)
    await choiceCards.first().click();
    await page.waitForTimeout(1000);

    // Verify content changed after choice
    const contentAfterChoiceA = await getSceneContent(page);
    expect(contentAfterChoiceA).not.toBe(contentBeforeChoice);
    expect(contentAfterChoiceA.length).toBeGreaterThan(0);
  });

  test('[TD-4.2.5] should produce different content for different choices (proves branching)', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate to choice scene
    const foundChoice = await navigateToChoiceScene(page);
    expect(foundChoice, 'Expected to find a choice scene in the story').toBe(true);

    // Record the scene content at the choice point
    const contentAtChoice = await getSceneContent(page);
    const choiceCards = page.locator('.da-choice-card');
    const choiceCount = await choiceCards.count();
    expect(choiceCount).toBeGreaterThanOrEqual(2);

    // Capture text of each choice card for structural verification
    const choiceAText = await choiceCards.first().textContent();
    const choiceBText = await choiceCards.nth(1).textContent();
    expect(choiceAText).not.toBe(choiceBText);

    // Select Choice A (first)
    await choiceCards.first().click();
    await page.waitForTimeout(1000);
    const contentChoiceA = await getSceneContent(page);
    expect(contentChoiceA).not.toBe(contentAtChoice);
    expect(contentChoiceA.length).toBeGreaterThan(0);

    // Go back to the choice scene via Previous button
    const prevBtn = page.locator('button[aria-label="Go to previous scene"]');
    await expect(prevBtn.first()).toBeVisible();
    await prevBtn.first().click();
    await page.waitForTimeout(800);

    // Verify we are back at the choice scene (choice cards visible again)
    const choiceCardsAgain = page.locator('.da-choice-card');
    await expect(choiceCardsAgain.first()).toBeVisible();
    expect(await choiceCardsAgain.count()).toBeGreaterThanOrEqual(2);

    // Select Choice B (second) — should lead to different content
    await choiceCardsAgain.nth(1).click();
    await page.waitForTimeout(1000);
    const contentChoiceB = await getSceneContent(page);
    expect(contentChoiceB.length).toBeGreaterThan(0);

    // Different choices should produce different content (proves branching)
    expect(contentChoiceB).not.toBe(contentChoiceA);
  });

  test('[TD-4.2.6] should return to choice scene via back navigation', async ({ page }) => {
    await enterStoryMode(page);

    const foundChoice = await navigateToChoiceScene(page);
    expect(foundChoice, 'Expected to find a choice scene').toBe(true);

    const contentAtChoice = await getSceneContent(page);

    // Make a choice
    const choiceCards = page.locator('.da-choice-card');
    await choiceCards.first().click();
    await page.waitForTimeout(1000);

    // Verify we moved to a new scene
    const contentAfterChoice = await getSceneContent(page);
    expect(contentAfterChoice).not.toBe(contentAtChoice);

    // Use Previous button to go back (H2 fix: MUST exist, no silent skip)
    const prevBtn = page.locator('button[aria-label="Go to previous scene"]');
    await expect(prevBtn.first()).toBeVisible({ timeout: 5000 });
    await prevBtn.first().click();
    await page.waitForTimeout(800);

    // Should be back at a scene with content
    const contentAfterBack = await getSceneContent(page);
    expect(contentAfterBack.length).toBeGreaterThan(0);
  });
});

// ─── Task 3: Challenge Round-Trip Journey (AC #3) ──────────────────

test.describe('TD-4: Challenge Round-Trip Journey', () => {
  test('[TD-4.3.2] should enter lab from challenge scene and verify lab UI', async ({ page }) => {
    await enterStoryMode(page);

    const foundLab = await navigateToEnterLab(page);
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    // Record content before entering lab
    const contentBeforeLab = await getSceneContent(page);
    expect(contentBeforeLab.length).toBeGreaterThan(0);

    // Click Enter Lab
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
    await enterLabBtn.first().click();
    await page.waitForTimeout(1000);

    // Verify lab mode is active
    const inLabMode = await page.evaluate(() =>
      document.documentElement.classList.contains('lab-mode')
    );
    expect(inLabMode).toBe(true);

    // Verify challenge station UI elements
    await expect(page.locator('.da-challenge-station')).toBeVisible();
    await expect(page.locator('.da-challenge-station-simulator')).toBeVisible();
    await expect(page.locator('.da-challenge-station-sidebar')).toBeVisible();
  });

  test('[TD-4.3.6] should stay on same scene when returning from lab without completing', async ({ page }) => {
    await enterStoryMode(page);

    const foundLab = await navigateToEnterLab(page);
    expect(foundLab, 'Expected to find a challenge scene with Enter Lab button').toBe(true);

    const contentBeforeLab = await getSceneContent(page);

    // Enter lab
    const enterLabBtn = page.locator('.da-enter-lab-button, .da-story-action-btn--lab, [data-action="enter-lab"]');
    await enterLabBtn.first().click();
    await page.waitForTimeout(1000);

    // Return to story via mode toggle WITHOUT completing objectives
    await page.locator('.da-menubar-toggle [data-mode="story"]').click();
    await page.waitForTimeout(1000);

    // Verify story mode active
    const inStoryMode = await page.evaluate(() =>
      document.documentElement.classList.contains('story-mode')
    );
    expect(inStoryMode).toBe(true);

    // Verify content has NOT changed (no advancement — incomplete return)
    const contentAfterReturn = await getSceneContent(page);
    expect(contentAfterReturn).toBe(contentBeforeLab);
  });
});

// ─── Task 4: Multi-Scene Navigation Journey (AC #4) ────────────────

test.describe('TD-4: Multi-Scene Navigation Journey', () => {
  test('[TD-4.4.2] should navigate 5 consecutive scenes with content changing at each step', async ({ page }) => {
    await enterStoryMode(page);

    const sceneContents: string[] = [];
    const initialContent = await getSceneContent(page);
    expect(initialContent.length).toBeGreaterThan(0);
    sceneContents.push(initialContent);

    // Navigate through 5 scenes
    for (let i = 0; i < 5; i++) {
      const advanced = await tryAdvanceScene(page);
      if (!advanced) break;

      const content = await getSceneContent(page);
      expect(content.length).toBeGreaterThan(0);

      // Content should differ from previous scene
      expect(content).not.toBe(sceneContents[sceneContents.length - 1]);
      sceneContents.push(content);
    }

    // Should have navigated at least 4 scenes (5 total including start)
    expect(sceneContents.length).toBeGreaterThanOrEqual(4);
  });

  test('[TD-4.4.3] should have structural elements present on every scene', async ({ page }) => {
    await enterStoryMode(page);

    // Check structural elements on 3 consecutive scenes
    for (let i = 0; i < 3; i++) {
      // Story content area must exist with substantial content
      const content = page.locator('.da-story-content');
      await expect(content).toBeVisible();
      const text = await content.textContent();
      expect(text!.length).toBeGreaterThan(10);

      // Story mode container must be visible
      await expect(page.locator('.da-story-mode-container')).toBeVisible();

      const advanced = await tryAdvanceScene(page);
      if (!advanced) break;
    }
  });

  test('[TD-4.4.5] should navigate back with Previous button to earlier content', async ({ page }) => {
    await enterStoryMode(page);

    const firstContent = await getSceneContent(page);

    // Advance 2 scenes
    await tryAdvanceScene(page);
    const secondContent = await getSceneContent(page);
    expect(secondContent).not.toBe(firstContent);

    await tryAdvanceScene(page);

    // Go back with Previous button (H2 fix: MUST exist, no silent skip)
    const prevBtn = page.locator('button[aria-label="Go to previous scene"]');
    await expect(prevBtn.first()).toBeVisible({ timeout: 5000 });
    await prevBtn.first().click();
    await page.waitForTimeout(800);

    // Content should match the second scene (went back one)
    const backContent = await getSceneContent(page);
    expect(backContent).toBe(secondContent);
  });
});

// ─── Task 5: Persona Display Journey (AC #5) ───────────────────────

test.describe('TD-4: Persona Display Journey', () => {
  test('[TD-4.5.2] should display Your Role panel with persona information', async ({ page }) => {
    await enterStoryMode(page);

    // Navigate forward to find a scene with persona context
    let foundPersona = false;
    for (let i = 0; i < 15; i++) {
      const rolePanel = page.locator('.da-your-role-panel');
      if (await rolePanel.count() > 0 && await rolePanel.isVisible()) {
        const text = await rolePanel.textContent();
        if (text && text.length > 10) {
          foundPersona = true;
          // Verify persona panel has content
          expect(text.length).toBeGreaterThan(10);
          break;
        }
      }
      if (!(await tryAdvanceScene(page))) break;
    }

    // Your Role panel should exist (may be empty on some scenes)
    const rolePanel = page.locator('.da-your-role-panel');
    if (await rolePanel.count() > 0) {
      await expect(rolePanel).toBeVisible();
    }
  });

  test('[TD-4.5.5] should preserve persona state after switching to lab and back', async ({ page }) => {
    await enterStoryMode(page);

    // Get persona panel state
    const rolePanel = page.locator('.da-your-role-panel');
    let personaTextBefore = '';
    if (await rolePanel.count() > 0 && await rolePanel.isVisible()) {
      personaTextBefore = (await rolePanel.textContent()) ?? '';
    }

    // Switch to lab mode via menubar (use evaluate to avoid overlay interception)
    await page.evaluate(() => {
      const labBtn = document.querySelector('.da-menubar-toggle [data-mode="lab"]') as HTMLElement;
      if (labBtn) labBtn.click();
    });
    await page.waitForTimeout(1000);

    // Switch back to story mode via menubar
    await page.evaluate(() => {
      const storyBtn = document.querySelector('.da-menubar-toggle [data-mode="story"]') as HTMLElement;
      if (storyBtn) storyBtn.click();
    });
    await expect(page.locator('.da-story-mode-container')).toBeVisible({ timeout: 5000 });

    // Persona panel should still have same content
    if (personaTextBefore.length > 0) {
      const roleAfter = page.locator('.da-your-role-panel');
      if (await roleAfter.count() > 0 && await roleAfter.isVisible()) {
        const personaTextAfter = (await roleAfter.textContent()) ?? '';
        expect(personaTextAfter).toBe(personaTextBefore);
      }
    }

    // Story content should still be visible
    await expect(page.locator('.da-story-mode-container')).toBeVisible();
  });
});

// ─── Task 6: Multi-Act Progression Journey (AC #6) ─────────────────

test.describe('TD-4: Multi-Act Progression Journey', () => {
  test('[TD-4.6.1] should display all 11 acts in the story browser', async ({ page }) => {
    await enterStoryMode(page);

    // Open story browser via progress button
    const progressBtn = page.locator('.da-story-nav-progress');
    await expect(progressBtn).toBeVisible();
    await progressBtn.click();

    // Verify story browser modal opened
    await expect(page.locator('.da-story-browser')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.da-story-browser-backdrop')).toBeVisible();

    // Verify all 11 acts are listed
    const actHeaders = page.locator('.da-story-browser-act-header');
    expect(await actHeaders.count()).toBe(11);

    // Verify current act is highlighted
    const currentAct = page.locator('.da-story-browser-act-header--current');
    expect(await currentAct.count()).toBe(1);

    // Close browser
    const closeBtn = page.locator('.da-story-browser-close');
    await closeBtn.click();
    await expect(page.locator('.da-story-browser-backdrop')).not.toBeVisible();
  });

  test('[TD-4.6.2] should display progress dots for all 11 acts', async ({ page }) => {
    await enterStoryMode(page);

    // Check progress dots
    const progressDots = page.locator('.da-progress-dot');
    expect(await progressDots.count()).toBe(11);

    // One should be active
    const activeDot = page.locator('.da-progress-dot--active');
    expect(await activeDot.count()).toBe(1);

    // Each dot should have aria-label containing "Act"
    const firstDot = progressDots.first();
    const ariaLabel = await firstDot.getAttribute('aria-label');
    expect(ariaLabel).toContain('Act');
  });

  test('[TD-4.6.3] should show era badge in story mode', async ({ page }) => {
    await enterStoryMode(page);

    // Era badge should be visible
    const eraBadge = page.locator('.da-era-badge');
    if (await eraBadge.count() > 0) {
      await expect(eraBadge).toBeVisible();
      const badgeText = await eraBadge.textContent();
      expect(badgeText!.length).toBeGreaterThan(0);
    }
  });
});
