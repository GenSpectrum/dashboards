import { useQuery } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Collection, Variant } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

export const CollectionDetail = withQueryProvider(CollectionDetailInner);

const logger = getClientLogger('CollectionDetail');

function CollectionDetailInner({ id }: { organism: Organism; id: string; userId?: string }) {
    const {
        isLoading,
        isError,
        data: collection,
        error,
    } = useQuery({
        queryKey: ['collection', id],
        queryFn: () => getBackendServiceForClientside().getCollection({ id }),
    });

    if (isLoading) {
        return <span className='loading loading-spinner loading-sm' />;
    }

    if (isError) {
        logger.error(`Failed to fetch collection: ${getErrorLogMessage(error)}`);
        return <div className='text-error'>Failed to load collection. Please try reloading the page.</div>;
    }

    if (collection === undefined) {
        return null;
    }

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <PageHeadline>
                    <span className='mr-2 font-normal text-gray-400'>#{collection.id}</span>
                    {collection.name}
                </PageHeadline>
                {collection.description !== null && <p className='mt-1 text-gray-500'>{collection.description}</p>}
                <p className='mt-1 text-sm text-gray-500'>
                    {collection.organism} collection owned by {collection.ownedBy}
                </p>
            </div>

            <VariantsCard collection={collection} />
        </div>
    );
}

function VariantsCard({ collection }: { collection: Collection }) {
    return (
        <div>
            <h2 className='mb-3 text-lg font-semibold'>Variants ({collection.variants.length})</h2>
            {collection.variants.length === 0 ? (
                <p className='text-sm text-gray-500'>No variants defined.</p>
            ) : (
                <div className='flex flex-col gap-3'>
                    {collection.variants.map((variant) => (
                        <VariantCard key={variant.id} variant={variant} />
                    ))}
                </div>
            )}
        </div>
    );
}

function VariantCard({ variant }: { variant: Variant }) {
    return (
        <div className='rounded-lg border border-gray-200 p-4'>
            <div className='mb-1 flex items-center gap-2'>
                <span className='font-medium'>{variant.name}</span>
                <span className='badge badge-sm badge-ghost'>
                    {variant.type === 'query' ? 'Query' : 'Mutation list'}
                </span>
            </div>
            {variant.description !== null && <p className='mb-3 text-sm text-gray-500'>{variant.description}</p>}
            {variant.type === 'query' ? (
                <QueryVariantDetails variant={variant} />
            ) : (
                <FilterObjectVariantDetails variant={variant} />
            )}
        </div>
    );
}

function QueryVariantDetails({ variant }: { variant: Extract<Variant, { type: 'query' }> }) {
    return (
        <dl className='grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm'>
            <dt className='text-gray-500'>Count query</dt>
            <dd className='font-mono'>{variant.countQuery}</dd>
            {variant.coverageQuery !== null && (
                <>
                    <dt className='text-gray-500'>Coverage query</dt>
                    <dd className='font-mono'>{variant.coverageQuery}</dd>
                </>
            )}
        </dl>
    );
}

function FilterObjectVariantDetails({ variant }: { variant: Extract<Variant, { type: 'filterObject' }> }) {
    const fields: { key: keyof typeof variant.filterObject; label: string }[] = [
        { key: 'aminoAcidMutations', label: 'AA mutations' },
        { key: 'nucleotideMutations', label: 'Nucleotide mutations' },
        { key: 'aminoAcidInsertions', label: 'AA insertions' },
        { key: 'nucleotideInsertions', label: 'Nucleotide insertions' },
    ];

    const presentFields = fields.filter(({ key }) => {
        const val = variant.filterObject[key];
        return Array.isArray(val) && val.length > 0;
    });

    if (presentFields.length === 0) {
        return <p className='text-sm text-gray-500'>No mutations defined.</p>;
    }

    return (
        <dl className='grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm'>
            {presentFields.map(({ key, label }) => {
                const val = variant.filterObject[key];
                return (
                    <>
                        <dt key={`${key}-dt`} className='text-gray-500'>
                            {label}
                        </dt>
                        <dd key={`${key}-dd`} className='font-mono'>
                            {Array.isArray(val) ? val.join(', ') : ''}
                        </dd>
                    </>
                );
            })}
        </dl>
    );
}
