import { type FC, useMemo } from 'react';

import { Figure } from './Layout.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/columns.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import {
    admin1AreaOf,
    canonicalCountryOf,
    mapNameOf,
    recordedPlaceOf,
    type Place,
} from '../../../pathoplexusExplorer/domain/geography.ts';
import { WORLD_MAP_NAME } from '../../../pathoplexusExplorer/domain/mapGeometry.ts';
import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { DOT_LOCATIONS } from '../../../pathoplexusExplorer/mappingData/dotLocations.ts';
import { ChoroplethMap, MapLegend, type MapDot, type MapValue } from '../reportCharts/ChoroplethMap.tsx';
import { focusLabelOf, focusOf, hasProvinceMap, projectionFor, scaleFor, useGeoFeatures } from '../reportCharts/geo.ts';
import { Async } from '../ui/States.tsx';

export function mapTitleOf(where: Place): string {
    if (where.level !== 'country' && where.level !== 'admin1') {
        return 'Sequences per country';
    }
    return hasProvinceMap(where.country) ? 'Sequences per province or state' : 'Sequences in this country';
}

type ReportMapProps = {
    where: Place;
    counts: Loadable<{ rows: RhydbRow[]; parentRows: RhydbRow[] | undefined }>;
    legend?: string;
};

export const ReportMap: FC<ReportMapProps> = ({ where, counts, legend = 'Sequences per area' }) => {
    const country = where.level === 'country' || where.level === 'admin1' ? where.country : undefined;
    const admin1Level = country !== undefined && hasProvinceMap(country);
    const world = useGeoFeatures(WORLD_MAP_NAME);
    const admin1 = useGeoFeatures(admin1Level ? country : undefined);

    const rows = counts.data?.rows;
    const model = useMemo(() => {
        const features = admin1Level ? admin1.data : world.data;
        if (rows === undefined || features === undefined) {
            return undefined;
        }
        const totals = new Map<string, number>();
        let unplaced = 0;
        for (const row of rows) {
            const n = Number(row.n ?? 0);
            const recorded = recordedPlaceOf(row[COLUMNS.country]);
            if (recorded === null) {
                unplaced += n;
                continue;
            }
            let key: string;
            if (admin1Level) {
                const value = recordedPlaceOf(row[COLUMNS.admin1]);
                if (canonicalCountryOf(recorded) !== canonicalCountryOf(country)) {
                    continue;
                }
                if (value === null) {
                    unplaced += n;
                    continue;
                }
                key = admin1AreaOf(country, value);
            } else {
                key = mapNameOf(recorded);
            }
            totals.set(key, (totals.get(key) ?? 0) + n);
        }
        const values = new Map<string, MapValue>();
        for (const [key, n] of totals) {
            if (n > 0) {
                values.set(key, { value: n, tooltip: <div>{formatCount(n)} sequences</div> });
            }
        }
        const known = new Set(features.map((feature) => feature.properties.name));
        const dots: MapDot[] = admin1Level
            ? []
            : Object.entries(DOT_LOCATIONS)
                  .filter(([name]) => values.has(mapNameOf(name)) || values.has(name))
                  .filter(([name]) => !known.has(mapNameOf(name)))
                  .map(([name, coordinates]) => ({ name: mapNameOf(name), coordinates }));
        // Include both unplaced entries and entries assigned to areas the map cannot draw in the caption.
        const undrawn = [...totals.entries()]
            .filter(([key]) => !known.has(key) && !dots.some((dot) => dot.name === key))
            .reduce((sum, [, n]) => sum + n, 0);
        const total = [...totals.values()].reduce((sum, n) => sum + n, unplaced);
        return {
            values,
            features,
            dots,
            focus: focusOf(where, admin1Level),
            focusLabel: focusLabelOf(where, admin1Level),
            unshown: unplaced + undrawn,
            total,
            thresholds: scaleFor(totals.values()),
        };
    }, [rows, world.data, admin1.data, admin1Level, country, where]);

    return (
        <Figure
            caption={
                model === undefined || model.unshown === 0 ? undefined : (
                    <strong>
                        {formatCount(model.unshown)} {model.unshown === 1 ? 'sequence' : 'sequences'} could not be
                        mapped ({formatProportion(model.unshown / Math.max(1, model.total))}).
                    </strong>
                )
            }
        >
            <Async state={{ data: model, error: counts.error ?? world.error ?? admin1.error }} height='h-[320px]'>
                {(data) => (
                    <div className='flex flex-col gap-1'>
                        <ChoroplethMap
                            features={data.features}
                            values={data.values}
                            thresholds={data.thresholds}
                            focus={data.focus}
                            focusLabel={data.focusLabel}
                            dots={data.dots}
                            height={admin1Level || where.level === 'country' ? 440 : 340}
                            projection={projectionFor(country, { zoomed: admin1Level || where.level === 'country' })}
                        />
                        <MapLegend
                            thresholds={data.thresholds}
                            format={(value) => formatCount(value)}
                            title={legend}
                            focusLabel={data.focusLabel}
                        />
                    </div>
                )}
            </Async>
        </Figure>
    );
};
