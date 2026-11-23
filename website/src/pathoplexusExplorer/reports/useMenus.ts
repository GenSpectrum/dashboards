/** Count menus under the current period and constraints from levels above the one being offered. */

import type { Period } from './kinds.ts';
import { canonicalCountryOf, WORLD, type Place } from '../domain/geography.ts';
import { compareSubtypes, isUnassignedValue, type LineageTree } from '../domain/lineages.ts';
import {
    ALL,
    keepSteps,
    pathogenOf,
    type Catalog,
    type Pathogen,
    type SubtypeStep,
    type Subject,
} from '../domain/subject.ts';
import {
    merged,
    useLineageHierarchy,
    useScopeFilters,
    useSubtypeColumns,
    type Loadable,
} from '../rhydb/hooks/analyses.ts';
import { useManyRows, useRows } from '../rhydb/hooks/rhydb.ts';
import { groupAcross } from '../rhydb/queries/builders.ts';
import { COLUMNS } from '../rhydb/queries/scope.ts';
import { readOptionalText, type RhydbRow } from '../rhydb/transport/row.ts';

export type MenuValue = {
    value: string;
    label: string;
    n: number;
    above?: SubtypeStep;
};

export type LevelMenu = { column: string; label: string; chosen?: string; values: MenuValue[] };

export function useCountryMenu(catalog: Catalog, what: Subject = ALL, period: Period = {}): Loadable<MenuValue[]> {
    const scoped = useScopeFilters([{ what, where: WORLD, period }], catalog);
    const entry = scoped.data?.[0];
    const query =
        entry === undefined || entry.tables.length === 0
            ? undefined
            : groupAcross({ tables: entry.tables, filter: entry.filter, columns: [COLUMNS.country] });
    const rows = useRows(query, 'Report bar');
    const data = rows.data === undefined ? undefined : countriesOf(rows.data);
    return merged(data, [scoped, rows]);
}

export function useLevelMenus(
    what: Subject | undefined,
    period: Period,
    catalog: Catalog,
    where: Place = WORLD,
): Loadable<LevelMenu[]> {
    const available = useSubtypeColumns(catalog);
    const hierarchy = useLineageHierarchy(catalog);
    const pathogen: Pathogen | undefined = pathogenOf(what);
    const levels =
        pathogen === undefined
            ? []
            : pathogen.levels.filter((level) => available.data?.has(`${pathogen.table}|${level.column}`) ?? false);
    const chosen = new Map(
        (what?.kind === 'subtype' ? what.steps : []).map((step) => [step.column, step.value] as const),
    );
    const scopes =
        what === undefined ? [] : levels.map((_, index) => ({ what: truncated(what, levels, index), where, period }));
    const resolved = useScopeFilters(scopes, catalog);
    // Group subtype options by reference when their reference level has not been chosen.
    const reference = pathogen?.referenceColumn;
    const referenceIndex = levels.findIndex((level) => level.column === reference);
    const above = levels.map((_, index) =>
        reference === undefined || chosen.get(reference) !== undefined || referenceIndex >= index
            ? undefined
            : reference,
    );
    const queries = (resolved.data ?? []).map((entry, index) => {
        const aboveColumn = above[index];
        const columns = aboveColumn === undefined ? [levels[index].column] : [aboveColumn, levels[index].column];
        return entry.tables.length === 0
            ? undefined
            : groupAcross({ tables: entry.tables, filter: entry.filter, columns });
    });
    const rows = useManyRows(queries, 'Report bar');
    const found = rows.data;
    const trees = hierarchy.data;
    const data =
        found === undefined || trees === undefined || pathogen === undefined
            ? undefined
            : levels.map((level, index) => ({
                  column: level.column,
                  label: level.label,
                  chosen: chosen.get(level.column),
                  values: subtypeValues(
                      found[index] ?? [],
                      level.column,
                      above[index],
                      trees(pathogen.table, level.column),
                  ),
              }));
    return merged(data, [available, hierarchy, resolved, rows]);
}

/** Infer a reference level only when the selected subtype has a single value for it. */
export function impliedAbove(menus: readonly LevelMenu[]): SubtypeStep | undefined {
    for (const menu of menus) {
        const above = menu.values.find((entry) => entry.value === menu.chosen)?.above;
        if (above !== undefined) {
            return above;
        }
    }
    return undefined;
}

function truncated(what: Subject, levels: readonly { column: string }[], index: number): Subject {
    const above = new Set(levels.slice(0, index).map((level) => level.column));
    return keepSteps(what, (step) => above.has(step.column));
}

/** Include descendants in a menu count when the column has a hierarchy. */
function subtypeValues(
    rows: readonly RhydbRow[],
    column: string,
    aboveColumn: string | undefined,
    tree: LineageTree | undefined,
): MenuValue[] {
    const counts = new Map<string, number>();
    const aboveValues = new Map<string, Set<string | null>>();
    for (const row of rows) {
        const recorded = readOptionalText(row, column);
        if (recorded === null || isUnassignedValue(recorded)) {
            continue;
        }
        const value = tree?.canonicalOf(recorded) ?? recorded;
        counts.set(value, (counts.get(value) ?? 0) + Number(row.n ?? 0));
        if (aboveColumn !== undefined) {
            const seen = aboveValues.get(value) ?? new Set<string | null>();
            seen.add(readOptionalText(row, aboveColumn));
            aboveValues.set(value, seen);
        }
    }
    const totals = new Map(counts);
    for (const [value, n] of counts) {
        for (const ancestor of tree?.ancestorsOf(value) ?? []) {
            totals.set(ancestor, (totals.get(ancestor) ?? 0) + n);
            if (aboveColumn !== undefined) {
                const seen = aboveValues.get(ancestor) ?? new Set<string | null>();
                for (const above of aboveValues.get(value) ?? []) {
                    seen.add(above);
                }
                aboveValues.set(ancestor, seen);
            }
        }
    }
    return [...totals.entries()]
        .filter(([, n]) => n > 0)
        .map(([value, n]) => ({ value, label: value, n, above: aboveStep(aboveColumn, aboveValues.get(value)) }))
        .sort((a, b) => b.n - a.n || compareSubtypes(a.value, b.value));
}

/** Infer the level above only if every matching sequence records the same value. */
function aboveStep(column: string | undefined, values: Set<string | null> | undefined): SubtypeStep | undefined {
    if (column === undefined || values?.size !== 1) {
        return undefined;
    }
    const [value] = [...values];
    return value === null ? undefined : { column, value };
}

function countriesOf(rows: readonly RhydbRow[]): MenuValue[] {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const recorded = readOptionalText(row, COLUMNS.country);
        if (recorded === null) {
            continue;
        }
        const country = canonicalCountryOf(recorded);
        counts.set(country, (counts.get(country) ?? 0) + Number(row.n ?? 0));
    }
    return [...counts.entries()]
        .filter(([, n]) => n > 0)
        .map(([value, n]) => ({ value, label: value, n }))
        .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value));
}
