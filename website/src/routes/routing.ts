import { CovidAnalyzeSingleVariantView, CovidCompareVariantsView, CovidSequencingEffortsView } from './covid.ts';
import { MpoxAnalyzeSingleVariantView, MpoxSequencingEffortsView } from './mpox.ts';
import { WestNileAnalyzeSingleVariantView, WestNileSequencingEffortsView } from './westNile.ts';
import { RsvAAnalyzeSingleVariantView, RsvASequencingEffortsView } from './rsvA.ts';
import { RsvBAnalyzeSingleVariantView, RsvBSequencingEffortsView } from './rsvB.ts';
import { Organisms, type Route } from './View.ts';
import { H5n1AnalyzeSingleVariantView, H5n1SequencingEffortsView } from './h5n1.ts';
import type { OrganismsConfig } from '../config.ts';

export class Routing {
    private readonly allViews;
    public readonly views;

    constructor(organismsConfig: OrganismsConfig) {
        this.views = {
            [Organisms.covid]: [
                new CovidAnalyzeSingleVariantView(organismsConfig),
                new CovidCompareVariantsView(organismsConfig),
                new CovidSequencingEffortsView(organismsConfig),
            ],
            [Organisms.h5n1]: [
                new H5n1AnalyzeSingleVariantView(organismsConfig),
                new H5n1SequencingEffortsView(organismsConfig),
            ],
            [Organisms.mpox]: [
                new MpoxAnalyzeSingleVariantView(organismsConfig),
                new MpoxSequencingEffortsView(organismsConfig),
            ],
            [Organisms.rsvA]: [
                new RsvAAnalyzeSingleVariantView(organismsConfig),
                new RsvASequencingEffortsView(organismsConfig),
            ],
            [Organisms.rsvB]: [
                new RsvBAnalyzeSingleVariantView(organismsConfig),
                new RsvBSequencingEffortsView(organismsConfig),
            ],
            [Organisms.westNile]: [
                new WestNileAnalyzeSingleVariantView(organismsConfig),
                new WestNileSequencingEffortsView(organismsConfig),
            ],
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
