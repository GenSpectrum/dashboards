import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import React from 'react';
import { useEffect, useState } from 'react';

import { LabeledField } from './WasapPageStateSelector';
import { wasapDateRangeOptions } from '../../views/pageStateHandlers/WasapPageStateHandler';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter';

dayjs.extend(isoWeek);

/**
 * The `DynamicWeekMonthDateFilter` computes the available date range options dynamically,
 * based on the available dates in the data, for the given LAPIS and field name.
 */
export function DynamicWeekMonthDateFilter({
    lapis,
    dateFieldName,
    value,
    onChange,
}: {
    lapis: string;
    dateFieldName: string;
    value: DateRangeOption | undefined;
    onChange: (newValue: DateRangeOption | undefined) => void;
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | undefined>(undefined);

    useEffect(() => {
        fetchDateRange(lapis, dateFieldName)
            .then((range) => setDateRange(range))
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <LabeledField label='Sampling date'>
            {isLoading ? (
                <div className='h-20'>Loading ...</div>
            ) : error ? (
                <div className='flex h-20 items-center'>Failed to load date range: {error}</div>
            ) : (
                <GsDateRangeFilter
                    lapisDateField='sampling_date'
                    onDateRangeChange={(dateRange: DateRangeOption | null) => {
                        onChange(dateRange ?? undefined);
                    }}
                    value={value}
                    dateRangeOptions={dateRange && dateRangeOptions(dateRange.start, dateRange.end)}
                />
            )}
        </LabeledField>
    );
}

async function fetchDateRange(baseUrl: string, fieldName: string): Promise<{ start: string; end: string }> {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/sample/aggregated`);
    url.search = new URLSearchParams({
        fields: fieldName,
        orderBy: fieldName,
        dataFormat: 'JSON',
        downloadAsFile: 'false',
    }).toString();

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const json: { data: Record<string, string>[] } = await res.json();

    if (!json.data.length) throw new Error('No data returned');

    return {
        start: json.data[0][fieldName],
        end: json.data[json.data.length - 1][fieldName],
    };
}

function dateRangeOptions(start: string, end: string) {
    const options: { label: string; dateFrom: string; dateTo: string }[] = wasapDateRangeOptions();

    const startDate = dayjs(start);
    const endDate = dayjs(end);

    return options.filter(({ dateFrom, dateTo }) => {
        const from = dayjs(dateFrom);
        const to = dayjs(dateTo);
        return !(to.isBefore(startDate) || from.isAfter(endDate));
    });
}
