/** Export accessions with their data use terms so readers can identify the entries used by an analysis. */

import { sequences } from './builders.ts';
import { COLUMNS } from './columns.ts';
import type { TableFilter } from './scope.ts';
import { formatTsvRow } from '../../../util/formatTsvRow.ts';
import { unionall } from '../transport/relation.ts';
import { readOptionalText, readText, type RhydbRow } from '../transport/row.ts';

const TERMS_COLUMNS = [COLUMNS.dataUseTerms, COLUMNS.restrictedUntil, COLUMNS.termsUrl];
const ACCESSION_LIST_COLUMNS = [COLUMNS.accessionVersion, ...TERMS_COLUMNS];

export function accessionListQuery(tables: readonly string[], filter: TableFilter) {
    return unionall(tables.map((name) => sequences(name, filter).project(ACCESSION_LIST_COLUMNS)));
}

export function accessionListOf(rows: readonly RhydbRow[]): string {
    const lines = rows
        .map((row) => {
            const accession = readText(row, COLUMNS.accessionVersion);
            if (accession.trim() === '') {
                throw new Error('Missing accession version');
            }
            return formatTsvRow([accession, ...TERMS_COLUMNS.map((column) => readOptionalText(row, column))]);
        })
        // Use a locale-independent sort for reproducible downloads.
        .sort();
    return [formatTsvRow(ACCESSION_LIST_COLUMNS), ...lines].join('\n') + '\n';
}

/** Name the file after the day it was asked for and, where the instance gave one, the data version it came from. */
export function accessionListFilename(today: Date, dataVersion: string | null): string {
    const version = dataVersion === null || !/^\d+$/.test(dataVersion) ? '' : `-data-${dataVersion}`;
    return `pathoplexus-accessions-${today.toISOString().slice(0, 10)}${version}.tsv`;
}

export type EntryTerms = { total: number; open: number; restricted: number };

export function entryTermsOf(rows: readonly RhydbRow[]): EntryTerms {
    let total = 0;
    let open = 0;
    let restricted = 0;
    for (const row of rows) {
        const n = Number(row.n ?? 0);
        total += n;
        if (row[COLUMNS.dataUseTerms] === 'OPEN') {
            open += n;
        } else if (row[COLUMNS.dataUseTerms] === 'RESTRICTED') {
            restricted += n;
        }
    }
    return { total, open, restricted };
}
