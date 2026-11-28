import type { FC } from 'react';

import { Popover } from './Picker.tsx';
import { formatDate } from '../../../pathoplexusExplorer/domain/dates.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';

const QUICK: readonly { label: string; period: Period }[] = [
    { label: 'All dates', period: {} },
    { label: 'Last year', period: { from: since(1) } },
    { label: 'Last 2 years', period: { from: since(2) } },
    { label: 'Last 5 years', period: { from: since(5) } },
    { label: 'Last 10 years', period: { from: since(10) } },
];

function since(years: number): string {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - years);
    return date.toISOString().slice(0, 10);
}

function periodSummary(period: Period): string | undefined {
    const quick = QUICK.find(
        (entry) => entry.period.from === period.from && entry.period.to === period.to && entry.label !== 'All dates',
    );
    if (quick !== undefined) {
        return quick.label;
    }
    if (period.from === undefined && period.to === undefined) {
        return undefined;
    }
    if (period.from !== undefined && period.to !== undefined) {
        return `${formatDate(period.from)} – ${formatDate(period.to)}`;
    }
    return period.from !== undefined ? `from ${formatDate(period.from)}` : `up to ${formatDate(period.to)}`;
}

type PeriodControlProps = { period: Period; onChange: (period: Period) => void };

export const PeriodControl: FC<PeriodControlProps> = ({ period, onChange }) => {
    const current = JSON.stringify(period);
    return (
        <Popover label='Collection dates' value={periodSummary(period)} placeholder='All' width='w-64'>
            {(close) => (
                <div className='flex flex-col gap-2 p-2'>
                    <div className='flex flex-wrap gap-1'>
                        {QUICK.map((entry) => (
                            <button
                                key={entry.label}
                                type='button'
                                aria-pressed={JSON.stringify(entry.period) === current}
                                className={`border px-2 py-1 text-xs ${
                                    JSON.stringify(entry.period) === current
                                        ? 'border-stone-800 bg-stone-800 text-white'
                                        : 'border-stone-300 bg-white text-stone-700'
                                }`}
                                onClick={() => {
                                    onChange(entry.period);
                                    close();
                                }}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                    <label className='flex items-center gap-1 text-xs'>
                        {/* Constrain each date using the other end of the range. */}
                        <input
                            type='date'
                            aria-label='Collected from'
                            max={period.to}
                            className='min-w-0 flex-1 border border-stone-300 bg-white px-1.5 py-1'
                            value={period.from ?? ''}
                            onChange={(event) => onChange({ ...period, from: event.target.value || undefined })}
                        />
                        <span className='text-stone-500'>to</span>
                        <input
                            type='date'
                            aria-label='Collected to'
                            min={period.from}
                            className='min-w-0 flex-1 border border-stone-300 bg-white px-1.5 py-1'
                            value={period.to ?? ''}
                            onChange={(event) => onChange({ ...period, to: event.target.value || undefined })}
                        />
                    </label>
                </div>
            )}
        </Popover>
    );
};
