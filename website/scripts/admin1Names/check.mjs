/** Reports recorded divisions that do not resolve to an area on the map. */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { feature } from 'topojson-client';

import { canonicalCountryOf } from '../../src/pathoplexusExplorer/domain/countries.ts';
import { admin1AreaOf, mappedCountries } from '../../src/pathoplexusExplorer/domain/divisions.ts';
import { getMapGeometry } from '../../src/pathoplexusExplorer/domain/mapGeometry.ts';
import { recordedValues } from '../recordedValues.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE = resolve(HERE, '../..');

async function drawnDivisionsOf(country) {
    const topology = JSON.parse(await readFile(resolve(WEBSITE, `public/mapData/${country}.topo.json`), 'utf8'));
    return new Set(feature(topology, getMapGeometry(topology, country)).features.map((shape) => shape.properties.name));
}

const recorded = (await recordedValues(['geoLocCountry', 'geoLocAdmin1']))
    .filter((row) => row.geoLocCountry !== null && row.geoLocAdmin1 !== null)
    .map((row) => ({ country: row.geoLocCountry, value: row.geoLocAdmin1, n: row.n }));

const drawn = new Map();
for (const country of mappedCountries) {
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
    console.log('\nEach needs a person: a division under another name goes in divisionNames.json, a place inside');
    console.log('one goes in divisionPlaces.json, and a value naming neither is left out on purpose.');
}
