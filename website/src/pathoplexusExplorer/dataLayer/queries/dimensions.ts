/** A dimension defines both its grouped values and the filters that select them. */

import { ORGANISM } from './builders.ts';
import { COLUMNS, dateFilter } from './scope.ts';
import { bucketOfRange, isIsoDate } from '../../domain/dates.ts';
import {
    admin1AreaOf,
    canonicalCountryOf,
    continentOf,
    CONTINENTS,
    countriesOfContinent,
    countriesOfSubregion,
    countryNamesOf,
    hasAdmin1Names,
    recordedPlaceOf,
    SUBREGION_NAMES,
    subregionOf,
    type Continent,
} from '../../domain/geography.ts';
import { HOST_GROUP, HOST_GROUP_LABELS, hostGroupOf, type HostGroup } from '../../domain/hosts.ts';
import { isUnassignedValue } from '../../domain/lineages.ts';
import { allPathogens, type Catalog, type Pathogen, type SubtypeLevel } from '../../domain/subject.ts';
import { and, bool, field, int, not, or, str, type Expr } from '../transport/expression.ts';
import { isNull } from '../transport/functions.ts';
import { readOptionalText, readText, type RhydbRow } from '../transport/row.ts';

/** Use a sentinel outside the range of recorded values. */
export const NOTHING = '\u0000';

