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
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'flu/h5n1',
        label: 'Influenza A/H5N1',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'Mpox',
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
    },
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export const organismSchema = z.enum(Object.keys(organismConfig) as [keyof typeof organismConfig]);
export const organismsSchema = z.array(organismSchema);
