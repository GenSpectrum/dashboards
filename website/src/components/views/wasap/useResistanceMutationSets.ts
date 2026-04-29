import type { MutationAnnotations } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';

import type { ResistanceMutationCollectionConfig, WasapPageConfig } from './wasapPageConfig';
import { getBackendServiceForClientside } from '../../../backendApi/backendService';
import type { Collection } from '../../../types/Collection';

export type ResistanceData = {
    /** Flat list of mutation annotations for the genome viewer. */
    mutationAnnotations: MutationAnnotations;
    /** Map from set name (e.g. "3CLpro") to the genomic amino acid mutations to display. */
    displayMutationsBySet: Record<string, string[]>;
};

/**
 * Fetches resistance mutation data from the backend collections API.
 * Each configured collection (e.g. 3CLpro, RdRp, Spike) is fetched in parallel and mapped into:
 * - mutationAnnotations: ready to pass to <gs-app> for genome view annotations
 * - displayMutationsBySet: keyed by set name, for use in the resistance analysis mode
 */
export function useResistanceMutationSets(config: WasapPageConfig) {
    return useQuery({
        queryKey: [
            'resistanceCollections',
            config.resistanceAnalysisModeEnabled ? config.resistanceMutationCollections.map((s) => s.collectionId) : [],
        ],
        queryFn: async (): Promise<ResistanceData> => {
            if (!config.resistanceAnalysisModeEnabled) {
                return { mutationAnnotations: [], displayMutationsBySet: {} };
            }
            const backendService = getBackendServiceForClientside();
            const collections = await Promise.all(
                config.resistanceMutationCollections.map((setConfig) =>
                    backendService.getCollection({ id: String(setConfig.collectionId) }),
                ),
            );
            return buildResistanceData(config.resistanceMutationCollections, collections);
        },
        // TODO - infinity is probably excessive, around 1h is maybe fine?
        staleTime: Infinity,
        enabled: config.resistanceAnalysisModeEnabled === true,
    });
}

function buildResistanceData(
    setConfigs: ResistanceMutationCollectionConfig[],
    collections: Collection[],
): ResistanceData {
    const mutationAnnotations: MutationAnnotations = [];
    const displayMutationsBySet: Record<string, string[]> = {};

    setConfigs.forEach((setConfig, i) => {
        const entries = collections[i].variants.flatMap((variant) => {
            if (variant.type !== 'filterObject') return [];
            return (variant.filterObject.aminoAcidMutations ?? []).map((aminoAcidMutation) => ({
                displayName: variant.name,
                aminoAcidMutation,
            }));
        });

        displayMutationsBySet[setConfig.name] = entries.map((e) => e.aminoAcidMutation);

        mutationAnnotations.push(
            ...entries.map(({ displayName, aminoAcidMutation }) => ({
                name: displayName,
                symbol: setConfig.annotationSymbol,
                description: setConfig.description,
                aminoAcidMutations: [aminoAcidMutation],
            })),
        );
    });

    return { mutationAnnotations, displayMutationsBySet };
}
