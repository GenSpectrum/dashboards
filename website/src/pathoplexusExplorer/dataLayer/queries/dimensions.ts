/** A dimension defines both its grouped values and the filters that select them. */

import { ORGANISM } from './builders.ts';
import { COLUMNS, type ColumnCheck } from './columns.ts';
import { dateFilter } from './scope.ts';
import { bucketOfRange, isIsoDate } from '../../domain/dates.ts';
import {
    admin1AreaOf,
    canonicalCountryOf,
    continentOf,
    hasAdmin1Names,
    isAdmin1Of,
    recordedPlaceOf,
    subregionOf,
} from '../../domain/geography.ts';
import { HOST_GROUP, HOST_GROUP_LABELS, hostGroupOf, type HostGroup } from '../../domain/hosts.ts';
import { isUnassignedValue } from '../../domain/lineages.ts';
import { allPathogens, type Catalog, type Pathogen, type SubtypeLevel } from '../../domain/subject.ts';
import { and, bool, field, int, not, or, str, type Expr } from '../transport/expression.ts';
import { isNotNull, isNull } from '../transport/functions.ts';
import { readOptionalText, readText, type RhydbRow } from '../transport/row.ts';

/** Use a sentinel outside the range of recorded values. */
export const NOTHING = '\u0000';

export type ValuesLookup = {
    years?: readonly string[];
    countries?: readonly (string | null)[];
    hosts?: readonly { name: string | null; taxon: string | null }[];
    subtypes?: Readonly<Record<string, readonly (string | null)[] | undefined>>;
    admin1Names?: readonly (string | null)[];
};

export type Dimension = {
    id: string;
    label: string;
    columns: readonly string[];
    /** Keep table names when a value depends on the pathogen table. */
    perTable?: boolean;
    valueOf: (row: RhydbRow) => string;
    /** Overlapping groups return several values and can be used only as filters. */
    valuesOf?: (row: RhydbRow) => readonly string[];
    /** Axes require disjoint values so each sequence is counted once. */
    axis?: boolean;
    depthOf?: (value: string) => number;
    labelOf?: (value: string) => string;
    labelFromRow?: (row: RhydbRow) => string | undefined;
    filterOf?: (values: readonly string[], lookup: ValuesLookup) => Expr | undefined;
    /** Values that the dimension can filter by. Without it, every value is accepted. */
    accepts?: (value: string) => boolean;
    tablesOf?: (values: readonly string[], tables: readonly string[]) => string[];
    order?: (a: string, b: string) => number;
    /** When true, keep values from the end of the natural order before reversing them for display. */
    fromTheEnd?: boolean;
};

/** Membership must be false for an unselected null, even when the caller negates it. */
function inValues(column: string, values: readonly string[], literal: (value: string) => Expr = str): Expr {
    const target = field(column);
    const known = values.filter((value) => value !== NOTHING);
    const missing = known.length !== values.length;
    if (known.length === 0) {
        return missing ? isNull(target) : bool(false);
    }
    const match = known.length === 1 ? target.eq(literal(known[0])) : target.isIn(known.map(literal));
    return missing ? or(isNull(target), match) : and(isNotNull(target), match);
}

/** Group and filter with the same classification of the recorded column values. */
function recordedDimension(
    id: string,
    label: string,
    column: string,
    recorded: (lookup: ValuesLookup) => readonly (string | null)[] | undefined,
    classify: (value: string | null) => string,
    group: (name: string) => string = (name) => name,
): Dimension {
    return {
        id,
        label,
        columns: [column],
        valueOf: (row) => group(classify(readOptionalText(row, column))),
        filterOf: (values, lookup) => {
            const chosen = new Set(values);
            // Bookmarks can select an individual recorded name even when its axis groups it as unassigned.
            const includes = (value: string | null) => {
                const name = classify(value);
                return chosen.has(name) || chosen.has(group(name));
            };
            const names = new Set<string>();
            for (const value of recorded(lookup) ?? []) {
                if (value !== null && includes(value)) {
                    names.add(value);
                }
            }
            if (includes(null)) {
                names.add(NOTHING);
            }
            return inValues(column, [...names]);
        },
    };
}

function pathogenDimension(catalog: Catalog): Dimension {
    const labels = new Map(allPathogens(catalog).map((pathogen) => [pathogen.table, pathogen.label] as const));
    return {
        id: 'pathogen',
        label: 'Pathogen',
        columns: [],
        perTable: true,
        valueOf: (row) => readText(row, ORGANISM),
        labelOf: (value) => labels.get(value) ?? value,
        tablesOf: (values, tables) => tables.filter((table) => values.includes(table)),
    };
}

