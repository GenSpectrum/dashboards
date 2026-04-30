import { type Page } from '@playwright/test';
import { SignJWT } from 'jose';

// Cookie name used by better-auth for session tokens
const COOKIE_NAME = 'better-auth.session_token';

export async function setupAuthCookie(page: Page, userId: string) {
    const authSecret = process.env.AUTH_SECRET;
    if (authSecret === undefined) {
        throw new Error('AUTH_SECRET environment variable is not set');
    }

    // TODO: This token creation is a best guess at the format better-auth uses in stateless mode
    // and MUST be verified before relying on it in CI or production test runs.
    //
    // BACKGROUND:
    // The previous implementation used @auth/core/jwt's encode() function, which had a well-known
    // format (a signed JWE/JWT with a specific salt). better-auth's internal token format is not
    // publicly documented, and may differ significantly — it may not be a plain JWT at all, may use
    // a different signing algorithm, a different payload structure, or additional envelope fields.
    //
    // WHAT THIS ASSUMES:
    // - better-auth uses HS256-signed JWTs in stateless mode
    // - The payload shape is { id, userId, expiresAt, user: { id, name } }
    // - The secret is used directly (encoded as UTF-8) to sign the token
    // - The cookie name is "better-auth.session_token"
    // These are all reasonable guesses but none are guaranteed to be correct.
    //
    // HOW TO VERIFY:
    // 1. Run the app locally and sign in with GitHub
    // 2. Inspect the "better-auth.session_token" cookie in your browser's DevTools
    // 3. Decode the token at jwt.io (if it is a JWT) to see the actual payload shape and header
    // 4. Compare against what this function produces and adjust accordingly
    //
    // ALTERNATIVES IF THIS APPROACH DOESN'T WORK:
    // - Check if better-auth exposes internal utilities for creating test sessions
    //   (search for test helpers in node_modules/better-auth/dist/)
    // - Drive the full GitHub OAuth flow in tests using a mock OAuth server
    // - Replace the cookie-based approach with a test-only API endpoint that creates a session
    //   directly via auth.api (only enabled in test/dev environments)
    const secret = new TextEncoder().encode(authSecret);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const token = await new SignJWT({
        id: userId,
        userId,
        expiresAt: expiresAt.toISOString(),
        user: { id: userId, name: userId },
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(secret);

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
