import { encode } from '@auth/core/jwt';
import { type Page } from '@playwright/test';

const COOKIE_NAME = 'authjs.session-token';

export async function setupAuthCookie(page: Page, userId: string) {
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret === undefined) {
        throw new Error('AUTH_SECRET environment variable is not set');
    }

    const token = await encode({
        token: { userIdFromProvider: userId, name: userId },
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
