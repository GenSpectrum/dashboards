import type { SequencingEffortsConstants } from '../OrganismConstants.ts';
import type { Dataset } from '../View.ts';
import { sequencingEffortsViewConstants } from '../ViewConstants.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    setSearchFromDateRange,
    setSearchFromLocation,
} from '../helpers.ts';
import { type PageStateHandler, toLapisFilterWithoutVariant } from './PageStateHandler.ts';

export class SequencingEffortsStateHandler implements PageStateHandler<Dataset> {
    protected readonly pathname;

    constructor(
        protected readonly constants: SequencingEffortsConstants,
        protected readonly defaultPageState: Dataset,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${sequencingEffortsViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): Dataset {
        const search = url.searchParams;
        return {
            datasetFilter: {
                location: getLapisLocationFromSearch(search, this.constants.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                    this.constants.defaultDateRange,
            },
        };
    }

    public toUrl(pageState: Dataset): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.datasetFilter.location);
        if (pageState.datasetFilter.dateRange !== this.constants.defaultDateRange) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }
        return `${this.pathname}?${search}`;
    }

    public getDefaultPageUrl(): string {
        return this.toUrl(this.defaultPageState);
    }

    public toLapisFilter(pageState: Dataset) {
        return toLapisFilterWithoutVariant(pageState, this.constants);
    }
}
