import { z } from 'zod';

import { wastewaterBreadcrumb, wastewaterPathFragment } from './wastewaterConfig.ts';

export const Organisms = {
    covid: 'covid' as const,
    influenzaA: 'influenzaA' as const,
    h5n1: 'h5n1' as const,
    h1n1pdm: 'h1n1pdm' as const,
    h3n2: 'h3n2' as const,
    influenzaB: 'influenzaB' as const,
    victoria: 'victoria' as const,
    westNile: 'westNile' as const,
    rsvA: 'rsvA' as const,
    rsvB: 'rsvB' as const,
    mpox: 'mpox' as const,
    ebolaSudan: 'ebolaSudan' as const,
    ebolaZaire: 'ebolaZaire' as const,
    cchf: 'cchf' as const,
};

export const organismConfig = {
    [Organisms.covid]: {
        organism: Organisms.covid,
        pathFragment: 'covid',
        label: 'SARS-CoV-2',
        menuListEntryDecoration: 'hover:decoration-sand',
        backgroundColor: 'bg-sandMuted',
        backgroundColorFocus: 'group-hover:bg-sand',
        borderEntryDecoration: 'hover:border-sand',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/master/data/nextstrain/sars-cov-2/BA.2/genome_annotation.gff3',
                genomeLength: 29903, // check this
            },
        ],
    },
    [Organisms.influenzaA]: {
        organism: Organisms.influenzaA,
        pathFragment: 'influenza-a',
        label: 'Influenza A',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [],
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'h5n1',
        label: 'H5N1',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [],
    },
    [Organisms.h1n1pdm]: {
        organism: Organisms.h1n1pdm,
        pathFragment: 'h1n1pdm',
        label: 'H1N1pdm',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [],
    },
    [Organisms.h3n2]: {
        organism: Organisms.h3n2,
        pathFragment: 'h3n2',
        label: 'H3N2',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [],
    },
    [Organisms.influenzaB]: {
        organism: Organisms.influenzaB,
        pathFragment: 'influenza-b',
        label: 'Influenza B',
        backgroundColor: 'bg-indigoMuted',
        backgroundColorFocus: 'group-hover:bg-indigo',
        menuListEntryDecoration: 'decoration-indigo',
        borderEntryDecoration: 'hover:border-indigo',
        genome: [],
    },
    [Organisms.victoria]: {
        organism: Organisms.victoria,
        pathFragment: 'victoria',
        label: 'Victoria',
        backgroundColor: 'bg-indigoMuted',
        backgroundColorFocus: 'group-hover:bg-indigo',
        menuListEntryDecoration: 'decoration-indigo',
        borderEntryDecoration: 'hover:border-indigo',
        genome: [],
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
        backgroundColor: 'bg-greenMuted',
        backgroundColorFocus: 'group-hover:bg-green',
        menuListEntryDecoration: 'hover:decoration-green',
        borderEntryDecoration: 'hover:border-green',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/8f2e791d3a59013ee88e1d1d7e83b486d39c4ecb/data/nextstrain/wnv/all-lineages/genome_annotation.gff3',
                genomeLength: 11029,
            },
        ],
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
        backgroundColor: 'bg-purpleMuted',
        backgroundColorFocus: 'group-hover:bg-purple',
        menuListEntryDecoration: 'hover:decoration-purple',
        borderEntryDecoration: 'hover:border-purple',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/master/data/nextstrain/rsv/a/EPI_ISL_412866/genome_annotation.gff3',
                genomeLength: 15225,
            },
        ],
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
        backgroundColor: 'bg-purpleMuted',
        backgroundColorFocus: 'group-hover:bg-purple',
        menuListEntryDecoration: 'hover:decoration-purple',
        borderEntryDecoration: 'hover:border-purple',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/master/data/nextstrain/rsv/b/EPI_ISL_1653999/genome_annotation.gff3',
                genomeLength: 15222,
            },
        ],
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'Mpox',
        backgroundColor: 'bg-roseMuted',
        backgroundColorFocus: 'group-hover:bg-rose',
        menuListEntryDecoration: 'hover:decoration-rose',
        borderEntryDecoration: 'hover:border-rose',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/master/data/nextstrain/mpox/all-clades/genome_annotation.gff3',
                genomeLength: 197209,
            },
        ],
    },
    [Organisms.ebolaSudan]: {
        organism: Organisms.ebolaSudan,
        pathFragment: 'ebola-sudan',
        label: 'Ebola Sudan',
        backgroundColor: 'bg-wineMuted',
        backgroundColorFocus: 'group-hover:bg-wine',
        menuListEntryDecoration: 'hover:decoration-wine',
        borderEntryDecoration: 'hover:border-wine',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/ebola/data/nextstrain/ebola/sudan/genome_annotation.gff3',
                genomeLength: 18875,
            },
        ],
    },
    [Organisms.ebolaZaire]: {
        organism: Organisms.ebolaZaire,
        pathFragment: 'ebola-zaire',
        label: 'Ebola Zaire',
        backgroundColor: 'bg-wineMuted',
        backgroundColorFocus: 'group-hover:bg-wine',
        menuListEntryDecoration: 'hover:decoration-wine',
        borderEntryDecoration: 'hover:border-wine',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/ebola/data/nextstrain/ebola/zaire/genome_annotation.gff3',
                genomeLength: 18959,
            },
        ],
    },
    [Organisms.cchf]: {
        organism: Organisms.cchf,
        pathFragment: 'cchf',
        label: 'Crimean-Congo Hemorrhagic Fever',
        backgroundColor: 'bg-oliveMuted',
        backgroundColorFocus: 'group-hover:bg-olive',
        menuListEntryDecoration: 'hover:decoration-olive',
        borderEntryDecoration: 'hover:border-olive',
        genome: [
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/cornelius-cchfv/data/nextstrain/cchfv/linked/L/genome_annotation.gff3',
                genomeLength: 12108,
            },
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/cornelius-cchfv/data/nextstrain/cchfv/linked/M/genome_annotation.gff3',
                genomeLength: 5366,
            },
            {
                gff3Source:
                    'https://raw.githubusercontent.com/nextstrain/nextclade_data/refs/heads/cornelius-cchfv/data/nextstrain/cchfv/linked/S/genome_annotation.gff3',
                genomeLength: 1672,
            },
        ],
    },
};

