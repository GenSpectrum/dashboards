import { useMemo } from 'react';

import { merged, useLineageHierarchy, useScopeFilters, type Loadable } from './analyses.ts';
import { useMutationProfiles, useProportionOverTime, type ProportionRows } from './genomics.ts';
import { useManyRows } from './rhydbQuery.ts';
import { useReferenceSequences } from './useGenome.ts';
import type { Place } from '../../domain/geography.ts';
import { comparableParentOf, referenceKeyOf, referenceOf, sequenceRank } from '../../domain/reference.ts';
import type { Period } from '../../domain/scope.ts';
import { isPathogenNode, menuSubjectOf, sameSubject, type Catalog, type Subject } from '../../domain/subject.ts';
import { MUTATION_KIND, type ReferenceSequences } from '../../domain/variant.ts';
import { groupAcross } from '../queries/builders.ts';
import { REPORT_FLOOR } from '../queries/genomics.ts';
import {
    MUTATION_ROLE,
    mutationOf,
    observationOf,
    profileOf,
    roleOf,
    type Mutation,
    type ProfileRow,
} from '../queries/mutations.ts';
import type { RhydbRow } from '../transport/row.ts';

/** Compare the lineage with its parent after excluding the lineage and all descendants from the parent count. */
export const DEFINING = 0.8;
export const PARENT_MAX = 0.2;
const COMMON = 0.5;

export type CommonMutation = Mutation & {
    count: number;
    coverage: number;
    proportion: number;
    /** Jaccard similarity of the lineage and carriers of the mutation, over the report's pathogen scope. */
    jaccard?: number;
};

export type LineageMutations = {
    unavailable?: string;
    common: CommonMutation[];
    totals: { nucleotide: number; aminoAcid: number };
    defining: ProfileRow[];
};

export function useLineageMutations(options: {
    what: Subject;
    where: Place;
    period: Period;
    catalog: Catalog;
}): Loadable<LineageMutations> {
    const { what, where, period, catalog } = options;
    const hierarchy = useLineageHierarchy(catalog);
    // Wait for lineage definitions before choosing a comparison group.
    const parent = hierarchy.data === undefined ? undefined : comparableParentOf(what, hierarchy.data);
    const unavailable = unavailableReason(what);
    const base = proportionBaseOf(what);
    // Use the same place and collection period for all comparisons.
    const scopes = [
        { what, where, period },
        ...(parent === undefined ? [] : [{ what: parent, where, period, except: what }]),
        ...(base === undefined ? [] : [{ what: base, where, period }]),
    ];
    const parentIndex = parent === undefined ? -1 : 1;
    const baseIndex = base === undefined ? -1 : scopes.length - 1;
    const resolved = useScopeFilters(scopes, catalog);
    const references = useReferenceSequences(what);
    const sequences = references.data;
    const key = what.kind === 'subtype' ? referenceKeyOf(what.pathogen, what) : undefined;
    const ready = sequences !== undefined && key !== undefined;
    const profiles = useMutationProfiles(
        resolved,
        { kind: MUTATION_KIND.aminoAcid, minProportion: REPORT_FLOOR },
        ready,
        scopes.map((_, index) => key !== undefined && index !== baseIndex),
    );
    const counted = useManyRows(
        [0, baseIndex].map((index) =>
            index < 0 || resolved.data === undefined
                ? undefined
                : groupAcross({
                      tables: resolved.data[index].tables,
                      filter: resolved.data[index].filter,
                      columns: [],
                  }),
        ),
        'Lineage sequences',
    );
    const total = counted.data?.[0] === undefined ? undefined : Number(counted.data[0][0]?.n ?? 0);
    const baseTotal = counted.data?.[1] === undefined ? undefined : Number(counted.data[1][0]?.n ?? 0);
    /** Set the wider query's minimum proportion low enough to include every mutation listed for the lineage. */
    const floor = useMemo(() => baselineFloor(profiles.data?.[0], baseTotal), [profiles.data, baseTotal]);
    const baseline = useMutationProfiles(
        resolved,
        { kind: MUTATION_KIND.aminoAcid, minProportion: floor ?? 0 },
        ready && baseIndex >= 0 && floor !== undefined,
        scopes.map((_, index) => index === baseIndex),
    );
    const nucleotides = useMutationProfiles(
        resolved,
        { kind: MUTATION_KIND.nucleotide, minProportion: COMMON },
        ready,
        scopes.map((_, index) => index === 0),
    );

    const data = useMemo((): LineageMutations | undefined => {
        if (unavailable !== undefined) {
            return { unavailable, common: [], totals: { nucleotide: 0, aminoAcid: 0 }, defining: [] };
        }
        if (
            sequences === undefined ||
            profiles.data === undefined ||
            nucleotides.data === undefined ||
            total === undefined ||
            (baseIndex >= 0 && baseline.data === undefined)
        ) {
            return undefined;
        }
        const own = profiles.data[0] ?? [];
        const rows = profileOf({
            columns: [
                { key: 'here', label: 'here', rows: own },
                ...(parentIndex < 0 ? [] : [{ key: 'above', label: 'above', rows: profiles.data[parentIndex] }]),
            ],
            sequences,
        });
        const thresholds = { defining: DEFINING, parentMax: parentIndex < 0 ? 1.01 : PARENT_MAX };
        const carriers = new Map<string, number>();
        for (const row of (baseIndex < 0 ? undefined : baseline.data?.[baseIndex]) ?? []) {
            carriers.set(mutationOf(row, sequences).key, observationOf(row).count);
        }
        const rank = sequenceRank(sequences);
        return {
            common: commonOf(own, sequences, carriers, total).sort(
                (a, b) =>
                    (b.jaccard ?? 0) - (a.jaccard ?? 0) ||
                    b.proportion - a.proportion ||
                    (rank.get(a.sequenceName) ?? 0) - (rank.get(b.sequenceName) ?? 0) ||
                    a.position - b.position,
            ),
            totals: {
                nucleotide: aboveCommon(nucleotides.data[0] ?? []),
                aminoAcid: aboveCommon(own),
            },
            defining: rows.filter((row) => roleOf(row, thresholds) === MUTATION_ROLE.defining),
        };
    }, [unavailable, sequences, profiles.data, baseline.data, nucleotides.data, total, parentIndex, baseIndex]);
    return merged(data, [hierarchy, resolved, references, profiles, baseline, nucleotides, counted]);
}

