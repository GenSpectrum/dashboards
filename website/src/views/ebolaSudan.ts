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
import { defaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1975-01-01';

class EbolaSudanConstants implements OrganismConstants {
    public readonly organism = Organisms.ebolaSudan;
    public readonly earliestDate = '1975-01-01';
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: defaultDateRangeOptions,
            earliestDate,
        }),
    ];
    public readonly mainDateField: string;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [];
    public readonly useVariantQuery = false;
    public readonly hostField: string = PATHOPLEXUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly accessionDownloadFields = PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS;
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

    public get aggregatedVisualizations() {
        return getPathoplexusSequencingEffortsAggregatedVisualizations(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.ebolaSudan.lapis.mainDateField;
        this.additionalFilters = organismsConfig.ebolaSudan.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [PATHOPLEXUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets().allTimes,
    },
    numberFilters: {},
};

export class EbolaSudanAnalyzeSingleVariantView extends GenericSingleVariantView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class EbolaSudanCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    EbolaSudanConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new EbolaSudanConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [{}, {}]);

        super(
            constants,
            new CompareSideBySideStateHandler(constants, defaultPageState),
            compareSideBySideViewConstants,
        );
    }
}

export class EbolaSudanSequencingEffortsView extends GenericSequencingEffortsView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class EbolaSudanCompareVariantsView extends GenericCompareVariantsView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class EbolaSudanCompareToBaselineView extends GenericCompareToBaselineView<EbolaSudanConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new EbolaSudanConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
