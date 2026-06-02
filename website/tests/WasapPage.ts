import { expect, type Page } from '@playwright/test';

import type { WastewaterOrganismName } from '../src/types/wastewaterConfig.ts';

const wastewaterOrganismPaths: Record<WastewaterOrganismName, string> = {
    covid: '/swiss-wastewater/covid',
    'rsv-a': '/swiss-wastewater/rsv-a',
    'rsv-b': '/swiss-wastewater/rsv-b',
};

export class WasapPage {
    constructor(public readonly page: Page) {}

    public async goto(organism: WastewaterOrganismName) {
        await this.page.goto(wastewaterOrganismPaths[organism]);
    }

    public async submitFilters() {
        await this.page.getByRole('button', { name: 'Apply filters' }).click();
    }

    public get mutationsOverTimeHeading() {
        return this.page.getByRole('heading', { name: 'mutations over time' });
    }

    public get filterDatasetHeading() {
        return this.page.getByRole('heading', { name: 'Filter dataset' });
    }

    public get mutationSelectionHeading() {
        return this.page.getByRole('heading', { name: 'Mutation selection' });
    }

    public get analysisModeSelect() {
        return this.page.locator('select').filter({ has: this.page.locator('option', { hasText: 'Manual' }) });
    }

    public async selectAnalysisMode(mode: string) {
        await this.analysisModeSelect.selectOption({ label: mode });
    }

    public async expectToSeeNoErrors() {
        await expect(this.page.getByText('Error -', { exact: false })).not.toBeVisible();
        await expect(this.page.getByText('Something went wrong', { exact: false })).not.toBeVisible();
    }
}
