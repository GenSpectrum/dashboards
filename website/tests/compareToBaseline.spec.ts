import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismOptions, organismsWithView } from './helpers.ts';
import { compareVariantsViewKey } from '../src/views/viewKeys';

test.describe('The Compare To Baseline page', () => {
    for (const organism of organismsWithView(compareVariantsViewKey)) {
        test(`should show diagrams after selecting two variants and a baseline - ${organism}`, async ({
            compareToBaselinePage,
        }) => {
            const options = organismOptions[organism];

            await compareToBaselinePage.goto(organism);
            await expect(compareToBaselinePage.selectVariantsMessage).toBeVisible();
            await expect(compareToBaselinePage.diagramTitle('Prevalence Over Time')).not.toBeVisible();

            await compareToBaselinePage.selectDateRange('All times');
            await compareToBaselinePage.selectBaseline(options);
            await compareToBaselinePage.addVariant(options);
            await compareToBaselinePage.submitFilters();

            await expect(compareToBaselinePage.diagramTitle('Prevalence Over Time')).toBeVisible();
            await compareToBaselinePage.expectToSeeNoComponentErrors();
        });
    }
});
