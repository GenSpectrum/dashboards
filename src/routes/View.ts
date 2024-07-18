export namespace Organisms {
    export const covid = 'covid';
    export const h5n1 = 'flu/h5n1';
    export const mpox = 'mpox';
    export const westNile = 'west-nile';
    export const rsvA = 'rsv-a';
    export const rsvB = 'rsv-b';
}

export const allOrganisms = [
    Organisms.covid,
    Organisms.h5n1,
    Organisms.mpox,
    Organisms.westNile,
    Organisms.rsvA,
    Organisms.rsvB,
] as const;

export type Organism = (typeof allOrganisms)[number];

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
