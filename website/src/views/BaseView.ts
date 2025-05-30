import type { OrganismConstants } from './OrganismConstants.ts';
import type { CompareToBaselineData, CompareVariantsData, DatasetAndVariantData, View } from './View.ts';
import {
    compareToBaselineViewConstants,
    compareVariantsViewConstants,
    sequencingEffortsViewConstants,
    singleVariantViewConstants,
    type ViewConstants,
} from './ViewConstants.ts';
import { type PageStateHandler } from './pageStateHandlers/PageStateHandler.ts';
import { defaultBreadcrumbs } from '../layouts/Breadcrumbs.tsx';
import { organismConfig, paths } from '../types/Organism.ts';
import { CompareToBaselineStateHandler } from './pageStateHandlers/CompareToBaselinePageStateHandler.ts';
import { CompareVariantsPageStateHandler } from './pageStateHandlers/CompareVariantsPageStateHandler.ts';
import { SequencingEffortsStateHandler } from './pageStateHandlers/SequencingEffortsPageStateHandler.ts';
import { SingleVariantPageStateHandler } from './pageStateHandlers/SingleVariantPageStateHandler.ts';

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
        this.pathname = `${paths[this.organismConstants.organism].basePath}/${this.viewConstants.pathFragment}`;
        this.viewTitle = `${this.viewConstants.label} | ${organismConfig[this.organismConstants.organism].label} | GenSpectrum`;
        this.viewBreadcrumbEntries = [
            ...defaultBreadcrumbs,
            ...paths[this.organismConstants.organism].breadcrumbs,
            { name: this.viewConstants.label, href: this.pageStateHandler.getDefaultPageUrl() },
        ];
    }
}

export class GenericSingleVariantView<Constants extends OrganismConstants> extends BaseView<
    DatasetAndVariantData,
    Constants,
    SingleVariantPageStateHandler
> {
    constructor(constants: Constants, defaultPageState: DatasetAndVariantData) {
        super(constants, new SingleVariantPageStateHandler(constants, defaultPageState), singleVariantViewConstants);
    }
}

export class GenericSequencingEffortsView<Constants extends OrganismConstants> extends BaseView<
    DatasetAndVariantData,
    Constants,
    SequencingEffortsStateHandler
> {
    constructor(constants: Constants, defaultPageState: DatasetAndVariantData) {
        super(
            constants,
            new SequencingEffortsStateHandler(constants, defaultPageState),
            sequencingEffortsViewConstants,
        );
    }
}

export class GenericCompareVariantsView<Constants extends OrganismConstants> extends BaseView<
    CompareVariantsData,
    Constants,
    CompareVariantsPageStateHandler
> {
    constructor(constants: Constants, defaultPageState: CompareVariantsData) {
        super(
            constants,
            new CompareVariantsPageStateHandler(constants, defaultPageState),
            compareVariantsViewConstants,
        );
    }
}

export class GenericCompareToBaselineView<Constants extends OrganismConstants> extends BaseView<
    CompareToBaselineData,
    Constants,
    CompareToBaselineStateHandler
> {
    constructor(constants: Constants, defaultPageState: CompareToBaselineData) {
        super(
            constants,
            new CompareToBaselineStateHandler(constants, defaultPageState),
            compareToBaselineViewConstants,
        );
    }
}
