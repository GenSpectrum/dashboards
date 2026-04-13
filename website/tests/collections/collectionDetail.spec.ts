import { expect, test } from '@playwright/test';

const BACKEND_URL = 'http://localhost:8080';
const USER_ID = 'e2e-test';

const TEST_COLLECTION = {
    name: 'E2E Test Collection',
    organism: 'covid',
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

let collectionId: number;

test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/collections?userId=${USER_ID}`, {
        data: TEST_COLLECTION,
    });
    expect(response.status()).toBe(201);
    const body = (await response.json()) as { id: number };
    collectionId = body.id;
});

test.afterAll(async ({ request }) => {
    await request.delete(`${BACKEND_URL}/collections/${collectionId}?userId=${USER_ID}`);
});

test.describe('Collection detail page', () => {
    test('shows collection name and metadata', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        await expect(page.getByRole('heading', { name: TEST_COLLECTION.name })).toBeVisible();
        await expect(page.getByText(`#${collectionId}`)).toBeVisible();
        await expect(page.getByText(/SARS-CoV-2.*collection.*owned by/i)).toBeVisible();
    });

    test('shows variant table with correct headers', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        const table = page.getByRole('table');
        await expect(table).toBeVisible();

        for (const header of ['Name', 'Description', 'Query', 'Total', 'Last 30d', 'Last 90d']) {
            await expect(table.getByRole('columnheader', { name: header })).toBeVisible();
        }
    });

    test('shows both variant rows with correct names and descriptions', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        const table = page.getByRole('table');
        await expect(table.getByRole('cell', { name: 'JN.1*', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'JN.1 lineage' })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Switzerland', exact: true })).toBeVisible();
        await expect(table.getByRole('cell', { name: 'Sequences from Switzerland' })).toBeVisible();
    });

    test('filterObject variant shows formatted lineage query', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        await expect(page.getByText('nextcladePangoLineage: JN.1*')).toBeVisible();
    });

    test('query variant shows raw count query', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        await expect(page.getByText("country = 'Switzerland'")).toBeVisible();
    });

    test('variant name links to single-variant analysis page', async ({ page }) => {
        await page.goto(`/collections/covid/${collectionId}`);

        const link = page.getByRole('link', { name: 'JN.1*' });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', /single-variant.*nextcladePangoLineage/);
    });

    test('redirects to 404 for unknown collection id', async ({ page }) => {
        const response = await page.goto('/collections/covid/999999999');
        expect(response?.url()).toContain('/404');
    });
});
