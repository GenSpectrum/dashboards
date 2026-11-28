import { describe, expect, test } from 'vitest';

import { entryTermsOf } from './dataLayer/queries/accessionList.ts';
import { groupAcross } from './dataLayer/queries/builders.ts';
import { COLUMNS } from './dataLayer/queries/columns.ts';
import { lineageDefinitionsQuery } from './dataLayer/queries/definitions.ts';
import { dimensionsFor } from './dataLayer/queries/dimensions.ts';
import { positionReadingOf } from './dataLayer/queries/positions.ts';
import { hierarchyOf, scopePlan } from './dataLayer/queries/resolve.ts';
import { compileSelection } from './dataLayer/queries/selection.ts';
import { symbolCountsQuery } from './dataLayer/queries/sequences.ts';
import { countryCounts } from './dataLayer/queries/summary.ts';
import { connect } from './dataLayer/transport/connection.ts';
import type { Queryable } from './dataLayer/transport/relation.ts';
import type { RhydbRow } from './dataLayer/transport/row.ts';
import { CATALOG } from './domain/catalog.ts';
import { canonicalCountryOf, recordedPlaceOf, subregionOf } from './domain/geography.ts';
import { comparableParentOf } from './domain/reference.ts';
import type { Scope } from './domain/scope.ts';
import { ALL, allPathogens, parseSubject, subjectLabel } from './domain/subject.ts';
import { MUTATION_KIND } from './domain/variant.ts';
import { defined } from './test/defined.fixture.ts';
import { getStagingRhydbUrl } from '../../scripts/pathoplexusExplorerConfig.ts';

/** Compare report claims with independent counts from the staging RhyDB instance. */

let snapshot: string | null;
const connection = connect({
    url: await getStagingRhydbUrl(),
    checkVersion(version) {
        expect(version).toMatch(/^\d+$/);
        snapshot ??= version;
        expect(version, 'snapshot shared by the independent and dashboard counts').toBe(snapshot);
    },
});
const WORLD = { level: 'world' } as const;

async function rowsOf(query: Queryable | string): Promise<RhydbRow[]> {
    return (await connection.query(query, 'Live check')).rows;
}

const DEFINED_COLUMNS = [{ table: 'rsv_a', column: 'lineage' }];

async function hierarchy() {
    return hierarchyOf(await rowsOf(defined(lineageDefinitionsQuery(DEFINED_COLUMNS), 'the definitions query')));
}

async function resolved(scope: Scope) {
    const plan = scopePlan([scope], CATALOG);
    const answers = await Promise.all(plan.queries.map(rowsOf));
    return plan.resolve(answers, await hierarchy())[0];
}

function countOf(rows: readonly RhydbRow[]): number {
    return rows.reduce((sum, row) => sum + Number(row.n ?? 0), 0);
}

async function descendantsOf(definitionColumn: string, lineage: string): Promise<Set<string>> {
    const rows = await rowsOf(defined(lineageDefinitionsQuery(DEFINED_COLUMNS), 'the definitions query'));
    const row = rows.find((entry) => entry.column_name === definitionColumn);
    const definition = JSON.parse(String(row?.definition ?? '{}')) as Record<string, { parents?: string[] }>;
    const children = new Map<string, string[]>();
    for (const [name, entry] of Object.entries(definition)) {
        for (const parent of entry.parents ?? []) {
            children.set(parent, [...(children.get(parent) ?? []), name]);
        }
    }
    const below = new Set<string>();
    const walk = (name: string) => {
        for (const child of children.get(name) ?? []) {
            if (!below.has(child)) {
                below.add(child);
                walk(child);
            }
        }
    };
    walk(lineage);
    return below;
}

describe('a lineage report states what it counts', () => {
    const lineage = defined(parseSubject('pathogen:rsv_a/lineage=A.3.1.1', CATALOG), 'the RSV-A lineage A.3.1.1');
    const scope: Scope = { what: lineage, where: WORLD, period: {} };

    test('"holds N sequences assigned to X" counts the lineage and every name below it', async () => {
        const entry = await resolved(scope);
        const stated = countOf(await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [] })));

        const below = await descendantsOf('rsv_a_lineage', 'A.3.1.1');
        const names = [...below, 'A.3.1.1'].map((name) => `'${name}'`).join(', ');
        const independent = countOf(
            await rowsOf(
                `rsv_a.filter(versionStatus = 'LATEST_VERSION' && isRevocation = false && lineage.in({${names}}))` +
                    `.group(by := {}, aggs := {n := count()})`,
            ),
        );

        expect(stated).toBeGreaterThan(0);
        expect(stated).toBe(independent);
    }, 120_000);

    test('"from M countries" counts the countries its own sequences record', async () => {
        const entry = await resolved(scope);
        const rows = await rowsOf(
            groupAcross({ tables: entry.tables, filter: entry.filter, columns: [COLUMNS.country] }),
        );

        const recorded = rows
            .map((row) => row[COLUMNS.country])
            .filter((value): value is string => typeof value === 'string');
        // These recorded locations identify a region or ocean but no single present-day country.
        const regional = [
            'Borneo',
            'Korea',
            'Serbia and Montenegro',
            'Yugoslavia',
            'Netherlands Antilles',
            'Atlantic Ocean',
            'Pacific Ocean',
        ];
        const independent = new Set(recorded.filter((name) => !regional.includes(name)).map(canonicalCountryOf)).size;

        expect(independent).toBeGreaterThan(0);
        expect(countryCounts(rows).size).toBe(independent);
    }, 120_000);

    test('"It lies within P" names the parent the instance defines', async () => {
        const parent = defined(comparableParentOf(lineage, await hierarchy()), 'the level above A.3.1.1');

        const below = await descendantsOf('rsv_a_lineage', 'A.3.1');
        expect(below.has('A.3.1.1')).toBe(true);
        expect(subjectLabel(parent)).toBe('A.3.1');
    }, 120_000);

    test('"A of B sequences are under the Open Use Terms" counts every entry the report uses', async () => {
        const above = defined(comparableParentOf(lineage, await hierarchy()), 'the level above A.3.1.1');
        const entry = await resolved({
            what: above,
            where: WORLD,
            period: {},
        });
        const terms = entryTermsOf(
            await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [COLUMNS.dataUseTerms] })),
        );
        const total = countOf(await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [] })));

        expect(total).toBeGreaterThan(0);
        expect(terms.total).toBe(total);
        expect(terms.restricted).toBeLessThanOrEqual(terms.total);
    }, 120_000);
});

