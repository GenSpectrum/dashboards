import { describe, expect, test } from 'vitest';

import { and, field, str } from './expression.ts';
import { count, nucleotideEquals } from './functions.ts';
import { table, unionall } from './relation.ts';

const main = field('main');

describe('the pipeline', () => {
    test('a table on its own', () => {
        expect(table('data').render()).toBe('data');
        expect(table('two words').render()).toBe('"two words"');
    });

    test('narrowing, and not narrowing', () => {
        expect(
            table('data')
                .filter(field('sampleId').eq(str('S1')))
                .render(),
        ).toBe("data.filter(sampleId = 'S1')");
        expect(table('data').filter(undefined).render()).toBe('data');
        expect(table('data').filter(and(undefined)).render()).toBe('data');
    });

    test('grouping by names', () => {
        expect(table('data').group({ n: count() }).render()).toBe('data.group(by := {}, aggs := {n := count()})');
        expect(table('data').group({ reads: count() }, ['sampleId', 'batchId']).render()).toBe(
            'data.group(by := {sampleId, batchId}, aggs := {reads := count()})',
        );
    });

    test('grouping by no columns is grouping the whole relation', () => {
        expect(table('data').group({ n: count() }, []).render()).toBe('data.group(by := {}, aggs := {n := count()})');
    });

    test('ordering and paging', () => {
        expect(table('data').group({ n: count() }).order(field('n').desc()).limit(60).render()).toBe(
            'data.group(by := {}, aggs := {n := count()}).order(by := {n.desc()}).limit(60)',
        );
        expect(table('data').group({ n: count() }).order(field('n').desc()).offset(60).limit(60).render()).toBe(
            'data.group(by := {}, aggs := {n := count()}).order(by := {n.desc()}).offset(60).limit(60)',
        );
    });

    test('an offset of zero appends nothing, so no caller writes that branch', () => {
        expect(table('data').offset(0).render()).toBe('data');
        expect(table('data').offset(0).limit(60).render()).toBe('data.limit(60)');
    });

    test('a limit ends the pipeline, which is how offset-before-limit is enforced', () => {
        const limited = table('data').limit(60);
        // The annotation is the assertion: `tsc` fails if offsetting after a
        // limit ever starts typechecking again.
        // @ts-expect-error a limited pipeline has no offset
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the access is the assertion
        limited.offset;
        expect(limited.render()).toBe('data.limit(60)');
    });

    test('rejects paging arguments the instance cannot take', () => {
        expect(() => table('data').limit(0)).toThrow();
        expect(() => table('data').limit(1.5)).toThrow();
        expect(() => table('data').offset(-1)).toThrow();
    });

    test('mutations, with each optional argument present and absent', () => {
        expect(table('data').mutations().render()).toBe('data.mutations()');
        expect(table('data').mutations({ minProportion: 0.05 }).render()).toBe('data.mutations(minProportion := 0.05)');
        expect(table('data').mutations({ minProportion: 0 }).render()).toBe('data.mutations(minProportion := 0)');
        expect(
            table('data')
                .aminoAcidMutations({ minProportion: 0.5, sequenceNames: ['S'], fields: ['position', 'coverage'] })
                .render(),
        ).toBe('data.aminoAcidMutations(minProportion := 0.5, sequenceNames := {S}, fields := {position, coverage})');
        expect(() => table('data').mutations({ minProportion: 1.5 })).toThrow();
    });

    test('insertions, which no other query can see', () => {
        expect(table('data').insertions().render()).toBe('data.insertions()');
        expect(
            table('data')
                .insertions({ sequenceNames: ['main'] })
                .render(),
        ).toBe('data.insertions(sequenceNames := {main})');
    });

    test('the schema', () => {
        expect(table('data').schema().render()).toBe('data.schema()');
    });

    test('a whole grouping, as the browser sends it', () => {
        const query = table('data')
            .filter(
                and(
                    field('sampleId').eq(str('S1')),
                    nucleotideEquals({ position: 23403, symbol: 'G', sequenceName: 'main' }),
                ),
            )
            .map({ p1: main.at(23403), p2: main.at(23404) })
            .group({ n: count() }, ['p1', 'p2'])
            .order(field('n').desc())
            .offset(60)
            .limit(60);
        expect(query.render()).toBe(
            "data.filter(sampleId = 'S1' && nucleotideEquals(position := 23403, symbol := 'G', " +
                "sequenceName := 'main'))" +
                '.map({p1 := main.at(23403), p2 := main.at(23404)})' +
                '.group(by := {p1, p2}, aggs := {n := count()})' +
                '.order(by := {n.desc()}).offset(60).limit(60)',
        );
    });

    test('every step leaves the one before it untouched', () => {
        const scoped = table('data').filter(field('sampleId').eq(str('S1')));
        scoped.group({ n: count() });
        expect(scoped.render()).toBe("data.filter(sampleId = 'S1')");
    });
});

describe('unionall', () => {
    const part = (name: string) => table(name);

    test('one part is that part', () => {
        expect(unionall([part('a')]).render()).toBe('a');
    });

    test('more parts are chained', () => {
        expect(unionall([part('a'), part('b')]).render()).toBe('a.unionall(b)');
        expect(unionall([part('a'), part('b'), part('c')]).render()).toBe('a.unionall(b).unionall(c)');
    });

    test('the union pipes on', () => {
        expect(
            unionall([part('a'), part('b')])
                .group({ n: count() })
                .render(),
        ).toBe('a.unionall(b).group(by := {}, aggs := {n := count()})');
    });

    test('no parts is an error', () => {
        expect(() => unionall([])).toThrow();
    });
});
