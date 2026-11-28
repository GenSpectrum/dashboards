import { displayNameOf, sequenceRank } from '../../domain/reference.ts';
import type { ReferenceSequences } from '../../domain/variant.ts';
import type { RhydbRow } from '../transport/row.ts';

export type Observation = { proportion: number; count: number; coverage: number };

export type Mutation = {
    key: string;
    sequenceName: string;
    display: string;
    position: number;
    from: string;
    to: string;
    label: string;
};

export function mutationOf(row: RhydbRow, sequences: ReferenceSequences): Mutation {
    const sequenceName = String(row.sequenceName);
    const display = displayNameOf(sequences, sequenceName);
    const position = Number(row.position);
    const from = String(row.mutationFrom);
    const to = String(row.mutationTo);
    return {
        key: `${sequenceName}:${position}${to}`,
        sequenceName,
        display,
        position,
        from,
        to,
        label: `${display === '' ? '' : `${display}:`}${from}${position}${to}`,
    };
}

export function observationOf(row: RhydbRow): Observation {
    return { proportion: Number(row.proportion), count: Number(row.count), coverage: Number(row.coverage) };
}

type ProfileColumn = { key: string; label: string; rows: readonly RhydbRow[] | undefined; n?: number };

export type ProfileRow = Mutation & {
    /** An undefined observation may be below the query threshold. */
    values: (Observation | undefined)[];
    difference: number;
};

/** Join profiles on mutation identity and retain each query's missing observations. */
export function profileOf(options: { columns: readonly ProfileColumn[]; sequences: ReferenceSequences }): ProfileRow[] {
    const { columns, sequences } = options;
    const mutations = new Map<string, Mutation>();
    const seen = columns.map(() => new Map<string, Observation>());
    columns.forEach((column, index) => {
        for (const row of column.rows ?? []) {
            const mutation = mutationOf(row, sequences);
            mutations.set(mutation.key, mutation);
            seen[index].set(mutation.key, observationOf(row));
        }
    });
    const rank = sequenceRank(sequences);
    const rows = [...mutations.values()].map((mutation): ProfileRow => {
        const values = seen.map((column) => column.get(mutation.key));
        const own = values[0]?.proportion ?? 0;
        const other = values.length > 1 ? (values[1]?.proportion ?? 0) : 0;
        return { ...mutation, values, difference: own - other };
    });
    return rows.sort((a, b) =>
        Math.abs(b.difference - a.difference) > 1e-9
            ? b.difference - a.difference
            : (rank.get(a.sequenceName) ?? 0) - (rank.get(b.sequenceName) ?? 0) || a.position - b.position,
    );
}

export const MUTATION_ROLE = {
    defining: 'defining',
    shared: 'shared',
    varying: 'varying',
    rare: 'rare',
} as const;
export type MutationRole = (typeof MUTATION_ROLE)[keyof typeof MUTATION_ROLE];

export function roleOf(row: ProfileRow, thresholds: { defining: number; parentMax: number }): MutationRole {
    const own = row.values[0]?.proportion ?? 0;
    const parent = row.values.length > 1 ? (row.values[1]?.proportion ?? 0) : 0;
    if (own >= thresholds.defining) {
        return parent < thresholds.parentMax ? MUTATION_ROLE.defining : MUTATION_ROLE.shared;
    }
    return own >= 0.1 ? MUTATION_ROLE.varying : MUTATION_ROLE.rare;
}
