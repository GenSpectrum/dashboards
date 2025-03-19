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
import { getAuthorRelatedSequencingEffortsFields, type OrganismConstants } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';

const earliestDate = '1900-01-01';
const hostField = 'hostNameScientific';

class H1n1pdmConstants implements OrganismConstants {
    public readonly organism = Organisms.h1n1pdm;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields: string[];
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
        {
            type: 'date',
            dateRangeOptions: [
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
                { label: 'All times', dateFrom: this.earliestDate },
            ],
            earliestDate,
            dateColumn: GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN,
            label: 'Sample collection date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
    ];
    public readonly hostField: string = hostField;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            lineages: { cladeHA: '6B.1A.5a.2a.1', cladeNA: 'C.5.3' },
        },
    ];

    // TODO(#478): add mutation annotations
    // Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h1n1pdm.lapis.mainDateField;
        this.locationFields = organismsConfig.h1n1pdm.lapis.locationFields;
        this.authorsField = organismsConfig.h1n1pdm.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h1n1pdm.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h1n1pdm.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.h1n1pdm.lapis.accessionDownloadFields;
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
                    cladeHA: '6B.1A.5a.2a.1',
                    cladeNA: 'C.5.3',
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
