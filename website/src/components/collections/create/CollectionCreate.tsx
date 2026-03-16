import { useMutation } from '@tanstack/react-query';

import { CollectionForm, type CollectionFormValues } from '../form/CollectionForm.tsx';
import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';

export const CollectionCreate = withQueryProvider(CollectionCreateInner);

const logger = getClientLogger('CollectionCreate');

function CollectionCreateInner({ organism, userId }: { organism: Organism; userId: string }) {
    const { showErrorToast } = useErrorToast(logger);

    const createCollection = useMutation({
        mutationFn: (values: CollectionFormValues) =>
            getBackendServiceForClientside().postCollection({
                collection: {
                    name: values.name,
                    organism,
                    description: values.description || undefined,
                    variants: values.variants,
                },
            }),
        onSuccess: () => {
            window.location.href = Page.collectionsForOrganism(organism);
        },
        onError: (error) => {
            showErrorToast({
                error,
                logMessage: `Failed to create collection: ${getErrorLogMessage(error)}`,
                errorToastMessages: ['We could not create your collection. Please try again later.'],
            });
        },
    });

    return (
        <>
            <PageHeadline>New collection</PageHeadline>
            <CollectionForm
                onSubmit={createCollection.mutate}
                isSubmitting={createCollection.isPending}
                isSuccess={createCollection.isSuccess}
                successMessage='Collection created'
                submitLabel='Create collection'
            />
        </>
    );
}
