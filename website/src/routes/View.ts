export namespace Organisms {
    export const covid = 'covid';
    export const h5n1 = 'h5n1';
    export const mpox = 'mpox';
    export const westNile = 'westNile';
    export const rsvA = 'rsvA';
    export const rsvB = 'rsvB';
}

export const organismConfig = {
    [Organisms.covid]: {
        organism: Organisms.covid,
        pathFragment: 'covid',
        label: 'SARS-CoV-2',
        backgroundColor: 'bg-lime-200',
        hoverDecorationColor: 'hover:decoration-lime-200',
    },
    [Organisms.h5n1]: {
        organism: Organisms.h5n1,
        pathFragment: 'flu/h5n1',
        label: 'Influenza A/H5N1',
        backgroundColor: 'bg-amber-200',
        hoverDecorationColor: 'hover:decoration-amber-200',
    },
    [Organisms.mpox]: {
        organism: Organisms.mpox,
        pathFragment: 'mpox',
        label: 'MPOX',
        backgroundColor: 'bg-pink-200',
        hoverDecorationColor: 'hover:decoration-pink-200',
    },
    [Organisms.westNile]: {
        organism: Organisms.westNile,
        pathFragment: 'west-nile',
        label: 'West Nile',
        backgroundColor: 'bg-teal-200',
        hoverDecorationColor: 'hover:decoration-teal-200',
    },
    [Organisms.rsvA]: {
        organism: Organisms.rsvA,
        pathFragment: 'rsv-a',
        label: 'RSV-A',
        backgroundColor: 'bg-violet-200',
        hoverDecorationColor: 'hover:decoration-violet-200',
    },
    [Organisms.rsvB]: {
        organism: Organisms.rsvB,
        pathFragment: 'rsv-b',
        label: 'RSV-B',
        backgroundColor: 'bg-violet-200',
        hoverDecorationColor: 'hover:decoration-violet-200',
    },
};
export const allOrganisms = Object.keys(organismConfig) as Organism[];
export type Organism = keyof typeof organismConfig;

export type Route = {
    organism: Organism;
    pathname: string;
};

export type View<R extends Route, ParseResult extends R | undefined = R> = {
    organism: Organism;
    pathname: string;
    label: string;
    labelLong: string;
    defaultRoute: R;

    parseUrl: (url: URL) => ParseResult;
    toUrl: (route: R) => string;
};

export const defaultTablePageSize = 200;
