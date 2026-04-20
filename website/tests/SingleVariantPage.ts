import { type Page } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { paths } from '../src/types/Organism.ts';
import { type OrganismWithViewKey } from '../src/views/routing';
import { singleVariantViewKey } from '../src/views/viewKeys';

export class SingleVariantPage extends ViewPage {
    public readonly mutationField;

    constructor(page: Page) {
        super(page);
        this.mutationField = this.page.getByRole('combobox', { name: 'Enter a mutation', exact: false });
    }

    public async goto(organism: OrganismWithViewKey<typeof singleVariantViewKey>) {
        await this.page.goto(`${paths[organism].basePath}/single-variant`);
    }

    public async selectVariant(options: { lineage?: string; lineageFieldPlaceholder?: string; mutation?: string }) {
        if (options.lineage && options.lineageFieldPlaceholder) {
            const { lineage, lineageFieldPlaceholder } = options;
            const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
            await this.fillLineageField(lineageFieldLocator, lineage);
        }

        if (options.mutation) {
            await this.fillMutationField(this.mutationField, options.mutation);
        }
    }
}
