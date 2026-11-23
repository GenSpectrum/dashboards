import { expect, test } from './pathoplexusExplorerFixture.ts';

const MATRIX_LABEL = 'Matrix';
const MATRIX_PATH = '/pathoplexus-explorer/matrix';

test.describe('the Pathoplexus Explorer matrix', () => {
    test('is offered on the main page', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('link', { name: MATRIX_LABEL }).click();

        await expect(page).toHaveURL(MATRIX_PATH);
        await expect(page).toHaveTitle(`${MATRIX_LABEL} | GenSpectrum`);
    });

    test('lays the sequences out along two dimensions, and says what a cell counts', async ({ page }) => {
        await page.goto(MATRIX_PATH);

        await expect(page.getByRole('button', { name: 'Rows Country' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Columns Pathogen' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sequences', exact: true })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
    });

    test('keeps what a cell shows in the address, so a matrix can be shared', async ({ page }) => {
        await page.goto(MATRIX_PATH);

        await page.getByRole('button', { name: '% of row' }).click();

        await expect(page).toHaveURL(`${MATRIX_PATH}?cell=row`);
    });

    test('swaps the rows and the columns', async ({ page }) => {
        await page.goto(MATRIX_PATH);

        await page.getByRole('button', { name: 'Swap' }).click();

        await expect(page).toHaveURL(`${MATRIX_PATH}?rows=pathogen&cols=country`);
    });

    test('shows as many rows as the reader asks for, within what the page draws', async ({ page }) => {
        await page.goto(MATRIX_PATH);

        await page.getByLabel('Max rows').fill('40');
        await page.getByLabel('Max columns').press('Tab');

        await expect(page).toHaveURL(`${MATRIX_PATH}?maxRows=40`);

        await page.getByLabel('Max columns').fill('900');
        await page.getByLabel('Max columns').press('Enter');

        await expect(page).toHaveURL(`${MATRIX_PATH}?maxRows=40&maxCols=200`);
    });

    test('offers the accession list, and asks for nothing until it is wanted', async ({ page }) => {
        const asked: string[] = [];
        await page.route('**/query', (route) => {
            asked.push(route.request().postData() ?? '');
            return route.abort();
        });
        await page.goto(MATRIX_PATH);

        await expect(page.getByRole('button', { name: 'Download accession list' })).toBeDisabled();
        await expect.poll(() => asked.length).toBeGreaterThan(0);
        // Only the download action should request the accession list.
        expect(asked.filter((query) => query.includes('accessionVersion'))).toEqual([]);
    });

    test('offers the table as a file, and has nothing to write before the table is counted', async ({ page }) => {
        await page.route('**/query', (route) => route.abort());
        await page.goto(MATRIX_PATH);

        await expect(page.getByRole('button', { name: 'Download table' })).toBeDisabled();
    });

    test('is reached from the header menu', async ({ page }) => {
        await page.goto('/');

        const menu = page.locator('details:visible').filter({ hasText: 'Pathoplexus Explorer' });
        await menu.locator('summary').click();

        await expect(menu.getByRole('link', { name: MATRIX_LABEL, exact: true })).toHaveAttribute('href', MATRIX_PATH);
    });
});
