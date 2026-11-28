import { divisionCount } from '../../../pathoplexusExplorer/dataLayer/queries/areas.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { canonicalCountryOf, placeLabel, type Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';

export function plural(level: string): string {
    return level.split(' or ').map(pluralWord).join(' or ');
}

function pluralWord(word: string): string {
    if (word.endsWith('y')) {
        return `${word.slice(0, -1)}ies`;
    }
    return word.endsWith('s') ? word : `${word}s`;
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
        const count = rows === undefined ? undefined : divisionCount(where.country, rows);
        return {
            label: 'Admin level 1',
            value: rows === undefined ? '…' : count === undefined ? '—' : formatCount(count),
        };
    }
    return { label: 'Countries', value: countries === undefined ? '…' : formatCount(countries) };
}

export function spreadPhrase(where: Place, rows: readonly RhydbRow[] | undefined, countries: number): string {
    if (where.level === 'admin1') {
        return `from ${placeLabel(where)}`;
    }
    if (where.level === 'country') {
        const places = rows === undefined ? undefined : divisionCount(where.country, rows);
        return places === undefined || places === 0
            ? `from ${placeLabel(where)}`
            : `from ${formatCount(places)} ${places === 1 ? 'province or state' : 'provinces or states'} of ${placeLabel(where)}`;
    }
    const within = where.level === 'world' ? '' : ` of ${placeLabel(where)}`;
    return `from ${formatCount(countries)} ${countries === 1 ? 'country' : 'countries'}${within}`;
}
