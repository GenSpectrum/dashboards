import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { OrganismConstants, SequencingEffortsConstants, SingleVariantConstants } from './OrganismConstants.ts';
import { type PageStateHandler, SequencingEffortsStateHandler, SingleVariantStateHandler } from './PageStateHandler.ts';
import { sequencingEffortsViewConstants, singleVariantViewConstants, type ViewConstants } from './ViewConstants';
import type { LapisLineageQuery, LapisLocation, LapisMutationQuery } from './helpers.ts';
import type { LineageFilterConfig } from '../components/pageStateSelectors/VariantSelector.tsx';
import { type BreadcrumbElement, defaultBreadcrumbs } from '../layouts/Breadcrumbs.tsx';
import { organismConfig } from '../types/Organism.ts';

export type BaselineFilter = {
    location: LapisLocation;
    dateRange: DateRangeOption;
};

export type BaselineData = {
    baselineFilter: BaselineFilter;
};

export type VariantFilter = {
    mutations: LapisMutationQuery;
    lineages: LapisLineageQuery;
};

export type VariantData<VariantFilterType = VariantFilter> = {
    variantFilter: VariantFilterType;
};

export type BaselineAndVariantData = BaselineData & VariantData;

/**
 * PageState is the state of the organism pages. It:
 * - can be set by users via input components
 * - is used to compute LAPIS filters for the visualization components
 * - is stored in the URL as query parameters
 * - must be parsable from the URL query parameters
 */
export type View<
    PageState extends object,
    Constants extends OrganismConstants,
    StateHandler extends PageStateHandler<PageState>,
> = {
    readonly viewConstants: ViewConstants;
    readonly organismConstants: Constants;
    readonly pageStateHandler: StateHandler;

    readonly viewTitle: string;
    readonly viewBreadcrumbEntries: BreadcrumbElement[];
};

export const defaultTablePageSize = 200;

export const pathoplexusGroupNameField = 'groupName';

export abstract class BaseView<
    PageState extends object,
    Constants extends OrganismConstants,
    StateHandler extends PageStateHandler<PageState>,
> implements View<PageState, Constants, StateHandler>
{
    public readonly pathname;
    public readonly viewTitle;
    public readonly viewBreadcrumbEntries;

    protected constructor(
        public readonly organismConstants: Constants,
        public readonly pageStateHandler: StateHandler,
        public readonly viewConstants: ViewConstants,
    ) {
        this.pathname = `/${organismConfig[this.organismConstants.organism].pathFragment}/${this.viewConstants.pathFragment}`;
        this.viewTitle = `${this.viewConstants.label} | ${organismConfig[this.organismConstants.organism].label} | GenSpectrum`;
        this.viewBreadcrumbEntries = [
            ...defaultBreadcrumbs,
            { name: organismConfig[this.organismConstants.organism].label },
            { name: this.viewConstants.label, href: this.pathname },
        ];
    }
}

export class GenericSingleVariantView<Constants extends SingleVariantConstants> extends BaseView<
    BaselineAndVariantData,
    Constants,
    SingleVariantStateHandler
> {
    constructor(constants: Constants) {
        super(
            constants,
            new SingleVariantStateHandler(
                constants,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                    variantFilter: {
                        mutations: {},
                        lineages: {},
                    },
                },
                organismConfig[constants.organism].pathFragment,
            ),
            singleVariantViewConstants,
        );
    }
}

export class GenericSequencingEffortsView<Constants extends SequencingEffortsConstants> extends BaseView<
    BaselineData,
    Constants,
    SequencingEffortsStateHandler
> {
    constructor(constants: Constants) {
        super(
            constants,
            new SequencingEffortsStateHandler(
                constants,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                },
                organismConfig[constants.organism].pathFragment,
            ),
            sequencingEffortsViewConstants,
        );
    }
}

export function getLineageFilterFields(lineageFilters: LineageFilterConfig[]) {
    return lineageFilters.map((filter) => filter.lapisField);
}

export function getLineageFilterConfigs(
    lineageFilterConfigs: LineageFilterConfig[],
    lineages: LapisLineageQuery,
): LineageFilterConfig[] {
    return lineageFilterConfigs.map((config) => {
        return {
            ...config,
            initialValue: lineages[config.lapisField] ?? config.initialValue,
        };
    });
}
