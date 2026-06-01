import { describe, expect, test } from 'vitest';

import { getInitialMeanProportionInterval } from './initialMeanProportionInterval';
import type { WasapAnalysisFilter } from './wasapPageConfig';

describe('getInitialMeanProportionInterval', () => {
    test('resistance mutations initially show mean proportion from 5 to 100 percent', () => {
        const analysis: WasapAnalysisFilter = {
            mode: 'resistance',
            sequenceType: 'amino acid',
            resistanceSet: 'Spike',
        };

        expect(getInitialMeanProportionInterval(analysis)).toEqual({ min: 0.05, max: 1.0 });
    });

    test('manual mode without mutations keeps the previous 5 to 95 percent default', () => {
        const analysis: WasapAnalysisFilter = {
            mode: 'manual',
            sequenceType: 'nucleotide',
            mutations: undefined,
        };

        expect(getInitialMeanProportionInterval(analysis)).toEqual({ min: 0.05, max: 0.95 });
    });

    test('other analysis states initially show the full mean proportion range', () => {
        const analysis: WasapAnalysisFilter = {
            mode: 'variant',
            sequenceType: 'nucleotide',
            variant: 'XFG*',
            minProportion: 0.8,
            minCount: 15,
            minJaccard: 0.75,
            timeFrame: 'all',
        };

        expect(getInitialMeanProportionInterval(analysis)).toEqual({ min: 0.0, max: 1.0 });
    });
});
