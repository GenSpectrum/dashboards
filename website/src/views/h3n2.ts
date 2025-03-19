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

const earliestDate = '1905-01-01';
const hostField = 'hostNameScientific';

class H3n2Constants implements OrganismConstants {
    public readonly organism = Organisms.h3n2;
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
            lineages: { cladeHA: '3C.2a1b.2a.2a.3a.1' },
        },
    ];

    // TODO(#478): add mutation annotations
    // Antiviral susceptibility mutations have been compiled here: https://www.who.int/teams/global-influenza-programme/laboratory-network/quality-assurance/antiviral-susceptibility-influenza/neuraminidase-inhibitor.
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h3n2.lapis.mainDateField;
        this.locationFields = organismsConfig.h3n2.lapis.locationFields;
        this.authorsField = organismsConfig.h3n2.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h3n2.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h3n2.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.h3n2.lapis.accessionDownloadFields;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
    textFilters: {},
    dateFilters: {
        [GENSPECTRUM_LOCULUS_MAIN_FILTER_DATE_COLUMN]: dateRangeOptionPresets.lastYear,
    },
};

export class H3n2AnalyzeSingleVariantView extends GenericSingleVariantView<H3n2Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H3n2Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H3n2CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    H3n2Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H3n2Constants(organismsConfig);
        const defaultPageState = makeCompareSideBySideData(defaultDatasetFilter, [
            {},
            {
                lineages: {
                    cladeHA: '3C.2a1b.2a.2a.3a.1',
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

export class H3n2SequencingEffortsView extends GenericSequencingEffortsView<H3n2Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H3n2Constants(organismsConfig), makeDatasetAndVariantData(defaultDatasetFilter));
    }
}

export class H3n2CompareVariantsView extends GenericCompareVariantsView<H3n2Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H3n2Constants(organismsConfig), makeCompareVariantsData(defaultDatasetFilter));
    }
}

export class H3n2CompareToBaselineView extends GenericCompareToBaselineView<H3n2Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H3n2Constants(organismsConfig), makeCompareToBaselineData(defaultDatasetFilter));
    }
}
