import { useState, type FC } from 'react';

import type { Filter } from '../../../pathoplexusExplorer/dataLayer/hooks/useMatrix.ts';
import { NOTHING } from '../../../pathoplexusExplorer/dataLayer/queries/dimensions.ts';
import type { Constraint, Constraints } from '../../../pathoplexusExplorer/dataLayer/queries/selection.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { SEQUENTIAL } from '../ui/colors.ts';

const SHOWN = 10;

type FilterRailProps = {
    filters: readonly Filter[];
    constraints: Constraints;
    isLoading: boolean;
    error: Error | null;
    onToggle: (dimension: string, value: string) => void;
    onClear: (dimension: string) => void;
    onInvert: (dimension: string) => void;
};

/** Count the options for a filter without applying its own selection. */
export const FilterRail: FC<FilterRailProps> = ({
    filters,
    constraints,
    isLoading,
    error,
    onToggle,
    onClear,
    onInvert,
}) => {
    // Collapse filters by default on narrow screens.
    const [open, setOpen] = useState(false);
    return (
        <aside className='no-print w-full shrink-0 border-stone-300 bg-white lg:w-64 lg:border-r'>
            <div className='border-b border-stone-200 px-3 py-2'>
                <h2 className='report-label font-semibold tracking-wider text-stone-500 uppercase'>
                    <button
                        type='button'
                        aria-expanded={open}
                        className='flex w-full items-center justify-between lg:cursor-default'
                        onClick={() => setOpen(!open)}
                    >
                        <span>Filters</span>
                        <span aria-hidden className='lg:hidden'>
                            {open ? '▴' : '▾'}
                        </span>
                    </button>
                </h2>
            </div>
            <div className={open ? undefined : 'hidden lg:block'}>
                {error !== null && (
                    <p role='alert' className='px-3 py-2 text-[11px] leading-snug text-red-800'>
                        The filters could not be counted: {error.message}
                    </p>
                )}
                {filters.map((filter) => (
                    <FilterBlock
                        key={filter.dimension.id}
                        filter={filter}
                        constraint={constraints[filter.dimension.id]}
                        isLoading={isLoading}
                        onToggle={(value) => onToggle(filter.dimension.id, value)}
                        onClear={() => onClear(filter.dimension.id)}
                        onInvert={() => onInvert(filter.dimension.id)}
                    />
                ))}
            </div>
        </aside>
    );
};

type FilterBlockProps = {
    filter: Filter;
    constraint: Constraint | undefined;
    isLoading: boolean;
    onToggle: (value: string) => void;
    onClear: () => void;
    onInvert: () => void;
};

const FilterBlock: FC<FilterBlockProps> = ({ filter, constraint, isLoading, onToggle, onClear, onInvert }) => {
    const [open, setOpen] = useState(false);
    const chosen = constraint?.values ?? [];
    const excluded = constraint?.exclude === true;
    const values = open ? filter.values : filter.values.slice(0, SHOWN);
    const largest = Math.max(1, ...filter.values.map((value) => value.n));
    return (
        <section className='border-b border-stone-200 px-3 py-2'>
            <header className='flex items-baseline justify-between gap-2'>
                <h3 className='text-xs font-semibold text-stone-800'>{filter.dimension.label}</h3>
                {chosen.length > 0 && (
                    <span className='flex items-center gap-2 text-[11px]'>
                        <button
                            type='button'
                            className={`underline underline-offset-2 ${excluded ? 'font-semibold text-red-800' : 'text-stone-500'}`}
                            title={excluded ? 'Keep these values' : 'Keep everything but these values'}
                            onClick={onInvert}
                        >
                            {excluded ? 'excluded' : 'invert'}
                        </button>
                        <button type='button' className='text-stone-500 underline underline-offset-2' onClick={onClear}>
                            clear
                        </button>
                    </span>
                )}
            </header>
            <ul className={`mt-1 flex flex-col ${isLoading ? 'opacity-50' : ''}`}>
                {filter.values.length === 0 && <li className='py-1 text-[11px] text-stone-500'>Nothing.</li>}
                {values.map((value) => {
                    const active = chosen.includes(value.value);
                    return (
                        <li key={value.value}>
                            <button
                                type='button'
                                aria-pressed={active}
                                className={`group flex w-full items-center gap-2 py-[3px] text-left text-xs ${
                                    active ? 'font-semibold text-stone-900' : 'text-stone-700 hover:text-stone-900'
                                }`}
                                onClick={() => onToggle(value.value)}
                            >
                                <span
                                    aria-hidden
                                    className={`inline-block h-2.5 w-2.5 shrink-0 border ${
                                        active
                                            ? excluded
                                                ? 'border-red-700 bg-red-700'
                                                : 'border-primary bg-primary'
                                            : 'border-stone-400 group-hover:border-stone-600'
                                    }`}
                                />
                                <span
                                    className='min-w-0 flex-1 truncate'
                                    title={value.label}
                                    style={value.depth > 0 ? { paddingLeft: value.depth * 10 } : undefined}
                                >
                                    {value.value === NOTHING ? <em>{value.label}</em> : value.label}
                                </span>
                                <svg aria-hidden width={40} height={8} className='shrink-0'>
                                    <rect x={0} y={0} width={40} height={8} fill='#f0efec' />
                                    <rect
                                        x={0}
                                        y={0}
                                        width={(value.n / largest) * 40}
                                        height={8}
                                        fill={SEQUENTIAL[0]}
                                    />
                                </svg>
                                <span className='w-12 shrink-0 text-right text-stone-500 tabular-nums'>
                                    {formatCount(value.n)}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {filter.values.length > SHOWN && (
                <button
                    type='button'
                    className='text-primary mt-1 text-[11px] underline underline-offset-2'
                    onClick={() => setOpen(!open)}
                >
                    {open ? 'show fewer' : `all ${formatCount(filter.values.length)} values`}
                </button>
            )}
        </section>
    );
};
