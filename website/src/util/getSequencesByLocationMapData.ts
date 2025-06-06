import type { MapSource } from '@genspectrum/dashboard-components/util';
import type { Topology } from 'topojson-specification';

let knownMapFiles: ReturnType<typeof loadKnownMapFiles> | null = null;

/* eslint-disable @typescript-eslint/naming-convention -- the keys must match the country names */
const mapMetadata: Record<string, Omit<MapData, 'mapSource'>> = {
    'Germany': {
        zoom: 5.8,
        offsetX: 10,
        offsetY: 51.4,
    },
    'Switzerland': {
        zoom: 7.7,
        offsetX: 8.2,
        offsetY: 46.8,
    },
    'USA': {
        zoom: 4.1,
        offsetX: -98,
        offsetY: 38,
    },
    'World': {
        zoom: 1.5,
        offsetX: 0,
        offsetY: 10,
    },
    'Democratic Republic of the Congo': {
        zoom: 5,
        offsetX: 20,
        offsetY: -5,
    },
};
/* eslint-enable @typescript-eslint/naming-convention */

function loadKnownMapFiles() {
    const topoJsonFiles = import.meta.glob<Topology>('../../public/mapData/*.topo.json', { eager: true }); // For reference: https://vite.dev/guide/features.html#glob-import

    const mapSpecs = Object.entries(topoJsonFiles).map(([relativeMapFilePath, map]) => {
        const mapName = getBasename(relativeMapFilePath, '.topo.json');
        const topologyObjectsKey = Object.keys(map.objects)[0];

        return { mapName, topologyObjectsKey };
    });

    return new Map<string, MapData>(
        mapSpecs.map(({ mapName, topologyObjectsKey }) => [mapName, getMapData(mapName, topologyObjectsKey)]),
    );
}

function getBasename(path: string, suffix: string) {
    const lastSlashIndex = path.lastIndexOf('/');
    const fileName = lastSlashIndex === -1 ? path : path.substring(lastSlashIndex + 1);

    return fileName.endsWith(suffix) ? fileName.slice(0, -suffix.length) : fileName;
}

function getMapData(mapName: string, topologyObjectsKey: string): MapData {
    if (!(mapName in mapMetadata)) {
        throw new Error(`Map for '${mapName}' is missing metadata configuration.`);
    }

    return {
        mapSource: {
            type: 'topojson',
            url: `/mapData/${mapName}.topo.json`,
            topologyObjectsKey: topologyObjectsKey,
        },
        ...mapMetadata[mapName],
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
