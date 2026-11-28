import type { Locator, Page } from '@playwright/test';

import { expect, MATRIX_PATH, REPORTS, REPORTS_PATH, test } from './pathoplexusExplorerFixture.ts';

const LOCATION_REPORT = REPORTS[0];

function explorerMenu(page: Page): Locator {
    return page.locator('details:visible').filter({ hasText: 'Pathoplexus Explorer' });
}

test.describe('the Pathoplexus Explorer menu', () => {
    test.describe('with a pointer', () => {
        test('lists the reports, every kind of report and the matrix', async ({ page }) => {
            await page.goto('/');

            const menu = explorerMenu(page);
            await menu.locator('summary').click();

            await expect(menu.getByRole('link', { name: 'Reports', exact: true })).toHaveAttribute(
                'href',
                REPORTS_PATH,
            );
            for (const { label, path } of REPORTS) {
                await expect(menu.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', path);
            }
            await expect(menu.getByRole('link', { name: 'Matrix', exact: true })).toHaveAttribute('href', MATRIX_PATH);
        });

        test('opens a report', async ({ page }) => {
            await page.goto('/');

            const menu = explorerMenu(page);
            await menu.locator('summary').click();
            await menu.getByRole('link', { name: LOCATION_REPORT.label, exact: true }).click();

            await expect(page).toHaveURL(LOCATION_REPORT.path);
        });
    });

    test.describe('on a touch screen', () => {
        test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

        test('opens a report through the hamburger', async ({ page }) => {
            await page.goto('/');

            await page.locator('label[for="menu__toggle"]').tap();
            const menu = explorerMenu(page);
            await menu.locator('summary').tap();
            await menu.getByRole('link', { name: LOCATION_REPORT.label, exact: true }).tap();

            await expect(page).toHaveURL(LOCATION_REPORT.path);
        });
    });

    test.describe('on a tablet', () => {
        test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

        test('opens a report by tapping the bar', async ({ page }) => {
            await page.goto('/');

            const menu = explorerMenu(page);
            await menu.locator('summary').tap();
            await menu.getByRole('link', { name: LOCATION_REPORT.label, exact: true }).tap();

            await expect(page).toHaveURL(LOCATION_REPORT.path);
        });
    });
});
