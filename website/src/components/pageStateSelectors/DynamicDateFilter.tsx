import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React from 'react';

import { Loading } from '../../util/Loading';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter';
import { withQueryProvider } from '../subscriptions/backendApi/withQueryProvider';

function DynamicDateFilterInner({
    label,
    lapis,
    dateFieldName,
    baselineOptions,
    value,
    onChange,
}: {
    label: string;
    lapis: string;
    dateFieldName: string;
    baselineOptions: DateRangeOption[];
    value: DateRangeOption | undefined;
    onChange: (newValue: DateRangeOption | undefined) => void;
}) {
    const {
        data: dateRange,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ['dateRange', lapis, dateFieldName],
        queryFn: () => fetchDateRange(lapis, dateFieldName),
    });

    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>{label}</span>
            </div>
            {isPending ? (
                <div className='h-20'>
                    <Loading />
                </div>
            ) : isError ? (
                <div className='flex h-20 items-center'>
                    Failed to load date range: {error instanceof Error ? error.message : String(error)}
                </div>
            ) : (
                <GsDateRangeFilter
                    lapisDateField='sampling_date'
                    onDateRangeChange={(dateRange: DateRangeOption | null) => onChange(dateRange ?? undefined)}
                    value={value}
                    dateRangeOptions={filteredOptions(baselineOptions, dateRange.start, dateRange.end)}
                />
            )}
        </label>
    );
}

/**
 * The `DynamicDateFilter` computes the available date range options dynamically,
 * based on the available dates in the data, for the given LAPIS and field name.
 */
export const DynamicDateFilter = withQueryProvider(DynamicDateFilterInner);

async function fetchDateRange(baseUrl: string, fieldName: string): Promise<{ start: string; end: string }> {
    const url = `${baseUrl.replace(/\/$/, '')}/sample/aggregated`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            'accept': 'application/json',
        },
        body: JSON.stringify({
            fields: [fieldName],
            orderBy: [fieldName],
        }),
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json: { data: Record<string, string>[] } = await res.json();
    if (!json.data.length) throw new Error('No data returned');

    return {
        start: json.data[0][fieldName],
        end: json.data[json.data.length - 1][fieldName],
    };
}

/**
 * Returns only the options from the given list of baseline options, that have at least
 * partial overlap with the given date range (start, end).
 */
function filteredOptions(baselineOptions: DateRangeOption[], start: string, end: string) {
    const startDate = dayjs(start);
    const endDate = dayjs(end);

    return baselineOptions.filter(({ dateFrom, dateTo }) => {
        const from = dayjs(dateFrom);
        const to = dayjs(dateTo);
        return !((dateTo !== undefined && to.isBefore(startDate)) || (dateFrom !== undefined && from.isAfter(endDate)));
    });
}
