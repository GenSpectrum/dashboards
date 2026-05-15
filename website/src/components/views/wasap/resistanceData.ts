import type { MutationAnnotations } from '@genspectrum/dashboard-components/util';

import type { ResistanceMutationCollectionConfig, WasapPageConfig } from './wasapPageConfig';
import type { BackendService } from '../../../backendApi/backendService';
import type { Collection } from '../../../types/Collection';

export type ResistanceData = {
    /** Flat list of mutation annotations for the genome viewer. */
    mutationAnnotations: MutationAnnotations;
    /** Map from set name (e.g. "3CLpro") to the genomic amino acid mutations to display. */
    displayMutationsBySet: Record<string, string[]>;
};

export async function fetchResistanceData(
    config: WasapPageConfig,
    backendService: BackendService,
): Promise<ResistanceData> {
    if (!config.resistanceAnalysisModeEnabled) {
        return { mutationAnnotations: [], displayMutationsBySet: {} };
    }
    const collections = await Promise.all(
        config.resistanceMutationCollections.map((setConfig) =>
            backendService.getCollection({ id: String(setConfig.collectionId) }),
        ),
    );
    return buildResistanceData(config.resistanceMutationCollections, collections);
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