function geographicDimension(id: string, label: string, group: (country: string) => string | undefined): Dimension {
    return recordedDimension(
        id,
        label,
        COLUMNS.country,
        (lookup) => lookup.countries,
        (value) => {
            const recorded = recordedPlaceOf(value);
            return recorded === null ? NOTHING : (group(canonicalCountryOf(recorded)) ?? NOTHING);
        },
    );
}

const countryDimension = geographicDimension('country', 'Country', (country) => country);
const region = geographicDimension('region', 'Region', subregionOf);
const continent = geographicDimension('continent', 'Continent', continentOf);

const host: Dimension = {
    id: 'host',
    label: 'Host group',
    columns: [COLUMNS.host, COLUMNS.hostTaxon],
    valueOf: (row) => hostGroupOf(readOptionalText(row, COLUMNS.host), readOptionalText(row, COLUMNS.hostTaxon)),
    labelOf: (value) => (Object.hasOwn(HOST_GROUP_LABELS, value) ? HOST_GROUP_LABELS[value as HostGroup] : value),
    filterOf: (values, lookup) => {
        const chosen = new Set(values);
        const byName = new Map<string, { selected: string[]; allSelected: boolean }>();
        for (const { name, taxon } of lookup.hosts ?? []) {
            if (name === null) {
                continue;
            }
            const group = byName.get(name) ?? { selected: [], allSelected: true };
            if (chosen.has(hostGroupOf(name, taxon))) {
                group.selected.push(taxon ?? NOTHING);
            } else {
                group.allSelected = false;
            }
            byName.set(name, group);
        }
        const names = chosen.has(HOST_GROUP.unknown) ? [NOTHING] : [];
        const pairs: Expr[] = [];
        for (const [name, { selected, allSelected }] of byName) {
            if (allSelected) {
                names.push(name);
            } else if (selected.length > 0) {
                pairs.push(and(inValues(COLUMNS.host, [name]), inValues(COLUMNS.hostTaxon, selected)));
            }
        }
        return or(inValues(COLUMNS.host, names), ...pairs);
    },
    order: hostGroupOrder,
};

const hostName: Dimension = {
    ...recordedDimension(
        'hostName',
        'Host',
        COLUMNS.host,
        (lookup) => lookup.hosts?.map(({ name }) => name),
        (name) => (name === null || name.trim() === '' ? NOTHING : name),
    ),
    labelOf: (value) => (value === NOTHING ? HOST_GROUP_LABELS[HOST_GROUP.unknown] : value),
};

function hostGroupOrder(a: string, b: string): number {
    const order = Object.values(HOST_GROUP) as string[];
    return order.indexOf(a) - order.indexOf(b);
}

function yearFilter(year: string): Expr | undefined {
    return dateFilter({ from: `${year}-01-01`, to: `${year}-12-31` });
}

/** Count a collection year only if it contains the entire recorded date range. */
const year: Dimension = {
    id: 'year',
    label: 'Collection year',
    columns: [COLUMNS.lower, COLUMNS.upper],
    valueOf: (row) =>
        bucketOfRange(readOptionalText(row, COLUMNS.lower), readOptionalText(row, COLUMNS.upper), 'year') ?? NOTHING,
    labelOf: (value) => (value === NOTHING ? 'No collection year' : value),
    accepts: (value) => value === NOTHING || (/^\d{4}$/.test(value) && isIsoDate(`${value}-01-01`)),
    filterOf: (values, lookup) => {
        const years = values.filter((value) => value !== NOTHING);
        const fits = (choices: readonly string[]) =>
            and(
                isNotNull(field(COLUMNS.lower)),
                isNotNull(field(COLUMNS.upper)),
                or(...choices.map(yearFilter)) ?? bool(false),
            );
        if (years.length === values.length) {
            return fits(years);
        }
        return not(fits((lookup.years ?? []).filter((value) => !years.includes(value))));
    },
    order: (a, b) => b.localeCompare(a),
    fromTheEnd: true,
};

/** Use the submitting group ID as its identity. The display name need not be unique. */
const submitter: Dimension = {
    id: 'group',
    label: 'Submitting group',
    columns: [COLUMNS.group, COLUMNS.groupName],
    valueOf: (row) => {
        const id = row[COLUMNS.group] ?? null;
        return id === null ? NOTHING : String(id);
    },
    labelFromRow: (row) => readOptionalText(row, COLUMNS.groupName) ?? undefined,
    accepts: (value) => value === NOTHING || /^\d{1,15}$/.test(value),
    filterOf: (values) => inValues(COLUMNS.group, values, (value) => int(Number(value))),
};

