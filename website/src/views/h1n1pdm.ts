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
    GENPSECTRUM_LOCULUS_HOST_FIELD,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    getGenspectrumLoculusFilters,
    getGenSpectrumLoculusSequencingEffortsAggregatedVisualizations,
    INFLUENZA_ACCESSION_DOWNLOAD_FIELDS,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
    LOCULUS_AUTHORS_FIELD,
    type OrganismConstants,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { fineGrainedDefaultDateRangeOptions } from '../util/defaultDateRangeOption.ts';

const earliestDate = '1900-01-01';

const CLADE_HA_FIELD_NAME = 'cladeHA';
const CLADE_NA_FIELD_NAME = 'cladeNA';

class H1n1pdmConstants implements OrganismConstants {
    public readonly organism = Organisms.h1n1pdm;
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
        }),
    ];
    public readonly hostField: string = GENPSECTRUM_LOCULUS_HOST_FIELD;
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = INFLUENZA_ACCESSION_DOWNLOAD_FIELDS;
    public readonly predefinedVariants = [
        {
            lineages: { cladeHA: '6B.1A.5a.2a.1', cladeNA: 'C.5.3' },
        },
    ];

    // TODO(#478): add mutation annotations
    // Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get sequencingEffortsAggregatedVisualizations() {
        return getGenSpectrumLoculusSequencingEffortsAggregatedVisualizations(this, {
            sublineages: {
                label: 'Clades',
                fields: [CLADE_HA_FIELD_NAME, CLADE_NA_FIELD_NAME],
            },
        });
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h1n1pdm.lapis.mainDateField;
        this.additionalFilters = organismsConfig.h1n1pdm.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class H1n1pdmAnalyzeSingleVariantView extends GenericSingleVariantView<H1n1pdmConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H1n1pdmConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H1n1pdmCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    H1n1pdmConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H1n1pdmConstants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    [CLADE_HA_FIELD_NAME]: '6B.1A.5a.2a.1',
                    [CLADE_NA_FIELD_NAME]: 'C.5.3',
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

export class H1n1pdmSequencingEffortsView extends GenericSequencingEffortsView<H1n1pdmConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H1n1pdmConstants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H1n1pdmCompareVariantsView extends GenericCompareVariantsView<H1n1pdmConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H1n1pdmConstants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class H1n1pdmCompareToBaselineView extends GenericCompareToBaselineView<H1n1pdmConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H1n1pdmConstants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
