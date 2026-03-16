import { useState } from 'react';

import { VariantEditor } from './VariantEditor.tsx';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardContent } from '../../../styles/containers/CardContent.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { CardHeader } from '../../../styles/containers/CardHeader.tsx';
import type { VariantUpdate } from '../../../types/Collection.ts';

export type CollectionFormValues = {
    name: string;
    description: string;
    variants: VariantUpdate[];
};

type Props = {
    initialValues?: CollectionFormValues;
    onSubmit: (values: CollectionFormValues) => void;
    isSubmitting: boolean;
    isSuccess: boolean;
    successMessage: string;
    submitLabel: string;
};

export function CollectionForm({
    initialValues,
    onSubmit,
    isSubmitting,
    isSuccess,
    successMessage,
    submitLabel,
}: Props) {
    const [name, setName] = useState(initialValues?.name ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [variants, setVariants] = useState<VariantUpdate[]>(initialValues?.variants ?? []);

    function addVariant() {
        setVariants((prev) => [...prev, { type: 'query', name: '', countQuery: '' }]);
    }

    function updateVariant(index: number, variant: VariantUpdate) {
        setVariants((prev) => prev.map((v, i) => (i === index ? variant : v)));
    }

    function removeVariant(index: number) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-[2fr_3fr] gap-x-12 gap-y-6'>
                <div>
                    <div className='font-medium'>Name</div>
                    <p className='mt-1 text-sm text-gray-400'>A name to identify this collection.</p>
                </div>
                <input
                    className='input input-sm input-bordered w-full'
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                />
                <div>
                    <div className='font-medium'>Description</div>
                    <p className='mt-1 text-sm text-gray-400'>Optional description for this collection.</p>
                </div>
                <textarea
                    className='textarea textarea-bordered w-full'
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                />
            </div>

            <BorderedCard>
                <CardHeader>
                    <CardDescription title='Variants' />
                    <button type='button' className='btn btn-secondary btn-sm' onClick={addVariant}>
                        Add variant
                    </button>
                </CardHeader>
                <CardContent>
                    {variants.length === 0 ? (
                        <p className='text-sm text-gray-400'>No variants yet. Click "Add variant" to define one.</p>
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
                isSuccess={isSuccess}
                isPending={isSubmitting}
                isDisabled={name.trim() === ''}
                successMessage={successMessage}
                submitLabel={submitLabel}
                onClick={() => onSubmit({ name, description, variants })}
            />
        </div>
    );
}

function SubmitButton({
    isSuccess,
    isPending,
    isDisabled,
    successMessage,
    submitLabel,
    onClick,
}: {
    isSuccess: boolean;
    isPending: boolean;
    isDisabled: boolean;
    successMessage: string;
    submitLabel: string;
    onClick: () => void;
}) {
    if (isSuccess) {
        return (
            <div className='bg-success flex h-12 items-center justify-center rounded-lg'>
                {successMessage}
                <div className='iconify mdi--check ml-2 size-4' />
            </div>
        );
    }

    return (
        <button className='btn btn-primary' onClick={onClick} disabled={isDisabled || isPending}>
            {isPending ? <span className='loading loading-spinner loading-sm' /> : submitLabel}
        </button>
    );
}
