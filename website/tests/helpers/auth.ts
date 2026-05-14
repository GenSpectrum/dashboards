import type { Cookie, Page } from '@playwright/test';
import { makeSignature, symmetricEncodeJWT } from 'better-auth/crypto';

// NOTE: for getSession to use the session_data cookie (bypassing the in-memory store lookup),
// cookieCache must be enabled in auth.ts:
//   session: { cookieCache: { enabled: true, maxAge: 60 * 60, strategy: 'jwe' } }

export const E2E_GITHUB_ID = '1234567';

const rawSecret = process.env.AUTH_SECRET;
if (!rawSecret) {
    throw new Error('AUTH_SECRET environment variable is not set');
}
const SECRET: string = rawSecret;
const COOKIE_PREFIX = 'genspectrum';
const DOMAIN = 'localhost';

const COOKIE_BASE = {
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax' as const,
    expires: -1,
};

export async function createAuthCookies(
    accountPayload: Record<string, unknown>,
    sessionPayload: Record<string, unknown>,
): Promise<Cookie[]> {
    const token = crypto.randomUUID();
    const signedToken = `${token}.${await makeSignature(token, SECRET)}`;
    const accountData = await symmetricEncodeJWT(accountPayload, SECRET, 'better-auth-account');
    const sessionData = await symmetricEncodeJWT(sessionPayload, SECRET, 'better-auth-session');

    return [
        { ...COOKIE_BASE, name: `${COOKIE_PREFIX}.session_token`, value: signedToken },
        { ...COOKIE_BASE, name: `${COOKIE_PREFIX}.account_data`, value: accountData },
        { ...COOKIE_BASE, name: `${COOKIE_PREFIX}.session_data`, value: sessionData },
    ];
}

export async function setupAuthCookie(page: Page, name: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const userId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();

    const cookies = await createAuthCookies(
        {
            id: crypto.randomUUID(),
            providerId: 'github',
            accountId: E2E_GITHUB_ID,
            userId,
            accessToken: 'e2e-test-access-token',
            scope: 'read:user,user:email',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        },
        {
            session: {
                id: crypto.randomUUID(),
                userId,
                token: sessionToken,
                expiresAt: expiresAt.toISOString(),
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                ipAddress: null,
                userAgent: null,
            },
            user: {
                id: userId,
                name,
                email: 'e2e@test.local',
                emailVerified: true,
                image: null,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                githubId: E2E_GITHUB_ID,
            },
            updatedAt: now.getTime(),
            version: '1',
        },
    );

    await page.context().addCookies(cookies);
}
