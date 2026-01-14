import { type Page } from '@playwright/test';

import { CompareVariantsPage } from './CompareVariantsPage.ts';
import { paths } from '../src/types/Organism.ts';
import { type OrganismWithViewKey } from '../src/views/routing';
import { compareToBaselineViewKey } from '../src/views/viewKeys';

export class CompareToBaselinePage extends CompareVariantsPage {
    public readonly selectVariantsMessage;
    public readonly mutationField;

    constructor(page: Page) {
        super(page);
        this.selectVariantsMessage = this.page.getByText('Analyze a variant compared to a baseline', { exact: false });
        this.mutationField = this.page.getByRole('combobox', { name: 'Enter a mutation', exact: false });
    }

    public async goto(organism: OrganismWithViewKey<typeof compareToBaselineViewKey>) {
        await this.page.goto(`${paths[organism].basePath}/compare-to-baseline`);
    }

    public async selectBaseline(options: { lineage?: string; lineageFieldPlaceholder?: string; mutation?: string }) {
        if (options.lineage && options.lineageFieldPlaceholder) {
            const { lineage, lineageFieldPlaceholder } = options;

            const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
            await this.fillLineageField(lineageFieldLocator.first(), lineage);
        }

        if (options.mutation) {
            await this.fillMutationField(this.mutationField.first(), options.mutation);
        }
    }
}
