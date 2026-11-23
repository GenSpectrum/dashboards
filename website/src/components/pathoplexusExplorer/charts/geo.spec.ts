import { readdirSync, readFileSync } from 'node:fs';

import { geoArea } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import { describe, expect, test } from 'vitest';

import { mapFeaturesOf, scaleFor } from './geo.ts';
import { WORLD_MAP_NAME } from '../../../pathoplexusExplorer/domain/mapGeometry.ts';
import { PROVINCE_MAP_COUNTRIES } from '../../../pathoplexusExplorer/mappingData/provinceMaps.ts';

const HALF_SPHERE = 2 * Math.PI;

const MAPS = readdirSync('public/mapData')
    .filter((file) => file.endsWith('.topo.json'))
    .map((file) => file.replace('.topo.json', ''));

describe('mapFeaturesOf', () => {
    test('every map file is used by the Explorer', () => {
        expect([...MAPS].sort()).toEqual([...PROVINCE_MAP_COUNTRIES, WORLD_MAP_NAME].sort());
    });

    test.each(MAPS)('draws every area of %s on its own side of the globe', (map) => {
        const topology = JSON.parse(readFileSync(`public/mapData/${map}.topo.json`, 'utf8')) as Topology;

        const features = mapFeaturesOf(topology, map);

        expect(features.length).toBeGreaterThan(0);
        const insideOut = features
            .filter((shape) => geoArea(shape) >= HALF_SPHERE)
            .map((shape) => shape.properties.name);
        expect(insideOut).toEqual([]);
    });
});

describe('scaleFor', () => {
    test('reaches the data it describes and no further', () => {
        expect(scaleFor([233, 51, 7, 1])).toEqual([1, 2, 5, 10, 20, 50, 100, 200]);
        expect(scaleFor([0, 3, 40])).toEqual([1, 2, 5, 10, 20]);
        expect(scaleFor([9, 2])).toEqual([1, 2, 5]);
        expect(scaleFor([1])).toEqual([1]);
        expect(scaleFor([])).toEqual([1]);
    });

    test('takes steps of about the same multiple over orders of magnitude', () => {
        const wide = scaleFor([11_995]);

        expect(wide.length).toBeLessThanOrEqual(8);
        expect(wide[0]).toBe(1);
        expect([...wide].sort((a, b) => a - b)).toEqual(wide);
        for (let index = 1; index < wide.length; index++) {
            expect(wide[index] / wide[index - 1], wide.join(',')).toBeGreaterThanOrEqual(2);
        }
    });
});
