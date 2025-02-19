import { dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { type ExtendedConstants, getPathoplexusAdditionalSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1975-01-01';

class EbolaZaireConstants implements ExtendedConstants {
    public readonly organism = Organisms.ebolaZaire;
    public readonly earliestDate = earliestDate;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        {
            type: 'date',
            dateRangeOptions: [
                dateRangeOptionPresets.last6Months,
                dateRangeOptionPresets.lastYear,
                { label: 'Since 2020', dateFrom: '2020-01-01' },
                { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
                { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
                { label: 'Since 2000', dateFrom: '2000-01-01' },
                { label: 'Before 2000', dateTo: '1999-12-31' },
                dateRangeOptionPresets.allTimes,
            ],
            earliestDate,
            defaultDateRange: dateRangeOptionPresets.allTimes,
            dateColumn: 'sampleCollectionDateRangeLower',
            label: 'Sample collection date',
        },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            mutations: {
                aminoAcidMutations: ['VP35:A12V'],
            },
        },
        {
            mutations: {
                aminoAcidMutations: ['VP35:A12V'],
            },
        },
        {
            mutations: {
                nucleotideMutations: ['G11739A'],
            },
        },
    ];

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.ebolaZaire.lapis.mainDateField;
        this.locationFields = organismsConfig.ebolaZaire.lapis.locationFields;
        this.hostField = organismsConfig.ebolaZaire.lapis.hostField;
        this.authorsField = organismsConfig.ebolaZaire.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.ebolaZaire.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.ebolaZaire.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.ebolaZaire.lapis.accessionDownloadFields;
    }
}

export class EbolaZaireAnalyzeSingleVariantView extends GenericSingleVariantView<EbolaZaireConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaZaireConstants(organismsConfig));
    }
}

export class EbolaZaireCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    EbolaZaireConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new EbolaZaireConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, DatasetAndVariantData>([
                [
                    0,
                    {
                        datasetFilter: {
                            location: {},
                            dateFilters: {},
                            textFilters: {},
                        },
                        variantFilter: {
                            mutations: {},
                        },
                    },
                ],
                [
                    1,
                    {
                        datasetFilter: {
                            location: {},
                            dateFilters: {},
                            textFilters: {},
                        },
                        variantFilter: {
                            mutations: {},
                        },
                    },
                ],
            ]),
        };

        super(
            constants,
            new CompareSideBySideStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareSideBySideViewConstants,
        );
    }
}

export class EbolaZaireSequencingEffortsView extends GenericSequencingEffortsView<EbolaZaireConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaZaireConstants(organismsConfig));
    }
}

export class EbolaZaireCompareVariantsView extends GenericCompareVariantsView<EbolaZaireConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaZaireConstants(organismsConfig));
    }
}

export class EbolaZaireCompareToBaselineView extends GenericCompareToBaselineView<EbolaZaireConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaZaireConstants(organismsConfig));
    }
}
