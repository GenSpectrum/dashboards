/** Look up host groups by NCBI taxon ID, with a genus fallback for new taxa. */

import { HOST_GROUP_BY_GENUS, HOST_TAXA, HUMAN_HOST } from '../mappingData/hostTaxa.ts';

export { HUMAN_HOST };

export const HOST_GROUP = {
    human: 'human',
    animal: 'animal',
    vector: 'vector',
    unclassified: 'unclassified',
    unknown: 'unknown',
} as const;
export type HostGroup = (typeof HOST_GROUP)[keyof typeof HOST_GROUP];

export const HOST_GROUP_LABELS: Readonly<Record<HostGroup, string>> = {
    human: 'Human',
    animal: 'Animal',
    vector: 'Arthropod',
    unclassified: 'Host not classified',
    unknown: 'Host not recorded',
};

export function hostGroupOf(scientificName: string | null, taxonId: string | null): HostGroup {
    if (scientificName === null || scientificName.trim() === '') {
        return HOST_GROUP.unknown;
    }
    const taxon = taxonId === null ? undefined : HOST_TAXA[taxonId];
    if (taxon !== undefined) {
        return taxon.group;
    }
    const genus = scientificName.trim().split(/\s+/)[0];
    return HOST_GROUP_BY_GENUS[genus] ?? HOST_GROUP.unclassified;
}
