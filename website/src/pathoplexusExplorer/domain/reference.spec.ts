import { expect, test } from 'vitest';

import { CATALOG } from './catalog.ts';
import { referenceName, referenceOf, referenceSequencesOf, type ReferenceRow } from './reference.ts';
import { pathogenOf, parseSubject, type Pathogen, type Subject } from './subject.ts';
import { defined } from '../defined.fixture.ts';

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);
const pathogenFor = (key: string): Pathogen => defined(pathogenOf(nodeOf(key)), `the pathogen of '${key}'`);

const ROWS: ReferenceRow[] = [
    { name: 'rsv_a_main', type: 'nucleotide' },
    { name: 'rsv_a_F', type: 'amino_acid' },
    { name: 'rsv_a_G', type: 'amino_acid' },
    { name: 'rsv_b_F', type: 'amino_acid' },
    { name: 'dengue_DENV-2', type: 'nucleotide' },
    { name: 'dengue_E-DENV-2', type: 'amino_acid' },
    { name: 'dengue_E-DENV-1', type: 'amino_acid' },
];

test('a pathogen takes the reference genomes the instance holds under its own table', () => {
    const what = nodeOf('pathogen:rsv_a');
    const pathogen = pathogenFor('pathogen:rsv_a');
    const sequences = referenceSequencesOf(pathogen, referenceOf(pathogen, what), ROWS);
    expect(sequences.nucleotide).toEqual([{ name: 'main', display: '' }]);
    expect(sequences.aminoAcid.map((sequence) => sequence.name)).toEqual(['G', 'F']);
    expect(referenceName(pathogen, 'F')).toBe('rsv_a_F');
});

test('a dengue serotype takes the reference genome named after it, and writes its genes without it', () => {
    const what = nodeOf('pathogen:dengue/serotype=DENV-2');
    const pathogen = pathogenFor('pathogen:dengue');
    const sequences = referenceSequencesOf(pathogen, referenceOf(pathogen, what), ROWS);
    expect(sequences.nucleotide).toEqual([{ name: 'DENV-2', display: '' }]);
    expect(sequences.aminoAcid).toEqual([{ name: 'E-DENV-2', display: 'E' }]);
});
