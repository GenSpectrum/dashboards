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
    INFLUENZA_ACCESSION_DOWNLOAD_FIELDS,
    INFLUENZA_COMPLETENESS_SUFFIXES,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1905-01-01';

const CLADE_HA_FIELD_NAME = 'cladeHA';
const CLADE_NA_FIELD_NAME = 'cladeNA';

class VictoriaConstants implements OrganismConstants {
    public readonly organism = Organisms.victoria;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: CLADE_HA_FIELD_NAME,
            placeholderText: 'Clade HA',
            filterType: 'text' as const,
        },
        {
            lapisField: CLADE_NA_FIELD_NAME,
            placeholderText: 'Clade NA',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({
            dateRangeOptions: fineGrainedDefaultDateRangeOptions,
            earliestDate,
            completenessSuffixes: INFLUENZA_COMPLETENESS_SUFFIXES,
        }),
    ];
    public readonly hostField: string = GENSPECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INFLUENZA_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { cladeHA: 'V1A.3a.2' },
        },
    ];

    // Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get aggregatedVisualizations() {
        return getGenSpectrumLoculusAggregatedVisualizations(this, {
            sublineages: {
                label: 'Clades',
                fields: [CLADE_HA_FIELD_NAME, CLADE_NA_FIELD_NAME],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.victoria.lapis.mainDateField;
        this.additionalFilters = organismsConfig.victoria.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    locationFilters: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
    numberFilters: {},
};

export class VictoriaAnalyzeSingleVariantView extends GenericSingleVariantView<VictoriaConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new VictoriaConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class VictoriaCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    VictoriaConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new VictoriaConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    cladeHA: 'V1A.3a.2',
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

export class VictoriaSequencingEffortsView extends GenericSequencingEffortsView<VictoriaConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new VictoriaConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class VictoriaCompareVariantsView extends GenericCompareVariantsView<VictoriaConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new VictoriaConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class VictoriaCompareToBaselineView extends GenericCompareToBaselineView<VictoriaConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new VictoriaConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
