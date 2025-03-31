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
    PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS,
    PATHOPLEXUS_HOST_FIELD,
    PATHOPLEXUS_LOCATION_FIELDS,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1930-01-01';

const LINEAGE_FIELD_NAME = 'lineage';

class WestNileConstants implements OrganismConstants {
    public readonly organism = Organisms.westNile;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
    ];
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions,
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

    public get aggregatedVisualizations() {
        return getPathoplexusSequencingEffortsAggregatedVisualizations(this, {
            sublineages: {
                label: 'Lineages',
                fields: [LINEAGE_FIELD_NAME],
            },
        });
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