export const paths = {
    [Organisms.covid]: getDefaultPathConfig(Organisms.covid),
    [Organisms.influenzaA]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
        breadcrumbs: [getBreadcrumbItem(Organisms.influenzaA)],
    },
    [Organisms.h5n1]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h5n1].pathFragment}`,
        breadcrumbs: [
            getBreadcrumbItem(Organisms.influenzaA),
            {
                name: organismConfig[Organisms.h5n1].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h5n1].pathFragment}`,
            },
        ],
    },
    [Organisms.h1n1pdm]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h1n1pdm].pathFragment}`,
        breadcrumbs: [
            getBreadcrumbItem(Organisms.influenzaA),
            {
                name: organismConfig[Organisms.h1n1pdm].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h1n1pdm].pathFragment}`,
            },
        ],
    },
    [Organisms.h3n2]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h3n2].pathFragment}`,
        breadcrumbs: [
            getBreadcrumbItem(Organisms.influenzaA),
            {
                name: organismConfig[Organisms.h3n2].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h3n2].pathFragment}`,
            },
        ],
    },
    [Organisms.influenzaB]: {
        basePath: `/${organismConfig[Organisms.influenzaB].pathFragment}`,
        breadcrumbs: [getBreadcrumbItem(Organisms.influenzaB)],
    },
    [Organisms.victoria]: {
        basePath: `/${organismConfig[Organisms.influenzaB].pathFragment}/${organismConfig[Organisms.victoria].pathFragment}`,
        breadcrumbs: [
            getBreadcrumbItem(Organisms.influenzaB),
            {
                name: organismConfig[Organisms.victoria].label,
                href: `/${organismConfig[Organisms.influenzaB].pathFragment}/${organismConfig[Organisms.victoria].pathFragment}`,
            },
        ],
    },
    [Organisms.westNile]: getDefaultPathConfig(Organisms.westNile),
    [Organisms.rsvA]: getDefaultPathConfig(Organisms.rsvA),
    [Organisms.rsvB]: getDefaultPathConfig(Organisms.rsvB),
    [Organisms.mpox]: getDefaultPathConfig(Organisms.mpox),
    [Organisms.ebolaSudan]: getDefaultPathConfig(Organisms.ebolaSudan),
    [Organisms.ebolaZaire]: getDefaultPathConfig(Organisms.ebolaZaire),
    [Organisms.cchf]: getDefaultPathConfig(Organisms.cchf),
    swissWastewater: {
        basePath: `/${wastewaterPathFragment}`,
        breadcrumbs: [wastewaterBreadcrumb],
    },
};

export const allOrganisms = Object.keys(organismConfig) as Organism[];

export type Organism = keyof typeof organismConfig;
export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);

export const organismsSchema = z.array(organismSchema);

function getDefaultPathConfig(organism: Organism) {
    return {
        basePath: `/${organismConfig[organism].pathFragment}`,
        breadcrumbs: [getBreadcrumbItem(organism)],
    };
}

function getBreadcrumbItem(organism: Organism) {
    return {
        name: organismConfig[organism].label,
        href: `/${organismConfig[organism].pathFragment}`,
    };
}
