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
import {
    type OrganismConstants,
    getPathoplexusAdditionalSequencingEffortsFields,
    PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS,
    PATHOPLEXUS_LOCATION_FIELDS,
    LOCULUS_AUTHORS_FIELD,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    getPathoplexusFilters,
    PATHOPLEXUS_HOST_FIELD,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1930-01-01';

class WestNileConstants implements OrganismConstants {
    public readonly organism = Organisms.westNile;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
    ];
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: [
                dateRangeOptionPresets.lastMonth,
                dateRangeOptionPresets.last2Months,
                dateRangeOptionPresets.last3Months,
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
        }),
        {
            lapisField: 'collectionDevice',
            placeholderText: 'Collection device',
            type: 'text' as const,
            label: 'Collection device',
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = PATHOPLEXUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly accessionDownloadFields = PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { lineage: '1A' },
        },
        {
            lineages: { lineage: '1B' },
        },
        {
            lineages: { lineage: '2' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
        this.additionalFilters = organismsConfig.westNile.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class WestNileAnalyzeSingleVariantView extends GenericSingleVariantView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class WestNileCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    WestNileConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new WestNileConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {
                lineages: {
                    lineage: '2',
                },
            },
            {},
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

export class WestNileSequencingEffortsView extends GenericSequencingEffortsView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class WestNileCompareVariantsView extends GenericCompareVariantsView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class WestNileCompareToBaselineView extends GenericCompareToBaselineView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
