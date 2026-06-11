import { Fragment, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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
        queryFn: () => getBackendServiceForClientside().getCollectionSummaries({ organism }),
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
                        className='hidden'
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

function CollectionsTable({ collections, organism }: { collections: CollectionSummary[]; organism: Organism }) {
    return (
        <div className='my-6 overflow-x-auto'>
            <table className='table-zebra table w-full'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th className='text-right'>Variants</th>
                    </tr>
                </thead>
                <tbody>
                    {collections.map((collection) => {
                        const href = Page.viewCollection(organism, String(collection.id));
                        return (
                            <tr key={collection.id} className='hover:bg-base-300'>
                                <td className='p-0'>
                                    <a href={href} className='block px-4 py-3 font-mono text-xs text-gray-500'>
                                        {collection.id}
                                    </a>
                                </td>
                                <td className='p-0'>
                                    <a href={href} className='block px-4 py-3 font-medium'>
                                        {collection.name}
                                    </a>
                                </td>
                                <td className='max-w-sm p-0'>
                                    <a href={href} className='block px-4 py-3 text-gray-500'>
                                        {collection.description ? (
                                            collection.description.length > 80 ? (
                                                collection.description.slice(0, 80) + '…'
                                            ) : (
                                                collection.description
                                            )
                                        ) : (
                                            <span className='text-gray-300'>—</span>
                                        )}
                                    </a>
                                </td>
                                <td className='p-0'>
                                    <a href={href} className='block px-4 py-3 text-right'>
                                        {collection.variantCount}
                                    </a>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
