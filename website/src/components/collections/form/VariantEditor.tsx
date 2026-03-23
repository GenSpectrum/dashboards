import { useCallback } from 'react';

import type { FilterObject, VariantUpdate } from '../../../types/Collection.ts';
import { type MutationFilter, GsMutationFilter } from '../../genspectrum/GsMutationFilter.tsx';

type Props = {
    variant: VariantUpdate;
    onChange: (variant: VariantUpdate) => void;
    onRemove: () => void;
};

export function VariantEditor({ variant, onChange, onRemove }: Props) {
    const handleTypeChange = (type: 'query' | 'filterObject') => {
        if (type === 'query') {
            onChange({ type: 'query', name: variant.name, description: variant.description, countQuery: '' });
        } else {
            onChange({ type: 'filterObject', name: variant.name, description: variant.description, filterObject: {} });
        }
    };

    return (
        <div className='flex flex-col gap-3 rounded-lg border border-gray-200 p-4'>
            <div className='flex items-start gap-3'>
                <div className='flex flex-1 flex-col gap-3'>
                    <div className='form-control'>
                        <label className='label'>
                            <span className='label-text'>Name</span>
                        </label>
                        <input
                            type='text'
                            className='input input-bordered input-sm'
                            value={variant.name}
                            onChange={(e) => onChange({ ...variant, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className='form-control'>
                        <label className='label'>
                            <span className='label-text'>Description</span>
                        </label>
                        <input
                            type='text'
                            className='input input-bordered input-sm'
                            value={variant.description ?? ''}
                            onChange={(e) =>
                                onChange({ ...variant, description: e.target.value || undefined })
                            }
                        />
                    </div>
                </div>
                <button type='button' className='btn btn-sm btn-ghost text-error' onClick={onRemove}>
                    Remove
                </button>
            </div>

            <div className='form-control'>
                <label className='label'>
                    <span className='label-text'>Type</span>
                </label>
                <select
                    className='select select-bordered select-sm'
                    value={variant.type}
                    onChange={(e) => handleTypeChange(e.target.value as 'query' | 'filterObject')}
                >
                    <option value='filterObject'>Filter object</option>
                    <option value='query'>Query</option>
                </select>
            </div>

            {variant.type === 'query' ? (
                <QueryVariantFields variant={variant} onChange={onChange} />
            ) : (
                <FilterObjectVariantFields variant={variant} onChange={onChange} />
            )}
        </div>
    );
}

function QueryVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantUpdate, { type: 'query' }>;
    onChange: (variant: VariantUpdate) => void;
}) {
    return (
        <>
            <div className='form-control'>
                <label className='label'>
                    <span className='label-text'>Count query</span>
                </label>
                <input
                    type='text'
                    className='input input-bordered input-sm font-mono'
                    value={variant.countQuery}
                    onChange={(e) => onChange({ ...variant, countQuery: e.target.value })}
                    required
                />
            </div>
            <div className='form-control'>
                <label className='label'>
                    <span className='label-text'>Coverage query (optional)</span>
                </label>
                <input
                    type='text'
                    className='input input-bordered input-sm font-mono'
                    value={variant.coverageQuery ?? ''}
                    onChange={(e) => onChange({ ...variant, coverageQuery: e.target.value || undefined })}
                />
            </div>
        </>
    );
}

function FilterObjectVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantUpdate, { type: 'filterObject' }>;
    onChange: (variant: VariantUpdate) => void;
}) {
    const handleMutationChange = useCallback(
        (mutationFilter: MutationFilter | undefined) => {
            onChange({
                ...variant,
                filterObject: {
                    aminoAcidMutations: mutationFilter?.aminoAcidMutations,
                    nucleotideMutations: mutationFilter?.nucleotideMutations,
                    aminoAcidInsertions: mutationFilter?.aminoAcidInsertions,
                    nucleotideInsertions: mutationFilter?.nucleotideInsertions,
                } as FilterObject,
            });
        },
        [onChange, variant],
    );

    const initialValue: MutationFilter = {
        aminoAcidMutations: variant.filterObject.aminoAcidMutations ?? [],
        nucleotideMutations: variant.filterObject.nucleotideMutations ?? [],
        aminoAcidInsertions: variant.filterObject.aminoAcidInsertions ?? [],
        nucleotideInsertions: variant.filterObject.nucleotideInsertions ?? [],
    };

    return <GsMutationFilter initialValue={initialValue} onMutationChange={handleMutationChange} />;
}
