import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismOptions, organismsWithView } from './helpers.ts';
import { compareVariantsViewKey } from '../src/views/viewKeys';

test.describe('The Compare Variants page', () => {
    for (const organism of organismsWithView(compareVariantsViewKey)) {
        test(`should show diagrams after selecting two variants ${organism}`, async ({ compareVariantsPage }) => {
            const options = organismOptions[organism];

            await compareVariantsPage.goto(organism);
            await expect(compareVariantsPage.selectVariantsMessage).toBeVisible();
            await expect(compareVariantsPage.diagramTitle('Prevalence Over Time')).not.toBeVisible();

            await compareVariantsPage.selectDateRange('All times');
            await compareVariantsPage.addVariant(options);
            await compareVariantsPage.addVariant(options);
            await compareVariantsPage.submitFilters();

            await expect(compareVariantsPage.diagramTitle('Prevalence Over Time')).toBeVisible();
            await compareVariantsPage.expectToSeeNoComponentErrors();
        });
    }
});
