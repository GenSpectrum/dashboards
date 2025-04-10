import { z } from 'zod';

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
    },
    [Organisms.h1n1pdm]: {
        organism: Organisms.h1n1pdm,
        pathFragment: 'h1n1pdm',
        label: 'H1N1pdm',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
    },
    [Organisms.h3n2]: {
        organism: Organisms.h3n2,
        pathFragment: 'h3n2',
        label: 'H3N2',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
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
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
        backgroundColor: 'bg-greenMuted',
        backgroundColorFocus: 'group-hover:bg-green',
        menuListEntryDecoration: 'hover:decoration-green',
        borderEntryDecoration: 'hover:border-green',
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
        backgroundColor: 'bg-purpleMuted',
        backgroundColorFocus: 'group-hover:bg-purple',
        menuListEntryDecoration: 'hover:decoration-purple',
        borderEntryDecoration: 'hover:border-purple',
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
        backgroundColor: 'bg-purpleMuted',
        backgroundColorFocus: 'group-hover:bg-purple',
        menuListEntryDecoration: 'hover:decoration-purple',
        borderEntryDecoration: 'hover:border-purple',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'Mpox',
        backgroundColor: 'bg-roseMuted',
        backgroundColorFocus: 'group-hover:bg-rose',
        menuListEntryDecoration: 'hover:decoration-rose',
        borderEntryDecoration: 'hover:border-rose',
    },
    [Organisms.ebolaSudan]: {
        organism: Organisms.ebolaSudan,
        pathFragment: 'ebola-sudan',
        label: 'Ebola Sudan',
        backgroundColor: 'bg-wineMuted',
        backgroundColorFocus: 'group-hover:bg-wine',
        menuListEntryDecoration: 'hover:decoration-wine',
        borderEntryDecoration: 'hover:border-wine',
    },
    [Organisms.ebolaZaire]: {
        organism: Organisms.ebolaZaire,
        pathFragment: 'ebola-zaire',
        label: 'Ebola Zaire',
        backgroundColor: 'bg-wineMuted',
        backgroundColorFocus: 'group-hover:bg-wine',
        menuListEntryDecoration: 'hover:decoration-wine',
        borderEntryDecoration: 'hover:border-wine',
    },
    [Organisms.cchf]: {
        organism: Organisms.cchf,
        pathFragment: 'cchf',
        label: 'Crimean-Congo Hemorrhagic Fever',
        backgroundColor: 'bg-oliveMuted',
        backgroundColorFocus: 'group-hover:bg-olive',
        menuListEntryDecoration: 'hover:decoration-olive',
        borderEntryDecoration: 'hover:border-olive',
    },
};

export const paths = {
    [Organisms.h5n1]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h5n1].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaA].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
            },
            {
                name: organismConfig[Organisms.h5n1].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h5n1].pathFragment}`,
            },
        ],
    },
    [Organisms.covid]: {
        basePath: `/${organismConfig[Organisms.covid].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.covid].label,
                href: `/${organismConfig[Organisms.covid].pathFragment}`,
            },
        ],
    },
    [Organisms.influenzaA]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaA].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
            },
        ],
    },
    [Organisms.h1n1pdm]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h1n1pdm].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaA].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
            },
            {
                name: organismConfig[Organisms.h1n1pdm].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h1n1pdm].pathFragment}`,
            },
        ],
    },
    [Organisms.h3n2]: {
        basePath: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h3n2].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaA].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}`,
            },
            {
                name: organismConfig[Organisms.h3n2].label,
                href: `/${organismConfig[Organisms.influenzaA].pathFragment}/${organismConfig[Organisms.h3n2].pathFragment}`,
            },
        ],
    },
    [Organisms.influenzaB]: {
        basePath: `/${organismConfig[Organisms.influenzaB].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaB].label,
                href: `/${organismConfig[Organisms.influenzaB].pathFragment}`,
            },
        ],
    },
    [Organisms.victoria]: {
        basePath: `/${organismConfig[Organisms.influenzaB].pathFragment}/${organismConfig[Organisms.victoria].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.influenzaB].label,
                href: `/${organismConfig[Organisms.influenzaB].pathFragment}`,
            },
            {
                name: organismConfig[Organisms.victoria].label,
                href: `/${organismConfig[Organisms.influenzaB].pathFragment}/${organismConfig[Organisms.victoria].pathFragment}`,
            },
        ],
    },
    [Organisms.westNile]: {
        basePath: `/${organismConfig[Organisms.westNile].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.westNile].label,
                href: `/${organismConfig[Organisms.westNile].pathFragment}`,
            },
        ],
    },
    [Organisms.rsvA]: {
        basePath: `/${organismConfig[Organisms.rsvA].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.rsvA].label,
                href: `/${organismConfig[Organisms.rsvA].pathFragment}`,
            },
        ],
    },
    [Organisms.rsvB]: {
        basePath: `/${organismConfig[Organisms.rsvB].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.rsvB].label,
                href: `/${organismConfig[Organisms.rsvB].pathFragment}`,
            },
        ],
    },
    [Organisms.mpox]: {
        basePath: `/${organismConfig[Organisms.mpox].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.mpox].label,
                href: `/${organismConfig[Organisms.mpox].pathFragment}`,
            },
        ],
    },
    [Organisms.ebolaSudan]: {
        basePath: `/${organismConfig[Organisms.ebolaSudan].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.ebolaSudan].label,
                href: `/${organismConfig[Organisms.ebolaSudan].pathFragment}`,
            },
        ],
    },
    [Organisms.ebolaZaire]: {
        basePath: `/${organismConfig[Organisms.ebolaZaire].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.ebolaZaire].label,
                href: `/${organismConfig[Organisms.ebolaZaire].pathFragment}`,
            },
        ],
    },
    [Organisms.cchf]: {
        basePath: `/${organismConfig[Organisms.cchf].pathFragment}`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.cchf].label,
                href: `/${organismConfig[Organisms.cchf].pathFragment}`,
            },
        ],
    },
    swissWastewater: {
        basePath: `/swiss-wastewater`,
        breadcrumbs: [
            {
                name: organismConfig[Organisms.cchf].label,
                href: `/swiss-wastewater`,
            },
        ],
    },
};

export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);
export const organismsSchema = z.array(organismSchema);
