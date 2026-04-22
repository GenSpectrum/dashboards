import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';

const TEST_USER_NAME = 'e2e-test';

test('shows Login button when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('shows account icon instead of Login button when authenticated', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    await expect(authenticatedPage.getByRole('button', { name: 'Login' })).not.toBeVisible();
    await expect(authenticatedPage.locator('.mdi--account[role="button"]')).toBeVisible();
});

test('shows username in dropdown when hovering account icon', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    await authenticatedPage.locator('.mdi--account[role="button"]').hover();

    await expect(authenticatedPage.locator('.dropdown-content').getByText(TEST_USER_NAME)).toBeVisible();
});
