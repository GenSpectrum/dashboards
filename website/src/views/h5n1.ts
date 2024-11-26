import { type DateRangeOption, dateRangeOptionPresets } from '@genspectrum/dashboard-components/util';

import { type BaselineAndVariantData, type CompareVariantsData, type Id } from './View.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import type { OrganismsConfig } from '../config.ts';
import { BaseView, GenericSequencingEffortsView, GenericSingleVariantView } from './BaseView.ts';
import type { SingleVariantConstants } from './OrganismConstants.ts';
import { GenericCompareVariantsStateHandler } from './PageStateHandler.ts';
import { compareVariantsViewConstants } from './ViewConstants.ts';
import { organismConfig, Organisms } from '../types/Organism.ts';
import type { DataOrigin } from '../types/dataOrigins.ts';

const earliestDate = '1905-01-01';

class H5n1Constants implements SingleVariantConstants {
    public readonly organism = Organisms.h5n1;
    public readonly earliestDate = '1905-01-01';
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
        { label: 'Before 2000', dateFrom: earliestDate, dateTo: '1999-12-31' },
        { label: 'All times', dateFrom: this.earliestDate },
    ];
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
    public readonly hostField: string;
    public readonly authorsField: string | undefined;
    public readonly authorAffiliationsField: string | undefined;
    public readonly additionalFilters: Record<string, string> | undefined;
    public readonly dataOrigins: DataOrigin[] = ['insdc'];

    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.h5n1.lapis.mainDateField;
        this.locationFields = organismsConfig.h5n1.lapis.locationFields;
        this.hostField = organismsConfig.h5n1.lapis.hostField;
        this.authorsField = organismsConfig.h5n1.lapis.authorsField;
        this.authorAffiliationsField = organismsConfig.h5n1.lapis.authorAffiliationsField;
        this.additionalFilters = organismsConfig.h5n1.lapis.additionalFilters;
    }
}

export class H5n1AnalyzeSingleVariantView extends GenericSingleVariantView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}

export class H5n1CompareVariantsView extends BaseView<
    CompareVariantsData,
    H5n1Constants,
    GenericCompareVariantsStateHandler
> {
    constructor(organismsConfig: OrganismsConfig) {
        const constants = new H5n1Constants(organismsConfig);
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
            new GenericCompareVariantsStateHandler(
                constants,
                defaultPageState,
                organismConfig[constants.organism].pathFragment,
            ),
            compareVariantsViewConstants,
        );
    }
}

export class H5n1SequencingEffortsView extends GenericSequencingEffortsView<H5n1Constants> {
    constructor(organismsConfig: OrganismsConfig) {
        super(new H5n1Constants(organismsConfig));
    }
}
