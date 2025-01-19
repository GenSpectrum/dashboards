import { BaseView } from './BaseView.ts';
import type { OrganismConstants } from './OrganismConstants.ts';
import type { PageStateHandler } from './pageStateHandlers/PageStateHandler.ts';
import { Organisms } from '../types/Organism.ts';
import { dataOrigins } from '../types/dataOrigins.ts';

export class SwissWastewaterRSVView extends BaseView<object, OrganismConstants, PageStateHandler<object>> {
    constructor() {
        super(
            {
                organism: Organisms.swissWastewater,
                dataOrigins: [dataOrigins.wise],
                accessionDownloadFields: ['accessionVersion'],
            },
            {
                parsePageStateFromUrl: () => ({}),
                toUrl: () => '/swiss-wastewater/rsv',
                getDefaultPageUrl: () => '/swiss-wastewater/rsv',
            },
            {
                label: 'RSV',
                labelLong: 'RSV',
                pathFragment: 'rsv',
                iconType: 'table',
            },
        );
    }
}

export class SwissWastewaterInfluenzaView extends BaseView<object, OrganismConstants, PageStateHandler<object>> {
    constructor() {
        super(
            {
                organism: Organisms.swissWastewater,
                dataOrigins: [dataOrigins.wise],
                accessionDownloadFields: ['accessionVersion'],
            },
            {
                parsePageStateFromUrl: () => ({}),
                toUrl: () => '/swiss-wastewater/influenza',
                getDefaultPageUrl: () => '/swiss-wastewater/influenza',
            },
            {
                label: 'Influenza',
                labelLong: 'Influenza',
                pathFragment: 'influenza',
                iconType: 'table',
            },
        );
    }
}
