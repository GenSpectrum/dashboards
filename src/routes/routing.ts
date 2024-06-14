import { CovidView1 } from './covidView1.ts';
import { CovidView2 } from './covidView2.ts';
import { MpoxView1 } from './mpoxView1.ts';
import { WestNileView1 } from './westNileView1.ts';
import { RsvAView1 } from './rsvAView1.ts';
import type { Organism, Route, View } from './View.ts';
import { RsvAView3 } from './rsvAView3.ts';

export namespace Routing {
    const allViews = [
        CovidView1.view,
        CovidView2.view,
        MpoxView1.view,
        RsvAView1.view,
        RsvAView3.view,
        WestNileView1.view,
    ] as const;

    export const getCurrentRouteInBrowser = (): Route | undefined => {
        return parseUrl(new URL(window.location.href));
    };

    export const navigateTo = (route: Route) => {
        window.location.href = toUrl(route);
    };

    export const parseUrl = (url: URL): Route | undefined => {
        for (const view of allViews) {
            if (view.pathname === url.pathname) {
                return view.parseUrl(url);
            }
        }
        return undefined;
    };

    export const toUrl = (route: Route): string => {
        for (const view of allViews) {
            if (route.pathname === view.pathname) {
                // @ts-ignore
                return view.toUrl(route);
            }
        }
        throw new Error('Unexpected route: ' + route.pathname);
    };

    export const organisms: {
        label: string;
        organism: Organism;
    }[] = [
        { label: 'SARS-CoV-2', organism: 'covid' },
        { label: 'RSV-A', organism: 'rsv-a' },
        { label: 'Mpox', organism: 'mpox' },
        { label: 'West Nile virus', organism: 'west-nile' },
    ];

    export const views = groupViewsByOrganism(allViews);

    export const getDefaultRoute = (pathname: string): Route | undefined => {
        for (const view of allViews) {
            if (view.pathname === pathname) {
                return view.defaultRoute;
            }
        }
        return undefined;
    };
}

function groupViewsByOrganism(views: readonly View<any>[]): Record<
    Organism,
    {
        label: string;
        labelLong: string;
        pathname: string;
    }[]
> {
    const viewMap: Record<Organism, { label: string; labelLong: string; pathname: string }[]> = {
        'covid': [],
        'mpox': [],
        'west-nile': [],
        'rsv-a': [],
    };

    for (const view of views) {
        if (viewMap[view.organism]) {
            viewMap[view.organism].push({
                label: view.label,
                labelLong: view.labelLong,
                pathname: view.pathname,
            });
        }
    }

    return viewMap;
}
