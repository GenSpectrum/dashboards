import { describe, expect, test } from 'vitest';

import { and, bool, dateLiteral, field, int, not, num, or, record, set, str } from './expression.ts';
import {
    aminoAcidEquals,
    aminoAcidInsertionContains,
    count,
    countOf,
    hasAAMutation,
    hasMutation,
    insertionContains,
    isNotNull,
    isNull,
    max,
    maybe,
    min,
    nOf,
    nucleotideEquals,
    sum,
} from './functions.ts';

describe('literals', () => {
    test('render as the instance takes them', () => {
        expect(int(-3).render()).toBe('-3');
        expect(num(0.05).render()).toBe('0.05');
        expect(bool(true).render()).toBe('true');
        expect(dateLiteral('2026-06-01').render()).toBe("'2026-06-01'::date");
    });

    test('refuse what cannot be rendered', () => {
        expect(() => int(1.5)).toThrow();
        expect(() => num(Number.POSITIVE_INFINITY)).toThrow();
        expect(() => dateLiteral('June 2026')).toThrow();
        expect(() => set([])).toThrow();
        expect(() => record({})).toThrow();
    });
});

describe('parentheses', () => {
    const a = field('a').eq(str('1'));
    const b = field('b').eq(str('2'));
    const c = field('c').eq(str('3'));

    test('appear where the parent binds tighter, and nowhere else', () => {
        expect(and(a, or(b, c)).render()).toBe("a = '1' && (b = '2' || c = '3')");
        expect(or(a, and(b, c)).render()).toBe("a = '1' || b = '2' && c = '3'");
    });

    test('a negated call needs none, a negated conjunction does', () => {
        expect(not(isNull(field('a'))).render()).toBe('!isNull(a)');
        expect(not(and(a, b)).render()).toBe("!(a = '1' && b = '2')");
    });

    test('an argument list needs none, since a comma delimits it', () => {
        expect(maybe(or(a, b)).render()).toBe("maybe(a = '1' || b = '2')");
    });
});

describe('a conjunction over parts that may be absent', () => {
    test('is nothing where no part is present', () => {
        expect(and(undefined, undefined)).toBeUndefined();
        expect(or()).toBeUndefined();
    });

    test('is the one part present, unwrapped', () => {
        const only = field('a').eq(str('1'));
        expect(and(undefined, only, undefined)).toBe(only);
    });

    test('joins the parts present in the order given', () => {
        expect(and(isNull(field('a')), undefined, isNull(field('b'))).render()).toBe('isNull(a) && isNull(b)');
    });
});

describe('postfix calls', () => {
    test('read a symbol at a reference position, which is 1-based', () => {
        expect(field('main').at(21563).eq(str('T')).render()).toBe("main.at(21563) = 'T'");
        expect(() => field('main').at(0)).toThrow();
    });

    test('test membership against a set, which cannot be empty', () => {
        expect(field('sampleId').isIn(['a', 'b'].map(str)).render()).toBe("sampleId.in({'a', 'b'})");
        expect(() => field('sampleId').isIn([])).toThrow();
    });

    test('compare and order', () => {
        expect(field('n').gte(int(1)).render()).toBe('n >= 1');
        expect(field('n').lte(int(9)).render()).toBe('n <= 9');
        expect(field('n').desc().render()).toBe('n.desc()');
    });

    test('a lineage, with and without its descendants', () => {
        const lineage = (sublineages: boolean) =>
            field('lineage')
                .lineageFromTables({
                    value: str('B.1'),
                    definitions: field('mpox_lineage'),
                    aliases: field('mpox_lineage_aliases'),
                    sublineages,
                })
                .render();
        expect(lineage(false)).toBe("lineage.lineageFromTables('B.1', mpox_lineage, mpox_lineage_aliases)");
        expect(lineage(true)).toBe(
            "lineage.lineageFromTables('B.1', mpox_lineage, mpox_lineage_aliases, includeSublineages := true)",
        );
    });
});

test('a record keeps its keys in order, and a set its members', () => {
    expect(record({ n: count(), p1: field('main').at(1722) }).render()).toBe('{n := count(), p1 := main.at(1722)}');
    expect(set([field('sampleId'), field('batchId')]).render()).toBe('{sampleId, batchId}');
});

describe('the named functions', () => {
    test('aggregate a column, and test it for null', () => {
        expect(countOf('lineage').render()).toBe('count(lineage)');
        expect(sum('n').render()).toBe('sum(n)');
        expect(min('date').render()).toBe('min(date)');
        expect(max('date').render()).toBe('max(date)');
        expect(isNotNull(field('S')).render()).toBe('isNotNull(S)');
    });

    test('name their arguments, and pass the sequence as a string literal', () => {
        expect(aminoAcidEquals({ position: 501, symbol: 'X', sequenceName: 'S' }).render()).toBe(
            "aminoAcidEquals(position := 501, symbol := 'X', sequenceName := 'S')",
        );
        expect(hasMutation({ position: 241, sequenceName: 'main' }).render()).toBe(
            "hasMutation(position := 241, sequenceName := 'main')",
        );
        expect(hasAAMutation({ position: 501, sequenceName: 'S' }).render()).toBe(
            "hasAAMutation(position := 501, sequenceName := 'S')",
        );
        expect(insertionContains({ position: 22204, value: 'GAG', sequenceName: 'main' }).render()).toBe(
            "insertionContains(position := 22204, value := 'GAG', sequenceName := 'main')",
        );
        expect(aminoAcidInsertionContains({ position: 214, value: 'EPE', sequenceName: 'S' }).render()).toBe(
            "aminoAcidInsertionContains(position := 214, value := 'EPE', sequenceName := 'S')",
        );
    });

    test('refuse a position that no reference has', () => {
        expect(() => nucleotideEquals({ position: 0, symbol: 'A', sequenceName: 'main' })).toThrow();
        expect(() => hasMutation({ position: 1.5, sequenceName: 'main' })).toThrow();
    });

    test('nOf takes a count, a set of matchers and an optional flag', () => {
        const matchers = [
            hasMutation({ position: 1, sequenceName: 'main' }),
            hasMutation({ position: 2, sequenceName: 'main' }),
        ];
        const listed =
            "{hasMutation(position := 1, sequenceName := 'main'), hasMutation(position := 2, sequenceName := 'main')}";
        expect(nOf(1, matchers).render()).toBe(`nOf(1, ${listed})`);
        expect(nOf(2, matchers, { matchExactly: true }).render()).toBe(`nOf(2, ${listed}, matchExactly := true)`);
    });
});
