/** NCBI translation table 1, in TCAG base order. */

/* eslint-disable @typescript-eslint/naming-convention -- the keys are nucleotide symbols */

export const GENETIC_CODE_BASES = 'TCAG';

export const GENETIC_CODE_RESIDUES = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';

export const NUCLEOTIDE_COMPLEMENTS: Readonly<Record<string, string>> = {
    'A': 'T',
    'T': 'A',
    'G': 'C',
    'C': 'G',
    'U': 'A',
    'N': 'N',
    '-': '-',
};
