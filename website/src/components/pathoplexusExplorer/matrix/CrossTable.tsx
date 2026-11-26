import { useState, type FC } from 'react';

import {
    cellValue,
    MEASURE,
    nextSort,
    OTHER,
    ROW_NAMES,
    TOTAL,
    type Axis,
    type CrossTab,
    type Measure,
    type Sort,
} from '../../../pathoplexusExplorer/dataLayer/queries/crossTab.ts';
import type { Dimension } from '../../../pathoplexusExplorer/dataLayer/queries/dimensions.ts';
import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { SEQUENTIAL } from '../charts/colors.ts';

/** Scale proportions linearly and counts logarithmically against the largest cell. */
function colorOf(value: number, largest: number, measure: Measure): string | undefined {
    if (value <= 0) {
        return undefined;
    }
    const fraction =
        measure === MEASURE.count
            ? Math.log10(1 + value) / Math.log10(1 + Math.max(largest, 10))
            : value / Math.max(largest, Number.EPSILON);
    const step = Math.min(SEQUENTIAL.length - 1, Math.max(0, Math.round(fraction * (SEQUENTIAL.length - 1))));
    return SEQUENTIAL[step];
}

function inkOn(background: string | undefined): string {
    if (background === undefined) {
        return 'text-stone-400';
    }
    return SEQUENTIAL.indexOf(background) >= 4 ? 'text-white' : 'text-stone-900';
}

type CrossTableProps = {
    table: CrossTab;
    rowDimension: Dimension;
    columnDimension: Dimension;
    measure: Measure;
    sort: Sort | undefined;
    onSort: (sort: Sort | undefined) => void;
};

export const CrossTable: FC<CrossTableProps> = ({ table, rowDimension, columnDimension, measure, sort, onSort }) => {
    const [hover, setHover] = useState<{ row: Axis; column: Axis } | undefined>(undefined);
    const largest =
        measure === MEASURE.count
            ? Math.max(1, ...table.cells.values())
            : Math.max(
                  0.01,
                  ...table.rows.flatMap((row) =>
                      table.columns.map((column) => cellValue(table, row, column, measure).value),
                  ),
              );
    const hovered = hover === undefined ? undefined : cellValue(table, hover.row, hover.column, measure);
    return (
        <figure className='report-figure flex min-w-0 flex-col gap-2'>
            <div className='overflow-x-auto'>
                <table className='report-small border-collapse'>
                    <thead>
                        <tr>
                            <th
                                rowSpan={2}
                                className='sticky left-0 z-10 bg-white px-2 py-1 text-left align-bottom'
                                aria-sort={sortState(sort, ROW_NAMES)}
                            >
                                <SortButton
                                    label={rowDimension.label}
                                    title={`Sort the rows by ${rowDimension.label.toLowerCase()}`}
                                    align='justify-start'
                                    width='max-w-48'
                                    sort={sort}
                                    column={ROW_NAMES}
                                    onSort={onSort}
                                />
                            </th>
                            <th
                                colSpan={table.columns.length}
                                className='px-1 pb-1 text-center font-semibold text-stone-500'
                            >
                                {columnDimension.label}
                            </th>
                            <th rowSpan={2} className='px-2 py-1 text-right' aria-sort={sortState(sort, TOTAL)}>
                                <SortButton
                                    label='Total'
                                    title='Sort the rows by the whole row'
                                    align='justify-end'
                                    width=''
                                    sort={sort}
                                    column={TOTAL}
                                    onSort={onSort}
                                />
                            </th>
                        </tr>
                        <tr>
                            {table.columns.map((column) => (
                                <th
                                    key={column.key}
                                    className='px-1 py-1 align-bottom'
                                    aria-sort={sortState(sort, column.key)}
                                >
                                    <SortButton
                                        label={
                                            column.key === OTHER
                                                ? `Other (${formatCount(column.gathered ?? 0)})`
                                                : column.label
                                        }
                                        title={`${column.label} · ${formatCount(column.total)} sequences`}
                                        align='justify-end'
                                        width='max-w-24'
                                        sort={sort}
                                        column={column.key}
                                        onSort={onSort}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row) => (
                            <tr key={row.key}>
                                <th className='sticky left-0 z-10 bg-white px-2 py-1 text-left font-normal'>
                                    <span
                                        className='block max-w-48 truncate font-semibold text-stone-700'
                                        title={`${row.label} · ${formatCount(row.total)} sequences`}
                                    >
                                        {row.key === OTHER ? `Other (${formatCount(row.gathered ?? 0)})` : row.label}
                                    </span>
                                </th>
                                {table.columns.map((column) => {
                                    const cell = cellValue(table, row, column, measure);
                                    const background = colorOf(cell.value, largest, measure);
                                    return (
                                        <td
                                            key={column.key}
                                            className={`border border-white p-0 ${inkOn(background)}`}
                                            style={{ background: background ?? '#f6f5f2' }}
                                            title={`${row.label} and ${column.label}: ${formatCount(cell.count)} sequences`}
                                            onMouseEnter={() => setHover({ row, column })}
                                            onMouseLeave={() => setHover(undefined)}
                                        >
                                            <span className='block h-7 px-2 py-1 text-right tabular-nums'>
                                                {cell.count === 0
                                                    ? ''
                                                    : measure === MEASURE.count
                                                      ? formatCount(cell.count)
                                                      : formatProportion(cell.value)}
                                            </span>
                                        </td>
                                    );
                                })}
                                <td className='px-2 py-1 text-right text-stone-600 tabular-nums'>
                                    {formatCount(row.total)}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <th className='sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold text-stone-500'>
                                Total
                            </th>
                            {table.columns.map((column) => (
                                <td key={column.key} className='px-2 py-1 text-right text-stone-600 tabular-nums'>
                                    {formatCount(column.total)}
                                </td>
                            ))}
                            <td className='px-2 py-1 text-right font-semibold tabular-nums'>
                                {formatCount(table.total)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <figcaption className='report-note min-h-4 text-stone-600'>
                {hovered !== undefined && hover !== undefined && (
                    <>
                        {hover.row.label} and {hover.column.label}: {formatCount(hovered.count)} sequences
                        {measure !== MEASURE.count &&
                            ` — ${formatProportion(hovered.value)} of ${formatCount(hovered.of)}`}
                    </>
                )}
            </figcaption>
        </figure>
    );
};

type SortButtonProps = {
    label: string;
    title: string;
    align: 'justify-start' | 'justify-end';
    width: string;
    column: string;
    sort: Sort | undefined;
    onSort: (sort: Sort | undefined) => void;
};

const SortButton: FC<SortButtonProps> = ({ label, title, align, width, column, sort, onSort }) => {
    const current = sort?.column === column ? sort : undefined;
    return (
        <button
            type='button'
            className={`${width} ${align} flex w-full items-center gap-1 text-left font-semibold ${
                current !== undefined ? 'text-stone-900 underline underline-offset-2' : 'text-stone-700 hover:underline'
            }`}
            title={title}
            onClick={() => onSort(nextSort(sort, column))}
        >
            <span className='min-w-0 truncate'>{label}</span>
            <span aria-hidden className={current === undefined ? 'text-stone-300' : 'text-stone-900'}>
                {current !== undefined && !current.descending ? '▲' : '▼'}
            </span>
        </button>
    );
};

function sortState(sort: Sort | undefined, column: string): 'ascending' | 'descending' | 'none' {
    if (sort?.column !== column) {
        return 'none';
    }
    return sort.descending ? 'descending' : 'ascending';
}
