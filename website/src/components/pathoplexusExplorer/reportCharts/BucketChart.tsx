import { useState, type FC, type ReactNode } from 'react';

import { Tooltip } from './Tooltip.tsx';
import { useWidth } from './useWidth.ts';
import { bucketLabel, bucketTick } from '../../../pathoplexusExplorer/domain/dates.ts';

const MARGIN = { top: 8, right: 10, bottom: 26, left: 52 };
const TITLED_MARGIN = { top: 8, right: 10, bottom: 42, left: 64 };

export type BucketFrame = {
    innerWidth: number;
    innerHeight: number;
    step: number;
    x: (index: number) => number;
    y: (value: number) => number;
};

type BucketChartProps = {
    buckets: readonly string[];
    height: number;
    ariaLabel: string;
    top: number;
    ticks: readonly { value: number; label: string }[];
    xTitle?: string;
    yTitle?: string;
    tooltip: (index: number) => ReactNode;
    children: (frame: BucketFrame) => ReactNode;
};

export const BucketChart: FC<BucketChartProps> = ({
    buckets,
    height,
    ariaLabel,
    top,
    ticks,
    xTitle,
    yTitle,
    tooltip,
    children,
}) => {
    const [ref, width] = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<{ index: number; x: number; y: number } | undefined>();
    const margin = xTitle === undefined && yTitle === undefined ? MARGIN : TITLED_MARGIN;
    const innerWidth = Math.max(10, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;
    const step = innerWidth / Math.max(1, buckets.length);
    const frame: BucketFrame = {
        innerWidth,
        innerHeight,
        step,
        x: (index) => index * step + step / 2,
        y: (value) => innerHeight - (Math.min(value, top) / top) * innerHeight,
    };

    return (
        <div ref={ref} className='relative w-full'>
            <svg
                width={width}
                height={height}
                role='img'
                aria-label={ariaLabel}
                onMouseLeave={() => setHover(undefined)}
                onMouseMove={(event) => {
                    const box = event.currentTarget.getBoundingClientRect();
                    const position = event.clientX - box.left;
                    const index = Math.floor((position - margin.left) / step);
                    setHover(
                        index >= 0 && index < buckets.length
                            ? { index, x: position, y: event.clientY - box.top }
                            : undefined,
                    );
                }}
            >
                <g transform={`translate(${margin.left},${margin.top})`}>
                    {ticks.map((tick) => (
                        <g key={tick.value}>
                            <line
                                x1={0}
                                x2={innerWidth}
                                y1={frame.y(tick.value)}
                                y2={frame.y(tick.value)}
                                stroke={tick.value === 0 ? '#c3c2b7' : '#e1e0d9'}
                            />
                            <text
                                x={-6}
                                y={frame.y(tick.value)}
                                dy='0.32em'
                                textAnchor='end'
                                className='chart-label fill-stone-500'
                            >
                                {tick.label}
                            </text>
                        </g>
                    ))}
                    {hover !== undefined && (
                        <rect x={hover.index * step} y={0} width={step} height={innerHeight} fill='#f0efec' />
                    )}
                    {children(frame)}
                    {buckets.map((bucket, index) => {
                        const tick = bucketTick(bucket, index, buckets.length);
                        return tick === '' ? null : (
                            <text
                                key={bucket}
                                x={frame.x(index)}
                                y={innerHeight + 16}
                                textAnchor='middle'
                                className='chart-label fill-stone-500'
                            >
                                {tick}
                            </text>
                        );
                    })}
                    {xTitle !== undefined && (
                        <text
                            x={innerWidth / 2}
                            y={innerHeight + 34}
                            textAnchor='middle'
                            className='chart-label fill-stone-600'
                        >
                            {xTitle}
                        </text>
                    )}
                    {yTitle !== undefined && (
                        <text
                            transform={`translate(${14 - margin.left},${innerHeight / 2}) rotate(-90)`}
                            textAnchor='middle'
                            className='chart-label fill-stone-600'
                        >
                            {yTitle}
                        </text>
                    )}
                </g>
            </svg>
            {hover !== undefined && (
                <Tooltip x={hover.x} y={hover.y} width={width}>
                    <div className='mb-1 font-semibold'>{bucketLabel(buckets[hover.index])}</div>
                    {tooltip(hover.index)}
                </Tooltip>
            )}
        </div>
    );
};
