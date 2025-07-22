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
    GENSPECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getGenSpectrumLoculusAggregatedVisualizations,
    getGenspectrumLoculusFilters,
    INSDC_ACCESSION_DOWNLOAD_FILES,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { Organisms } from '../types/Organism.ts';
import { dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1944-01-01';

const LINEAGE_FIELD_NAME = 'clade';

class Denv1Constants implements OrganismConstants {
    public readonly organism = Organisms.denv1;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'Clade',
            filterType: 'lineage' as const,
        },
    ];
    public readonly useVariantQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions(earliestDate),
        }),
    ];
    public readonly hostField: string = GENSPECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INSDC_ACCESSION_DOWNLOAD_FILES;
    public readonly predefinedVariants = [
        {
            lineages: { [LINEAGE_FIELD_NAME]: '1III_A' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '1I_E.1' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '1I_E' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        return getGenSpectrumLoculusAggregatedVisualizations(this, {
            sublineages: {
                label: 'Clades',
                fields: [LINEAGE_FIELD_NAME],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.denv1.lapis.mainDateField;
        this.additionalFilters = organismsConfig.denv1.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets().lastYear,
    },
    numberFilters: {},
};

export class Denv1AnalyzeSingleVariantView extends GenericSingleVariantView<Denv1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv1Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv1CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    Denv1Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new Denv1Constants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [LINEAGE_FIELD_NAME]: '1I_K.1.1',
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

export class Denv1SequencingEffortsView extends GenericSequencingEffortsView<Denv1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv1Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv1CompareVariantsView extends GenericCompareVariantsView<Denv1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv1Constants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class Denv1CompareToBaselineView extends GenericCompareToBaselineView<Denv1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv1Constants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
