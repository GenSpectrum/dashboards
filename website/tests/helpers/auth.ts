import { makeSignature, symmetricEncodeJWT } from 'better-auth/crypto';
import type { Cookie, Page } from '@playwright/test';

// NOTE: for getSession to use the session_data cookie (bypassing the in-memory store lookup),
// cookieCache must be enabled in auth.ts:
//   session: { cookieCache: { enabled: true, maxAge: 60 * 60, strategy: 'jwe' } }

const SECRET = process.env.AUTH_SECRET ?? '';
const COOKIE_PREFIX = 'gen-spectrum';
const DOMAIN = 'localhost';

const COOKIE_BASE = {
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax' as const,
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
            accountId: '1234567',
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
                githubId: '1234567',
            },
            updatedAt: now.getTime(),
            version: '1',
        },
    );

    await page.context().addCookies(cookies);
}
