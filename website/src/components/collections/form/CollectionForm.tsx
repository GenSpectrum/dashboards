import { useCallback, useState } from 'react';

import { VariantEditor } from './VariantEditor.tsx';
import type { DashboardsConfig } from '../../../config.ts';
import type { VariantUpdate } from '../../../types/Collection.ts';
import { organismConfig, type Organism } from '../../../types/Organism.ts';
import { GsApp } from '../../genspectrum/GsApp.tsx';

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
    organism: Organism;
    config: DashboardsConfig;
};

export function CollectionForm({
    initialValues,
    onSubmit,
    isSubmitting,
    isSuccess,
    successMessage,
    submitLabel,
    organism,
    config,
}: Props) {
    const lapisUrl = config.dashboards.organisms[organism].lapis.url;
    const lineageFields = config.dashboards.organisms[organism].lapis.lineageFields ?? [];
    const [name, setName] = useState(initialValues?.name ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [variants, setVariants] = useState(
        initialValues?.variants ?? [{ type: 'filterObject', name: 'Variant 1', filterObject: {} }],
    );

    const addVariant = useCallback(() => {
        setVariants((prev) => [
            ...prev,
            { type: 'filterObject', name: `Variant ${prev.length + 1}`, filterObject: {} },
        ]);
    }, []);

    const updateVariant = useCallback((index: number, variant: VariantUpdate) => {
        setVariants((prev) => prev.map((v, i) => (i === index ? variant : v)));
    }, []);

    const removeVariant = useCallback((index: number) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const title = initialValues ? 'Edit collection' : 'New collection';

    return (
        <GsApp lapis={lapisUrl}>
            <div className='flex flex-col gap-6'>
                <h1 className='text-2xl font-semibold'>{title}</h1>
                <div className='grid grid-cols-3 gap-x-8 pb-16'>
                    <div className='text-sm text-gray-500'>
                        General information about this {organismConfig[organism].label} collection.
                    </div>
                    <div className='col-span-2 flex flex-col gap-4'>
                        <div>
                            <label className='label'>Name</label>
                            <input
                                className='input input-bordered w-full'
                                placeholder='A name to identify this collection.'
                                value={name}
                                onChange={(e) => setName(e.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label className='label'>Description</label>
                            <textarea
                                className='textarea textarea-bordered min-h-12 w-full'
                                placeholder='Optional description for this collection.'
                                value={description}
                                onChange={(e) => setDescription(e.currentTarget.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-x-8'>
                    <div className='text-sm text-gray-500'>
                        <p className='text-lg font-medium text-gray-700'>Variants</p>
                        <p className='mt-1'>
                            Define the variants to track in this collection. Each variant can be defined as a query or a
                            mutation list.
                        </p>
                    </div>
                    <div className='col-span-2 flex flex-col gap-4'>
                        {variants.map((variant, index) => (
                            <VariantEditor
                                key={index}
                                index={index}
                                variant={variant}
                                onChange={updateVariant}
                                onRemove={removeVariant}
                                canRemove={variants.length > 1}
                                lineageFields={lineageFields}
                            />
                        ))}
                        <button type='button' className='btn btn-sm w-full' onClick={addVariant}>
                            Add variant
                        </button>
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
        </GsApp>
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
