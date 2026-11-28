import type { FC } from 'react';

import { formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { NO_DATA_COLOR } from '../ui/colors.ts';

export type AvailabilitySegment = { key: string; n: number; color: string };

export type AvailabilityRow = { key: string; label: string; segments: readonly AvailabilitySegment[] };

type AvailabilityBarsProps = {
    rows: readonly AvailabilityRow[];
    total: number;
};

const BAR_HEIGHT = 10;

export const AvailabilityBars: FC<AvailabilityBarsProps> = ({ rows, total }) => {
    return (
        <div className='report-figure flex flex-col gap-y-0.5'>
            {rows.map((row) => {
                const recorded = row.segments.reduce((sum, segment) => sum + segment.n, 0);
                let offset = 0;
                return (
                    <div key={row.key} className='grid grid-cols-[11rem_1fr_2.5rem] items-center gap-x-2'>
                        <span className='report-small text-stone-700'>{row.label}</span>
                        {/* Use SVG for colors that need to appear in print. */}
                        <svg aria-hidden width='100%' height={BAR_HEIGHT} className='block'>
                            <rect x={0} y={0} width='100%' height={BAR_HEIGHT} fill={NO_DATA_COLOR} />
                            {row.segments.map((segment) => {
                                const x = offset;
                                offset += total === 0 ? 0 : (segment.n / total) * 100;
                                return segment.n === 0 ? null : (
                                    <rect
                                        key={segment.key}
                                        x={`${x}%`}
                                        y={0}
                                        width={`${offset - x}%`}
                                        height={BAR_HEIGHT}
                                        fill={segment.color}
                                    />
                                );
                            })}
                        </svg>
                        <span className='report-small text-right text-stone-600 tabular-nums'>
                            {total === 0 ? '—' : formatProportion(recorded / total)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
