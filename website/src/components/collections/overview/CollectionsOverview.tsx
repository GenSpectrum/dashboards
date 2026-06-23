import { useQuery } from '@tanstack/react-query';
import { h } from 'gridjs';
import { Grid } from 'gridjs-react';
import { Fragment, useId, useState } from 'react';

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

type CollectionFilter = 'community' | 'official' | 'all';

function CollectionsOverviewInner({
    organism,
    isLoggedIn,
    systemUserId,
}: {
    organism: Organism;
    isLoggedIn: boolean;
    systemUserId: number;
}) {
    const [filter, setFilter] = useState<CollectionFilter>('community');

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

    const filteredCollections = filterCollections(collections, filter, systemUserId);

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
            <CollectionFilterSelect filter={filter} onChange={setFilter} />
            {isLoading ? (
                <span className='loading loading-spinner loading-sm' />
            ) : isError ? (
                <div className='text-error'>Failed to load collections. Please try reloading the page.</div>
            ) : filteredCollections.length === 0 ? (
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
                <CollectionsTable collections={filteredCollections} organism={organism} />
            )}
        </div>
    );
}

function filterCollections(
    collections: CollectionSummary[] | undefined,
    filter: CollectionFilter,
    systemUserId: number,
): CollectionSummary[] {
    if (!collections) return [];
    switch (filter) {
        case 'community':
            return collections.filter((c) => c.ownedBy !== systemUserId);
        case 'official':
            return collections.filter((c) => c.ownedBy === systemUserId);
        case 'all':
            return collections;
    }
}

const FILTER_OPTIONS: { value: CollectionFilter; label: string; tooltip: string }[] = [
    { value: 'community', label: 'Community', tooltip: 'User submissions' },
    { value: 'official', label: 'Official', tooltip: 'GenSpectrum curated' },
    { value: 'all', label: 'All', tooltip: 'Show everything' },
];

function CollectionFilterSelect({
    filter,
    onChange,
}: {
    filter: CollectionFilter;
    onChange: (f: CollectionFilter) => void;
}) {
    const id = useId();
    return (
        <div className='flex text-sm'>
            {FILTER_OPTIONS.map((opt, i) => (
                <Fragment key={opt.value}>
                    <input
                        type='radio'
                        id={`${id}-${opt.value}`}
                        name={id}
                        className='sr-only'
                        checked={filter === opt.value}
                        onChange={() => onChange(opt.value)}
                    />
                    <label
                        htmlFor={`${id}-${opt.value}`}
                        className={`tooltip w-24 cursor-pointer border p-2 text-center ${i === 0 ? 'rounded-l-md' : '-ml-px rounded-none'} ${i === FILTER_OPTIONS.length - 1 ? 'rounded-r-md' : ''} ${filter === opt.value ? 'border-primary relative z-10' : 'border-gray-300'}`}
                        data-tip={opt.tooltip}
                    >
                        {opt.label}
                    </label>
                </Fragment>
            ))}
        </div>

    );
}

function CollectionsGridStyles() {
    return (
        <style>{`
            /* Remove the mermaid theme's rounded corners and drop shadow; add outer left/right border to frame the table */
            .collections-grid .gridjs-wrapper, .collections-grid .gridjs-footer { border-radius: 0; box-shadow: none; border-left: 1px solid var(--color-base-300); border-right: 1px solid var(--color-base-300); }

            /* Mermaid sets inline-block here, which lets the table overflow the viewport instead of squishing */
            .collections-grid .gridjs-container { display: block; }

            /* Remove horizontal row lines, keeping only the vertical column separators */
            .collections-grid th.gridjs-th, .collections-grid td.gridjs-td { border-top: none; border-bottom: none; }

            /* Zebra striping using the active DaisyUI theme's base-200 colour */
            .collections-grid .gridjs-tbody tr:nth-child(even) td.gridjs-td { background-color: var(--color-base-200); }

            /* Tighten up header padding and reduce font slightly from the mermaid default */
            .collections-grid th.gridjs-th { padding: 10px 16px; font-size: 0.8125rem; }

            /* Tighten up cell padding and reduce font to match the rest of the UI */
            .collections-grid td.gridjs-td { padding: 6px 16px; font-size: 0.875rem; }

            /* Scale the sort arrow button down to match the smaller header size */
            .collections-grid button.gridjs-sort { height: 18px; width: 11px; }

            /* Tighten up the pagination footer */
            .collections-grid .gridjs-footer { padding: 8px 16px; font-size: 0.8125rem; }

            /* Reduce pagination button padding to match the smaller footer */
            .collections-grid .gridjs-pagination .gridjs-pages button { padding: 3px 10px; }

            /* Truncate long descriptions with an ellipsis — relies on table-layout: fixed from the mermaid theme */
            .collections-grid td.gridjs-td:nth-child(3) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 0; }
        `}</style>
    );
}

function CollectionsTable({ collections, organism }: { collections: CollectionSummary[]; organism: Organism }) {
    const makeHref = (id: number) => Page.viewCollection(organism, String(id));

    return (
        <div className='my-6'>
            <CollectionsGridStyles />
            <div className='collections-grid'>
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
        </div>
    );
}
