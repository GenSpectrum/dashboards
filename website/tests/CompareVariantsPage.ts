import { expect, type Page } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { type Organism, organismConfig } from '../src/types/Organism.ts';

export class CompareVariantsPage extends ViewPage {
    public readonly selectVariantsMessage;

    constructor(page: Page) {
        super(page);
        this.selectVariantsMessage = this.page.getByText('please select two or more variants', { exact: false });
    }

    public async goto(organism: Organism) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/compare-variants`);
    }

    public async addVariant(lineageFieldPlaceholder: string, lineage: string, startingNumber: number) {
        await expect(this.page.getByText('Variant Filters')).toBeVisible({ timeout: 5000 });
        const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
        await expect(lineageFieldLocator).toHaveCount(startingNumber, { timeout: 5000 });

        await this.page.getByRole('button', { name: '+ Add variant' }).click();
        await expect(this.page.getByText('Variant Filters')).toBeVisible({ timeout: 5000 });
        await expect(lineageFieldLocator).toHaveCount(startingNumber + 1, { timeout: 5000 });

        await lineageFieldLocator.last().fill(lineage);
    }
}
