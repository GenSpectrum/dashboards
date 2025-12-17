import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismOptions, organismsWithView } from './helpers.ts';
import { compareSideBySideViewKey } from '../src/views/viewKeys';

test.describe('The Compare Side-By-Side page', () => {
    for (const organism of organismsWithView(compareSideBySideViewKey)) {
        test(`should show diagrams after selecting a variant in both columns - ${organism}`, async ({
            compareSideBySidePage,
        }) => {
            const options = organismOptions[organism];

            await compareSideBySidePage.goto(organism);
            await expect(compareSideBySidePage.removeColumnButton).not.toBeVisible();
            await expect(compareSideBySidePage.addColumnButton).toBeVisible();

            await expect(compareSideBySidePage.diagramTitle('Prevalence Over Time')).not.toBeVisible();

            await compareSideBySidePage.addColumn({
                dateRangeOption: 'All times',
                expectedColumnCount: 1,
                ...options,
            });
            await expect(compareSideBySidePage.removeColumnButton).not.toBeVisible();

            await compareSideBySidePage.addColumn({
                dateRangeOption: 'All times',
                expectedColumnCount: 2,
                ...options,
            });
            await expect(compareSideBySidePage.removeColumnButton).toHaveCount(2);

            await expect(compareSideBySidePage.diagramTitle('Prevalence Over Time')).toHaveCount(2);
            await compareSideBySidePage.expectToSeeNoComponentErrors();
        });
    }
});
