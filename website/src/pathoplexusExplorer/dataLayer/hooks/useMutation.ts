import { useMemo } from 'react';

import { useLineageHierarchy, useScopeFilters } from './analyses.ts';
import { useComparisonRows, useProportionOverTime } from './genomics.ts';
import { combineQueryResults, type Loadable } from './queryResult.ts';
import { useManyRows, useRows } from './rhydbQuery.ts';
import { useGenome, useReferenceSequences, type Genome, type ReferenceSymbols } from './useGenome.ts';
import { CATALOG } from '../../domain/catalog.ts';
import type { Place } from '../../domain/geography.ts';
import type { Hierarchy } from '../../domain/lineages.ts';
import type { Period } from '../../domain/scope.ts';
import { formatCount } from '../../domain/statistics.ts';
import { pathogenOf, type Catalog, type Subject } from '../../domain/subject.ts';
import {
    insertionsOf,
    MUTATION_KIND,
    mutationsOf,
    parseVariant,
    resolveVariant,
    type ReferenceSequences,
    type ResolvedInsertion,
    type ResolvedMutation,
    type ResolvedNode,
} from '../../domain/variant.ts';
import type { ProportionRows } from '../queries/genomics.ts';
import { positionReadingOf, coverageRowsOf, type PositionReading } from '../queries/positions.ts';
import type { ResolvedScope } from '../queries/resolve.ts';
import { columnsOf } from '../queries/scope.ts';
import { symbolCountsQuery } from '../queries/sequences.ts';

/** Position summaries use the mutations. Insertions take part in the filter only. */
export type MutationSubject = {
    node: ResolvedNode;
    mutations: ResolvedMutation[];
    insertions: ResolvedInsertion[];
    sequences: ReferenceSequences;
};

export type SubjectResult = { subject?: MutationSubject; error?: string };

export type MutationCheck = {
    subject: Loadable<SubjectResult>;
    genome: Loadable<Genome>;
    /** Why a position of the query is not on the reference genome, if one is not. */
    beyondGenome: string | undefined;
    /** Whether the query resolves and lies on the genome, once that is known. */
    valid: boolean | undefined;
};

/** Check a mutation query against the pathogen's reference genome before anything is counted for it. */
export function useMutationCheck(what: Subject | undefined, query: string): MutationCheck {
    const subject = useSubject(what, query, CATALOG);
    const resolved = subject.data?.subject;
    const genome = useGenome(what, resolved !== undefined);
    const beyondGenome = useMemo(() => outsideGenome(resolved, genome.data), [resolved, genome.data]);
    return { subject, genome, beyondGenome, valid: validity(subject, genome, beyondGenome) };
}

function validity(
    subject: Loadable<SubjectResult>,
    genome: Loadable<Genome>,
    beyondGenome: string | undefined,
): boolean | undefined {
    if (subject.error !== null || genome.error !== null || subject.data?.error !== undefined) {
        return false;
    }
    if (subject.data?.subject === undefined || genome.data === undefined) {
        return undefined;
    }
    return beyondGenome === undefined;
}

export function useSubject(what: Subject | undefined, query: string, catalog: Catalog): Loadable<SubjectResult> {
    const references = useReferenceSequences(what);
    const hierarchy = useLineageHierarchy(catalog);
    const sequences = references.data;
    const trees = hierarchy.data;
    const column = (what === undefined ? undefined : pathogenOf(what))?.referenceColumn ?? 'subtype';
    const data =
        what === undefined || references.isLoading || trees === undefined
            ? undefined
            : sequences === undefined
              ? { error: `Choose a ${column} first: this pathogen has one reference genome per ${column}.` }
              : resolve(query, sequences, what, trees);
    return combineQueryResults(data, [references, hierarchy]);
}

function resolve(query: string, sequences: ReferenceSequences, what: Subject, hierarchy: Hierarchy): SubjectResult {
    const parsed = parseVariant(query);
    if (!parsed.ok) {
        return { error: `This is not a valid mutation query: “${query}”` };
    }
    const pathogen = pathogenOf(what);
    const columns = pathogen === undefined ? [] : columnsOf(pathogen, hierarchy);
    const resolved = resolveVariant(parsed.node, { sequences, columns });
    if (!resolved.ok) {
        return { error: resolved.error };
    }
    const found = mutationsOf(resolved.node);
    const insertions = insertionsOf(resolved.node);
    if (found.length === 0 && insertions.length === 0) {
        return { error: 'This query does not define a mutation.' };
    }
    return { subject: { node: resolved.node, mutations: found, insertions, sequences } };
}

