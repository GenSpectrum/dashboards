import { useEffect, useState, type FC, type ReactNode } from 'react';

import {
    MEASURES,
    MOST_SHOWN,
    withinLimit,
    type Measure,
} from '../../../pathoplexusExplorer/dataLayer/queries/crossTab.ts';
import { labelOf, type Dimension } from '../../../pathoplexusExplorer/dataLayer/queries/dimensions.ts';
import type { Selection } from '../../../pathoplexusExplorer/dataLayer/queries/selection.ts';
import { formatDate } from '../../../pathoplexusExplorer/domain/dates.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import type { MatrixParams } from '../../../pathoplexusExplorer/pageState/matrixAddress.ts';
import { constrainedCount } from '../../../pathoplexusExplorer/pageState/matrixSelection.ts';
import { Picker } from '../ui/Picker.tsx';

type MatrixBarProps = {
    dimensions: readonly Dimension[];
    axes: readonly Dimension[];
    rowDimension: Dimension;
    columnDimension: Dimension;
    measure: Measure;
    shownRows: number;
    shownColumns: number;
    total: number | undefined;
    selection: Selection;
    download: ReactNode;
    onChange: (change: Partial<MatrixParams>) => void;
    onClearAll: () => void;
    onClearDimension: (dimension: string) => void;
    onClearPeriod: () => void;
};

export const MatrixBar: FC<MatrixBarProps> = ({
    dimensions,
    axes,
    rowDimension,
    columnDimension,
    measure,
    shownRows,
    shownColumns,
    total,
    selection,
    download,
    onChange,
    onClearAll,
    onClearDimension,
    onClearPeriod,
}) => {
    const options = axes.map((dimension) => ({ value: dimension.id, label: dimension.label }));
    const constrained = constrainedCount(selection.dimensions) + (periodLabel(selection.period) === undefined ? 0 : 1);
    return (
        <div className='no-print sticky top-0 z-20 flex flex-col border-b border-stone-300 bg-stone-50'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 px-4 py-1.5'>
                <Picker
                    label='Rows'
                    value={rowDimension.id}
                    placeholder='choose one'
                    options={options}
                    onSelect={(value) => onChange({ rows: value ?? rowDimension.id })}
                />
                <Picker
                    label='Columns'
                    value={columnDimension.id}
                    placeholder='choose one'
                    options={options}
                    onSelect={(value) => onChange({ columns: value ?? columnDimension.id })}
                />
                <button
                    type='button'
                    className='border border-stone-300 bg-white px-2 py-1 text-[13px] hover:border-stone-500'
                    onClick={() => onChange({ rows: columnDimension.id, columns: rowDimension.id })}
                >
                    Swap
                </button>
                <span className='flex flex-wrap items-center gap-1'>
                    <span className='text-[11px] text-stone-500'>Cells</span>
                    {MEASURES.map((entry) => (
                        <button
                            key={entry.id}
                            type='button'
                            title={entry.hint}
                            aria-pressed={measure === entry.id}
                            className={`border px-2 py-1 text-[13px] ${
                                measure === entry.id
                                    ? 'border-stone-800 bg-stone-800 text-white'
                                    : 'border-stone-300 bg-white hover:border-stone-500'
                            }`}
                            onClick={() => onChange({ measure: entry.id })}
                        >
                            {entry.label}
                        </button>
                    ))}
                </span>
                <LimitField label='Max rows' value={shownRows} onChange={(value) => onChange({ shownRows: value })} />
                <LimitField
                    label='Max columns'
                    value={shownColumns}
                    onChange={(value) => onChange({ shownColumns: value })}
                />
                <span className='flex-1' />
                <span className='flex items-center gap-2'>{download}</span>
            </div>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-stone-200 px-4 py-1.5 text-xs'>
                <h1 className='font-semibold'>{total === undefined ? '…' : formatCount(total)} sequences</h1>
                {constrained > 0 && (
                    <>
                        {dimensions.map((dimension) => {
                            const constraint = selection.dimensions[dimension.id];
                            if (constraint === undefined || constraint.values.length === 0) {
                                return null;
                            }
                            return (
                                <span
                                    key={dimension.id}
                                    className='inline-flex max-w-full items-center gap-1 border border-stone-300 bg-white px-1.5 py-0.5'
                                >
                                    <span className='text-stone-500'>
                                        {dimension.label}
                                        {constraint.exclude === true ? ' is not' : ''}
                                    </span>
                                    <span className='min-w-0 truncate'>
                                        {constraint.values.map((value) => labelOf(dimension, value)).join(', ')}
                                    </span>
                                    <button
                                        type='button'
                                        aria-label={`Clear ${dimension.label}`}
                                        className='px-0.5 text-stone-500 hover:text-stone-900'
                                        onClick={() => onClearDimension(dimension.id)}
                                    >
                                        ×
                                    </button>
                                </span>
                            );
                        })}
                        {periodLabel(selection.period) !== undefined && (
                            <span className='inline-flex items-center gap-1 border border-stone-300 bg-white px-1.5 py-0.5'>
                                <span className='text-stone-500'>Collected</span>
                                <span>{periodLabel(selection.period)}</span>
                                <button
                                    type='button'
                                    aria-label='Clear the collection period'
                                    className='px-0.5 text-stone-500 hover:text-stone-900'
                                    onClick={onClearPeriod}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        <button
                            type='button'
                            className='text-stone-500 underline underline-offset-2'
                            onClick={onClearAll}
                        >
                            clear the filters
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

type LimitFieldProps = { label: string; value: number; onChange: (value: number) => void };

/** Update the table with a clamped limit on blur or Enter. */
const LimitField: FC<LimitFieldProps> = ({ label, value, onChange }) => {
    const [typed, setTyped] = useState(String(value));
    useEffect(() => setTyped(String(value)), [value]);
    const commit = () => {
        const parsed = Number(typed);
        const next = typed.trim() === '' || !Number.isFinite(parsed) ? value : withinLimit(parsed);
        setTyped(String(next));
        if (next !== value) {
            onChange(next);
        }
    };
    return (
        <label className='flex items-center gap-1 text-[11px] text-stone-500'>
            {label}
            <input
                type='number'
                min={1}
                max={MOST_SHOWN}
                step={1}
                className='w-14 border border-stone-300 bg-white px-1.5 py-1 text-[13px] text-stone-900'
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        commit();
                        event.currentTarget.blur();
                    }
                }}
            />
        </label>
    );
};

function periodLabel(period: Period): string | undefined {
    if (period.from === undefined && period.to === undefined) {
        return undefined;
    }
    if (period.from !== undefined && period.to !== undefined) {
        return `${formatDate(period.from)} to ${formatDate(period.to)}`;
    }
    return period.from !== undefined ? `from ${formatDate(period.from)}` : `up to ${formatDate(period.to)}`;
}
