import { labelOf, type Dimension } from './dimensions.ts';
import type { RhydbRow } from '../rhydb/transport/row.ts';

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
    cells: Map<string, number>;
    total: number;
};

/** Use a separator that cannot appear in either dimension value. */
const SEPARATOR = '\u001f';

function cellKey(row: string, column: string): string {
    return `${row}${SEPARATOR}${column}`;
}

export const SHOWN_ROWS = 18;
export const SHOWN_COLUMNS = 14;

export const MOST_SHOWN = 200;

export function withinLimit(value: number): number {
    return Math.min(MOST_SHOWN, Math.max(1, Math.floor(value)));
}

function labelsOf(dimension: Dimension, rows: readonly RhydbRow[]): Map<string, string> {
    const labels = new Map<string, string>();
    if (dimension.labelFromRow === undefined) {
        return labels;
    }
    for (const row of rows) {
        const label = dimension.labelFromRow(row);
        if (label !== undefined) {
            labels.set(dimension.valueOf(row), label);
        }
    }
    return labels;
}

function axisOf(options: {
    totals: Map<string, number>;
    dimension: Dimension;
    labels: Map<string, string>;
    limit: number;
    by?: Ordering;
}): Axis[] {
    const { totals, dimension, labels, limit, by } = options;
    const order = dimension.order;
    const labelFor = (key: string) => labels.get(key) ?? labelOf(dimension, key);
    const entries = [...totals.entries()].sort(
        by !== undefined
            ? (a, b) => {
                  const first = by.keyOf(a[0], labelFor(a[0]));
                  const second = by.keyOf(b[0], labelFor(b[0]));
                  const difference =
                      typeof first === 'string' && typeof second === 'string'
                          ? first.localeCompare(second)
                          : Number(first) - Number(second);
                  return by.descending ? -difference : difference;
              }
            : order === undefined
              ? (a, b) => b[1] - a[1]
              : (a, b) => order(a[0], b[0]),
    );
    const kept = entries.slice(0, limit);
    const rest = entries.slice(limit);
    // Keep the most recent values when truncating an axis ordered by year.
    const axis = (dimension.fromTheEnd === true && by === undefined ? [...kept].reverse() : kept).map(
        ([key, total]) => ({
            key,
            label: labels.get(key) ?? labelOf(dimension, key),
            total,
        }),
    );
    if (rest.length > 0) {
        const other = {
            key: OTHER,
            label: 'Other',
            total: rest.reduce((sum, [, total]) => sum + total, 0),
            gathered: rest.length,
        };
        if (dimension.fromTheEnd === true) {
            axis.unshift(other);
        } else {
            axis.push(other);
        }
    }
    return axis;
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
    const counted = new Map<string, number>();
    let total = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        if (n === 0) {
            continue;
        }
        const rowKey = rowDimension.valueOf(row);
        const columnKey = columnDimension.valueOf(row);
        rowTotals.set(rowKey, (rowTotals.get(rowKey) ?? 0) + n);
        columnTotals.set(columnKey, (columnTotals.get(columnKey) ?? 0) + n);
        const key = cellKey(rowKey, columnKey);
        counted.set(key, (counted.get(key) ?? 0) + n);
        total += n;
    }
    // Lay out the columns first so sorting by the Other column uses the same values shown in the table.
    const axisColumns = axisOf({
        totals: columnTotals,
        dimension: columnDimension,
        labels: labelsOf(columnDimension, rows),
        limit: shownColumns,
    });
    const columnKeys = new Set(axisColumns.map((entry) => entry.key));
    const axisRows = axisOf({
        totals: rowTotals,
        dimension: rowDimension,
        labels: labelsOf(rowDimension, rows),
        limit: shownRows,
        by: orderBy(sort, { counted, columnKeys, rowTotals }),
    });
    const rowKeys = new Set(axisRows.map((entry) => entry.key));
    const cells = new Map<string, number>();
    for (const [key, n] of counted) {
        const [rowKey, columnKey] = key.split(SEPARATOR);
        const target = cellKey(rowKeys.has(rowKey) ? rowKey : OTHER, columnKeys.has(columnKey) ? columnKey : OTHER);
        cells.set(target, (cells.get(target) ?? 0) + n);
    }
    return { rows: axisRows, columns: axisColumns, cells, total };
}

type Ordering = { keyOf: (key: string, label: string) => number | string; descending: boolean };

/** Sort by sequence counts regardless of the selected cell measure. */
function orderBy(
    sort: Sort | undefined,
    table: { counted: Map<string, number>; columnKeys: Set<string>; rowTotals: Map<string, number> },
): Ordering | undefined {
    if (sort === undefined) {
        return undefined;
    }
    const { counted, columnKeys, rowTotals } = table;
    if (sort.column === ROW_NAMES) {
        return { keyOf: (_key, label) => label, descending: sort.descending };
    }
    if (sort.column === TOTAL) {
        return { keyOf: (key) => rowTotals.get(key) ?? 0, descending: sort.descending };
    }
    if (sort.column === OTHER) {
        const others = new Map<string, number>();
        for (const [cell, n] of counted) {
            const [rowKey, columnKey] = cell.split(SEPARATOR);
            if (!columnKeys.has(columnKey)) {
                others.set(rowKey, (others.get(rowKey) ?? 0) + n);
            }
        }
        return { keyOf: (key) => others.get(key) ?? 0, descending: sort.descending };
    }
    if (!columnKeys.has(sort.column)) {
        return undefined;
    }
    return { keyOf: (key) => counted.get(cellKey(key, sort.column)) ?? 0, descending: sort.descending };
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
    const count = table.cells.get(cellKey(row.key, column.key)) ?? 0;
    const of = measure === MEASURE.row ? row.total : measure === MEASURE.column ? column.total : table.total;
    if (measure === MEASURE.count) {
        return { value: count, count, of: table.total };
    }
    return { value: of === 0 ? 0 : count / of, count, of };
}
