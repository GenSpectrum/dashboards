import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getTotalCount } from '../../../lapis/getTotalCount';
import { withQueryProvider } from '../../subscriptions/backendApi/withQueryProvider.tsx';

export type CountStatisticsProps = {
    lapisFilter: LapisFilter;
    lapisUrl: string;
};

const CountStatisticsInner: FC<CountStatisticsProps> = ({ lapisFilter, lapisUrl }) => {
    const {
        data: count,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['countStatistics', lapisFilter, lapisUrl],
        queryFn: () => getTotalCount(lapisUrl, lapisFilter),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    return (
        <div className='flex min-w-[180px] flex-col rounded-md border-2 border-gray-100 sm:flex-row'>
            <div className='stat'>
                {isPending ? (
                    <span className='loading loading-spinner loading-lg text-primary' />
                ) : isError ? (
                    <p className='font-bold text-red-700'>
                        Error - Sorry, we were unable to compute the total count of sequences. Please try again later.
                    </p>
                ) : (
                    <>
                        <div className='stat-title'>Sequences</div>
                        <div className='stat-value text-2xl sm:text-4xl'>{count.toLocaleString('en-us')}</div>
                        <div className='stat-desc text-wrap'>The total number of sequenced samples</div>
                    </>
                )}
            </div>
        </div>
    );
};

export const CountStatistics = withQueryProvider(CountStatisticsInner);
