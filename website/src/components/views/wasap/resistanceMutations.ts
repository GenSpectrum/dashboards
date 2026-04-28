import { type MutationAnnotations } from '@genspectrum/dashboard-components/util';

// TODO - revisit this file. Can we get rid of more in here? Move all the functions elsewhere?
// Do we still need the ResistanceMutationSet type even? Because we have a different type in
// the config now, and there's quite a bit of overlap. Would be nice to maybe make them more distinct,
// or have only one type left, or comment why we need one and the other.

export type ResistanceMutationSet = {
    name: string;
    annotationSymbol: string;
    description: string;
    mutations: string[];
    offset: number;
};

/**
 * Maps a code like ORF1a:T1234:A to RdPd:T56A, by replacing the gene with the mature name
 * and adjusting the position with the given offset.
 */
function matureName(code: string, matureName: string, offset: number): string {
    const [_, mutationPart] = code.split(':');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const position = parseInt(/\d+/.exec(mutationPart)![0], 10);
    const originalBase = mutationPart[0];
    const newBase = mutationPart[mutationPart.length - 1];
    return `${matureName}:${originalBase}${position + offset}${newBase} `;
}

/**
 * Converts a `ResistanceMutationSet` into a list of `MutationAnnotations`.
 * For every individual mutation, a mutation annotation will be generated (hence 1:n mapping).
 */
export function toMutationAnnotations(resistanceMutation: ResistanceMutationSet): MutationAnnotations {
    return resistanceMutation.mutations.map((mutation) => ({
        name: matureName(mutation, resistanceMutation.name, resistanceMutation.offset),
        symbol: resistanceMutation.annotationSymbol,
        description: resistanceMutation.description,
        aminoAcidMutations: [mutation],
    }));
}
