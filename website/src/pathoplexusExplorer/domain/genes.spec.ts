import { expect, test } from 'vitest';

import { reverseComplement } from './codons.ts';
import { codonOf, locateGenes, type GeneLocation } from './genes.ts';
import { defined } from '../test/defined.fixture.ts';

const protein = 'MSNK';
const codons = 'ATGAGCAACAAA';
const forward = `TTTTTT${codons}GGGGGG${reverseComplement('ATGTGGCCC')}AA`;

const genome = locateGenes({
    segments: new Map([['main', forward]]),
    proteins: new Map([
        ['F', `${protein}*`],
        ['R', 'MWP'],
    ]),
});

const geneOf = (name: string): GeneLocation => defined(genome.located.get(name), `the gene ${name}`);

test('a gene is found by translating the genome in every reading frame', () => {
    const f = geneOf('F');
    expect(f.segment).toBe('main');
    expect(f.strand).toBe('+');
    expect(f.start).toBe(7);
    expect(f.length).toBe(4);
});

test('a gene on the reverse strand is found there, and counted back along it', () => {
    const r = geneOf('R');
    expect(r.strand).toBe('-');
    const codon = defined(codonOf(r, 1, forward), 'the first codon of R');
    expect(codon.bases).toBe('ATG');
    expect(codon.residue).toBe('M');
    expect(codon.positions[0]).toBeGreaterThan(codon.positions[2]);
});

test('a protein no reading frame holds is reported as not located rather than placed by guesswork', () => {
    const edited = locateGenes({
        segments: new Map([['main', forward]]),
        proteins: new Map([['V', 'WWWWWW']]),
    });
    expect(edited.located.has('V')).toBe(false);
    expect(edited.repeated.has('V')).toBe(false);
});

test('a residue names the three bases that write it', () => {
    const second = defined(codonOf(geneOf('F'), 2, forward), 'the second codon of F');
    expect(second.positions).toEqual([10, 11, 12]);
    expect(second.bases).toBe('AGC');
    expect(second.residue).toBe('S');
});

test('a protein that the genome writes twice is not placed at either copy', () => {
    // The same protein occurs at both ends of the test genome.
    const repeat = 'ATGAGCAACAAA';
    const both = `${repeat}TTTTTTTTT${reverseComplement(repeat)}`;
    const located = locateGenes({
        segments: new Map([['main', both]]),
        proteins: new Map([['OPG001', 'MSNK']]),
    });
    expect(located.located.has('OPG001')).toBe(false);
    expect(located.repeated.has('OPG001')).toBe(true);
});
