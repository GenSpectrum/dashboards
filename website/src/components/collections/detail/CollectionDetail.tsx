import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import {
    FILTER_OBJECT_ARRAY_FIELD_LABELS,
    getLineageFields,
    type Collection,
    type Variant,
} from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';

export function CollectionDetail({ collection, editHref }: { collection: Collection; editHref?: string }) {
    const organismName = organismConfig[collection.organism as Organism].label;

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <div className='flex items-start justify-between'>
                    <PageHeadline>
                        <span className='mr-2 font-normal text-gray-400'>#{collection.id}</span>
                        {collection.name}
                    </PageHeadline>
                    {editHref !== undefined && (
                        <a href={editHref} className='btn btn-sm'>
                            Edit
                        </a>
                    )}
                </div>
                {collection.description !== null && <p className='mt-1 text-gray-500'>{collection.description}</p>}
                <p className='mt-1 text-sm text-gray-500'>
                    {organismName} collection owned by {collection.ownedBy}
                </p>
            </div>

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
        </div>
    );
}

function VariantCard({ variant }: { variant: Variant }) {
    return (
        <div className='rounded-lg border border-gray-200 p-4'>
            <div className='mb-1'>
                <span className='font-medium'>{variant.name}</span>
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
    const { filterObject } = variant;
    const lineageFields = getLineageFields(filterObject);

    const { aminoAcidMutations, nucleotideMutations, aminoAcidInsertions, nucleotideInsertions } = filterObject;

    const hasArrayFields =
        (aminoAcidMutations?.length ?? 0) > 0 ||
        (nucleotideMutations?.length ?? 0) > 0 ||
        (aminoAcidInsertions?.length ?? 0) > 0 ||
        (nucleotideInsertions?.length ?? 0) > 0;

    if (!hasArrayFields && lineageFields.length === 0) {
        return <p className='text-sm text-gray-500'>No mutations defined.</p>;
    }

    return (
        <dl className='grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm'>
            {aminoAcidMutations !== undefined && aminoAcidMutations.length > 0 && (
                <>
                    <dt className='text-gray-500'>{FILTER_OBJECT_ARRAY_FIELD_LABELS.aminoAcidMutations}</dt>
                    <dd className='font-mono'>{aminoAcidMutations.join(', ')}</dd>
                </>
            )}
            {nucleotideMutations !== undefined && nucleotideMutations.length > 0 && (
                <>
                    <dt className='text-gray-500'>{FILTER_OBJECT_ARRAY_FIELD_LABELS.nucleotideMutations}</dt>
                    <dd className='font-mono'>{nucleotideMutations.join(', ')}</dd>
                </>
            )}
            {aminoAcidInsertions !== undefined && aminoAcidInsertions.length > 0 && (
                <>
                    <dt className='text-gray-500'>{FILTER_OBJECT_ARRAY_FIELD_LABELS.aminoAcidInsertions}</dt>
                    <dd className='font-mono'>{aminoAcidInsertions.join(', ')}</dd>
                </>
            )}
            {nucleotideInsertions !== undefined && nucleotideInsertions.length > 0 && (
                <>
                    <dt className='text-gray-500'>{FILTER_OBJECT_ARRAY_FIELD_LABELS.nucleotideInsertions}</dt>
                    <dd className='font-mono'>{nucleotideInsertions.join(', ')}</dd>
                </>
            )}
            {lineageFields.map(([key, val]) => (
                <>
                    <dt key={`${key}-dt`} className='text-gray-500'>
                        {key}
                    </dt>
                    <dd key={`${key}-dd`} className='font-mono'>
                        {val}
                    </dd>
                </>
            ))}
        </dl>
    );
}
