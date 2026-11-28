import { describe, expect, it } from 'vitest';

import { profileOf, roleOf } from './mutations.ts';
import type { ReferenceSequences } from '../../domain/variant.ts';
import type { RhydbRow } from '../transport/row.ts';

const SEQUENCES: ReferenceSequences = {
    nucleotide: [{ name: 'main', display: '' }],
    aminoAcid: [
        { name: 'F', display: 'F' },
        { name: 'G', display: 'G' },
    ],
};

function row(
    sequenceName: string,
    position: number,
    from: string,
    to: string,
    proportion: number,
    coverage = 100,
    bucket?: string,
): RhydbRow {
    return {
        sequenceName,
        position,
        mutationFrom: from,
        mutationTo: to,
        proportion,
        coverage,
        count: Math.round(proportion * coverage),
        ...(bucket === undefined ? {} : { bucket }),
    };
}

describe('profileOf', () => {
    const columns = [
        { key: 'own', label: 'B.D.E.1', rows: [row('F', 206, 'I', 'M', 0.98), row('F', 68, 'K', 'N', 0.3)] },
        { key: 'parent', label: 'RSV-B', rows: [row('F', 206, 'I', 'M', 0.4), row('G', 7, 'A', 'T', 0.9)] },
    ];

    it('puts every mutation of every column in one table, ordered by what sets the first apart', () => {
        const rows = profileOf({ columns, sequences: SEQUENCES });
        expect(rows.map((entry) => entry.label)).toEqual(['F:I206M', 'F:K68N', 'G:A7T']);
        expect(rows[0].values.map((value) => value?.proportion)).toEqual([0.98, 0.4]);
        // The first result is below the query threshold, so its observed frequency is unknown.
        expect(rows[2].values[0]).toBeUndefined();
        expect(rows[2].difference).toBeCloseTo(-0.9);
    });

    it('tells apart what defines a variant, what it shares and what varies inside it', () => {
        const rows = profileOf({ columns, sequences: SEQUENCES });
        const thresholds = { defining: 0.8, parentMax: 0.2 };
        expect(roleOf(rows[0], thresholds)).toBe('shared');
        expect(roleOf(rows[1], thresholds)).toBe('varying');
        expect(roleOf({ ...rows[0], values: [rows[0].values[0], undefined] }, thresholds)).toBe('defining');
    });
});
