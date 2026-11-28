import { COUNTRY_ALIASES, MAP_NAMES } from '../mappingData/countryNames.ts';
import { NOT_RECORDED_PLACES } from '../mappingData/missingValues.ts';
import { CONTINENTS, SUBREGIONS, type Continent } from '../mappingData/subregions.ts';

export { CONTINENTS };
export type { Continent };
export const SUBREGION_NAMES: readonly string[] = Object.keys(SUBREGIONS);

const regions = new Map(Object.entries(SUBREGIONS));
const regionByPlace = new Map<string, string>();
const countries = new Set<string>();
for (const [region, places] of regions) {
    for (const country of places.countries) {
        countries.add(country);
        regionByPlace.set(country, region);
    }
    for (const place of places.otherPlaces ?? []) {
        regionByPlace.set(place, region);
    }
}

export function subregionOf(place: string): string | undefined {
    return regionByPlace.get(canonicalCountryOf(place));
}

export function continentOf(country: string): Continent | undefined {
    const subregion = subregionOf(country);
    return subregion === undefined ? undefined : regions.get(subregion)?.continent;
}

export function placesOfSubregion(subregion: string): readonly string[] {
    const group = regions.get(subregion);
    return group === undefined ? [] : [...group.countries, ...(group.otherPlaces ?? [])];
}

export function placesOfContinent(continent: Continent): string[] {
    return [...regions].flatMap(([name, group]) => (group.continent === continent ? placesOfSubregion(name) : []));
}

export function mapNameOf(place: string): string {
    const country = canonicalCountryOf(place);
    return Object.hasOwn(MAP_NAMES, country) ? MAP_NAMES[country] : country;
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

/** The present-day country or area identifiable from a recorded location. */
export function placedCountryOf(value: unknown): string | undefined {
    const recorded = recordedPlaceOf(value);
    if (recorded === null) {
        return undefined;
    }
    const country = canonicalCountryOf(recorded);
    return countries.has(country) ? country : undefined;
}

export function canonicalCountryOf(country: string): string {
    return Object.hasOwn(COUNTRY_ALIASES, country) ? COUNTRY_ALIASES[country] : country;
}

/** The recorded country spellings included in the same report or filter. */
export function countryNamesOf(country: string): string[] {
    const canonical = canonicalCountryOf(country);
    return [canonical, ...Object.keys(COUNTRY_ALIASES).filter((name) => COUNTRY_ALIASES[name] === canonical)];
}
