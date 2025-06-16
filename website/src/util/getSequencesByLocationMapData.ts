import type { MapSource } from '@genspectrum/dashboard-components/util';

let knownMapFiles: ReturnType<typeof loadKnownMapFiles> | null = null;

type MapMetadatum = {
    additionalInfo: Omit<MapData, 'mapSource'>;
    topologyObjectsKey: string;
};

/* eslint-disable @typescript-eslint/naming-convention -- the keys must match the country names */
const mapMetadata: Record<string, MapMetadatum> = {
    'Germany': {
        additionalInfo: {
            zoom: 5.8,
            offsetX: 10,
            offsetY: 51.4,
        },
        topologyObjectsKey: 'deu',
    },
    'Switzerland': {
        additionalInfo: {
            zoom: 7.7,
            offsetX: 8.2,
            offsetY: 46.8,
        },
        topologyObjectsKey: 'che',
    },
    'USA': {
        additionalInfo: {
            zoom: 4.1,
            offsetX: -98,
            offsetY: 38,
        },
        topologyObjectsKey: 'usa',
    },
    'World': {
        additionalInfo: {
            zoom: 1.5,
            offsetX: 0,
            offsetY: 10,
        },
        topologyObjectsKey: 'countries',
    },
    'Democratic Republic of the Congo': {
        additionalInfo: {
            zoom: 5,
            offsetX: 20,
            offsetY: -5,
        },
        topologyObjectsKey: 'cd',
    },
};
/* eslint-enable @typescript-eslint/naming-convention */

function loadKnownMapFiles() {
    return new Map<string, MapData>(
        Object.entries(mapMetadata).map(([mapName, mapMetadatum]) => [mapName, getMapData(mapName, mapMetadatum)]),
    );
}

function getMapData(mapName: string, mapMetadatum: MapMetadatum): MapData {
    return {
        mapSource: {
            type: 'topojson',
            url: `/mapData/${mapName}.topo.json`,
            topologyObjectsKey: mapMetadatum.topologyObjectsKey,
        },
        ...mapMetadatum.additionalInfo,
    };
}

export type MapData = {
    readonly mapSource: MapSource;
    readonly zoom: number;
    readonly offsetX: number;
    readonly offsetY: number;
};

export function getSequencesByLocationMapData(mapName: string | undefined, baseUrl: string): MapData | undefined {
    if (mapName === undefined) {
        return undefined;
    }

    knownMapFiles = knownMapFiles ?? loadKnownMapFiles();

    const mapData = knownMapFiles.get(mapName);

    if (mapData === undefined) {
        return undefined;
    }

    const absoluteMapUrl = new URL(mapData.mapSource.url, baseUrl);
    return {
        ...mapData,
        mapSource: {
            ...mapData.mapSource,
            url: absoluteMapUrl.toString(),
        },
    };
}
