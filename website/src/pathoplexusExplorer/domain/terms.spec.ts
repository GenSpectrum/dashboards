import { expect, test } from 'vitest';

import { termsOf, withoutTerm, withTerm } from './terms.ts';

test('a term is added once and taken away by its place', () => {
    expect(withTerm('F:S190N', 'G:A74V')).toBe('F:S190N & G:A74V');
    expect(withTerm('F:S190N & G:A74V', 'F:S190N')).toBe('F:S190N & G:A74V');
    expect(withoutTerm('F:S190N & G:A74V', 0)).toBe('G:A74V');
    expect(withoutTerm('F:S190N', 0)).toBe('');
});

test('a disjunction keeps its grouping when a term is added', () => {
    expect(withTerm('A12C | G34T', 'C56G')).toBe('(A12C | G34T) & C56G');
    expect(withTerm('C56G', 'A12C | G34T')).toBe('C56G & (A12C | G34T)');
    expect(withTerm('(A12C | G34T) & C56G', 'T78A')).toBe('(A12C | G34T) & C56G & T78A');
});

test('each operand of a conjunction is a term of its own, grouped or not', () => {
    expect(termsOf('(A12C | G34T) & C56G')).toEqual(['(A12C | G34T)', 'C56G']);
    expect(termsOf('!A12C & [2-of: C1T & G2A, T3C] & maybe(A4G)')).toEqual([
        '!A12C',
        '[2-of: C1T & G2A, T3C]',
        'maybe(A4G)',
    ]);
    expect(withoutTerm('(A12C | G34T) & C56G', 0)).toBe('C56G');
    expect(withoutTerm('(A12C | G34T) & C56G', 1)).toBe('(A12C | G34T)');
});

test('an expression that is not a conjunction stays one term', () => {
    expect(termsOf('A12C | G34T & C56G')).toEqual(['A12C | G34T & C56G']);
    expect(termsOf('(A12C & C56G)')).toEqual(['(A12C & C56G)']);
    expect(termsOf('A12C &')).toEqual(['A12C &']);
});
