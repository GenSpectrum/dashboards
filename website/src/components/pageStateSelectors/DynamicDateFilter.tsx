import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getDateRange } from '../../lapis/getDateRange';
import { CustomDateRangeLabel } from '../../types/DateWindow';
import { Loading } from '../../util/Loading';
import { GsDateRangeFilter } from '../genspectrum/GsDateRangeFilter';

/**
 * The `DynamicDateFilter` computes the available date range options dynamically,
 * based on the available dates in the data, for the given LAPIS and field name.
 */
export function DynamicDateFilter({
    label,
    lapis,
    dateFieldName,
    generateOptions,
    value,
    onChange,
}: {
    label: string;
    lapis: string;
    dateFieldName: string;
    generateOptions: ({ endDate }: { endDate: string }) => DateRangeOption[];
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
        queryFn: () => getDateRange(lapis, dateFieldName),
    });

    const generatedOptions = useMemo(() => {
        if (!dateRange) {
            return [];
        }
        return generateOptions({ endDate: dateRange.end });
    }, [dateRange, generateOptions]);

    // When the value has a "Custom" label, try to match it back to one of the generated options
    // by comparing dateFrom and dateTo. If there's a match, use that option's label instead of "Custom".
    const normalizedValue = useMemo(() => {
        if (value === undefined || value.label !== CustomDateRangeLabel) {
            return value;
        }

        const matchingOption = generatedOptions.find(
            (option) => option.dateFrom === value.dateFrom && option.dateTo === value.dateTo,
        );

        return matchingOption ?? value;
    }, [value, generatedOptions]);

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
                    lapisDateField={dateFieldName}
                    onDateRangeChange={(dateRange: DateRangeOption | null) => onChange(dateRange ?? undefined)}
                    value={normalizedValue}
                    dateRangeOptions={generatedOptions}
                />
            )}
        </label>
    );
}
