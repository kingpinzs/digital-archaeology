import { test, expect } from '../support/fixtures';

test.describe('Digital Archaeology App', () => {
  test('[P0] should load the application', async ({ page }) => {
    // GIVEN: The application is running
    // WHEN: User navigates to the homepage
    await page.goto('/');

    // THEN: The page loads successfully
    await expect(page).toHaveTitle(/Digital Archaeology/i);
  });

  test('[P1] should display without JavaScript errors', async ({ page }) => {
    // GIVEN: We're monitoring console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: User navigates to the homepage
    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // THEN: No JavaScript errors should occur
    expect(errors).toHaveLength(0);
  });
});
