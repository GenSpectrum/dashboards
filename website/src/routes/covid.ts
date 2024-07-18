import {
    type DateRange,
    type DateRangeOption,
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

const organism = 'covid' as const;
const locationFields = ['region', 'country', 'division'];

const defaultDateRange: DateRange = 'last6Months';
const earliestDate = '2020-01-06';
const today = new Date().toISOString().substring(0, 10);
const customDateRangeOptions = [
    { label: '2024', dateFrom: '2024-01-01', dateTo: today },
    { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
    { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
    { label: '2021', dateFrom: '2024-01-04', dateTo: '2022-01-02' },
    { label: '2020', dateFrom: earliestDate, dateTo: '2021-01-03' },
];

type Constants = {
    locationFields: string[];
    defaultDateRange: DateRange;
    earliestDate: string;
    customDateRangeOptions: DateRangeOption[];
};

const constants = { organism, locationFields, defaultDateRange, earliestDate, customDateRangeOptions };

type LapisSimpleVariantQuery = LapisMutationQuery & {
    nextcladePangoLineage?: string;
};

type LapisAdvancedVariantQuery = {
    variantQuery?: string;
};

type LapisVariantQuery = LapisSimpleVariantQuery | LapisAdvancedVariantQuery;

const isSimpleVariantQuery = (variantQuery: LapisVariantQuery): variantQuery is LapisSimpleVariantQuery => {
    return (
        'nucleotideMutations' in variantQuery ||
        'aminoAcidMutations' in variantQuery ||
        'nucleotideInsertions' in variantQuery ||
        'aminoAcidInsertions' in variantQuery ||
        'nextcladePangoLineage' in variantQuery
    );
};

const isAdvancedVariantQuery = (variantQuery: LapisVariantQuery): variantQuery is LapisAdvancedVariantQuery => {
    return 'variantQuery' in variantQuery;
};

export namespace CovidView1 {
    const pathname = `/${organism}/single-variant` as const;

    export type Route = {
        organism: typeof organism;
        pathname: string;
        collectionId?: number;
        baselineFilter: {
            location: LapisLocation1;
            dateRange: DateRange;
        };
        variantFilter: LapisVariantQuery;
    };

    const parseUrl = (url: URL): Route | undefined => {
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

    export type CovidView1 = View<Route> & Constants & {};

    export const view: CovidView1 = {
        ...constants,
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

    export const toLapisFilter = (
        route: Route,
    ): LapisLocation1 & { dateFrom: string; dateTo: string } & LapisVariantQuery => {
        return {
            ...toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    export const toLapisFilterWithoutVariant = (
        route: Route,
    ): LapisLocation1 & { dateFrom: string; dateTo: string } => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
        };
    };

    export const isEmptyVariantFilter = (filter: LapisVariantQuery): boolean => {
        if (isSimpleVariantQuery(filter)) {
            return (
                filter.nextcladePangoLineage === undefined &&
                (filter.nucleotideMutations?.length ?? 0) === 0 &&
                (filter.aminoAcidMutations?.length ?? 0) === 0 &&
                (filter.nucleotideInsertions?.length ?? 0) === 0 &&
                (filter.aminoAcidInsertions?.length ?? 0) === 0
            );
        }
        return filter.variantQuery === undefined;
    };
}

export namespace CovidView2 {
    const pathname = `/${organism}/compare-side-by-side` as const;

    export type Route = {
        organism: typeof organism;
        pathname: string;
        filters: Filter[];
    };

    type Filter = {
        id: number;
        baselineFilter: {
            location: LapisLocation1;
            dateRange: DateRange;
        };
        variantFilter: LapisVariantQuery;
    };

    const parseUrl = (url: URL): Route | undefined => {
        const filterMap = new Map<number, Filter>();
        const search = url.searchParams;
        for (const [key, value] of search) {
            const keySplit = key.split('$');
            if (keySplit.length !== 2) {
                return undefined;
            }
            const field = keySplit[0];
            const id = Number.parseInt(keySplit[1]);
            if (Number.isNaN(id)) {
                return undefined;
            }
            if (!filterMap.has(id)) {
                filterMap.set(id, {
                    id,
                    baselineFilter: { location: {}, dateRange: defaultDateRange },
                    variantFilter: {},
                });
            }
            const filter = filterMap.get(id)!;
            switch (field) {
                case 'region':
                case 'country':
                case 'division':
                    filter.baselineFilter.location[field] = value;
                    break;
                case 'date':
                    filter.baselineFilter.dateRange = getDateRangeFromSearch(search, key) ?? defaultDateRange;
                    break;
                case 'variantQuery':
                    if (isSimpleVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as LapisAdvancedVariantQuery)[field] = value;
                    break;
                case 'nextcladePangoLineage':
                    if (isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as LapisSimpleVariantQuery)[field] = value;
                    break;
                case 'nucleotideMutations':
                case 'aminoAcidMutations':
                case 'nucleotideInsertions':
                case 'aminoAcidInsertions':
                    if (isAdvancedVariantQuery(filter.variantFilter)) {
                        return undefined;
                    }
                    (filter.variantFilter as LapisSimpleVariantQuery)[field] = value.split(',');
                    break;
                default:
                    return undefined;
            }
        }

        return {
            organism,
            pathname,
            filters: [...filterMap.values()].sort((a, b) => a.id - b.id),
        };
    };

    const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        for (const filter of route.filters) {
            const id = filter.id;
            Object.entries(filter.baselineFilter.location).forEach(([key, value]) => {
                if (value !== undefined) {
                    search.append(`${key}$${id}`, value);
                }
            });
            if (filter.baselineFilter.dateRange !== defaultDateRange) {
                setSearchFromDateRange(search, `date$${id}`, filter.baselineFilter.dateRange);
            }
            Object.entries(filter.variantFilter).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        search.append(`${key}$${id}`, value.join(','));
                    }
                } else {
                    if (value !== undefined && value.length > 0) {
                        search.append(`${key}$${id}`, value);
                    }
                }
            });
        }
        return `${pathname}?${search}`;
    };

    export type CovidView2 = View<Route> & Constants & {};

    export const view: CovidView2 = {
        ...constants,
        pathname,
        label: 'Compare side-by-side',
        labelLong: 'Compare variants side-by-side',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            filters: [
                {
                    id: 1,
                    baselineFilter: { location: {}, dateRange: defaultDateRange },
                    variantFilter: { nextcladePangoLineage: 'JN.1*' },
                },
                {
                    id: 2,
                    baselineFilter: { location: {}, dateRange: defaultDateRange },
                    variantFilter: { nextcladePangoLineage: 'XBB.1*' },
                },
            ],
        },
    };

    export const setFilter = (route: Route, newFilter: Filter): Route => {
        const newRoute = {
            ...route,
            filters: route.filters.filter((route) => route.id !== newFilter.id),
        };
        newRoute.filters.push(newFilter);
        return newRoute;
    };

    export const addEmptyFilter = (route: Route): Route => {
        const largestId = route.filters.length > 0 ? Math.max(...route.filters.map((route) => route.id)) : 0;
        return setFilter(route, {
            id: largestId + 1,
            // It is necessary to have at least one (non-default) filter.
            baselineFilter: {
                location: {
                    region: 'Europe',
                },
                dateRange: defaultDateRange,
            },
            variantFilter: {},
        });
    };

    export const removeFilter = (route: Route, id: number): Route => {
        return {
            ...route,
            filters: route.filters.filter((route) => route.id !== id),
        };
    };

    export const baselineFilterToLapisFilter = (filter: Filter['baselineFilter']) => {
        const dateRange = dateRangeToCustomDateRange(filter.dateRange, new Date(earliestDate));
        return {
            ...filter.location,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
        };
    };
}

export namespace CovidView3 {
    const pathname = `/${organism}/sequencing-efforts` as const;

    export type Route = {
        organism: typeof organism;
        pathname: string;
        collectionId?: number;
        baselineFilter: {
            location: LapisLocation1;
            dateRange: DateRange;
        };
    };

    export const parseUrl = (url: URL): Route | undefined => {
        const search = url.searchParams;
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
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        (['region', 'country', 'division'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter.location[field]),
        );
        if (route.baselineFilter.dateRange !== defaultDateRange) {
            setSearchFromDateRange(search, 'date', route.baselineFilter.dateRange);
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${pathname}?${search}`;
    };

    export type CovidView3 = View<Route> & Constants & {};

    export const view: CovidView3 = {
        ...constants,
        pathname,
        label: 'Sequencing efforts',
        labelLong: 'Sequencing efforts',
        parseUrl,
        toUrl,
        defaultRoute: {
            organism,
            pathname,
            baselineFilter: {
                location: {},
                dateRange: defaultDateRange,
            },
        },
    };

    export const toLapisFilter = (route: Route) => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            dateFrom: dateRange.from,
            dateTo: dateRange.to,
        };
    };
}
