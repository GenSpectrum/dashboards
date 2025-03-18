import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import {
    makeDatasetAndVariantData,
    type CompareSideBySideData,
    type DatasetAndVariantData,
    type DatasetFilter,
    type Id,
    PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN,
    makeCompareVariantsData,
    makeCompareToBaselineData,
} from './View.ts';
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

const earliestDate = '1956-01-01';
const hostField = 'hostNameScientific';

class CchfConstants implements OrganismConstants {
    public readonly organism = Organisms.cchf;
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
            dateColumn: PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN,
            label: 'Sample collection date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = hostField;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            mutations: {
                aminoAcidMutations: ['RdRp:S1454A'],
            },
        },
        {
            mutations: {
                aminoAcidMutations: ['GPC:A1046V'],
            },
        },
        {
            mutations: {
                nucleotideMutations: ['L:G23T'],
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
        this.mainDateField = organismsConfig.cchf.lapis.mainDateField;
        this.locationFields = organismsConfig.cchf.lapis.locationFields;
        this.authorsField = organismsConfig.cchf.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.cchf.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.cchf.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.cchf.lapis.accessionDownloadFields;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.allTimes,
    },
};

export class CchfAnalyzeSingleVariantView extends GenericSingleVariantView<CchfConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CchfConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class CchfCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    CchfConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new CchfConstants(organismsConfig);
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
                            lineages: {},
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
                            lineages: {},
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

export class CchfSequencingEffortsView extends GenericSequencingEffortsView<CchfConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CchfConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class CchfCompareVariantsView extends GenericCompareVariantsView<CchfConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CchfConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class CchfCompareToBaselineView extends GenericCompareToBaselineView<CchfConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new CchfConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
