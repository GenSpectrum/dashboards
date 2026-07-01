import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';

import { getTotalCount } from '../../../../lapis/getTotalCount';
import { getLapisFilterForTimeFrame } from '../useWasapPageData';
import { variantTimeFrameLabel, type WasapVariantFilter } from '../wasapPageConfig';

type ClinicalSequenceCountStatProps = {
    lineage: string;
    analysis: WasapVariantFilter;
    clinicalLapisBaseUrl: string;
    clinicalLapisLineageField: string;
    clinicalLapisDateField: string;
    warningThreshold: number;
    queryKeyPrefix: string;
    title: string;
    descriptionStart: string;
    warningMessage: string;
    zeroMessage?: string;
};

export const ClinicalSequenceCountStat: FC<ClinicalSequenceCountStatProps> = ({
    lineage,
    analysis,
    clinicalLapisBaseUrl,
    clinicalLapisLineageField,
    clinicalLapisDateField,
    warningThreshold,
    queryKeyPrefix,
    title,
    descriptionStart,
    warningMessage,
    zeroMessage,
}) => {
    const lapisFilter = {
        ...getLapisFilterForTimeFrame(analysis.timeFrame, clinicalLapisDateField),
        [clinicalLapisLineageField]: lineage,
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: [queryKeyPrefix, lineage, analysis.timeFrame],
        queryFn: () => getTotalCount(clinicalLapisBaseUrl, lapisFilter),
    });

    const isHighlighted = data !== undefined && data < warningThreshold;

    let description = descriptionStart;
    if (analysis.timeFrame !== 'all') {
        description += ` during the past ${variantTimeFrameLabel(analysis.timeFrame)}`;
    }
    if (isHighlighted) {
        description += data === 0 && zeroMessage !== undefined ? zeroMessage : warningMessage;
    }

    return (
        <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
            <div className='stat'>
                <div className='stat-title'>{title}</div>
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
