import { expect, test } from '@playwright/test';

import { allOrganisms, organismConfig, paths } from '../src/types/Organism.ts';

const organismsWithGenome = allOrganisms.filter((organism) => 'genome' in organismConfig[organism]);

test.describe('Organism landing pages', () => {
    for (const organism of organismsWithGenome) {
        test(`should render genome viewer for ${organism}`, async ({ page }) => {
            await page.goto(paths[organism].basePath);

            await expect(page.getByRole('heading', { name: organismConfig[organism].label, level: 1 })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Genome Data Viewer' })).toBeVisible();
            await expect(page.getByText('Error -', { exact: false })).not.toBeVisible();
            await expect(page.getByText('Something went wrong', { exact: false })).not.toBeVisible();
        });
    }
});
