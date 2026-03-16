import { useQuery } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Collection, Variant } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

export const CollectionDetail = withQueryProvider(CollectionDetailInner);

const logger = getClientLogger('CollectionDetail');

function CollectionDetailInner({ organism, id, userId }: { organism: Organism; id: string; userId?: string }) {
    const { isLoading, isError, data: collection, error } = useQuery({
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
            <div className='flex items-start justify-between'>
                <div>
                    <PageHeadline>{collection.name}</PageHeadline>
                    {collection.description !== null && (
                        <p className='text-base-content/70 mt-1'>{collection.description}</p>
                    )}
                </div>
                {userId === collection.ownedBy && (
                    <a href={Page.editCollection(organism, id)} className='btn btn-secondary btn-sm'>
                        Edit
                    </a>
                )}
            </div>

            <BorderedCard>
                <CardHeader>
                    <CardDescription title='Details' />
                </CardHeader>
                <CardContent>
                    <dl className='grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm'>
                        <dt className='text-base-content/50'>ID</dt>
                        <dd className='font-mono'>{collection.id}</dd>
                        <dt className='text-base-content/50'>Organism</dt>
                        <dd>{collection.organism}</dd>
                        <dt className='text-base-content/50'>Owner</dt>
                        <dd>{collection.ownedBy}</dd>
                    </dl>
                </CardContent>
            </BorderedCard>

            <VariantsCard collection={collection} />
        </div>
    );
}

function VariantsCard({ collection }: { collection: Collection }) {
    return (
        <BorderedCard>
            <CardHeader>
                <CardDescription title={`Variants (${collection.variants.length})`} />
            </CardHeader>
            <CardContent>
                {collection.variants.length === 0 ? (
                    <p className='text-sm text-base-content/50'>No variants defined.</p>
                ) : (
                    <div className='flex flex-col gap-3'>
                        {collection.variants.map((variant) => (
                            <VariantCard key={variant.id} variant={variant} />
                        ))}
                    </div>
                )}
            </CardContent>
        </BorderedCard>
    );
}

function VariantCard({ variant }: { variant: Variant }) {
    return (
        <div className='rounded-lg border border-gray-200 p-4'>
            <div className='flex items-center gap-2 mb-1'>
                <span className='font-medium'>{variant.name}</span>
                <span className='badge badge-sm badge-ghost'>
                    {variant.type === 'query' ? 'Query' : 'Mutation list'}
                </span>
            </div>
            {variant.description !== null && (
                <p className='text-sm text-base-content/60 mb-3'>{variant.description}</p>
            )}
            {variant.type === 'query' ? (
                <QueryVariantDetails variant={variant} />
            ) : (
                <MutationListVariantDetails variant={variant} />
            )}
        </div>
    );
}

function QueryVariantDetails({ variant }: { variant: Extract<Variant, { type: 'query' }> }) {
    return (
        <dl className='grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm'>
            <dt className='text-base-content/50'>Count query</dt>
            <dd className='font-mono'>{variant.countQuery}</dd>
            {variant.coverageQuery !== null && (
                <>
                    <dt className='text-base-content/50'>Coverage query</dt>
                    <dd className='font-mono'>{variant.coverageQuery}</dd>
                </>
            )}
        </dl>
    );
}

function MutationListVariantDetails({ variant }: { variant: Extract<Variant, { type: 'mutationList' }> }) {
    const fields: { key: string; label: string }[] = [
        { key: 'aaMutations', label: 'AA mutations' },
        { key: 'nucMutations', label: 'Nucleotide mutations' },
        { key: 'aaInsertions', label: 'AA insertions' },
        { key: 'nucInsertions', label: 'Nucleotide insertions' },
    ];

    const presentFields = fields.filter(({ key }) => {
        const val = (variant.mutationList as Record<string, unknown>)[key];
        return Array.isArray(val) && val.length > 0;
    });

    if (presentFields.length === 0) {
        return <p className='text-sm text-base-content/50'>No mutations defined.</p>;
    }

    return (
        <dl className='grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm'>
            {presentFields.map(({ key, label }) => {
                const val = (variant.mutationList as Record<string, string[]>)[key];
                return (
                    <>
                        <dt key={`${key}-dt`} className='text-base-content/50'>{label}</dt>
                        <dd key={`${key}-dd`} className='font-mono'>{val.join(', ')}</dd>
                    </>
                );
            })}
        </dl>
    );
}
