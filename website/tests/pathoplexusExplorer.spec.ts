import { expect, test } from './pathoplexusExplorerFixture.ts';

const REPORTS_PATH = '/pathoplexus-explorer/reports';
const REPORTS: [label: string, path: string][] = [
    ['Location report', `${REPORTS_PATH}/location`],
    ['Virus report', `${REPORTS_PATH}/virus`],
    ['Lineage report', `${REPORTS_PATH}/lineage`],
    ['Mutation report', `${REPORTS_PATH}/mutations`],
];

test.describe('Pathoplexus Explorer', () => {
    test('the main page offers the reports', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'Pathoplexus Explorer' })).toBeVisible();
        await expect(page.getByText('Last updated: 11 November 2026, 14:21 UTC')).toBeVisible();

        await page.getByRole('link', { name: 'Reports' }).click();

        await expect(page).toHaveURL(REPORTS_PATH);
        await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
    });

    for (const [label, path] of REPORTS) {
        test(`the chooser opens the ${label.toLowerCase()}`, async ({ page }) => {
            await page.goto(REPORTS_PATH);

            await page.getByRole('link', { name: label }).click();

            await expect(page).toHaveURL(path);
            // Match the suffix because the subject may be added after the report loads.
            await expect(page).toHaveTitle(new RegExp(`(^|\\| )${label} \\| GenSpectrum$`));
        });
    }

    test('a report that is not configured yet says what it still needs', async ({ page }) => {
        await page.goto(`${REPORTS_PATH}/lineage`);

        await expect(page.getByRole('heading', { name: 'Lineage report', level: 1 })).toBeVisible();
        await expect(page.getByText('Choose a pathogen in the bar above.')).toBeVisible();
    });

    test('a location report without a place is about the world', async ({ page }) => {
        await page.goto(`${REPORTS_PATH}/location`);

        await expect(page.getByRole('heading', { name: 'Pathogen sequencing worldwide' })).toBeVisible();
    });
});
