import {
    childPlaceLevel,
    childPlaceOf,
    parsePlace,
    placeKey,
    placeLabel,
    recordedPlaceOf,
    type Place,
} from '../domain/geography.ts';
import {
    isUnassignedValue,
    normalizeSubtype,
    UNASSIGNED,
    type Hierarchy,
    type LineageTree,
} from '../domain/lineages.ts';
import {
    childContaining,
    effectiveSteps,
    isPathogenNode,
    parseSubject,
    staticChildren,
    subjectKey,
    subjectLabel,
    withStep,
    type Catalog,
    type PathogenNode,
    type SubtypeLevel,
    type Subject,
} from '../domain/subject.ts';
import { ORGANISM } from './queries/builders.ts';
import { COLUMNS, type Scope } from './queries/scope.ts';
import type { RhydbRow } from './transport/row.ts';

export type SeriesTarget = { what?: Subject; where?: Place };

export type BreakdownSpec = {
    of: 'classification' | 'pathogen' | 'place';
    title: string;
    /** When a hierarchy is available, a part can include descendants of the assigned value. */
    nested?: boolean;
    through: readonly string[];
    self?: string;
    columns: readonly string[];
    perTable: boolean;
    classify(row: RhydbRow): string;
    label(key: string): string;
    target(key: string): SeriesTarget | undefined;
};

type ColumnNeed = { table: string; column: string } | undefined;

const UNKNOWN_PLACE = '(not recorded)';
const SELF_PREFIX = '=';

const PLACE_LEVEL_TITLES = {
    continent: 'Continent',
    subregion: 'Region',
    country: 'Country',
    admin1: 'Province or state',
} as const;

/** Check declared subtype columns against the actual table schema. */
export type ColumnCheck = (table: string, column: string) => boolean;

export type InstanceShape = {
    has: ColumnCheck;
    hierarchy: Hierarchy;
};

/** Drill down within a hierarchical column before considering the next subtype level. */
function nextLevel(what: PathogenNode, shape: InstanceShape): SubtypeLevel | undefined {
    const levels = what.pathogen.levels.filter((level) => shape.has(what.pathogen.table, level.column));
    if (what.kind === 'pathogen') {
        return levels[0];
    }
    const last = what.steps[what.steps.length - 1];
    const index = levels.findIndex((level) => level.column === last.column);
    if (index < 0) {
        return undefined;
    }
    const tree = shape.hierarchy(what.pathogen.table, levels[index].column);
    if (tree !== undefined && last.value !== UNASSIGNED) {
        return levels[index];
    }
    return levels[index + 1];
}

export function breakdownNeeds(scope: Scope, shape: InstanceShape): ColumnNeed {
    const what = scope.what;
    if (!isPathogenNode(what)) {
        return undefined;
    }
    const level = nextLevel(what, shape);
    if (level === undefined || shape.hierarchy(what.pathogen.table, level.column) === undefined) {
        return undefined;
    }
    return { table: what.pathogen.table, column: level.column };
}

export function resolveBreakdown(
    scope: Scope,
    catalog: Catalog,
    shape: InstanceShape,
    knownValues: readonly (string | null)[] | undefined,
): BreakdownSpec {
    const what = scope.what;
    switch (what.kind) {
        case 'all':
        case 'group':
        case 'family':
            return treeBreakdown(what, catalog);
        case 'pathogen':
        case 'subtype': {
            const level = nextLevel(what, shape);
            if (level === undefined) {
                return placeBreakdown(scope.where);
            }
            const tree = shape.hierarchy(what.pathogen.table, level.column);
            if (tree !== undefined && what.kind === 'subtype') {
                const step = effectiveSteps(what).find((candidate) => candidate.column === level.column);
                const below =
                    step === undefined
                        ? []
                        : recordedValues(knownValues).filter((value) => tree.isWithin(value, step.value));
                if (step !== undefined && below.length <= 1) {
                    const levels = what.pathogen.levels.filter((candidate) =>
                        shape.has(what.pathogen.table, candidate.column),
                    );
                    const index = levels.indexOf(level);
                    const deeper = levels[index + 1] as SubtypeLevel | undefined;
                    return deeper === undefined
                        ? placeBreakdown(scope.where)
                        : columnBreakdown(what, deeper, shape.hierarchy(what.pathogen.table, deeper.column), undefined);
                }
            }
            return columnBreakdown(what, level, tree, knownValues);
        }
    }
}

function recordedValues(values: readonly (string | null)[] | undefined): string[] {
    return (values ?? []).filter((value): value is string => value !== null);
}

function treeBreakdown(what: Subject, catalog: Catalog): BreakdownSpec {
    const children = staticChildren(what, catalog) ?? [];
    return {
        of: 'pathogen',
        title: what.kind === 'all' ? 'Pathogen group' : 'Pathogen',
        through: [],
        columns: [],
        perTable: true,
        classify: (row) => {
            const child = childContaining(what, String(row[ORGANISM]), catalog);
            return child === undefined ? String(row[ORGANISM]) : subjectKey(child);
        },
        label: (key) => {
            const node = parseSubject(key, catalog);
            return node === undefined ? key : subjectLabel(node);
        },
        target: (key) => {
            const node = children.find((child) => subjectKey(child) === key);
            return node === undefined ? undefined : { what: node };
        },
    };
}

