import { versionHeaders, expect, REPORTS, REPORTS_PATH, test } from './pathoplexusExplorerFixture.ts';

test.describe('Pathoplexus Explorer', () => {
    test('the main page offers the reports', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'Pathoplexus Explorer' })).toBeVisible();
        await expect(page.getByText('Last updated: 11 November 2026, 14:21 UTC')).toBeVisible();

        await page.getByRole('link', { name: 'Reports' }).click();

        await expect(page).toHaveURL(REPORTS_PATH);
        await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
    });

    test('the chooser opens every kind of report', async ({ page }) => {
        for (const { label, path } of REPORTS) {
            await page.goto(REPORTS_PATH);

            await page.getByRole('link', { name: label }).click();

            await expect(page).toHaveURL(path);
            // The subject may be added to the start of the title once the report has loaded.
            await expect(page).toHaveTitle(new RegExp(`(^|\\| )${label} \\| GenSpectrum$`));
        }
    });

    test('a report that is not configured yet says what it still needs', async ({ page }) => {
        await page.goto(`${REPORTS_PATH}/lineage`);

        await expect(page.getByRole('heading', { name: 'Lineage report', level: 1 })).toBeVisible();
        await expect(page.getByText('Choose a pathogen in the bar above.')).toBeVisible();
    });

    test('a malformed geographic or date filter never opens a broader report', async ({ page }) => {
        for (const query of [
            'where=continent:Atlantis',
            'where=country:Korea',
            'where=admin1:Portugal/imported%20from%20Brazil',
            'when=2024-02-31/..',
            'what=pathogen:mpox',
            'where=country:Brazil&where=country:USA',
        ]) {
            const response = await page.goto(`${REPORTS_PATH}/location?${query}`);
            expect(response?.status()).toBe(404);
            await expect(page.getByText('Pathogen sequencing worldwide')).toHaveCount(0);
        }
    });

    test('the geographic table reports its percentages while the headline count is loading', async ({ page }) => {
        let release!: () => void;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        await page.route('**/query', async (route) => {
            const query = route.request().postData() ?? '';
            if (query.includes('group(by := {groupId, groupName}')) {
                await pending;
            }
            if (query.endsWith('.group(by := {geoLocCountry}, aggs := {n := sum(n)})')) {
                await route.fulfill({
                    headers: versionHeaders,
                    contentType: 'application/x-ndjson',
                    body: '{"geoLocCountry":"Brazil","n":3}\n{"geoLocCountry":null,"n":1}\n',
                });
            } else {
                await route.fallback();
            }
        });
        try {
            await page.goto(`${REPORTS_PATH}/location`);
            await expect(page.getByText('1 sequence is not in the table (25%).')).toBeVisible();
            await expect(page.getByText('Counting the sequences…')).toBeVisible();
            const pathogens = page
                .locator('section')
                .filter({ has: page.getByRole('heading', { name: /2.*Pathogens/i }) });
            await expect(pathogens.getByRole('status', { name: 'Loading' })).toBeVisible();
            await expect(pathogens.getByRole('table')).toHaveCount(0);
        } finally {
            release();
        }
    });

    test('a location report without a place is about the world', async ({ page }) => {
        await page.goto(`${REPORTS_PATH}/location`);

        await expect(page.getByRole('heading', { name: 'Pathogen sequencing worldwide' })).toBeVisible();
    });
});
