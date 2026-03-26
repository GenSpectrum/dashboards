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

const earliestDate = '1953-01-01';

const LINEAGE_FIELD_NAME = 'clade';

class Denv3Constants implements OrganismConstants {
    public readonly organism = Organisms.denv3;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: LINEAGE_FIELD_NAME,
            placeholderText: 'Clade',
            filterType: 'lineage' as const,
        },
    ];
    public readonly useVariantQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[];
    public readonly hostField: string = GENSPECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INSDC_ACCESSION_DOWNLOAD_FILES;
    public readonly predefinedVariants = [
        {
            lineages: { [LINEAGE_FIELD_NAME]: '3II_A' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '3III_B.3.2' },
        },
        {
            lineages: { [LINEAGE_FIELD_NAME]: '3III_B.3' },
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
        this.locationFields = organismsConfig.denv3.lapis.locationFields;
        this.mainDateField = organismsConfig.denv3.lapis.mainDateField;
        this.additionalFilters = organismsConfig.denv3.lapis.additionalFilters;
        this.baselineFilterConfigs = [
            ...getGenspectrumLoculusFilters({
                locationFields: this.locationFields,
                dateRangeOptions: fineGrainedDefaultDateRangeOptions(earliestDate),
            }),
        ];
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

export class Denv3AnalyzeSingleVariantView extends GenericSingleVariantView<Denv3Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv3Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv3CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    Denv3Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new Denv3Constants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [LINEAGE_FIELD_NAME]: '3III_B.3.2',
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

export class Denv3SequencingEffortsView extends GenericSequencingEffortsView<Denv3Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv3Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class Denv3CompareVariantsView extends GenericCompareVariantsView<Denv3Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv3Constants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class Denv3CompareToBaselineView extends GenericCompareToBaselineView<Denv3Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new Denv3Constants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
