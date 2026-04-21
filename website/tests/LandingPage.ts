import { ViewPage } from './ViewPage.ts';
import { type Organism, organismConfig, paths } from '../src/types/Organism.ts';

export class LandingPage extends ViewPage {
    public readonly genomeViewerHeading = this.page.getByRole('heading', { name: 'Genome Data Viewer' });

    public async goto(organism: Organism) {
        await this.page.goto(paths[organism].basePath);
    }

    public organismHeading(organism: Organism) {
        return this.page.getByRole('heading', { name: organismConfig[organism].label, level: 1 });
    }
}
