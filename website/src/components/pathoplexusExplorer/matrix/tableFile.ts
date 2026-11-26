/** Export the full cross-tab, including values collected under Other on screen. */

import {
    cellValue,
    MEASURE,
    type CrossTab,
    type Measure,
} from '../../../pathoplexusExplorer/dataLayer/queries/crossTab.ts';

const TOTAL_LABEL = 'Total sequences';

/** What the cells hold, named in the corner cell. */
const MEASURE_NAMES: Readonly<Record<Measure, string>> = {
    [MEASURE.count]: 'sequences',
    [MEASURE.row]: 'proportion of row',
    [MEASURE.column]: 'proportion of column',
    [MEASURE.all]: 'proportion of table',
};

/** What the cells hold, named in the file name. */
const MEASURE_SLUGS: Readonly<Record<Measure, string>> = {
    [MEASURE.count]: 'sequences',
    [MEASURE.row]: 'row-proportions',
    [MEASURE.column]: 'column-proportions',
    [MEASURE.all]: 'table-proportions',
};

function cell(text: string): string {
    return text.replace(/[\t\r\n]+/g, ' ');
}

/** Export proportions as fractions to retain precision. */
function amount(value: number, measure: Measure): string {
    return measure === MEASURE.count ? String(value) : String(Number(value.toFixed(6)));
}

export function tableFileOf(
    table: CrossTab,
    options: { rowLabel: string; columnLabel: string; measure: Measure },
): string {
    const { rowLabel, columnLabel, measure } = options;
    const header = [
        cell(`${rowLabel} / ${columnLabel} — ${MEASURE_NAMES[measure]}`),
        ...table.columns.map((column) => cell(column.label)),
    ];
    const lines = table.rows.map((row) => [
        cell(row.label),
        ...table.columns.map((column) => amount(cellValue(table, row, column, measure).value, measure)),
        // Totals remain sequence counts regardless of the selected measure.
        String(row.total),
    ]);
    const totals = [TOTAL_LABEL, ...table.columns.map((column) => String(column.total)), String(table.total)];
    return [[...header, TOTAL_LABEL], ...lines, totals].map((row) => row.join('\t')).join('\n') + '\n';
}

export function tableFilename(measure: Measure, today: Date): string {
    return `pathoplexus-matrix-${MEASURE_SLUGS[measure]}-${today.toISOString().slice(0, 10)}.tsv`;
}
