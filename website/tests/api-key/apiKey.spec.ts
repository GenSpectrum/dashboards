import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';
import { E2E_GITHUB_ID } from '../helpers/auth.ts';
import { BACKEND_URL, deleteCollection, syncUser } from '../helpers/backendClient.ts';

const ORGANISM = 'covid';

const SEED_COLLECTION = {
    name: 'API Key E2E Test Collection',
    organism: ORGANISM,
    description: 'Created via Bearer token auth by E2E tests — safe to delete',
    variants: [],
};

test.describe('API key management', () => {
    let userId: number;

    test.beforeAll(async ({ request }) => {
        userId = await syncUser(request, E2E_GITHUB_ID);
    });

    test.afterAll(async ({ request }) => {
        // Clean up any leftover key (best-effort)
        await request.delete(`${BACKEND_URL}/api-keys?userId=${userId}`);
    });

    test('shows "Please login" when not authenticated', async ({ page }) => {
        await page.goto('/api-key');

        await expect(page.getByRole('heading', { name: 'Please login' })).toBeVisible();
    });

    test('full API key lifecycle: generate, use, revoke', async ({ authenticatedApiKeyPage, request }) => {
        await authenticatedApiKeyPage.goto();

        // Generate a key
        await authenticatedApiKeyPage.generateButton().click();
        await expect(authenticatedApiKeyPage.modal()).toBeVisible();
        const apiKey = await authenticatedApiKeyPage.getGeneratedKey();
        expect(apiKey).toHaveLength(64);
        expect(apiKey).toMatch(/^[0-9a-f]+$/);

        // Dismiss the modal
        await authenticatedApiKeyPage.doneButton().click();
        await expect(authenticatedApiKeyPage.modal()).not.toBeVisible();

        // Revoke button is now visible (key exists)
        await expect(authenticatedApiKeyPage.revokeButton()).toBeVisible();

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const bearerHeaders = { Authorization: `Bearer ${apiKey}` };

        // Create a collection via the API using the Bearer token
        const createResponse = await request.post('/api/collections', {
            headers: bearerHeaders,
            data: SEED_COLLECTION,
        });
        expect(createResponse.status()).toBe(201);
        const { id: collectionId } = (await createResponse.json()) as { id: number };

        // Verify the collection is accessible
        const getResponse = await request.get(`/api/collections/${collectionId}`, {
            headers: bearerHeaders,
        });
        expect(getResponse.status()).toBe(200);
        const collection = (await getResponse.json()) as { name: string };
        expect(collection.name).toBe(SEED_COLLECTION.name);

        // Revoke the key via the UI — register the dialog handler before triggering the click
        authenticatedApiKeyPage.page.once('dialog', (dialog) => void dialog.accept());
        await authenticatedApiKeyPage.revokeButton().click();
        await expect(authenticatedApiKeyPage.generateButton()).toBeVisible();

        // Creating another collection with the revoked key should now fail (401)
        const afterRevokeResponse = await request.post('/api/collections', {
            headers: bearerHeaders,
            data: SEED_COLLECTION,
        });
        expect(afterRevokeResponse.status()).toBe(401);

        // Clean up the collection created earlier
        await deleteCollection(request, collectionId, userId);
    });
});
