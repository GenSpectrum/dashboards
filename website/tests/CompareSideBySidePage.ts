import { expect } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { paths } from '../src/types/Organism.ts';
import { type OrganismWithViewKey } from '../src/views/routing';
import { compareSideBySideViewKey } from '../src/views/viewKeys';

export class CompareSideBySidePage extends ViewPage {
    public readonly removeColumnButton = this.page.getByRole('link', { name: 'Remove column' });
    public readonly addColumnButton = this.page.getByRole('link', { name: 'Add column' });
    public readonly mutationField = this.page.getByRole('combobox', { name: 'Enter a mutation', exact: false });

    public async goto(organism: OrganismWithViewKey<typeof compareSideBySideViewKey>) {
        await this.page.goto(`${paths[organism].basePath}/compare-side-by-side`);
    }

    public async addColumn(options: {
        dateRangeOption: string;
        expectedColumnCount: number;
        lineage?: string;
        lineageFieldPlaceholder?: string;
        mutation?: string;
    }) {
        await expect(this.addColumnButton).toBeVisible();

        await this.addColumnButton.click();
        await expect(this.mutationField).toHaveCount(options.expectedColumnCount);

        await this.page
            .locator('gs-date-range-filter')
            .getByRole('combobox')
            .last()
            .selectOption(options.dateRangeOption);

        if (options.lineage && options.lineageFieldPlaceholder) {
            const { lineage, lineageFieldPlaceholder } = options;

            const lineageFieldLocator = this.page.getByPlaceholder(lineageFieldPlaceholder);
            await expect(lineageFieldLocator).toHaveCount(options.expectedColumnCount);

            await this.fillLineageField(lineageFieldLocator.last(), lineage);
        }

        if (options.mutation) {
            await this.fillMutationField(this.mutationField.last(), options.mutation);
        }

        // Single apply button that applies to all columns
        await this.page.getByRole('button', { name: 'Apply filters' }).click();
    }
}
