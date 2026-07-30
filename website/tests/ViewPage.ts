import { expect, type Locator, type Page } from '@playwright/test';

import { type Organism } from '../src/types/Organism.ts';

export async function expectToSeeNoComponentErrors(page: Page) {
    await expect(page.getByText('Error -', { exact: false })).not.toBeVisible();
    await expect(page.getByText('Something went wrong', { exact: false })).not.toBeVisible();
}

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
        await expectToSeeNoComponentErrors(this.page);
    }

    public async selectDateRange(dateRangeOption: string) {
        await this.page.locator('gs-date-range-filter').getByRole('combobox').first().selectOption(dateRangeOption);
    }

    public async fillLineageField(locator: Locator, lineage: string) {
        await locator.fill(lineage);

        const option = this.page.getByRole('listbox').getByRole('option', { name: lineage, exact: false }).first();

        // Filling the field opens the autocomplete menu, but each filter field fetches its options
        // from LAPIS independently and a re-render triggered by another field settling can close the
        // menu again. When that happens the option never appears and a plain click would wait out the
        // whole test timeout. Retry "ensure the menu is open, then click the option" together so a
        // transient close cannot wedge the test.
        await expect(async () => {
            if (!(await option.isVisible())) {
                await locator.click(); // re-open the menu
            }
            await option.click({ timeout: 2_000 });
        }).toPass();
    }

    public async fillMutationField(locator: Locator, mutation: string) {
        await locator.first().fill(mutation);
        await locator.first().press('Enter');
    }
}
