import {
    geoAlbersUsa,
    geoArea,
    geoBounds,
    geoEqualEarth,
    geoMercator,
    geoPath,
    geoTransform,
    type GeoProjection,
    type GeoSphere,
} from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { type FC, type MouseEvent, type ReactNode, useCallback, useMemo, useState } from 'react';

import { Tooltip } from './Tooltip.tsx';
import { useWidth } from './useWidth.ts';
import { MAP_BORDER, MAP_GROUND, NO_DATA_COLOR, OUTSIDE_STROKE, SEQUENTIAL } from '../ui/colors.ts';

export type MapFeature = Feature<Geometry, { name: string }>;

export type MapValue = {
    value: number;
    tooltip: ReactNode;
};

export type MapDot = { name: string; coordinates: readonly [number, number] };

/** Use a stable empty array so the map fit stays memoized. */
const NO_DOTS: readonly MapDot[] = [];

export const PROJECTION = {
    equalEarth: 'equalEarth',
    mercator: 'mercator',
    albersUsa: 'albersUsa',
} as const;
export type Projection = (typeof PROJECTION)[keyof typeof PROJECTION];

type ChoroplethMapProps = {
    features: readonly MapFeature[];
    values: ReadonlyMap<string, MapValue>;
    /** Lower bounds of the color steps, in ascending order. */
    thresholds: readonly number[];
    focus?: readonly string[];
    focusLabel?: string;
    dots?: readonly MapDot[];
    projection?: Projection;
    height?: number;
};

const PADDING = 8;

const MIN_HEIGHT = 180;

