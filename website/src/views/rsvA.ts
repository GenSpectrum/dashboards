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
import type { OrganismsConfig } from '../config.ts';
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
import { dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1956-01-01';

const LINEAGE_FIELD_NAME = 'lineage';

class RsvAConstants implements OrganismConstants {
    public readonly organism = Organisms.rsvA;
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
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions(earliestDate),
        }),
    ];
    public readonly hostField: string = PATHOPLEXUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins = [dataOrigins.pathoplexus];
    public readonly accessionDownloadFields = PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'A.D.3' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'A.D.5.2' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'A.D.1' },
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

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvA.lapis.mainDateField;
        this.additionalFilters = organismsConfig.rsvA.lapis.additionalFilters;
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
                    [LINEAGE_FIELD_NAME]: 'A.D.5.2',
                },
            },
        ]);

        super(
            constants,
            new CompareSideBySideStateHandler(constants, defaultPageState),
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
