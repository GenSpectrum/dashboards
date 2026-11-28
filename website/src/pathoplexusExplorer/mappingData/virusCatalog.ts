/** Pathogen groups and subtype columns used by the Explorer. */

import type { SubtypeLevel, SubtypeStep } from '../domain/subject.ts';

export type CatalogVirus = {
    table: string;
    label: string;
    levels?: readonly SubtypeLevel[];
    alternatives?: readonly SubtypeLevel[];
    /** Subtypes offered alongside pathogens in the picker. */
    menuSubtypes?: readonly SubtypeStep[];
    /** The subtype column that selects a reference genome, if there is more than one. */
    referenceColumn?: string;
    geneOrder?: readonly string[];
};

export type CatalogVirusFamily = { id: string; label: string; pathogens: readonly CatalogVirus[] };

export type CatalogVirusGroup = { id: string; label: string; members: readonly (CatalogVirusFamily | CatalogVirus)[] };

/** RSV gene order from the 3′ end. */
const PNEUMOVIRUS_GENES = ['NS1', 'NS2', 'N', 'P', 'M', 'SH', 'G', 'F', 'M2-1', 'M2-2', 'L'];

const LINEAGE: SubtypeLevel = { column: 'lineage', label: 'Lineage' };
const CLADE: SubtypeLevel = { column: 'clade', label: 'Clade' };
const OUTBREAK: SubtypeLevel = { column: 'outbreak', label: 'Outbreak' };

export const VIRUS_GROUPS: readonly CatalogVirusGroup[] = [
    {
        id: 'respiratory',
        label: 'Respiratory',
        members: [
            {
                id: 'rsv',
                label: 'RSV',
                pathogens: [
                    { table: 'rsv_a', label: 'RSV-A', levels: [LINEAGE], geneOrder: PNEUMOVIRUS_GENES },
                    { table: 'rsv_b', label: 'RSV-B', levels: [LINEAGE], geneOrder: PNEUMOVIRUS_GENES },
                ],
            },
            {
                table: 'hmpv',
                label: 'hMPV',
                levels: [LINEAGE],
                geneOrder: ['N', 'P', 'M', 'F', 'M2-1', 'M2-2', 'SH', 'G', 'L'],
            },
            {
                table: 'measles',
                label: 'Measles',
                levels: [{ column: 'genotype', label: 'Genotype' }],
                geneOrder: ['N', 'P', 'V', 'C', 'M', 'F', 'H', 'L'],
            },
        ],
    },
    {
        id: 'vector-borne',
        label: 'Vector-borne',
        members: [
            {
                table: 'dengue',
                label: 'Dengue',
                levels: [{ column: 'serotype', label: 'Serotype' }, LINEAGE],
                menuSubtypes: [
                    { column: 'serotype', value: 'DENV-1' },
                    { column: 'serotype', value: 'DENV-2' },
                    { column: 'serotype', value: 'DENV-3' },
                    { column: 'serotype', value: 'DENV-4' },
                ],
                referenceColumn: 'serotype',
            },
            {
                table: 'west_nile',
                label: 'West Nile',
                levels: [LINEAGE],
                geneOrder: ['capsid', 'prM', 'env', 'NS1', 'NS2A', 'NS2B', 'NS3', 'NS4A', '2K', 'NS4B', 'NS5'],
            },
            { table: 'chikungunya', label: 'Chikungunya', levels: [CLADE] },
            { table: 'zika', label: 'Zika', levels: [CLADE] },
            { table: 'yellow_fever', label: 'Yellow fever', levels: [CLADE] },
            {
                table: 'cchf',
                label: 'CCHF',
                levels: [{ column: 'lineage_S', label: 'S-segment lineage' }],
            },
        ],
    },
    {
        id: 'hemorrhagic-zoonotic',
        label: 'Hemorrhagic & zoonotic',
        members: [
            {
                id: 'ebola',
                label: 'Ebola',
                pathogens: [
                    { table: 'ebola_zaire', label: 'Ebola Zaire', levels: [OUTBREAK] },
                    { table: 'ebola_sudan', label: 'Ebola Sudan', levels: [OUTBREAK] },
                    { table: 'ebola_bdbv', label: 'Ebola Bundibugyo', levels: [OUTBREAK] },
                ],
            },
            { table: 'marburg', label: 'Marburg', levels: [CLADE] },
            { table: 'andv', label: 'Andes virus' },
        ],
    },
    {
        id: 'mpox',
        label: 'Mpox',
        members: [
            {
                table: 'mpox',
                label: 'Mpox',
                levels: [CLADE, LINEAGE],
                alternatives: [OUTBREAK, { column: 'outbreakLineage', label: 'Outbreak lineage' }],
            },
        ],
    },
];
