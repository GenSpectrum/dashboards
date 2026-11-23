import { ADMIN1_NAMES } from '../mappingData/admin1Names.ts';
import { ADMIN1_PLACES } from '../mappingData/admin1Places.ts';
import { MAP_NAMES } from '../mappingData/countryNames.ts';
import { NOT_RECORDED_PLACES } from '../mappingData/missingValues.ts';
import { CONTINENTS, SUBREGIONS, type Continent } from '../mappingData/subregions.ts';

export { CONTINENTS };
export type { Continent };
export const SUBREGION_NAMES: readonly string[] = Object.keys(SUBREGIONS);

const COUNTRY_TO_SUBREGION = new Map<string, string>(
    Object.entries(SUBREGIONS).flatMap(([subregion, { countries }]) =>
        countries.map((country) => [country, subregion] as const),
    ),
);

export function subregionOf(country: string): string | undefined {
    return COUNTRY_TO_SUBREGION.get(country);
}

const SUBREGION_BY_NAME = new Map(Object.entries(SUBREGIONS));

function continentOfSubregion(subregion: string): Continent | undefined {
    return SUBREGION_BY_NAME.get(subregion)?.continent;
}

export function continentOf(country: string): Continent | undefined {
    const subregion = subregionOf(country);
    return subregion === undefined ? undefined : continentOfSubregion(subregion);
}

function subregionsOf(continent: Continent): string[] {
    return Object.entries(SUBREGIONS)
        .filter(([, value]) => value.continent === continent)
        .map(([name]) => name);
}

export function countriesOfSubregion(subregion: string): readonly string[] {
    return SUBREGION_BY_NAME.get(subregion)?.countries ?? [];
}

export function countriesOfContinent(continent: Continent): string[] {
    return subregionsOf(continent).flatMap((subregion) => countriesOfSubregion(subregion));
}

/** Places are encoded in URL keys such as `continent:Africa` and `country:Brazil`. */
export type Place =
    | { level: 'world' }
    | { level: 'continent'; continent: Continent }
    | { level: 'subregion'; subregion: string }
    | { level: 'country'; country: string }
    | { level: 'admin1'; country: string; admin1: string };

export const WORLD: Place = { level: 'world' };

export function placeKey(place: Place): string {
    switch (place.level) {
        case 'world':
            return '';
        case 'continent':
            return `continent:${place.continent}`;
        case 'subregion':
            return `subregion:${place.subregion}`;
        case 'country':
            return `country:${place.country}`;
        case 'admin1':
            return `admin1:${place.country}/${place.admin1}`;
    }
}

export function parsePlace(key: string | null | undefined): Place | undefined {
    if (key === null || key === undefined || key === '') {
        return WORLD;
    }
    const separator = key.indexOf(':');
    if (separator < 0) {
        return undefined;
    }
    const kind = key.slice(0, separator);
    const value = key.slice(separator + 1);
    switch (kind) {
        case 'continent':
            return (CONTINENTS as readonly string[]).includes(value)
                ? { level: 'continent', continent: value as Continent }
                : undefined;
        case 'subregion':
            return SUBREGION_BY_NAME.has(value) ? { level: 'subregion', subregion: value } : undefined;
        case 'country':
            return value === '' ? undefined : { level: 'country', country: canonicalCountryOf(value) };
        case 'admin1': {
            const slash = value.indexOf('/');
            if (slash <= 0 || slash === value.length - 1) {
                return undefined;
            }
            const country = canonicalCountryOf(value.slice(0, slash));
            return { level: 'admin1', country, admin1: admin1AreaOf(country, value.slice(slash + 1)) };
        }
        default:
            return undefined;
    }
}

export function placeLabel(place: Place): string {
    switch (place.level) {
        case 'world':
            return 'World';
        case 'continent':
            return place.continent;
        case 'subregion':
            return place.subregion;
        case 'country':
            return place.country;
        case 'admin1':
            return place.admin1;
    }
}

export function placePhrase(place: Place): string {
    return place.level === 'world' ? 'worldwide' : `in ${placeLabel(place)}`;
}

type ChildPlaceLevel = 'continent' | 'subregion' | 'country' | 'admin1' | undefined;

export function childPlaceLevel(place: Place): ChildPlaceLevel {
    switch (place.level) {
        case 'world':
            return 'continent';
        case 'continent':
            return 'subregion';
        case 'subregion':
            return 'country';
        case 'country':
            return 'admin1';
        case 'admin1':
            return undefined;
    }
}

export function childPlaceOf(place: Place, country: string | null, admin1: string | null): Place | undefined {
    if (country === null) {
        return undefined;
    }
    switch (place.level) {
        case 'world': {
            const continent = continentOf(country);
            return continent === undefined ? undefined : { level: 'continent', continent };
        }
        case 'continent': {
            const subregion = subregionOf(country);
            return subregion === undefined ? undefined : { level: 'subregion', subregion };
        }
        case 'subregion':
            return { level: 'country', country: canonicalCountryOf(country) };
        case 'country': {
            const canonical = canonicalCountryOf(country);
            return admin1 === null
                ? undefined
                : { level: 'admin1', country: canonical, admin1: admin1AreaOf(canonical, admin1) };
        }
        case 'admin1':
            return undefined;
    }
}

const DIVISION_TYPES = [
    'province',
    'prefecture',
    'state',
    'region',
    'district',
    'county',
    'territory',
    'governorate',
    'municipality',
];

