/** Regenerates the host group lookup from Pathoplexus host records and the NCBI taxonomy. */

import { open, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';

import { readText } from '../../src/pathoplexusExplorer/dataLayer/transport/row.ts';
import { argumentOf, recordedValues } from '../recordedValues.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(HERE, '../../src/pathoplexusExplorer/mappingData/hostTaxa.json');

const ROOTS = [
    { taxon: 9606, group: 'human', name: 'Homo sapiens' },
    { taxon: 6656, group: 'vector', name: 'Arthropoda' },
    { taxon: 33208, group: 'animal', name: 'Metazoa' },
];

const taxonomyDir = argumentOf('taxonomy') ?? exitWithUsage();

function exitWithUsage(): never {
    console.error('Pass --taxonomy <dir>, holding nodes.dmp and merged.dmp from the NCBI taxdump.');
    process.exit(1);
}

/** Stream taxonomy dumps to avoid loading them into memory. */
async function* dumpLines(file: string): AsyncGenerator<string[]> {
    const handle = await open(resolve(taxonomyDir, file));
    for await (const line of handle.readLines()) {
        yield line.split('\t|');
    }
}

type Taxonomy = { parent: Map<number, number>; merged: Map<number, number> };

async function taxonomy(): Promise<Taxonomy> {
    const parent = new Map<number, number>();
    for await (const fields of dumpLines('nodes.dmp')) {
        parent.set(Number(fields[0]), Number(fields[1].slice(1)));
    }
    const merged = new Map<number, number>();
    for await (const fields of dumpLines('merged.dmp')) {
        merged.set(Number(fields[0]), Number(fields[1].slice(1)));
    }
    return { parent, merged };
}

/** Walks ancestors after resolving merged NCBI taxon IDs. */
function lineageOf({ parent, merged }: Taxonomy, taxon: number): Set<number> {
    let current = merged.get(taxon) ?? taxon;
    const seen = new Set<number>();
    while (parent.has(current) && !seen.has(current)) {
        seen.add(current);
        if (current === 1) {
            break;
        }
        current = parent.get(current) ?? current;
    }
    return seen;
}

const tree = await taxonomy();
const hosts = (await recordedValues(['hostNameScientific', 'hostTaxonId']))
    .filter((row) => row.hostNameScientific !== null && row.hostTaxonId !== null)
    .map((row) => ({
        name: readText(row, 'hostNameScientific'),
        taxon: Number(row.hostTaxonId),
        n: Number(row.n ?? 0),
    }));

const groups = new Map<number, { name: string; group: string; n: number }>();
const unresolved: typeof hosts = [];
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
const byGenus = new Map<string, string>();
for (const entry of groups.values()) {
    const genus = entry.name.trim().split(/\s+/)[0];
    const seen = byGenus.get(genus);
    if (seen !== undefined && seen !== entry.group) {
        throw new Error(`"${genus}" is both ${seen} and ${entry.group}`);
    }
    byGenus.set(genus, entry.group);
}

const taxa: Record<string, Record<string, number[]>> = Object.fromEntries(
    ROOTS.map(({ group }) => [group, Object.create(null) as Record<string, number[]>]),
);
for (const [taxon, entry] of [...groups].sort((a, b) => a[1].name.localeCompare(b[1].name) || a[0] - b[0])) {
    const genus = entry.name.trim().split(/\s+/)[0];
    (taxa[entry.group][genus] ??= []).push(taxon);
}
await writeFile(OUTPUT, await format(JSON.stringify(taxa), { ...(await resolveConfig(OUTPUT)), filepath: OUTPUT }));

const counts = new Map<string, number>();
for (const entry of groups.values()) {
    counts.set(entry.group, (counts.get(entry.group) ?? 0) + entry.n);
}
console.log(`${groups.size} host taxa, ${byGenus.size} genera, written to ${OUTPUT}`);
for (const [group, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${group}: ${n.toLocaleString('en-US')} sequences`);
}
if (unresolved.length > 0) {
    console.log(`Not within any of the three taxa, and left out: ${unresolved.map((h) => h.name).join(', ')}`);
}
