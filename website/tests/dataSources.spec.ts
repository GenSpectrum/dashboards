import { test, expect } from '@playwright/test';

test.describe('Data Sources page', () => {
    test('shows heading', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Data sources' }).click();

        await expect(page).toHaveTitle('Data Sources');
        await expect(page.getByRole('heading', { name: 'Data sources and preprocessing' })).toBeVisible();
    });
});
