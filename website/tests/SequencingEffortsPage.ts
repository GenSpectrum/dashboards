import { expect } from '@playwright/test';

import { ViewPage } from './ViewPage.ts';
import { type Organism, paths } from '../src/types/Organism.ts';

export class SequencingEffortsPage extends ViewPage {
    public locationField = this.page.getByPlaceholder('Sampling location');

    public async goto(organism: Organism) {
        await this.page.goto(`${paths[organism].basePath}/sequencing-efforts`);
    }

    public async selectLocation(location: string) {
        const matchingOption = this.page
            .getByRole('option', { name: new RegExp(`^${location}`, 'i'), exact: true })
            .first();

        await expect(async () => {
            await this.locationField.click();
            await expect(matchingOption).toBeVisible();
        }).toPass();

        await this.locationField.fill(location);
        await matchingOption.click();
    }
}
