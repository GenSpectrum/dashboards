import { describe, expect, test } from 'vitest';

import { coverageRowsOf, positionReadingOf } from './positions.ts';
import { MUTATION_KIND, type ResolvedMutation } from '../../domain/variant.ts';
import type { RhydbRow } from '../transport/row.ts';

/* eslint-disable @typescript-eslint/naming-convention -- the keys are symbols */

const SEQUENCES = {
    nucleotide: [{ name: 'main', display: '' }],
    aminoAcid: [{ name: 'E-DENV-2', display: 'E' }],
};

function nucleotide(to: string | undefined): ResolvedMutation {
    return { type: 'mutation', kind: MUTATION_KIND.nucleotide, sequence: 'main', display: '', position: 466, to };
}

const symbols = (counts: Readonly<Record<string, number>>, absent = 0): RhydbRow[] => [
    ...Object.entries(counts).map(([symbol, n]) => ({ symbol, n })),
    ...(absent > 0 ? [{ symbol: null, n: absent }] : []),
];

describe('the reading of a position', () => {
    const rows = symbols({ T: 30, C: 50, N: 5, Y: 3, t: 2 }, 10);

    test('counts the sequences with a called symbol, and apart from them the ambiguous and the absent', () => {
        const reading = positionReadingOf(nucleotide('T'), SEQUENCES, rows, 'C');
        expect(reading).toMatchObject({ read: 82, carriers: 32, ambiguous: 8, absent: 10, reference: 'C' });
    });

    test('counts a bare position as carried by every called symbol other than the reference', () => {
        expect(positionReadingOf(nucleotide(undefined), SEQUENCES, rows, 'C').carriers).toBe(32);
        expect(positionReadingOf(nucleotide(undefined), SEQUENCES, rows, undefined).carriers).toBe(0);
    });

    test('counts a dot as carried by the reference symbol', () => {
        expect(positionReadingOf(nucleotide('.'), SEQUENCES, rows, 'C').carriers).toBe(50);
    });

    test('counts a deletion like any other symbol', () => {
        expect(positionReadingOf(nucleotide('-'), SEQUENCES, symbols({ '-': 4, 'C': 6 }), 'C')).toMatchObject({
            read: 10,
            carriers: 4,
        });
    });

    test('is all zeros where the selection holds no sequence', () => {
        expect(positionReadingOf(nucleotide('T'), SEQUENCES, [], 'C')).toMatchObject({
            read: 0,
            carriers: 0,
            ambiguous: 0,
            absent: 0,
        });
    });

    test('takes only X as ambiguous for an amino acid, since the nucleotide codes are residues', () => {
        const residue: ResolvedMutation = { ...nucleotide('N'), kind: MUTATION_KIND.aminoAcid, sequence: 'E-DENV-2' };
        const reading = positionReadingOf(residue, SEQUENCES, symbols({ N: 7, X: 2, K: 1 }), 'K');
        expect(reading).toMatchObject({ display: 'E', read: 8, carriers: 7, ambiguous: 2 });
    });
});

test('a position is read per group, each group counted on its own', () => {
    const rows = [
        { country: 'Uganda', symbol: 'T', n: 3 },
        { country: 'Kenya', symbol: 'C', n: 4 },
        { country: 'Uganda', symbol: 'C', n: 1 },
        { country: null, symbol: 'T', n: 2 },
    ];
    expect(coverageRowsOf(rows, nucleotide('T'), ['country'], 'C')).toEqual({
        own: [
            { country: 'Uganda', n: 3 },
            { country: 'Kenya', n: 0 },
            { country: null, n: 2 },
        ],
        all: [
            { country: 'Uganda', n: 4 },
            { country: 'Kenya', n: 4 },
            { country: null, n: 2 },
        ],
    });
});
