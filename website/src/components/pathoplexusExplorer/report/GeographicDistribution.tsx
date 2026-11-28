import { useMemo, type FC } from 'react';

import { AreasTable, unplacedNote } from './AreasTable.tsx';
import { Section } from './Layout.tsx';
import { ReportMap } from './ReportMap.tsx';
import type { ReportData } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import {
    areaScale,
    counted,
    hasPlacesBelow,
    rankAreas,
    geographicTotal,
} from '../../../pathoplexusExplorer/dataLayer/queries/areas.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import { sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';

type GeographicDistributionProps = {
    number: number;
    reference: ReportRef;
    counts: ReportData['map'];
    legend: string;
};

export const GeographicDistribution: FC<GeographicDistributionProps> = ({ number, reference, counts, legend }) => {
    const { where, period } = reference;
    const rows = counts.data?.rows;
    const scale = useMemo(() => areaScale(where), [where]);
    const areas = useMemo(() => rankAreas(scale, counted(rows ?? [])), [scale, rows]);
    const total = useMemo(() => geographicTotal(where, rows ?? []), [where, rows]);
    const unplaced = total - sumOf(areas, (area) => area.own);
    return (
        <Section number={number} title='Geographic distribution'>
            <ReportMap where={where} counts={counts} legend={legend} />
            {hasPlacesBelow(where) && total > 0 && (
                <AreasTable
                    scale={scale}
                    areas={areas}
                    period={period}
                    countHeader='Sequences'
                    total={total}
                    footnote={unplacedNote(unplaced, total)}
                    linkTo={
                        reference.kind === 'location' ? undefined : (place) => hrefOf({ ...reference, where: place })
                    }
                />
            )}
        </Section>
    );
};
