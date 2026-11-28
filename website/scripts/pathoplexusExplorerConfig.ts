import { readFile } from 'node:fs/promises';

import { parseDocument } from 'yaml';

/**
 * Reads the staging RhyDB URL straight from the backend's YAML, so scripts run with plain `node` and no environment
 * variables. `src/config.ts` cannot be imported here: its imports rely on Vite resolving extensionless paths.
 */
export async function getStagingRhydbUrl() {
    const file = new URL('../../backend/src/main/resources/application-dashboards-staging.yaml', import.meta.url);
    const config = parseDocument(await readFile(file, 'utf8'));
    const url = config.getIn(['dashboards', 'pathoplexusExplorer', 'rhydbUrl']);
    if (typeof url !== 'string') {
        throw new Error(`Set dashboards.pathoplexusExplorer.rhydbUrl in ${file.pathname}.`);
    }
    return url;
}
