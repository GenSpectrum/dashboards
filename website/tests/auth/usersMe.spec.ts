import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';

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
