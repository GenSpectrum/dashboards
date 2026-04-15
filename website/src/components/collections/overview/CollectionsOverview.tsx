import { useQuery } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Collection } from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

export const CollectionsOverview = withQueryProvider(CollectionsOverviewInner);

const logger = getClientLogger('CollectionsOverview');

function CollectionsOverviewInner({ organism, isLoggedIn: _isLoggedIn }: { organism: Organism; isLoggedIn: boolean }) {
    const {
        isLoading,
        isError,
        data: collections,
        error,
    } = useQuery({
        queryKey: ['collections', organism],
        queryFn: () => getBackendServiceForClientside().getCollections({ organism }),
    });

    if (isError) {
        logger.error(`Failed to fetch collections: ${getErrorLogMessage(error)}`);
    }

    return (
        <div>
            <PageHeadline>{organismConfig[organism].label} Collections</PageHeadline>
            {isLoading ? (
                <span className='loading loading-spinner loading-sm' />
            ) : isError ? (
                <div className='text-error'>Failed to load collections. Please try reloading the page.</div>
            ) : collections === undefined || collections.length === 0 ? (
                <div className='mt-6 text-gray-500'>No collections yet.</div>
            ) : (
                <CollectionsTable collections={collections} organism={organism} />
            )}
        </div>
    );
}

function CollectionsTable({ collections, organism }: { collections: Collection[]; organism: Organism }) {
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
                                        {collection.variants.length}
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
