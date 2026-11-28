import { combineQueryResults, type Loadable } from './queryResult.ts';
import { useManyRows } from './rhydbQuery.ts';
import { pathogenOf } from '../../domain/subject.ts';
import { groupAcross } from '../queries/builders.ts';
import { COLUMNS } from '../queries/columns.ts';
import { mutationProfileQuery, type MutationRequest, type ProportionRows } from '../queries/genomics.ts';
import type { ResolvedScope } from '../queries/resolve.ts';
import type { Relation } from '../transport/relation.ts';
import type { RhydbRow } from '../transport/row.ts';

/** Returns profiles in scope order. A scope without comparable mutations has no profile. */
export function useMutationProfiles(
    resolved: Loadable<ResolvedScope[]>,
    request: MutationRequest,
    enabled: boolean,
    comparable: readonly boolean[] = [],
): Loadable<(RhydbRow[] | undefined)[]> {
    const queries = (enabled ? (resolved.data ?? []) : []).map((entry, index): Relation | undefined => {
        const tableName = pathogenOf(entry.scope.what)?.table;
        return tableName === undefined || !comparable[index]
            ? undefined
            : mutationProfileQuery({ tableName, filter: entry.filter(tableName), request });
    });
    const result = useManyRows(queries, 'Mutation profile');
    return combineQueryResults(enabled && resolved.data !== undefined ? result.data : undefined, [resolved, result]);
}

/** Group the numerator and denominator of a proportion by the same columns. */
export function useComparisonRows(
    scopes: Loadable<ResolvedScope[]>,
    columns: readonly string[] | undefined,
    label: string,
    compact = false,
): Loadable<ProportionRows> {
    const queries =
        columns === undefined
            ? []
            : (scopes.data?.map(({ tables, filter }) => groupAcross({ tables, filter, columns, compact })) ?? []);
    const result = useManyRows(queries, label);
    const [own, all] = result.data ?? [];
    return combineQueryResults(own === undefined || all === undefined ? undefined : { own, all }, [scopes, result]);
}

export function useProportionOverTime(scopes: Loadable<ResolvedScope[]>, enabled: boolean): Loadable<ProportionRows> {
    return useComparisonRows(scopes, enabled ? [COLUMNS.lower, COLUMNS.upper] : undefined, 'Share over time', true);
}
