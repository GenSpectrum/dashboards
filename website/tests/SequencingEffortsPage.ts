import { ViewPage } from './ViewPage.ts';
import { type Organism, organismConfig } from '../src/types/Organism.ts';

export class SequencingEffortsPage extends ViewPage {
    public async goto(organism: Organism) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/sequencing-efforts`);
    }

    public async selectLocation(location: string) {
        const locationField = this.page.getByPlaceholder('Sampling location');
        await locationField.fill(location);
        await this.page
            .getByRole('option', { name: new RegExp(`^${location}`, 'i'), exact: true })
            .first()
            .click();
    }
}
