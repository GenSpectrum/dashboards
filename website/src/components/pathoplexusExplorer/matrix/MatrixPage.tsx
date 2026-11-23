import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, type FC } from 'react';

import { CrossTable } from './CrossTable.tsx';
import { DownloadTable } from './DownloadTable.tsx';
import { FilterRail } from './FilterRail.tsx';
import { MatrixBar } from './MatrixBar.tsx';
import { Timeline } from './Timeline.tsx';
import { useMatrixParams } from './useMatrixParams.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { matrixPageTitle } from '../../../pathoplexusExplorer/matrix/address.ts';
import { crossTabOf } from '../../../pathoplexusExplorer/matrix/crossTab.ts';
import { dimensionById, dimensionsFor, tableDimensions } from '../../../pathoplexusExplorer/matrix/dimensions.ts';
import {
    tablesInScope,
    withDimensionCleared,
    withDimensionInverted,
    withoutStrandedChoices,
    withValueToggled,
    type Constraints,
} from '../../../pathoplexusExplorer/matrix/selection.ts';
import {
    accessionListQuery,
    everyTable,
    singleCountryOf,
    singlePathogenOf,
    useAvailableColumns,
    useCrossRows,
    useFilters,
    useTimelineRows,
    useValuesLookup,
} from '../../../pathoplexusExplorer/matrix/useMatrix.ts';
import { initRhydb, rhydbQueryClient } from '../../../pathoplexusExplorer/rhydb/hooks/rhydb.ts';
import { DownloadAccessions } from '../ui/DownloadAccessions.tsx';
import { ErrorMessage } from '../ui/States.tsx';

type MatrixPageProps = {
    rhydbUrl: string;
};

export const MatrixPage: FC<MatrixPageProps> = ({ rhydbUrl }) => {
    initRhydb(rhydbUrl);
    return (
        <QueryClientProvider client={rhydbQueryClient}>
            <Matrix />
        </QueryClientProvider>
    );
};

const TABLE_DIMENSIONS = tableDimensions(CATALOG);

