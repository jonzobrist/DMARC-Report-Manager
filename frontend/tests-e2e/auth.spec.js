import { test, expect } from '@playwright/test';

test('has title and login link', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/DMARC/);

    // If not logged in, should be redirected to login
    await expect(page).toHaveURL(/.*login/);

    const loginHeader = page.getByRole('heading', { name: 'Welcome Back' });
    await expect(loginHeader).toBeVisible();
});
