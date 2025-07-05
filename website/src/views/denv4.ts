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

const earliestDate = '1956-01-01';

const LINEAGE_FIELD_NAME = 'clade';

class Denv4Constants implements OrganismConstants {
    public readonly organism = Organisms.denv4;
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
    public readonly useAdvancedQuery = false;
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
            lineages: { [LINEAGE_FIELD_NAME]: '4II_B.1.1' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '4II_B' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '4I_A.2' },
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
        this.mainDateField = organismsConfig.denv4.lapis.mainDateField;
        this.additionalFilters = organismsConfig.denv4.lapis.additionalFilters;
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

export class Denv4AnalyzeSingleVariantView extends GenericSingleVariantView<Denv4Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv4Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv4CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    Denv4Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new Denv4Constants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [LINEAGE_FIELD_NAME]: '4I_A.3',
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

export class Denv4SequencingEffortsView extends GenericSequencingEffortsView<Denv4Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv4Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv4CompareVariantsView extends GenericCompareVariantsView<Denv4Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv4Constants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class Denv4CompareToBaselineView extends GenericCompareToBaselineView<Denv4Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv4Constants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
