import { useEffect, useMemo, type FC } from 'react';

import { CrossTable } from './CrossTable.tsx';
import { DownloadTable } from './DownloadTable.tsx';
import { FilterRail } from './FilterRail.tsx';
import { MatrixBar } from './MatrixBar.tsx';
import { Timeline } from './Timeline.tsx';
import { useSubtypeColumns } from '../../../pathoplexusExplorer/dataLayer/hooks/analyses.ts';
import { ConnectionProvider } from '../../../pathoplexusExplorer/dataLayer/hooks/connection.tsx';
import {
    matrixAccessionListQuery,
    useCrossRows,
    useFilters,
    useTimelineRows,
    useValuesLookup,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useMatrix.ts';
import { crossTabOf } from '../../../pathoplexusExplorer/dataLayer/queries/crossTab.ts';
import { NOTHING, dimensionById } from '../../../pathoplexusExplorer/dataLayer/queries/dimensions.ts';
import {
    matrixScope,
    PATHOGEN_TABLES,
    type Constraints,
} from '../../../pathoplexusExplorer/dataLayer/queries/selection.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { UNEXPECTED_ERROR } from '../../../pathoplexusExplorer/domain/text.ts';
import { matrixPageTitle } from '../../../pathoplexusExplorer/pageState/matrixAddress.ts';
import {
    withDimensionCleared,
    withDimensionInverted,
    withoutStrandedChoices,
    withValueToggled,
} from '../../../pathoplexusExplorer/pageState/matrixSelection.ts';
import { useMatrixParams } from '../../../pathoplexusExplorer/pageState/useMatrixParams.ts';
import { DownloadAccessions } from '../ui/DownloadAccessions.tsx';
import { Async, ErrorMessage } from '../ui/States.tsx';

type MatrixPageProps = {
    rhydbUrl: string;
};

export const MatrixPage: FC<MatrixPageProps> = ({ rhydbUrl }) => {
    return (
        <ConnectionProvider url={rhydbUrl}>
            <Matrix />
        </ConnectionProvider>
    );
};

const Matrix: FC = () => {
    const { params, update, canonicalSearch } = useMatrixParams();
    const { selection } = params;
    const available = useSubtypeColumns(CATALOG);
    const { country, pathogen, dimensions } = useMemo(
        () => matrixScope(selection.dimensions, available.data),
        [selection.dimensions, available.data],
    );
    const unavailable = withoutStrandedChoices(selection.dimensions, dimensions) !== undefined;
    const lookupRead = useValuesLookup(
        pathogen,
        country,
        available,
        selection.dimensions.year?.values.includes(NOTHING) === true,
    );
    const lookup = unavailable ? undefined : lookupRead.data;

    const reads = useMemo(
        () => ({ selection, dimensions, tables: PATHOGEN_TABLES, lookup }),
        [selection, dimensions, lookup],
    );
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
    const timelineError = lookupRead.error ?? timeline.error;
    const accessions = useMemo(() => matrixAccessionListQuery(reads), [reads]);

    const table = useMemo(
        () =>
            cross.data === undefined
                ? undefined
                : crossTabOf({
                      rows: cross.data,
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
        if (unavailable) {
            return;
        }
        if (params.rows !== rowDimension.id || params.columns !== columnDimension.id) {
            update({ rows: rowDimension.id, columns: columnDimension.id }, { replace: true });
        } else if (window.location.search.replace(/^\?/, '') !== canonicalSearch) {
            update({}, { replace: true });
        }
    }, [unavailable, canonicalSearch, update, params.rows, params.columns, rowDimension, columnDimension]);

    if (unavailable) {
        return <ErrorMessage error={new Error(UNEXPECTED_ERROR)} />;
    }
    const changeSelection = (next: Constraints) => {
        const offered = matrixScope(next, available.data).dimensions;
        update({ selection: { ...selection, dimensions: withoutStrandedChoices(next, offered) ?? next } });
    };

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
                total={table?.total}
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
                        <Async state={{ data: table, error: lookupRead.error ?? cross.error }}>
                            {(data) => (
                                <CrossTable
                                    table={data}
                                    rowDimension={rowDimension}
                                    columnDimension={columnDimension}
                                    measure={params.measure}
                                    sort={params.sort}
                                    onSort={(sort) => update({ sort })}
                                />
                            )}
                        </Async>
                    </section>

                    <section className='flex flex-col gap-2 border-t border-stone-200 pt-3'>
                        {timelineError !== null ? (
                            <ErrorMessage error={timelineError} />
                        ) : (
                            <Timeline
                                rows={timeline.data ?? []}
                                period={selection.period}
                                isLoading={timeline.data === undefined}
                                onPeriod={(period) => update({ selection: { ...selection, period } })}
                            />
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};
