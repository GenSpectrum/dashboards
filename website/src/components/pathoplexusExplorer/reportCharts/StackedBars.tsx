import type { FC } from 'react';

import { BucketChart } from './BucketChart.tsx';
import { formatCount, formatProportion, LOW_COUNT } from '../../../pathoplexusExplorer/domain/statistics.ts';

export type StackedSeries = { key: string; label: string; color: string; values: readonly number[] };

export const BAR_SCALE = { count: 'count', proportion: 'proportion' } as const;
export type BarScale = (typeof BAR_SCALE)[keyof typeof BAR_SCALE];

type StackedBarsProps = {
    buckets: readonly string[];
    series: readonly StackedSeries[];
    scale: BarScale;
    height?: number;
    xTitle?: string;
    yTitle?: string;
};

/** Show counts or proportions by time bucket. Leave buckets without sequences empty. */
export const StackedBars: FC<StackedBarsProps> = ({ buckets, series, scale, height = 240, xTitle, yTitle }) => {
    const totals = buckets.map((_, index) => series.reduce((sum, entry) => sum + entry.values[index], 0));
    const proportion = scale === BAR_SCALE.proportion;
    const top = proportion ? 1 : niceMax(Math.max(1, ...totals));
    // Use whole numbers for gridlines on a count chart.
    const ticks = (proportion ? [0, 0.5, 1] : top % 2 === 0 ? [0, top / 2, top] : [0, top]).map((value) => ({
        value,
        label: proportion ? `${Math.round(value * 100)}%` : compactCount(value),
    }));

    return (
        <BucketChart
            buckets={buckets}
            height={height}
            ariaLabel='Sequences over time'
            top={top}
            ticks={ticks}
            xTitle={xTitle}
            yTitle={yTitle}
            tooltip={(index) => <BucketCounts series={series} index={index} total={totals[index]} />}
        >
            {({ step, x, y }) => {
                const gap = step > 6 ? Math.min(3, step * 0.2) : 0;
                const barWidth = Math.max(1, step - gap);
                return buckets.map((bucket, index) => {
                    const total = totals[index];
                    if (total === 0) {
                        return null;
                    }
                    let offset = 0;
                    return (
                        <g key={bucket}>
                            {series.map((entry) => {
                                const value = entry.values[index];
                                if (value === 0) {
                                    return null;
                                }
                                const y0 = y(offset);
                                offset += proportion ? value / total : value;
                                const y1 = y(offset);
                                return (
                                    <rect
                                        key={entry.key}
                                        x={x(index) - step / 2 + gap / 2}
                                        y={y1}
                                        width={barWidth}
                                        height={Math.max(0.5, y0 - y1 - (series.length > 1 && y0 - y1 > 3 ? 1 : 0))}
                                        fill={entry.color}
                                    />
                                );
                            })}
                        </g>
                    );
                });
            }}
        </BucketChart>
    );
};

type BucketCountsProps = { series: readonly StackedSeries[]; index: number; total: number };

const BucketCounts: FC<BucketCountsProps> = ({ series, index, total }) => {
    if (total === 0) {
        return <div className='text-stone-500'>No sequences</div>;
    }
    return (
        <>
            <table className='w-full'>
                <tbody>
                    {[...series].reverse().map((entry) =>
                        entry.values[index] === 0 ? null : (
                            <tr key={entry.key}>
                                <td className='pr-2'>
                                    <span className='mr-1 inline-block h-2 w-2' style={{ background: entry.color }} />
                                    {entry.label}
                                </td>
                                <td className='text-right tabular-nums'>{formatCount(entry.values[index])}</td>
                                <td className='pl-2 text-right text-stone-500 tabular-nums'>
                                    {formatProportion(entry.values[index] / total)}
                                </td>
                            </tr>
                        ),
                    )}
                    <tr className='border-t border-stone-200'>
                        <td className='pr-2'>All</td>
                        <td className='text-right font-semibold tabular-nums'>{formatCount(total)}</td>
                        <td />
                    </tr>
                </tbody>
            </table>
            {total < LOW_COUNT && <div className='mt-1 text-stone-500'>Fewer than {LOW_COUNT} sequences.</div>}
        </>
    );
};

function niceMax(value: number): number {
    const exponent = 10 ** Math.floor(Math.log10(value));
    for (const factor of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
        if (factor * exponent >= value) {
            return factor * exponent;
        }
    }
    return 10 * exponent;
}

export function compactCount(value: number): string {
    if (value >= 1000) {
        const thousands = value / 1000;
        return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
    }
    return String(Math.round(value));
}
