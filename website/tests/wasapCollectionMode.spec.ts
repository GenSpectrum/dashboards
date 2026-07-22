import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { E2E_GITHUB_ID } from './helpers/auth.ts';
import { createCollection, deleteCollection, syncUser } from './helpers/backendClient.ts';
import { wastewaterOrganisms } from '../src/types/wastewaterConfig.ts';

const ORGANISM = wastewaterOrganisms.covid;

const TEST_COLLECTION = {
    name: 'E2E Wasap Collection Mode Test Collection',
    organism: ORGANISM,
    description: 'Created by E2E tests — safe to delete',
    variants: [
        {
            type: 'filterObject',
            name: 'S:E484K',
            description: 'Spike E484K',
            filterObject: { aminoAcidMutations: ['S:E484K'] },
        },
    ],
};

let collectionId: number | undefined;
let userId: number;

function getCollectionId(): number {
    if (collectionId === undefined) throw new Error('collectionId was not set in beforeAll');
    return collectionId;
}

test.beforeAll(async ({ request }) => {
    userId = await syncUser(request, E2E_GITHUB_ID);
    collectionId = await createCollection(request, userId, TEST_COLLECTION);
});

test.afterAll(async ({ request }) => {
    if (collectionId === undefined) {
        return;
    }
    await deleteCollection(request, collectionId, userId);
});

test.describe('WASAP Collection analysis mode', () => {
    test.setTimeout(60_000);

    test('should show the heatmap after selecting and applying a collection', async ({ wasapPage }) => {
        await wasapPage.goto(ORGANISM);

        await wasapPage.selectAnalysisMode('Collection');
        await wasapPage.selectCollection(TEST_COLLECTION.name, getCollectionId());
        await wasapPage.submitFilters();

        await wasapPage.expectToSeeNoComponentErrors();
        await expect(wasapPage.collectionOverTimeHeading).toBeVisible();
        await expect(wasapPage.page.getByText('GenSpectrum collection')).toBeVisible();
    });
});