export function usePositions(
    parent: Loadable<ResolvedScope>,
    subject: MutationSubject | undefined,
    reference: ReferenceSymbols | undefined,
): Loadable<PositionReading[]> {
    const scope = parent.data;
    const mutations = subject?.mutations ?? [];
    const queries = mutations.map((mutation) =>
        scope?.tables.length !== 1
            ? undefined
            : symbolCountsQuery({
                  table: scope.tables[0],
                  filter: scope.filter(scope.tables[0]),
                  sequence: mutation.sequence,
                  position: mutation.position,
              }),
    );
    const rows = useManyRows(queries, 'Positions');
    const data =
        rows.data === undefined || subject === undefined
            ? undefined
            : mutations.map((mutation, index) =>
                  positionReadingOf(
                      mutation,
                      subject.sequences,
                      rows.data?.[index] ?? [],
                      referenceSymbol(reference, mutation),
                  ),
              );
    return combineQueryResults(data, [parent, rows]);
}

/** Use the actual reference symbol for the position, regardless of the prefix in the query. */
function referenceSymbol(
    reference: ReferenceSymbols | undefined,
    mutation: ResolvedMutation | undefined,
): string | undefined {
    if (reference === undefined || mutation === undefined) {
        return undefined;
    }
    const source =
        mutation.kind === MUTATION_KIND.nucleotide
            ? reference.segments.get(mutation.sequence)
            : reference.proteins.get(mutation.sequence);
    return source?.[mutation.position - 1];
}

/** Compute coverage-adjusted proportions only for a query consisting of one mutation. */
export function useCoverageByGroup(
    parent: Loadable<ResolvedScope>,
    subject: MutationSubject | undefined,
    reference: ReferenceSymbols | undefined,
    by: readonly string[],
    enabled = true,
): Loadable<ProportionRows> {
    const scope = parent.data;
    const mutation = subject?.mutations.length === 1 ? subject.mutations[0] : undefined;
    const query =
        !enabled || mutation === undefined || scope?.tables.length !== 1
            ? undefined
            : symbolCountsQuery({
                  table: scope.tables[0],
                  filter: scope.filter(scope.tables[0]),
                  sequence: mutation.sequence,
                  position: mutation.position,
                  by,
              });
    const rows = useRows(query, 'Carriers by group');
    const from = referenceSymbol(reference, mutation);
    const data = useMemo(
        () =>
            rows.data === undefined || mutation === undefined
                ? undefined
                : coverageRowsOf(rows.data, mutation, by, from),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `rows` was read for this mutation and scope
        [rows.data, mutation?.sequence, mutation?.position, mutation?.to, from, by.join('|')],
    );
    return combineQueryResults(data, [parent, rows]);
}

export type MutationReads = {
    resolved: Loadable<ResolvedScope[]>;
    carriers: Loadable<ProportionRows>;
    proportion: Loadable<ProportionRows>;
    positions: Loadable<PositionReading[]>;
};

export function useMutationReads(options: {
    what: Subject;
    where: Place;
    query: string;
    period: Period;
    subject: MutationSubject;
    column: string | undefined;
    reference: ReferenceSymbols;
    catalog: Catalog;
}): MutationReads {
    const { what, where, query, period, subject, column, reference, catalog } = options;
    const base = { what, where, period };
    const resolved = useScopeFilters([{ ...base, variant: query }, base], catalog);
    const all: Loadable<ResolvedScope> = { ...resolved, data: resolved.data?.[1] };
    const carriers = useComparisonRows(resolved, column === undefined ? undefined : [column], 'Carriers');
    const proportion = useProportionOverTime(resolved, true);
    const positions = usePositions(all, subject, reference);
    return { resolved, carriers, proportion, positions };
}

/** An insertion follows its position, so it may also come before the first symbol. */
export function outsideGenome(
    subject: { mutations: readonly ResolvedMutation[]; insertions: readonly ResolvedInsertion[] } | undefined,
    genome: ReferenceSymbols | undefined,
): string | undefined {
    if (subject === undefined || genome === undefined) {
        return undefined;
    }
    const placed = [
        ...subject.mutations.map((mutation) => ({ ...mutation, first: 1 })),
        ...subject.insertions.map((insertion) => ({ ...insertion, first: 0 })),
    ];
    for (const mutation of placed) {
        const sequence =
            mutation.kind === MUTATION_KIND.nucleotide
                ? genome.segments.get(mutation.sequence)
                : genome.proteins.get(mutation.sequence);
        if (sequence === undefined || (mutation.position >= mutation.first && mutation.position <= sequence.length)) {
            continue;
        }
        const nucleotide = mutation.kind === MUTATION_KIND.nucleotide;
        const reference = mutation.display === '' ? 'the reference' : `the reference for ${mutation.display}`;
        return `There is no ${nucleotide ? 'base' : 'residue'} ${formatCount(mutation.position)}, ${reference} is ${formatCount(sequence.length)} ${nucleotide ? 'bases' : 'residues'} long.`;
    }
    return undefined;
}