/** Leave a margin below the computed minimum to account for rounding. */
const FLOOR_MARGIN = 0.99;

/** Bound the mutation frequency by the smallest carrier count in the lineage divided by the wider sequence count. */
export function baselineFloor(
    rows: readonly RhydbRow[] | undefined,
    baseTotal: number | undefined,
): number | undefined {
    if (rows === undefined || baseTotal === undefined) {
        return undefined;
    }
    let rarest = Infinity;
    for (const row of rows) {
        const observed = observationOf(row);
        if (observed.proportion > COMMON) {
            rarest = Math.min(rarest, observed.count);
        }
    }
    if (!Number.isFinite(rarest) || baseTotal <= 0) {
        return 1;
    }
    return Math.max(0, Math.min(1, (rarest / baseTotal) * FLOOR_MARGIN));
}

function commonOf(
    rows: readonly RhydbRow[],
    sequences: ReferenceSequences,
    carriers: ReadonlyMap<string, number>,
    total: number,
): CommonMutation[] {
    return rows.flatMap((row) => {
        const observed = observationOf(row);
        if (observed.proportion <= COMMON) {
            return [];
        }
        const mutation = mutationOf(row, sequences);
        // A missing wider result would produce an incorrect Jaccard score. Skip it.
        const across = carriers.get(mutation.key) ?? observed.count;
        const union = total + across - observed.count;
        return [{ ...mutation, ...observed, jaccard: union <= 0 ? undefined : observed.count / union }];
    });
}

function aboveCommon(rows: readonly RhydbRow[]): number {
    return rows.filter((row) => observationOf(row).proportion > COMMON).length;
}

function unavailableReason(what: Subject): string | undefined {
    if (!isPathogenNode(what)) {
        return undefined;
    }
    const choice = referenceOf(what.pathogen, what);
    if (choice.status !== 'needed') {
        return undefined;
    }
    const level = what.pathogen.levels.find((candidate) => candidate.column === choice.column);
    const label = (level?.label ?? choice.column).toLowerCase();
    return `Choose a ${label} first: this pathogen has one reference genome per ${label}.`;
}

/** Use the serotype as the base where it is reported as a separate pathogen. */
export function proportionBaseOf(what: Subject): Subject | undefined {
    const base = menuSubjectOf(what);
    return sameSubject(base, what) ? undefined : base;
}

export function useLineageProportion(options: {
    what: Subject;
    where: Place;
    period: Period;
    catalog: Catalog;
}): Loadable<ProportionRows> {
    const { what, where, period, catalog } = options;
    const base = proportionBaseOf(what);
    const scopes = [{ what, where, period }, ...(base === undefined ? [] : [{ what: base, where, period }])];
    const resolved = useScopeFilters(scopes, catalog);
    const proportions = useProportionOverTime(
        resolved,
        base === undefined ? [] : [{ own: 0, all: 1 }],
        base !== undefined,
    );
    return merged(proportions.data?.[0], [resolved, proportions]);
}
