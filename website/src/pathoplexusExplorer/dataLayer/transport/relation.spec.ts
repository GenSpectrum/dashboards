import { describe, expect, test } from 'vitest';

import { field, str } from './expression.ts';
import { count } from './functions.ts';
import { table, unionall } from './relation.ts';

describe('the pipeline', () => {
    test('starts from a table, by name', () => {
        expect(table('data').render()).toBe('data');
        expect(table('two words').render()).toBe('"two words"');
    });

    test('narrows by a filter, or not at all where there is none', () => {
        expect(
            table('data')
                .filter(field('sampleId').eq(str('S1')))
                .render(),
        ).toBe("data.filter(sampleId = 'S1')");
        expect(table('data').filter(undefined).render()).toBe('data');
    });

    test('groups by names, or over the whole relation', () => {
        expect(table('data').group({ n: count() }, ['sampleId', 'batchId']).render()).toBe(
            'data.group(by := {sampleId, batchId}, aggs := {n := count()})',
        );
        expect(table('data').group({ n: count() }).render()).toBe('data.group(by := {}, aggs := {n := count()})');
        expect(table('data').group({ n: count() }, []).render()).toBe('data.group(by := {}, aggs := {n := count()})');
    });

    test('computes, keeps and orders columns', () => {
        expect(
            table('data')
                .map({ p1: field('main').at(23403) })
                .project(['p1', 'n'])
                .order(field('n').desc(), field('p1'))
                .render(),
        ).toBe('data.map({p1 := main.at(23403)}).project({p1, n}).order(by := {n.desc(), p1})');
    });

    test('ends with a limit, which nothing can follow', () => {
        const limited = table('data').limit(60);
        expect(limited.render()).toBe('data.limit(60)');
        // @ts-expect-error a limited pipeline cannot be filtered further
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the access is the assertion
        limited.filter;
        expect(() => table('data').limit(0)).toThrow();
    });

    test('lists mutations, with each optional argument present and absent', () => {
        expect(table('data').mutations().render()).toBe('data.mutations()');
        expect(
            table('data')
                .aminoAcidMutations({ minProportion: 0.5, fields: ['position', 'coverage'] })
                .render(),
        ).toBe('data.aminoAcidMutations(minProportion := 0.5, fields := {position, coverage})');
        expect(() => table('data').mutations({ minProportion: 1.5 })).toThrow();
    });

    test('leaves every step before it untouched', () => {
        const scoped = table('data').filter(field('sampleId').eq(str('S1')));
        scoped.group({ n: count() });
        expect(scoped.render()).toBe("data.filter(sampleId = 'S1')");
    });
});

describe('unionall', () => {
    test('of one part is that part, and chains any more', () => {
        expect(unionall([table('a')]).render()).toBe('a');
        expect(unionall([table('a'), table('b'), table('c')]).render()).toBe('a.unionall(b).unionall(c)');
    });

    test('of no parts is an error', () => {
        expect(() => unionall([])).toThrow();
    });
});
