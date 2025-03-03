import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { type OrganismConstants, getPathoplexusAdditionalSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1930-01-01';
const hostField = 'hostNameScientific';

class WestNileConstants implements OrganismConstants {
    public readonly organism = Organisms.westNile;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineage',
            placeholderText: 'Lineage',
            filterType: 'text' as const,
        },
    ];
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
                { label: 'Before 2000', dateTo: '1999-12-31' },
                dateRangeOptionPresets.allTimes,
            ],
            earliestDate: '1999-01-01',
            defaultDateRange: dateRangeOptionPresets.lastYear,
            dateColumn: 'sampleCollectionDateRangeLower',
            label: 'Sample collection date',
        },
        {
            lapisField: hostField,
            placeholderText: 'Host',
            type: 'text' as const,
            label: 'Host',
        },
    ];
    public readonly useAdvancedQuery = false;
    public readonly hostField: string = hostField;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly accessionDownloadFields;
    public readonly predefinedVariants = [
        {
            lineages: { lineage: '1A' },
        },
        {
            lineages: { lineage: '1B' },
        },
        {
            lineages: { lineage: '2' },
        },
    ];
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getPathoplexusAdditionalSequencingEffortsFields(this);
    }

    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.pathoplexus];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.westNile.lapis.mainDateField;
        this.locationFields = organismsConfig.westNile.lapis.locationFields;
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
    CompareSideBySideStateHandler
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
                            dateFilters: {},
                            textFilters: {},
                        },
                        variantFilter: {
                            lineages: {
                                lineage: '2',
                            },
                            mutations: {},
                        },
                    },
                ],
                [
                    1,
                    {
                        datasetFilter: {
                            location: {},
                            dateFilters: {},
                            textFilters: {},
                        },
                        variantFilter: {
                            lineages: {},
                            mutations: {},
                        },
                    },
                ],
            ]),
        };

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
