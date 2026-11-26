import { describe, expect, test } from 'vitest';

import {
    and,
    bool,
    callWith,
    field,
    fn,
    int,
    not,
    nullLiteral,
    num,
    or,
    record,
    set,
    str,
    PRECEDENCE,
} from './expression.ts';
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

describe('literals and fields', () => {
    test('escape where they are built', () => {
        expect(field('sampleId').render()).toBe('sampleId');
        expect(field('weird name').render()).toBe('"weird name"');
        expect(str("O'Brien").render()).toBe("'O''Brien'");
        expect(int(0).render()).toBe('0');
        expect(int(-3).render()).toBe('-3');
        expect(num(0.05).render()).toBe('0.05');
        expect(bool(true).render()).toBe('true');
        expect(nullLiteral().render()).toBe('null');
    });

    test('reject what cannot be rendered', () => {
        expect(() => int(1.5)).toThrow();
        expect(() => num(Number.POSITIVE_INFINITY)).toThrow();
        expect(() => str('two\nlines')).toThrow();
        expect(() => set([])).toThrow();
        expect(() => record({})).toThrow();
    });
});

describe('parentheses', () => {
    test('appear where the parent binds tighter, and nowhere else', () => {
        const a = field('a').eq(str('1'));
        const b = field('b').eq(str('2'));
        const c = field('c').eq(str('3'));
        expect(and(a, or(b, c)).render()).toBe("a = '1' && (b = '2' || c = '3')");
        expect(or(a, and(b, c)).render()).toBe("a = '1' || b = '2' && c = '3'");
        expect(or(b, c).render()).toBe("b = '2' || c = '3'");
    });

    test('a negated call needs none, a negated conjunction does', () => {
        expect(not(nucleotideEquals({ position: 1722, symbol: 'N', sequenceName: 'main' })).render()).toBe(
            "!nucleotideEquals(position := 1722, symbol := 'N', sequenceName := 'main')",
        );
        expect(not(and(field('a').isNull(), field('b').isNull())).render()).toBe('!(a.isNull() && b.isNull())');
    });

    test('an argument list needs none, since a comma delimits it', () => {
        expect(fn('some', [or(field('a').isNull(), field('b').isNull())]).render()).toBe(
            'some(a.isNull() || b.isNull())',
        );
    });

    test('the ladder is the one the language uses', () => {
        expect(PRECEDENCE.or).toBeLessThan(PRECEDENCE.and);
        expect(PRECEDENCE.and).toBeLessThan(PRECEDENCE.not);
        expect(PRECEDENCE.not).toBeLessThan(PRECEDENCE.comparison);
        expect(PRECEDENCE.comparison).toBeLessThan(PRECEDENCE.postfix);
    });
});

describe('conjunctions over parts that may be absent', () => {
    test('nothing present is nothing to send', () => {
        expect(and(undefined, undefined)).toBeUndefined();
        expect(or()).toBeUndefined();
    });

    test('one part present is that part, unwrapped', () => {
        const only = field('a').eq(str('1'));
        expect(and(undefined, only, undefined)).toBe(only);
        expect(or(only)).toBe(only);
    });

    test('several parts join in the order given', () => {
        expect(and(field('a').isNull(), undefined, field('b').isNull()).render()).toBe('a.isNull() && b.isNull()');
    });
});

describe('postfix calls', () => {
    test('read a symbol at a reference position', () => {
        expect(field('main').at(21563).render()).toBe('main.at(21563)');
        expect(() => field('main').at(0)).toThrow();
        expect(() => field('main').at(1.5)).toThrow();
    });

    test('membership is a set literal, never positional', () => {
        expect(field('sampleId').isIn(['a', 'b'].map(str)).render()).toBe("sampleId.in({'a', 'b'})");
        expect(() => field('sampleId').isIn([])).toThrow();
    });

    test('ordering keys', () => {
        expect(field('n').desc().render()).toBe('n.desc()');
        expect(field('n').asc().render()).toBe('n.asc()');
    });

    test('comparisons use the operators that RhyDB parses', () => {
        expect(field('n').neq(int(0)).render()).toBe('n <> 0');
        expect(field('n').gte(int(1)).render()).toBe('n >= 1');
    });

    test('a lineage, with and without its descendants', () => {
        const relations = { definitions: str('mpox_lineage'), aliases: str('mpox_lineage_aliases') };
        expect(
            field('lineage')
                .lineageFromTables({ value: str('B.1'), ...relations, sublineages: false })
                .render(),
        ).toBe("lineage.lineageFromTables('B.1', 'mpox_lineage', 'mpox_lineage_aliases')");
        expect(
            field('lineage')
                .lineageFromTables({ value: str('B.1'), ...relations, sublineages: true })
                .render(),
        ).toBe("lineage.lineageFromTables('B.1', 'mpox_lineage', 'mpox_lineage_aliases', includeSublineages := true)");
    });

    test('chain onto each other', () => {
        expect(field('main').at(1722).eq(str('T')).render()).toBe("main.at(1722) = 'T'");
    });
});

