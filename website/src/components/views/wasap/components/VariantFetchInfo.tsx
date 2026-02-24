import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getTotalCount } from '../../../../lapis/getTotalCount';
import { getLapisFilterForTimeFrame } from '../useWasapPageData';
import { variantTimeFrameLabel, type WasapVariantFilter } from '../wasapPageConfig';

/**
 * Info stat about the amount of sequences used during the computation of the clinical variant signature.
 * Will also show a warning if the count is small.
 */
export const VariantFetchInfo: FC<{
    analysis: WasapVariantFilter;
    clinicalLapisBaseUrl: string;
    clinicalLapisLineageField: string;
    clinicalLapisDateField: string;
    warningThreshold: number;
}> = ({ analysis, clinicalLapisBaseUrl, clinicalLapisLineageField, clinicalLapisDateField, warningThreshold }) => {
    const lapisFilter = {
        ...getLapisFilterForTimeFrame(analysis.timeFrame, clinicalLapisDateField),
        [clinicalLapisLineageField]: analysis.variant,
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['variantFetchInfo'],
        queryFn: () => getTotalCount(clinicalLapisBaseUrl, lapisFilter),
    });

    const isHighlighted = data !== undefined && data < warningThreshold;

    let message = `The number of clinical sequences for ${analysis.variant}`;
    if (analysis.timeFrame !== 'all') {
        message += ` during the past ${variantTimeFrameLabel(analysis.timeFrame)}`;
    }
    if (isHighlighted) {
        message += '. Clinical signature calculation with this few sequences is not recommended.';
    }

    return (
        <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
            <div className='stat'>
                <div className='stat-title'>Clinical sequences for {analysis.variant}</div>
                <div className='stat-value text-base'>
                    {isPending ? (
                        '…'
                    ) : isError ? (
                        'Error'
                    ) : isHighlighted ? (
                        <span className='rounded bg-yellow-200 px-1 py-0.5'>{data.toLocaleString('en-us')}</span>
                    ) : (
                        data.toLocaleString('en-us')
                    )}
                </div>
                <div className='stat-desc text-wrap'>{isPending ? 'Loading …' : isError ? error.message : message}</div>
            </div>
        </div>
    );
};
