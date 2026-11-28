import { COLUMNS } from './columns.ts';
import type { ProportionRows } from './genomics.ts';
import {
    childPlaceOf,
    canonicalCountryOf,
    hasAdmin1Names,
    placedCountryOf,
    recordedPlaceOf,
    type Place,
} from '../../domain/geography.ts';
import type { RhydbRow } from '../transport/row.ts';

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
        return {
            singular: 'province or state',
            plural: 'provinces or states',
            of: (row) => {
                const place = childPlaceOf(
                    where,
                    recordedPlaceOf(row[COLUMNS.country]),
                    recordedPlaceOf(row[COLUMNS.admin1]),
                );
                return place?.level === 'admin1' ? { name: place.admin1, place } : undefined;
            },
        };
    }
    return {
        singular: 'country',
        plural: 'countries',
        of: (row) => {
            const country = placedCountryOf(row[COLUMNS.country]);
            return country === undefined ? undefined : { name: country, place: { level: 'country', country } };
        },
    };
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

/** Include every geographic row in scope, including entries without a mapped area. */
export function geographicTotal(where: Place, rows: readonly RhydbRow[]): number {
    return rows.reduce((sum, row) => {
        const outside =
            where.level === 'country' && placedCountryOf(row[COLUMNS.country]) !== canonicalCountryOf(where.country);
        return outside ? sum : sum + Number(row.n ?? 0);
    }, 0);
}

export function hasPlacesBelow(where: Place): boolean {
    return where.level !== 'admin1';
}

/** Only divisions identifiable in this country's lookup contribute to a report's administrative count. */
export function divisionCount(country: string, rows: readonly RhydbRow[]): number | undefined {
    if (!hasAdmin1Names(country)) {
        return undefined;
    }
    const scale = areaScale({ level: 'country', country });
    const found = new Set<string>();
    for (const row of rows) {
        const area = scale.of(row);
        if (Number(row.n) > 0 && area !== undefined) {
            found.add(area.name);
        }
    }
    return found.size;
}

export function areaCounts(
    scale: AreaScale,
    rows: ProportionRows | undefined,
    includeZero: boolean,
): AreaCount[] | undefined {
    if (rows === undefined) {
        return undefined;
    }
    const n = (row: RhydbRow) => Number(row.n ?? 0);
    return rankAreas(scale, [
        ...rows.own.map((row) => ({ row, own: n(row), all: 0 })),
        ...rows.all.map((row) => ({ row, own: 0, all: n(row) })),
    ]).filter((area) => includeZero || area.own > 0);
}
