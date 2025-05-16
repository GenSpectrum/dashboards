import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';
import { getStringFromSearch, setSearchFromString } from '../helpers.ts';

export function parseTextFiltersFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const textFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'text');

    return (
        textFilterConfigs?.reduce(
            (acc, config) => {
                const value = getStringFromSearch(search, config.lapisField);
                if (value === undefined) {
                    return acc;
                }

                return {
                    ...acc,
                    [config.lapisField]: getStringFromSearch(search, config.lapisField),
                };
            },
            {} as {
                [key: string]: string | undefined;
            },
        ) ?? {}
    );
}

export function setSearchFromTextFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const textFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'text');

    textFilterConfigs?.forEach((config) => {
        const value = pageState.datasetFilter.textFilters[config.lapisField];
        setSearchFromString(search, config.lapisField, value);
    });
}
