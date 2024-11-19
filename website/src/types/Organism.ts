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
        menuListEntryDecoration: 'hover:decoration-amber-300',
        backgroundColor: 'bg-amber-200',
        backgroundColorFocus: 'group-hover:bg-amber-300',
        borderEntryDecoration: 'hover:border-amber-300',
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'flu/h5n1',
        label: 'Influenza A/H5N1',
        backgroundColor: 'bg-emerald-200',
        backgroundColorFocus: 'group-hover:bg-emerald-300',
        menuListEntryDecoration: 'decoration-emerald-300',
        borderEntryDecoration: 'hover:border-emerald-300',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'MPOX',
        backgroundColor: 'bg-pink-200',
        backgroundColorFocus: 'group-hover:bg-pink-300',
        menuListEntryDecoration: 'hover:decoration-pink-300',
        borderEntryDecoration: 'hover:border-pink-300',
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
        backgroundColor: 'bg-lime-200',
        backgroundColorFocus: 'group-hover:bg-lime-300',
        menuListEntryDecoration: 'hover:decoration-lime-300',
        borderEntryDecoration: 'hover:border-lime-300',
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
        backgroundColor: 'bg-purple-200',
        backgroundColorFocus: 'group-hover:bg-purple-300',
        menuListEntryDecoration: 'hover:decoration-purple-300',
        borderEntryDecoration: 'hover:order-purple-300',
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
        backgroundColor: 'bg-purple-200',
        backgroundColorFocus: 'group-hover:bg-purple-300',
        menuListEntryDecoration: 'hover:decoration-purple-300',
        borderEntryDecoration: 'hover:border-purple-300',
    },
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);
export const organismsSchema = z.array(organismSchema);
