import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';
import { E2E_GITHUB_ID } from '../helpers/auth.ts';
import { generateApiKey, revokeApiKey, syncUser } from '../helpers/backendClient.ts';

test('GET /api/users/me returns 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/api/users/me');

    expect(response.status()).toBe(401);
});

test('GET /api/users/me returns user data when authenticated', async ({ authenticatedPage }) => {
    const response = await authenticatedPage.request.get('/api/users/me');

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { id: number; name: string };
    expect(typeof body.id).toBe('number');
    expect(body.name).toBe('e2e-test');
});

test('GET /api/users/me returns user data when authenticated via Bearer token', async ({ request }) => {
    const userId = await syncUser(request, E2E_GITHUB_ID);
    const apiKey = await generateApiKey(request, userId);

    try {
        const response = await request.get('/api/users/me', {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as { id: number; name: string };
        expect(body.id).toBe(userId);
    } finally {
        await revokeApiKey(request, userId);
    }
});
