import dayjs from 'dayjs';

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

export function getTodayString(): string {
    return dayjs().format('YYYY-MM-DD');
}

export type LapisFilter = Record<string, string | number | null | boolean | string[]>;

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
        from: dayjs(fromDate).format('YYYY-MM-DD'),
        to: dayjs(toDate).format('YYYY-MM-DD'),
    };
};

export const chooseGranularityBasedOnDateRange = (
    dateRange: DateRange,
    allTimesStartDate: Date,
): 'day' | 'week' | 'month' | 'year' => {
    if (!isCustomDateRange(dateRange)) {
        dateRange = dateRangeToCustomDateRange(dateRange, allTimesStartDate);
    }

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
 * Sets the value to the search params if the value is not empty, not undefined and not null
 */
export const setSearchFromString = (search: URLSearchParams, name: string, value: string | undefined | null) => {
    if (value !== null && value !== undefined && value !== '') {
        search.set(name, value);
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
    if (dateRange !== null && dateRange !== undefined) {
        let serializedValue: string;
        if (isCustomDateRange(dateRange)) {
            serializedValue = `${dateRange.from}--${dateRange.to}`;
        } else {
            serializedValue = dateRange;
        }
        search.set(name, serializedValue);
    }
};

export const getStringFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
): string | undefined => {
    return search.get(name) ?? undefined;
};

export const getStringArrayFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
): string[] | undefined => {
    return search.get(name)?.split(',') ?? undefined;
};

export const getIntegerFromSearch = (search: URLSearchParams, name: string): number | undefined => {
    const value = search.get(name);
    return value !== null ? Number.parseInt(value, 10) : undefined;
};

export const getDateRangeFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
): DateRange | undefined => {
    const value = search.get(name);
    if (value === null || value === undefined) {
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

export type LapisLocation = Record<string, string>;

export const getLapisLocationFromSearch = (
    search: URLSearchParams | Map<string, string>,
    locationFields: string[],
): LapisLocation => {
    const location: Record<string, string> = {};
    locationFields.forEach((field) => {
        const value = getStringFromSearch(search, field);
        if (value !== undefined) {
            location[field] = value;
        }
    });
    return location;
};

export const setSearchFromLocation = (search: URLSearchParams, location: LapisLocation) => {
    Object.entries(location).forEach(([field, value]) => setSearchFromString(search, field, value));
};

export type LapisMutationQuery = {
    nucleotideMutations?: string[];
    aminoAcidMutations?: string[];
    nucleotideInsertions?: string[];
    aminoAcidInsertions?: string[];
};

export const lineageKey = 'lineage';
export const cladeKey = 'clade';

export type LapisVariantQuery = LapisMutationQuery & {
    [lineageKey]?: string;
    [cladeKey]?: string;
};

export type LapisCovidVariantQuery = LapisVariantQuery & {
    variantQuery?: string;
};

export const getLapisMutations = (query: LapisMutationQuery): LapisMutationQuery => {
    return {
        nucleotideMutations: getArrayPropertyOrEmpty(query, 'nucleotideMutations'),
        aminoAcidMutations: getArrayPropertyOrEmpty(query, 'aminoAcidMutations'),
        nucleotideInsertions: getArrayPropertyOrEmpty(query, 'nucleotideInsertions'),
        aminoAcidInsertions: getArrayPropertyOrEmpty(query, 'aminoAcidInsertions'),
    };
};

const getArrayPropertyOrEmpty = (query: LapisMutationQuery, name: keyof LapisMutationQuery): string[] => {
    return Array.isArray(query[name]) ? query[name] : [];
};

export const getLapisMutationsQueryFromSearch = (search: URLSearchParams | Map<string, string>): LapisMutationQuery => {
    return {
        nucleotideMutations: getStringArrayFromSearch(search, 'nucleotideMutations'),
        aminoAcidMutations: getStringArrayFromSearch(search, 'aminoAcidMutations'),
        nucleotideInsertions: getStringArrayFromSearch(search, 'nucleotideInsertions'),
        aminoAcidInsertions: getStringArrayFromSearch(search, 'aminoAcidInsertions'),
    };
};

export const getLapisVariantQuery = (
    search: URLSearchParams | Map<string, string>,
    lineageIdentifier: string,
    cladeIdentifier?: string,
): LapisVariantQuery => {
    return {
        ...getLapisMutationsQueryFromSearch(search),
        [lineageKey]: getStringFromSearch(search, lineageIdentifier),
        [cladeKey]: cladeIdentifier !== undefined ? getStringFromSearch(search, cladeIdentifier) : undefined,
    };
};

export const setSearchFromLapisMutationsQuery = (search: URLSearchParams, query: LapisMutationQuery) => {
    (['nucleotideMutations', 'aminoAcidMutations', 'nucleotideInsertions', 'aminoAcidInsertions'] as const).forEach(
        (field) => setSearchFromStringArray(search, field, query[field]),
    );
};

export const setSearchFromLapisVariantQuery = (
    search: URLSearchParams,
    query: LapisCovidVariantQuery,
    lineageIdentifier: string,
    cladeIdentifier?: string,
) => {
    setSearchFromLapisMutationsQuery(search, query);
    setSearchFromString(search, lineageIdentifier, query.lineage);
    if (cladeIdentifier !== undefined) {
        setSearchFromString(search, cladeIdentifier, query.clade);
    }
};

export const getLapisCovidVariantQuery = (
    search: URLSearchParams | Map<string, string>,
    lineageIdentifier: string,
    cladeIdentifier?: string,
): LapisCovidVariantQuery => {
    const query = getLapisVariantQuery(search, lineageIdentifier, cladeIdentifier);
    const variantQuery = getStringFromSearch(search, 'variantQuery');
    if (variantQuery !== undefined) {
        return {
            ...query,
            variantQuery,
        };
    }

    return {
        ...query,
    };
};

export const setSearchFromLapisCovidVariantQuery = (
    search: URLSearchParams,
    query: LapisCovidVariantQuery,
    lineageIdentifier: string,
    cladeIdentifier?: string,
) => {
    setSearchFromLapisVariantQuery(search, query, lineageIdentifier, cladeIdentifier);
    setSearchFromString(search, 'variantQuery', query.variantQuery);
};

export function getLocationSubdivision(locationFields: string[], locationFilter: Record<string, string>) {
    if (locationFields.length <= 1) {
        return { label: '', field: undefined };
    }

    for (let i = locationFields.length - 1; i >= 0; i--) {
        const field = locationFields[i];

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- We need to check for undefined
        if (locationFilter[field] !== undefined) {
            const locationOneLevelUp = locationFields[i + 1];
            if (locationOneLevelUp) {
                return { label: getLocationLabel(locationOneLevelUp), field: locationOneLevelUp };
            }

            return { label: '', field: undefined };
        }
    }

    return {
        label: getLocationLabel(locationFields[0]),
        field: locationFields[0],
    };
}

function getLocationLabel(field: string) {
    if (field.toLowerCase().includes('country')) {
        return 'Country';
    }
    return 'Geographic sub-divisions';
}
