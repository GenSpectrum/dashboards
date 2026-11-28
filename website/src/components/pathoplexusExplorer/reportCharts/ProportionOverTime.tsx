import type { FC } from 'react';

import { BucketChart } from './BucketChart.tsx';
import { compactCount } from './StackedBars.tsx';
import {
    formatCount,
    formatProportion,
    LOW_COUNT,
    wilsonInterval,
} from '../../../pathoplexusExplorer/domain/statistics.ts';

export type ProportionSeries = {
    key: string;
    label: string;
    color: string;
    counts: readonly { own: number; all: number }[];
};

type ProportionOverTimeProps = {
    buckets: readonly string[];
    series: readonly ProportionSeries[];
    height?: number;
    xTitle?: string;
    yTitle?: string;
};

/** Draw the 95% confidence interval around each proportion. */
export const ProportionOverTime: FC<ProportionOverTimeProps> = ({ buckets, series, height = 260, xTitle, yTitle }) => {
    const top = Math.min(
        1,
        Math.max(
            0.05,
            ...series.flatMap((entry) =>
                entry.counts.map((count) => (count.all > 0 ? wilsonInterval(count.own, count.all).upper : 0)),
            ),
        ),
    );
    const ticks = (top >= 0.9 ? [0, 0.25, 0.5, 0.75, 1] : [0, top / 2, top]).map((value) => ({
        value,
        label: formatProportion(value),
    }));

    return (
        <BucketChart
            buckets={buckets}
            height={height}
            ariaLabel='Proportion over time'
            top={top}
            ticks={ticks}
            xTitle={xTitle}
            yTitle={yTitle}
            tooltip={(index) => <BucketProportions series={series} index={index} />}
        >
            {({ x, y }) => (
                <>
                    {series.map((entry) =>
                        bands(entry, x, y).map((band) => (
                            <path key={`${entry.key}:${band}`} d={band} fill={entry.color} opacity={0.16} />
                        )),
                    )}
                    {series.map((entry) => (
                        <g key={entry.key}>
                            {lines(entry, x, y).map((line) => (
                                <path
                                    key={line}
                                    d={line}
                                    fill='none'
                                    stroke={entry.color}
                                    strokeWidth={2}
                                    strokeLinejoin='round'
                                />
                            ))}
                            {entry.counts.map((count, index) =>
                                count.all === 0 || !isolated(entry, index) ? null : (
                                    <circle
                                        key={buckets[index]}
                                        cx={x(index)}
                                        cy={y(count.own / count.all)}
                                        r={2.5}
                                        fill={entry.color}
                                    />
                                ),
                            )}
                        </g>
                    ))}
                </>
            )}
        </BucketChart>
    );
};

type BucketProportionsProps = { series: readonly ProportionSeries[]; index: number };

const BucketProportions: FC<BucketProportionsProps> = ({ series, index }) => {
    return (
        <>
            <table className='w-full'>
                <tbody>
                    {series.map((entry) => {
                        const count = entry.counts[index];
                        return (
                            <tr key={entry.key}>
                                <td className='pr-2'>
                                    <span className='mr-1 inline-block h-2 w-2' style={{ background: entry.color }} />
                                    {entry.label}
                                </td>
                                <td className='text-right tabular-nums'>
                                    {count.all === 0 ? '–' : formatProportion(count.own / count.all)}
                                </td>
                                <td className='pl-2 text-right text-stone-500 tabular-nums'>
                                    {formatCount(count.own)}/{compactCount(count.all)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {series.some((entry) => entry.counts[index].all > 0 && entry.counts[index].all < LOW_COUNT) && (
                <div className='mt-1 text-stone-500'>Fewer than {LOW_COUNT} sequences.</div>
            )}
        </>
    );
};

/** Draw a point for an isolated nonempty bucket. */
function isolated(entry: ProportionSeries, index: number): boolean {
    const has = (at: number) => at >= 0 && at < entry.counts.length && entry.counts[at].all > 0;
    return !has(index - 1) && !has(index + 1);
}

/** Split paths at empty buckets to show gaps. */
function lines(entry: ProportionSeries, x: (index: number) => number, y: (value: number) => number): string[] {
    return runsOf(entry).map((run) =>
        run
            .map(
                (index, position) =>
                    `${position === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(entry.counts[index].own / entry.counts[index].all).toFixed(1)}`,
            )
            .join(' '),
    );
}

function bands(entry: ProportionSeries, x: (index: number) => number, y: (value: number) => number): string[] {
    return runsOf(entry).map((run) => {
        const upper = run.map((index) => {
            const { own, all } = entry.counts[index];
            return `${x(index).toFixed(1)},${y(wilsonInterval(own, all).upper).toFixed(1)}`;
        });
        const lower = [...run].reverse().map((index) => {
            const { own, all } = entry.counts[index];
            return `${x(index).toFixed(1)},${y(wilsonInterval(own, all).lower).toFixed(1)}`;
        });
        return `M${upper.join(' L')} L${lower.join(' L')} Z`;
    });
}

function runsOf(entry: ProportionSeries): number[][] {
    const runs: number[][] = [];
    let current: number[] = [];
    entry.counts.forEach((count, index) => {
        if (count.all > 0) {
            current.push(index);
            return;
        }
        if (current.length > 0) {
            runs.push(current);
            current = [];
        }
    });
    if (current.length > 0) {
        runs.push(current);
    }
    return runs.filter((run) => run.length > 1);
}