function columnBreakdown(
    what: PathogenNode,
    level: SubtypeLevel,
    tree: LineageTree | undefined,
    knownValues: readonly (string | null)[] | undefined,
): BreakdownSpec {
    const step = effectiveSteps(what).find((candidate) => candidate.column === level.column);
    const known = recordedValues(knownValues);
    const self = step?.value === UNASSIGNED ? undefined : step?.value;
    const through = tree === undefined ? [] : descent(self, known, tree);
    const under = tree === undefined ? step?.value : (through[through.length - 1] ?? self);
    const passed = new Set(through);
    return {
        of: 'classification',
        title: level.label,
        nested: tree !== undefined,
        through,
        self,
        columns: [level.column],
        perTable: false,
        classify: (row) => {
            const recorded = normalizeSubtype((row[level.column] ?? null) as string | null);
            if (recorded === UNASSIGNED || tree === undefined) {
                return recorded;
            }
            const value = tree.canonicalOf(recorded);
            // Assign exact matches along the displayed lineage path to their own part.
            if (value === self || passed.has(value)) {
                return `${SELF_PREFIX}${value}`;
            }
            return tree.rollUp(value, under);
        },
        label: (key) => (key === UNASSIGNED ? 'Unassigned' : (exactName(key) ?? key)),
        target: (key) =>
            key.startsWith(SELF_PREFIX) || (key === UNASSIGNED && step?.value === UNASSIGNED)
                ? undefined
                : { what: withStep(what, { column: level.column, value: key }) },
    };
}

export function exactName(key: string): string | undefined {
    return key.startsWith(SELF_PREFIX) ? key.slice(SELF_PREFIX.length) : undefined;
}

/** Start below a single root shared by all lineages, such as A in RSV-A. */
function descent(start: string | undefined, known: readonly string[], tree: LineageTree): string[] {
    const path: string[] = [];
    let under = start;
    for (let depth = 0; depth < 20; depth++) {
        const within = known.filter(
            (value) =>
                !isUnassignedValue(value) &&
                (under === undefined || (tree.canonicalOf(value) !== under && tree.isWithin(value, under))),
        );
        const roots = new Set(within.map((value) => tree.rollUp(value, under)));
        if (roots.size !== 1) {
            return path;
        }
        const [only] = roots;
        if (!within.some((value) => tree.canonicalOf(value) !== only)) {
            return path;
        }
        under = only;
        path.push(only);
    }
    return path;
}

function placeBreakdown(where: Place): BreakdownSpec {
    const level = childPlaceLevel(where) ?? 'admin1';
    const withAdmin1 = where.level === 'country' || where.level === 'admin1';
    return {
        of: 'place',
        title: PLACE_LEVEL_TITLES[level],
        through: [],
        columns: withAdmin1 ? [COLUMNS.country, COLUMNS.admin1] : [COLUMNS.country],
        perTable: false,
        classify: (row) => {
            const country = recordedPlaceOf(row[COLUMNS.country]);
            const admin1 = withAdmin1 ? recordedPlaceOf(row[COLUMNS.admin1]) : null;
            const child = childPlaceOf(where, country, admin1);
            if (where.level === 'admin1') {
                return admin1 ?? UNKNOWN_PLACE;
            }
            return child === undefined ? UNKNOWN_PLACE : placeKey(child);
        },
        label: (key) => {
            if (key === UNKNOWN_PLACE) {
                return level === 'admin1' ? 'Province not recorded' : 'Not recorded';
            }
            const place = parsePlace(key);
            return place === undefined ? key : placeLabel(place);
        },
        target: (key) => {
            if (key === UNKNOWN_PLACE || where.level === 'admin1') {
                return undefined;
            }
            const place = parsePlace(key);
            return place === undefined ? undefined : { where: place };
        },
    };
}

export type Part = {
    key: string;
    label: string;
    n: number;
    target?: SeriesTarget;
    residual: boolean;
    /** Represents sequences assigned exactly to the selected lineage. */
    exact: boolean;
};

export function partsOf(rows: readonly RhydbRow[], spec: BreakdownSpec): Part[] {
    const totals = new Map<string, number>();
    for (const row of rows) {
        const key = spec.classify(row);
        totals.set(key, (totals.get(key) ?? 0) + Number(row.n ?? 0));
    }
    const isResidual = (key: string) => key === UNASSIGNED || key === UNKNOWN_PLACE || key === 'unknown';
    return [...totals.entries()]
        .map(([key, n]) => ({
            key,
            n,
            label: spec.label(key),
            target: spec.target(key),
            residual: isResidual(key),
            exact: spec.self !== undefined && key === `${SELF_PREFIX}${spec.self}`,
        }))
        .sort((a, b) => Number(a.residual) - Number(b.residual) || b.n - a.n);
}

export function valueParts(parts: readonly Part[]): Part[] {
    return parts.filter((part) => !part.residual && !part.exact);
}
