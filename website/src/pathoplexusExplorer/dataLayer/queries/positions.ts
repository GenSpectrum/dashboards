/**
 * What the sequences of a selection hold at the position of a mutation, from the symbol counts that
 * `symbolCountsQuery` asks for: how many have a called symbol there, and how many of those carry the mutation.
 */

import type { ProportionRows } from './genomics.ts';
import { displayNameOf } from '../../domain/reference.ts';
import {
    MUTATION_KIND,
    type MutationKind,
    type ReferenceSequences,
    type ResolvedMutation,
} from '../../domain/variant.ts';
import { AMBIGUOUS_AMINO_ACIDS, AMBIGUOUS_NUCLEOTIDES } from '../../mappingData/ambiguousSymbols.ts';
import { readOptionalText, type RhydbRow } from '../transport/row.ts';

/** In a mutation query, a dot matches the reference symbol. */
const REFERENCE_SYMBOL = '.';

export type PositionReading = {
    mutation: ResolvedMutation;
    /** The gene name without its serotype suffix. */
    display: string;
    /** Sequences with a called symbol at this position. */
    read: number;
    carriers: number;
    ambiguous: number;
    absent: number;
    reference: string | undefined;
};

type SymbolGroup = {
    values: (string | null)[];
    covered: number;
    carriers: number;
};

const AMBIGUOUS = {
    nucleotide: new Set(AMBIGUOUS_NUCLEOTIDES),
    aminoAcid: new Set(AMBIGUOUS_AMINO_ACIDS),
};

/**
 * The reading of one position over the whole selection.
 *
 * `from` is the reference symbol at the position, which the query may not name.
 */
export function positionReadingOf(
    mutation: ResolvedMutation,
    sequences: ReferenceSequences,
    rows: readonly RhydbRow[],
    from: string | undefined,
): PositionReading {
    const whole = symbolGroupsOf(rows, mutation, [], from).reduce(
        (sum, group) => ({ covered: sum.covered + group.covered, carriers: sum.carriers + group.carriers }),
        { covered: 0, carriers: 0 },
    );
    const sumWhere = (keep: (symbol: string | null) => boolean) =>
        rows.reduce((sum, row) => (keep(readOptionalText(row, 'symbol')) ? sum + Number(row.n ?? 0) : sum), 0);
    return {
        mutation,
        display: displayNameOf(sequences, mutation.sequence),
        read: whole.covered,
        carriers: whole.carriers,
        ambiguous: sumWhere((symbol) => isAmbiguous(symbol, mutation.kind)),
        absent: sumWhere((symbol) => symbol === null),
        reference: from,
    };
}

/** The reading of one position per combination of the `by` columns, in the order that the rows first name them. */
function symbolGroupsOf(
    rows: readonly RhydbRow[],
    mutation: ResolvedMutation,
    by: readonly string[],
    from: string | undefined,
): SymbolGroup[] {
    const groups = new Map<string, SymbolGroup>();
    for (const row of rows) {
        const values = by.map((column) => readOptionalText(row, column));
        const key = JSON.stringify(values);
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

/** Keep the grouping columns alongside both counts, as in the other proportion queries. */
export function coverageRowsOf(
    rows: readonly RhydbRow[],
    mutation: ResolvedMutation,
    by: readonly string[],
    from: string | undefined,
): ProportionRows {
    const own: RhydbRow[] = [];
    const all: RhydbRow[] = [];
    for (const group of symbolGroupsOf(rows, mutation, by, from)) {
        const columns = Object.fromEntries(by.map((column, index) => [column, group.values[index]]));
        own.push({ ...columns, n: group.carriers });
        all.push({ ...columns, n: group.covered });
    }
    return { own, all };
}

function isAmbiguous(symbol: string | null, kind: MutationKind): boolean {
    if (symbol === null) {
        return false;
    }
    const upper = symbol.toUpperCase();
    return kind === MUTATION_KIND.nucleotide ? AMBIGUOUS.nucleotide.has(upper) : AMBIGUOUS.aminoAcid.has(upper);
}

/** A bare position is carried by any symbol other than the reference, `.` by the reference itself. */
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
