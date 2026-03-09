import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getDateRange } from '../../../../lapis/getDateRange';
import { getTotalCount } from '../../../../lapis/getTotalCount';
import type { WasapPageConfig } from '../wasapPageConfig';

export const WasapStats: FC<{ config: WasapPageConfig }> = ({ config }) => (
    <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
        <TotalCount config={config} />
        <DateRange config={config} />
    </div>
);

const TotalCount: FC<{ config: WasapPageConfig }> = ({ config }) => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['aggregatedCount'],
        queryFn: () => getTotalCount(config.lapisBaseUrl, {}),
    });

    return (
        <div className='stat'>
            <div className='stat-title'>Amplicon sequences</div>
            <div className='stat-value text-base'>
                {isPending ? '…' : isError ? 'Error' : data.toLocaleString('en-us')}
            </div>
            <div className='stat-desc text-wrap'>
                {isPending
                    ? 'Loading total amplicon sequences count…'
                    : isError
                      ? error.message
                      : 'The total number of amplicon sequences in all samples'}
            </div>
        </div>
    );
};

const DateRange: FC<{ config: WasapPageConfig }> = ({ config }) => {
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['dateRange'],
        queryFn: () => getDateRange(config.lapisBaseUrl, config.samplingDateField),
    });

    return (
        <div className='stat'>
            <div className='stat-title'>Sampling Dates</div>
            <div className='stat-value text-base'>
                {isPending ? '…' : isError ? 'Error' : `${data.start} to ${data.end}`}
            </div>
            <div className='stat-desc text-wrap'>
                {isPending
                    ? 'Loading date range…'
                    : isError
                      ? error.message
                      : 'The start and end dates of collected samples'}
            </div>
        </div>
    );
};
