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
    getAuthorRelatedSequencingEffortsFields,
    getGenspectrumLoculusFilters,
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

const earliestDate = '1905-01-01';
const dateRangeOptions = [
    dateRangeOptionPresets.lastMonth,
    dateRangeOptionPresets.last2Months,
    dateRangeOptionPresets.last3Months,
    dateRangeOptionPresets.last6Months,
    dateRangeOptionPresets.lastYear,
    { label: 'Since 2020', dateFrom: '2020-01-01' },
    { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
    { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
    { label: 'Since 2000', dateFrom: '2000-01-01' },
    { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
    dateRangeOptionPresets.allTimes,
];

class VictoriaConstants implements OrganismConstants {
    public readonly organism = Organisms.victoria;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'cladeHA',
            placeholderText: 'Clade HA',
            filterType: 'text' as const,
        },
        {
            lapisField: 'cladeNA',
            placeholderText: 'Clade NA',
            filterType: 'text' as const,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly baselineFilterConfigs: BaselineFilterConfig[] = [
        ...getGenspectrumLoculusFilters({ dateRangeOptions, earliestDate }),
    ];
    public readonly hostField: string = GENPSECTRUM_LOCULUS_HOST_FIELD;
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

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.victoria.lapis.mainDateField;
        this.additionalFilters = organismsConfig.victoria.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
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
            new CompareSideBySideStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
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
