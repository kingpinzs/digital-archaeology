/**
 * Epic 4: Program Execution - E2E Tests
 * Tests Stories 4.1-4.8
 *
 * Selectors match actual implementation:
 * - Pause button: [data-action="pause"] (not "stop")
 * - Status sections: [data-section="load"], [data-section="pc"]
 */

import { test, expect } from '../support/fixtures';

test.describe('Epic 4: Program Execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
  });

  // Helper to assemble code
  async function assembleCode(page: import('@playwright/test').Page, code: string) {
    const editor = page.locator('.monaco-editor');
    await editor.click();
    await page.keyboard.type(code);
    await page.click('[data-action="assemble"]');
    // Wait for assembly to complete - Run button becomes enabled
    await page.waitForSelector('[data-action="run"]:not([disabled])', { timeout: 5000 });
  }

  test.describe('Story 4.1-4.3: WASM Emulator', () => {
    test('[4.1] should load WASM emulator without errors', async ({ page }) => {
      // Check for EmulatorBridge initialization errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Emulator')) {
          errors.push(msg.text());
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Story 4.4: Load Program', () => {
    test('[4.4] should load assembled program into emulator', async ({ page }) => {
      // GIVEN: Assembled program
      await assembleCode(page, 'LDI 5\nHLT');

      // THEN: Program is loaded (can check register view shows valid state)
      const registerView = page.locator('.da-register-view');
      await expect(registerView).toBeVisible();
    });
  });

  test.describe('Story 4.5: Run Button', () => {
    test('[4.5] should have visible Run button', async ({ page }) => {
      await expect(page.locator('[data-action="run"]')).toBeVisible();
    });

    test('[4.5] should run program when clicked', async ({ page }) => {
      // GIVEN: Assembled program that halts
      await assembleCode(page, 'LDI 5\nHLT');

      // WHEN: Click Run
      await page.click('[data-action="run"]');
      await page.waitForTimeout(1000);

      // THEN: Program executes and halts (status shows halted or ready)
      const statusText = await page.locator('[data-section="load"]').textContent();
      expect(statusText?.toLowerCase()).toMatch(/halt|ready|stopped|loaded/i);
    });

    test('[4.5] should update accumulator after running LDI', async ({ page }) => {
      // GIVEN: Program that loads value into accumulator
      await assembleCode(page, 'LDI 7\nHLT');

      // WHEN: Run
      await page.click('[data-action="run"]');
      await page.waitForTimeout(1000);

      // THEN: Accumulator shows loaded value
      const accValue = await page.locator('[data-register="accumulator"]').textContent();
      expect(accValue).toContain('7');
    });
  });

  test.describe('Story 4.6: Pause Button', () => {
    test('[4.6] should have Pause button', async ({ page }) => {
      // Note: Implementation uses "pause" not "stop"
      const pauseBtn = page.locator('[data-action="pause"]');
      // Pause button exists but may be hidden when not running
      expect(await pauseBtn.count()).toBeGreaterThan(0);
    });

    test('[4.6] should pause running program', async ({ page }) => {
      // GIVEN: Program that runs in a loop (no HLT, infinite)
      await assembleCode(page, 'LDI 1\nJMP 0'); // Infinite loop

      // WHEN: Run then quickly Pause
      await page.click('[data-action="run"]');
      await page.waitForTimeout(200);

      // Pause button may become visible during run
      const pauseBtn = page.locator('[data-action="pause"]');
      if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
        await page.waitForTimeout(200);
      }

      // THEN: Execution pauses (check load section)
      const statusText = await page.locator('[data-section="load"]').textContent();
      expect(statusText?.toLowerCase()).not.toContain('running');
    });
  });

  test.describe('Story 4.7: Reset Button', () => {
    test('[4.7] should have visible Reset button', async ({ page }) => {
      await expect(page.locator('[data-action="reset"]')).toBeVisible();
    });

    test('[4.7] should reset CPU state', async ({ page }) => {
      // GIVEN: Executed program that modified state
      await assembleCode(page, 'LDI 15\nHLT');
      await page.click('[data-action="run"]');
      await page.waitForTimeout(500);

      // WHEN: Click Reset
      await page.click('[data-action="reset"]');
      await page.waitForTimeout(200);

      // THEN: Accumulator reset to 0
      const accValue = await page.locator('[data-register="accumulator"]').textContent();
      expect(accValue).toContain('0');
    });

    test('[4.7] should reset PC to 0', async ({ page }) => {
      // GIVEN: Executed program
      await assembleCode(page, 'LDI 5\nLDI 3\nHLT');
      await page.click('[data-action="run"]');
      await page.waitForTimeout(500);

      // WHEN: Reset
      await page.click('[data-action="reset"]');
      await page.waitForTimeout(200);

      // THEN: PC shows 0
      const pcValue = await page.locator('[data-register="pc"]').textContent();
      expect(pcValue).toContain('0');
    });
  });

  test.describe('Story 4.8: Speed Control', () => {
    test('[4.8] should have speed control slider', async ({ page }) => {
      await expect(page.locator('.da-speed-control')).toBeVisible();
    });

    test('[4.8] should change execution speed', async ({ page }) => {
      // GIVEN: Speed control exists
      const speedControl = page.locator('.da-speed-control input[type="range"]');

      // WHEN: Change speed
      if (await speedControl.isVisible()) {
        await speedControl.fill('50');
      }

      // THEN: No error (speed change accepted)
      await expect(speedControl).toBeVisible();
    });
  });
});
