import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { getPathoplexusAdditionalSequencingEffortsFields, type ExtendedConstants } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { GenericCompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';

class WestNileConstants implements ExtendedConstants {
    public readonly organism = Organisms.westNile;
    public readonly earliestDate = '1930-01-01';
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
    public readonly dateRangeOptions: DateRangeOption[] = [
        dateRangeOptionPresets.lastMonth,
        dateRangeOptionPresets.last2Months,
        dateRangeOptionPresets.last3Months,
        dateRangeOptionPresets.last6Months,
        dateRangeOptionPresets.lastYear,
        { label: 'Since 2020', dateFrom: '2020-01-01' },
        { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
        { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
        { label: 'Since 2000', dateFrom: '2000-01-01' },
        { label: 'Before 2000', dateFrom: this.earliestDate, dateTo: '1999-12-31' },
        { label: 'All times', dateFrom: this.earliestDate },
    ];
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
            initialValue: undefined,
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly accessionDownloadFields;

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
        this.locationFields = organismsConfig.westNile.lapis.locationFields;
        this.hostField = organismsConfig.westNile.lapis.hostField;
        this.authorsField = organismsConfig.westNile.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.westNile.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.westNile.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.westNile.lapis.accessionDownloadFields;
    }
}

export class WestNileAnalyzeSingleVariantView extends GenericSingleVariantView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}

export class WestNileCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    WestNileConstants,
    GenericCompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new WestNileConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, DatasetAndVariantData>([
                [
                    0,
                    {
                        datasetFilter: {
                            location: {},
                            dateRange: constants.defaultDateRange,
                        },
                        variantFilter: {
                            lineages: {},
                            mutations: {},
                        },
                    },
                ],
                [
                    1,
                    {
                        datasetFilter: {
                            location: {},
                            dateRange: constants.defaultDateRange,
                        },
                        variantFilter: {
                            lineages: {
                                lineage: '2',
                            },
                            mutations: {},
                        },
                    },
                ],
            ]),
        };

        super(
            constants,
            new GenericCompareSideBySideStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareSideBySideViewConstants,
        );
    }
}

export class WestNileSequencingEffortsView extends GenericSequencingEffortsView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}

export class WestNileCompareVariantsView extends GenericCompareVariantsView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}

export class WestNileCompareToBaselineView extends GenericCompareToBaselineView<WestNileConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new WestNileConstants(organismsConfig));
    }
}