/** Normalize division names for matching, including common prefixes and suffixes. */
function comparable(value: string): string {
    let text = value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/['’`]/g, '')
        .replace(/[-_./()[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    for (let shortened = true; shortened;) {
        shortened = false;
        for (const type of DIVISION_TYPES) {
            if (text.endsWith(` ${type}`)) {
                text = text.slice(0, -type.length - 1).trim();
                shortened = true;
            }
            if (text.startsWith(`${type} of `)) {
                text = text.slice(type.length + 4).trim();
                shortened = true;
            } else if (text.startsWith(`${type} `)) {
                text = text.slice(type.length + 1).trim();
                shortened = true;
            }
        }
    }
    return text;
}

function closedUp(value: string): string {
    return value.replaceAll(' ', '');
}

/** Accept unspaced aliases only when they still identify one division. */
function lookupOf(aliases: Readonly<Record<string, string>>): Map<string, string> {
    const table = new Map<string, string>();
    for (const [alias, area] of Object.entries(aliases)) {
        for (const key of [comparable(area), comparable(alias)]) {
            if (key !== '' && !table.has(key)) {
                table.set(key, area);
            }
        }
    }
    const closed = new Map<string, string | undefined>();
    for (const [key, area] of table) {
        const loose = closedUp(key);
        closed.set(loose, closed.has(loose) && closed.get(loose) !== area ? undefined : area);
    }
    for (const [loose, area] of closed) {
        if (area !== undefined && !table.has(loose)) {
            table.set(loose, area);
        }
    }
    return table;
}

const lookups = new Map<string, Map<string, string>>();

function lookupFor(kind: 'names' | 'places', country: string): Map<string, string> {
    const key = `${kind}:${country}`;
    const found = lookups.get(key);
    if (found !== undefined) {
        return found;
    }
    const built = lookupOf((kind === 'names' ? ADMIN1_NAMES : ADMIN1_PLACES)[country] ?? {});
    lookups.set(key, built);
    return built;
}

/** Try the complete value before splitting it so compound division names take precedence. */
function piecesOf(recorded: string): string[] {
    const pieces = recorded
        .split(/[,/()_]/)
        .map((piece) => piece.trim())
        .filter((piece) => piece !== '');
    const parted = pieces.flatMap((piece) =>
        piece
            .split('-')
            .map((part) => part.trim())
            .filter((part) => part !== '' && part !== piece),
    );
    return [recorded.trim(), ...pieces, ...parted];
}

function matched(table: Map<string, string>, value: string): string | undefined {
    const key = comparable(value);
    return table.get(key) ?? table.get(closedUp(key));
}

const CODE = /^[A-Z]{2,4}$/;

/** Resolve a recorded division or place within its country. Keep the original value if it cannot be resolved. */
export function admin1AreaOf(country: string | undefined, recorded: string): string {
    const head =
        recorded
            .split(/[,/]/)
            .map((part) => part.trim())
            .find((part) => part !== '') ?? recorded.trim();
    if (!hasAdmin1Names(country)) {
        return head;
    }
    const names = lookupFor('names', country);
    const pieces = piecesOf(recorded);
    for (const piece of pieces) {
        const area = matched(names, piece);
        if (area !== undefined) {
            return area;
        }
    }
    for (const word of recorded.trim().split(/[\s,/()_-]+/)) {
        const area = CODE.test(word) ? names.get(comparable(word)) : undefined;
        if (area !== undefined) {
            return area;
        }
    }
    const places = lookupFor('places', country);
    for (const piece of pieces) {
        const area = matched(places, piece);
        if (area !== undefined) {
            return area;
        }
    }
    return head;
}

const divisions = new Map<string, Set<string>>();

/** Distinguishes a mapped division from an unresolved value retained by `admin1AreaOf`. */
export function isAdmin1Of(country: string | undefined, name: string): boolean {
    if (!hasAdmin1Names(country)) {
        return false;
    }
    let known = divisions.get(country);
    if (known === undefined) {
        known = new Set(Object.values(ADMIN1_NAMES[country]));
        divisions.set(country, known);
    }
    return known.has(name);
}

export function hasAdmin1Names(country: string | undefined): country is string {
    return country !== undefined && Object.hasOwn(ADMIN1_NAMES, country);
}

export function mapNameOf(country: string): string {
    return MAP_NAMES[country] ?? country;
}

/** Treat INSDC missing-value placeholders as missing place data. */
const NOT_RECORDED = new Set(NOT_RECORDED_PLACES);

export function recordedPlaceOf(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed === '' || NOT_RECORDED.has(trimmed.toLowerCase()) ? null : trimmed;
}

/** The country of a recorded value, if M49 places it on a continent. Oceans and other unplaced locations have none. */
export function placedCountryOf(value: unknown): string | undefined {
    const recorded = recordedPlaceOf(value);
    if (recorded === null) {
        return undefined;
    }
    const country = canonicalCountryOf(recorded);
    return continentOf(country) === undefined ? undefined : country;
}

export function canonicalCountryOf(country: string): string {
    const mapped = mapNameOf(country);
    return mapped !== country && COUNTRY_TO_SUBREGION.has(mapped) ? mapped : country;
}

/** Returns the names the database may use for a country, for use in filters. */
export function countryNamesOf(country: string): string[] {
    const canonical = canonicalCountryOf(country);
    return [
        canonical,
        ...Object.keys(MAP_NAMES).filter(
            (name) => name !== canonical && canonicalCountryOf(name) === canonical && name !== country,
        ),
        ...(country === canonical ? [] : [country]),
    ];
}