/** Expand a division to the recorded spellings that resolve to it within this country. */
function admin1Dimension(country: string): Dimension {
    return recordedDimension(
        'admin1',
        'Province or state',
        COLUMNS.admin1,
        (lookup) => lookup.admin1Names,
        (value) => {
            const recorded = recordedPlaceOf(value);
            return recorded === null ? NOTHING : admin1AreaOf(country, recorded);
        },
        (name) => (name === NOTHING || isAdmin1Of(country, name) ? name : 'Unassigned'),
    );
}

function pathogenGroupDimension(catalog: Catalog): Dimension {
    const labels = new Map<string, string>();
    const tablesByValue = new Map<string, string[]>();
    const depth = new Map<string, number>();
    const order: string[] = [];
    for (const group of catalog.groups) {
        const tablesOfGroup = allPathogens({ groups: [group] }).map((pathogen) => pathogen.table);
        if (tablesOfGroup.length > 1) {
            labels.set(group.id, `All ${group.label.toLowerCase()}`);
            tablesByValue.set(group.id, tablesOfGroup);
            depth.set(group.id, 0);
            order.push(group.id);
        }
        for (const member of group.members) {
            if (member.kind !== 'family') {
                continue;
            }
            labels.set(member.id, `All ${member.label}`);
            tablesByValue.set(
                member.id,
                member.pathogens.map((pathogen) => pathogen.table),
            );
            depth.set(member.id, tablesOfGroup.length > 1 ? 1 : 0);
            order.push(member.id);
        }
    }
    const valuesOfTable = new Map<string, string[]>();
    for (const [value, tables] of tablesByValue) {
        for (const name of tables) {
            valuesOfTable.set(name, [...(valuesOfTable.get(name) ?? []), value]);
        }
    }
    return {
        id: 'pathogenGroup',
        label: 'Pathogen group',
        columns: [],
        perTable: true,
        axis: false,
        valueOf: (row) => valuesOfTable.get(readText(row, ORGANISM))?.[0] ?? NOTHING,
        valuesOf: (row) => valuesOfTable.get(readText(row, ORGANISM)) ?? [],
        labelOf: (value) => labels.get(value) ?? value,
        depthOf: (value) => depth.get(value) ?? 0,
        tablesOf: (values, tables) => {
            const kept = new Set(values.flatMap((value) => tablesByValue.get(value) ?? []));
            return tables.filter((table) => kept.has(table));
        },
        order: (a, b) => order.indexOf(a) - order.indexOf(b),
    };
}

function levelDimension(pathogen: Pathogen, level: SubtypeLevel): Dimension {
    return {
        ...recordedDimension(
            `level:${level.column}`,
            `${pathogen.label} ${level.label.toLowerCase()}`,
            level.column,
            (lookup) => lookup.subtypes?.[level.column],
            (value) => (value === null || isUnassignedValue(value) ? NOTHING : value),
        ),
        labelOf: (value) => (value === NOTHING ? 'Unassigned' : value),
    };
}

/** The pathogen's catalog levels whose columns its table has. Without a check, every catalog level is kept. */
export function levelsOf(pathogen: Pathogen, hasColumn: ColumnCheck | undefined): SubtypeLevel[] {
    return [...pathogen.levels, ...pathogen.alternatives].filter(
        (level) => hasColumn?.(pathogen.table, level.column) !== false,
    );
}

/** The dimensions that choose tables rather than rows. They do not depend on the tables in scope. */
export function tableDimensions(catalog: Catalog): Dimension[] {
    return [pathogenDimension(catalog), pathogenGroupDimension(catalog)];
}

/** Subtype and division dimensions require a single pathogen and country, respectively. */
export function dimensionsFor(options: {
    catalog: Catalog;
    tables: readonly string[];
    hasColumn?: ColumnCheck;
    country?: string;
}): Dimension[] {
    const { catalog, tables, hasColumn, country } = options;
    const pathogen =
        tables.length === 1 ? allPathogens(catalog).find((candidate) => candidate.table === tables[0]) : undefined;
    const levels =
        pathogen === undefined ? [] : levelsOf(pathogen, hasColumn).map((level) => levelDimension(pathogen, level));
    const provinces = hasAdmin1Names(country) ? [admin1Dimension(country)] : [];
    return [
        ...tableDimensions(catalog),
        ...levels,
        countryDimension,
        ...provinces,
        region,
        continent,
        host,
        hostName,
        year,
        submitter,
    ];
}

export function dimensionById(dimensions: readonly Dimension[], id: string | undefined): Dimension | undefined {
    return dimensions.find((dimension) => dimension.id === id);
}

export function labelOf(dimension: Dimension, value: string): string {
    if (dimension.labelOf !== undefined) {
        return dimension.labelOf(value);
    }
    return value === NOTHING ? 'Not recorded' : value;
}
