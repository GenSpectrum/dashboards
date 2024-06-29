import { CovidView1, CovidView2, CovidView3 } from './covid.ts';
import { MpoxView1, MpoxView3 } from './mpox.ts';
import { WestNileView1, WestNileView3 } from './westNile.ts';
import { RsvAView1, RsvAView3 } from './rsvA.ts';
import { RsvBView1, RsvBView3 } from './rsvB.ts';
import type { Organism, Route, View } from './View.ts';

export namespace Routing {
    const allViews = [
        CovidView1.view,
        CovidView2.view,
        CovidView3.view,
        MpoxView1.view,
        MpoxView3.view,
        RsvAView1.view,
        RsvAView3.view,
        RsvBView1.view,
        RsvBView3.view,
        WestNileView1.view,
        WestNileView3.view,
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
        backgroundColor: string;
    }[] = [
        { label: 'SARS-CoV-2', organism: 'covid', backgroundColor: 'bg-lime-200' },
        { label: 'RSV-A', organism: 'rsv-a', backgroundColor: 'bg-violet-200' },
        { label: 'RSV-B', organism: 'rsv-b', backgroundColor: 'bg-violet-200' },
        { label: 'Mpox', organism: 'mpox', backgroundColor: 'bg-pink-200' },
        { label: 'West Nile virus', organism: 'west-nile', backgroundColor: 'bg-teal-200' },
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
        'rsv-b': [],
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
