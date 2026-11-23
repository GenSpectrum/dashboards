import { describe, expect, test } from 'vitest';

import { addressOf, withChange, MATRIX_PATH, parseParams } from './address.ts';
import { MEASURE, MOST_SHOWN, ROW_NAMES, SHOWN_COLUMNS, SHOWN_ROWS, TOTAL } from './crossTab.ts';

function roundTrip(search: string) {
    return addressOf(parseParams(new URLSearchParams(search)));
}

test('a matrix nobody has touched is the bare path', () => {
    expect(addressOf(parseParams(new URLSearchParams()))).toBe(MATRIX_PATH);
});

test('the selection, the period, the two dimensions and the cell are read back as they were written', () => {
    const search = 'sel=country%3DBrazil&when=2024-01-01%2F2024-12-31&rows=host&cols=year&cell=row';
    expect(roundTrip(search)).toBe(`${MATRIX_PATH}?${search}`);
});

test('what the page opens with is left out of its address', () => {
    expect(roundTrip('rows=country&cols=pathogen&cell=count')).toBe(MATRIX_PATH);
});

test('a date that is no date is dropped rather than queried', () => {
    expect(parseParams(new URLSearchParams('when=2024-13-01/..')).selection.period.from).toBeUndefined();
    expect(parseParams(new URLSearchParams('when=2024-02-29/..')).selection.period.from).toBe('2024-02-29');
});

test('a measure the page does not know is counted as sequences', () => {
    expect(parseParams(new URLSearchParams('cell=nonsense')).measure).toBe(MEASURE.count);
});

test('how many rows and columns the table shows is part of the address', () => {
    expect(roundTrip('maxRows=40&maxCols=25')).toBe(`${MATRIX_PATH}?maxRows=40&maxCols=25`);
    expect(roundTrip('')).toBe(MATRIX_PATH);
});

test('a limit the page cannot draw is brought within what it can', () => {
    const asked = parseParams(new URLSearchParams('maxRows=5000&maxCols=0'));
    expect(asked.shownRows).toBe(MOST_SHOWN);
    expect(asked.shownColumns).toBe(SHOWN_COLUMNS);
    const nonsense = parseParams(new URLSearchParams('maxRows=many&maxCols=12.7'));
    expect(nonsense.shownRows).toBe(SHOWN_ROWS);
    expect(nonsense.shownColumns).toBe(12);
});

test('the column that the rows are ordered by is part of the address', () => {
    expect(roundTrip('sort=-Brazil')).toBe(`${MATRIX_PATH}?sort=-Brazil`);
    expect(parseParams(new URLSearchParams('sort=-Brazil')).sort).toEqual({ column: 'Brazil', descending: true });
    expect(parseParams(new URLSearchParams('sort=Brazil')).sort).toEqual({ column: 'Brazil', descending: false });
    expect(parseParams(new URLSearchParams('sort=-%28total%29')).sort).toEqual({ column: TOTAL, descending: true });
    expect(roundTrip('sort=-%28total%29')).toBe(`${MATRIX_PATH}?sort=-%28total%29`);
    expect(parseParams(new URLSearchParams('sort=%28names%29')).sort).toEqual({
        column: ROW_NAMES,
        descending: false,
    });
    expect(roundTrip('sort=%28names%29')).toBe(`${MATRIX_PATH}?sort=%28names%29`);
});

describe('what a change does to the ordering', () => {
    const sorted = parseParams(new URLSearchParams('sel=country%3DBrazil&rows=host&cols=year&sort=-2024'));

    test('what a cell shows, and the dimension of the columns, replace what was ordered by', () => {
        expect(withChange(sorted, { measure: MEASURE.row }).sort).toBeUndefined();
        expect(withChange(sorted, { columns: 'country' }).sort).toBeUndefined();
    });

    test('the dimension of the rows, a filter and the rest of the table keep it', () => {
        expect(withChange(sorted, { rows: 'country' }).sort).toEqual({ column: '2024', descending: true });
        expect(withChange(sorted, { selection: { dimensions: {}, period: {} } }).sort).toEqual({
            column: '2024',
            descending: true,
        });
        expect(withChange(sorted, { shownRows: 40 }).sort).toEqual({ column: '2024', descending: true });
    });

    test('ordering by another column is itself a change of the ordering', () => {
        expect(withChange(sorted, { sort: { column: '2023', descending: false } }).sort?.column).toBe('2023');
        expect(withChange(sorted, { sort: undefined }).sort).toBeUndefined();
    });
});
