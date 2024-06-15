export type SpecialDateRange = 'allTimes' | 'last2Weeks' | 'lastMonth' | 'last2Months' | 'last3Months' | 'last6Months';

export type CustomDateRange = {
    from: string;
    to: string;
};

export type DateRange = SpecialDateRange | CustomDateRange;

export type DateRangeOption = {
    label: string;
    dateFrom: string;
    dateTo: string;
};

export const isCustomDateRange = (dateRange: DateRange): dateRange is CustomDateRange => {
    return typeof dateRange === 'object' && 'from' in dateRange;
};

export const dateRangeToCustomDateRange = (dateRange: DateRange, allTimesStartDate: Date): CustomDateRange => {
    if (isCustomDateRange(dateRange)) {
        return dateRange;
    }

    const toDate = new Date();
    let fromDate = new Date();

    switch (dateRange) {
        case 'allTimes':
            fromDate = allTimesStartDate;
            break;
        case 'last2Weeks':
            fromDate.setDate(toDate.getDate() - 14);
            break;
        case 'lastMonth':
            fromDate.setMonth(toDate.getMonth() - 1);
            break;
        case 'last2Months':
            fromDate.setMonth(toDate.getMonth() - 2);
            break;
        case 'last3Months':
            fromDate.setMonth(toDate.getMonth() - 3);
            break;
        case 'last6Months':
            fromDate.setMonth(toDate.getMonth() - 6);
            break;
    }

    return {
        from: fromDate.toISOString().substring(0, 10),
        to: toDate.toISOString().substring(0, 10),
    };
};

export const chooseGranularityBasedOnDateRange = (dateRange: CustomDateRange): 'day' | 'week' | 'month' | 'year' => {
    const daysBetween = (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween > 365 * 5) {
        return 'year';
    }
    if (daysBetween > 365 * 2) {
        return 'month';
    }
    if (daysBetween > 90) {
        return 'week';
    }
    return 'day';
};

/**
 * Sets the string to the search params if the string is not empty, not undefined and not null
 */
export const setSearchFromString = (search: URLSearchParams, name: string, string: string | undefined | null) => {
    if (string) {
        search.set(name, string);
    }
};

/**
 * Sets the array to the search params via comma-separation if the array is not empty, not undefined and not null
 */
export const setSearchFromStringArray = (search: URLSearchParams, name: string, array: string[] | undefined | null) => {
    if (array && array.length > 0) {
        search.set(name, array.join(','));
    }
};

export const setSearchFromDateRange = (
    search: URLSearchParams,
    name: string,
    dateRange: DateRange | undefined | null,
) => {
    if (dateRange) {
        let serializedValue: string;
        if (isCustomDateRange(dateRange)) {
            serializedValue = `${dateRange.from}--${dateRange.to}`;
        } else {
            serializedValue = dateRange;
        }
        search.set(name, serializedValue);
    }
};

export const getStringFromSearch = (search: URLSearchParams, name: string): string | undefined => {
    return search.get(name) ?? undefined;
};

export const getStringArrayFromSearch = (search: URLSearchParams, name: string): string[] | undefined => {
    return search.get(name)?.split(',') ?? undefined;
};

export const getIntegerFromSearch = (search: URLSearchParams, name: string): number | undefined => {
    const value = search.get(name);
    return value !== null ? Number.parseInt(value, 10) : undefined;
};

export const getDateRangeFromSearch = (search: URLSearchParams, name: string): DateRange | undefined => {
    const value = search.get(name);
    if (value === null) {
        return undefined;
    }
    if (value.includes('--')) {
        // TODO Properly validate the value
        const split = value.split('--');
        return {
            from: split[0],
            to: split[1],
        };
    }
    // TODO Properly validate the value
    return value as SpecialDateRange;
};

/**
 * This format is commonly used by Nextstrain.
 */
export type LapisLocation1 = {
    region?: string;
    country?: string;
    division?: string;
};

export const getLapisLocation1FromSearch = (search: URLSearchParams): LapisLocation1 => {
    return {
        region: getStringFromSearch(search, 'region'),
        country: getStringFromSearch(search, 'country'),
        division: getStringFromSearch(search, 'division'),
    };
};

export const setSearchFromLapisLocation1 = (search: URLSearchParams, location: LapisLocation1) => {
    (['region', 'country', 'division'] as const).forEach((field) =>
        setSearchFromString(search, field, location[field]),
    );
};

/**
 * This format is supported by PHA4GE.
 */
export type LapisLocation2 = {
    geo_loc_country?: string;
    geo_loc_admin_1?: string;
};

export const getLapisLocation2FromSearch = (search: URLSearchParams): LapisLocation2 => {
    return {
        geo_loc_country: getStringFromSearch(search, 'geo_loc_country'),
        geo_loc_admin_1: getStringFromSearch(search, 'geo_loc_admin_1'),
    };
};

export const setSearchFromLapisLocation2 = (search: URLSearchParams, location: LapisLocation2) => {
    (['geo_loc_country', 'geo_loc_admin_1'] as const).forEach((field) =>
        setSearchFromString(search, field, location[field]),
    );
};

export type LapisMutationQuery = {
    nucleotideMutations?: string[];
    aminoAcidMutations?: string[];
    nucleotideInsertions?: string[];
    aminoAcidInsertions?: string[];
};

export type LapisVariantQuery1 = LapisMutationQuery & {
    lineage?: string;
};

export type LapisVariantQuery2 = LapisVariantQuery1 & {
    clade?: string;
};

export const getLapisMutationsQueryFromSearch = (search: URLSearchParams): LapisMutationQuery => {
    return {
        nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
        aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
        nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
        aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
    };
};

export const getLapisVariantQuery1FromSearch = (search: URLSearchParams): LapisVariantQuery1 => {
    return {
        ...getLapisMutationsQueryFromSearch(search),
        lineage: getStringFromSearch(search, 'lineage'),
    };
};

export const getLapisVariantQuery2FromSearch = (search: URLSearchParams): LapisVariantQuery2 => {
    return {
        ...getLapisVariantQuery1FromSearch(search),
        clade: getStringFromSearch(search, 'clade'),
    };
};

export const setSearchFromLapisMutationsQuery = (search: URLSearchParams, query: LapisMutationQuery) => {
    (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
        (field) => setSearchFromStringArray(search, field, query[field]),
    );
};

export const setSearchFromLapisVariantQuery1 = (search: URLSearchParams, query: LapisVariantQuery1) => {
    setSearchFromLapisMutationsQuery(search, query);
    setSearchFromString(search, 'lineage', query.lineage);
};

export const setSearchFromLapisVariantQuery2 = (search: URLSearchParams, query: LapisVariantQuery2) => {
    setSearchFromLapisVariantQuery1(search, query);
    setSearchFromString(search, 'clade', query.clade);
};

export type SampleCollectionDateFromTo = {
    sample_collection_dateFrom: string;
    sample_collection_dateTo: string;
};
