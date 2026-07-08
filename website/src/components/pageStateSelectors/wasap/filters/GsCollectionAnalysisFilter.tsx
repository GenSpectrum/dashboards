import { useQuery } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../../backendApi/backendService';
import type { WasapCollectionFilter } from '../../../views/wasap/wasapPageConfig';
import { LabeledField } from '../utils/LabeledField';

export function GsCollectionAnalysisFilter({
    pageState,
    setPageState,
    organism,
}: {
    pageState: WasapCollectionFilter;
    setPageState: (newState: WasapCollectionFilter) => void;
    organism: string;
}) {
    const {
        data: collections,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['gsCollections', organism],
        queryFn: () => getBackendServiceForClientside().getCollectionSummaries({ organism }),
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
                            #{collection.id} {collection.name}
                        </option>
                    ))}
                </select>
            )}
        </LabeledField>
    );
}
