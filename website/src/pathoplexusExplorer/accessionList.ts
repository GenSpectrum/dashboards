/** Export accessions with their data use terms so readers can identify the entries used by an analysis. */

import { COLUMNS } from './rhydb/queries/scope.ts';
import type { RhydbRow } from './rhydb/transport/row.ts';

const ACCESSION_LIST_COLUMNS: readonly string[] = [
    COLUMNS.accessionVersion,
    COLUMNS.dataUseTerms,
    COLUMNS.restrictedUntil,
    COLUMNS.termsUrl,
];

function cell(value: RhydbRow[string]): string {
    if (value === null || value === undefined) {
        return '';
    }
    const text = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : JSON.stringify(value);
    return text.replace(/[\t\r\n]+/g, ' ');
}

export function accessionListOf(rows: readonly RhydbRow[]): string {
    const lines = rows
        .map((row) => ACCESSION_LIST_COLUMNS.map((column) => cell(row[column])).join('\t'))
        // Use a locale-independent sort for reproducible downloads.
        .sort();
    return [ACCESSION_LIST_COLUMNS.join('\t'), ...lines].join('\n') + '\n';
}

/** Name the file after the day it was asked for and, where the instance gave one, the data version it came from. */
export function accessionListFilename(today: Date, dataVersion: string | null): string {
    const version = dataVersion === null || !/^\d+$/.test(dataVersion) ? '' : `-data-${dataVersion}`;
    return `pathoplexus-accessions-${today.toISOString().slice(0, 10)}${version}.tsv`;
}
