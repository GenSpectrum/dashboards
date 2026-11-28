import { admin1ValuesQuery, referenceGenomesQuery, valuesQuery } from './builders.ts';
import { COLUMNS } from './columns.ts';
import { DEFINITION_COLUMN, DEFINITION_JSON, definitionNameOf } from './definitions.ts';
import { lookupsNeeded, scopeFilter, type ScopeLookups, type TableFilter } from './scope.ts';
import { lineageTreeOf, type Hierarchy, type LineageDefinition, type LineageTree } from '../../domain/lineages.ts';
import { referenceOf, referenceSequencesOf, type ReferenceRow } from '../../domain/reference.ts';
import type { Scope } from '../../domain/scope.ts';
import { isPathogenNode, pathogensOf, type Catalog, type Subject } from '../../domain/subject.ts';
import type { ReferenceSequences } from '../../domain/variant.ts';
import type { Relation } from '../transport/relation.ts';
import { readOptionalText, readText, type RhydbRow } from '../transport/row.ts';

export type ResolvedScope = {
    scope: Scope;
    tables: string[];
    filter: TableFilter;
    lookups: ScopeLookups;
};

/** Register each distinct lookup once and retain its result position with the scope that needs it. */
export function scopePlan(scopes: readonly Scope[], catalog: Catalog) {
    const queries: Relation[] = [];
    const indices = new Map<string, number>();
    function register(query: Relation) {
        const key = query.render();
        const index = indices.get(key);
        if (index !== undefined) {
            return index;
        }
        const position = queries.push(query) - 1;
        indices.set(key, position);
        return position;
    }

    const pending = scopes.map((scope) => {
        const tables = pathogensOf(scope.what, catalog).map((pathogen) => pathogen.table);
        const needs = lookupsNeeded(scope);
        const columns = needs.columns.map(({ table, column }) => ({
            table,
            column,
            index: register(valuesQuery([table], column)),
        }));
        const divisions =
            needs.admin1Country === undefined ? undefined : register(admin1ValuesQuery(tables, needs.admin1Country));
        const references = needs.references ? register(referenceGenomesQuery()) : undefined;
        return { scope, tables, columns, divisions, references };
    });
    function resolve(rows: readonly (readonly RhydbRow[])[], hierarchy: Hierarchy): ResolvedScope[] {
        return pending.map(({ scope, tables, columns, divisions, references }) => {
            const lookups: ScopeLookups = {
                hierarchy,
                columnValues: (table, column) => {
                    const need = columns.find((entry) => entry.table === table && entry.column === column);
                    return need === undefined ? undefined : valuesOf(rows[need.index], column);
                },
                admin1Names: divisions === undefined ? undefined : valuesOf(rows[divisions], COLUMNS.admin1),
                references:
                    references === undefined
                        ? undefined
                        : referenceSequencesFor(scope.what, referenceRowsOf(rows[references])),
            };
            return { scope, tables, filter: scopeFilter(scope, lookups), lookups };
        });
    }
    return { queries, resolve };
}

export function referenceRowsOf(rows: readonly RhydbRow[]): ReferenceRow[] {
    return rows.map((row) => ({ name: readText(row, 'name'), type: readText(row, 'type') }));
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
        const name = readText(row, DEFINITION_COLUMN);
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
    return rows.map((row) => readOptionalText(row, column));
}
