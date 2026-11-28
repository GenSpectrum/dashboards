import {
    canonicalCountryOf,
    continentOf,
    placedCountryOf,
    CONTINENTS,
    SUBREGION_NAMES,
    subregionOf,
    type Continent,
} from './countries.ts';
import { admin1AreaOf, isAdmin1Of } from './divisions.ts';

export * from './countries.ts';
export { admin1AreaOf, hasAdmin1Names, isAdmin1Of } from './divisions.ts';

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
            return SUBREGION_NAMES.includes(value) ? { level: 'subregion', subregion: value } : undefined;
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
    const canonical = canonicalCountryOf(country);
    switch (place.level) {
        case 'world': {
            const continent = continentOf(canonical);
            return continent === undefined ? undefined : { level: 'continent', continent };
        }
        case 'continent': {
            const subregion = subregionOf(canonical);
            return subregion === undefined ? undefined : { level: 'subregion', subregion };
        }
        case 'subregion':
            return placedCountryOf(canonical) === undefined ? undefined : { level: 'country', country: canonical };
        case 'country': {
            if (admin1 === null || canonical !== canonicalCountryOf(place.country)) {
                return undefined;
            }
            const name = admin1AreaOf(canonical, admin1);
            return isAdmin1Of(canonical, name) ? { level: 'admin1', country: canonical, admin1: name } : undefined;
        }
        case 'admin1':
            return undefined;
    }
}
