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

export function buildResistanceData(
    setConfigs: ResistanceMutationCollectionConfig[],
    collections: Collection[],
): ResistanceData {
    const mutationAnnotations: MutationAnnotations = [];
    const displayMutationsBySet: Record<string, string[]> = {};

    setConfigs.forEach((setConfig, i) => {
        const filterVariants = collections[i].variants.filter((v) => v.type === 'filterObject');
        const allMutations = filterVariants.flatMap((v) => v.filterObject.aminoAcidMutations ?? []);

        displayMutationsBySet[setConfig.name] = allMutations;

        if (setConfig.annotationMode === 'per-variant') {
            filterVariants.forEach((variant) => {
                (variant.filterObject.aminoAcidMutations ?? []).forEach((aminoAcidMutation) => {
                    mutationAnnotations.push({
                        name: variant.name,
                        symbol: setConfig.annotationSymbol,
                        description: setConfig.description,
                        aminoAcidMutations: [aminoAcidMutation],
                    });
                });
            });
        } else {
            mutationAnnotations.push({
                name: setConfig.name,
                symbol: setConfig.annotationSymbol,
                description: setConfig.description,
                aminoAcidMutations: allMutations,
            });
        }
    });

    return { mutationAnnotations, displayMutationsBySet };
}
