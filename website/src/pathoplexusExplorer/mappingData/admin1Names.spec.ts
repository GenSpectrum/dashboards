import { readFileSync } from 'node:fs';

import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { describe, expect, test } from 'vitest';

import divisionNames from './divisionNames.json';
import divisionPlaces from './divisionPlaces.json';
import { getMapGeometry } from '../domain/mapGeometry.ts';

function drawnDivisionsOf(country: string): Set<string> {
    const topology = JSON.parse(readFileSync(`public/mapData/${country}.topo.json`, 'utf8')) as Topology;
    return new Set(feature(topology, getMapGeometry(topology, country)).features.map((shape) => shape.properties.name));
}

describe('the division tables and the maps agree', () => {
    for (const [source, index] of Object.entries({ divisionNames, divisionPlaces })) {
        test.each(Object.entries(index))(
            `every division in %s in ${source} exists on its map`,
            (country, divisions) => {
                const drawn = drawnDivisionsOf(country);
                expect(Object.keys(divisions).filter((area) => !drawn.has(area))).toEqual([]);
            },
        );
    }
});
