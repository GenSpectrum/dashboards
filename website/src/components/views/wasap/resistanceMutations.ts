import { type MutationAnnotations } from '@genspectrum/dashboard-components/util';

// TODO - revisit this file. Can we get rid of more in here? Move all the functions elsewhere?
// Do we still need the ResistanceMutationSet type even? Because we have a different type in
// the config now, and there's quite a bit of overlap. Would be nice to maybe make them more distinct,
// or have only one type left, or comment why we need one and the other.

export type ResistanceMutationEntry = {
    /** Mature protein display name, e.g. "3CLpro:T21I". */
    name: string;
    /** Genomic amino acid mutation used as the LAPIS query, e.g. "ORF1a:T3284I". */
    aminoAcidMutation: string;
};

export type ResistanceMutationSet = {
    name: string;
    annotationSymbol: string;
    description: string;
    mutations: ResistanceMutationEntry[];
};

/**
 * Converts a `ResistanceMutationSet` into a list of `MutationAnnotations`.
 * For every individual mutation, a mutation annotation will be generated (hence 1:n mapping).
 */
export function toMutationAnnotations(resistanceMutation: ResistanceMutationSet): MutationAnnotations {
    return resistanceMutation.mutations.map(({ name, aminoAcidMutation }) => ({
        name,
        symbol: resistanceMutation.annotationSymbol,
        description: resistanceMutation.description,
        aminoAcidMutations: [aminoAcidMutation],
    }));
}
