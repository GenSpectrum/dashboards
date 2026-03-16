import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { VariantEditor } from './VariantEditor.tsx';
import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import type { CollectionRequest, VariantRequest } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';
import { useErrorToast } from '../../ErrorReportInstruction.tsx';

export const CollectionCreate = withQueryProvider(CollectionCreateInner);

const logger = getClientLogger('CollectionCreate');

function CollectionCreateInner({ organism, userId }: { organism: Organism; userId: string }) {
    const { showErrorToast } = useErrorToast(logger);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [variants, setVariants] = useState<VariantRequest[]>([]);

    const createCollection = useMutation({
        mutationFn: () =>
            getBackendServiceForClientside().postCollection({
                collection: getCollectionRequest(),
                userId,
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

    function getCollectionRequest(): CollectionRequest {
        return {
            name,
            organism,
            description: description || undefined,
            variants,
        };
    }

    function addVariant() {
        setVariants((prev) => [...prev, { type: 'query', name: '', countQuery: '' }]);
    }

    function updateVariant(index: number, variant: VariantRequest) {
        setVariants((prev) => prev.map((v, i) => (i === index ? variant : v)));
    }

    function removeVariant(index: number) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <>
            <PageHeadline>New collection</PageHeadline>
            <div className='flex flex-col gap-4'>
                <BorderedCard>
                    <CardHeader>
                        <CardDescription title='General' />
                    </CardHeader>
                    <CardContent>
                        <div className='flex flex-col gap-4'>
                            <InputLabel title='Name' description='A name to identify this collection.'>
                                <input
                                    className='input input-sm input-bordered w-full max-w-xl'
                                    value={name}
                                    onChange={(e) => setName(e.currentTarget.value)}
                                />
                            </InputLabel>
                            <InputLabel title='Description' description='Optional description for this collection.'>
                                <textarea
                                    className='textarea textarea-bordered w-full max-w-xl'
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.currentTarget.value)}
                                />
                            </InputLabel>
                        </div>
                    </CardContent>
                </BorderedCard>

                <BorderedCard>
                    <CardHeader>
                        <CardDescription title='Variants' />
                        <button type='button' className='btn btn-secondary btn-sm' onClick={addVariant}>
                            Add variant
                        </button>
                    </CardHeader>
                    <CardContent>
                        {variants.length === 0 ? (
                            <p className='text-sm text-gray-400'>
                                No variants yet. Click "Add variant" to define one.
                            </p>
                        ) : (
                            <div className='flex flex-col gap-4'>
                                {variants.map((variant, index) => (
                                    <VariantEditor
                                        key={index}
                                        variant={variant}
                                        index={index}
                                        onChange={(v) => updateVariant(index, v)}
                                        onRemove={() => removeVariant(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </BorderedCard>

                <SubmitButton
                    isSuccess={createCollection.isSuccess}
                    isPending={createCollection.isPending}
                    isDisabled={name.trim() === ''}
                    onClick={createCollection.mutate}
                />
            </div>
        </>
    );
}

function SubmitButton({
    isSuccess,
    isPending,
    isDisabled,
    onClick,
}: {
    isSuccess: boolean;
    isPending: boolean;
    isDisabled: boolean;
    onClick: () => void;
}) {
    if (isSuccess) {
        return (
            <div className='bg-success flex h-12 items-center justify-center rounded-lg'>
                Collection created
                <div className='iconify mdi--check ml-2 size-4' />
            </div>
        );
    }

    return (
        <button className='btn btn-primary' onClick={onClick} disabled={isDisabled || isPending}>
            {isPending ? <span className='loading loading-spinner loading-sm' /> : 'Create collection'}
        </button>
    );
}
