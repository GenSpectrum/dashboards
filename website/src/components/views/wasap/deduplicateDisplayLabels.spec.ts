import { describe, expect, it } from 'vitest';

import { deduplicateDisplayLabels } from './useWasapPageData';

describe('deduplicateDisplayLabels', () => {
    it('leaves unique labels unchanged', () => {
        const input = [{ displayLabel: 'Alpha' }, { displayLabel: 'Beta' }];
        expect(deduplicateDisplayLabels(input)).toEqual(input);
    });

    it('appends a counter suffix to duplicate labels', () => {
        const input = [{ displayLabel: 'Resistance' }, { displayLabel: 'Resistance' }, { displayLabel: 'Resistance' }];
        expect(deduplicateDisplayLabels(input)).toEqual([
            { displayLabel: 'Resistance' },
            { displayLabel: 'Resistance (2)' },
            { displayLabel: 'Resistance (3)' },
        ]);
    });

    it('handles interleaved duplicates independently', () => {
        const input = [
            { displayLabel: 'A' },
            { displayLabel: 'B' },
            { displayLabel: 'A' },
            { displayLabel: 'B' },
            { displayLabel: 'A' },
        ];
        expect(deduplicateDisplayLabels(input)).toEqual([
            { displayLabel: 'A' },
            { displayLabel: 'B' },
            { displayLabel: 'A (2)' },
            { displayLabel: 'B (2)' },
            { displayLabel: 'A (3)' },
        ]);
    });

    it('preserves other properties on items', () => {
        const input = [
            { displayLabel: 'X', countQuery: 'q1', coverageQuery: 'c1' },
            { displayLabel: 'X', countQuery: 'q2', coverageQuery: 'c2' },
        ];
        expect(deduplicateDisplayLabels(input)).toEqual([
            { displayLabel: 'X', countQuery: 'q1', coverageQuery: 'c1' },
            { displayLabel: 'X (2)', countQuery: 'q2', coverageQuery: 'c2' },
        ]);
    });
});
