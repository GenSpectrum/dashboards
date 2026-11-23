/** Read lineage relationships from the definitions supplied by RhyDB. */

import { UNASSIGNED_SUBTYPES } from '../mappingData/missingValues.ts';

export const UNASSIGNED = '(unassigned)';

const UNASSIGNED_SPELLINGS = new Set(UNASSIGNED_SUBTYPES);

export function isUnassignedValue(value: string | null): boolean {
    return value === null || UNASSIGNED_SPELLINGS.has(value.trim().toLowerCase());
}

export function normalizeSubtype(value: string | null): string {
    return value === null || isUnassignedValue(value) ? UNASSIGNED : value;
}

/** RhyDB lineage definitions list parent names and aliases for each name. */
export type LineageDefinition = Readonly<Record<string, { parents?: readonly string[]; aliases?: readonly string[] }>>;

export type LineageTree = {
    readonly names: readonly string[];
    has(value: string): boolean;
    canonicalOf(value: string): string;
    parentOf(name: string): string | undefined;
    ancestorsOf(value: string): string[];
    isWithin(value: string, ancestor: string): boolean;
    within(name: string): string[];
    /** Return the immediate child of `under` that contains this value. With no parent, return its root. */
    rollUp(value: string, under: string | undefined): string;
};

export type Hierarchy = (table: string, column: string) => LineageTree | undefined;

export const NO_HIERARCHY: Hierarchy = () => undefined;

export function lineageTreeOf(definition: LineageDefinition): LineageTree {
    const names = Object.keys(definition);
    const held = new Set(names);
    const parents = new Map<string, string>();
    const children = new Map<string, string[]>();
    const aliases = new Map<string, string>();
    for (const name of names) {
        const entry = definition[name];
        // Assign a recombinant to its first known parent so it is counted once in a breakdown.
        const parent = (entry.parents ?? []).find((candidate) => held.has(candidate) && candidate !== name);
        if (parent !== undefined) {
            parents.set(name, parent);
            children.set(parent, [...(children.get(parent) ?? []), name]);
        }
        for (const alias of entry.aliases ?? []) {
            if (!held.has(alias)) {
                aliases.set(alias, name);
            }
        }
    }

    const canonicalOf = (value: string) => (held.has(value) ? value : (aliases.get(value) ?? value));

    const pathCache = new Map<string, string[]>();
    const pathOf = (name: string): string[] => {
        const cached = pathCache.get(name);
        if (cached !== undefined) {
            return cached;
        }
        const path: string[] = [];
        const seen = new Set<string>();
        for (let cursor: string | undefined = name; cursor !== undefined && !seen.has(cursor);) {
            seen.add(cursor);
            path.unshift(cursor);
            cursor = parents.get(cursor);
        }
        pathCache.set(name, path);
        return path;
    };

    const isWithin = (value: string, ancestor: string) => {
        const name = canonicalOf(value);
        return held.has(name) && pathOf(name).includes(ancestor);
    };

    return {
        names,
        has: (value) => held.has(canonicalOf(value)),
        canonicalOf,
        parentOf: (name) => parents.get(name),
        ancestorsOf: (value) => {
            const name = canonicalOf(value);
            return held.has(name) ? pathOf(name).slice(0, -1) : [];
        },
        isWithin,
        within: (name) => {
            if (!held.has(name)) {
                return [];
            }
            // Iterating the growing array visits all descendants in breadth-first order.
            const found = [name];
            for (const current of found) {
                found.push(...(children.get(current) ?? []));
            }
            return found;
        },
        rollUp: (value, under) => {
            const name = canonicalOf(value);
            if (!held.has(name) || (under !== undefined && !isWithin(name, under))) {
                return name;
            }
            const path = pathOf(name);
            const below = under === undefined ? 0 : path.indexOf(under) + 1;
            return path[below] ?? name;
        },
    };
}

export function compareSubtypes(a: string, b: string): number {
    if (a === UNASSIGNED) {
        return b === UNASSIGNED ? 0 : 1;
    }
    if (b === UNASSIGNED) {
        return -1;
    }
    return a.localeCompare(b, 'en', { numeric: true });
}
