import {
    type DateRange,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getStringArrayFromSearch,
    getStringFromSearch,
    setSearchFromDateRange,
    setSearchFromString,
    setSearchFromStringArray,
} from './helpers.ts';
import type { View } from './View.ts';

export namespace CovidView1 {
    export const organism = 'covid' as const;
    export const pathname = `/${organism}/single-variant` as const;
    export type Pathname = typeof pathname;
    export const defaultDateRange: DateRange = 'last6Months';
    export const earliestDate = '2020-01-06';

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
        collectionId?: number;
        baselineFilter: {
            location: LapisLocation;
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
                nextcladePangoLineage: getStringFromSearch(search, 'nextcladePangoLineage'),
                nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
                aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
                nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
                aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
            };
        }
        return {
            organism,
            pathname,
            baselineFilter: {
                location: {
                    region: getStringFromSearch(search, 'region'),
                    country: getStringFromSearch(search, 'country'),
                    division: getStringFromSearch(search, 'division'),
                },
                dateRange: getDateRangeFromSearch(search, 'date') ?? defaultDateRange,
            },
            variantFilter,
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['region', 'country', 'division'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter.location[field]),
        );
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'date', route.baselineFilter.dateRange);
        }
        const variantFilter = route.variantFilter;
        if (isAdvancedVariantQuery(variantFilter)) {
            setSearchFromString(search, 'variantQuery', variantFilter.variantQuery);
        } else if (isSimpleVariantQuery(variantFilter)) {
            setSearchFromString(search, 'nextcladePangoLineage', variantFilter.nextcladePangoLineage);
            (
                ['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const
            ).forEach((field) => setSearchFromStringArray(search, field, variantFilter[field]));
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

    export type LapisLocation = {
        region?: string;
        country?: string;
        division?: string;
    };

    export type LapisSimpleVariantQuery = {
        nextcladePangoLineage?: string;
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    };

    export type LapisAdvancedVariantQuery = {
        variantQuery?: string;
    };

    export type LapisVariantQuery = LapisSimpleVariantQuery | LapisAdvancedVariantQuery;

    export type LapisFilter = LapisLocation & LapisVariantQuery;

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
