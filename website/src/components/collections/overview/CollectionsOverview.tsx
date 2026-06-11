import { useQuery } from '@tanstack/react-query';
import { h } from 'gridjs';
import { Grid } from 'gridjs-react';

import 'gridjs/dist/theme/mermaid.css';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { CollectionSummary } from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

export const CollectionsOverview = withQueryProvider(CollectionsOverviewInner);

const logger = getClientLogger('CollectionsOverview');

function CollectionsOverviewInner({ organism, isLoggedIn }: { organism: Organism; isLoggedIn: boolean }) {
    const {
        isLoading,
        isError,
        data: collections,
        error,
    } = useQuery({
        queryKey: ['collections', organism],
        queryFn: () =>
            getBackendServiceForClientside().getCollectionSummaries({ organism, excludeSystemCollections: true }),
    });

    if (isError) {
        logger.error(`Failed to fetch collections: ${getErrorLogMessage(error)}`);
    }

    return (
        <div>
            <div className='flex items-start justify-between'>
                <PageHeadline>{organismConfig[organism].label} Collections</PageHeadline>
                {isLoggedIn && (
                    <a href={Page.createCollection(organism)} className='btn btn-sm'>
                        New collection
                    </a>
                )}
            </div>
            {isLoading ? (
                <span className='loading loading-spinner loading-sm' />
            ) : isError ? (
                <div className='text-error'>Failed to load collections. Please try reloading the page.</div>
            ) : collections === undefined || collections.length === 0 ? (
                <div className='mt-6 text-gray-500'>
                    No collections yet.
                    {isLoggedIn && (
                        <>
                            {' '}
                            <a href={Page.createCollection(organism)} className='link'>
                                Create one
                            </a>
                            .
                        </>
                    )}
                </div>
            ) : (
                <CollectionsTable collections={collections} organism={organism} />
            )}
        </div>
    );
}

function CollectionsTable({ collections, organism }: { collections: CollectionSummary[]; organism: Organism }) {
    const makeHref = (id: number) => Page.viewCollection(organism, String(id));

    return (
        <div className='my-6'>
            <style>{`
                /* Remove the mermaid theme's rounded corners and drop shadow; add outer left/right border to frame the table */
                .gridjs-wrapper, .gridjs-footer { border-radius: 0; box-shadow: none; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }

                /* Mermaid sets inline-block here, which lets the table overflow the viewport instead of squishing */
                .gridjs-container { display: block; }

                /* Remove horizontal row lines, keeping only the vertical column separators */
                th.gridjs-th, td.gridjs-td { border-top: none; border-bottom: none; }

                /* Zebra striping using the active DaisyUI theme's base-200 colour */
                .gridjs-tbody tr:nth-child(even) td.gridjs-td { background-color: var(--color-base-200); }

                /* Tighten up header padding and reduce font slightly from the mermaid default */
                th.gridjs-th { padding: 10px 16px; font-size: 0.8125rem; }

                /* Tighten up cell padding and reduce font to match the rest of the UI */
                td.gridjs-td { padding: 6px 16px; font-size: 0.875rem; }

                /* Scale the sort arrow button down to match the smaller header size */
                button.gridjs-sort { height: 18px; width: 11px; }

                /* Tighten up the pagination footer */
                .gridjs-footer { padding: 8px 16px; font-size: 0.8125rem; }

                /* Reduce pagination button padding to match the smaller footer */
                .gridjs-pagination .gridjs-pages button { padding: 3px 10px; }

                /* Truncate long descriptions with an ellipsis — relies on table-layout: fixed from the mermaid theme */
                td.gridjs-td:nth-child(3) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0; }
            `}</style>
            <Grid
                columns={[
                    {
                        id: 'id',
                        name: 'ID',
                        width: '7%',
                        formatter: (cell) =>
                            h(
                                'a',
                                { href: makeHref(cell as number) },
                                h('span', { className: 'font-mono text-xs text-gray-500' }, String(cell as number)),
                            ),
                    },
                    {
                        id: 'name',
                        name: 'Name',
                        width: '25%',
                        formatter: (cell, row) =>
                            h(
                                'a',
                                { href: makeHref(row.cell(0).data as number) },
                                h('span', { className: 'font-medium' }, cell as string),
                            ),
                    },
                    {
                        id: 'description',
                        name: 'Description',
                        formatter: (cell, row) =>
                            h(
                                'a',
                                { href: makeHref(row.cell(0).data as number) },
                                cell != null
                                    ? h('span', { className: 'text-gray-500' }, cell as string)
                                    : h('span', { className: 'text-gray-300' }, '—'),
                            ),
                    },
                    {
                        id: 'variantCount',
                        name: 'Variants',
                        width: '10%',
                        formatter: (cell, row) =>
                            h('a', { href: makeHref(row.cell(0).data as number) }, String(cell as number)),
                    },
                ]}
                data={collections.map((c) => [c.id, c.name, c.description, c.variantCount])}
                pagination={{ limit: 20 }}
                sort={true}
            />
        </div>
    );
}
