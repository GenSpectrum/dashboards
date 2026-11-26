import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/scope.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import {
    admin1AreaOf,
    canonicalCountryOf,
    hasAdmin1Names,
    isAdmin1Of,
    placedCountryOf,
    placeLabel,
    recordedPlaceOf,
    type Place,
} from '../../../pathoplexusExplorer/domain/geography.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';

export type AreaScale = {
    singular: string;
    plural: string;
    of: (row: RhydbRow) => { name: string; place?: Place } | undefined;
};

export function areaScale(where: Place): AreaScale {
    if (where.level === 'admin1') {
        return { singular: 'province or state', plural: 'provinces or states', of: () => undefined };
    }
    if (where.level === 'country') {
        const country = where.country;
        return {
            singular: 'province or state',
            plural: 'provinces or states',
            of: (row) => {
                // Normalize historical country names before comparing them with the selected country.
                const recorded = countryOf(row);
                const admin1 = recordedPlaceOf(row[COLUMNS.admin1]);
                if (recorded !== canonicalCountryOf(country) || admin1 === null) {
                    return undefined;
                }
                const name = admin1AreaOf(country, admin1);
                return { name, place: { level: 'admin1', country, admin1: name } };
            },
        };
    }
    return {
        singular: 'country',
        plural: 'countries',
        of: (row) => {
            const country = countryOf(row);
            return country === undefined ? undefined : { name: country, place: { level: 'country', country } };
        },
    };
}

function countryOf(row: RhydbRow): string | undefined {
    const recorded = recordedPlaceOf(row[COLUMNS.country]);
    return recorded === null ? undefined : canonicalCountryOf(recorded);
}

export type AreaCount = { name: string; place?: Place; own: number; all: number };

export function rankAreas(
    scale: AreaScale,
    counted: readonly { row: RhydbRow; own: number; all: number }[],
): AreaCount[] {
    const totals = new Map<string, AreaCount>();
    for (const { row, own, all } of counted) {
        const area = scale.of(row);
        if (area === undefined) {
            continue;
        }
        const entry = totals.get(area.name) ?? { name: area.name, place: area.place, own: 0, all: 0 };
        entry.own += own;
        entry.all += all;
        totals.set(area.name, entry);
    }
    return [...totals.values()].sort((a, b) => b.own - a.own || b.all - a.all);
}

export function counted(rows: readonly RhydbRow[]): { row: RhydbRow; own: number; all: number }[] {
    return rows.map((row) => ({ row, own: Number(row.n ?? 0), all: Number(row.n ?? 0) }));
}

/** Count entries missing from the breakdown so the report can state what it omits. */
export function unplacedIn(where: Place, rows: readonly RhydbRow[], placed: readonly AreaCount[]): number {
    const inside = rows.reduce((sum, row) => {
        const outside = where.level === 'country' && countryOf(row) !== canonicalCountryOf(where.country);
        return outside ? sum : sum + Number(row.n ?? 0);
    }, 0);
    return inside - placed.reduce((sum, entry) => sum + entry.own, 0);
}

export function plural(level: string): string {
    return level.split(' or ').map(pluralWord).join(' or ');
}

function pluralWord(word: string): string {
    if (word.endsWith('y')) {
        return `${word.slice(0, -1)}ies`;
    }
    return word.endsWith('s') ? word : `${word}s`;
}

export function hasPlacesBelow(where: Place): boolean {
    return where.level !== 'admin1';
}

function placesWithin(scale: AreaScale, where: Place, rows: readonly RhydbRow[] | undefined): number {
    const country = where.level === 'country' ? where.country : undefined;
    const divisionsOnly = hasAdmin1Names(country);
    const found = new Set<string>();
    for (const row of rows ?? []) {
        const area = Number(row.n ?? 0) === 0 ? undefined : scale.of(row);
        if (area !== undefined && (!divisionsOnly || isAdmin1Of(country, area.name))) {
            found.add(area.name);
        }
    }
    return found.size;
}

export function countriesIn(rows: readonly RhydbRow[] | undefined): number | undefined {
    if (rows === undefined) {
        return undefined;
    }
    const found = new Set<string>();
    for (const row of rows) {
        const country = placedCountryOf(row[COLUMNS.country]);
        if (country !== undefined && Number(row.n ?? 0) > 0) {
            found.add(country);
        }
    }
    return found.size;
}

export function groupsIn(rows: readonly RhydbRow[] | undefined): number | undefined {
    if (rows === undefined) {
        return undefined;
    }
    return new Set(
        rows
            .filter((row) => row[COLUMNS.group] !== null && row[COLUMNS.group] !== undefined && Number(row.n ?? 0) > 0)
            .map((row) => String(row[COLUMNS.group])),
    ).size;
}

export function spreadFigure(
    where: Place,
    rows: readonly RhydbRow[] | undefined,
    countries: number | undefined,
): { label: string; value: string; note?: string } {
    if (where.level === 'admin1') {
        return { label: 'Country', value: canonicalCountryOf(where.country) };
    }
    if (where.level === 'country') {
        return {
            label: 'Admin level 1',
            value: rows === undefined ? '…' : formatCount(placesWithin(areaScale(where), where, rows)),
        };
    }
    return { label: 'Countries', value: countries === undefined ? '…' : formatCount(countries) };
}

export function spreadPhrase(where: Place, rows: readonly RhydbRow[] | undefined, countries: number): string {
    if (where.level === 'admin1') {
        return `from ${placeLabel(where)}`;
    }
    if (where.level === 'country') {
        const places = placesWithin(areaScale(where), where, rows);
        return places === 0
            ? `from ${placeLabel(where)}`
            : `from ${formatCount(places)} ${places === 1 ? 'province or state' : 'provinces or states'} of ${placeLabel(where)}`;
    }
    const within = where.level === 'world' ? '' : ` of ${placeLabel(where)}`;
    return `from ${formatCount(countries)} ${countries === 1 ? 'country' : 'countries'}${within}`;
}
