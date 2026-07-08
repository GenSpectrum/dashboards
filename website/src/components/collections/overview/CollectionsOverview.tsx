import { useQuery } from '@tanstack/react-query';
import { h } from 'gridjs';
import { Grid } from 'gridjs-react';
import { Fragment, useId, useMemo } from 'react';

import 'gridjs/dist/theme/mermaid.css';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { CollectionSummary } from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import {
    CollectionFilters,
    CollectionsOverviewPageStateHandler,
    type CollectionFilter,
} from '../../../views/pageStateHandlers/CollectionsOverviewPageStateHandler.ts';
import { usePageState } from '../../views/usePageState.ts';
import { TagInput } from '../form/TagInput.tsx';

export const CollectionsOverview = withQueryProvider(CollectionsOverviewInner);

const logger = getClientLogger('CollectionsOverview');

function CollectionsOverviewInner({
    organism,
    isLoggedIn,
    systemUserId,
}: {
    organism: Organism;
    isLoggedIn: boolean;
    systemUserId: number;
}) {
    const pageStateHandler = useMemo(
        () => new CollectionsOverviewPageStateHandler(Page.collectionsForOrganism(organism)),
        [organism],
    );
    const { pageState, setPageState } = usePageState(pageStateHandler);
    const { filter, tagFilter } = pageState;

    const {
        isLoading,
        isError,
        data: collections,
        error,
    } = useQuery({
        queryKey: ['collections', organism],
        queryFn: () => getBackendServiceForClientside().getCollectionSummaries({ organism }),
    });

    if (isError) {
        logger.error(`Failed to fetch collections: ${getErrorLogMessage(error)}`);
    }

    const filteredCollections = filterCollections(collections, filter, systemUserId, tagFilter);

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
            <div className='mt-4 flex flex-wrap items-start gap-4'>
                <CollectionFilterSelect
                    filter={filter}
                    onChange={(f) => setPageState((prev) => ({ ...prev, filter: f }))}
                />
                <div className='flex-1'>
                    <TagInput
                        tags={tagFilter}
                        onChange={(tags) => setPageState((prev) => ({ ...prev, tagFilter: tags }))}
                    />
                </div>
            </div>
            {isLoading ? (
                <span className='loading loading-spinner loading-sm' />
            ) : isError ? (
                <div className='text-error'>Failed to load collections. Please try reloading the page.</div>
            ) : collections?.length === 0 ? (
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
            ) : filteredCollections.length === 0 ? (
                <div className='mt-6 text-gray-500'>No collections match the selected filters.</div>
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
    tagFilter: string[],
): CollectionSummary[] {
    if (!collections) return [];
    let result: CollectionSummary[];
    switch (filter) {
        case CollectionFilters.community:
            result = collections.filter((c) => c.ownedBy !== systemUserId);
            break;
        case CollectionFilters.official:
            result = collections.filter((c) => c.ownedBy === systemUserId);
            break;
        case CollectionFilters.all:
            result = collections;
            break;
    }
    if (tagFilter.length > 0) {
        result = result.filter((c) => tagFilter.every((tag) => c.tags.includes(tag)));
    }
    return result;
}

const FILTER_OPTIONS: { value: CollectionFilter; label: string; tooltip: string }[] = [
    { value: CollectionFilters.community, label: 'Community', tooltip: 'User submissions' },
    { value: CollectionFilters.official, label: 'Official', tooltip: 'GenSpectrum curated' },
    { value: CollectionFilters.all, label: 'All', tooltip: 'Show everything' },
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
                        className={`tooltip flex h-10 w-24 cursor-pointer items-center justify-center border px-2 ${i === 0 ? 'rounded-l-sm' : '-ml-px rounded-none'} ${i === FILTER_OPTIONS.length - 1 ? 'rounded-r-sm' : ''} ${filter === opt.value ? 'border-primary relative z-10' : 'border-base-content/20'}`}
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
            /* Remove the mermaid theme's drop shadow; add outer left/right border to frame the table; round outer corners to match the filter controls */
            .collections-grid .gridjs-wrapper, .collections-grid .gridjs-footer { box-shadow: none; border-left: 1px solid var(--color-base-300); border-right: 1px solid var(--color-base-300); }
            .collections-grid .gridjs-wrapper { border-radius: var(--radius-sm) var(--radius-sm) 0 0; overflow: hidden; }
            .collections-grid .gridjs-footer { border-radius: 0 0 var(--radius-sm) var(--radius-sm); }

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

            /* Make links fill the entire cell so the whole row area is clickable */
            .collections-grid td.gridjs-td a { display: block; margin: -6px -16px; padding: 6px 16px; }

            /* Right-align the Variants (last) column to match the old table */
            .collections-grid td.gridjs-td:last-child, .collections-grid th.gridjs-th:last-child { text-align: right; }
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
                                    cell !== null
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
