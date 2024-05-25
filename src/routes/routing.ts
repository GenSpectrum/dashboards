import { View1 } from './view1.ts';
import { View2 } from './view2.ts';

export namespace Routing {
    export type Route = View1.Route | View2.Route;

    export const getCurrentRouteInBrowser = (): Route | undefined => {
        return parseUrl(new URL(window.location.href));
    };

    export const navigateTo = (route: Route) => {
        window.location.href = toUrl(route);
    };

    export const parseUrl = (url: URL): Route | undefined => {
        switch (url.pathname) {
            case View1.pathname:
                return View1.parseUrl(url);
            case View2.pathname:
                return View2.parseUrl(url);
        }
        return undefined;
    };

    export const toUrl = (route: Route): string => {
        switch (route.route) {
            case 'view1':
                return View1.toUrl(route);
            case 'view2':
                return View2.toUrl(route);
        }
    };

    export const views: Record<
        string,
        {
            label: string;
            route: Routing.Route;
        }[]
    > = {
        covid: [
            {
                label: 'Singe variant',
                route: { route: 'view1', baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'JN.1*' } },
            },
            {
                label: 'Compare side-by-side',
                route: {
                    route: 'view2',
                    filters: [
                        { id: 1, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'JN.1*' } },
                        { id: 2, baselineFilter: {}, variantFilter: { nextcladePangoLineage: 'XBB.1*' } },
                    ],
                },
            },
        ],
    };
}
