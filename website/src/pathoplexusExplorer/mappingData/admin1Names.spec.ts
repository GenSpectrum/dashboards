import { readFileSync } from 'node:fs';

import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { describe, expect, test } from 'vitest';

import { ADMIN1_NAMES } from './admin1Names.ts';
import { ADMIN1_PLACES } from './admin1Places.ts';
import { PROVINCE_MAP_COUNTRIES } from './provinceMaps.ts';
import { getMapGeometry } from '../domain/mapGeometry.ts';

function drawnDivisionsOf(country: string): Set<string> {
    const topology = JSON.parse(readFileSync(`public/mapData/${country}.topo.json`, 'utf8')) as Topology;
    return new Set(feature(topology, getMapGeometry(topology, country)).features.map((shape) => shape.properties.name));
}

const COUNTRIES_WITH_A_MAP = PROVINCE_MAP_COUNTRIES.filter((country) => country in ADMIN1_NAMES);

describe('the division tables and the maps agree', () => {
    test('every country with a province map has its division names', () => {
        expect(COUNTRIES_WITH_A_MAP).toEqual([...PROVINCE_MAP_COUNTRIES]);
    });

    test.each(COUNTRIES_WITH_A_MAP)('every division %s counts under is one its map draws', (country) => {
        const drawn = drawnDivisionsOf(country);

        const undrawn = [...new Set(Object.values(ADMIN1_NAMES[country]))].filter((name) => !drawn.has(name));

        expect(undrawn).toEqual([]);
    });

    test.each(Object.keys(ADMIN1_PLACES))('every division a place in %s lies in is one its map draws', (country) => {
        const drawn = drawnDivisionsOf(country);

        const undrawn = [...new Set(Object.values(ADMIN1_PLACES[country]))].filter((name) => !drawn.has(name));

        expect(undrawn).toEqual([]);
    });
});
