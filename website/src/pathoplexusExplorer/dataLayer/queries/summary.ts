import { COLUMNS } from './columns.ts';
import { placedCountryOf } from '../../domain/geography.ts';
import { readOptionalText, type RhydbRow } from '../transport/row.ts';

export function countryCounts(rows: readonly RhydbRow[]): Map<string, number> {
    const countries = new Map<string, number>();
    for (const row of rows) {
        const country = placedCountryOf(row[COLUMNS.country]);
        if (Number(row.n) > 0 && country !== undefined) {
            countries.set(country, (countries.get(country) ?? 0) + Number(row.n));
        }
    }
    return countries;
}

/** A submitting group can appear under several names. */
export function groupsIn(rows: readonly RhydbRow[]): number {
    const ids = new Set<string>();
    for (const row of rows) {
        const id = row[COLUMNS.group];
        if (Number(row.n) > 0 && id !== undefined && id !== null) {
            ids.add(String(id));
        }
    }
    return ids.size;
}

/** The total includes sequences without a place on the map. */
export function summaryOf(places: readonly RhydbRow[], groups: readonly RhydbRow[]) {
    return {
        n: places.reduce((n, row) => n + Number(row.n), 0),
        countries: countryCounts(places).size,
        groups: groupsIn(groups),
    };
}

/** An undated entry can carry its release date as its upper bound. */
export function collectionBoundsOf(rows: readonly RhydbRow[]) {
    let bounds: { firstFrom: string; firstTo: string; lastFrom: string; lastTo: string } | null = null;
    for (const row of rows) {
        const lower = readOptionalText(row, COLUMNS.lower);
        if (lower === null || Number(row.n) <= 0) {
            continue;
        }
        const upper = readOptionalText(row, COLUMNS.upper);
        if (upper === null || upper < lower) {
            return null;
        }
        if (bounds === null) {
            bounds = { firstFrom: lower, firstTo: upper, lastFrom: lower, lastTo: upper };
            continue;
        }
        if (lower < bounds.firstFrom) bounds.firstFrom = lower;
        if (upper < bounds.firstTo) bounds.firstTo = upper;
        if (lower > bounds.lastFrom) bounds.lastFrom = lower;
        if (upper > bounds.lastTo) bounds.lastTo = upper;
    }
    return bounds;
}
