import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';

test.describe('Resistance mutation annotations on regular dashboards', () => {
    test.setTimeout(60_000);

    test('COVID single-variant page shows resistance mutation sets in the filter mutations panel', async ({ page }) => {
        await page.goto('/covid/single-variant');

        await page.getByRole('button', { name: /filter mutations/i }).click();

        await expect(page.getByText('3CLpro')).toBeVisible();
        await expect(page.getByText('RdRp')).toBeVisible();
        await expect(page.getByText('Spike')).toBeVisible();
    });

    test('RSV-A single-variant page shows resistance mutation sets in the filter mutations panel', async ({ page }) => {
        await page.goto('/rsv-a/single-variant');

        await page.getByRole('button', { name: /filter mutations/i }).click();

        await expect(page.getByText('Nirsevimab')).toBeVisible();
        await expect(page.getByText('Palivizumab')).toBeVisible();
    });

    test('RSV-B single-variant page shows resistance mutation sets in the filter mutations panel', async ({ page }) => {
        await page.goto('/rsv-b/single-variant');

        await page.getByRole('button', { name: /filter mutations/i }).click();

        await expect(page.getByText('Nirsevimab')).toBeVisible();
        await expect(page.getByText('Palivizumab')).toBeVisible();
    });
});
