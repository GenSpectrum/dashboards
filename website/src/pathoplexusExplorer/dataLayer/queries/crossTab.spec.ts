import { describe, expect, test } from 'vitest';

import { cellValue, crossTabOf, MEASURE, nextSort, OTHER, ROW_NAMES, TOTAL } from './crossTab.ts';
import { dimensionById, dimensionsFor, NOTHING } from './dimensions.ts';
import { COLUMNS } from './scope.ts';
import { CATALOG } from '../../domain/catalog.ts';
import { defined } from '../../test/defined.fixture.ts';
import type { RhydbRow } from '../transport/row.ts';

const DIMENSIONS = dimensionsFor({ catalog: CATALOG, tables: ['mpox'] });
const country = defined(dimensionById(DIMENSIONS, 'country'), 'the country dimension');
const host = defined(dimensionById(DIMENSIONS, 'host'), 'the host dimension');

function row(name: string | null, hostName: string | null, n: number): RhydbRow {
    return { [COLUMNS.country]: name, [COLUMNS.host]: hostName, [COLUMNS.hostTaxon]: null, n };
}

describe('a cross-tab', () => {
    const table = crossTabOf({
        rows: [
            row('Brazil', 'Homo sapiens', 10),
            row('Brazil', 'Aedes aegypti', 4),
            row('India', 'Homo sapiens', 6),
            row(null, null, 2),
        ],
        rowDimension: country,
        columnDimension: host,
    });

    test('counts every sequence it was given', () => {
        expect(table.total).toBe(22);
    });

    test('lists the values of each dimension, largest first', () => {
        expect(table.rows.map((entry) => entry.label)).toEqual(['Brazil', 'India', 'Not recorded']);
    });

    test('puts the host groups in the order that a report lists them', () => {
        expect(table.columns.map((entry) => entry.label)).toEqual(['Human', 'Arthropod', 'Host not recorded']);
    });

    test('holds the sequences that fall in both the row and the column', () => {
        const brazil = defined(table.rows[0], 'the Brazil row');
        const human = defined(table.columns[0], 'the human column');
        expect(cellValue(table, brazil, human, MEASURE.count).count).toBe(10);
    });

    test('counts a sequence that records no country, rather than dropping it', () => {
        const unrecorded = defined(
            table.rows.find((entry) => entry.key === NOTHING),
            'the row for the sequences recording no country',
        );
        expect(unrecorded.total).toBe(2);
    });

    test('shows a cell as a proportion of its row, its column or the whole selection', () => {
        const brazil = defined(table.rows[0], 'the Brazil row');
        const human = defined(table.columns[0], 'the human column');
        expect(cellValue(table, brazil, human, MEASURE.row)).toMatchObject({ value: 10 / 14, of: 14 });
        expect(cellValue(table, brazil, human, MEASURE.column)).toMatchObject({ value: 10 / 16, of: 16 });
        expect(cellValue(table, brazil, human, MEASURE.all)).toMatchObject({ value: 10 / 22, of: 22 });
    });
});

describe('a cross-tab larger than the table can show', () => {
    const many = Array.from({ length: 25 }, (_, index) => row(`Country ${index}`, 'Homo sapiens', 25 - index));
    const table = crossTabOf({ rows: many, rowDimension: country, columnDimension: host, shownRows: 5 });

    test('gathers the rest into one row rather than dropping them', () => {
        expect(table.rows.length).toBe(6);
        expect(table.rows.at(-1)).toMatchObject({ key: OTHER, gathered: 20 });
    });

    test('still adds up to every sequence it was given', () => {
        const total = table.rows.reduce((sum, entry) => sum + entry.total, 0);
        expect(total).toBe(table.total);
        expect(table.total).toBe(many.reduce((sum, entry) => sum + Number(entry.n), 0));
    });
});

describe('ordering the rows by a column', () => {
    const rows = [
        row('Brazil', 'Homo sapiens', 10),
        row('Brazil', 'Aedes aegypti', 1),
        row('India', 'Homo sapiens', 2),
        row('India', 'Aedes aegypti', 7),
        row('Kenya', 'Aedes aegypti', 3),
    ];
    const ordered = (sort: { column: string; descending: boolean } | undefined) =>
        crossTabOf({ rows, rowDimension: country, columnDimension: host, sort }).rows.map((entry) => entry.label);

    test('without a column, the rows are in the order that the dimension has', () => {
        expect(ordered(undefined)).toEqual(['Brazil', 'India', 'Kenya']);
    });

    test('by a column, largest first and smallest first', () => {
        expect(ordered({ column: 'vector', descending: true })).toEqual(['India', 'Kenya', 'Brazil']);
        expect(ordered({ column: 'vector', descending: false })).toEqual(['Brazil', 'Kenya', 'India']);
    });

    test('by the names of the rows, which is the leftmost column', () => {
        expect(ordered({ column: ROW_NAMES, descending: false })).toEqual(['Brazil', 'India', 'Kenya']);
        expect(ordered({ column: ROW_NAMES, descending: true })).toEqual(['Kenya', 'India', 'Brazil']);
    });

    test('by the total, which is the whole row', () => {
        expect(ordered({ column: TOTAL, descending: false })).toEqual(['Kenya', 'India', 'Brazil']);
    });

    test('a column that the table has not got leaves the order alone', () => {
        expect(ordered({ column: 'nothing-like-it', descending: false })).toEqual(['Brazil', 'India', 'Kenya']);
    });

    test('the rows kept are the ones that the ordering puts first', () => {
        const table = crossTabOf({
            rows,
            rowDimension: country,
            columnDimension: host,
            shownRows: 1,
            sort: { column: 'vector', descending: true },
        });
        expect(table.rows.map((entry) => entry.label)).toEqual(['India', 'Other']);
        expect(table.rows.reduce((sum, entry) => sum + entry.total, 0)).toBe(23);
    });
});

test('a column of numbers is sorted largest first, then smallest first, then not at all', () => {
    const first = nextSort(undefined, 'Brazil');
    expect(first).toEqual({ column: 'Brazil', descending: true });
    const second = nextSort(first, 'Brazil');
    expect(second).toEqual({ column: 'Brazil', descending: false });
    expect(nextSort(second, 'Brazil')).toBeUndefined();
    expect(nextSort(second, 'India')).toEqual({ column: 'India', descending: true });
});

test('the column of names is sorted A to Z first, since that is how a name is looked up', () => {
    const first = nextSort(undefined, ROW_NAMES);
    expect(first).toEqual({ column: ROW_NAMES, descending: false });
    const second = nextSort(first, ROW_NAMES);
    expect(second).toEqual({ column: ROW_NAMES, descending: true });
    expect(nextSort(second, ROW_NAMES)).toBeUndefined();
});
