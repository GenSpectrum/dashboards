import { test as base } from '@playwright/test';

import { RHYDB_FIXTURE_PATH } from './rhydbFixture.mjs';

export { expect } from '@playwright/test';

export const test = base.extend({
    page: async ({ page }, runTest) => {
        await page.route(
            (url) => url.pathname === `${RHYDB_FIXTURE_PATH}/query`,
            (route) =>
                route.fulfill({
                    contentType: 'application/x-ndjson',
                    headers: Object.fromEntries([['data-version', String(Date.parse('2026-11-11T14:21:00Z') / 1000)]]),
                    body: '',
                }),
        );
        await runTest(page);
    },
});
