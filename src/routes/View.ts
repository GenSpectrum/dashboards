export type Organism = 'covid' | 'mpox' | 'west-nile' | 'rsv-a';

export type Route = {
    organism: Organism;
    pathname: string;
};

export type View<R extends Route> = {
    organism: Organism;
    pathname: string;
    label: string;
    defaultRoute: R;

    parseUrl: (url: URL) => R | undefined;
    toUrl: (route: R) => string;
};