export const ChoroplethMap: FC<ChoroplethMapProps> = ({
    features,
    values,
    thresholds,
    focus,
    focusLabel,
    dots = NO_DOTS,
    projection = PROJECTION.equalEarth,
    height = 380,
}) => {
    // Wait for the measured width before fitting the map.
    const [ref, width] = useWidth<HTMLDivElement>(0);
    const [hover, setHover] = useState<{ name: string; x: number; y: number } | undefined>();

    const { path, project, drawHeight } = useMemo(() => {
        const base =
            projection === PROJECTION.mercator
                ? geoMercator()
                : projection === PROJECTION.albersUsa
                  ? geoAlbersUsa()
                  : geoEqualEarth();
        const extent = extentOf(features, focus, projection, dots);
        const inner = Math.max(1, width - 2 * PADDING);
        const probe = base.fitExtent(
            [
                [0, 0],
                [1000, 1000],
            ],
            extent,
        );
        const [[left, top], [right, bottom]] = geoPath(probe).bounds(extent);
        const aspect = (right - left) / Math.max(1e-6, bottom - top);
        const drawHeight =
            width === 0 ? height : Math.min(height, Math.max(MIN_HEIGHT, Math.round(inner / aspect) + 2 * PADDING));
        const fitted = base.fitExtent(
            [
                [PADDING, PADDING],
                [width - PADDING, drawHeight - PADDING],
            ],
            extent,
        );
        if (focus !== undefined && projection === PROJECTION.mercator && width > 0) {
            // Clip outside the frame so the stroke of a clipped polygon stays outside the printed map.
            fitted.clipExtent([
                [-1, -1],
                [width + 1, drawHeight + 1],
            ]);
        }
        return { path: polygonPath(fitted), project: fitted, drawHeight };
    }, [features, focus, dots, width, height, projection]);

    /** Fall back to the full map when none of the named areas are drawn. */
    const covered = useMemo(() => {
        if (focus === undefined) {
            return undefined;
        }
        const drawn = new Set(features.map((feature) => feature.properties.name));
        const kept = focus.filter((name) => drawn.has(name));
        if (kept.length > 0) {
            return new Set(kept);
        }
        return dots.some((dot) => focus.includes(dot.name)) ? new Set<string>() : undefined;
    }, [focus, features, dots]);

    // Keep areas with sequences in view even if they are not in the requested focus.
    const isOutside = useCallback(
        (name: string) => covered !== undefined && !covered.has(name) && !values.has(name),
        [covered, values],
    );

    /** Cache projected paths for the current view. */
    const drawn = useMemo(
        () =>
            width === 0
                ? []
                : features
                      .map((shape) => ({ name: shape.properties.name, d: path(shape) }))
                      .filter((shape): shape is { name: string; d: string } => shape.d !== null),
        [features, path, width],
    );

    /** Draw areas outside the focus first so they do not cover the focused areas. */
    const shapes = useMemo(
        () => [...drawn].sort((a, b) => Number(isOutside(b.name)) - Number(isOutside(a.name))),
        [drawn, isOutside],
    );

    const colorOf = (value: number) => stepColor(thresholds.findLastIndex((threshold) => value >= threshold));

    const hoverAt = (name: string) => (event: MouseEvent<SVGElement>) => {
        const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
        if (box !== undefined) {
            setHover({ name, x: event.clientX - box.left, y: event.clientY - box.top });
        }
    };

    const hovered = hover === undefined ? undefined : values.get(hover.name);

    return (
        <div ref={ref} className='relative w-full'>
            <svg
                width={width}
                height={drawHeight}
                role='img'
                aria-label='Map of sequences by place'
                onMouseLeave={() => setHover(undefined)}
            >
                {/* Draw the map background as SVG so it appears in print. */}
                <rect
                    x={0.5}
                    y={0.5}
                    width={Math.max(0, width - 1)}
                    height={Math.max(0, drawHeight - 1)}
                    fill={MAP_GROUND}
                    stroke={MAP_BORDER}
                />
                {shapes.map(({ name, d }) => {
                    const entry = values.get(name);
                    const outside = isOutside(name);
                    return (
                        <path
                            key={name}
                            d={d}
                            fill={outside ? MAP_GROUND : entry === undefined ? NO_DATA_COLOR : colorOf(entry.value)}
                            stroke={outside ? OUTSIDE_STROKE : '#ffffff'}
                            strokeWidth={0.5}
                            onMouseMove={hoverAt(name)}
                        />
                    );
                })}
                {dots.map((dot) => {
                    const entry = values.get(dot.name);
                    const point = project([dot.coordinates[0], dot.coordinates[1]]);
                    if (entry === undefined || point === null) {
                        return null;
                    }
                    return (
                        <circle
                            key={dot.name}
                            cx={point[0]}
                            cy={point[1]}
                            r={4.5}
                            fill={colorOf(entry.value)}
                            stroke='#ffffff'
                            strokeWidth={1.5}
                            onMouseMove={hoverAt(dot.name)}
                        />
                    );
                })}
            </svg>
            {hover !== undefined && (
                <Tooltip x={hover.x} y={hover.y} width={width}>
                    <div className='font-semibold'>{hover.name}</div>
                    {hovered !== undefined ? (
                        hovered.tooltip
                    ) : isOutside(hover.name) ? (
                        <div className='text-stone-500'>
                            {focusLabel === undefined ? 'Outside the selection' : `Not in ${focusLabel}`}
                        </div>
                    ) : (
                        <div className='text-stone-500'>No sequences</div>
                    )}
                </Tooltip>
            )}
        </div>
    );
};

function stepColor(index: number): string {
    return index < 0 ? SEQUENTIAL[0] : SEQUENTIAL[Math.min(SEQUENTIAL.length - 1, index)];
}

type SwatchProps = { fill: string; stroke?: string };

/** Draw legend swatches as SVG so their color survives printing. */
const Swatch: FC<SwatchProps> = ({ fill, stroke }) => {
    return (
        <svg aria-hidden width={24} height={10} className='shrink-0'>
            <rect x={0.5} y={0.5} width={23} height={9} fill={fill} stroke={stroke ?? 'none'} />
        </svg>
    );
};

