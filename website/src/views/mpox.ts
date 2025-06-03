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
import { ALL_TIMES_LABEL, defaultDateRangeOption } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1960-01-01';

const LINEAGE_FIELD_NAME = 'lineage';
const CLADE_FIELD_NAME = 'clade';

class MpoxConstants implements OrganismConstants {
    public readonly organism = Organisms.mpox;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = PATHOPLEXUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
        {
            lapisField: CLADE_FIELD_NAME,
            placeholderText: 'Clade',
            filterType: 'text' as const,
        },
    ];
    public readonly useVariantQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getPathoplexusFilters({
            dateRangeOptions: () => {
                const presets = dateRangeOptionPresets();
                return [
                    presets.lastMonth,
                    presets.last2Months,
                    presets.last3Months,
                    presets.last6Months,
                    presets.lastYear,
                    defaultDateRangeOption.year2024,
                    defaultDateRangeOption.year2023,
                    defaultDateRangeOption.year2022,
                    defaultDateRangeOption.year2021,
                    defaultDateRangeOption.since2021,
                    defaultDateRangeOption.before2021,
                    defaultDateRangeOption.since2017,
                    defaultDateRangeOption.from2017to2020,
                    defaultDateRangeOption.before2017,
                    { label: ALL_TIMES_LABEL, dateFrom: earliestDate },
                ];
            },
        }),
    ];
    public readonly hostField: string = PATHOPLEXUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly accessionDownloadFields = PATHOPLEXUS_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'F.1' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'F.2' },
        },
        {
            lineages: { [CLADE_FIELD_NAME]: 'Ia' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        return getPathoplexusSequencingEffortsAggregatedVisualizations(this, {
            sublineages: {
                label: 'Sub-Lineages',
                fields: [LINEAGE_FIELD_NAME, CLADE_FIELD_NAME],
            },
        });
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.mpox.lapis.mainDateField;
        this.additionalFilters = organismsConfig.mpox.lapis.additionalFilters;
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
                    [LINEAGE_FIELD_NAME]: 'F.1',
                },
            },
            {
                lineages: {
                    [LINEAGE_FIELD_NAME]: 'F.2',
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
