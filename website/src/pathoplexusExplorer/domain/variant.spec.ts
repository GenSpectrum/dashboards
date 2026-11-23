import { describe, expect, it } from 'vitest';

import {
    insertionsOf,
    mutationsOf,
    parseVariant,
    resolveVariant,
    type VariantContext,
    type VariantNode,
} from './variant.ts';

const RSV: VariantContext = {
    sequences: {
        nucleotide: [{ name: 'main', display: '' }],
        aminoAcid: ['NS1', 'F', 'G', 'M2-1'].map((name) => ({ name, display: name })),
    },
    columns: [{ column: 'lineage', hierarchical: true }],
};

const DENGUE_2: VariantContext = {
    sequences: {
        nucleotide: [{ name: 'DENV-2', display: '' }],
        aminoAcid: [
            { name: 'E-DENV-2', display: 'E' },
            { name: 'NS1-DENV-2', display: 'NS1' },
        ],
    },
    columns: [
        { column: 'serotype', hierarchical: false },
        { column: 'lineage', hierarchical: true },
    ],
};

const CCHF: VariantContext = {
    sequences: {
        nucleotide: ['L', 'M', 'S'].map((name) => ({ name, display: name })),
        aminoAcid: ['RdRp', 'GPC', 'NP'].map((name) => ({ name, display: name })),
    },
    columns: [{ column: 'lineage_S', hierarchical: true }],
};

function parsed(text: string): VariantNode {
    const result = parseVariant(text);
    if (!result.ok) {
        throw new Error(`'${text}' could not be parsed`);
    }
    return result.node;
}

function resolved(text: string, context: VariantContext) {
    const result = resolveVariant(parsed(text), context);
    if (!result.ok) {
        throw new Error(result.error);
    }
    return result.node;
}

describe('parseVariant', () => {
    it('parses nucleotide and amino-acid mutations', () => {
        expect(parsed('C466T')).toEqual({ type: 'mutation', from: 'C', position: 466, to: 'T', raw: 'C466T' });
        expect(parsed('f:k68n')).toMatchObject({ prefix: 'f', from: 'K', position: 68, to: 'N' });
        expect(parsed('F:68')).toMatchObject({ prefix: 'F', from: undefined, position: 68, to: undefined });
        expect(parsed('466-')).toMatchObject({ position: 466, to: '-' });
        expect(parsed('466.')).toMatchObject({ position: 466, to: '.' });
    });

    it('binds & tighter than |, and ! tightest', () => {
        expect(parsed('A1T | !C2G & 3')).toMatchObject({
            type: 'or',
            children: [{ type: 'mutation' }, { type: 'and', children: [{ type: 'not' }, { type: 'mutation' }] }],
        });
        expect(parsed('A1T | C2G & 3')).toMatchObject({ type: 'or', children: [{}, { type: 'and' }] });
        expect(parsed('(A1T | C2G) & 3')).toMatchObject({ type: 'and', children: [{ type: 'or' }, {}] });
    });

    it('parses n-of, maybe, insertions and lineages', () => {
        expect(parsed('[2-of: A1T, C2G, 3]')).toMatchObject({ type: 'nOf', n: 2, exactly: false });
        expect(parsed('[exactly-1-of: A1T, C2G]')).toMatchObject({ type: 'nOf', n: 1, exactly: true });
        expect(parsed('maybe(F:K68N)')).toMatchObject({ type: 'maybe', child: { type: 'mutation' } });
        expect(parsed('ins_F:214:EPE')).toEqual({ type: 'insertion', prefix: 'F', position: 214, value: 'EPE' });
        expect(parsed('ins_22204:gag')).toEqual({
            type: 'insertion',
            prefix: undefined,
            position: 22204,
            value: 'GAG',
        });
        expect(parsed('lineage:A.D.5*')).toEqual({
            type: 'lineage',
            column: 'lineage',
            value: 'A.D.5',
            sublineages: true,
        });
    });

    it('refuses a query it cannot read', () => {
        expect(parseVariant('F:K68N &')).toEqual({ ok: false });
        expect(parseVariant('F:K68N ) ')).toEqual({ ok: false });
        expect(parseVariant('hello')).toEqual({ ok: false });
        expect(parseVariant('')).toEqual({ ok: false });
        expect(parseVariant('[3-of: A1T, C2G]')).toEqual({ ok: false });
    });
});

describe('resolveVariant', () => {
    it('tells genes from the single nucleotide sequence', () => {
        expect(resolved('C466T & f:K68N', RSV)).toEqual({
            type: 'and',
            children: [
                {
                    type: 'mutation',
                    kind: 'nucleotide',
                    sequence: 'main',
                    display: '',
                    position: 466,
                    to: 'T',
                },
                { type: 'mutation', kind: 'aminoAcid', sequence: 'F', display: 'F', position: 68, to: 'N' },
            ],
        });
    });

    it('maps dengue genes to their serotype', () => {
        expect(resolved('E:N390S', DENGUE_2)).toMatchObject({ kind: 'aminoAcid', sequence: 'E-DENV-2', display: 'E' });
    });

    it('needs a segment where there are several', () => {
        expect(resolved('S:C10T', CCHF)).toMatchObject({ kind: 'nucleotide', sequence: 'S' });
        expect(resolveVariant(parsed('C10T'), CCHF)).toMatchObject({ ok: false });
    });

    it('parses a column prefix as a lineage, keeping how it was typed', () => {
        const context: VariantContext = { ...RSV, columns: [{ column: 'genotype', hierarchical: false }] };
        expect(resolved('genotype:D8', context)).toEqual({
            type: 'lineage',
            column: 'genotype',
            value: 'D8',
            sublineages: false,
        });
    });

    it('rejects unknown genes', () => {
        expect(resolveVariant(parsed('Spike:N501Y'), RSV)).toMatchObject({ ok: false });
    });
});

describe('the terms that a report places on the genome', () => {
    it('keeps insertions apart from mutations', () => {
        const node = resolved('ins_1234:ACG & !C466T', RSV);
        expect(mutationsOf(node).map((mutation) => mutation.position)).toEqual([466]);
        expect(insertionsOf(node)).toEqual([
            { type: 'insertion', kind: 'nucleotide', sequence: 'main', display: '', position: 1234, value: 'ACG' },
        ]);
        expect(mutationsOf(resolved('ins_1234:ACG', RSV))).toEqual([]);
    });
});
