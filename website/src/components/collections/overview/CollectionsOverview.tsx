import { useQuery } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Collection } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

export const CollectionsOverview = withQueryProvider(CollectionsOverviewInner);

const logger = getClientLogger('CollectionsOverview');

function CollectionsOverviewInner({ organism }: { organism: Organism }) {
    const {
        isLoading,
        isError,
        data: collections,
        error,
    } = useQuery({
        queryKey: ['collections', organism],
        queryFn: () => getBackendServiceForClientside().getCollections({ organism }),
    });

    if (isLoading) {
        return <span className='loading loading-spinner loading-sm' />;
    }

    if (isError) {
        logger.error(`Failed to fetch collections: ${getErrorLogMessage(error)}`);
        return <div className='text-error'>Failed to load collections. Please try reloading the page.</div>;
    }

    return (
        <div>
            <div className='mb-6 flex items-baseline justify-between'>
                <PageHeadline>Collections</PageHeadline>
                <a href={Page.createCollection(organism)} className='btn btn-primary btn-sm'>
                    New collection
                </a>
            </div>
            {collections === undefined || collections.length === 0 ? (
                <div className='text-base-content/60'>
                    No collections yet.{' '}
                    <a href={Page.createCollection(organism)} className='link'>
                        Create your first one.
                    </a>
                </div>
            ) : (
                <CollectionsTable collections={collections} organism={organism} />
            )}
        </div>
    );
}

function CollectionsTable({ collections, organism }: { collections: Collection[]; organism: Organism }) {
    return (
        <div className='overflow-x-auto'>
            <table className='table-zebra table w-full'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Variants</th>
                    </tr>
                </thead>
                <tbody>
                    {collections.map((collection) => (
                        <CollectionRow key={collection.id} collection={collection} organism={organism} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CollectionRow({ collection, organism }: { collection: Collection; organism: Organism }) {
    const href = Page.viewCollection(organism, collection.id);

    return (
        <tr className='hover cursor-pointer' onClick={() => (window.location.href = href)}>
            <td className='text-base-content/50 font-mono text-xs'>{collection.id.slice(0, 8)}</td>
            <td>
                <a href={href} className='link link-hover font-medium' onClick={(e) => e.stopPropagation()}>
                    {collection.name}
                </a>
            </td>
            <td className='text-base-content/70 max-w-sm'>
                {collection.description !== null ? (
                    collection.description.length > 80 ? (
                        collection.description.slice(0, 80) + '…'
                    ) : (
                        collection.description
                    )
                ) : (
                    <span className='text-base-content/30'>—</span>
                )}
            </td>
            <td>{collection.variants.length}</td>
        </tr>
    );
}
