import { useMemo } from 'react';

import { merged, type Loadable } from './analyses.ts';
import { useManyRows } from './rhydb.ts';
import { pathogenOf } from '../../domain/subject.ts';
import { groupAcross } from '../queries/builders.ts';
import { mutationProfileQuery, type MutationRequest } from '../queries/genomics.ts';
import type { ResolvedScope } from '../queries/resolve.ts';
import { COLUMNS, type Scope } from '../queries/scope.ts';
import type { Relation } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

function tableOf(scope: Scope): string | undefined {
    return pathogenOf(scope.what)?.table;
}

/** Returns profiles in scope order. A scope without comparable mutations has no profile. */
export function useMutationProfiles(
    resolved: Loadable<ResolvedScope[]>,
    request: MutationRequest,
    enabled: boolean,
    comparable: readonly boolean[] = [],
): Loadable<(RhydbRow[] | undefined)[]> {
    const queries = (enabled ? (resolved.data ?? []) : []).map((entry, index): Relation | undefined => {
        const tableName = tableOf(entry.scope);
        return tableName === undefined || !comparable[index]
            ? undefined
            : mutationProfileQuery({ tableName, filter: entry.filter(tableName), request });
    });
    const result = useManyRows(queries, 'Mutation profile');
    const data = useMemo(() => {
        if (!enabled || resolved.data === undefined || result.data === undefined) {
            return undefined;
        }
        const rows = result.data;
        return queries.map((query, index) => (query === undefined ? undefined : rows[index]));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the query texts
    }, [result.data, enabled, queries.map((query) => query?.render() ?? '').join('|')]);
    return merged(data, [resolved, result]);
}

export type Carriers = {
    own: readonly RhydbRow[];
    all: readonly RhydbRow[];
};

export function useCarriers(
    resolved: Loadable<ResolvedScope>,
    parent: Loadable<ResolvedScope>,
    column: string | undefined,
    enabled: boolean,
): Loadable<Carriers> {
    const columns = column === undefined ? undefined : [column];
    const queryFor = (entry: ResolvedScope | undefined): Relation | undefined =>
        entry === undefined || columns === undefined
            ? undefined
            : groupAcross({ tables: entry.tables, filter: entry.filter, columns });
    const own = queryFor(enabled ? resolved.data : undefined);
    const all = queryFor(enabled ? parent.data : undefined);
    const result = useManyRows([own, all], 'Carriers');
    const data =
        result.data?.[0] === undefined || result.data[1] === undefined
            ? undefined
            : { own: result.data[0], all: result.data[1] };
    return merged(data, [resolved, parent, result]);
}

export type ProportionRows = { own: readonly RhydbRow[]; all: readonly RhydbRow[] };

export function useProportionOverTime(
    scopes: Loadable<ResolvedScope[]>,
    /** Indices of the numerator and denominator scopes. */
    pairs: readonly { own: number; all: number }[],
    enabled: boolean,
): Loadable<ProportionRows[]> {
    const entries = enabled ? (scopes.data ?? []) : [];
    const queries = entries.map((entry) =>
        groupAcross({
            tables: entry.tables,
            filter: entry.filter,
            columns: [COLUMNS.lower, COLUMNS.upper],
            compact: true,
        }),
    );
    const result = useManyRows(queries, 'Share over time');
    const data = useMemo(() => {
        if (result.data === undefined) {
            return undefined;
        }
        const rows = result.data;
        return pairs.flatMap((pair) => {
            const own = rows[pair.own];
            const all = rows[pair.all];
            return own === undefined || all === undefined ? [] : [{ own, all }];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the query texts and the pairs
    }, [result.data, JSON.stringify(pairs)]);
    return merged(data, [scopes, result]);
}
