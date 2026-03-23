import { useMutation } from '@tanstack/react-query';

import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import type { DashboardsConfig } from '../../../config.ts';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { CollectionForm, type CollectionFormValues } from '../form/CollectionForm.tsx';

export const CollectionCreate = withQueryProvider(CollectionCreateInner);

const logger = getClientLogger('CollectionCreate');

function CollectionCreateInner({ organism, config }: { organism: Organism; config: DashboardsConfig }) {
    const createMutation = useMutation({
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
        onError: (err) => {
            logger.error(`Failed to create collection: ${getErrorLogMessage(err)}`);
        },
    });

    return (
        <>
            <CollectionForm
                onSubmit={(values) => createMutation.mutate(values)}
                isSubmitting={createMutation.isPending}
                isSuccess={createMutation.isSuccess}
                successMessage='Collection created.'
                submitLabel='Create collection'
                organism={organism}
                config={config}
            />
            {createMutation.isError && (
                <div className='alert alert-error mt-4'>
                    Failed to create collection: {getErrorLogMessage(createMutation.error)}
                </div>
            )}
        </>
    );
}
