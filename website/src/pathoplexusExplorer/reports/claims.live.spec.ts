import { describe, expect, test } from 'vitest';

import { entryTermsOf } from './useEntries.ts';
import { getStagingRhydbUrl } from '../../../scripts/pathoplexusExplorerConfig.mjs';
import { countriesIn } from '../../components/pathoplexusExplorer/report/areaScale.ts';
import { defined } from '../defined.fixture.ts';
import { CATALOG } from '../domain/catalog.ts';
import { canonicalCountryOf } from '../domain/geography.ts';
import { comparableParentOf } from '../domain/reference.ts';
import { parseSubject, subjectLabel } from '../domain/subject.ts';
import { groupAcross } from '../rhydb/queries/builders.ts';
import { lineageDefinitionsQuery } from '../rhydb/queries/definitions.ts';
import { hierarchyOf, resolveScopes, scopePlan } from '../rhydb/queries/resolve.ts';
import { COLUMNS, type Scope } from '../rhydb/queries/scope.ts';
import { textOf } from '../rhydb/transport/connection.ts';
import { query } from '../rhydb/transport/query.ts';
import type { RhydbRow } from '../rhydb/transport/row.ts';

/** Compare report claims with independent counts from the staging RhyDB instance. */

const INSTANCE = await getStagingRhydbUrl();
const WORLD = { level: 'world' } as const;

async function rowsOf(relation: Parameters<typeof textOf>[0]): Promise<RhydbRow[]> {
    return query(INSTANCE, textOf(relation));
}

const DEFINED_COLUMNS = [{ table: 'rsv_a', column: 'lineage' }];

async function hierarchy() {
    return hierarchyOf(await rowsOf(defined(lineageDefinitionsQuery(DEFINED_COLUMNS), 'the definitions query')));
}

async function resolved(scope: Scope) {
    const plan = scopePlan([scope], CATALOG);
    const answers = await Promise.all(plan.queries.map(rowsOf));
    return resolveScopes(plan, answers, await hierarchy())[0];
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
        const independent = new Set(recorded.map((name) => canonicalCountryOf(name))).size;

        expect(independent).toBeGreaterThan(0);
        expect(countriesIn(rows)).toBe(independent);
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

    test('"coverage in C sequences, P% of which have the mutation" adds up at the position', async () => {
        const entry = await resolved(scope);
        const rows = await rowsOf(
            `mpox.filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)` +
                `.map({symbol := OPG197.at(42)}).group(by := {symbol}, aggs := {n := count()})`,
        );
        const all = countOf(await rowsOf(groupAcross({ tables: entry.tables, filter: entry.filter, columns: [] })));
        const called = countOf(rows.filter((row) => row.symbol !== null));

        // Each entry contributes exactly one called, ambiguous, or absent symbol at a position.
        expect(countOf(rows)).toBe(all);
        expect(called).toBeGreaterThan(0);
        expect(called).toBeLessThan(all);
    }, 120_000);
});
