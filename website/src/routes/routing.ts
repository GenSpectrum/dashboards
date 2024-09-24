import { CovidView1, CovidView2, CovidView3 } from './covid.ts';
import { MpoxView1, MpoxView3 } from './mpox.ts';
import { WestNileView1, WestNileView3 } from './westNile.ts';
import { RsvAView1, RsvAView3 } from './rsvA.ts';
import { RsvBView1, RsvBView3 } from './rsvB.ts';
import { Organisms, type Route } from './View.ts';
import { H5n1View1, H5n1View3 } from './h5n1.ts';
import type { OrganismsConfig } from '../config.ts';

export class Routing {
    private readonly allViews;
    public readonly views;

    constructor(organismsConfig: OrganismsConfig) {
        this.views = {
            [Organisms.covid]: [
                new CovidView1(organismsConfig),
                new CovidView2(organismsConfig),
                new CovidView3(organismsConfig),
            ],
            [Organisms.h5n1]: [new H5n1View1(organismsConfig), new H5n1View3(organismsConfig)],
            [Organisms.mpox]: [new MpoxView1(organismsConfig), new MpoxView3(organismsConfig)],
            [Organisms.rsvA]: [new RsvAView1(organismsConfig), new RsvAView3(organismsConfig)],
            [Organisms.rsvB]: [new RsvBView1(organismsConfig), new RsvBView3(organismsConfig)],
            [Organisms.westNile]: [new WestNileView1(organismsConfig), new WestNileView3(organismsConfig)],
        } as const;
        this.allViews = Object.values(this.views).flat();
    }

    getCurrentRouteInBrowser = (): Route | undefined => {
        return this.parseUrl(new URL(window.location.href));
    };

    navigateTo = (route: Route) => {
        window.location.href = this.toUrl(route);
    };

    parseUrl = (url: URL): Route | undefined => {
        for (const view of this.allViews) {
            if (view.pathname === url.pathname) {
                return view.parseUrl(url);
            }
        }
        return undefined;
    };

    toUrl = (route: Route): string => {
        for (const view of this.allViews) {
            if (route.pathname === view.pathname) {
                // @ts-ignore
                return view.toUrl(route);
            }
        }
        throw new Error('Unexpected route: ' + route.pathname);
    };

    getDefaultRoute = (pathname: string): Route | undefined => {
        for (const view of this.allViews) {
            if (view.pathname === pathname) {
                return view.defaultRoute;
            }
        }
        return undefined;
    };
}
