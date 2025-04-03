import { expect, type Page } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { organismConfig } from '../src/types/Organism.ts';
import { type OrganismWithViewKey } from '../src/views/routing';
import { compareVariantsViewKey } from '../src/views/viewKeys';

type OrganismViewCompareVariant = OrganismWithViewKey<typeof compareVariantsViewKey>;

export class CompareVariantsPage extends ViewPage {
    public readonly selectVariantsMessage;
    public readonly mutationField;

    constructor(page: Page) {
        super(page);
        this.selectVariantsMessage = this.page.getByText('please select two or more variants', { exact: false });
        this.mutationField = this.page.getByRole('combobox', { name: 'Enter a mutation', exact: false });
    }

    public async goto(organism: OrganismViewCompareVariant) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/compare-variants`);
    }

    public async addVariant(options: { lineage?: string; lineageFieldPlaceholder?: string; mutation?: string }) {
        const numberMutationFields = await this.mutationField.count();

        await this.page.getByRole('button', { name: '+ Add variant' }).click();
        await expect(this.mutationField).toHaveCount(numberMutationFields + 1);

        if (options.lineage && options.lineageFieldPlaceholder) {
            const { lineage, lineageFieldPlaceholder } = options;

            const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
            await expect(lineageFieldLocator).toHaveCount(numberMutationFields + 1);

            await lineageFieldLocator.last().fill(lineage);

            const selectedLineage = this.page.getByRole('option', { name: lineage, exact: false });
            await selectedLineage.first().click();
        }

        if (options.mutation) {
            await this.mutationField.last().fill(options.mutation);
            await this.mutationField.last().press('Enter');
        }
    }
}
