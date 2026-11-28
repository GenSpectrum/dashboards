import type { GeometryCollection, Topology } from 'topojson-specification';

export const WORLD_MAP_NAME = 'World';

export function getMapGeometry(topology: Topology, mapName: string): GeometryCollection<{ name: string }> {
    const objects = Object.values(topology.objects);
    const provinceGeometry = objects.length === 1 ? objects[0] : undefined;
    const geometry = mapName === WORLD_MAP_NAME ? topology.objects.countries : provinceGeometry;
    if (geometry?.type !== 'GeometryCollection') {
        throw new Error(`Expected one collection of areas in the map of ${mapName}.`);
    }
    return geometry as GeometryCollection<{ name: string }>;
}
