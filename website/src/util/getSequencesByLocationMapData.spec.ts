import { describe, expect, test } from 'vitest';

import { getSequencesByLocationMapData } from './getSequencesByLocationMapData';

const testUrl = new URL('https://my.host/page?query=1');

describe('getSequencesByLocationMapData', () => {
    test('should return the correct map data for World', () => {
        const actual = getSequencesByLocationMapData('World', testUrl);

        const expected = {
            mapSource: {
                type: 'topojson',
                url: 'https://my.host/mapData/World.topo.json',
                topologyObjectsKey: 'countries',
            },
            zoom: 1.5,
            offsetX: 0,
            offsetY: 10,
        };
        expect(actual).toEqual(expected);
    });

    test('should return undefined for unknown map', () => {
        const actual = getSequencesByLocationMapData('Unknown', testUrl);
        expect(actual).toBeUndefined();
    });
});
