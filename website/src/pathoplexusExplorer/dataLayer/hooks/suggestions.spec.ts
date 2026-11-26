import { expect, test } from 'vitest';

import { looksNucleotide } from './suggestions.ts';

test('a position, with or without the base before it, is being typed as a nucleotide', () => {
    expect(looksNucleotide('466')).toBe(true);
    expect(looksNucleotide('C466')).toBe(true);
    expect(looksNucleotide(' t12 ')).toBe(true);
});

test('anything naming a gene is being typed as an amino acid', () => {
    expect(looksNucleotide('S:614')).toBe(false);
    expect(looksNucleotide('OPG197:E42')).toBe(false);
});

test('a gene name on its own, and nothing at all, are not nucleotides either', () => {
    expect(looksNucleotide('OPG')).toBe(false);
    expect(looksNucleotide('')).toBe(false);
    expect(looksNucleotide('   ')).toBe(false);
});
