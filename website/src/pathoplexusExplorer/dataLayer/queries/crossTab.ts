import { labelOf, type Dimension } from './dimensions.ts';
import type { RhydbRow } from '../transport/row.ts';

export const OTHER = '\u0001';

export const TOTAL = '\u0002';

export const ROW_NAMES = '\u0003';

export type Sort = { column: string; descending: boolean };

export type Axis = {
    key: string;
    label: string;
    total: number;
    gathered?: number;
};

export type CrossTab = {
    rows: Axis[];
    columns: Axis[];
    cells: Map<string, Map<string, number>>;
    total: number;
};

export const SHOWN_ROWS = 18;
export const SHOWN_COLUMNS = 14;

export const MOST_SHOWN = 200;

export function withinLimit(value: number): number {
    return Math.min(MOST_SHOWN, Math.max(1, Math.floor(value)));
}

type CompareAxis = (a: Axis, b: Axis) => number;

function axisOf(
    totals: Map<string, number>,
    dimension: Dimension,
    rows: readonly RhydbRow[],
    limit: number,
    compare?: CompareAxis,
): Axis[] {
    const labels = new Map<string, string>();
    if (dimension.labelFromRow !== undefined) {
        for (const row of rows) {
            const label = dimension.labelFromRow(row);
            if (label !== undefined) {
                labels.set(dimension.valueOf(row), label);
            }
        }
    }
    const values = Array.from(totals, ([key, total]) => ({
        key,
        total,
        label: labels.get(key) ?? labelOf(dimension, key),
    }));
    const order = dimension.order;
    values.sort(compare ?? (order === undefined ? (a, b) => b.total - a.total : (a, b) => order(a.key, b.key)));
    const kept = values.slice(0, limit);
    if (dimension.fromTheEnd === true && compare === undefined) {
        kept.reverse();
    }
    const rest = values.slice(limit);
    if (rest.length > 0) {
        const other = {
            key: OTHER,
            label: 'Other',
            total: rest.reduce((sum, entry) => sum + entry.total, 0),
            gathered: rest.length,
        };
        if (dimension.fromTheEnd === true) {
            kept.unshift(other);
        } else {
            kept.push(other);
        }
    }
    return kept;
}

function increment(counts: Map<string, number>, key: string, n: number) {
    counts.set(key, (counts.get(key) ?? 0) + n);
}

function addCell(cells: CrossTab['cells'], row: string, column: string, n: number) {
    let counts = cells.get(row);
    if (counts === undefined) {
        counts = new Map();
        cells.set(row, counts);
    }
    increment(counts, column, n);
}

export function crossTabOf(options: {
    rows: readonly RhydbRow[];
    rowDimension: Dimension;
    columnDimension: Dimension;
    shownRows?: number;
    shownColumns?: number;
    sort?: Sort;
}): CrossTab {
    const { rows, rowDimension, columnDimension, shownRows = SHOWN_ROWS, shownColumns = SHOWN_COLUMNS, sort } = options;
    const rowTotals = new Map<string, number>();
    const columnTotals = new Map<string, number>();
    const cells: CrossTab['cells'] = new Map();
    let total = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        if (n === 0) {
            continue;
        }
        const rowKey = rowDimension.valueOf(row);
        const columnKey = columnDimension.valueOf(row);
        increment(rowTotals, rowKey, n);
        increment(columnTotals, columnKey, n);
        addCell(cells, rowKey, columnKey, n);
        total += n;
    }
    const columns = axisOf(columnTotals, columnDimension, rows, shownColumns);
    const columnKeys = new Set(columns.map((entry) => entry.key));
    // Fold hidden columns before sorting, so a sort by Other uses its displayed count.
    if (columnTotals.size > shownColumns) {
        for (const counts of cells.values()) {
            for (const [column, n] of counts) {
                if (!columnKeys.has(column)) {
                    increment(counts, OTHER, n);
                    counts.delete(column);
                }
            }
        }
    }
    const visibleRows = axisOf(rowTotals, rowDimension, rows, shownRows, compareRows(sort, columnKeys, cells));
    const rowKeys = new Set(visibleRows.map((row) => row.key));
    for (const [key, counts] of cells) {
        if (!rowKeys.has(key)) {
            for (const [column, n] of counts) {
                addCell(cells, OTHER, column, n);
            }
            cells.delete(key);
        }
    }
    return { rows: visibleRows, columns, cells, total };
}

/** Sort by sequence counts regardless of the selected measure. */
function compareRows(
    sort: Sort | undefined,
    columnKeys: Set<string>,
    cells: CrossTab['cells'],
): CompareAxis | undefined {
    if (sort === undefined) {
        return undefined;
    }
    const { column, descending } = sort;
    const direction = descending ? -1 : 1;
    if (column === ROW_NAMES) {
        return (a, b) => direction * a.label.localeCompare(b.label);
    }
    if (column === TOTAL) {
        return (a, b) => direction * (a.total - b.total);
    }
    if (!columnKeys.has(column) && column !== OTHER) {
        return undefined;
    }
    const count = (row: Axis) => cells.get(row.key)?.get(column) ?? 0;
    return (a, b) => direction * (count(a) - count(b));
}

export function nextSort(sort: Sort | undefined, column: string): Sort | undefined {
    const first = column !== ROW_NAMES;
    if (sort?.column !== column) {
        return { column, descending: first };
    }
    return sort.descending === first ? { column, descending: !first } : undefined;
}

export const MEASURE = {
    count: 'count',
    row: 'row',
    column: 'column',
    all: 'all',
} as const;
export type Measure = (typeof MEASURE)[keyof typeof MEASURE];

export const MEASURES: readonly { id: Measure; label: string; hint: string }[] = [
    { id: MEASURE.count, label: 'Sequences', hint: 'How many sequences fall in the row and the column' },
    { id: MEASURE.row, label: '% of row', hint: "Each cell as a proportion of its row's sequences" },
    { id: MEASURE.column, label: '% of column', hint: "Each cell as a proportion of its column's sequences" },
    { id: MEASURE.all, label: '% of table', hint: 'Each cell as a proportion of the whole selection' },
];

export function cellValue(
    table: CrossTab,
    row: Axis,
    column: Axis,
    measure: Measure,
): { value: number; count: number; of: number } {
    const count = table.cells.get(row.key)?.get(column.key) ?? 0;
    const of = measure === MEASURE.row ? row.total : measure === MEASURE.column ? column.total : table.total;
    if (measure === MEASURE.count) {
        return { value: count, count, of: table.total };
    }
    return { value: of === 0 ? 0 : count / of, count, of };
}
