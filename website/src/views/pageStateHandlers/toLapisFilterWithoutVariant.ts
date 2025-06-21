import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import type { Dataset } from '../View.ts';

export function toLapisFilterWithoutVariant(
    pageState: Dataset,
    additionalFilters: Record<string, string> | undefined,
): LapisFilter {
    const dateFilters = Object.entries(pageState.datasetFilter.dateFilters).reduce(
        (acc, [lapisField, dateRange]) => {
            if (dateRange === undefined || dateRange === null) {
                return acc;
            }

            const fromValue = dateRange.dateFrom !== undefined ? { [`${lapisField}From`]: dateRange.dateFrom } : {};
            const toValue = dateRange.dateTo !== undefined ? { [`${lapisField}To`]: dateRange.dateTo } : {};

            return {
                ...acc,
                ...fromValue,
                ...toValue,
            };
        },
        {} as { [key: string]: string | undefined },
    );

    const textFilters = Object.entries(pageState.datasetFilter.textFilters).reduce(
        (acc, [lapisField, text]) => {
            if (text === undefined) {
                return acc;
            }

            return {
                ...acc,
                [lapisField]: text,
            };
        },
        {} as { [key: string]: string | undefined },
    );

    const locationFilters = Object.values(pageState.datasetFilter.locationFilters).reduce(
        (acc, lapisLocation) => {
            if (lapisLocation === undefined) {
                return acc;
            }

            return {
                ...acc,
                ...lapisLocation,
            };
        },
        {} as { [key: string]: string | undefined },
    );

    const numberRangeFilters = Object.entries(pageState.datasetFilter.numberFilters).reduce(
        (acc, [lapisField, numberRange]) => {
            if (numberRange === undefined) {
                return acc;
            }

            const fromValue = numberRange.min !== undefined ? { [`${lapisField}From`]: numberRange.min } : {};
            const toValue = numberRange.max !== undefined ? { [`${lapisField}To`]: numberRange.max } : {};

            return {
                ...acc,
                ...fromValue,
                ...toValue,
            };
        },
        {} as { [key: string]: number | undefined },
    );

    const advancedQuery = pageState.datasetFilter.advancedQuery
        ? { advancedQuery: pageState.datasetFilter.advancedQuery }
        : {};

    return {
        ...locationFilters,
        ...dateFilters,
        ...textFilters,
        ...numberRangeFilters,
        ...additionalFilters,
        ...advancedQuery,
    };
}
