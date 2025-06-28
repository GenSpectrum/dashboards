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
    denv1: 'denv1' as const,
    denv2: 'denv2' as const,
    denv3: 'denv3' as const,
    denv4: 'denv4' as const,
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
                gff3Source: '/gff3Files/sars-cov-2.gff3',
                genomeLength: 29903,
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
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'h5n1',
        label: 'H5N1',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [
            {
                gff3Source: '/gff3Files/h5n1/seg1.gff3',
                genomeLength: 2341,
                name: 'PB2 (seg1)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg2.gff3',
                genomeLength: 2341,
                name: 'PB1 (seg2)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg3.gff3',
                genomeLength: 2233,
                name: 'PA (seg3)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg4.gff3',
                genomeLength: 1760,
                name: 'HA (seg4)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg5.gff3',
                genomeLength: 1565,
                name: 'NP (seg5)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg6.gff3',
                genomeLength: 1458,
                name: 'NA (seg6)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg7.gff3',
                genomeLength: 1027,
                name: 'MP (seg7)',
            },
            {
                gff3Source: '/gff3Files/h5n1/seg8.gff3',
                genomeLength: 865,
                name: 'NS (seg8)',
            },
        ],
    },
    [Organisms.h1n1pdm]: {
        organism: Organisms.h1n1pdm,
        pathFragment: 'h1n1pdm',
        label: 'H1N1pdm',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [
            {
                gff3Source: '/gff3Files/h1n1pdm/seg1.gff3',
                genomeLength: 2280,
                name: 'PB2 (seg1)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg2.gff3',
                genomeLength: 2274,
                name: 'PB1 (seg2)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg3.gff3',
                genomeLength: 2151,
                name: 'PA (seg3)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg4.gff3',
                genomeLength: 1752,
                name: 'HA (seg4)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg5.gff3',
                genomeLength: 1497,
                name: 'NP (seg5)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg6.gff3',
                genomeLength: 1433,
                name: 'NA (seg6)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg7.gff3',
                genomeLength: 982,
                name: 'MP (seg7)',
            },
            {
                gff3Source: '/gff3Files/h1n1pdm/seg8.gff3',
                genomeLength: 863,
                name: 'NS (seg8)',
            },
        ],
    },
    [Organisms.h3n2]: {
        organism: Organisms.h3n2,
        pathFragment: 'h3n2',
        label: 'H3N2',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
        genome: [
            {
                gff3Source: '/gff3Files/h3n2/seg1.gff3',
                genomeLength: 2341,
                name: 'PB2 (seg1)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg2.gff3',
                genomeLength: 2341,
                name: 'PB1 (seg2)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg3.gff3',
                genomeLength: 2233,
                name: 'PA (seg3)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg4.gff3',
                genomeLength: 1737,
                name: 'HA (seg4)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg5.gff3',
                genomeLength: 1566,
                name: 'NP (seg5)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg6.gff3',
                genomeLength: 1436,
                name: 'NA (seg6)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg7.gff3',
                genomeLength: 1027,
                name: 'MP (seg7)',
            },
            {
                gff3Source: '/gff3Files/h3n2/seg8.gff3',
                genomeLength: 890,
                name: 'NS (seg8)',
            },
        ],
    },
    [Organisms.influenzaB]: {
        organism: Organisms.influenzaB,
        pathFragment: 'influenza-b',
        label: 'Influenza B',
        backgroundColor: 'bg-indigoMuted',
        backgroundColorFocus: 'group-hover:bg-indigo',
        menuListEntryDecoration: 'decoration-indigo',
        borderEntryDecoration: 'hover:border-indigo',
    },
    [Organisms.victoria]: {
        organism: Organisms.victoria,
        pathFragment: 'victoria',
        label: 'Victoria',
        backgroundColor: 'bg-indigoMuted',
        backgroundColorFocus: 'group-hover:bg-indigo',
        menuListEntryDecoration: 'decoration-indigo',
        borderEntryDecoration: 'hover:border-indigo',
        genome: [
            {
                gff3Source: '/gff3Files/victoria/seg1.gff3',
                genomeLength: 2358,
                name: 'PB2 (seg1)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg2.gff3',
                genomeLength: 2334,
                name: 'PB1 (seg2)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg3.gff3',
                genomeLength: 2245,
                name: 'PA (seg3)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg4.gff3',
                genomeLength: 1885,
                name: 'HA (seg4)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg5.gff3',
                genomeLength: 1750,
                name: 'NP (seg5)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg6.gff3',
                genomeLength: 1401,
                name: 'NA (seg6)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg7.gff3',
                genomeLength: 1147,
                name: 'MP (seg7)',
            },
            {
                gff3Source: '/gff3Files/victoria/seg8.gff3',
                genomeLength: 1066,
                name: 'NS (seg8)',
            },
        ],
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
                gff3Source: '/gff3Files/west-nile.gff3',
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
                gff3Source: '/gff3Files/rsv-a.gff3',
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
                gff3Source: '/gff3Files/rsv-b.gff3',
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
                gff3Source: '/gff3Files/mpox.gff3',
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
                gff3Source: '/gff3Files/ebola-sudan.gff3',
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
                gff3Source: '/gff3Files/ebola-zaire.gff3',
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
                gff3Source: '/gff3Files/cchf/L.gff3',
                genomeLength: 12108,
                name: 'L',
            },
            {
                gff3Source: '/gff3Files/cchf/M.gff3',
                genomeLength: 5366,
                name: 'M',
            },
            {
                gff3Source: '/gff3Files/cchf/S.gff3',
                genomeLength: 1672,
                name: 'S',
            },
        ],
    },
    [Organisms.denv1]: {
        organism: Organisms.denv1,
        pathFragment: 'denv1',
        label: 'Dengue 1',
        backgroundColor: 'bg-limeMuted',
        backgroundColorFocus: 'group-hover:bg-lime',
        menuListEntryDecoration: 'hover:decoration-lime',
        borderEntryDecoration: 'hover:border-lime',
        genome: [
            {
                gff3Source: '/gff3Files/denv1.gff3',
                genomeLength: 10735,
            },
        ],
    },
    [Organisms.denv2]: {
        organism: Organisms.denv2,
        pathFragment: 'denv2',
        label: 'Dengue 2',
        backgroundColor: 'bg-limeMuted',
        backgroundColorFocus: 'group-hover:bg-lime',
        menuListEntryDecoration: 'hover:decoration-lime',
        borderEntryDecoration: 'hover:border-lime',
        genome: [
            {
                gff3Source: '/gff3Files/denv2.gff3',
                genomeLength: 10723,
            },
        ],
    },
    [Organisms.denv3]: {
        organism: Organisms.denv3,
        pathFragment: 'denv3',
        label: 'Dengue 3',
        backgroundColor: 'bg-limeMuted',
        backgroundColorFocus: 'group-hover:bg-lime',
        menuListEntryDecoration: 'hover:decoration-lime',
        borderEntryDecoration: 'hover:border-lime',
        genome: [
            {
                gff3Source: '/gff3Files/denv3.gff3',
                genomeLength: 10707,
            },
        ],
    },
    [Organisms.denv4]: {
        organism: Organisms.denv4,
        pathFragment: 'denv4',
        label: 'Dengue 4',
        backgroundColor: 'bg-limeMuted',
        backgroundColorFocus: 'group-hover:bg-lime',
        menuListEntryDecoration: 'hover:decoration-lime',
        borderEntryDecoration: 'hover:border-lime',
        genome: [
            {
                gff3Source: '/gff3Files/denv4.gff3',
                genomeLength: 10649,
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
    [Organisms.denv1]: getDefaultPathConfig(Organisms.denv1),
    [Organisms.denv2]: getDefaultPathConfig(Organisms.denv2),
    [Organisms.denv3]: getDefaultPathConfig(Organisms.denv3),
    [Organisms.denv4]: getDefaultPathConfig(Organisms.denv4),
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
