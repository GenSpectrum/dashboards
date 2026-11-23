import type { Locator, Page } from '@playwright/test';

import { expect, test } from './pathoplexusExplorerFixture.ts';

const REPORTS_BASE_PATH = '/pathoplexus-explorer/reports';
const LOCATION_REPORT = { label: 'Location report', path: `${REPORTS_BASE_PATH}/location` };
const REPORTS: [label: string, path: string][] = [
    [LOCATION_REPORT.label, LOCATION_REPORT.path],
    ['Virus report', `${REPORTS_BASE_PATH}/virus`],
    ['Lineage report', `${REPORTS_BASE_PATH}/lineage`],
    ['Mutation report', `${REPORTS_BASE_PATH}/mutations`],
];

function openMenu(page: Page, label: string): Locator {
    return page.locator('details:visible').filter({ hasText: label });
}

test.describe('the Pathoplexus Explorer menu', () => {
    test.describe('with a pointer', () => {
        test('names the analysis and lists every report under it', async ({ page }) => {
            await page.goto('/');

            const menu = openMenu(page, 'Pathoplexus Explorer');
            await menu.locator('summary').click();

            await expect(menu.getByRole('link', { name: 'Reports', exact: true })).toHaveAttribute(
                'href',
                REPORTS_BASE_PATH,
            );
            for (const [label, path] of REPORTS) {
                await expect(menu.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', path);
            }
        });

        for (const [label, path] of REPORTS) {
            test(`opens the ${label.toLowerCase()}`, async ({ page }) => {
                await page.goto('/');

                const menu = openMenu(page, 'Pathoplexus Explorer');
                await menu.locator('summary').click();
                await menu.getByRole('link', { name: label, exact: true }).click();

                await expect(page).toHaveURL(path);
            });
        }
    });

    test.describe('on a touch screen', () => {
        test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

        test('opens a report through the hamburger', async ({ page }) => {
            await page.goto('/');

            await page.locator('label[for="menu__toggle"]').tap();
            const menu = openMenu(page, 'Pathoplexus Explorer');
            await menu.locator('summary').tap();
            await menu.getByRole('link', { name: LOCATION_REPORT.label, exact: true }).tap();

            await expect(page).toHaveURL(LOCATION_REPORT.path);
        });
    });

    test.describe('on a tablet', () => {
        test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

        test('opens the reports by tapping the bar', async ({ page }) => {
            await page.goto('/');

            const menu = openMenu(page, 'Pathoplexus Explorer');
            await menu.locator('summary').tap();
            await menu.getByRole('link', { name: LOCATION_REPORT.label, exact: true }).tap();

            await expect(page).toHaveURL(LOCATION_REPORT.path);
        });
    });
});
