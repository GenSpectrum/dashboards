import { expect, test } from '@playwright/test';

import { nonBreakingHyphen } from '../src/views/ViewConstants.ts';

const organisms = ['SARS-CoV-2', 'Influenza A/H5N1', 'West Nile', 'RSV-A', 'RSV-B', 'Mpox'];
const views = [
    {
        linkName: 'Analyze a single variant',
        title: 'Single variant',
        expectedHeadline: 'Analyze a single variant',
    },
    {
        linkName: `Compare variants side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
        title: `Compare side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
        expectedHeadline: 'Prevalence over time',
    },
    { linkName: 'Sequencing efforts', title: 'Sequencing efforts', expectedHeadline: 'Number sequences' },
    { linkName: 'Compare variants', title: 'Compare variants', expectedHeadline: 'Compare Variants' },
    {
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

    test(`should have a main organism navigation that links to the organism views`, async ({ page }) => {
        for (const organism of organisms) {
            for (const { linkName, title, expectedHeadline } of views) {
                await page.goto('/');
                await page
                    .getByRole('heading', { name: organism })
                    .locator('..')
                    .getByText(linkName, { exact: true })
                    .click();
                await expect(page.locator('text=Error -')).not.toBeVisible();
                await expect(page.locator('text=Something went wrong')).not.toBeVisible();
                await expect(page).toHaveTitle(`${title} | ${organism} | GenSpectrum`);
                await expect(page.getByRole('heading', { name: expectedHeadline }).first()).toBeVisible();
            }
        }
    });
});
