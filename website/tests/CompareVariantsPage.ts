import { expect, type Page } from '@playwright/test';

import { type Organism, organismConfig } from '../src/types/Organism.ts';

export class CompareVariantsPage {
    public readonly selectVariantsMessage;

    constructor(public readonly page: Page) {
        this.selectVariantsMessage = this.page.getByText('please select two or more variants', { exact: false });
    }

    public async goto(organism: Organism) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/compare-variants`);
    }

    public async addVariant(lineageFieldPlaceholder: string, lineage: string) {
        const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
        const numberLineageFields = await lineageFieldLocator.count();

        await this.page.getByRole('button', { name: '+ Add variant' }).click();
        await expect(lineageFieldLocator).toHaveCount(numberLineageFields + 1);

        await lineageFieldLocator.last().fill(lineage);
    }

    public async submitFilters() {
        await this.page.getByRole('button', { name: 'Apply filters' }).click();
    }

    public diagramTitle(title: string) {
        return this.page.getByRole('heading', { name: title });
    }
}
