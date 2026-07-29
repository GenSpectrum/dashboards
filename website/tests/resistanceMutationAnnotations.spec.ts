import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismOptions } from './helpers/organisms.ts';
import { Organisms } from '../src/types/Organism.ts';

test.describe('Resistance mutation annotations on regular dashboards', () => {
    test.setTimeout(60_000);

    test('COVID single-variant page shows resistance mutation sets in the filter mutations panel', async ({
        singleVariantPage,
    }) => {
        const options = organismOptions[Organisms.covid];
        await singleVariantPage.goto(Organisms.covid);
        await singleVariantPage.selectDateRange('All times');
        await singleVariantPage.selectVariant(options);
        await singleVariantPage.submitFilters();

        await singleVariantPage.page
            .getByRole('button', { name: /filter mutations/i })
            .first()
            .click();

        await expect(singleVariantPage.page.getByText('3CLpro')).toBeVisible();
        await expect(singleVariantPage.page.getByText('RdRp')).toBeVisible();
        await expect(singleVariantPage.page.getByText('Spike')).toBeVisible();
    });

    test('RSV-A single-variant page shows resistance mutation sets in the filter mutations panel', async ({
        singleVariantPage,
    }) => {
        const options = organismOptions[Organisms.rsvA];
        await singleVariantPage.goto(Organisms.rsvA);
        await singleVariantPage.selectDateRange('All times');
        await singleVariantPage.selectVariant(options);
        await singleVariantPage.submitFilters();

        await singleVariantPage.page
            .getByRole('button', { name: /filter mutations/i })
            .first()
            .click();

        await expect(singleVariantPage.page.getByText('Nirsevimab')).toBeVisible();
        await expect(singleVariantPage.page.getByText('Palivizumab')).toBeVisible();
    });

    test('RSV-B single-variant page shows resistance mutation sets in the filter mutations panel', async ({
        singleVariantPage,
    }) => {
        const options = organismOptions[Organisms.rsvB];
        await singleVariantPage.goto(Organisms.rsvB);
        await singleVariantPage.selectDateRange('All times');
        await singleVariantPage.selectVariant(options);
        await singleVariantPage.submitFilters();

        await singleVariantPage.page
            .getByRole('button', { name: /filter mutations/i })
            .first()
            .click();

        await expect(singleVariantPage.page.getByText('Nirsevimab')).toBeVisible();
        await expect(singleVariantPage.page.getByText('Palivizumab')).toBeVisible();
    });
});
