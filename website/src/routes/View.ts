export namespace Organisms {
    export const covid = 'covid';
    export const h5n1 = 'flu/h5n1';
    export const mpox = 'mpox';
    export const westNile = 'west-nile';
    export const rsvA = 'rsv-a';
    export const rsvB = 'rsv-b';
}

export const organismConfig = {
    [Organisms.covid]: {
        label: 'SARS-CoV-2',
    },
    [Organisms.h5n1]: {
        label: 'H5N1',
    },
    [Organisms.mpox]: {
        label: 'MPOX',
    },
    [Organisms.westNile]: {
        label: 'West Nile',
    },
    [Organisms.rsvA]: {
        label: 'RSV-A',
    },
    [Organisms.rsvB]: {
        label: 'RSV-B',
    },
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export type Route = {
    organism: Organism;
    pathname: string;
};

export type View<R extends Route> = {
    organism: Organism;
    pathname: string;
    label: string;
    labelLong: string;
    defaultRoute: R;

    parseUrl: (url: URL) => R | undefined;
    toUrl: (route: R) => string;
};

export const defaultTablePageSize = 200;
