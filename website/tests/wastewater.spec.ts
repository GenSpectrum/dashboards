import { expect } from '@playwright/test';

import { expectToSeeNoComponentErrors } from './ViewPage.ts';
import { test } from './e2e.fixture.ts';
import { E2E_GITHUB_ID } from './helpers/auth.ts';
import { createCollection, deleteCollection, syncUser } from './helpers/backendClient.ts';
import { wastewaterOrganismConfigs, wastewaterOrganisms } from '../src/types/wastewaterConfig.ts';

test.describe('The Swiss Wastewater Overview Page', () => {
    test('should show heading and links to all wastewater pages', async ({ page }) => {
        await page.goto('/swiss-wastewater');

        await expect(page).toHaveTitle('Swiss Wastewater');
        await expect(page.getByRole('heading', { name: 'Swiss Wastewater', level: 1 })).toBeVisible();

        await expect(page.getByRole('link', { name: /^SARS-CoV-2 Analyze/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /^RSV-A Analyze/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /^RSV-B Analyze/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /^RSV \(non-interactive\)/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /^Influenza \(non-interactive\)/ })).toBeVisible();
    });
});

test.describe('WASAP Pages', () => {
    test.setTimeout(60_000);

    for (const organism of Object.values(wastewaterOrganisms)) {
        const { name } = wastewaterOrganismConfigs()[organism];

        test.describe(name, () => {
            test('should load with default filters and show mutation data', async ({ wasapPage }) => {
                await wasapPage.goto(organism);

                await expect(wasapPage.page).toHaveTitle(`Swiss wastewater - ${name}`);
                await expect(wasapPage.filterDatasetHeading).toBeVisible();
                await expect(wasapPage.mutationSelectionHeading).toBeVisible();

                await wasapPage.expectToSeeNoComponentErrors();

                await expect(wasapPage.mutationsOverTimeHeading).toBeVisible();
            });

            test('should show mutation data after changing and applying filters', async ({ wasapPage }) => {
                await wasapPage.goto(organism);

                await wasapPage.selectAnalysisMode('Variant Explorer');
                await wasapPage.selectGranularity('Week');
                await wasapPage.submitFilters();

                await wasapPage.expectToSeeNoComponentErrors();
                await expect(wasapPage.mutationsOverTimeHeading).toBeVisible();
            });
        });
    }
});

test.describe('WASAP Collection analysis mode', () => {
    test.setTimeout(60_000);

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

test.describe('Non-interactive Wastewater Pages', () => {
    test.setTimeout(60_000);

    test('RSV page should render with RSV-A and RSV-B sections', async ({ page }) => {
        await page.goto('/swiss-wastewater/rsv', { timeout: 60_000 });

        await expect(page).toHaveTitle('Swiss wastewater - RSV');
        await expect(page.getByRole('heading', { name: 'RSV-A', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'RSV-B', level: 2, exact: true })).toBeVisible();
        await expectToSeeNoComponentErrors(page);
    });

    test('Influenza page should render with all subtype sections', async ({ page }) => {
        await page.goto('/swiss-wastewater/flu', { timeout: 60_000 });

        await expect(page).toHaveTitle('Swiss wastewater - Influenza');
        await expect(page.getByRole('heading', { name: 'H1', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'N1', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'H3', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'N2', level: 2, exact: true })).toBeVisible();
        await expectToSeeNoComponentErrors(page);
    });
});