export type ValuesLookup = {
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

function matching(column: string, values: readonly string[]): Expr | undefined {
    if (values.length === 0) {
        return undefined;
    }
    const target = field(column);
    return values.length === 1 ? target.eq(str(values[0])) : target.isIn(values.map(str));
}

function inValues(column: string, values: readonly string[], literal: (value: string) => Expr): Expr | undefined {
    const known = values.filter((value) => value !== NOTHING);
    const nothing = values.length > known.length ? isNull(field(column)) : undefined;
    if (known.length === 0) {
        return nothing;
    }
    const target = field(column);
    const match = known.length === 1 ? target.eq(literal(known[0])) : target.isIn(known.map(literal));
    return or(match, nothing);
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

function unrecordedCountry(lookup: ValuesLookup): Expr | undefined {
    const unrecorded = (lookup.countries ?? []).filter(
        (value): value is string => value !== null && recordedPlaceOf(value) === null,
    );
    return or(isNull(field(COLUMNS.country)), matching(COLUMNS.country, unrecorded));
}

function outsideKnownCountries(known: readonly string[]): Expr {
    return or(isNull(field(COLUMNS.country)), not(field(COLUMNS.country).isIn(known.map(str))));
}

const countryDimension: Dimension = {
    id: 'country',
    label: 'Country',
    columns: [COLUMNS.country],
    valueOf: (row) => {
        const recorded = recordedPlaceOf(row[COLUMNS.country]);
        return recorded === null ? NOTHING : canonicalCountryOf(recorded);
    },
    filterOf: (values, lookup) => {
        const names = values.filter((value) => value !== NOTHING).flatMap(countryNamesOf);
        const nothing = values.includes(NOTHING) ? unrecordedCountry(lookup) : undefined;
        return or(matching(COLUMNS.country, names), nothing);
    },
};

function placeGrouping(options: {
    id: string;
    label: string;
    groupOf: (country: string) => string | undefined;
    countriesOf: (value: string) => readonly string[];
    everyGrouped: readonly string[];
}): Dimension {
    const { id, label, groupOf, countriesOf, everyGrouped } = options;
    return {
        id,
        label,
        columns: [COLUMNS.country],
        valueOf: (row) => {
            const recorded = recordedPlaceOf(row[COLUMNS.country]);
            return recorded === null ? NOTHING : (groupOf(canonicalCountryOf(recorded)) ?? NOTHING);
        },
        filterOf: (values) => {
            const names = values
                .filter((value) => value !== NOTHING)
                .flatMap((value) => countriesOf(value))
                .flatMap(countryNamesOf);
            const nothing = values.includes(NOTHING)
                ? outsideKnownCountries(everyGrouped.flatMap(countriesOf).flatMap(countryNamesOf))
                : undefined;
            return or(matching(COLUMNS.country, names), nothing);
        },
    };
}

const region = placeGrouping({
    id: 'region',
    label: 'Region',
    groupOf: subregionOf,
    countriesOf: countriesOfSubregion,
    everyGrouped: SUBREGION_NAMES,
});

const continent = placeGrouping({
    id: 'continent',
    label: 'Continent',
    groupOf: continentOf,
    countriesOf: (value) => (CONTINENTS.includes(value as Continent) ? countriesOfContinent(value as Continent) : []),
    everyGrouped: CONTINENTS,
});

const host: Dimension = {
    id: 'host',
    label: 'Host group',
    columns: [COLUMNS.host, COLUMNS.hostTaxon],
    valueOf: (row) => hostGroupOf(readOptionalText(row, COLUMNS.host), readOptionalText(row, COLUMNS.hostTaxon)),
    labelOf: (value) => (value in HOST_GROUP_LABELS ? HOST_GROUP_LABELS[value as HostGroup] : value),
    filterOf: (values, lookup) => {
        const chosen = new Set(values);
        const byName = new Map<string, Set<string>>();
        let anyUnrecorded = false;
        for (const entry of lookup.hosts ?? []) {
            const group = hostGroupOf(entry.name, entry.taxon);
            if (!chosen.has(group)) {
                continue;
            }
            if (entry.name === null) {
                anyUnrecorded = true;
                continue;
            }
            const taxa = byName.get(entry.name) ?? new Set<string>();
            taxa.add(entry.taxon ?? '');
            byName.set(entry.name, taxa);
        }
        // Filter by name only if all taxa with that name match. Otherwise match the selected taxon IDs.
        const names: string[] = [];
        const pairs: Expr[] = [];
        for (const [name, taxa] of byName) {
            const every = (lookup.hosts ?? []).filter((entry) => entry.name === name);
            if (every.every((entry) => taxa.has(entry.taxon ?? ''))) {
                names.push(name);
            } else {
                for (const taxon of taxa) {
                    pairs.push(
                        and(
                            field(COLUMNS.host).eq(str(name)),
                            taxon === '' ? isNull(field(COLUMNS.hostTaxon)) : field(COLUMNS.hostTaxon).eq(str(taxon)),
                        ),
                    );
                }
            }
        }
        const unrecorded = anyUnrecorded || chosen.has(HOST_GROUP.unknown) ? isNull(field(COLUMNS.host)) : undefined;
        // An empty host group must match no rows.
        return or(matching(COLUMNS.host, names), ...pairs, unrecorded) ?? bool(false);
    },
    order: hostGroupOrder,
};

const hostName: Dimension = {
    id: 'hostName',
    label: 'Host',
    columns: [COLUMNS.host],
    valueOf: (row) => {
        const name = readOptionalText(row, COLUMNS.host);
        return name === null || name.trim() === '' ? NOTHING : name;
    },
    labelOf: (value) => (value === NOTHING ? HOST_GROUP_LABELS[HOST_GROUP.unknown] : value),
    filterOf: (values, lookup) => {
        const names = values.filter((value) => value !== NOTHING);
        const blank = (lookup.hosts ?? [])
            .map((entry) => entry.name)
            .filter((name): name is string => name !== null && name.trim() === '');
        const nothing = values.includes(NOTHING)
            ? or(isNull(field(COLUMNS.host)), matching(COLUMNS.host, blank))
            : undefined;
        return or(matching(COLUMNS.host, names), nothing);
    },
};

function hostGroupOrder(a: string, b: string): number {
    const order = Object.values(HOST_GROUP) as string[];
    return order.indexOf(a) - order.indexOf(b);
}

const FIRST_YEAR = 1900;

function everyYear(): string[] {
    const last = new Date().getUTCFullYear() + 1;
    return Array.from({ length: last - FIRST_YEAR + 1 }, (_, index) => String(FIRST_YEAR + index));
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
    filterOf: (values) => {
        const years = values.filter((value) => value !== NOTHING);
        const nothing = values.length > years.length ? withoutAYear() : undefined;
        return or(or(...years.map(yearFilter)), nothing);
    },
    order: (a, b) => b.localeCompare(a),
    fromTheEnd: true,
};

function withoutAYear(): Expr {
    return or(
        isNull(field(COLUMNS.lower)),
        isNull(field(COLUMNS.upper)),
        not(or(...everyYear().map(yearFilter)) ?? bool(false)),
    );
}

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
    const areaOf = (value: unknown) => {
        const recorded = recordedPlaceOf(value);
        return recorded === null ? NOTHING : admin1AreaOf(country, recorded);
    };
    return {
        id: 'admin1',
        label: 'Province or state',
        columns: [COLUMNS.admin1],
        valueOf: (row) => areaOf(row[COLUMNS.admin1]),
        filterOf: (values, lookup) => {
            const chosen = new Set(values);
            const recorded = lookup.admin1Names ?? [];
            const spellings = recorded.filter((value): value is string => value !== null && chosen.has(areaOf(value)));
            const nothing = chosen.has(NOTHING) ? isNull(field(COLUMNS.admin1)) : undefined;
            return or(matching(COLUMNS.admin1, spellings), nothing) ?? bool(false);
        },
    };
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
        id: `level:${level.column}`,
        label: `${pathogen.label} ${level.label.toLowerCase()}`,
        columns: [level.column],
        valueOf: (row) => {
            const value = readOptionalText(row, level.column);
            return value === null || isUnassignedValue(value) ? NOTHING : value;
        },
        labelOf: (value) => (value === NOTHING ? 'Unassigned' : value),
        filterOf: (values, lookup) => {
            const known = values.filter((value) => value !== NOTHING);
            const recorded = lookup.subtypes?.[level.column] ?? [];
            const unassigned = values.length > known.length ? unassignedIn(level.column, recorded) : undefined;
            return or(matching(level.column, known), unassigned);
        },
    };
}

function unassignedIn(column: string, recorded: readonly (string | null)[]): Expr {
    const spellings = recorded.filter((value): value is string => value !== null && isUnassignedValue(value));
    return or(isNull(field(column)), matching(column, spellings));
}

export type ColumnCheck = (table: string, column: string) => boolean;

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
