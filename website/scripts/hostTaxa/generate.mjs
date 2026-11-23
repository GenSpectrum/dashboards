/** Regenerates the host group lookup from Pathoplexus host records and the NCBI taxonomy. */

import { createWriteStream } from 'node:fs';
import { open, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getStagingRhydbUrl } from '../pathoplexusExplorerConfig.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CATALOG = resolve(HERE, '../../src/pathoplexusExplorer/mappingData/virusCatalog.ts');
const OUTPUT = resolve(HERE, '../../src/pathoplexusExplorer/mappingData/hostTaxa.ts');

const ROOTS = [
    { taxon: 9606, group: 'human', name: 'Homo sapiens' },
    { taxon: 6656, group: 'vector', name: 'Arthropoda' },
    { taxon: 33208, group: 'animal', name: 'Metazoa' },
];

function argumentOf(name) {
    const index = process.argv.indexOf(`--${name}`);
    return index < 0 ? undefined : process.argv[index + 1];
}

const taxonomyDir = argumentOf('taxonomy');
if (taxonomyDir === undefined) {
    console.error('Pass --taxonomy <dir>, holding nodes.dmp, names.dmp and merged.dmp from the NCBI taxdump.');
    process.exit(1);
}

const instanceUrl = argumentOf('instance') ?? (await getStagingRhydbUrl());

/** Stream taxonomy dumps to avoid loading them into memory. */
async function* dumpLines(file) {
    const handle = await open(resolve(taxonomyDir, file));
    for await (const line of handle.readLines()) {
        yield line.split('\t|');
    }
}

async function taxonomy() {
    const parent = new Map();
    for await (const fields of dumpLines('nodes.dmp')) {
        parent.set(Number(fields[0]), Number(fields[1].slice(1)));
    }
    const merged = new Map();
    for await (const fields of dumpLines('merged.dmp')) {
        merged.set(Number(fields[0]), Number(fields[1].slice(1)));
    }
    const wanted = new Set();
    return { parent, merged, wanted };
}

/** Walks ancestors after resolving merged NCBI taxon IDs. */
function lineageOf({ parent, merged }, taxon) {
    let current = merged.get(taxon) ?? taxon;
    const seen = new Set();
    while (parent.has(current) && !seen.has(current)) {
        seen.add(current);
        if (current === 1) {
            break;
        }
        current = parent.get(current);
    }
    return seen;
}

async function hostsOfInstance() {
    const catalog = await readFile(CATALOG, 'utf8');
    const tables = [...catalog.matchAll(/table: '([a-z0-9_]+)'/g)].map((match) => match[1]);
    if (tables.length === 0) {
        throw new Error(`No pathogen tables found in ${CATALOG}`);
    }
    const parts = tables.map(
        (table) =>
            `${table}.filter(versionStatus='LATEST_VERSION' && isRevocation=false)` +
            `.project({hostNameScientific, hostTaxonId})`,
    );
    const union = parts.join('.unionall(') + ')'.repeat(parts.length - 1);
    const query = `${union}.group(by := {hostNameScientific, hostTaxonId}, aggs := {n := count()})`;
    const response = await fetch(`${instanceUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', 'Accept': 'application/x-ndjson' },
        body: query,
    });
    if (!response.ok) {
        throw new Error(`The instance refused the query: HTTP ${response.status}`);
    }
    const text = await response.text();
    return text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line))
        .filter((row) => row.hostNameScientific !== null && row.hostTaxonId !== null)
        .map((row) => ({ name: row.hostNameScientific, taxon: Number(row.hostTaxonId), n: Number(row.n) }));
}

const tree = await taxonomy();
const hosts = await hostsOfInstance();

const groups = new Map();
const unresolved = [];
for (const host of hosts) {
    const lineage = lineageOf(tree, host.taxon);
    const root = ROOTS.find((candidate) => lineage.has(candidate.taxon));
    if (root === undefined) {
        unresolved.push(host);
        continue;
    }
    groups.set(host.taxon, { name: host.name, group: root.group, n: host.n });
}

// A genus must resolve to one group for the fallback to be consistent.
const byGenus = new Map();
for (const entry of groups.values()) {
    const genus = entry.name.trim().split(/\s+/)[0];
    const seen = byGenus.get(genus);
    if (seen !== undefined && seen !== entry.group) {
        throw new Error(`"${genus}" is both ${seen} and ${entry.group}`);
    }
    byGenus.set(genus, entry.group);
}

const ordered = [...groups.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
const out = createWriteStream(OUTPUT);
out.write(`/** Generated from the NCBI taxonomy by scripts/hostTaxa/generate.mjs. */

/* eslint-disable @typescript-eslint/naming-convention -- the keys are taxon ids and scientific names */

import type { HostGroup } from '../domain/hosts.ts';

export const HUMAN_HOST = 'Homo sapiens';

export const HOST_TAXA: Readonly<Record<string, { group: HostGroup; name: string }>> = {
`);
for (const [taxon, entry] of ordered) {
    out.write(`    '${taxon}': { group: '${entry.group}', name: ${JSON.stringify(entry.name)} },\n`);
}
out.write(`};

export const HOST_GROUP_BY_GENUS: Readonly<Record<string, HostGroup>> = {
`);
for (const genus of [...byGenus.keys()].sort((a, b) => a.localeCompare(b))) {
    out.write(`    ${JSON.stringify(genus)}: '${byGenus.get(genus)}',\n`);
}
out.write('};\n');
out.end();

const counts = new Map();
for (const entry of groups.values()) {
    counts.set(entry.group, (counts.get(entry.group) ?? 0) + entry.n);
}
console.log(`${ordered.length} host taxa, ${byGenus.size} genera, written to ${OUTPUT}`);
for (const [group, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${group}: ${n.toLocaleString('en-US')} sequences`);
}
if (unresolved.length > 0) {
    console.log(`Not within any of the three taxa, and left out: ${unresolved.map((h) => h.name).join(', ')}`);
}
