import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';
import { E2E_GITHUB_ID } from '../helpers/auth.ts';
import { createCollection, deleteCollection, syncUser } from '../helpers/backendClient.ts';
const ORGANISM = 'covid';
const ORGANISM_LABEL = 'SARS-CoV-2';

const TEST_COLLECTION = {
    name: 'E2E Test Collection',
    organism: ORGANISM,
    description: 'Created by E2E tests — safe to delete',
    variants: [
        {
            type: 'filterObject',
            name: 'JN.1*',
            description: 'JN.1 lineage',
            filterObject: { nextcladePangoLineage: 'JN.1*' },
        },
        {
            type: 'query',
            name: 'Switzerland',
            description: 'Sequences from Switzerland',
            countQuery: "country = 'Switzerland'",
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

test.describe('Collection detail page', () => {
    test('shows collection name and metadata', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        await expect(collectionDetailPage.heading(TEST_COLLECTION.name)).toBeVisible();
        await expect(collectionDetailPage.idText(getCollectionId())).toBeVisible();
        await expect(collectionDetailPage.metadataText(ORGANISM_LABEL)).toBeVisible();
    });

    test('shows variant table with correct headers', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        await expect(collectionDetailPage.table).toBeVisible();

        for (const header of ['Name', 'Description', 'Query', 'Total', 'Last 30d', 'Last 90d']) {
            await expect(collectionDetailPage.tableColumnHeader(header)).toBeVisible();
        }
    });

    test('shows both variant rows with correct names and descriptions', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        await expect(collectionDetailPage.tableCell('JN.1*', { exact: true })).toBeVisible();
        await expect(collectionDetailPage.tableCell('JN.1 lineage')).toBeVisible();
        await expect(collectionDetailPage.tableCell('Switzerland', { exact: true })).toBeVisible();
        await expect(collectionDetailPage.tableCell('Sequences from Switzerland')).toBeVisible();
    });

    test('filterObject variant shows formatted lineage query', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        await expect(collectionDetailPage.page.getByText('nextcladePangoLineage: JN.1*')).toBeVisible();
    });

    test('query variant shows raw count query', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        await expect(collectionDetailPage.page.getByText("country = 'Switzerland'")).toBeVisible();
    });

    test('variant name links to single-variant analysis page', async ({ collectionDetailPage }) => {
        await collectionDetailPage.goto(ORGANISM, getCollectionId());

        const link = collectionDetailPage.variantLink('JN.1*');
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', /single-variant.*nextcladePangoLineage/);
    });

    test('redirects to 404 for unknown collection id', async ({ page }) => {
        const response = await page.goto('/collections/covid/999999999');
        expect(response?.url()).toContain('/404');
    });
});
