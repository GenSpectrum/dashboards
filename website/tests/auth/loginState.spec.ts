import { encode } from '@auth/core/jwt';
import { expect, test } from '@playwright/test';

const COOKIE_NAME = 'authjs.session-token';

test('shows Login button when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('shows account icon instead of Login button when authenticated', async ({ page }) => {
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret === undefined) {
        throw new Error('AUTH_SECRET environment variable is not set');
    }

    const token = await encode({
        token: { userIdFromProvider: 'e2e-test-user' },
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

    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login' })).not.toBeVisible();
    await expect(page.locator('.mdi--account[role="button"]')).toBeVisible();
});
