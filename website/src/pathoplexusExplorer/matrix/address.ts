import {
    MEASURE,
    MEASURES,
    OTHER,
    ROW_NAMES,
    SHOWN_COLUMNS,
    SHOWN_ROWS,
    TOTAL,
    withinLimit,
    type Measure,
    type Sort,
} from './crossTab.ts';
import { formatConstraints, parseConstraints, type Selection } from './selection.ts';
import { parsePeriodKey, periodKey } from '../domain/dates.ts';

export const MATRIX_PATH = '/pathoplexus-explorer/matrix';

export const MATRIX_LABEL = 'Matrix';

const DEFAULT_ROWS = 'country';
const DEFAULT_COLUMNS = 'pathogen';

export type MatrixParams = {
    selection: Selection;
    rows: string;
    columns: string;
    measure: Measure;
    shownRows: number;
    shownColumns: number;
    sort?: Sort;
};

/** Stable URL tokens for special sorting columns. */
const SORT_TOKENS: readonly { token: string; column: string }[] = [
    { token: '(total)', column: TOTAL },
    { token: '(other)', column: OTHER },
    { token: '(names)', column: ROW_NAMES },
];

function parseSort(value: string | null): Sort | undefined {
    if (value === null || value === '') {
        return undefined;
    }
    const descending = value.startsWith('-');
    const column = descending ? value.slice(1) : value;
    if (column === '') {
        return undefined;
    }
    const named = SORT_TOKENS.find((entry) => entry.token === column);
    return { column: named?.column ?? column, descending };
}

function formatSort(sort: Sort | undefined): string | undefined {
    if (sort === undefined) {
        return undefined;
    }
    const named = SORT_TOKENS.find((entry) => entry.column === sort.column);
    return `${sort.descending ? '-' : ''}${named?.token ?? sort.column}`;
}

function limitOf(params: URLSearchParams, name: string, fallback: number): number {
    const value = Number(params.get(name));
    return Number.isFinite(value) && value >= 1 ? withinLimit(value) : fallback;
}

export function parseParams(params: URLSearchParams): MatrixParams {
    const measure = params.get('cell');
    return {
        selection: { dimensions: parseConstraints(params.get('sel')), period: parsePeriodKey(params.get('when')) },
        rows: params.get('rows') ?? DEFAULT_ROWS,
        columns: params.get('cols') ?? DEFAULT_COLUMNS,
        measure: MEASURES.some((entry) => entry.id === measure) ? (measure as Measure) : MEASURE.count,
        shownRows: limitOf(params, 'maxRows', SHOWN_ROWS),
        shownColumns: limitOf(params, 'maxCols', SHOWN_COLUMNS),
        sort: parseSort(params.get('sort')),
    };
}

/** Omit defaults from the canonical Matrix URL. */
export function searchOf(params: MatrixParams): URLSearchParams {
    const search = new URLSearchParams();
    const set = (name: string, value: string | undefined) => {
        if (value !== undefined && value !== '') {
            search.set(name, value);
        }
    };
    set('sel', formatConstraints(params.selection.dimensions));
    set('when', periodKey(params.selection.period));
    set('rows', params.rows === DEFAULT_ROWS ? undefined : params.rows);
    set('cols', params.columns === DEFAULT_COLUMNS ? undefined : params.columns);
    set('cell', params.measure === MEASURE.count ? undefined : params.measure);
    set('maxRows', params.shownRows === SHOWN_ROWS ? undefined : String(params.shownRows));
    set('maxCols', params.shownColumns === SHOWN_COLUMNS ? undefined : String(params.shownColumns));
    set('sort', formatSort(params.sort));
    return search;
}

/** Clear sorting when the column dimension or cell measure changes. */
export function withChange(previous: MatrixParams, change: Partial<MatrixParams>): MatrixParams {
    const next = { ...previous, ...change };
    if ('sort' in change) {
        return next;
    }
    const replaced = next.measure !== previous.measure || next.columns !== previous.columns;
    return replaced ? { ...next, sort: undefined } : next;
}

export function addressOf(params: MatrixParams): string {
    const query = searchOf(params).toString();
    return query === '' ? MATRIX_PATH : `${MATRIX_PATH}?${query}`;
}

export function matrixPageTitle(): string {
    return `${MATRIX_LABEL} | GenSpectrum`;
}
