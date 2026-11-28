import { describe, expect, test } from 'vitest';

import { groupAcross, rankedValuesQuery, sequences, valueTotalsQuery } from './builders.ts';
import { COLUMNS } from './columns.ts';

const noFilter = () => undefined;
const current = ".filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)";

test('a table is taken as the sequences that it currently holds', () => {
    expect(sequences('dengue').render()).toBe(`dengue${current}`);
});

describe('a grouping across tables', () => {
    test('groups one table directly', () => {
        expect(groupAcross({ tables: ['dengue'], filter: noFilter, columns: [COLUMNS.country] }).render()).toBe(
            `dengue${current}.group(by := {geoLocCountry}, aggs := {n := count()})`,
        );
    });

    test('combines several tables in RhyDB', () => {
        expect(groupAcross({ tables: ['rsv_a', 'rsv_b'], filter: noFilter, columns: [COLUMNS.country] }).render()).toBe(
            `rsv_a${current}.group(by := {geoLocCountry}, aggs := {n := count()})` +
                `.unionall(rsv_b${current}.group(by := {geoLocCountry}, aggs := {n := count()}))` +
                '.group(by := {geoLocCountry}, aggs := {n := sum(n)})',
        );
    });

    test('keeps the table of each row, where asked to', () => {
        expect(groupAcross({ tables: ['zika', 'mpox'], filter: noFilter, columns: [], perTable: true }).render()).toBe(
            `zika${current}.group(by := {}, aggs := {n := count()}).map({organism := 'zika'})` +
                `.unionall(mpox${current}.group(by := {}, aggs := {n := count()}).map({organism := 'mpox'}))`,
        );
    });

    test('asks for its columns under one-letter names where it is compact, and gives the rows their names back', () => {
        const query = groupAcross({
            tables: ['rsv_a', 'rsv_b'],
            filter: noFilter,
            columns: [COLUMNS.lower, COLUMNS.upper],
            perTable: true,
            compact: true,
        });
        expect(query.render()).toContain(".map({organism := 'rsv_a'})");
        expect(query.render()).toContain(".map({organism := 'rsv_b'})");
        expect(query.render()).toMatch(
            /\.map\(\{c0 := sampleCollectionDateRangeLower, c1 := sampleCollectionDateRangeUpper, o := organism\}\)\.project\(\{c0, c1, o, n\}\)$/,
        );
        expect(query.decode?.([{ c0: '2024-01-01', c1: '2024-01-31', n: 7, o: 'rsv_a' }])).toEqual([
            { [COLUMNS.lower]: '2024-01-01', [COLUMNS.upper]: '2024-01-31', n: 7, organism: 'rsv_a' },
        ]);
    });

    test('keeps the count under its own name where it is compact over one table', () => {
        const query = groupAcross({ tables: ['dengue'], filter: noFilter, columns: [COLUMNS.country], compact: true });
        expect(query.render()).toBe(
            `dengue${current}.group(by := {geoLocCountry}, aggs := {n := count()}).map({c0 := geoLocCountry}).project({c0, n})`,
        );
        expect(() => query.decode?.([{ n: 3 }])).toThrow(COLUMNS.country);
        expect(() => query.decode?.([{ c0: null }])).toThrow('missing');
        expect(() => query.decode?.([{ c0: null, n: null }])).toThrow('count');
        expect(query.decode?.([{ c0: 'Brazil', n: 3 }])).toEqual([{ [COLUMNS.country]: 'Brazil', n: 3 }]);
    });
});

test('a ranked list asks for the values that a table prints, and separately for what all of them come to', () => {
    expect(
        rankedValuesQuery({ tables: ['dengue'], filter: noFilter, column: COLUMNS.authors, limit: 5 }).render(),
    ).toBe(`dengue${current}.group(by := {authors}, aggs := {n := count()}).order(by := {n.desc(), authors}).limit(5)`);
    expect(valueTotalsQuery({ tables: ['dengue'], filter: noFilter, column: COLUMNS.authors }).render()).toBe(
        `dengue${current}.group(by := {authors}, aggs := {n := count()}).group(by := {}, aggs := {values := count(), total := sum(n)})`,
    );
});
