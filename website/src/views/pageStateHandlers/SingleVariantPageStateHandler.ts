import type { DateRangeOption, LapisFilter } from '@genspectrum/dashboard-components/util';

import type { ExtendedConstants } from '../OrganismConstants.ts';
import { type DatasetAndVariantData, getLineageFilterFields } from '../View.ts';
import { singleVariantViewConstants } from '../ViewConstants.ts';
import {
    getDateRangeFromSearch,
    getLapisLocationFromSearch,
    getLapisVariantQuery,
    getStringFromSearch,
    type LapisLocation,
    setSearchFromDateRange,
    setSearchFromLapisVariantQuery,
    setSearchFromLocation,
    setSearchFromString,
} from '../helpers.ts';
import { type PageStateHandler, toLapisFilterFromVariant, toLapisFilterWithoutVariant } from './PageStateHandler.ts';
import { formatUrl } from '../../util/formatUrl.ts';

export class SingleVariantPageStateHandler<PageState extends DatasetAndVariantData = DatasetAndVariantData>
    implements PageStateHandler<DatasetAndVariantData>
{
    protected readonly pathname;

    constructor(
        protected readonly constants: ExtendedConstants,
        protected readonly defaultPageState: PageState,
        pathFragment: string,
    ) {
        this.pathname = `/${pathFragment}/${singleVariantViewConstants.pathFragment}`;
    }

    public parsePageStateFromUrl(url: URL): DatasetAndVariantData {
        const search = url.searchParams;

        const baselineFilterConfigs = this.constants.baselineFilterConfigs?.reduce(
            (acc, config) => {
                switch (config.type) {
                    case 'date': {
                        return {
                            ...acc,
                            [config.dateColumn]:
                                getDateRangeFromSearch(search, config.dateColumn, config.dateRangeOptions) ??
                                config.defaultDateRange,
                        };
                    }
                    case 'text': {
                        return { ...acc, [config.lapisField]: getStringFromSearch(search, config.lapisField) };
                    }
                }
            },
            {} as {
                [key: string]: DateRangeOption | string | undefined;
            },
        );

        return {
            datasetFilter: {
                location: getLapisLocationFromSearch(search, this.constants.locationFields),
                dateRange:
                    getDateRangeFromSearch(search, this.constants.mainDateField, this.constants.dateRangeOptions) ??
                    this.constants.defaultDateRange,
                ...baselineFilterConfigs,
            },
            variantFilter: getLapisVariantQuery(search, getLineageFilterFields(this.constants.lineageFilters)),
        };
    }

    public toUrl(pageState: DatasetAndVariantData): string {
        const search = new URLSearchParams();
        setSearchFromLocation(search, pageState.datasetFilter.location);
        if (JSON.stringify(pageState.datasetFilter.dateRange) !== JSON.stringify(this.constants.defaultDateRange)) {
            setSearchFromDateRange(search, this.constants.mainDateField, pageState.datasetFilter.dateRange);
        }
        this.constants.baselineFilterConfigs?.map((config) => {
            switch (config.type) {
                case 'date': {
                    const value = pageState.datasetFilter[config.dateColumn] as DateRangeOption | undefined;
                    if (JSON.stringify(value) !== JSON.stringify(config.defaultDateRange)) {
                        setSearchFromDateRange(search, config.dateColumn, value);
                    }
                    break;
                }
                case 'text': {
                    const value = pageState.datasetFilter[config.lapisField] as string | undefined;
                    setSearchFromString(search, config.lapisField, value);
                    break;
                }
            }
        });

        setSearchFromLapisVariantQuery(
            search,
            pageState.variantFilter,
            getLineageFilterFields(this.constants.lineageFilters),
        );
        return formatUrl(this.pathname, search);
    }

    public toLapisFilter(pageState: DatasetAndVariantData) {
        return {
            ...toLapisFilterWithoutVariant(pageState, this.constants),
            ...toLapisFilterFromVariant(pageState.variantFilter),
        };
    }

    public toLapisFilterWithoutVariant(pageState: DatasetAndVariantData): LapisFilter & LapisLocation {
        return toLapisFilterWithoutVariant(pageState, this.constants);
    }

    public getDefaultPageUrl() {
        return this.toUrl(this.defaultPageState);
    }
}
