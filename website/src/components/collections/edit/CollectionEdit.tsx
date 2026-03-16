import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';
import { CollectionForm, type CollectionFormValues } from '../form/CollectionForm.tsx';

export const CollectionEdit = withQueryProvider(CollectionEditInner);

const logger = getClientLogger('CollectionEdit');

function CollectionEditInner({ organism, id }: { organism: Organism; id: string }) {
    const { showErrorToast } = useErrorToast(logger);

    const {
        isLoading,
        isError,
        data: collection,
        error: fetchError,
    } = useQuery({
        queryKey: ['collection', id],
        queryFn: () => getBackendServiceForClientside().getCollection({ id }),
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const deleteCollection = useMutation({
        mutationFn: () => getBackendServiceForClientside().deleteCollection({ id }),
        onSuccess: () => {
            window.location.href = Page.collectionsForOrganism(organism);
        },
        onError: (error) => {
            showErrorToast({
                error,
                logMessage: `Failed to delete collection: ${getErrorLogMessage(error)}`,
                errorToastMessages: ['We could not delete your collection. Please try again later.'],
            });
        },
    });

    const updateCollection = useMutation({
        mutationFn: (values: CollectionFormValues) =>
            getBackendServiceForClientside().putCollection({
                id,
                collection: {
                    name: values.name,
                    description: values.description || undefined,
                    variants: values.variants,
                },
            }),
        onSuccess: () => {
            window.location.href = Page.viewCollection(organism, id);
        },
        onError: (error) => {
            showErrorToast({
                error,
                logMessage: `Failed to update collection: ${getErrorLogMessage(error)}`,
                errorToastMessages: ['We could not update your collection. Please try again later.'],
            });
        },
    });

    if (isLoading) {
        return <span className='loading loading-spinner loading-sm' />;
    }

    if (isError || collection === undefined) {
        logger.error(`Failed to fetch collection: ${getErrorLogMessage(fetchError)}`);
        return <div className='text-error'>Failed to load collection. Please try reloading the page.</div>;
    }

    const initialValues: CollectionFormValues = {
        name: collection.name,
        description: collection.description ?? '',
        variants: collection.variants.map((v) =>
            v.type === 'query'
                ? {
                      type: 'query',
                      id: v.id,
                      name: v.name,
                      description: v.description ?? undefined,
                      countQuery: v.countQuery,
                      coverageQuery: v.coverageQuery ?? undefined,
                  }
                : {
                      type: 'mutationList',
                      id: v.id,
                      name: v.name,
                      description: v.description ?? undefined,
                      mutationList: v.mutationList,
                  },
        ),
    };

    return (
        <>
            <div className='mb-2 flex items-center justify-between'>
                <PageHeadline>Edit collection</PageHeadline>
                <button type='button' className='btn btn-error btn-sm' onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                </button>
            </div>

            {showDeleteConfirm && (
                <div className='alert alert-warning mb-4 flex items-center justify-between'>
                    <span>Are you sure you want to delete this collection? This cannot be undone.</span>
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            className='btn btn-sm'
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleteCollection.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            className='btn btn-error btn-sm'
                            onClick={() => deleteCollection.mutate()}
                            disabled={deleteCollection.isPending}
                        >
                            {deleteCollection.isPending ? (
                                <span className='loading loading-spinner loading-sm' />
                            ) : (
                                'Confirm delete'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <CollectionForm
                initialValues={initialValues}
                onSubmit={updateCollection.mutate}
                isSubmitting={updateCollection.isPending}
                isSuccess={updateCollection.isSuccess}
                successMessage='Collection updated'
                submitLabel='Save changes'
            />
        </>
    );
}
