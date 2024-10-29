import { getDashboardsConfig } from '../config.ts';
import { Routing } from './routing.ts';
import { getInstanceLogger } from '../logger.ts';

const organismsConfig = getDashboardsConfig().dashboards.organisms;
const routing = new Routing(organismsConfig, getInstanceLogger);

/**
 * Constants for use in server-side code - for convenience.
 * They cannot be used in client-side code, because they import node modules, which are not available in the browser.
 */
export const ServerSide = {
    routing,
};
