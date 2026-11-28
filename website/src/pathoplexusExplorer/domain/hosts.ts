/** Look up host groups by NCBI taxon ID, with a genus fallback for new taxa. */

import hostTaxa from '../mappingData/hostTaxa.json' with { type: 'json' };

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

const byGenus = new Map<string, HostGroup>();
const byTaxon = new Map<string, HostGroup>();
for (const group of [HOST_GROUP.human, HOST_GROUP.vector, HOST_GROUP.animal]) {
    for (const [genus, taxa] of Object.entries(hostTaxa[group])) {
        byGenus.set(genus, group);
        for (const taxon of taxa) {
            byTaxon.set(String(taxon), group);
        }
    }
}

export function hostGroupOf(scientificName: string | null, taxonId: string | null): HostGroup {
    if (scientificName === null || scientificName.trim() === '') {
        return HOST_GROUP.unknown;
    }
    const taxon = taxonId === null ? undefined : byTaxon.get(taxonId);
    if (taxon !== undefined) {
        return taxon;
    }
    const genus = scientificName.trim().split(/\s+/)[0];
    return byGenus.get(genus) ?? HOST_GROUP.unclassified;
}