const Matrix: FC = () => {
    const { params, update, canonicalSearch } = useMatrixParams();
    const { selection } = params;
    const tables = everyTable();

    const chosenTables = useMemo(
        () => tablesInScope({ constraints: selection.dimensions, dimensions: TABLE_DIMENSIONS, tables }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the tables are the catalog's, and do not change
        [selection.dimensions],
    );
    const pathogen = singlePathogenOf(chosenTables);

    const available = useAvailableColumns();
    const hasColumn = available.data;
    // Province and subtype dimensions depend on the selected country and pathogen, respectively.
    const country = singleCountryOf(selection.dimensions);
    const dimensions = useMemo(
        () => dimensionsFor({ catalog: CATALOG, tables: chosenTables, hasColumn, country }),
        [chosenTables, hasColumn, country],
    );
    const lookupRead = useValuesLookup(pathogen, country, available);
    const lookup = lookupRead.data;

    const reads = useMemo(() => ({ selection, dimensions, tables, lookup }), [selection, dimensions, tables, lookup]);
    const filters = useFilters(reads);
    // Use overlapping groups as filters only, since they would double-count entries on an axis.
    const axes = useMemo(() => dimensions.filter((dimension) => dimension.axis !== false), [dimensions]);
    // Replace invalid or duplicate axes with available dimensions.
    const rowDimension = dimensionById(axes, params.rows) ?? axes[0];
    const chosenColumn = dimensionById(axes, params.columns);
    const columnDimension =
        chosenColumn !== undefined && chosenColumn !== rowDimension
            ? chosenColumn
            : (axes.find((dimension) => dimension !== rowDimension) ?? axes[0]);
    const cross = useCrossRows({ ...reads, rowDimension, columnDimension });
    const timeline = useTimelineRows(reads);
    const accessions = useMemo(() => accessionListQuery(reads), [reads]);

    const table = useMemo(
        () =>
            crossTabOf({
                rows: cross.data ?? [],
                rowDimension,
                columnDimension,
                shownRows: params.shownRows,
                shownColumns: params.shownColumns,
                sort: params.sort,
            }),
        [cross.data, rowDimension, columnDimension, params.shownRows, params.shownColumns, params.sort],
    );

    useEffect(() => {
        document.title = matrixPageTitle();
    }, []);

    /** Canonicalize the URL without adding browser history. */
    useEffect(() => {
        if (params.rows !== rowDimension.id || params.columns !== columnDimension.id) {
            update({ rows: rowDimension.id, columns: columnDimension.id }, { replace: true });
        } else if (window.location.search.replace(/^\?/, '') !== canonicalSearch) {
            update({}, { replace: true });
        }
    }, [canonicalSearch, update, params.rows, params.columns, rowDimension, columnDimension]);

    /** Clear selections that are no longer available after a scope change. */
    useEffect(() => {
        if (hasColumn === undefined) {
            return;
        }
        const kept = withoutStrandedChoices(selection.dimensions, dimensions);
        if (kept !== undefined) {
            update({ selection: { ...selection, dimensions: kept } }, { replace: true });
        }
    }, [selection, dimensions, hasColumn, update]);

    const changeSelection = (dimensions: Constraints) => update({ selection: { ...selection, dimensions } });

    return (
        <div className='flex flex-col'>
            <MatrixBar
                dimensions={dimensions}
                axes={axes}
                rowDimension={rowDimension}
                columnDimension={columnDimension}
                measure={params.measure}
                shownRows={params.shownRows}
                shownColumns={params.shownColumns}
                total={cross.data === undefined ? undefined : table.total}
                selection={selection}
                download={
                    <>
                        <DownloadTable
                            rows={cross.data ?? []}
                            rowDimension={rowDimension}
                            columnDimension={columnDimension}
                            measure={params.measure}
                        />
                        <DownloadAccessions query={accessions} />
                    </>
                }
                onChange={update}
                onClearAll={() => update({ selection: { dimensions: {}, period: {} } })}
                onClearDimension={(dimension) => changeSelection(withDimensionCleared(selection.dimensions, dimension))}
                onClearPeriod={() => update({ selection: { ...selection, period: {} } })}
            />
            <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
                <FilterRail
                    filters={filters.data ?? []}
                    constraints={selection.dimensions}
                    isLoading={filters.isLoading || lookupRead.isLoading}
                    error={filters.error ?? lookupRead.error}
                    onToggle={(dimension, value) =>
                        changeSelection(withValueToggled(selection.dimensions, dimension, value))
                    }
                    onClear={(dimension) => changeSelection(withDimensionCleared(selection.dimensions, dimension))}
                    onInvert={(dimension) => changeSelection(withDimensionInverted(selection.dimensions, dimension))}
                />
                <div className='flex min-w-0 flex-1 flex-col gap-4 p-4'>
                    <section className='flex flex-col gap-2'>
                        {cross.error !== null ? (
                            <ErrorMessage error={cross.error} />
                        ) : (
                            <div className={cross.isLoading ? 'opacity-50' : undefined}>
                                <CrossTable
                                    table={table}
                                    rowDimension={rowDimension}
                                    columnDimension={columnDimension}
                                    measure={params.measure}
                                    sort={params.sort}
                                    onSort={(sort) => update({ sort })}
                                />
                            </div>
                        )}
                    </section>

                    <section className='flex flex-col gap-2 border-t border-stone-200 pt-3'>
                        {timeline.error !== null ? (
                            <ErrorMessage error={timeline.error} />
                        ) : (
                            <Timeline
                                rows={timeline.data ?? []}
                                period={selection.period}
                                isLoading={timeline.isLoading}
                                onPeriod={(period) => update({ selection: { ...selection, period } })}
                            />
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
