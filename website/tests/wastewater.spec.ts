import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import type { WastewaterOrganismName } from '../src/types/wastewaterConfig.ts';

const wasapOrganisms: { organism: WastewaterOrganismName; name: string }[] = [
    { organism: 'covid', name: 'SARS-CoV-2' },
    { organism: 'rsv-a', name: 'RSV-A' },
    { organism: 'rsv-b', name: 'RSV-B' },
];

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
    for (const { organism, name } of wasapOrganisms) {
        test.describe(name, () => {
            test('should load with default filters and show mutation data', async ({ wasapPage }) => {
                await wasapPage.goto(organism);

                await expect(wasapPage.page).toHaveTitle(`Swiss wastewater - ${name}`);
                await expect(wasapPage.filterDatasetHeading).toBeVisible();
                await expect(wasapPage.mutationSelectionHeading).toBeVisible();

                await wasapPage.expectToSeeNoErrors();

                await expect(wasapPage.mutationsOverTimeHeading).toBeVisible();
            });

            test('should show mutation data after applying filters', async ({ wasapPage }) => {
                await wasapPage.goto(organism);

                await wasapPage.submitFilters();

                await wasapPage.expectToSeeNoErrors();
                await expect(wasapPage.mutationsOverTimeHeading).toBeVisible();
            });
        });
    }
});

test.describe('Non-interactive Wastewater Pages', () => {
    // These pages load web components that make external LAPIS requests, so they need more time.
    test.setTimeout(60_000);

    test('RSV page should render with RSV-A and RSV-B sections', async ({ page }) => {
        await page.goto('/swiss-wastewater/rsv', { timeout: 60_000 });

        await expect(page).toHaveTitle('Swiss wastewater - RSV');
        await expect(page.getByRole('heading', { name: 'RSV-A', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'RSV-B', level: 2, exact: true })).toBeVisible();
    });

    test('Influenza page should render with all subtype sections', async ({ page }) => {
        await page.goto('/swiss-wastewater/flu', { timeout: 60_000 });

        await expect(page).toHaveTitle('Swiss wastewater - Influenza');
        await expect(page.getByRole('heading', { name: 'H1', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'N1', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'H3', level: 2, exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'N2', level: 2, exact: true })).toBeVisible();
    });
});
