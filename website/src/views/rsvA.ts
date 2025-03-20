import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import {
    type CompareSideBySideData,
    type DatasetFilter,
    GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
    makeCompareSideBySideData,
    makeCompareToBaselineData,
    makeCompareVariantsData,
    makeDatasetAndVariantData,
} from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import {
    GENPSECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getAuthorRelatedSequencingEffortsFields,
    getGenspectrumLoculusFilters,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1956-01-01';

const dateRangeOptions = [
    dateRangeOptionPresets.lastMonth,
    dateRangeOptionPresets.last2Months,
    dateRangeOptionPresets.last3Months,
    dateRangeOptionPresets.last6Months,
    dateRangeOptionPresets.lastYear,
    { label: 'Since 2020', dateFrom: '2020-01-01' },
    { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
    { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
    { label: 'Since 2000', dateFrom: '2000-01-01' },
    { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
    dateRangeOptionPresets.allTimes,
];

class RsvAConstants implements OrganismConstants {
    public readonly organism = Organisms.rsvA;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions,
            earliestDate,
        }),
    ];
    public readonly hostField: string = GENPSECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = ['insdcAccessionFull'];
    public readonly predefinedVariants = [
        {
            lineages: { lineage: 'A.D.3' },
        },
        {
            lineages: { lineage: 'A.D.5.2' },
        },
        {
            lineages: { lineage: 'A.D.1' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvA.lapis.mainDateField;
        this.additionalFilters = organismsConfig.rsvA.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class RsvAAnalyzeSingleVariantView extends GenericSingleVariantView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class RsvACompareSideBySideView extends BaseView<
    CompareSideBySideData,
    RsvAConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new RsvAConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    lineage: 'A.D.5.2',
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

export class RsvASequencingEffortsView extends GenericSequencingEffortsView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class RsvACompareVariantsView extends GenericCompareVariantsView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class RsvACompareToBaselineView extends GenericCompareToBaselineView<RsvAConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvAConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
