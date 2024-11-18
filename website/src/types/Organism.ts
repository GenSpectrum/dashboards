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
        menuListEntryDecoration: 'hover:decoration-sand',
        backgroundColor: 'bg-sandMuted',
        backgroundColorFocus: 'group-hover:bg-sand',
        borderEntryDecoration: 'hover:border-sand',
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'flu/h5n1',
        label: 'Influenza A/H5N1',
        backgroundColor: 'bg-cyanMuted',
        backgroundColorFocus: 'group-hover:bg-cyan',
        menuListEntryDecoration: 'decoration-cyan',
        borderEntryDecoration: 'hover:border-cyan',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'MPOX',
        backgroundColor: 'bg-roseMuted',
        backgroundColorFocus: 'group-hover:bg-rose',
        menuListEntryDecoration: 'hover:decoration-rose',
        borderEntryDecoration: 'hover:border-rose',
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
        borderEntryDecoration: 'hover:order-purple',
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
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);
export const organismsSchema = z.array(organismSchema);
