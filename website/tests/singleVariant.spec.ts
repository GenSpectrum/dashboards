import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismOptions, organismsWithView } from './helpers/organisms.ts';
import { singleVariantViewKey } from '../src/views/viewKeys';

test.describe('The Single Variant page', () => {
    for (const organism of organismsWithView(singleVariantViewKey)) {
        test(`should show diagrams after selecting a variant - ${organism}`, async ({ singleVariantPage }) => {
            const options = organismOptions[organism];

            await singleVariantPage.goto(organism);
            await singleVariantPage.expectToSeeNoComponentErrors();

            await singleVariantPage.selectDateRange('All times');
            await singleVariantPage.selectVariant(options);
            await singleVariantPage.submitFilters();

            await expect(singleVariantPage.diagramTitle('Prevalence over time')).toBeVisible();
            await singleVariantPage.expectToSeeNoComponentErrors();
        });
    }
});
