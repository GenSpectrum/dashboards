import { describe, expect, it } from 'vitest';

import { formatProportion, wilsonInterval } from './statistics.ts';

describe('formatProportion', () => {
    it('prints a proportion at the precision it carries', () => {
        expect(formatProportion(0.4567)).toBe('46%');
        expect(formatProportion(0.0456)).toBe('4.6%');
    });

    it('gives neither 0% nor 100% to a proportion that is neither', () => {
        expect(formatProportion(0)).toBe('0%');
        expect(formatProportion(0.0004)).toBe('<0.1%');
        expect(formatProportion(1)).toBe('100%');
        expect(formatProportion(0.9996)).toBe('>99%');
        expect(formatProportion(0.995)).toBe('>99%');
        expect(formatProportion(1990 / 2000)).toBe('>99%');
    });
});

describe('wilsonInterval', () => {
    it('stays inside [0, 1] for the small counts sequencing data has', () => {
        const { lower, upper } = wilsonInterval(1, 3);
        expect(lower).toBeGreaterThan(0);
        expect(upper).toBeLessThan(1);
    });

    it('is zero below nothing observed and one above nothing left', () => {
        expect(wilsonInterval(0, 1499).lower).toBe(0);
        expect(wilsonInterval(120, 120).upper).toBe(1);
    });

    it('has nothing to say without a sample', () => {
        expect(wilsonInterval(0, 0)).toEqual({ lower: 0, upper: 1 });
    });
});
