import { z } from 'zod';

export const Organisms = {
    covid: 'covid' as const,
    h5n1: 'h5n1' as const,
    mpox: 'mpox' as const,
    westNile: 'westNile' as const,
    rsvA: 'rsvA' as const,
    rsvB: 'rsvB' as const,
};

export const organismConfig = {
    [Organisms.covid]: {
        organism: Organisms.covid,
        pathFragment: 'covid',
        label: 'SARS-CoV-2',
        menuListEntryDecoration: 'hover:decoration-yellow-500',
        backgroundColor: 'bg-yellow-300',
        backgroundColorFocus: 'group-hover:bg-yellow-500',
        borderEntryDecoration: 'hover:border-yellow-500',
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'flu/h5n1',
        label: 'Influenza A/H5N1',
        backgroundColor: 'bg-sky-400',
        backgroundColorFocus: 'group-hover:bg-sky-500',
        menuListEntryDecoration: 'decoration-sky-500',
        borderEntryDecoration: 'hover:border-sky-500',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'MPOX',
        backgroundColor: 'bg-orange-400',
        backgroundColorFocus: 'group-hover:bg-orange-500',
        menuListEntryDecoration: 'hover:decoration-orange-500',
        borderEntryDecoration: 'hover:border-orange-500',
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
        backgroundColor: 'bg-green-400',
        backgroundColorFocus: 'group-hover:bg-green-500',
        menuListEntryDecoration: 'hover:decoration-green-500',
        borderEntryDecoration: 'hover:border-green-500',
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
        backgroundColor: 'bg-purple-400',
        backgroundColorFocus: 'group-hover:bg-purple-500',
        menuListEntryDecoration: 'hover:decoration-purple-500',
        borderEntryDecoration: 'hover:order-purple-500',
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
        backgroundColor: 'bg-purple-400',
        backgroundColorFocus: 'group-hover:bg-purple-500',
        menuListEntryDecoration: 'hover:decoration-purple-500',
        borderEntryDecoration: 'hover:border-purple-500',
    },
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);
export const organismsSchema = z.array(organismSchema);
