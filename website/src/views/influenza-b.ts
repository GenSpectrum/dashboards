import { dateRangeOptionPresets, type MutationAnnotation } from '@genspectrum/dashboard-components/util';

import { type CompareSideBySideData, type DatasetAndVariantData, type Id } from './View.ts';
import type { OrganismsConfig } from '../config.ts';
import { BaseView, GenericSequencingEffortsView } from './BaseView.ts';
import { type OrganismConstants, getAuthorRelatedSequencingEffortsFields } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { CompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import type { BaselineFilterConfig } from '../components/pageStateSelectors/BaselineSelector.tsx';

const earliestDate = '1905-01-01';
const hostField = 'hostNameScientific';

class InfluenzaBConstants implements OrganismConstants {
    public readonly organism = Organisms.influenzaB;
    public readonly earliestDate = earliestDate;
    public readonly mainDateField: string;
    public readonly locationFields: string[];
    public readonly lineageFilters: LineageFilterConfig[] = [
        {
            lapisField: 'lineageHA',
            placeholderText: 'lineage',
            filterType: 'text' as const,
            initialValue: undefined,
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
                { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
                { label: 'All times', dateFrom: this.earliestDate },
            ],
            earliestDate: earliestDate,
            defaultDateRange: dateRangeOptionPresets.lastYear,
            dateColumn: 'sampleCollectionDate',
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
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = [dataOrigins.insdc];
    public readonly accessionDownloadFields;
    public readonly mutationAnnotations: MutationAnnotation[] = [];

    public get additionalSequencingEffortsFields() {
        return getAuthorRelatedSequencingEffortsFields(this);
    }

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig['influenza-b'].lapis.mainDateField;
        this.locationFields = organismsConfig['influenza-b'].lapis.locationFields;
        this.authorsField = organismsConfig['influenza-b'].lapis.authorsField;
        this.authorAffiliationsField = organismsConfig['influenza-b'].lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig['influenza-b'].lapis.additionalFilters;
        this.accessionDownloadFields = organismsConfig['influenza-b'].lapis.accessionDownloadFields;
    }
}

export class InfluenzaBCompareSideBySideView extends BaseView<
    CompareSideBySideData,
    InfluenzaBConstants,
    CompareSideBySideStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new InfluenzaBConstants(organismsConfig);
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
                            lineages: { lineageHA: 'vic' },
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
                                lineageHA: 'yam',
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

export class InfluenzaBSequencingEffortsView extends GenericSequencingEffortsView<InfluenzaBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new InfluenzaBConstants(organismsConfig));
    }
}
