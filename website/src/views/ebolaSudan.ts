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
import { type OrganismConstants, getPathoplexusAdditionalSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { MutationAnnotation } from '../types/annotations.ts';

const earliestDate = '1975-01-01';

class EbolaSudanConstants implements OrganismConstants {
    public readonly organism = Organisms.ebolaSudan;
    public readonly earliestDate = '1975-01-01';
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
                aminoAcidMutations: ['NP:R711C'],
            },
        },
        {
            mutations: {
                aminoAcidMutations: ['VP35:N153S'],
            },
        },
        {
            mutations: {
                nucleotideMutations: ['T5640C'],
            },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.ebolaSudan.lapis.mainDateField;
        this.locationFields = organismsConfig.ebolaSudan.lapis.locationFields;
        this.hostField = organismsConfig.ebolaSudan.lapis.hostField;
        this.authorsField = organismsConfig.ebolaSudan.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.ebolaSudan.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.ebolaSudan.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.ebolaSudan.lapis.accessionDownloadFields;
    }
}

export class EbolaSudanAnalyzeSingleVariantView extends GenericSingleVariantView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig));
    }
}

export class EbolaSudanCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    EbolaSudanConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new EbolaSudanConstants(organismsConfig);
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

export class EbolaSudanSequencingEffortsView extends GenericSequencingEffortsView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig));
    }
}

export class EbolaSudanCompareVariantsView extends GenericCompareVariantsView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig));
    }
}

export class EbolaSudanCompareToBaselineView extends GenericCompareToBaselineView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig));
    }
}
