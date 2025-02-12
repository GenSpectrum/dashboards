import { expect, type Page } from '@playwright/test';

import { type Organism } from '../src/types/Organism.ts';

export abstract class ViewPage {
    constructor(public readonly page: Page) {}

    public abstract goto(organism: Organism): Promise<void>;

    public async submitFilters() {
        await this.page.getByRole('button', { name: 'Apply filters' }).click();
    }

    public diagramTitle(title: string) {
        return this.page.getByRole('link', { name: title });
    }

    public async expectToSeeNoComponentErrors() {
        await expect(this.page.getByText('Error -', { exact: false })).not.toBeVisible();
        await expect(this.page.getByText('Something went wrong', { exact: false })).not.toBeVisible();
    }

    public async selectDateRange(dateRangeOption: string) {
        await this.page.locator('gs-date-range-filter').getByRole('combobox').selectOption(dateRangeOption);
    }
}
