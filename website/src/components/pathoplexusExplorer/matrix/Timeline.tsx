import { useMemo, useRef, useState, type FC } from 'react';

import { bucketAxisOf, countsPerBucket } from '../../../pathoplexusExplorer/dataLayer/queries/timeSeries.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { bucketLabel, bucketRange } from '../../../pathoplexusExplorer/domain/dates.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { SEQUENTIAL } from '../charts/colors.ts';

const HEIGHT = 72;

type TimelineProps = {
    rows: readonly RhydbRow[];
    period: Period;
    isLoading: boolean;
    onPeriod: (period: Period) => void;
};

export const Timeline: FC<TimelineProps> = ({ rows, period, isLoading, onPeriod }) => {
    const bars = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<{ anchor: number; head: number } | undefined>(undefined);

    const model = useMemo(() => {
        const axis = bucketAxisOf({ rows });
        if (axis === undefined) {
            return undefined;
        }
        const counted = countsPerBucket(rows, axis.buckets, axis.granularity);
        return { ...axis, ...counted, largest: Math.max(1, ...counted.counts) };
    }, [rows]);

    if (model === undefined) {
        return (
            <p className='text-xs text-stone-500'>
                {isLoading ? 'Counting the collection dates…' : 'No sequence in the selection has a collection date.'}
            </p>
        );
    }

    const bucketAt = (clientX: number): number => {
        const box = bars.current?.getBoundingClientRect();
        if (box === undefined) {
            return 0;
        }
        const across = Math.min(0.999, Math.max(0, (clientX - box.left) / box.width));
        return Math.floor(across * model.buckets.length);
    };
    const choose = (anchor: number, head: number) => {
        const first = model.buckets[Math.min(anchor, head)];
        const last = model.buckets[Math.max(anchor, head)];
        onPeriod({ from: bucketRange(first).from, to: bucketRange(last).to });
    };
    const inPeriod = (index: number): boolean => {
        if (drag !== undefined) {
            return index >= Math.min(drag.anchor, drag.head) && index <= Math.max(drag.anchor, drag.head);
        }
        if (period.from === undefined && period.to === undefined) {
            return true;
        }
        const range = bucketRange(model.buckets[index]);
        return (
            (period.from === undefined || range.to >= period.from) &&
            (period.to === undefined || range.from <= period.to)
        );
    };
    const notDrawn = model.undated + model.imprecise + model.offAxis;

    return (
        <figure className={`report-figure flex flex-col gap-1 ${isLoading ? 'opacity-50' : ''}`}>
            <figcaption className='report-label flex items-baseline justify-between font-semibold tracking-wider text-stone-500 uppercase'>
                <span>Collection date</span>
                <span className='font-normal normal-case'>Drag across the bars to choose a period</span>
            </figcaption>
            <div
                ref={bars}
                role='group'
                aria-label='Collection period'
                tabIndex={0}
                className='flex touch-none items-end gap-px select-none'
                style={{ height: HEIGHT }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const index = bucketAt(event.clientX);
                    setDrag({ anchor: index, head: index });
                }}
                onPointerMove={(event) => {
                    if (drag !== undefined) {
                        setDrag({ ...drag, head: bucketAt(event.clientX) });
                    }
                }}
                onPointerUp={(event) => {
                    if (drag !== undefined) {
                        choose(drag.anchor, bucketAt(event.clientX));
                        setDrag(undefined);
                    }
                }}
                onPointerCancel={() => setDrag(undefined)}
                // The timeline bars form the collection period control and support keyboard input.
                onKeyDown={(event) => {
                    const last = model.buckets.length - 1;
                    const chosen = model.buckets.map((_, index) => inPeriod(index));
                    const first = chosen.indexOf(true);
                    const final = chosen.lastIndexOf(true);
                    if (event.key === 'Escape') {
                        onPeriod({});
                    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                        const step = event.key === 'ArrowRight' ? 1 : -1;
                        const start = first < 0 ? last : first;
                        const end = Math.max(0, Math.min(last, (final < 0 ? last : final) + step));
                        choose(Math.min(start, end), end);
                    } else if (event.key === 'Home') {
                        choose(0, final < 0 ? last : final);
                    } else if (event.key === 'End') {
                        choose(first < 0 ? 0 : first, last);
                    } else {
                        return;
                    }
                    event.preventDefault();
                }}
            >
                {model.buckets.map((bucket, index) => (
                    <div
                        key={bucket}
                        title={`${bucketLabel(bucket)}: ${formatCount(model.counts[index])} sequences`}
                        className='flex-1'
                        style={{
                            height: `${Math.max(model.counts[index] > 0 ? 2 : 0, (model.counts[index] / model.largest) * 100)}%`,
                            background: inPeriod(index) ? SEQUENTIAL[5] : '#d6d3cb',
                        }}
                    />
                ))}
            </div>
            <div className='report-note flex justify-between text-stone-500'>
                <span>{bucketLabel(model.buckets[0])}</span>
                <span>{bucketLabel(model.buckets.at(-1) ?? '')}</span>
            </div>
            <figcaption className='report-note min-h-4 text-stone-600'>
                {notDrawn > 0 &&
                    `${formatCount(notDrawn)} ${notDrawn === 1 ? 'sequence' : 'sequences'} could not be shown.`}
            </figcaption>
        </figure>
    );
};
