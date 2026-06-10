import { Grid } from 'gridjs-react';
import { h } from 'gridjs';
import { useQuery } from '@tanstack/react-query';

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
        // TODO: restore excludeSystemCollections: true once done testing with GridJS
        queryFn: () =>
            getBackendServiceForClientside().getCollectionSummaries({ organism /*, excludeSystemCollections: true*/ }),
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
            <Grid
                columns={[
                    {
                        id: 'id',
                        name: 'ID',
                        formatter: (cell) =>
                            h('a', { href: makeHref(cell as number) },
                                h('span', { className: 'font-mono text-xs text-gray-500' }, String(cell)),
                            ),
                    },
                    {
                        id: 'name',
                        name: 'Name',
                        formatter: (cell, row) =>
                            h('a', { href: makeHref(row.cell(0).data as number) },
                                h('span', { className: 'font-medium' }, String(cell)),
                            ),
                    },
                    {
                        id: 'description',
                        name: 'Description',
                        formatter: (cell, row) =>
                            h('a', { href: makeHref(row.cell(0).data as number) },
                                cell != null
                                    ? h('span', { className: 'text-gray-500' }, String(cell))
                                    : h('span', { className: 'text-gray-300' }, '—'),
                            ),
                    },
                    {
                        id: 'variantCount',
                        name: 'Variants',
                        formatter: (cell, row) =>
                            h('a', { href: makeHref(row.cell(0).data as number) }, String(cell)),
                    },
                ]}
                data={collections.map((c) => [
                    c.id,
                    c.name,
                    c.description != null
                        ? c.description.length > 80
                            ? c.description.slice(0, 80) + '…'
                            : c.description
                        : null,
                    c.variantCount,
                ])}
                pagination={{ limit: 20 }}
                sort={true}
            />
        </div>
    );
}
