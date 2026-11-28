import { expect, MATRIX_PATH, test, versionHeaders } from './pathoplexusExplorerFixture.ts';

const MATRIX_LABEL = 'Matrix';

test.describe('the Pathoplexus Explorer matrix', () => {
    test('rejects a shared address with a filter it cannot apply', async ({ page }) => {
        for (const sel of ['year=invalid', 'country=Brazil;invalid', 'country=Brazil;country=USA', 'level:lineage=A']) {
            const response = await page.goto(`/pathoplexus-explorer/matrix?sel=${encodeURIComponent(sel)}`);
            expect(response?.status()).toBe(404);
            await expect(page.getByRole('button', { name: 'Download table' })).toHaveCount(0);
        }
    });

    test('rejects an interval whose end precedes its start', async ({ page }) => {
        const response = await page.goto(`${MATRIX_PATH}?when=2024-12-31/2024-01-01`);
        expect(response?.status()).toBe(404);
    });

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

    test('asks for no accession list until one is wanted', async ({ page }) => {
        const asked: string[] = [];
        await page.route('**/query', (route) => {
            asked.push(route.request().postData() ?? '');
            return route.abort();
        });
        await page.goto(MATRIX_PATH);

        await expect(page.getByRole('button', { name: 'Download accession list' })).toBeDisabled();
        await expect.poll(() => asked.length).toBeGreaterThan(0);
        expect(asked.filter((query) => query.includes('accessionVersion'))).toEqual([]);
    });

    test('a response missing a lookup column leaves the Matrix visible with its error state', async ({ page }) => {
        await page.route('**/query', (route) =>
            route.fulfill({
                contentType: 'application/x-ndjson',
                headers: versionHeaders,
                body: route.request().postData()?.includes('geoLocCountry') ? '{"n":1}' : '',
            }),
        );
        await page.goto(MATRIX_PATH);
        await expect(page.getByText('Could not load', { exact: true })).toHaveCount(2);
        await expect(page.getByRole('button', { name: 'Download table' })).toBeDisabled();
        await expect(page.getByRole('table')).toHaveCount(0);
    });

    test('a failed lookup leaves the table and timeline unavailable', async ({ page }) => {
        await page.route('**/query', (route) => route.abort());
        await page.goto(MATRIX_PATH);

        await expect(page.getByRole('button', { name: 'Download table' })).toBeDisabled();
        await expect(page.getByText('Could not load', { exact: true })).toHaveCount(2);
        await expect(page.getByRole('table')).toHaveCount(0);
        await expect(page.getByText('No sequence in the selection has a collection date.')).toHaveCount(0);
    });
});
