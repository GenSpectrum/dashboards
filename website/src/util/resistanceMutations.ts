import type { MutationAnnotations } from '@genspectrum/dashboard-components/util';

import type { BackendService } from '../backendApi/backendService';
import type { Collection } from '../types/Collection';
import { byEnv, type DbIdSpace } from '../types/dbIdSpace';

export type ResistanceMutationCollectionConfig = {
    collectionId: number;
    name: string;
    description: string;
    annotationSymbol: string;
};

export function buildMutationAnnotations(
    setConfigs: ResistanceMutationCollectionConfig[],
    collections: Collection[],
): MutationAnnotations {
    return setConfigs.map((setConfig, i) => {
        const filterVariants = collections[i].variants.filter((v) => v.type === 'filterObject');
        return {
            name: setConfig.name,
            symbol: setConfig.annotationSymbol,
            description: setConfig.description,
            aminoAcidMutations: filterVariants.flatMap((variant) =>
                (variant.filterObject.aminoAcidMutations ?? []).map((mutation) => ({
                    mutation,
                    name: variant.name,
                })),
            ),
        };
    });
}

export async function fetchMutationAnnotationsFromCollections(
    configs: ResistanceMutationCollectionConfig[],
    backendService: BackendService,
): Promise<MutationAnnotations> {
    const collections = await Promise.all(
        configs.map((c) => backendService.getCollection({ id: String(c.collectionId) })),
    );
    return buildMutationAnnotations(configs, collections);
}

export function buildCovidResistanceMutationCollections(env: DbIdSpace): ResistanceMutationCollectionConfig[] {
    return [
        {
            collectionId: byEnv(env, { prod: 4, staging: 1, local: 1 }),
            name: '3CLpro',
            annotationSymbol: 'c',
            description:
                'SARS-CoV-2 3C-like protease (3CLpro, or Mpro for Main protease) inhibitor resistance mutation as per <a class="link" href="https://covdb.stanford.edu/drms">Stanford Coronavirus Antiviral & Resistance database</a> (last updated on 21 August 2024).',
        },
        {
            collectionId: byEnv(env, { prod: 5, staging: 2, local: 2 }),
            name: 'RdRp',
            annotationSymbol: 'r',
            description:
                'SARS-CoV-2 RNA-dependent RNA polymerase (RdRP) inhibitor resistance mutation as per <a class="link" href="https://covdb.stanford.edu/drms">Stanford Coronavirus Antiviral & Resistance database</a> (last updated on 21 August 2024).',
        },
        {
            collectionId: byEnv(env, { prod: 6, staging: 3, local: 3 }),
            name: 'Spike',
            annotationSymbol: 's',
            description:
                'SARS-CoV-2 Spike monoclonal antibody (mAb) resistance mutation as per <a class="link" href="https://covdb.stanford.edu/drms">Stanford Coronavirus Antiviral & Resistance database</a> (last updated on 21 August 2024).',
        },
    ];
}

export function buildRsvAResistanceMutationCollections(env: DbIdSpace): ResistanceMutationCollectionConfig[] {
    return [
        {
            collectionId: byEnv(env, { prod: 4983, staging: 4, local: 4 }),
            name: 'Nirsevimab',
            annotationSymbol: 'n',
            description:
                'RSV-A F protein resistance mutations against Nirsevimab as per <a class="link" href="https://viralzone.expasy.org/11605">ViralZone</a>.',
        },
        {
            collectionId: byEnv(env, { prod: 4984, staging: 5, local: 5 }),
            name: 'Palivizumab',
            annotationSymbol: 'p',
            description:
                'RSV-A F protein resistance mutations against Palivizumab as per <a class="link" href="https://viralzone.expasy.org/11605">ViralZone</a>.',
        },
    ];
}

export function buildRsvBResistanceMutationCollections(env: DbIdSpace): ResistanceMutationCollectionConfig[] {
    return [
        {
            collectionId: byEnv(env, { prod: 4985, staging: 6, local: 6 }),
            name: 'Nirsevimab',
            annotationSymbol: 'n',
            description:
                'RSV-B F protein resistance mutations against Nirsevimab as per <a class="link" href="https://viralzone.expasy.org/11605">ViralZone</a>.',
        },
        {
            collectionId: byEnv(env, { prod: 4986, staging: 7, local: 7 }),
            name: 'Palivizumab',
            annotationSymbol: 'p',
            description:
                'RSV-B F protein resistance mutations against Palivizumab as per <a class="link" href="https://viralzone.expasy.org/11605">ViralZone</a>.',
        },
    ];
}
