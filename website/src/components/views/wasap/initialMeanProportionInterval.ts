import type { MeanProportionInterval } from '@genspectrum/dashboard-components/util';

import type { WasapAnalysisFilter } from './wasapPageConfig';

export function getInitialMeanProportionInterval(analysis: WasapAnalysisFilter): MeanProportionInterval {
    if (analysis.mode === 'resistance') {
        return { min: 0.05, max: 1.0 };
    }
    if (analysis.mode === 'manual' && analysis.mutations === undefined) {
        return { min: 0.05, max: 0.95 };
    }
    return { min: 0.0, max: 1.0 };
}
