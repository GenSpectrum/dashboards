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
import { type OrganismsConfig } from '../config.ts';
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
    getGenspectrumLoculusFilters,
    getGenSpectrumLoculusAggregatedVisualizations,
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
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1956-01-01';

const LINEAGE_FIELD_NAME = 'lineage';

class RsvBConstants implements OrganismConstants {
    public readonly organism = Organisms.rsvB;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions,
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
            lineages: { [LINEAGE_FIELD_NAME]: 'B.D.E.1' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'B.D.E.1.1' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: 'B.D.4.1.1' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        return getGenSpectrumLoculusAggregatedVisualizations(this, {
            sublineages: {
                label: 'Lineages',
                fields: [LINEAGE_FIELD_NAME],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
        this.additionalFilters = organismsConfig.rsvB.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class RsvBAnalyzeSingleVariantView extends GenericSingleVariantView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class RsvBCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    RsvBConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new RsvBConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [LINEAGE_FIELD_NAME]: 'B.D.E.1',
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

export class RsvBSequencingEffortsView extends GenericSequencingEffortsView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class RsvBCompareVariantsView extends GenericCompareVariantsView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class RsvBCompareToBaselineView extends GenericCompareToBaselineView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
