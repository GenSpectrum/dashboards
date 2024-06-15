import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisLocation1FromSearch,
    getLapisMutationsQueryFromSearch,
    getStringFromSearch,
    type LapisLocation1,
    type LapisMutationQuery,
    setSearchFromDateRange,
    setSearchFromLapisLocation1,
    setSearchFromLapisMutationsQuery,
    setSearchFromString,
} from './helpers.ts';
import type { View } from './View.ts';

export namespace CovidView1 {
    const organism = 'covid' as const;
    const pathname = `/${organism}/single-variant` as const;
    type Pathname = typeof pathname;
    const defaultDateRange: DateRange = 'last6Months';
    export const earliestDate = '2020-01-06';

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        collectionId?: number;
        baselineFilter: {
            location: LapisLocation1;
            dateRange: DateRange;
        };
        variantFilter: LapisVariantQuery;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
        let variantFilter: LapisSimpleVariantQuery | LapisAdvancedVariantQuery = {};
        const advancedVariantQuery = search.get('variantQuery');
        if (advancedVariantQuery) {
            variantFilter = { variantQuery: advancedVariantQuery };
        } else {
            variantFilter = {
                ...getLapisMutationsQueryFromSearch(search),
                nextcladePangoLineage: getStringFromSearch(search, 'nextcladePangoLineage'),
            };
        }
        return {
            organism,
            pathname,
            baselineFilter: {
                location: getLapisLocation1FromSearch(search),
                dateRange: getDateRangeFromSearch(search, 'date') ?? defaultDateRange,
            },
            variantFilter,
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation1(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'date', route.baselineFilter.dateRange);
        }
        const variantFilter = route.variantFilter;
        if (isAdvancedVariantQuery(variantFilter)) {
            setSearchFromString(search, 'variantQuery', variantFilter.variantQuery);
        } else if (isSimpleVariantQuery(variantFilter)) {
            setSearchFromString(search, 'nextcladePangoLineage', variantFilter.nextcladePangoLineage);
            setSearchFromLapisMutationsQuery(search, variantFilter);
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${pathname}?${search}`;
    };

    export const view: View<Route> = {
        organism,
        pathname,
        label: 'Single variant',
        labelLong: 'Analyze a single variant',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            baselineFilter: {
                location: {},
                dateRange: defaultDateRange,
            },
            variantFilter: { nextcladePangoLineage: 'JN.1*' },
        },
    };

    export const toLapisFilter = (route: Route) => {
        return {
            ...toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    export const toLapisFilterWithoutVariant = (route: Route) => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(CovidView1.earliestDate));
        return {
            ...route.baselineFilter.location,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
        };
    };

    export type LapisSimpleVariantQuery = LapisMutationQuery & {
        nextcladePangoLineage?: string;
    };

    export type LapisAdvancedVariantQuery = {
        variantQuery?: string;
    };

    export type LapisVariantQuery = LapisSimpleVariantQuery | LapisAdvancedVariantQuery;

    export const isSimpleVariantQuery = (variantQuery: LapisVariantQuery): variantQuery is LapisSimpleVariantQuery => {
        return (
            'nucleotideMutations' in variantQuery ||
            'aminoAcidMutations' in variantQuery ||
            'nucleotideInsertions' in variantQuery ||
            'aminoAcidInsertions' in variantQuery ||
            'nextcladePangoLineage' in variantQuery
        );
    };

    export const isAdvancedVariantQuery = (
        variantQuery: LapisVariantQuery,
    ): variantQuery is LapisAdvancedVariantQuery => {
        return 'variantQuery' in variantQuery;
    };
}
