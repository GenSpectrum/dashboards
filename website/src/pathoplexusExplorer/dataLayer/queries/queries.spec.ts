import { afterEach, describe, expect, test, vi } from 'vitest';

import {
    COLLECTION_DATES,
    groupAcross,
    rankedValuesQuery,
    scoped,
    sequences,
    SUMMARY,
    valueTotalsQuery,
} from './builders.ts';
import { mutationProfileQuery } from './genomics.ts';
import { COLUMNS, scopeFilter, type ScopeLookups } from './scope.ts';
import { compileVariant } from './variantFilter.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { WORLD } from '../../domain/geography.ts';
import type { Scope } from '../../domain/scope.ts';
import { ALL, parseSubject } from '../../domain/subject.ts';
import { type Subject } from '../../domain/subject.ts';
import { parseVariant, resolveVariant } from '../../domain/variant.ts';
import { defined } from '../../test/defined.fixture.ts';
import { HIERARCHY } from '../../test/hierarchy.fixture.ts';
import { connect } from '../transport/connection.ts';
import { and, field } from '../transport/expression.ts';
import { isNotNull } from '../transport/functions.ts';

const nodeOf = (key: string): Subject => defined(parseSubject(key, CATALOG), `'${key}' in the catalog`);

const lookups: ScopeLookups = {
    hierarchy: HIERARCHY,
    columnValues: (table, column) =>
        table === 'rsv_a' && column === 'lineage' ? ['A.D', 'A.D.1', 'A.D.5.2', 'A.3', 'None', null] : undefined,
};

function scope(partial: Partial<Scope>): Scope {
    return { what: ALL, where: WORLD, period: {}, ...partial };
}

describe('the scope filter', () => {
    test('all pathogens everywhere at any time keep every row', () => {
        expect(scopeFilter(scope({}), lookups)('dengue')).toBeUndefined();
    });

    test('a province gathers every spelling recorded for it', () => {
        const filter = scopeFilter(scope({ where: { level: 'admin1', country: 'USA', admin1: 'Illinois' } }), {
            ...lookups,
            admin1Names: ['Illinois', 'Illinois, Cook County', 'IL', 'Cook, Illinois', 'Texas', null],
        });
        expect(filter('west_nile')?.render()).toBe(
            "geoLocCountry = 'USA' && geoLocAdmin1.in({'Illinois', 'Illinois, Cook County', 'IL', 'Cook, Illinois'})",
        );
    });

    test('a province whose spellings are not known is matched by name', () => {
        const filter = scopeFilter(scope({ where: { level: 'admin1', country: 'USA', admin1: 'Illinois' } }), lookups);
        expect(filter('west_nile')?.render()).toBe("geoLocCountry = 'USA' && geoLocAdmin1 = 'Illinois'");
    });

    test('an end date alone still asks for a collection date, which an undated entry has not got', () => {
        const filter = scopeFilter(scope({ period: { to: '2024-12-31' } }), lookups);
        expect(filter('dengue')?.render()).toBe(
            "isNotNull(sampleCollectionDateRangeLower) && sampleCollectionDateRangeUpper <= '2024-12-31'::date",
        );
    });

    test('place and time, with the country spelled as the data spells it', () => {
        const filter = scopeFilter(
            scope({
                where: { level: 'country', country: "Cote d'Ivoire" },
                period: { from: '2020-01-01', to: '2020-12-31' },
            }),
            lookups,
        );
        expect(filter('dengue')?.render()).toBe(
            "geoLocCountry = 'Cote d''Ivoire' && sampleCollectionDateRangeLower >= '2020-01-01'::date && sampleCollectionDateRangeUpper <= '2020-12-31'::date",
        );
    });

    test("a lineage is resolved against the instance's definition, and only on its own table", () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=A.D') }), lookups);
        expect(filter('rsv_a')?.render()).toBe(
            "lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true)",
        );
        expect(filter('rsv_b')).toBeUndefined();
    });

    test('a lineage left out of a scope is taken off the lineage above it', () => {
        const filter = scopeFilter(
            scope({ what: nodeOf('pathogen:rsv_a/lineage=A.3'), except: nodeOf('pathogen:rsv_a/lineage=A.D') }),
            lookups,
        );
        expect(filter('rsv_a')?.render()).toBe(
            "lineage.lineageFromTables('A.3', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true) && " +
                "!lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true)",
        );
    });

    test('what is left out is left out of its own table alone', () => {
        const filter = scopeFilter(scope({ what: ALL, except: nodeOf('pathogen:rsv_a/lineage=A.D') }), lookups);
        expect(filter('rsv_b')).toBeUndefined();
    });

    test('the unassigned can be left out, under every spelling that the column holds', () => {
        const filter = scopeFilter(
            scope({ what: nodeOf('pathogen:rsv_a'), except: nodeOf('pathogen:rsv_a/lineage=(unassigned)') }),
            lookups,
        );
        expect(filter('rsv_a')?.render()).toBe("!(isNull(lineage) || lineage.in({'None'}))");
    });

    test('a column the instance defines no hierarchy for selects the value alone', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:measles/genotype=D8') }), lookups);
        expect(filter('measles')?.render()).toBe("genotype = 'D8'");
    });

    test('a value the definition does not hold is selected on its own rather than by the definition', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=A.9.9') }), lookups);
        expect(filter('rsv_a')?.render()).toBe("lineage = 'A.9.9'");
    });

    test('unassigned covers missing values and their spellings', () => {
        const filter = scopeFilter(scope({ what: nodeOf('pathogen:rsv_a/lineage=(unassigned)') }), lookups);
        expect(filter('rsv_a')?.render()).toBe("isNull(lineage) || lineage.in({'None'})");
    });

    test('a continent is the list of its countries', () => {
        const rendered = scopeFilter(
            scope({ where: { level: 'continent', continent: 'Oceania' } }),
            lookups,
        )('dengue')?.render();
        expect(rendered).toContain("geoLocCountry.in({'Australia', 'New Zealand', 'Fiji'");
    });
});

