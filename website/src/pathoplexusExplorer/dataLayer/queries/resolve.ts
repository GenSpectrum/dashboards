import { admin1ValuesQuery, referenceGenomesQuery, valuesQuery } from './builders.ts';
import { DEFINITION_COLUMN, DEFINITION_JSON, definitionNameOf } from './definitions.ts';
import { COLUMNS, lookupsNeeded, scopeFilter, type ScopeLookups, type TableFilter } from './scope.ts';
import { lineageTreeOf, type Hierarchy, type LineageDefinition, type LineageTree } from '../../domain/lineages.ts';
import { referenceOf, referenceSequencesOf, type ReferenceRow } from '../../domain/reference.ts';
import type { Scope } from '../../domain/scope.ts';
import { isPathogenNode, pathogensOf, type Catalog, type Subject } from '../../domain/subject.ts';
import type { ReferenceSequences } from '../../domain/variant.ts';
import type { Relation } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

export type ResolvedScope = {
    scope: Scope;
    tables: string[];
    filter: TableFilter;
    lookups: ScopeLookups;
};

type Need = {
    scope: Scope;
    tables: string[];
    references: boolean;
    admin1Country: string | undefined;
};

/** Share lookups across scopes before building their table filters. */
type ScopePlan = {
    needs: Need[];
    columnNeeds: { table: string; column: string }[];
    admin1Needs: { tables: string[]; country: string }[];
    wantsReferences: boolean;
    queries: Relation[];
};

export function scopePlan(scopes: readonly Scope[], catalog: Catalog): ScopePlan {
    const needs = scopes.map((scope) => ({
        scope,
        tables: pathogensOf(scope.what, catalog).map((pathogen) => pathogen.table),
        ...lookupsNeeded(scope),
    }));
    const columnNeeds = uniqueBy(
        needs.flatMap((need) => need.columns),
        (need) => `${need.table}|${need.column}`,
    );
    const admin1Needs = uniqueBy(
        needs.flatMap((need) =>
            need.admin1Country === undefined ? [] : [{ tables: need.tables, country: need.admin1Country }],
        ),
        (need) => `${need.tables.join(',')}|${need.country}`,
    );
    const wantsReferences = needs.some((need) => need.references);
    const queries = [
        ...columnNeeds.map((need) => valuesQuery([need.table], need.column)),
        ...admin1Needs.map((need) => admin1ValuesQuery(need.tables, need.country)),
        ...(wantsReferences ? [referenceGenomesQuery()] : []),
    ];
    return { needs, columnNeeds, admin1Needs, wantsReferences, queries };
}

/** Rows follow the order of the queries in the plan. */
export function resolveScopes(
    plan: ScopePlan,
    rows: readonly (readonly RhydbRow[])[],
    hierarchy: Hierarchy,
): ResolvedScope[] {
    const { needs, columnNeeds, admin1Needs, wantsReferences } = plan;
    const columnValues = new Map(
        columnNeeds.map((need, index) => [`${need.table}|${need.column}`, valuesOf(rows[index], need.column)]),
    );
    const admin1Names = new Map(
        admin1Needs.map((need, index) => [
            `${need.tables.join(',')}|${need.country}`,
            valuesOf(rows[columnNeeds.length + index], COLUMNS.admin1),
        ]),
    );
    const referenceRows = wantsReferences ? referenceRowsOf(rows[rows.length - 1]) : [];
    return needs.map(({ scope, tables, references, admin1Country }): ResolvedScope => {
        const lookups: ScopeLookups = {
            hierarchy,
            columnValues: (table, column) => columnValues.get(`${table}|${column}`),
            admin1Names:
                admin1Country === undefined ? undefined : admin1Names.get(`${tables.join(',')}|${admin1Country}`),
            references: references ? referenceSequencesFor(scope.what, referenceRows) : undefined,
        };
        return { scope, tables, filter: scopeFilter(scope, lookups), lookups };
    });
}

export function referenceRowsOf(rows: readonly RhydbRow[]): ReferenceRow[] {
    return rows.map((row) => ({ name: String(row.name), type: String(row.type) }));
}

export function referenceSequencesFor(what: Subject, rows: readonly ReferenceRow[]): ReferenceSequences | undefined {
    if (!isPathogenNode(what)) {
        return undefined;
    }
    const reference = referenceOf(what.pathogen, what);
    return reference.status === 'needed' ? undefined : referenceSequencesOf(what.pathogen, reference, rows);
}

/** Columns without a returned definition have no hierarchy. */
export function hierarchyOf(rows: readonly RhydbRow[]): Hierarchy {
    const trees = new Map<string, LineageTree>();
    for (const row of rows) {
        const name = String(row[DEFINITION_COLUMN]);
        const written = row[DEFINITION_JSON];
        if (typeof written !== 'string') {
            throw new Error(`The lineage definition of ${name} is not written as text.`);
        }
        let definition: LineageDefinition;
        try {
            definition = JSON.parse(written) as LineageDefinition;
        } catch {
            throw new Error(`The lineage definition of ${name} could not be read.`);
        }
        trees.set(name, lineageTreeOf(definition));
    }
    return (table, column) => trees.get(definitionNameOf(table, column));
}

export function valuesOf(rows: readonly RhydbRow[], column: string): (string | null)[] {
    return rows.map((row) => (row[column] ?? null) as string | null);
}

function uniqueBy<T>(items: readonly T[], keyOf: (item: T) => string): T[] {
    const seen = new Map<string, T>();
    for (const item of items) {
        if (!seen.has(keyOf(item))) {
            seen.set(keyOf(item), item);
        }
    }
    return [...seen.values()];
}
