import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import {
    type BaselineAndVariantData,
    BaseView,
    type CompareVariantsData,
    GenericSequencingEffortsView,
    GenericSingleVariantView,
    type Id,
} from './View.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { type OrganismsConfig } from '../config.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import { GenericCompareVariantsStateHandler } from './PageStateHandler.ts';
import { compareVariantsViewConstants } from './ViewConstants.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

class RsvBConstants implements SingleVariantConstants {
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
    public readonly dataOrigins: DataOrigin[] = ['insdc'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.rsvB.lapis.mainDateField;
        this.locationFields = organismsConfig.rsvB.lapis.locationFields;
        this.hostField = organismsConfig.rsvB.lapis.hostField;
        this.authorsField = organismsConfig.rsvB.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.rsvB.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.rsvB.lapis.additionalFilters;
    }
}

export class RsvBAnalyzeSingleVariantView extends GenericSingleVariantView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}

export class RsvBCompareVariantsView extends BaseView<
    CompareVariantsData,
    RsvBConstants,
    GenericCompareVariantsStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new RsvBConstants(organismsConfig);
        const defaultPageState = {
            filters: new Map<Id, BaselineAndVariantData>([
                [
                    0,
                    {
                        baselineFilter: {
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
                        baselineFilter: {
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
            new GenericCompareVariantsStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareVariantsViewConstants,
        );
    }
}

export class RsvBSequencingEffortsView extends GenericSequencingEffortsView<RsvBConstants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new RsvBConstants(organismsConfig));
    }
}
