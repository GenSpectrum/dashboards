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
