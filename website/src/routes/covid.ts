import {
    type DateRange,
    type DateRangeOption,
    dateRangeToCustomDateRange,
    getDateRangeFromSearch,
    getIntegerFromSearch,
    getLapisLocation1FromSearch,
    getLapisMutationsQueryFromSearch,
    getStringFromSearch,
    type LapisFilter,
    type LapisLocation1,
    type LapisMutationQuery,
    setSearchFromDateRange,
    setSearchFromLapisLocation1,
    setSearchFromLapisMutationsQuery,
    setSearchFromString,
} from './helpers.ts';
import { organismConfig, Organisms, type View } from './View.ts';
import { type OrganismsConfig } from '../config.ts';

const pathFragment = organismConfig[Organisms.covid].pathFragment;

const earliestDate = '2020-01-06';
const today = new Date().toISOString().substring(0, 10);

class CovidConstants {
    constructor(organismsConfig: OrganismsConfig) {
        this.mainDateField = organismsConfig.covid.lapis.mainDateField;
    }

    public readonly organism = Organisms.covid as typeof Organisms.covid;
    public readonly locationFields = ['region', 'country', 'division'];
    public readonly defaultDateRange: DateRange = 'last6Months';
    public readonly earliestDate = '2020-01-06';
    public readonly customDateRangeOptions: DateRangeOption[] = [
        { label: '2024', dateFrom: '2024-01-01', dateTo: today },
        { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
        { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
        { label: '2021', dateFrom: '2024-01-04', dateTo: '2022-01-02' },
        { label: '2020', dateFrom: earliestDate, dateTo: '2021-01-03' },
    ];
    public readonly mainDateField: string;
}

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

export type CovidView1Route = {
    organism: typeof Organisms.covid;
    pathname: string;
    collectionId?: number;
    baselineFilter: {
        location: LapisLocation1;
        dateRange: DateRange;
    };
    variantFilter: LapisVariantQuery;
};

export class CovidView1 extends CovidConstants implements View<CovidView1Route> {
    public readonly pathname = `/${pathFragment}/single-variant` as const;
    public readonly label = 'Single variant';
    public readonly labelLong = 'Analyze a single variant';
    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
        variantFilter: { nextcladePangoLineage: 'JN.1*' },
    };

    parseUrl = (url: URL): CovidView1Route => {
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
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: getLapisLocation1FromSearch(search),
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            variantFilter,
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    toUrl = (route: CovidView1Route): string => {
        const search = new URLSearchParams();
        setSearchFromLapisLocation1(search, route.baselineFilter.location);
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
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
        return `${this.pathname}?${search}`;
    };

    public toLapisFilter = (route: CovidView1Route) => {
        return {
            ...this.toLapisFilterWithoutVariant(route),
            ...route.variantFilter,
        };
    };

    public toLapisFilterWithoutVariant = (route: CovidView1Route): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

export type CovidView2Route = {
    organism: typeof Organisms.covid;
    pathname: string;
    filters: CovidView2Filter[];
};

type CovidView2Filter = {
    id: number;
    baselineFilter: {
        location: LapisLocation1;
        dateRange: DateRange;
    };
    variantFilter: LapisVariantQuery;
};

export class CovidView2 extends CovidConstants implements View<CovidView2Route, CovidView2Route | undefined> {
    public readonly pathname = `/${pathFragment}/compare-side-by-side` as const;
    public readonly label = 'Compare side-by-side';
    public readonly labelLong = 'Compare variants side-by-side';

    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        filters: [
            {
                id: 1,
                baselineFilter: { location: {}, dateRange: this.defaultDateRange },
                variantFilter: { nextcladePangoLineage: 'JN.1*' },
            },
            {
                id: 2,
                baselineFilter: { location: {}, dateRange: this.defaultDateRange },
                variantFilter: { nextcladePangoLineage: 'XBB.1*' },
            },
        ],
    };

    public parseUrl = (url: URL): CovidView2Route | undefined => {
        const filterMap = new Map<number, CovidView2Filter>();
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
                    baselineFilter: { location: {}, dateRange: this.defaultDateRange },
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
                case this.mainDateField:
                    filter.baselineFilter.dateRange = getDateRangeFromSearch(search, key) ?? this.defaultDateRange;
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
            organism: this.organism,
            pathname: this.pathname,
            filters: [...filterMap.values()].sort((a, b) => a.id - b.id),
        };
    };

    public toUrl = (route: CovidView2Route): string => {
        const search = new URLSearchParams();
        for (const filter of route.filters) {
            const id = filter.id;
            Object.entries(filter.baselineFilter.location).forEach(([key, value]) => {
                if (value !== undefined) {
                    search.append(`${key}$${id}`, value);
                }
            });
            if (filter.baselineFilter.dateRange !== this.defaultDateRange) {
                setSearchFromDateRange(search, `${this.mainDateField}$${id}`, filter.baselineFilter.dateRange);
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
        return `${this.pathname}?${search}`;
    };

    public setFilter = (route: CovidView2Route, newFilter: CovidView2Filter): CovidView2Route => {
        const newRoute = {
            ...route,
            filters: route.filters.filter((route) => route.id !== newFilter.id),
        };
        newRoute.filters.push(newFilter);
        return newRoute;
    };

    public addEmptyFilter = (route: CovidView2Route): CovidView2Route => {
        const largestId = route.filters.length > 0 ? Math.max(...route.filters.map((route) => route.id)) : 0;
        return this.setFilter(route, {
            id: largestId + 1,
            // It is necessary to have at least one (non-default) filter.
            baselineFilter: {
                location: {
                    region: 'Europe',
                },
                dateRange: this.defaultDateRange,
            },
            variantFilter: {},
        });
    };

    public removeFilter(route: CovidView2Route, id: number): CovidView2Route {
        return {
            ...route,
            filters: route.filters.filter((route) => route.id !== id),
        };
    }

    public baselineFilterToLapisFilter = (filter: CovidView2Filter['baselineFilter']): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(filter.dateRange, new Date(earliestDate));
        return {
            ...filter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}

export type CovidView3Route = {
    organism: typeof Organisms.covid;
    pathname: string;
    collectionId?: number;
    baselineFilter: {
        location: LapisLocation1;
        dateRange: DateRange;
    };
};

export class CovidView3 extends CovidConstants implements View<CovidView3Route> {
    public readonly pathname = `/${pathFragment}/sequencing-efforts` as const;
    public readonly label = 'Sequencing efforts';
    public readonly labelLong = 'Sequencing efforts';
    public readonly defaultRoute = {
        organism: this.organism,
        pathname: this.pathname,
        baselineFilter: {
            location: {},
            dateRange: this.defaultDateRange,
        },
    };

    public parseUrl = (url: URL): CovidView3Route => {
        const search = url.searchParams;
        return {
            organism: this.organism,
            pathname: this.pathname,
            baselineFilter: {
                location: {
                    region: getStringFromSearch(search, 'region'),
                    country: getStringFromSearch(search, 'country'),
                    division: getStringFromSearch(search, 'division'),
                },
                dateRange: getDateRangeFromSearch(search, this.mainDateField) ?? this.defaultDateRange,
            },
            collectionId: getIntegerFromSearch(search, 'collectionId'),
        };
    };

    toUrl = (route: CovidView3Route): string => {
        const search = new URLSearchParams();
        (['region', 'country', 'division'] as const).forEach((field) =>
            setSearchFromString(search, field, route.baselineFilter.location[field]),
        );
        if (route.baselineFilter.dateRange !== this.defaultDateRange) {
            setSearchFromDateRange(search, this.mainDateField, route.baselineFilter.dateRange);
        }
        if (route.collectionId !== undefined) {
            search.set('collectionId', route.collectionId.toString());
        }
        return `${this.pathname}?${search}`;
    };

    toLapisFilter = (route: CovidView3Route): LapisFilter => {
        const dateRange = dateRangeToCustomDateRange(route.baselineFilter.dateRange, new Date(earliestDate));
        return {
            ...route.baselineFilter.location,
            [`${this.mainDateField}From`]: dateRange.from,
            [`${this.mainDateField}To`]: dateRange.to,
        };
    };
}
