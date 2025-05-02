import type { NumberRange } from '@genspectrum/dashboard-components/util';

import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';

export function parseNumberRangeFilterFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const numberRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'number');

    return (
        numberRangeFilterConfigs?.reduce(
            (acc, config) => {
                const numberRange = getNumberRangeFromSearch(search, config.lapisField);
                if (numberRange === undefined) {
                    return acc;
                }

                return {
                    ...acc,
                    [config.lapisField]: numberRange,
                };
            },
            {} as {
                [key: string]: NumberRange | undefined;
            },
        ) ?? {}
    );
}

export function getNumberRangeFromSearch(
    search: URLSearchParams | Map<string, string>,
    name: string,
): NumberRange | undefined {
    const minString = search.get(`${name}From`);
    const maxString = search.get(`${name}To`);

    const min = minString ? Number(minString) : undefined;
    const max = maxString ? Number(maxString) : undefined;

    const minIsFinite = Number.isFinite(min);
    const maxIsFinite = Number.isFinite(max);

    if (minIsFinite || maxIsFinite) {
        return {
            min: minIsFinite ? min : undefined,
            max: maxIsFinite ? max : undefined,
        };
    }

    return undefined;
}

export function setSearchFromNumberRangeFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const numberRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'number');

    numberRangeFilterConfigs?.forEach((config) => {
        const value = pageState.datasetFilter.numberFilters[config.lapisField];
        setSearchFromNumberRange(search, config.lapisField, value);
    });
}

export function setSearchFromNumberRange(search: URLSearchParams, name: string, numberRange: NumberRange | undefined) {
    if (numberRange !== undefined) {
        if (numberRange.min !== undefined) {
            search.set(`${name}From`, String(numberRange.min));
        }
        if (numberRange.max !== undefined) {
            search.set(`${name}To`, String(numberRange.max));
        }
    }
}
