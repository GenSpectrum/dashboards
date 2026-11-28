import { test as base } from '@playwright/test';

import { RHYDB_FIXTURE_PATH } from './rhydbFixture.ts';

export { expect } from '@playwright/test';

export const versionHeaders = Object.fromEntries([['data-version', String(Date.parse('2026-11-11T14:21:00Z') / 1000)]]);
export const REPORTS_PATH = '/pathoplexus-explorer/reports';
export const MATRIX_PATH = '/pathoplexus-explorer/matrix';

/** Every kind of report, by the label that links to it and its path. */
export const REPORTS: readonly { label: string; path: string }[] = [
    { label: 'Location report', path: `${REPORTS_PATH}/location` },
    { label: 'Virus report', path: `${REPORTS_PATH}/virus` },
    { label: 'Lineage report', path: `${REPORTS_PATH}/lineage` },
    { label: 'Mutation report', path: `${REPORTS_PATH}/mutations` },
];

export const test = base.extend({
    page: async ({ page }, runTest) => {
        await page.route(
            (url) => url.pathname === `${RHYDB_FIXTURE_PATH}/query`,
            (route) =>
                route.fulfill({
                    contentType: 'application/x-ndjson',
                    headers: versionHeaders,
                    body: '',
                }),
        );
        await runTest(page);
    },
});
