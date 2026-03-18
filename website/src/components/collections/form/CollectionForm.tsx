import { useState } from 'react';

import { VariantEditor } from './VariantEditor.tsx';
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
    const [variants, setVariants] = useState<VariantUpdate[]>(
        initialValues?.variants ?? [{ type: 'query', name: 'Variant 1', countQuery: '' }],
    );

    function addVariant() {
        setVariants((prev) => [
            ...prev,
            { type: 'query', name: `Variant ${prev.length + 1}`, countQuery: '' },
        ]);
    }

    function updateVariant(index: number, variant: VariantUpdate) {
        setVariants((prev) => prev.map((v, i) => (i === index ? variant : v)));
    }

    function removeVariant(index: number) {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <div className='flex flex-col gap-6'>
            <div className='grid grid-cols-3 gap-x-8'>
                <div className='text-sm text-gray-500'>
                    General information about this collection, such as its name and an optional description.
                </div>
                <div className='col-span-2 flex flex-col gap-4'>
                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium'>Name</label>
                        <input
                            className='input input-sm input-bordered w-full'
                            placeholder='A name to identify this collection.'
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                        />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label className='text-sm font-medium'>Description</label>
                        <textarea
                            className='textarea textarea-bordered w-full'
                            rows={3}
                            placeholder='Optional description for this collection.'
                            value={description}
                            onChange={(e) => setDescription(e.currentTarget.value)}
                        />
                    </div>
                </div>
            </div>

            <div className='divider' />

            <div className='grid grid-cols-3 gap-x-8'>
                <div className='text-sm text-gray-500'>
                    <p className='font-medium text-gray-700'>Variants</p>
                    <p className='mt-1'>
                        Define the variants to track in this collection. Each variant can be defined as a query or a
                        mutation list.
                    </p>
                </div>
                <div className='col-span-2 flex flex-col gap-4'>
                    {variants.map((variant, index) => (
                        <VariantEditor
                            key={index}
                            variant={variant}
                            index={index}
                            onChange={(v) => updateVariant(index, v)}
                            onRemove={() => removeVariant(index)}
                            canRemove={variants.length > 1}
                        />
                    ))}
                    <div>
                        <button type='button' className='btn btn-secondary btn-sm' onClick={addVariant}>
                            Add variant
                        </button>
                    </div>
                </div>
            </div>

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
