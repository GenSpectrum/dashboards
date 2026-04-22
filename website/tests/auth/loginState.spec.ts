import { encode } from '@auth/core/jwt';
import { expect, test, type Page } from '@playwright/test';

const COOKIE_NAME = 'authjs.session-token';
const TEST_USER_NAME = 'E2E Test User';

async function setupAuthCookie(page: Page) {
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret === undefined) {
        throw new Error('AUTH_SECRET environment variable is not set');
    }

    const token = await encode({
        token: { userIdFromProvider: 'e2e-test-user', name: TEST_USER_NAME },
        secret: authSecret,
        salt: COOKIE_NAME,
    });

    await page.context().addCookies([
        {
            name: COOKIE_NAME,
            value: token,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
        },
    ]);
}

test('shows Login button when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('shows account icon instead of Login button when authenticated', async ({ page }) => {
    await setupAuthCookie(page);
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login' })).not.toBeVisible();
    await expect(page.locator('.mdi--account[role="button"]')).toBeVisible();
});

test('shows username in dropdown when hovering account icon', async ({ page }) => {
    await setupAuthCookie(page);
    await page.goto('/');

    await page.locator('.mdi--account[role="button"]').hover();

    await expect(page.locator('.dropdown-content').getByText(TEST_USER_NAME)).toBeVisible();
});
