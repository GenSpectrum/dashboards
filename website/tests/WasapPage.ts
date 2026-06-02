import { type Page } from '@playwright/test';

import { expectToSeeNoComponentErrors } from './ViewPage.ts';
import { type WastewaterOrganismName, wastewaterOrganisms } from '../src/types/wastewaterConfig.ts';

const wastewaterOrganismPaths: Record<WastewaterOrganismName, string> = {
    [wastewaterOrganisms.covid]: '/swiss-wastewater/covid',
    [wastewaterOrganisms.rsvA]: '/swiss-wastewater/rsv-a',
    [wastewaterOrganisms.rsvB]: '/swiss-wastewater/rsv-b',
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

    public async selectGranularity(granularity: 'Day' | 'Week') {
        await this.page.getByText(granularity, { exact: true }).click();
    }

    public async expectToSeeNoComponentErrors() {
        await expectToSeeNoComponentErrors(this.page);
    }
}