describe('a mutation report states what it counts', () => {
    const mpox = defined(parseSubject('pathogen:mpox', CATALOG), 'mpox');
    const scope: Scope = { what: mpox, where: WORLD, period: {} };
    const QUERY = 'OPG197:E42-';

    test('"N sequences have Q, out of M in the selection" counts the same selection twice', async () => {
        const entry = await resolved(scope);
        const selection = countOf(
            await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [] })),
        );
        const carrying = await resolved({ ...scope, variant: QUERY });
        const carriers = countOf(
            await rowsOf(groupAcross({ tables: carrying.tables, filter: carrying.filter, columns: [] })),
        );

        expect(carriers).toBeGreaterThan(0);
        expect(carriers).toBeLessThanOrEqual(selection);
    }, 120_000);

    test('"coverage in C sequences, P% of which have the mutation" counts the sequences that "N sequences have Q" counts', async () => {
        const entry = await resolved(scope);
        const carrying = await resolved({ ...scope, variant: QUERY });
        const mutation = {
            type: 'mutation',
            kind: MUTATION_KIND.aminoAcid,
            sequence: 'OPG197',
            display: 'OPG197',
            position: 42,
            to: '-',
        } as const;
        const symbols = await rowsOf(
            symbolCountsQuery({ table: 'mpox', filter: entry.filter('mpox'), sequence: 'OPG197', position: 42 }),
        );
        const reading = positionReadingOf(mutation, { nucleotide: [], aminoAcid: [] }, symbols, undefined);
        const all = countOf(await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [] })));
        const carriers = countOf(
            await rowsOf(groupAcross({ tables: carrying.tables, filter: carrying.filter, columns: [] })),
        );

        expect(reading.carriers).toBeGreaterThan(0);
        expect(reading.carriers).toBe(carriers);
        expect(reading.read + reading.ambiguous + reading.absent).toBe(all);
    }, 120_000);
});

test('Matrix country and collection year filters partition current sequences, including incomplete records', async () => {
    const tables = ['mpox'];
    const dimensions = dimensionsFor({ catalog: CATALOG, tables });
    const raw = await rowsOf(
        "mpox.filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)" +
            '.group(by := {geoLocCountry, sampleCollectionDateRangeLower, sampleCollectionDateRangeUpper}, aggs := {n := count()})',
    );
    const lookup = { countries: [...new Set(raw.map((row) => row.geoLocCountry as string | null))] };
    for (const [id, value, matches] of [
        ['country', 'Brazil', (row: RhydbRow) => row.geoLocCountry === 'Brazil'],
        [
            'year',
            '2024',
            (row: RhydbRow) =>
                String(row.sampleCollectionDateRangeLower).startsWith('2024-') &&
                String(row.sampleCollectionDateRangeUpper).startsWith('2024-'),
        ],
        ['region', 'No such region', () => false],
    ] as const) {
        for (const exclude of [false, true]) {
            const selection = { dimensions: { [id]: { values: [value], exclude } }, period: {} };
            const compiled = compileSelection({ tables, dimensions, lookup, selection });
            const count = countOf(await rowsOf(groupAcross({ ...compiled, columns: [] })));
            expect(count, `${id} ${value}, exclude=${exclude}`).toBe(
                countOf(raw.filter((row) => matches(row) !== exclude)),
            );
        }
    }
}, 120_000);

test('current geographic records are covered by the regional classification and country reports count only their country', async () => {
    const tables = allPathogens(CATALOG).map(({ table }) => table);
    const locations = await rowsOf(groupAcross({ tables, columns: [COLUMNS.country], filter: () => undefined }));
    const unplaced = locations
        .map((row) => recordedPlaceOf(row.geoLocCountry))
        .filter((name): name is string => name !== null && subregionOf(name) === undefined);
    expect(unplaced.filter((name) => !['Atlantic Ocean', 'Pacific Ocean'].includes(name))).toEqual([]);
    for (const country of ['Serbia', 'South Korea']) {
        const report = await resolved({ what: ALL, where: { level: 'country', country }, period: {} });
        const reported = countOf(await rowsOf(groupAcross({ ...report, columns: [] })));
        expect(reported).toBe(countOf(locations.filter((row) => row.geoLocCountry === country)));
    }
}, 120_000);
