import { merged, useScopeFilter, type Loadable } from './analyses.ts';
import { useRows } from './rhydb.ts';
import type { Place } from '../../domain/geography.ts';
import { ALL, isPathogenNode, type Catalog, type Subject } from '../../domain/subject.ts';
import { MUTATION_KIND, mutationLabel, type MutationKind, type ReferenceSequences } from '../../domain/variant.ts';
import { mutationOf, observationOf } from '../mutations.ts';
import { mutationProfileQuery, REPORT_FLOOR } from '../queries/genomics.ts';
import type { Period } from '../queries/scope.ts';
import type { RhydbRow } from '../transport/row.ts';

const NUCLEOTIDE_FLOOR = 0.1;

export type Suggestion = { value: string; proportion: number; count: number; kind: MutationKind };

export function useMutationSuggestions(options: {
    what: Subject | undefined;
    where: Place;
    period: Period;
    sequences: ReferenceSequences | undefined;
    nucleotides: boolean;
    catalog: Catalog;
}): Loadable<Suggestion[]> {
    const { what, where, period, sequences, nucleotides, catalog } = options;
    const usable = isPathogenNode(what);
    const resolved = useScopeFilter({ what: what ?? ALL, where, period }, catalog);
    const scope = usable && sequences !== undefined ? resolved.data : undefined;
    const table = scope?.tables.length === 1 ? scope.tables[0] : undefined;

    const profile = (kind: MutationKind, minProportion: number, wanted: boolean) =>
        table === undefined || scope === undefined || !wanted
            ? undefined
            : mutationProfileQuery({ tableName: table, filter: scope.filter(table), request: { kind, minProportion } });
    const aminoAcid = useRows(profile(MUTATION_KIND.aminoAcid, REPORT_FLOOR, true), 'Mutation suggestions');
    const nucleotide = useRows(
        profile(MUTATION_KIND.nucleotide, NUCLEOTIDE_FLOOR, nucleotides),
        'Mutation suggestions',
    );

    const data =
        sequences === undefined || aminoAcid.data === undefined
            ? undefined
            : [
                  ...suggestionsOf(aminoAcid.data, sequences, MUTATION_KIND.aminoAcid),
                  ...suggestionsOf(nucleotide.data ?? [], sequences, MUTATION_KIND.nucleotide),
              ].sort((a, b) => b.proportion - a.proportion);
    return merged(data, [resolved, aminoAcid, nucleotide]);
}

function suggestionsOf(rows: readonly RhydbRow[], sequences: ReferenceSequences, kind: MutationKind): Suggestion[] {
    return rows.map((row) => {
        const { proportion, count } = observationOf(row);
        return { value: mutationLabel(mutationOf(row, sequences)), proportion: proportion, count, kind };
    });
}

export function looksNucleotide(text: string): boolean {
    const trimmed = text.trim();
    return trimmed !== '' && !trimmed.includes(':') && /^[ACGTUacgtu]?\d/.test(trimmed);
}
