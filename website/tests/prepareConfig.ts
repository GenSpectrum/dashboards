import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { parseDocument } from 'yaml';

import { RHYDB_FIXTURE_PATH } from './rhydbFixture.ts';

const filename = 'application-dashboards-prod.yaml';
const source = new URL(`../../backend/src/main/resources/${filename}`, import.meta.url);
const output = new URL('./.config/', import.meta.url);

const config = parseDocument(await readFile(source, 'utf8'));
config.setIn(['dashboards', 'pathoplexusExplorer'], {
    rhydbUrl: `http://localhost:4321${RHYDB_FIXTURE_PATH}`,
});

await mkdir(output, { recursive: true });
await writeFile(new URL(filename, output), config.toString());
