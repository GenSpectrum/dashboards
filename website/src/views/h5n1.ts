import { dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import {
    BaseView,
    GenericCompareToBaselineView,
    GenericCompareVariantsView,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
} from './BaseView.ts';
import { type ExtendedConstants, getAuthorRelatedSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';

const earliestDate = '1905-01-01';

class H5n1Constants implements ExtendedConstants {
    public readonly organism = Organisms.h5n1;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'clade',
            placeholderText: 'Clade',
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
                { label: 'All times', dateFrom: this.earliestDate },
            ],
            earliestDate,
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

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.hostField = organismsConfig.h5n1.lapis.hostField;
        this.authorsField = organismsConfig.h5n1.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h5n1.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig.h5n1.lapis.accessionDownloadFields;
    }
}

export class H5n1AnalyzeSingleVariantView extends GenericSingleVariantView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareSideBySideView extends BaseView<
    CompareSideBySideData,
    H5n1Constants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H5n1Constants(organismsConfig);
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
                                clade: '2.3.4.4b',
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

export class H5n1SequencingEffortsView extends GenericSequencingEffortsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareVariantsView extends GenericCompareVariantsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareToBaselineView extends GenericCompareToBaselineView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}
