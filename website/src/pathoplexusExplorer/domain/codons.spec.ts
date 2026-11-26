import { expect, test } from 'vitest';

import { residueOf, reverseComplement, translate } from './codons.ts';

test('the genetic code translates codons, and an uncertain base gives an uncertain residue', () => {
    expect(residueOf('ATG')).toBe('M');
    expect(residueOf('AGC')).toBe('S');
    expect(residueOf('AAC')).toBe('N');
    expect(residueOf('TAA')).toBe('*');
    expect(residueOf('ANC')).toBe('X');
});

test('a reading frame translates from its own offset', () => {
    expect(translate('ATGAGCAAC', 0)).toBe('MSN');
    expect(translate('GATGAGCAAC', 1)).toBe('MSN');
});

test('the reverse complement gives the other strand back to front', () => {
    expect(reverseComplement('ATGC')).toBe('GCAT');
    expect(reverseComplement(reverseComplement('ATGGCCTAA'))).toBe('ATGGCCTAA');
});
