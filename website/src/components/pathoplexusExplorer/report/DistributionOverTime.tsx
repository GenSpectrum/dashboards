import { useMemo, type FC } from 'react';

import { ChartLegend, Figure, Prose } from './Layout.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import type { ReportData } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import type { BreakdownSpec, Part } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import type { ProportionRows } from '../../../pathoplexusExplorer/dataLayer/queries/genomics.ts';
import {
    bucketAxisOf,
    countsPerBucket,
    trimEmptyBuckets,
} from '../../../pathoplexusExplorer/dataLayer/queries/timeSeries.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { ProportionOverTime } from '../charts/ProportionOverTime.tsx';
import { BAR_SCALE, StackedBars, type StackedSeries } from '../charts/StackedBars.tsx';
import { colorMap, OTHER_COLOR, SERIES_COLORS } from '../charts/colors.ts';
import { Async } from '../ui/States.tsx';

function nothingToPlot(rows: readonly RhydbRow[]): string {
    const total = rows.reduce((sum, row) => sum + Number(row.n ?? 0), 0);
    return total === 0 ? 'Nothing.' : 'No sequence has a collection date that is precise enough to include.';
}

/** Distinguish undated entries, ranges too wide for a bucket, and entries outside the chart extent. */
function leftOut(left: { undated: number; imprecise: number; offAxis: number }): string | undefined {
    const total = left.undated + left.imprecise + left.offAxis;
    return total === 0
        ? undefined
        : `${formatCount(total)} ${total === 1 ? 'sequence' : 'sequences'} could not be shown.`;
}

type DistributionOverTimeProps = {
    report: ReportData;
    title: string;
    showComposition?: boolean;
};

function distribution(rows: RhydbRow[], parts: readonly Part[], classify: BreakdownSpec['classify']) {
    const axis = bucketAxisOf({ rows });
    if (axis === undefined) {
        return nothingToPlot(rows);
    }
    const trimmed = trimEmptyBuckets(rows, axis);
    const { buckets, granularity } = trimmed;
    const colors = colorMap(parts.map((part) => part.key));
    const other: RhydbRow[] = [];
    const groups = new Map([...colors.keys()].map((key) => [key, [] as RhydbRow[]]));
    for (const row of rows) {
        const group = groups.get(classify(row)) ?? other;
        group.push(row);
    }
    const counts = (group: RhydbRow[]) => countsPerBucket(group, buckets, granularity).counts;
    const series: StackedSeries[] = [];
    for (const { key, label } of parts) {
        const group = groups.get(key);
        const color = colors.get(key);
        if (group !== undefined && color !== undefined) {
            series.push({ key, label, color, values: counts(group) });
        }
    }
    if (other.length > 0) {
        series.push({ key: '(other)', label: 'Other', color: OTHER_COLOR, values: counts(other) });
    }
    return { buckets, granularity, series, note: leftOut(trimmed) };
}

export const DistributionOverTime: FC<DistributionOverTimeProps> = ({ report, title, showComposition }) => {
    const rows = report.overTime.data;
    const parts = report.breakdown.data;
    const classify = report.spec.data?.classify;
    const data = useMemo(
        () =>
            rows === undefined || parts === undefined || classify === undefined
                ? undefined
                : distribution(rows, parts, classify),
        [rows, parts, classify],
    );
    const scales = showComposition === true ? [BAR_SCALE.count, BAR_SCALE.proportion] : [BAR_SCALE.count];
    return (
        <>
            {scales.map((scale) => (
                <Figure key={scale} title={scale === BAR_SCALE.count ? title : 'Composition per period'}>
                    <Async state={{ data, error: report.overTime.error ?? report.breakdown.error }} height='h-[240px]'>
                        {(chart) =>
                            typeof chart === 'string' ? (
                                <Prose>{chart}</Prose>
                            ) : (
                                <div className='flex flex-col gap-2'>
                                    <StackedBars
                                        buckets={chart.buckets}
                                        series={chart.series}
                                        scale={scale}
                                        height={230}
                                        xTitle={`Collection period (${chart.granularity})`}
                                        yTitle={
                                            scale === BAR_SCALE.proportion ? 'Proportion of the period' : 'Sequences'
                                        }
                                    />
                                    <ChartLegend
                                        items={chart.series.map(({ label, color }) => ({ label, color }))}
                                        note={chart.note}
                                    />
                                </div>
                            )
                        }
                    </Async>
                </Figure>
            ))}
        </>
    );
};

type ProportionFigureProps = {
    title: string;
    state: Loadable<ProportionRows>;
    label: string;
    legend?: string;
    yTitle: string;
};

export const ProportionFigure: FC<ProportionFigureProps> = ({ title, state, label, legend, yTitle }) => {
    return (
        <Figure title={title}>
            <Async state={state} height='h-[220px]'>
                {(rows) => {
                    const axis = bucketAxisOf({ rows: rows.all });
                    if (axis === undefined) {
                        return <Prose>{nothingToPlot(rows.all)}</Prose>;
                    }
                    const trimmed = trimEmptyBuckets(rows.all, axis);
                    const own = countsPerBucket(rows.own, trimmed.buckets, trimmed.granularity);
                    const color = SERIES_COLORS[0];
                    return (
                        <div className='flex flex-col gap-2'>
                            <ProportionOverTime
                                buckets={trimmed.buckets}
                                series={[
                                    {
                                        key: 'own',
                                        label,
                                        color,
                                        counts: trimmed.buckets.map((_, index) => ({
                                            own: own.counts[index],
                                            all: trimmed.counts[index],
                                        })),
                                    },
                                ]}
                                height={220}
                                xTitle={`Collection period (${trimmed.granularity})`}
                                yTitle={yTitle}
                            />
                            <ChartLegend
                                items={[
                                    { label: legend ?? label, color, shape: 'line' },
                                    { label: '95% interval', color, shape: 'band' },
                                ]}
                                note={leftOut(trimmed)}
                            />
                        </div>
                    );
                }}
            </Async>
        </Figure>
    );
};
