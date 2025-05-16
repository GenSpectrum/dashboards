import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';
import { getStringFromSearch, setSearchFromString } from '../helpers.ts';

export type LapisLocation = Record<string, string | undefined>;

export function parseLocationFiltersFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const locationFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'location');

    return (
        locationFilterConfigs?.reduce(
            (acc, config) => {
                const location = getLapisLocationFromSearch(search, config.locationFields);

                if (Object.keys(location).length === 0) {
                    return acc;
                }

                return {
                    ...acc,
                    [locationFieldsToFilterIdentifier(config.locationFields)]: location,
                };
            },
            {} as {
                [key: string]: LapisLocation | undefined;
            },
        ) ?? {}
    );
}

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

export function locationFieldsToFilterIdentifier(locationFields: string[]) {
    return locationFields.join(',');
}

export function setSearchFromLocationFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const locationFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'location');

    locationFilterConfigs?.forEach((config) => {
        const locationIdentifier = locationFieldsToFilterIdentifier(config.locationFields);

        config.locationFields.forEach((locationField) => {
            const datasetFilter = pageState.datasetFilter.locationFilters[locationIdentifier];
            const value = datasetFilter?.[locationField];

            setSearchFromString(search, locationField, value);
        });
    });
}

export const setSearchFromLocation = (search: URLSearchParams, location: LapisLocation) => {
    Object.entries(location).forEach(([field, value]) => setSearchFromString(search, field, value));
};
