import { useQuery } from '@tanstack/react-query';
import { geoArea } from 'd3-geo';
import type { Position } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

import { PROJECTION, type MapFeature, type Projection } from './ChoroplethMap.tsx';
import { hasAdmin1Names } from '../../../pathoplexusExplorer/domain/divisions.ts';
import {
    canonicalCountryOf,
    placesOfContinent,
    placesOfSubregion,
    mapNameOf,
    placeLabel,
    type Place,
} from '../../../pathoplexusExplorer/domain/geography.ts';
import { getMapGeometry, WORLD_MAP_NAME } from '../../../pathoplexusExplorer/domain/mapGeometry.ts';

export function hasProvinceMap(country: string): boolean {
    return hasAdmin1Names(country);
}

/** Use the Albers USA projection to include Alaska and Hawaii. */
export function projectionFor(country: string | undefined, { zoomed }: { zoomed: boolean }): Projection {
    if (country === 'USA') {
        return PROJECTION.albersUsa;
    }
    return zoomed ? PROJECTION.mercator : PROJECTION.equalEarth;
}

export function useGeoFeatures(mapName: string | undefined) {
    return useQuery({
        queryKey: ['pathoplexusExplorerMap', mapName],
        enabled: mapName !== undefined,
        staleTime: Infinity,
        queryFn: async (): Promise<MapFeature[]> => {
            if (mapName === undefined || (mapName !== WORLD_MAP_NAME && !hasProvinceMap(mapName))) {
                throw new Error(`There is no map of ${mapName ?? 'that place'}.`);
            }
            const response = await fetch(`/mapData/${encodeURIComponent(mapName)}.topo.json`);
            if (!response.ok) {
                throw new Error(`Could not load the map of ${mapName} (HTTP ${response.status}).`);
            }
            const topology = (await response.json()) as Topology;
            return mapFeaturesOf(topology, mapName);
        },
    });
}

export function mapFeaturesOf(topology: Topology, mapName: string): MapFeature[] {
    return feature(topology, getMapGeometry(topology, mapName)).features.map(withRingsFacingIn);
}

const HALF_SPHERE = 2 * Math.PI;

/** Reverse polygon rings if they enclose more than half the globe. */
function withRingsFacingIn(shape: MapFeature): MapFeature {
    switch (shape.geometry.type) {
        case 'Polygon':
            return {
                ...shape,
                geometry: { ...shape.geometry, coordinates: ringsFacingIn(shape.geometry.coordinates) },
            };
        case 'MultiPolygon':
            return {
                ...shape,
                geometry: { ...shape.geometry, coordinates: shape.geometry.coordinates.map(ringsFacingIn) },
            };
        default:
            return shape;
    }
}

function ringsFacingIn(rings: Position[][]): Position[][] {
    if (rings.length === 0 || geoArea({ type: 'Polygon', coordinates: [rings[0]] }) <= HALF_SPHERE) {
        return rings;
    }
    return rings.map((ring) => [...ring].reverse());
}

export function focusOf(where: Place, provinces = false): string[] | undefined {
    if (provinces) {
        return undefined;
    }
    switch (where.level) {
        case 'world':
            return undefined;
        case 'continent':
            return placesOfContinent(where.continent).map(mapNameOf);
        case 'subregion':
            return placesOfSubregion(where.subregion).map(mapNameOf);
        case 'country':
        case 'admin1':
            return [mapNameOf(canonicalCountryOf(where.country))];
    }
}

export function focusLabelOf(where: Place, provinces = false): string | undefined {
    if (provinces || where.level === 'world') {
        return undefined;
    }
    return where.level === 'admin1' ? canonicalCountryOf(where.country) : placeLabel(where);
}

/** Choose round-number steps for the data range. */
const LADDER = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];

const STEPS = 8;

export function scaleFor(values: Iterable<number>): number[] {
    const top = Math.max(0, ...values);
    if (top <= 1) {
        return [1];
    }
    const within = LADDER.filter((step) => step <= top);
    if (within.length <= STEPS) {
        return within.length === 0 ? [1] : within;
    }
    const ratio = Math.pow(top, 1 / (STEPS - 1));
    const wanted = Array.from({ length: STEPS }, (_, index) => Math.pow(ratio, index));
    return [...new Set(wanted.map((value) => nearestStep(value, within)))].sort((a, b) => a - b);
}

/** Snap scale values to the nearest step on a logarithmic scale. */
function nearestStep(value: number, ladder: readonly number[]): number {
    let best = ladder[0];
    let distance = Infinity;
    for (const step of ladder) {
        const apart = Math.abs(Math.log(step) - Math.log(value));
        if (apart < distance) {
            distance = apart;
            best = step;
        }
    }
    return best;
}
