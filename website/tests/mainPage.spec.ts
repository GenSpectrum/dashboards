import { test, expect } from '@playwright/test';

const organisms = ['SARS-CoV-2', 'Influenza A/H5N1', 'West Nile', 'RSV-A', 'RSV-B'];
const views = [
    {
        linkName: 'Analyze a single variant',
        title: 'Single variant',
        expectedHeadline: 'Analyze a single variant',
    },
    {
        linkName: 'Compare variants side-by-side',
        title: 'Compare side-by-side',
        expectedHeadline: 'Prevalence over time',
    },
    { linkName: 'Sequencing efforts', title: 'Sequencing efforts', expectedHeadline: 'Number sequences' },
    { linkName: 'Compare variants', title: 'Compare variants', expectedHeadline: 'Compare Variants' },
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
                await expect(page).toHaveTitle(`${title} | ${organism} | GenSpectrum`);
                await expect(page.getByRole('heading', { name: expectedHeadline }).first()).toBeVisible();
            }
        }
    });
});
