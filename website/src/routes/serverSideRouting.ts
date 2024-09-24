import { getDashboardsConfig } from '../config.ts';
import { Routing } from './routing.ts';

/**
 * Constants for use in server-side code - for convenience.
 * They cannot be used in client-side code, because they import node modules, which are not available in the browser.
 */
export namespace ServerSide {
    const organismsConfig = getDashboardsConfig().dashboards.organisms;

    export const routing = new Routing(organismsConfig);

    export const covidView1 = routing.views.covid[0];
    export const covidView2 = routing.views.covid[1];
    export const covidView3 = routing.views.covid[2];
    export const h5n1View1 = routing.views.h5n1[0];
    export const h5n1View3 = routing.views.h5n1[1];
    export const mpoxView1 = routing.views.mpox[0];
    export const mpoxView3 = routing.views.mpox[1];
    export const rsvAView1 = routing.views.rsvA[0];
    export const rsvAView3 = routing.views.rsvA[1];
    export const rsvBView1 = routing.views.rsvB[0];
    export const rsvBView3 = routing.views.rsvB[1];
    export const westNileView1 = routing.views.westNile[0];
    export const westNileView3 = routing.views.westNile[1];
}
