/** Reports recorded divisions that do not resolve to an area on the map. */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { feature } from 'topojson-client';

import { admin1AreaOf, canonicalCountryOf } from '../../src/pathoplexusExplorer/domain/geography.ts';
import { PROVINCE_MAP_COUNTRIES } from '../../src/pathoplexusExplorer/mappingData/provinceMaps.ts';
import { getMapGeometry } from '../../src/pathoplexusExplorer/domain/mapGeometry.ts';
import { getStagingRhydbUrl } from '../pathoplexusExplorerConfig.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(HERE, '../..');

function argumentOf(name) {
    const index = process.argv.indexOf(`--${name}`);
    return index < 0 ? undefined : process.argv[index + 1];
}

const instanceUrl = argumentOf('instance') ?? (await getStagingRhydbUrl());

async function drawnDivisionsOf(country) {
    const topology = JSON.parse(await readFile(resolve(WEBSITE, `public/mapData/${country}.topo.json`), 'utf8'));
    return new Set(feature(topology, getMapGeometry(topology, country)).features.map((shape) => shape.properties.name));
}

async function recordedDivisions(tables) {
    const parts = tables.map(
        (table) =>
            `${table}.filter(versionStatus = 'LATEST_VERSION' && isRevocation = false)` +
            `.project({geoLocCountry, geoLocAdmin1})`,
    );
    const union = parts.join('.unionall(') + ')'.repeat(parts.length - 1);
    const response = await fetch(`${instanceUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', 'Accept': 'application/x-ndjson' },
        body: `${union}.group(by := {geoLocCountry, geoLocAdmin1}, aggs := {n := count()})`,
    });
    if (!response.ok) {
        throw new Error(`The instance refused the query: HTTP ${response.status}`);
    }
    return (await response.text())
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line))
        .filter((row) => row.geoLocCountry !== null && row.geoLocAdmin1 !== null)
        .map((row) => ({ country: row.geoLocCountry, value: row.geoLocAdmin1, n: Number(row.n) }));
}

const catalog = await readFile(resolve(WEBSITE, 'src/pathoplexusExplorer/mappingData/virusCatalog.ts'), 'utf8');
const tables = [...catalog.matchAll(/table: '([a-z0-9_]+)'/g)].map((match) => match[1]);
const recorded = await recordedDivisions(tables);

const drawn = new Map();
for (const country of PROVINCE_MAP_COUNTRIES) {
    drawn.set(country, await drawnDivisionsOf(country));
}

const inScope = recorded
    .map((row) => ({ ...row, country: canonicalCountryOf(row.country) }))
    .filter((row) => drawn.has(row.country));
const uncovered = inScope
    .filter((row) => !drawn.get(row.country).has(admin1AreaOf(row.country, row.value)))
    .sort((a, b) => b.n - a.n);
const entries = inScope.reduce((sum, row) => sum + row.n, 0);
const missed = uncovered.reduce((sum, row) => sum + row.n, 0);

console.log(
    `${(inScope.length - uncovered.length).toLocaleString('en-US')} of ${inScope.length.toLocaleString('en-US')} ` +
        `recorded country-and-division pairs land on a division the map draws, ` +
        `covering ${(((entries - missed) / entries) * 100).toFixed(1)}% of the entries.`,
);
if (uncovered.length === 0) {
    console.log('Nothing to add.');
} else {
    console.log('\nNot covered, most recorded first:\n');
    for (const { country, value, n } of uncovered) {
        console.log(`  ${String(n).padStart(6)}  ${country}: ${value}`);
    }
    console.log('\nEach needs a person: a division under another name goes in admin1Names.ts, a place inside');
    console.log('one goes in admin1Places.ts, and a value naming neither is left out on purpose.');
}
