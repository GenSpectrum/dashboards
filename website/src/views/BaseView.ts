import type { OrganismConstants, SequencingEffortsConstants, SingleVariantConstants } from './OrganismConstants.ts';
import {
    CompareVariantsStateHandler,
    type PageStateHandler,
    SequencingEffortsStateHandler,
    SingleVariantStateHandler,
} from './PageStateHandler.ts';
import type { BaselineAndVariantData, BaselineData, CompareVariantsData, View } from './View.ts';
import {
    compareVariantsViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
    type ViewConstants,
} from './ViewConstants.ts';
import { defaultBreadcrumbs } from '../layouts/Breadcrumbs.tsx';
import { organismConfig } from '../types/Organism.ts';

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
            { name: this.viewConstants.label, href: this.pageStateHandler.getDefaultPageUrl() },
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

export class GenericCompareVariantsView<Constants extends SingleVariantConstants> extends BaseView<
    CompareVariantsData,
    Constants,
    CompareVariantsStateHandler
> {
    constructor(constants: Constants) {
        super(
            constants,
            new CompareVariantsStateHandler(
                constants,
                {
                    baselineFilter: {
                        location: {},
                        dateRange: constants.defaultDateRange,
                    },
                    variants: new Map(),
                },
                organismConfig[constants.organism].pathFragment,
            ),
            compareVariantsViewConstants,
        );
    }
}
