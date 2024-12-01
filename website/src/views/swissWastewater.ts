import { BaseView } from './BaseView.ts';
import type { OrganismConstants } from './OrganismConstants.ts';
import type { PageStateHandler } from './PageStateHandler.ts';
import { Organisms } from '../types/Organism.ts';
import { dataOrigins } from '../types/dataOrigins.ts';

export class SwissWastewaterRandomView extends BaseView<object, OrganismConstants, PageStateHandler<object>> {
    constructor() {
        super(
            {
                organism: Organisms.swissWastewater,
                dataOrigins: [dataOrigins.wise],
            },
            {
                parsePageStateFromUrl: () => ({}),
                toUrl: () => '/swiss-wastewater/random',
                getDefaultPageUrl: () => '/swiss-wastewater/random',
            },
            {
                label: 'Random',
                labelLong: 'Random',
                pathFragment: 'random',
                iconType: 'magnify',
            },
        );
    }
}
