import type { FC } from 'react';

import type { WasapAnalysisFilter } from '../wasapPageConfig';

/**
 * A note to the user to display when no mutations are selected due to the settings that they set in the filters.
 * The information is tailored to the mode and settings the user selected.
 */
export const NoDataHelperText: FC<{ analysisFilter: WasapAnalysisFilter }> = ({ analysisFilter }) => {
    return (
        <div className='rounded-md border-2 border-gray-100 p-4'>
            <h1 className='text-lg font-semibold'>No mutations selected</h1>
            {analysisFilter.mode === 'variant' && (
                <p className='text-sm'>
                    No mutations could be found matching your current filter settings. Try lowering filter thresholds or
                    looking at a different variant.
                </p>
            )}
            {analysisFilter.mode === 'untracked' &&
                analysisFilter.excludeSet === 'custom' &&
                (analysisFilter.excludeVariants === undefined || analysisFilter.excludeVariants.length === 0) && (
                    <p className='text-sm'>
                        Your set of variants to exclude is empty, please provide at least one variant to exclude.
                    </p>
                )}
        </div>
    );
};
