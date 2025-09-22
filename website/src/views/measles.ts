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
    getPathoplexusFilters,
    getPathoplexusSequencingEffortsAggregatedVisualizations,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
    PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS,
    PATHOPLEXUS_HOST_FIELD,
    PATHOPLEXUS_LOCATION_FIELDS,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1930-01-01';

const LINEAGE_FIELD_NAME = 'genotype';

class MeaslesConstants implements OrganismConstants {
    public readonly organism = Organisms.measles;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'genotype',
            filterType: 'text' as const,
        },
    ];
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions(earliestDate),
        }),
        {
            lapisField: 'collectionDevice',
            placeholderText: 'Collection device',
            type: 'text' as const,
            label: 'Collection device',
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly useVariantQuery = false;
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

    public get aggregatedVisualizations() {
        return getPathoplexusSequencingEffortsAggregatedVisualizations(this, {
            sublineages: {
                label: 'Genotype',
                fields: [LINEAGE_FIELD_NAME],
            },
        });
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.measles.lapis.mainDateField;
        this.additionalFilters = organismsConfig.measles.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets().lastYear,
    },
    numberFilters: {},
};

export class MeaslesAnalyzeSingleVariantView extends GenericSingleVariantView<MeaslesConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MeaslesConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class MeaslesCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    MeaslesConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new MeaslesConstants(organismsConfig);
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
            new CompareSideBySideStateHandler(constants, defaultPageState),
            compareSideBySideViewConstants,
        );
    }
}

export class MeaslesSequencingEffortsView extends GenericSequencingEffortsView<MeaslesConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MeaslesConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class MeaslesCompareVariantsView extends GenericCompareVariantsView<MeaslesConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MeaslesConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class MeaslesCompareToBaselineView extends GenericCompareToBaselineView<MeaslesConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new MeaslesConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
