import { expect, test } from '@playwright/test';

import { allOrganisms, organismConfig } from '../src/types/Organism.ts';
import { nonBreakingHyphen } from '../src/views/ViewConstants.ts';
import { ServerSide } from '../src/views/serverSideRouting.ts';
import {
    compareSideBySideViewKey,
    compareToBaselineViewKey,
    compareVariantsViewKey,
    sequencingEffortsViewKey,
    singleVariantViewKey,
} from '../src/views/viewKeys.ts';

const views = [
    {
        viewKey: singleVariantViewKey,
        linkName: 'Analyze a single variant',
        title: 'Single variant',
        expectedHeadline: 'Analyze a single variant',
    },
    {
        viewKey: compareSideBySideViewKey,
        linkName: `Compare variants side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
        title: `Compare side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
        expectedHeadline: 'Prevalence over time',
    },
    {
        viewKey: sequencingEffortsViewKey,
        linkName: 'Sequencing efforts',
        title: 'Sequencing efforts',
        expectedHeadline: 'Number sequences',
    },
    {
        viewKey: compareVariantsViewKey,
        linkName: 'Compare variants',
        title: 'Compare variants',
        expectedHeadline: 'Compare Variants',
    },
    {
        viewKey: compareToBaselineViewKey,
        linkName: 'Compare to baseline',
        title: 'Compare to baseline',
        expectedHeadline: 'Analyze a variant compared to a baseline',
    },
];

test.describe('Main page', () => {
    test('shows heading', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle('GenSpectrum Dashboards');
        await expect(page.getByRole('heading', { name: 'GenSpectrum' }).locator('div')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Inspect pathogen genomic data' })).toBeVisible();
    });

    allOrganisms.forEach((organism) => {
        views.forEach((view) => {
            const { viewKey, linkName, title, expectedHeadline } = view;
            test(`should navigate to views ${title} for ${organism}`, async ({ page }) => {
                if (!ServerSide.routing.isOrganismWithViewKey(organism, viewKey)) {
                    test.skip();
                    return;
                }

                const organismName = organismConfig[organism].label;

                await page.goto('/');
                await page
                    .getByRole('heading', { name: organismName })
                    .locator('..')
                    .getByText(linkName, { exact: true })
                    .click();
                // wait for the page to load
                await page.waitForSelector('[aria-label="Loading"]', { state: 'detached' });
                await page.waitForSelector('text="Loading data"', { state: 'hidden' });
                await page.waitForTimeout(10);

                await expect(page.locator('text=Error -')).not.toBeVisible();
                await expect(page.locator('text=Something went wrong')).not.toBeVisible();
                await expect(page).toHaveTitle(`${title} | ${organismName} | GenSpectrum`);
                await expect(page.getByRole('heading', { name: expectedHeadline }).first()).toBeVisible();
            });
        });
    });
});