describe('queries across tables', () => {
    const filter = scopeFilter(scope({}), lookups);
    const current = ".filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)";

    test('a table is taken as the sequences that it currently holds', () => {
        expect(sequences('dengue').render()).toBe(`dengue${current}`);
        expect(scoped('dengue', () => undefined).render()).toBe(`dengue${current}`);
    });

    test('one table groups directly', () => {
        expect(groupAcross({ tables: ['dengue'], filter, columns: [COLUMNS.country] }).render()).toBe(
            `dengue${current}.group(by := {geoLocCountry}, aggs := {n := count()})`,
        );
    });

    test('several tables are combined in RhyDB', () => {
        expect(groupAcross({ tables: ['rsv_a', 'rsv_b'], filter, columns: [COLUMNS.country] }).render()).toBe(
            `rsv_a${current}.group(by := {geoLocCountry}, aggs := {n := count()}).map({organism := 'rsv_a'}).project({geoLocCountry, n, organism})` +
                `.unionall(rsv_b${current}.group(by := {geoLocCountry}, aggs := {n := count()}).map({organism := 'rsv_b'}).project({geoLocCountry, n, organism}))` +
                '.group(by := {geoLocCountry}, aggs := {n := sum(n)})',
        );
    });

    test('per table, the rows keep their table', () => {
        const rendered = groupAcross({
            tables: ['zika', 'mpox'],
            filter,
            columns: [],
            aggregates: SUMMARY,
            perTable: true,
        }).render();
        expect(rendered).toBe(
            `zika${current}.group(by := {}, aggs := {n := count(), lastReleased := max(earliestReleaseDate)}).map({organism := 'zika'}).project({n, lastReleased, organism})` +
                `.unionall(mpox${current}.group(by := {}, aggs := {n := count(), lastReleased := max(earliestReleaseDate)}).map({organism := 'mpox'}).project({n, lastReleased, organism}))`,
        );
    });

    test('the collection dates are asked over the entries that have one', () => {
        const rendered = groupAcross({
            tables: ['zika'],
            filter: (table) => and(filter(table), isNotNull(field(COLUMNS.lower))),
            columns: [],
            aggregates: COLLECTION_DATES,
            perTable: true,
        }).render();
        // An undated entry can still have a release date as its upper bound.
        expect(rendered).toContain('isNotNull(sampleCollectionDateRangeLower)');
        expect(rendered).toContain('lastCollectedTo := max(sampleCollectionDateRangeUpper)');
    });

    test('a compact read asks for its grouping columns under one-letter names', () => {
        const query = groupAcross({
            tables: ['rsv_a', 'rsv_b'],
            filter,
            columns: [COLUMNS.lower, COLUMNS.upper],
            perTable: true,
            compact: true,
        });
        expect(query.render()).toBe(
            `rsv_a${current}.group(by := {sampleCollectionDateRangeLower, sampleCollectionDateRangeUpper}, aggs := {n := count()})` +
                `.map({c0 := sampleCollectionDateRangeLower, c1 := sampleCollectionDateRangeUpper, o := 'rsv_a'}).project({c0, c1, n, o})` +
                `.unionall(rsv_b${current}.group(by := {sampleCollectionDateRangeLower, sampleCollectionDateRangeUpper}, aggs := {n := count()})` +
                `.map({c0 := sampleCollectionDateRangeLower, c1 := sampleCollectionDateRangeUpper, o := 'rsv_b'}).project({c0, c1, n, o}))`,
        );
        expect(query.decode?.([{ c0: '2024-01-01', c1: '2024-01-31', n: 7, o: 'rsv_a' }])).toEqual([
            {
                [COLUMNS.lower]: '2024-01-01',
                [COLUMNS.upper]: '2024-01-31',
                n: 7,
                organism: 'rsv_a',
            },
        ]);
    });

    test('a compact read of one table keeps the aggregate under its own name', () => {
        const query = groupAcross({ tables: ['dengue'], filter, columns: [COLUMNS.country], compact: true });
        expect(query.render()).toBe(
            `dengue${current}.group(by := {geoLocCountry}, aggs := {n := count()}).map({c0 := geoLocCountry}).project({c0, n})`,
        );
        expect(query.decode?.([{ c0: 'Brazil', n: 3 }])).toEqual([{ [COLUMNS.country]: 'Brazil', n: 3 }]);
    });

    test('a ranked read asks the instance for the rows a table prints, and what the rest come to', () => {
        expect(rankedValuesQuery({ tables: ['dengue'], filter, column: COLUMNS.authors, limit: 5 }).render()).toBe(
            `dengue${current}.group(by := {authors}, aggs := {n := count()}).order(by := {n.desc(), authors}).limit(5)`,
        );
        expect(valueTotalsQuery({ tables: ['dengue'], filter, column: COLUMNS.authors }).render()).toBe(
            `dengue${current}.group(by := {authors}, aggs := {n := count()}).group(by := {}, aggs := {values := count(), total := sum(n)})`,
        );
    });

    test('mutations', () => {
        expect(
            mutationProfileQuery({
                tableName: 'mpox',
                filter: undefined,
                request: { kind: 'aminoAcid', minProportion: 0.9 },
            }).render(),
        ).toBe(
            `mpox${current}.aminoAcidMutations(minProportion := 0.9, fields := {mutationFrom, mutationTo, sequenceName, position, proportion, coverage, count})`,
        );
    });
});

