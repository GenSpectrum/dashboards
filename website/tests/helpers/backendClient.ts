import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function syncUser(request: APIRequestContext, githubId: string): Promise<number> {
    const response = await request.post(`${BACKEND_URL}/users/sync`, {
        data: { githubId, name: 'E2E Test User', email: null },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { id: number };
    return body.id;
}

export async function createCollection(request: APIRequestContext, userId: number, data: object): Promise<number> {
    const response = await request.post(`${BACKEND_URL}/collections?userId=${userId}`, { data });
    expect(response.status()).toBe(201);
    const body = (await response.json()) as { id: number };
    return body.id;
}

export async function deleteCollection(
    request: APIRequestContext,
    collectionId: number,
    userId: number,
): Promise<void> {
    const response = await request.delete(`${BACKEND_URL}/collections/${collectionId}?userId=${userId}`);
    expect(response.status()).toBe(204);
}

export async function generateApiKey(request: APIRequestContext, userId: number): Promise<string> {
    const response = await request.post(`${BACKEND_URL}/api-keys?userId=${userId}`);
    expect(response.status()).toBe(201);
    const body = (await response.json()) as { key: string };
    return body.key;
}

export async function revokeApiKey(request: APIRequestContext, userId: number): Promise<void> {
    await request.delete(`${BACKEND_URL}/api-keys?userId=${userId}`);
}
