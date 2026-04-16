import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import type { DashboardsConfig } from '../../../config.ts';
import type { VariantUpdate } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { CollectionForm, type CollectionFormValues } from '../form/CollectionForm.tsx';

export const CollectionEdit = withQueryProvider(CollectionEditInner);

const logger = getClientLogger('CollectionEdit');

function CollectionEditInner({ id, organism, config }: { id: string; organism: Organism; config: DashboardsConfig }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const {
        isLoading,
        isError,
        data: collection,
        error,
    } = useQuery({
        queryKey: ['collection', id],
        queryFn: () => getBackendServiceForClientside().getCollection({ id }),
    });

    const updateMutation = useMutation({
        mutationFn: (values: CollectionFormValues) =>
            getBackendServiceForClientside().putCollection({
                id,
                collection: {
                    name: values.name,
                    description: values.description || undefined,
                    variants: values.variants,
                },
            }),
        onSuccess: (updated) => {
            window.location.href = Page.viewCollection(organism, String(updated.id));
        },
        onError: (err) => {
            logger.error(`Failed to update collection: ${getErrorLogMessage(err)}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => getBackendServiceForClientside().deleteCollection({ id }),
        onSuccess: () => {
            window.location.href = Page.collectionsForOrganism(organism);
        },
        onError: (err) => {
            logger.error(`Failed to delete collection: ${getErrorLogMessage(err)}`);
        },
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

    const initialValues: CollectionFormValues = {
        name: collection.name,
        description: collection.description ?? '',
        variants: collection.variants.map((v): VariantUpdate => {
            if (v.type === 'query') {
                return {
                    type: 'query',
                    id: v.id,
                    name: v.name,
                    description: v.description ?? undefined,
                    countQuery: v.countQuery,
                    coverageQuery: v.coverageQuery ?? undefined,
                };
            }
            return {
                type: 'filterObject',
                id: v.id,
                name: v.name,
                description: v.description ?? undefined,
                filterObject: v.filterObject,
            };
        }),
    };

    return (
        <div className='flex flex-col gap-8 pb-6'>
            <CollectionForm
                initialValues={initialValues}
                onSubmit={(values) => updateMutation.mutate(values)}
                isSubmitting={updateMutation.isPending}
                isSuccess={updateMutation.isSuccess}
                successMessage='Collection updated.'
                submitLabel='Save changes'
                organism={organism}
                config={config}
            />

            {updateMutation.isError && (
                <div className='alert alert-error'>
                    Failed to update collection: {getErrorLogMessage(updateMutation.error)}
                </div>
            )}

            <div className='border-t border-gray-200 pt-6'>
                <h2 className='text-error mb-3 text-lg font-semibold'>Danger zone</h2>
                {!showDeleteConfirm ? (
                    <button
                        type='button'
                        className='btn btn-sm btn-error btn-outline'
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Delete collection
                    </button>
                ) : (
                    <div className='border-error rounded-lg border p-4'>
                        <p className='mb-3 text-sm'>
                            Are you sure you want to delete <strong>{collection.name}</strong>? This cannot be undone.
                        </p>
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                className='btn btn-sm btn-error'
                                onClick={() => deleteMutation.mutate()}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && <span className='loading loading-spinner loading-sm' />}
                                Yes, delete
                            </button>
                            <button
                                type='button'
                                className='btn btn-sm btn-ghost'
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                        {deleteMutation.isError && (
                            <div className='text-error mt-2 text-sm'>
                                Failed to delete: {getErrorLogMessage(deleteMutation.error)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