describe('a variant query as a filter', () => {
    const sequences = {
        nucleotide: [{ name: 'main', display: '' }],
        aminoAcid: [{ name: 'F', display: 'F' }],
    };
    const context = { sequences, columns: [{ column: 'lineage', hierarchical: true }] };
    const compile = (text: string) => {
        const parsed = parseVariant(text);
        if (!parsed.ok) {
            throw new Error(`'${text}' could not be parsed`);
        }
        const resolved = resolveVariant(parsed.node, context);
        if (!resolved.ok) {
            throw new Error(resolved.error);
        }
        return compileVariant(resolved.node, 'rsv_a', HIERARCHY).render();
    };

    test('a named symbol, a bare position and a deletion', () => {
        expect(compile('F:K68N')).toBe("aminoAcidEquals(position := 68, symbol := 'N', sequenceName := 'F')");
        expect(compile('F:68')).toBe("hasAAMutation(position := 68, sequenceName := 'F')");
        expect(compile('C466T')).toBe("nucleotideEquals(position := 466, symbol := 'T', sequenceName := 'main')");
        expect(compile('466')).toBe("hasMutation(position := 466, sequenceName := 'main')");
        expect(compile('466-')).toBe("nucleotideEquals(position := 466, symbol := '-', sequenceName := 'main')");
    });

    test('the operators of the language', () => {
        expect(compile('F:K68N & !C466T')).toBe(
            "aminoAcidEquals(position := 68, symbol := 'N', sequenceName := 'F') && " +
                "!nucleotideEquals(position := 466, symbol := 'T', sequenceName := 'main')",
        );
        expect(compile('F:68 | F:69')).toBe(
            "hasAAMutation(position := 68, sequenceName := 'F') || hasAAMutation(position := 69, sequenceName := 'F')",
        );
        expect(compile('maybe(F:K68N)')).toBe(
            "maybe(aminoAcidEquals(position := 68, symbol := 'N', sequenceName := 'F'))",
        );
        expect(compile('[exactly-1-of: F:68, F:69]')).toBe(
            "nOf(1, {hasAAMutation(position := 68, sequenceName := 'F'), hasAAMutation(position := 69, sequenceName := 'F')}, matchExactly := true)",
        );
    });

    test('an insertion, whose ? stands for any symbols', () => {
        expect(compile('ins_F:214:E?PE')).toBe(
            "aminoAcidInsertionContains(position := 214, value := 'E.*PE', sequenceName := 'F')",
        );
    });

    test('a lineage, with the lineages below it when it ends in a star', () => {
        expect(compile('lineage:A.D')).toBe("lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases)");
        expect(compile('lineage:A.D*')).toBe(
            "lineage.lineageFromTables('A.D', rsv_a_lineage, rsv_a_lineage_aliases, includeSublineages := true)",
        );
        expect(compile('lineage:A.9.9*')).toBe("lineage = 'A.9.9'");
    });
});

describe('a grouping across tables with compact column names', () => {
    const connection = connect({ url: 'https://rhydb.example.org/pathoplexus' });

    function answers(body: string) {
        vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 })));
    }

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('answers under the names that a panel uses', async () => {
        answers('{"c0":"2024-01-01","c1":"2024-01-31","n":3}\n');

        const query = groupAcross({
            tables: ['mpox'],
            filter: () => undefined,
            columns: [COLUMNS.lower, COLUMNS.upper],
            compact: true,
        });

        await expect(connection.query(query, 'Over time')).resolves.toMatchObject({
            rows: [{ [COLUMNS.lower]: '2024-01-01', [COLUMNS.upper]: '2024-01-31', n: 3 }],
        });
    });

    test('is passed through as it came when it asked for the full names', async () => {
        answers('{"geoLocCountry":"Uganda","n":7}\n');

        const query = groupAcross({ tables: ['mpox'], filter: () => undefined, columns: [COLUMNS.country] });

        await expect(connection.query(query, 'Places')).resolves.toMatchObject({
            rows: [{ geoLocCountry: 'Uganda', n: 7 }],
        });
    });
});
