import { compileVariant, lineageFilter } from './variantFilter.ts';
import {
    admin1AreaOf,
    countriesOfContinent,
    countriesOfSubregion,
    countryNamesOf,
    type Place,
} from '../../domain/geography.ts';
import { isUnassignedValue, UNASSIGNED, type Hierarchy } from '../../domain/lineages.ts';
import { hasVariant, type Period, type Scope } from '../../domain/scope.ts';
import {
    effectiveSteps,
    namingLevels,
    pathogenOf,
    type Pathogen,
    type SubtypeStep,
    type Subject,
} from '../../domain/subject.ts';
import { parseVariant, resolveVariant, type ReferenceSequences, type ResolvedNode } from '../../domain/variant.ts';
import { and, bool, dateLiteral, field, not, or, str, type Expr } from '../transport/expression.ts';
import { isNotNull, isNull } from '../transport/functions.ts';

export const COLUMNS = {
    accessionVersion: 'accessionVersion',
    dataUseTerms: 'dataUseTerms',
    restrictedUntil: 'dataUseTermsRestrictedUntil',
    termsUrl: 'dataUseTermsUrl',
    country: 'geoLocCountry',
    admin1: 'geoLocAdmin1',
    lower: 'sampleCollectionDateRangeLower',
    upper: 'sampleCollectionDateRangeUpper',
    released: 'earliestReleaseDate',
    host: 'hostNameScientific',
    hostTaxon: 'hostTaxonId',
    group: 'groupId',
    groupName: 'groupName',
    authors: 'authors',
    affiliations: 'authorAffiliations',
    versionStatus: 'versionStatus',
    revocation: 'isRevocation',
} as const;

/** Include current versions only, excluding revocations. */
export const CURRENT_VERSION: Expr = and(
    field(COLUMNS.versionStatus).eq(str('LATEST_VERSION')),
    field(COLUMNS.revocation).eq(bool(false)),
);

export class VariantError extends Error {}

export type ScopeLookups = {
    hierarchy: Hierarchy;
    columnValues: (table: string, column: string) => readonly (string | null)[] | undefined;
    admin1Names?: readonly (string | null)[];
    references?: ReferenceSequences;
};

export type TableFilter = (table: string) => Expr | undefined;

export function scopeFilter(scope: Scope, lookups: ScopeLookups): TableFilter {
    const where = placeFilter(scope.where, lookups.admin1Names);
    const when = dateFilter(scope.period);
    const variant = variantFilter(scope, lookups);
    return (table) =>
        and(
            subtypeFilter(scope.what, table, lookups),
            exceptFilter(scope.except, table, lookups),
            variant?.(table),
            where,
            when,
        );
}

function exceptFilter(except: Subject | undefined, table: string, lookups: ScopeLookups): Expr | undefined {
    const inside = except === undefined ? undefined : subtypeFilter(except, table, lookups);
    return inside === undefined ? undefined : not(inside);
}

function resolvedVariantOf(scope: Scope, lookups: ScopeLookups): ResolvedNode | undefined {
    if (!hasVariant(scope)) {
        return undefined;
    }
    const references = lookups.references;
    const pathogen = scope.what.pathogen;
    const parsed = parseVariant(scope.variant);
    if (!parsed.ok) {
        throw new VariantError(`This is not a valid variant query: “${scope.variant}”`);
    }
    if (references === undefined) {
        throw new VariantError(`Please choose a ${pathogen.referenceColumn ?? 'subtype'}.`);
    }
    const resolved = resolveVariant(parsed.node, {
        sequences: references,
        columns: columnsOf(pathogen, lookups.hierarchy),
    });
    if (!resolved.ok) {
        throw new VariantError(resolved.error);
    }
    return resolved.node;
}

export function columnsOf(pathogen: Pathogen, hierarchy: Hierarchy) {
    return namingLevels(pathogen).map((level) => ({
        column: level.column,
        hierarchical: hierarchy(pathogen.table, level.column) !== undefined,
    }));
}

