import { type FC } from 'react';

import { crossTabOf, type Measure } from '../../../pathoplexusExplorer/matrix/crossTab.ts';
import type { Dimension } from '../../../pathoplexusExplorer/matrix/dimensions.ts';
import { tableFileOf, tableFilename } from '../../../pathoplexusExplorer/matrix/tableFile.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/rhydb/transport/row.ts';
import { saveFile } from '../ui/saveFile.ts';

type DownloadTableProps = {
    rows: readonly RhydbRow[];
    rowDimension: Dimension;
    columnDimension: Dimension;
    measure: Measure;
};

/** Use the loaded grouped rows so the download needs no extra query. The file holds every row and column, in the default order. */
export const DownloadTable: FC<DownloadTableProps> = ({ rows, rowDimension, columnDimension, measure }) => {
    const download = () => {
        const whole = crossTabOf({
            rows,
            rowDimension,
            columnDimension,
            shownRows: Number.POSITIVE_INFINITY,
            shownColumns: Number.POSITIVE_INFINITY,
        });
        const text = tableFileOf(whole, {
            rowLabel: rowDimension.label,
            columnLabel: columnDimension.label,
            measure,
        });
        saveFile(text, tableFilename(measure, new Date()), 'text/tab-separated-values');
    };
    return (
        <button
            type='button'
            className='border border-stone-300 bg-white px-2 py-1 text-[13px] hover:border-stone-500 disabled:text-stone-400'
            disabled={rows.length === 0}
            onClick={download}
        >
            Download table
        </button>
    );
};
