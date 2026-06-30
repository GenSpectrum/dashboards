import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getTotalCount } from '../../../../lapis/getTotalCount';
import { getLapisFilterForTimeFrame } from '../useWasapPageData';
import { variantTimeFrameLabel, type WasapVariantFilter } from '../wasapPageConfig';

export const JaccardFetchInfo: FC<{
    lineage: string;
    analysis: WasapVariantFilter;
    clinicalLapisBaseUrl: string;
    clinicalLapisLineageField: string;
    clinicalLapisDateField: string;
    warningThreshold: number;
}> = ({
    lineage,
    analysis,
    clinicalLapisBaseUrl,
    clinicalLapisLineageField,
    clinicalLapisDateField,
    warningThreshold,
}) => {
    const lapisFilter = {
        ...getLapisFilterForTimeFrame(analysis.timeFrame, clinicalLapisDateField),
        [clinicalLapisLineageField]: lineage,
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['jaccardFetchInfo', lineage, analysis.timeFrame],
        queryFn: () => getTotalCount(clinicalLapisBaseUrl, lapisFilter),
    });

    const isHighlighted = data !== undefined && data < warningThreshold;

    let description = `Clinical sequences for ${lineage}`;
    if (analysis.timeFrame !== 'all') {
        description += ` during the past ${variantTimeFrameLabel(analysis.timeFrame)}`;
    }
    if (isHighlighted) {
        description += '. Low sequence count may lead to unreliable Jaccard scores.';
    }

    return (
        <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
            <div className='stat'>
                <div className='stat-title'>Jaccard index</div>
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
                <div className='stat-desc text-wrap'>
                    {isPending ? 'Loading …' : isError ? error.message : description}
                </div>
            </div>
        </div>
    );
};
