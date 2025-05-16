import type { DateRangeOption } from '@genspectrum/dashboard-components/util';

import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import { CustomDateRangeLabel } from '../../types/DateWindow.ts';
import type { Dataset } from '../View.ts';

export function parseDateRangesFromUrl(
    search: URLSearchParams | Map<string, string>,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const dateRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'date');

    return (
        dateRangeFilterConfigs?.reduce(
            (acc, config) => {
                const dateRange = getDateRangeFromSearch(search, config.dateColumn, config.dateRangeOptions);
                if (dateRange === undefined) {
                    return acc;
                }

                return {
                    ...acc,
                    [config.dateColumn]: dateRange,
                };
            },
            {} as {
                [key: string]: DateRangeOption | undefined;
            },
        ) ?? {}
    );
}

export const getDateRangeFromSearch = (
    search: URLSearchParams | Map<string, string>,
    name: string,
    dateRangeOptions: DateRangeOption[],
): DateRangeOption | undefined => {
    const value = search.get(name);
    if (value === null || value === undefined) {
        return undefined;
    }
    const customDateRange = dateRangeOptions.find((option) => option.label === value);
    if (customDateRange !== undefined) {
        return customDateRange;
    }

    if (value.includes('--')) {
        const split = value.split('--');
        return {
            label: CustomDateRangeLabel,
            dateFrom: split[0],
            dateTo: split[1],
        };
    }
    return undefined;
};

export function setSearchFromDateFilters(
    search: URLSearchParams,
    pageState: Dataset,
    baselineFilterConfigs: BaselineFilterConfig[] | undefined,
) {
    const dateRangeFilterConfigs = baselineFilterConfigs?.filter((config) => config.type === 'date');

    dateRangeFilterConfigs?.forEach((config) => {
        const value = pageState.datasetFilter.dateFilters[config.dateColumn];
        setSearchFromDateRange(search, config.dateColumn, value);
    });
}

export const setSearchFromDateRange = (
    search: URLSearchParams,
    name: string,
    dateRange: DateRangeOption | undefined | null,
) => {
    if (dateRange !== null && dateRange !== undefined) {
        let serializedValue: string;
        if (dateRange.label === CustomDateRangeLabel) {
            serializedValue = `${dateRange.dateFrom ?? ''}--${dateRange.dateTo ?? ''}`;
        } else {
            serializedValue = dateRange.label;
        }
        search.set(name, serializedValue);
    }
};
