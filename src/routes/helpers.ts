export type SpecialDateRange = 'allTimes' | 'last2Weeks' | 'lastMonth' | 'last2Months' | 'last3Months' | 'last6Months';

export type CustomDateRange = {
    from: string;
    to: string;
};

export type DateRange = SpecialDateRange | CustomDateRange;

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
