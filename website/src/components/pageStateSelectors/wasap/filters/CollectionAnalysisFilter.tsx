import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getBackendServiceForClientside } from '../../../../backendApi/backendService';
import type { WasapCollectionFilter } from '../../../views/wasap/wasapPageConfig';
import { LabeledField } from '../utils/LabeledField';

type CollectionAnalysisFilterProps = {
    pageState: WasapCollectionFilter;
    setPageState: (newState: WasapCollectionFilter) => void;
    organism: string;
};

export function CollectionAnalysisFilter({ pageState, setPageState, organism }: CollectionAnalysisFilterProps) {
    const {
        data: collections,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['collections', organism],
        queryFn: () => getBackendServiceForClientside().getCollectionSummaries({ organism }),
    });

    const firstCollectionId = collections?.[0]?.id;
    useEffect(() => {
        if (firstCollectionId !== undefined && pageState.collectionId === undefined) {
            setPageState({ ...pageState, collectionId: firstCollectionId });
        }
    }, [firstCollectionId, pageState, setPageState]);

    return (
        <LabeledField label='Collection'>
            {isPending ? (
                <div className='text-sm text-gray-500'>Loading collections...</div>
            ) : isError ? (
                <div className='text-error text-sm'>Error loading collections</div>
            ) : collections.length === 0 ? (
                <div className='text-sm text-gray-500'>No collections available</div>
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
