import { readFile } from 'node:fs/promises';

import { parseDocument } from 'yaml';

export async function getStagingRhydbUrl() {
    const file = new URL('../../backend/src/main/resources/application-dashboards-staging.yaml', import.meta.url);
    const config = parseDocument(await readFile(file, 'utf8'));
    const url = config.getIn(['dashboards', 'pathoplexusExplorer', 'rhydbUrl']);
    if (typeof url !== 'string') {
        throw new Error(`Set dashboards.pathoplexusExplorer.rhydbUrl in ${file.pathname}.`);
    }
    return url;
}
