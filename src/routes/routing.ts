import { CovidView1 } from './covidView1.ts';
import { CovidView2 } from './covidView2.ts';
import { MpoxView1 } from './mpoxView1.ts';
import { WestNileView1 } from './westNileView1.ts';
import { RsvAView1 } from './rsvAView1.ts';

export namespace Routing {
    export type Route = CovidView1.Route | CovidView2.Route | MpoxView1.Route | WestNileView1.Route | RsvAView1.Route;
    export type Organism = 'covid' | 'mpox' | 'west-nile' | 'rsv-a';
    export type Pathname =
        | CovidView1.Pathname
        | CovidView2.Pathname
        | MpoxView1.Pathname
        | WestNileView1.Pathname
        | RsvAView1.Pathname;

    export const getCurrentRouteInBrowser = (): Route | undefined => {
        return parseUrl(new URL(window.location.href));
    };

    export const navigateTo = (route: Route) => {
        window.location.href = toUrl(route);
    };

    export const parseUrl = (url: URL): Route | undefined => {
        switch (url.pathname) {
            case CovidView1.pathname:
                return CovidView1.parseUrl(url);
            case CovidView2.pathname:
                return CovidView2.parseUrl(url);
            case MpoxView1.pathname:
                return MpoxView1.parseUrl(url);
            case WestNileView1.pathname:
                return WestNileView1.parseUrl(url);
            case RsvAView1.pathname:
                return RsvAView1.parseUrl(url);
        }
        return undefined;
    };

    export const toUrl = (route: Route): string => {
        switch (route.pathname) {
            case CovidView1.pathname:
                return CovidView1.toUrl(route);
            case CovidView2.pathname:
                return CovidView2.toUrl(route);
            case MpoxView1.pathname:
                return MpoxView1.toUrl(route);
            case WestNileView1.pathname:
                return WestNileView1.toUrl(route);
            case RsvAView1.pathname:
                return RsvAView1.toUrl(route);
        }
    };

    export const organisms: {
        label: string;
        organism: Organism;
    }[] = [
        { label: 'SARS-CoV-2', organism: 'covid' },
        { label: 'mpox', organism: 'mpox' },
        { label: 'West-Nile', organism: 'west-nile' },
        { label: 'RSV-A', organism: 'rsv-a' },
    ];

    export const views: Record<
        Organism,
        {
            label: string;
            pathname: Pathname;
        }[]
    > = {
        'covid': [
            {
                label: 'Single variant',
                pathname: CovidView1.pathname,
            },
            {
                label: 'Compare side-by-side',
                pathname: CovidView2.pathname,
            },
        ],
        'mpox': [
            {
                label: 'Single variant',
                pathname: MpoxView1.pathname,
            },
        ],
        'west-nile': [
            {
                label: 'Single variant',
                pathname: WestNileView1.pathname,
            },
        ],
        'rsv-a': [
            {
                label: 'Single variant',
                pathname: RsvAView1.pathname,
            },
        ],
    };

    export const defaultRoutes: Record<Pathname, Route> = {
        [CovidView1.pathname]: {
            organism: CovidView1.organism,
            pathname: CovidView1.pathname,
            baselineFilter: {
                location: {},
                dateRange: CovidView1.defaultDateRange,
            },
            variantFilter: { nextcladePangoLineage: 'JN.1*' },
        },
        [CovidView2.pathname]: {
            organism: CovidView2.organism,
            pathname: CovidView2.pathname,
            filters: [
                { id: 1, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'JN.1*' } },
                { id: 2, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'XBB.1*' } },
            ],
        },
        [MpoxView1.pathname]: {
            organism: MpoxView1.organism,
            pathname: MpoxView1.pathname,
            baselineFilter: {
                location: {},
                dateRange: MpoxView1.defaultDateRange,
            },
            variantFilter: {},
        },
        [WestNileView1.pathname]: {
            organism: WestNileView1.organism,
            pathname: WestNileView1.pathname,
            baselineFilter: {
                location: {},
                dateRange: WestNileView1.defaultDateRange,
            },
            variantFilter: {},
        },
        [RsvAView1.pathname]: {
            organism: RsvAView1.organism,
            pathname: RsvAView1.pathname,
            baselineFilter: {
                location: {},
                dateRange: RsvAView1.defaultDateRange,
            },
            variantFilter: {},
        },
    };
}