describe('records and sets', () => {
    test('render as the instance takes them', () => {
        expect(record({ n: count() }).render()).toBe('{n := count()}');
        expect(record({ p1: field('main').at(1722), sampleId: field('sampleId') }).render()).toBe(
            '{p1 := main.at(1722), sampleId := sampleId}',
        );
        expect(set([field('sampleId'), field('batchId')]).render()).toBe('{sampleId, batchId}');
    });
});

describe('the named functions', () => {
    test('carry their argument names and their sequence as a literal', () => {
        expect(aminoAcidEquals({ position: 501, symbol: 'X', sequenceName: 'S' }).render()).toBe(
            "aminoAcidEquals(position := 501, symbol := 'X', sequenceName := 'S')",
        );
        expect(isNotNull(field('S')).render()).toBe('isNotNull(S)');
        expect(count().render()).toBe('count()');
    });

    test('aggregate a column, and test it for null', () => {
        expect(countOf('lineage').render()).toBe('count(lineage)');
        expect(sum('n').render()).toBe('sum(n)');
        expect(min('date').render()).toBe('min(date)');
        expect(max('date').render()).toBe('max(date)');
        expect(isNull(field('lineage')).render()).toBe('isNull(lineage)');
    });

    test('a call with positional and named arguments', () => {
        expect(callWith('f', [int(1)], { flag: bool(true) }).render()).toBe('f(1, flag := true)');
        expect(callWith('f', [int(1)], {}).render()).toBe('f(1)');
    });

    test('reject a position the instance cannot have', () => {
        expect(() => nucleotideEquals({ position: 0, symbol: 'A', sequenceName: 'main' })).toThrow();
    });

    test('has-mutation / insertion-contains carry their names and require a sequence', () => {
        expect(hasMutation({ position: 241, sequenceName: 'main' }).render()).toBe(
            "hasMutation(position := 241, sequenceName := 'main')",
        );
        expect(hasAAMutation({ position: 501, sequenceName: 'S' }).render()).toBe(
            "hasAAMutation(position := 501, sequenceName := 'S')",
        );
        expect(insertionContains({ position: 22204, value: 'GAGCCAGAA', sequenceName: 'main' }).render()).toBe(
            "insertionContains(position := 22204, value := 'GAGCCAGAA', sequenceName := 'main')",
        );
        expect(aminoAcidInsertionContains({ position: 214, value: 'EPE', sequenceName: 'S' }).render()).toBe(
            "aminoAcidInsertionContains(position := 214, value := 'EPE', sequenceName := 'S')",
        );
    });

    test('maybe wraps a child; nOf mixes a count, a set and an optional flag', () => {
        expect(maybe(nucleotideEquals({ position: 241, symbol: 'T', sequenceName: 'main' })).render()).toBe(
            "maybe(nucleotideEquals(position := 241, symbol := 'T', sequenceName := 'main'))",
        );
        const matchers = [
            nucleotideEquals({ position: 1, symbol: 'T', sequenceName: 'main' }),
            nucleotideEquals({ position: 2, symbol: 'A', sequenceName: 'main' }),
        ];
        expect(nOf(1, matchers).render()).toBe(
            "nOf(1, {nucleotideEquals(position := 1, symbol := 'T', sequenceName := 'main'), " +
                "nucleotideEquals(position := 2, symbol := 'A', sequenceName := 'main')})",
        );
        expect(nOf(2, matchers, { matchExactly: true }).render()).toBe(
            "nOf(2, {nucleotideEquals(position := 1, symbol := 'T', sequenceName := 'main'), " +
                "nucleotideEquals(position := 2, symbol := 'A', sequenceName := 'main')}, matchExactly := true)",
        );
    });
});
