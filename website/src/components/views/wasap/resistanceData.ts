import type { MutationAnnotations } from '@genspectrum/dashboard-components/util';

import type { ResistanceMutationCollectionConfig, WasapPageConfig } from './wasapPageConfig';
import type { BackendService } from '../../../backendApi/backendService';
import type { Collection } from '../../../types/Collection';

/**
 * Data about resistance mutations, used by the wastewater dashboards.
 * It contains mutation annotations which annotate relevant mutations as affecting vaccine resistance,
 * as well as simply containing the mutations in a map to display them in the resistance mutation explorer.
 */
export type ResistanceData = {
    /** Flat list of mutation annotations for the genome viewer. */
    mutationAnnotations: MutationAnnotations;
    /** Map from set name (e.g. "3CLpro") to the genomic amino acid mutations to display. */
    displayMutationsBySet: Record<string, string[]>;
};

/**
 * Given a wastewater dashboard config and backend service, fetch resistance mutation data.
 * This is done by fetching relevant collections, and transforming the data into the shape we want here.
 */
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

/**
 * Takes a config and already fetched collection.
 * They need to be in the correct order; collection i belongs to config i.
 */
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

        mutationAnnotations.push({
            name: setConfig.name,
            symbol: setConfig.annotationSymbol,
            description: setConfig.description,
            aminoAcidMutations: filterVariants.flatMap((variant) =>
                (variant.filterObject.aminoAcidMutations ?? []).map((mutation) => ({
                    mutation,
                    name: variant.name,
                })),
            ),
        });
    });

    return { mutationAnnotations, displayMutationsBySet };
}
