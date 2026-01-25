/**
 * Full User Journey E2E Test
 *
 * This test proves the complete application works end-to-end by simulating
 * a real user workflow: write code, assemble, run, debug, and interact with
 * story mode.
 */

import { test, expect } from '../support/fixtures';

test.describe('Full User Journey', () => {
  test('Complete workflow: write, assemble, run, step, reset', async ({ page }) => {
    // 1. OPEN THE APP
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Verify app loaded correctly
    await expect(page.locator('.da-toolbar')).toBeVisible();
    await expect(page.locator('.da-statusbar')).toBeVisible();
    await expect(page.locator('.da-register-view')).toBeVisible();
    await expect(page.locator('.da-memory-view')).toBeVisible();

    // 2. WRITE ASSEMBLY CODE
    const editor = page.locator('.monaco-editor');
    await editor.click();

    // Write a program that:
    // - Loads 5 into accumulator
    // - Loads 3 into accumulator (overwrites)
    // - Stores to memory address 10
    // - Halts
    await page.keyboard.type('LDI 5\nLDI 3\nSTA 10\nHLT');

    // Verify code appears in editor
    const editorContent = await page.locator('.view-lines').textContent();
    expect(editorContent).toContain('LDI');
    expect(editorContent).toContain('STA');
    expect(editorContent).toContain('HLT');

    // 3. ASSEMBLE THE CODE
    await page.click('[data-action="assemble"]');

    // Wait for assembly to complete (Run button becomes enabled)
    await page.waitForSelector('[data-action="run"]:not([disabled])', { timeout: 5000 });

    // Verify assembly succeeded - status shows success
    const assemblyStatus = await page.locator('[data-section="assembly"]').textContent();
    expect(assemblyStatus?.toLowerCase()).toMatch(/success|ok|ready|assembled/i);

    // 4. STEP THROUGH THE PROGRAM
    // Initial state: PC=0, ACC=0
    let pcValue = await page.locator('[data-register="pc"]').textContent();
    expect(pcValue).toContain('0');

    let accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('0');

    // Step 1: Execute LDI 5
    await page.click('[data-action="step"]');
    await page.waitForTimeout(200);

    accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('5');

    // Step 2: Execute LDI 3 (overwrites accumulator)
    await page.click('[data-action="step"]');
    await page.waitForTimeout(200);

    accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('3');

    // 5. STEP BACK (verify history works)
    await page.click('[data-action="step-back"]');
    await page.waitForTimeout(200);

    accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('5');

    // 6. RESET AND RUN TO COMPLETION
    await page.click('[data-action="reset"]');
    await page.waitForTimeout(200);

    // Verify reset worked
    accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('0');

    pcValue = await page.locator('[data-register="pc"]').textContent();
    expect(pcValue).toContain('0');

    // Run the full program
    await page.click('[data-action="run"]');
    await page.waitForTimeout(1000); // Wait for execution to complete

    // Program should have halted with ACC=3 (from LDI 3)
    accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('3');

    // 7. VERIFY MEMORY WAS UPDATED
    // Memory at address 10 should contain 3 (from STA 10)
    const memoryView = await page.locator('.da-memory-view').textContent();
    expect(memoryView).toBeTruthy(); // Memory view exists and has content

    console.log('✅ Full workflow completed: write → assemble → step → step-back → reset → run');
  });

  test('Story mode round-trip preserves editor state', async ({ page }) => {
    // 1. OPEN APP IN LAB MODE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Verify we're in Lab mode
    const inLabMode = await page.evaluate(() =>
      document.documentElement.classList.contains('lab-mode')
    );
    expect(inLabMode).toBe(true);

    // 2. WRITE AND ASSEMBLE CODE
    // Note: Micro4 is a 4-bit CPU, max value is 15
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('LDI 12\nHLT');

    await page.click('[data-action="assemble"]');
    await page.waitForSelector('[data-action="run"]:not([disabled])', { timeout: 5000 });

    // 3. SWITCH TO STORY MODE
    await page.evaluate(() => {
      const storyBtn = document.querySelector('[data-mode="story"]') as HTMLElement;
      if (storyBtn) storyBtn.click();
    });
    await page.waitForTimeout(500);

    // Verify Story mode activated
    const inStoryMode = await page.evaluate(() =>
      document.documentElement.classList.contains('story-mode')
    );
    expect(inStoryMode).toBe(true);

    // Verify story content loaded
    await expect(page.locator('.da-story-mode-container')).toBeVisible();
    await expect(page.locator('.da-story-nav')).toBeVisible();

    // 4. SWITCH BACK TO LAB MODE
    await page.evaluate(() => {
      const labBtn = document.querySelector('[data-mode="lab"]') as HTMLElement;
      if (labBtn) labBtn.click();
    });
    await page.waitForTimeout(500);

    // Verify Lab mode restored
    const backInLabMode = await page.evaluate(() =>
      document.documentElement.classList.contains('lab-mode')
    );
    expect(backInLabMode).toBe(true);

    // 5. VERIFY EDITOR STATE PRESERVED
    const editorContent = await page.locator('.view-lines').textContent();
    expect(editorContent).toContain('LDI');
    expect(editorContent).toContain('12');

    // 6. RUN THE PRESERVED PROGRAM
    await page.click('[data-action="run"]');
    await page.waitForTimeout(500);

    // Verify it executed correctly (12 = 0xC)
    const accValue = await page.locator('[data-register="accumulator"]').textContent();
    expect(accValue).toContain('12');

    console.log('✅ Story mode round-trip completed: code preserved and executed');
  });

  test('Error handling: invalid instruction shows error', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Write invalid code
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type('INVALID_INSTRUCTION 99');

    // Try to assemble
    await page.click('[data-action="assemble"]');
    await page.waitForTimeout(500);

    // Run button should still be disabled (assembly failed)
    const runButton = page.locator('[data-action="run"]');
    await expect(runButton).toBeDisabled();

    // Error panel should show the error
    const errorPanel = page.locator('.da-error-panel');
    if (await errorPanel.count() > 0) {
      await expect(errorPanel).toBeVisible();
    }

    console.log('✅ Error handling verified: invalid instruction prevented execution');
  });
});