function variantFilter(scope: Scope, lookups: ScopeLookups): TableFilter | undefined {
    const node = resolvedVariantOf(scope, lookups);
    const pathogen = pathogenOf(scope.what);
    if (node === undefined || pathogen === undefined) {
        return undefined;
    }
    const table = pathogen.table;
    const expr = compileVariant(node, table, lookups.hierarchy);
    return (candidate) => (candidate === table ? expr : undefined);
}

function subtypeFilter(what: Subject, table: string, lookups: ScopeLookups): Expr | undefined {
    if (what.kind !== 'subtype' || what.pathogen.table !== table) {
        return undefined;
    }
    return and(...effectiveSteps(what).map((step) => stepFilter(what, step, lookups)));
}

/** Include descendants when the subtype column has a lineage definition. */
function stepFilter(what: Subject & { kind: 'subtype' }, step: SubtypeStep, lookups: ScopeLookups): Expr {
    if (step.value === UNASSIGNED) {
        const known = lookups.columnValues(what.pathogen.table, step.column) ?? [];
        const spellings = known.filter((value): value is string => value !== null && isUnassignedValue(value));
        return spellings.length === 0
            ? isNull(field(step.column))
            : or(isNull(field(step.column)), field(step.column).isIn(spellings.map(str)));
    }
    return lineageFilter({
        table: what.pathogen.table,
        column: step.column,
        value: step.value,
        sublineages: true,
        hierarchy: lookups.hierarchy,
    });
}

/** Expand mapped divisions to the recorded spellings that resolve to them. */
function placeFilter(place: Place, admin1Names?: readonly (string | null)[]): Expr | undefined {
    const country = field(COLUMNS.country);
    switch (place.level) {
        case 'world':
            return undefined;
        case 'continent':
            return country.isIn(countriesOfContinent(place.continent).map(str));
        case 'subregion':
            return country.isIn(countriesOfSubregion(place.subregion).map(str));
        case 'country':
            return countryFilter(place.country);
        case 'admin1': {
            const recorded = (admin1Names ?? []).filter(
                (value): value is string =>
                    value !== null && admin1AreaOf(place.country, value) === place.admin1 && value !== place.admin1,
            );
            const admin1 =
                recorded.length === 0
                    ? field(COLUMNS.admin1).eq(str(place.admin1))
                    : field(COLUMNS.admin1).isIn([place.admin1, ...recorded].map(str));
            return and(countryFilter(place.country), admin1);
        }
    }
}

function countryFilter(name: string): Expr {
    const names = countryNamesOf(name);
    const country = field(COLUMNS.country);
    return names.length === 1 ? country.eq(str(names[0])) : country.isIn(names.map(str));
}

/** Require the complete date range to fit. An undated entry can carry its release date as the upper bound. */
export function dateFilter({ from, to }: Period): Expr | undefined {
    return and(
        from === undefined ? undefined : field(COLUMNS.lower).gte(dateLiteral(from)),
        to === undefined || from !== undefined ? undefined : isNotNull(field(COLUMNS.lower)),
        to === undefined ? undefined : field(COLUMNS.upper).lte(dateLiteral(to)),
    );
}

/** Collect subtype columns whose recorded spellings are needed to resolve unassigned values. */
function unassignedColumnsOf(what: Subject | undefined): { table: string; column: string }[] {
    if (what?.kind !== 'subtype') {
        return [];
    }
    return effectiveSteps(what)
        .filter((step) => step.value === UNASSIGNED)
        .map((step) => ({ table: what.pathogen.table, column: step.column }));
}

export function lookupsNeeded(scope: Scope): {
    columns: { table: string; column: string }[];
    admin1Country: string | undefined;
    references: boolean;
} {
    const columns = [scope.what, scope.except].flatMap(unassignedColumnsOf);
    return {
        columns,
        admin1Country: scope.where.level === 'admin1' ? scope.where.country : undefined,
        references: hasVariant(scope),
    };
}
