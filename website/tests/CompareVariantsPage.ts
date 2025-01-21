import { expect, type Page } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { organismConfig } from '../src/types/Organism.ts';
import { type OrganismWithViewKey } from '../src/views/routing';
import { compareVariantsViewKey } from '../src/views/viewKeys';

type OrganismViewCompareVariant = OrganismWithViewKey<typeof compareVariantsViewKey>;

export class CompareVariantsPage extends ViewPage {
    public readonly selectVariantsMessage;

    constructor(page: Page) {
        super(page);
        this.selectVariantsMessage = this.page.getByText('please select two or more variants', { exact: false });
    }

    public async goto(organism: OrganismViewCompareVariant) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/compare-variants`);
    }

    public async addVariant(lineageFieldPlaceholder: string, lineage: string) {
        const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
        const numberLineageFields = await lineageFieldLocator.count();

        await this.page.getByRole('button', { name: '+ Add variant' }).click();
        await expect(lineageFieldLocator).toHaveCount(numberLineageFields + 1);

        await lineageFieldLocator.last().fill(lineage);

        const selectedLineage = this.page.getByText(lineage, { exact: true });
        if ((await selectedLineage.count()) > 0) {
            await selectedLineage.first().click();
        }
    }
}
