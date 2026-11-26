import { expect, test } from 'vitest';

import { tableFilename, tableFileOf } from './tableFile.ts';
import { crossTabOf, MEASURE, type Measure } from '../../../pathoplexusExplorer/dataLayer/queries/crossTab.ts';
import { dimensionById, dimensionsFor } from '../../../pathoplexusExplorer/dataLayer/queries/dimensions.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/scope.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { defined } from '../../../pathoplexusExplorer/test/defined.fixture.ts';

const DIMENSIONS = dimensionsFor({ catalog: CATALOG, tables: ['mpox'] });
const country = defined(dimensionById(DIMENSIONS, 'country'), 'the country dimension');
const host = defined(dimensionById(DIMENSIONS, 'host'), 'the host dimension');

const rows = [
    { [COLUMNS.country]: 'Brazil', [COLUMNS.host]: 'Homo sapiens', [COLUMNS.hostTaxon]: null, n: 10 },
    { [COLUMNS.country]: 'Brazil', [COLUMNS.host]: 'Aedes aegypti', [COLUMNS.hostTaxon]: null, n: 2 },
    { [COLUMNS.country]: 'India', [COLUMNS.host]: 'Homo sapiens', [COLUMNS.hostTaxon]: null, n: 6 },
];

function fileOf(measure: Measure = MEASURE.count, shownRows = Number.POSITIVE_INFINITY) {
    const table = crossTabOf({ rows, rowDimension: country, columnDimension: host, shownRows });
    return tableFileOf(table, { rowLabel: country.label, columnLabel: host.label, measure })
        .trimEnd()
        .split('\n')
        .map((line) => line.split('\t'));
}

test('the file is the table: a corner, the columns, every row, and the totals', () => {
    expect(fileOf()).toEqual([
        ['Country / Host group — sequences', 'Human', 'Arthropod', 'Total sequences'],
        ['Brazil', '10', '2', '12'],
        ['India', '6', '0', '6'],
        ['Total sequences', '16', '2', '18'],
    ]);
});

test('a proportion is written as a fraction, and the totals stay counts', () => {
    expect(fileOf(MEASURE.row)).toEqual([
        ['Country / Host group — proportion of row', 'Human', 'Arthropod', 'Total sequences'],
        ['Brazil', '0.833333', '0.166667', '12'],
        ['India', '1', '0', '6'],
        ['Total sequences', '16', '2', '18'],
    ]);
});

test('the file is named after what its cells hold and the day it was downloaded', () => {
    const day = new Date('2026-11-16T09:30:00Z');
    expect(tableFilename(MEASURE.count, day)).toBe('pathoplexus-matrix-sequences-2026-11-16.tsv');
    expect(tableFilename(MEASURE.row, day)).toBe('pathoplexus-matrix-row-proportions-2026-11-16.tsv');
    expect(tableFilename(MEASURE.column, day)).toBe('pathoplexus-matrix-column-proportions-2026-11-16.tsv');
    expect(tableFilename(MEASURE.all, day)).toBe('pathoplexus-matrix-table-proportions-2026-11-16.tsv');
});