function extentOf(
    features: readonly MapFeature[],
    focus: readonly string[] | undefined,
    projection: Projection,
    dots: readonly MapDot[],
): GeoSphere | FeatureCollection {
    if (focus === undefined) {
        return projection === PROJECTION.equalEarth ? { type: 'Sphere' } : collectionOf(features.map(mainland));
    }
    const focused = features.filter((shape) => focus.includes(shape.properties.name));
    if (focused.length > 0) {
        return collectionOf(focused.map(mainland));
    }
    // Fit point locations with geographic padding so nearby land remains visible.
    const dotted = dots.filter((dot) => focus.includes(dot.name));
    return dotted.length > 0 ? seaAround(collectionOf(dotted.map(pointOf))) : collectionOf(features.map(mainland));
}

function collectionOf(features: Feature[]): FeatureCollection {
    return { type: 'FeatureCollection', features };
}

function pointOf(dot: MapDot): Feature {
    return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [dot.coordinates[0], dot.coordinates[1]] },
    };
}

const SEA_SPAN = 6;

function seaAround(collection: FeatureCollection): FeatureCollection {
    const [[west, south], [east, north]] = geoBounds(collection);
    if (east < west) {
        return collection;
    }
    const lon = Math.max(0, (2 * SEA_SPAN - (east - west)) / 2);
    const lat = Math.max(0, (SEA_SPAN - (north - south)) / 2);
    if (lon === 0 && lat === 0) {
        return collection;
    }
    // Use the same ring orientation as the map shapes to avoid filling the exterior.
    const box: [number, number][] = [
        [west - lon, south - lat],
        [west - lon, north + lat],
        [east + lon, north + lat],
        [east + lon, south - lat],
        [west - lon, south - lat],
    ];
    return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [box] } }],
    };
}

/** Skip subpixel vertices after projection to keep detailed maps small enough to print and interact with. */
function polygonPath(projection: GeoProjection) {
    let lastX = Infinity;
    let lastY = Infinity;
    const simplify = geoTransform({
        lineStart() {
            lastX = Infinity;
            lastY = Infinity;
            this.stream.lineStart();
        },
        point(x, y) {
            if (Math.abs(x - lastX) >= 0.25 || Math.abs(y - lastY) >= 0.25) {
                this.stream.point(x, y);
                lastX = x;
                lastY = y;
            }
        },
    });
    return geoPath({ stream: (output) => projection.stream(simplify.stream(output)) }).digits(1);
}

/** Fit to the largest part so distant territories do not distort the extent. */
function mainland(shape: MapFeature): MapFeature {
    if (shape.geometry.type !== 'MultiPolygon') {
        return shape;
    }
    let largest = shape.geometry.coordinates[0];
    let largestArea = -1;
    for (const polygon of shape.geometry.coordinates) {
        const area = geoArea({ type: 'Polygon', coordinates: polygon });
        if (area > largestArea) {
            largest = polygon;
            largestArea = area;
        }
    }
    return { ...shape, geometry: { type: 'Polygon', coordinates: largest } };
}

type MapLegendProps = {
    thresholds: readonly number[];
    format: (value: number) => string;
    title?: string;
    focusLabel?: string;
};

export const MapLegend: FC<MapLegendProps> = ({ thresholds, format, title, focusLabel }) => {
    return (
        <div className='report-note flex flex-wrap items-center gap-x-1 gap-y-1 text-stone-600'>
            {title !== undefined && <span className='mr-1 font-semibold text-stone-700'>{title}</span>}
            {thresholds.map((threshold, index) => (
                <span key={threshold} className='inline-flex items-center gap-1'>
                    <Swatch fill={stepColor(index)} />
                    <span className='mr-1'>{format(threshold)}</span>
                </span>
            ))}
            <span className='ml-2 inline-flex items-center gap-1'>
                <Swatch fill={NO_DATA_COLOR} />
                {focusLabel === undefined ? 'no sequences' : `no sequences in ${focusLabel}`}
            </span>
            {focusLabel !== undefined && (
                <span className='ml-2 inline-flex items-center gap-1'>
                    <Swatch fill={MAP_GROUND} stroke={OUTSIDE_STROKE} />
                    {`not in ${focusLabel}`}
                </span>
            )}
        </div>
    );
};
