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
    getPathoplexusSequencingEffortsAggregatedVisualizations,
    getPathoplexusFilters,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
    PATHOPLEXUS_COMMON_DOWNLOAD_FIELDS,
    PATHOPLEXUS_HOST_FIELD,
    PATHOPLEXUS_LOCATION_FIELDS,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { defaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1956-01-01';

class CchfConstants implements OrganismConstants {
    public readonly organism = Organisms.cchf;
    public readonly earliestDate = earliestDate;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: defaultDateRangeOptions,
            earliestDate,
        }),
    ];
    public readonly mainDateField: string;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = PATHOPLEXUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly accessionDownloadFields = [
        'insdcAccessionFull_L',
        'insdcAccessionFull_M',
        'insdcAccessionFull_S',
        ...PATHOPLEXUS_COMMON_DOWNLOAD_FIELDS,
    ];
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

    public get aggregatedVisualizations() {
        return getPathoplexusSequencingEffortsAggregatedVisualizations(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.cchf.lapis.mainDateField;
        this.additionalFilters = organismsConfig.cchf.lapis.additionalFilters;
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
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [{}, {}]);

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
