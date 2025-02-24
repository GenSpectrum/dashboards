import { dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import { type OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { type ExtendedConstants, getAuthorRelatedSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1956-01-01';

class RsvBConstants implements ExtendedConstants {
    public readonly organism = Organisms.rsvB;
    public readonly mainDateField: string;
    public readonly earliestDate = earliestDate;
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
            defaultDateRange: dateRangeOptionPresets.lastYear,
            dateColumn: 'sampleCollectionDate',
            label: 'Sample collection date',
        },
    ];
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields;
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

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
        this.locationFields = organismsConfig.rsvB.lapis.locationFields;
        this.hostField = organismsConfig.rsvB.lapis.hostField;
        this.authorsField = organismsConfig.rsvB.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.rsvB.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.rsvB.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.rsvB.lapis.accessionDownloadFields;
    }
}

export class RsvBAnalyzeSingleVariantView extends GenericSingleVariantView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}

export class RsvBCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    RsvBConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new RsvBConstants(organismsConfig);
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
                            dateFilters: {},
                            textFilters: {},
                        },
                        variantFilter: {
                            lineages: {
                                lineage: 'B.D.E.1',
                            },
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

export class RsvBSequencingEffortsView extends GenericSequencingEffortsView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}

export class RsvBCompareVariantsView extends GenericCompareVariantsView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}

export class RsvBCompareToBaselineView extends GenericCompareToBaselineView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}
