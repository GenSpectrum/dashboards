import { useMemo } from 'react';

import type { Period } from './kinds.ts';
import { symbolCountsQuery } from './queries.ts';
import { useGenome, useReferenceSequences, type Genome, type ReferenceSymbols } from './useGenome.ts';
import { CATALOG } from '../domain/catalog.ts';
import type { Place } from '../domain/geography.ts';
import type { Hierarchy } from '../domain/lineages.ts';
import { displayNameOf } from '../domain/reference.ts';
import { formatCount } from '../domain/statistics.ts';
import { pathogenOf, type Catalog, type Subject } from '../domain/subject.ts';
import {
    insertionsOf,
    MUTATION_KIND,
    mutationsOf,
    parseVariant,
    resolveVariant,
    type ReferenceSequences,
    type ResolvedInsertion,
    type ResolvedMutation,
    type MutationKind,
    type ResolvedNode,
} from '../domain/variant.ts';
import { AMBIGUOUS_AMINO_ACIDS, AMBIGUOUS_NUCLEOTIDES } from '../mappingData/ambiguousSymbols.ts';
import { merged, useLineageHierarchy, useScopeFilters, type Loadable } from '../rhydb/hooks/analyses.ts';
import { useCarriers, useProportionOverTime, type Carriers, type ProportionRows } from '../rhydb/hooks/genomics.ts';
import { useManyRows, useRows } from '../rhydb/hooks/rhydb.ts';
import type { ResolvedScope } from '../rhydb/queries/resolve.ts';
import { columnsOf } from '../rhydb/queries/scope.ts';
import { readOptionalText, type RhydbRow } from '../rhydb/transport/row.ts';

/** In a mutation query, a dot matches the reference symbol. */
const REFERENCE_SYMBOL = '.';

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
    return merged(data, [references, hierarchy]);
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

export type PositionReading = {
    mutation: ResolvedMutation;
    /** Remove the serotype suffix for the displayed gene name. */
    display: string;
    /** Sequences with a called symbol at this position. */
    read: number;
    carriers: number;
    ambiguous: number;
    absent: number;
    reference: string | undefined;
};

/** Use distinct ambiguity codes for nucleotides and amino acids. */
const AMBIGUOUS = {
    nucleotide: new Set(AMBIGUOUS_NUCLEOTIDES),
    aminoAcid: new Set(AMBIGUOUS_AMINO_ACIDS),
};

function isAmbiguous(symbol: string | null, kind: MutationKind): boolean {
    if (symbol === null) {
        return false;
    }
    const upper = symbol.toUpperCase();
    return kind === MUTATION_KIND.nucleotide ? AMBIGUOUS.nucleotide.has(upper) : AMBIGUOUS.aminoAcid.has(upper);
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
                  readingOf(mutation, subject, rows.data?.[index] ?? [], referenceSymbol(reference, mutation)),
              );
    return merged(data, [parent, rows]);
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

function readingOf(
    mutation: ResolvedMutation,
    subject: MutationSubject,
    rows: readonly RhydbRow[],
    from: string | undefined,
): PositionReading {
    const group = groupsOf(rows, mutation, [], from).reduce(
        (sum, entry) => ({ covered: sum.covered + entry.covered, carriers: sum.carriers + entry.carriers }),
        { covered: 0, carriers: 0 },
    );
    const sumWhere = (keep: (symbol: string | null) => boolean) =>
        rows.reduce((sum, row) => (keep(readOptionalText(row, 'symbol')) ? sum + Number(row.n ?? 0) : sum), 0);
    return {
        mutation,
        display: displayNameOf(subject.sequences, mutation.sequence),
        read: group.covered,
        carriers: group.carriers,
        ambiguous: sumWhere((symbol) => isAmbiguous(symbol, mutation.kind)),
        absent: sumWhere((symbol) => symbol === null),
        reference: from,
    };
}

export type SymbolGroup = {
    values: (string | null)[];
    covered: number;
    carriers: number;
};

/** Compute coverage-adjusted proportions only for a query consisting of one mutation. */
export function useSymbolGroups(
    parent: Loadable<ResolvedScope>,
    subject: MutationSubject | undefined,
    reference: ReferenceSymbols | undefined,
    by: readonly string[],
    enabled = true,
): Loadable<SymbolGroup[]> {
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
        () => (rows.data === undefined || mutation === undefined ? undefined : groupsOf(rows.data, mutation, by, from)),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `rows` was read for this mutation and scope
        [rows.data, mutation?.sequence, mutation?.position, mutation?.to, from, by.join('|')],
    );
    return merged(data, [parent, rows]);
}

function groupsOf(
    rows: readonly RhydbRow[],
    mutation: ResolvedMutation,
    by: readonly string[],
    from: string | undefined,
): SymbolGroup[] {
    const groups = new Map<string, SymbolGroup>();
    for (const row of rows) {
        const values = by.map((column) => readOptionalText(row, column));
        const key = values.map((value) => value ?? '\u0000').join('\u0001');
        const group = groups.get(key) ?? { values, covered: 0, carriers: 0 };
        const symbol = readOptionalText(row, 'symbol');
        const n = Number(row.n ?? 0);
        if (symbol !== null && !isAmbiguous(symbol, mutation.kind)) {
            group.covered += n;
            if (carries(symbol, mutation, from)) {
                group.carriers += n;
            }
        }
        groups.set(key, group);
    }
    return [...groups.values()];
}

function carries(symbol: string, mutation: ResolvedMutation, from: string | undefined): boolean {
    const upper = symbol.toUpperCase();
    if (mutation.to === undefined) {
        return from !== undefined && upper !== from.toUpperCase();
    }
    if (mutation.to === REFERENCE_SYMBOL) {
        return upper === from?.toUpperCase();
    }
    return upper === mutation.to.toUpperCase();
}

export type MutationReads = {
    resolved: Loadable<ResolvedScope[]>;
    carriers: Loadable<Carriers>;
    proportion: Loadable<ProportionRows[]>;
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
    const own: Loadable<ResolvedScope> = { ...resolved, data: resolved.data?.[0] };
    const all: Loadable<ResolvedScope> = { ...resolved, data: resolved.data?.[1] };
    const carriers = useCarriers(own, all, column, column !== undefined);
    const proportion = useProportionOverTime(resolved, [{ own: 0, all: 1 }], true);
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
