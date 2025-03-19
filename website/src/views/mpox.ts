import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import {
    type CompareSideBySideData,
    type DatasetFilter,
    makeCompareSideBySideData,
    makeCompareToBaselineData,
    makeCompareVariantsData,
    makeDatasetAndVariantData,
    PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN,
} from './View.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { getPathoplexusAdditionalSequencingEffortsFields, type OrganismConstants } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1960-01-01';
const hostField = 'hostNameScientific';

class MpoxConstants implements OrganismConstants {
    public readonly organism = Organisms.mpox;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
        {
            lapisField: 'clade',
            placeholderText: 'Clade',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        {
            type: 'date',
            dateRangeOptions: [
                dateRangeOptionPresets.lastMonth,
                dateRangeOptionPresets.last2Months,
                dateRangeOptionPresets.last3Months,
                dateRangeOptionPresets.last6Months,
                dateRangeOptionPresets.lastYear,
                { label: '2024', dateFrom: '2024-01-01' },
                { label: '2023', dateFrom: '2023-01-01', dateTo: '2023-12-31' },
                { label: '2022', dateFrom: '2022-01-01', dateTo: '2022-12-31' },
                { label: '2021', dateFrom: '2021-01-01', dateTo: '2021-12-31' },
                { label: 'Since 2021', dateFrom: '2021-01-01' },
                { label: 'Before 2021', dateTo: '2020-12-31' },
                { label: 'Since 2017', dateFrom: '2017-01-01' },
                { label: '2017-2020', dateFrom: '2017-01-01', dateTo: '2020-12-31' },
                { label: 'Before 2017', dateTo: '2016-12-31' },
                dateRangeOptionPresets.allTimes,
            ],
            earliestDate: '1960-01-01',
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
    public readonly hostField: string = hostField;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            lineages: { lineage: 'F.1' },
        },
        {
            lineages: { lineage: 'F.2' },
        },
        {
            lineages: { clade: 'Ia' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
        this.locationFields = organismsConfig.mpox.lapis.locationFields;
        this.authorsField = organismsConfig.mpox.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.mpox.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.mpox.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.mpox.lapis.accessionDownloadFields;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class MpoxAnalyzeSingleVariantView extends GenericSingleVariantView<MpoxConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MpoxConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class MpoxCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    MpoxConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new MpoxConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {
                lineages: {
                    lineage: 'F.1',
                },
            },
            {
                lineages: {
                    lineage: 'F.2',
                },
            },
        ]);

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

export class MpoxSequencingEffortsView extends GenericSequencingEffortsView<MpoxConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MpoxConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class MpoxCompareVariantsView extends GenericCompareVariantsView<MpoxConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MpoxConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class MpoxCompareToBaselineView extends GenericCompareToBaselineView<MpoxConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MpoxConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
