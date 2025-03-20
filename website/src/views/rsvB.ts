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
    type OrganismConstants,
    getAuthorRelatedSequencingEffortsFields,
    GENSPECTRUM_LOCULUS_LOCATION_FIELDS,
    LOCULUS_AUTHORS_FIELD,
    LOCULUS_AUTHORS_AFFILIATIONS_FIELD,
} from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1956-01-01';
const hostField = 'hostNameScientific';

class RsvBConstants implements OrganismConstants {
    public readonly organism = Organisms.rsvB;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields = GENSPECTRUM_LOCULUS_LOCATION_FIELDS;
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
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
                { label: 'All times', dateFrom: earliestDate },
            ],
            earliestDate: '1956-01-01',
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
    public readonly authorsField = LOCULUS_AUTHORS_FIELD;
    public readonly authorAffiliationsField = LOCULUS_AUTHORS_AFFILIATIONS_FIELD;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields = ['insdcAccessionFull'];
    public readonly predefinedVariants = [
        {
            lineages: { lineage: 'B.D.E.1' },
        },
        {
            lineages: { lineage: 'B.D.E.1.1' },
        },
        {
            lineages: { lineage: 'B.D.4.1.1' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
        this.additionalFilters = organismsConfig.rsvB.lapis.additionalFilters;
    }
}

const defaultDatasetFilter: DatasetFilter = {
    location: {},
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
                    lineage: 'B.D.E.1',
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
