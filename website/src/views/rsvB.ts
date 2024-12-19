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
import { getAuthorRelatedSequencingEffortsFields, type ExtendedConstants } from './OrganismConstants.ts';
import { compareSideBySideViewConstants } from './ViewConstants.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/LineageFilterInput.tsx';
import { organismConfig, Organisms } from '../types/Organism.ts';
import { type DataOrigin, dataOrigins } from '../types/dataOrigins.ts';
import { GenericCompareSideBySideStateHandler } from './pageStateHandlers/CompareSideBySidePageStateHandler.ts';

class RsvBConstants implements ExtendedConstants {
    public readonly organism = Organisms.rsvB;
    public readonly defaultDateRange = dateRangeOptionPresets.lastYear;
    public readonly earliestDate = '1956-01-01';
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
    GenericCompareSideBySideStateHandler
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
            new GenericCompareSideBySideStateHandler(
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
