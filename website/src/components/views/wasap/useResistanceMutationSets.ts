import { useQuery } from '@tanstack/react-query';

import type { ResistanceMutationSet } from './resistanceMutations';
import type { ResistanceMutationCollectionConfig, WasapPageConfig } from './wasapPageConfig';
import { getBackendServiceForClientside } from '../../../backendApi/backendService';
import type { Collection } from '../../../types/Collection';

/**
 * Fetches resistance mutation sets from the backend collections API.
 * Each set corresponds to one collection (e.g. 3CLpro, RdRp, Spike), with the mutation list
 * derived from the filterObject variants in that collection. Results are cached indefinitely
 * for the lifetime of the page, since resistance mutation lists change infrequently.
 */
export function useResistanceMutationSets(config: WasapPageConfig) {
    return useQuery({
        queryKey: [
            'resistanceCollections',
            config.resistanceAnalysisModeEnabled ? config.resistanceMutationCollections.map((s) => s.collectionId) : [],
        ],
        queryFn: async (): Promise<ResistanceMutationSet[]> => {
            if (!config.resistanceAnalysisModeEnabled) return [];
            const backendService = getBackendServiceForClientside();
            const collections = await Promise.all(
                config.resistanceMutationCollections.map((setConfig) =>
                    backendService.getCollection({ id: String(setConfig.collectionId) }),
                ),
            );
            return config.resistanceMutationCollections.map((setConfig, i) =>
                collectionToResistanceMutationSet(setConfig, collections[i]),
            );
        },
        staleTime: Infinity,
        enabled: config.resistanceAnalysisModeEnabled === true,
    });
}

function collectionToResistanceMutationSet(
    config: ResistanceMutationCollectionConfig,
    collection: Collection,
): ResistanceMutationSet {
    const mutations = collection.variants.flatMap((variant) => {
        if (variant.type !== 'filterObject') return [];
        return (variant.filterObject.aminoAcidMutations ?? []).map((aminoAcidMutation) => ({
            name: variant.name,
            aminoAcidMutation,
        }));
    });
    return {
        name: config.name,
        annotationSymbol: config.annotationSymbol,
        description: config.description,
        mutations,
    };
}
