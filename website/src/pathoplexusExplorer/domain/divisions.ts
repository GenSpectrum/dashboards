import names from '../mappingData/divisionNames.json' with { type: 'json' };
import places from '../mappingData/divisionPlaces.json' with { type: 'json' };

type DivisionAliases = Readonly<Record<string, readonly string[]>>;
const divisionNames = new Map<string, DivisionAliases>(Object.entries(names));
const divisionPlaces = new Map<string, DivisionAliases>(Object.entries(places));
export const mappedCountries = [...divisionNames.keys()];

export function hasAdmin1Names(country: string | undefined): country is string {
    return country !== undefined && divisionNames.has(country);
}

export function isAdmin1Of(country: string | undefined, name: string): boolean {
    const divisions = country === undefined ? undefined : divisionNames.get(country);
    return divisions !== undefined && Object.hasOwn(divisions, name);
}

function spelling(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['’`]/g, '')
        .replace(/[-_./()[\]\s]+/g, ' ')
        .trim();
}

// These titles qualify names at the level recorded in the country's lookup.
const titles = new Map<string, RegExp>([
    ['Argentina', /^provincia de(?:l| la)? /],
    ['Brazil', /(?: state$|^estado de )/],
    ['Democratic Republic of the Congo', /^(?:province (?:of )?)/],
    ['France', /^departement (?:de la|de|des|du) /],
    ['Italy', /^provincia di /],
    ['Kenya', / (?:county|district)$/],
    ['Nepal', / province$/],
    ['Sierra Leone', / (?:province|district)$/],
    ['Spain', /^provincia de /],
    ['Thailand', /^changwat /],
    ['Uganda', / district$/],
    ['USA', / state$/],
]);

// A null entry records a spelling shared by multiple areas, including names that differ only by spacing.
type Lookup = Map<string, string | null>;
const lookups = new Map<string, Lookup>();

function lookupFor(country: string, divisions: DivisionAliases): Lookup {
    const cached = lookups.get(country);
    if (cached !== undefined) {
        return cached;
    }
    const lookup: Lookup = new Map();
    const add = (key: string, area: string) => {
        lookup.set(key, lookup.has(key) && lookup.get(key) !== area ? null : area);
    };
    for (const source of [divisions, divisionPlaces.get(country) ?? {}]) {
        for (const [area, aliases] of Object.entries(source)) {
            for (const name of [area, ...aliases]) {
                if (/^[A-Z]{1,4}$/.test(name) && name !== area) {
                    add(name, area);
                } else {
                    const key = spelling(name);
                    add(key, area);
                    add(key.replaceAll(' ', ''), area);
                }
            }
        }
    }
    lookups.set(country, lookup);
    return lookup;
}

/** Use the most specific recorded name. Conflicting or unknown places retain their recorded label. */
export function admin1AreaOf(country: string | undefined, recorded: string): string {
    const raw = recorded.trim();
    const divisions = country === undefined ? undefined : divisionNames.get(country);
    if (country === undefined || divisions === undefined) {
        return raw;
    }
    const lookup = lookupFor(country, divisions);
    const title = titles.get(country);
    function match(text: string) {
        const key = spelling(text);
        const bare = title === undefined ? key : key.replace(title, '');
        for (const candidate of [
            text.trim().replace(/\.$/, ''),
            key,
            key.replaceAll(' ', ''),
            bare,
            bare.replaceAll(' ', ''),
        ]) {
            if (lookup.has(candidate)) {
                return lookup.get(candidate);
            }
        }
        return undefined;
    }
    const full = match(raw);
    if (full !== undefined) {
        return full ?? raw;
    }
    const parts = raw.split(/[,/()]/).map(match);
    // In US and Brazilian addresses a postal abbreviation can follow the town without a comma.
    const postal = (country === 'USA' || country === 'Brazil') && /[\s-]([A-Z]{2})$/.exec(raw);
    if (postal && !(country === 'USA' && postal[1] === 'CO')) {
        parts.push(lookup.get(postal[1]));
    }
    const areas = new Set(parts.filter((area) => area !== undefined));
    return areas.size === 1 ? ([...areas][0] ?? raw) : raw;
}
