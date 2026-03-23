import { useState } from 'react';

import type { DashboardsConfig } from '../../../config.ts';
import type { VariantUpdate } from '../../../types/Collection.ts';
import type { Organism } from '../../../types/Organism.ts';
import { GsApp } from '../../genspectrum/GsApp.tsx';
import { VariantEditor } from './VariantEditor.tsx';

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
    const [name, setName] = useState(initialValues?.name ?? '');
    const [description, setDescription] = useState(initialValues?.description ?? '');
    const [variants, setVariants] = useState<VariantUpdate[]>(initialValues?.variants ?? []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, description, variants });
    };

    return (
        <GsApp lapis={lapisUrl}>
            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                {isSuccess && <div className='alert alert-success'>{successMessage}</div>}

                <div className='flex flex-col gap-4'>
                    <div className='form-control'>
                        <label className='label'>
                            <span className='label-text font-medium'>Name</span>
                        </label>
                        <input
                            type='text'
                            className='input input-bordered'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className='form-control'>
                        <label className='label'>
                            <span className='label-text font-medium'>Description</span>
                        </label>
                        <textarea
                            className='textarea textarea-bordered'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div>
                    <h2 className='mb-3 text-lg font-semibold'>Variants</h2>
                    <div className='flex flex-col gap-4'>
                        {variants.map((variant, index) => (
                            <VariantEditor
                                key={index}
                                variant={variant}
                                onChange={(updated) => {
                                    const next = [...variants];
                                    next[index] = updated;
                                    setVariants(next);
                                }}
                                onRemove={() => setVariants(variants.filter((_, i) => i !== index))}
                            />
                        ))}
                    </div>
                    <button
                        type='button'
                        className='btn btn-sm btn-ghost mt-3'
                        onClick={() =>
                            setVariants([...variants, { type: 'filterObject', name: '', filterObject: {} }])
                        }
                    >
                        + Add variant
                    </button>
                </div>

                <div>
                    <button type='submit' className='btn btn-primary' disabled={isSubmitting}>
                        {isSubmitting && <span className='loading loading-spinner loading-sm' />}
                        {submitLabel}
                    </button>
                </div>
            </form>
        </GsApp>
    );
}
