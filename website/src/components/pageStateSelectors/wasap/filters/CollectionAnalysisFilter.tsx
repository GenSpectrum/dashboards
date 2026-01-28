import { useQuery } from '@tanstack/react-query';

import { getCollections } from '../../../../covspectrum/getCollections';
import type { WasapCollectionFilter } from '../../../views/wasap/wasapPageConfig';
import { LabeledField } from '../utils/LabeledField';

export function CollectionAnalysisFilter({
    pageState,
    setPageState,
    collectionsApiBaseUrl,
}: {
    pageState: WasapCollectionFilter;
    setPageState: (newState: WasapCollectionFilter) => void;
    collectionsApiBaseUrl: string;
}) {
    const {
        data: collections,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['collections', collectionsApiBaseUrl],
        queryFn: () => getCollections(collectionsApiBaseUrl),
    });

    return (
        <LabeledField label='Collection'>
            {isPending ? (
                <div className='text-sm text-gray-500'>Loading collections...</div>
            ) : isError ? (
                <div className='text-error text-sm'>Error loading collections</div>
            ) : (
                <select
                    className='select select-bordered'
                    value={pageState.collectionId ?? ''}
                    onChange={(e) =>
                        setPageState({
                            ...pageState,
                            collectionId: e.target.value ? Number(e.target.value) : undefined,
                        })
                    }
                >
                    <option value=''>Select a collection...</option>
                    {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                            #{collection.id} {collection.title}
                        </option>
                    ))}
                </select>
            )}
        </LabeledField>
    );
}
