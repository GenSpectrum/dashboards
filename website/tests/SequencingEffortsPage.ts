import { ViewPage } from './ViewPage.ts';
import { type Organism, organismConfig } from '../src/types/Organism.ts';

export class SequencingEffortsPage extends ViewPage {
    public async goto(organism: Organism) {
        await this.page.goto(`/${organismConfig[organism].pathFragment}/sequencing-efforts`);
    }

    public async selectLocation(placeholder: string, location: string) {
        const locationField = this.page.getByPlaceholder(placeholder);
        await locationField.fill(location);
    }

    public async selectDateRange(dateRangeOption: string) {
        await this.page.locator('gs-date-range-selector').getByRole('combobox').selectOption(dateRangeOption);
    }
}
