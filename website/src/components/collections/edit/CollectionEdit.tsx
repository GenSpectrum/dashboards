import { useMutation, useQuery } from '@tanstack/react-query';

import { CollectionForm, type CollectionFormValues } from '../form/CollectionForm.tsx';
import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';

export const CollectionEdit = withQueryProvider(CollectionEditInner);

const logger = getClientLogger('CollectionEdit');

function CollectionEditInner({ organism, id }: { organism: Organism; id: string }) {
    const { showErrorToast } = useErrorToast(logger);

    const { isLoading, isError, data: collection, error: fetchError } = useQuery({
        queryKey: ['collection', id],
        queryFn: () => getBackendServiceForClientside().getCollection({ id }),
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
            <PageHeadline>Edit collection</PageHeadline>
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
