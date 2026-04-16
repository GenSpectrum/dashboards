import { memo, useCallback, useRef } from 'react';

import type { FilterObject, VariantUpdate } from '../../../types/Collection.ts';
import { GsLineageFilter } from '../../genspectrum/GsLineageFilter.tsx';
import { GsMutationFilter } from '../../genspectrum/GsMutationFilter.tsx';

type Props = {
    index: number;
    variant: VariantUpdate;
    onChange: (index: number, variant: VariantUpdate) => void;
    onRemove: (index: number) => void;
    canRemove?: boolean;
    lineageFields: string[];
};

export const VariantEditor = memo(function VariantEditor({
    index,
    variant,
    onChange,
    onRemove,
    canRemove = true,
    lineageFields,
}: Props) {
    const variantRef = useRef(variant);
    variantRef.current = variant;

    function setField(fields: Partial<VariantUpdate>) {
        onChange(index, { ...variant, ...fields } as VariantUpdate);
    }

    function switchType(type: 'query' | 'filterObject') {
        if (type === 'query') {
            onChange(index, { type: 'query', name: variant.name, description: variant.description, countQuery: '' });
        } else {
            onChange(index, {
                type: 'filterObject',
                name: variant.name,
                description: variant.description,
                filterObject: {},
            });
        }
    }

    const handleFilterObjectChange = useCallback(
        (filterObject: FilterObject) => {
            onChange(index, { ...variantRef.current, filterObject } as VariantUpdate);
        },
        [index, onChange],
    );

    return (
        <div className='grid grid-cols-3 gap-x-8 rounded bg-gray-50 p-4'>
            <div className='flex h-full flex-col gap-2'>
                <div>
                    <label className='label'>Name</label>
                    <input
                        className='input input-bordered font-medium'
                        placeholder='Variant name'
                        value={variant.name}
                        onChange={(e) => setField({ name: e.currentTarget.value })}
                    />
                </div>
                <div className='flex flex-1 flex-col'>
                    <label className='label'>Description</label>
                    <textarea
                        className='textarea textarea-bordered flex-1'
                        placeholder='Optional description for this variant.'
                        value={variant.description ?? ''}
                        onChange={(e) => setField({ description: e.currentTarget.value || undefined })}
                    />
                </div>
            </div>

            <div className='col-span-2 flex flex-col gap-4'>
                {variant.type === 'query' ? (
                    <QueryVariantFields variant={variant} onChange={(v) => onChange(index, v)} />
                ) : (
                    <MutationListVariantFields
                        filterObject={variant.filterObject}
                        onChange={handleFilterObjectChange}
                        lineageFields={lineageFields}
                    />
                )}

                <div className='flex items-center justify-between'>
                    <label className='flex cursor-pointer items-center gap-2 text-sm text-gray-500'>
                        <input
                            type='checkbox'
                            className='checkbox checkbox-xs'
                            checked={variant.type === 'query'}
                            onChange={(e) => switchType(e.currentTarget.checked ? 'query' : 'filterObject')}
                        />
                        Use advanced query instead
                    </label>
                    {canRemove && (
                        <button
                            type='button'
                            className='btn btn-error btn-outline btn-xs'
                            onClick={() => onRemove(index)}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

function QueryVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantUpdate, { type: 'query' }>;
    onChange: (v: VariantUpdate) => void;
}) {
    return (
        <div className='flex flex-col'>
            <label className='label'>Query</label>
            <textarea
                className='textarea textarea-bordered w-full max-w-xl font-mono text-sm'
                placeholder='LAPIS filter expression for counting sequences matching this variant.'
                value={variant.countQuery}
                onChange={(e) => onChange({ ...variant, countQuery: e.currentTarget.value })}
            />
        </div>
    );
}

const MutationListVariantFields = memo(function MutationListVariantFields({
    filterObject,
    onChange,
    lineageFields,
}: {
    filterObject: Extract<VariantUpdate, { type: 'filterObject' }>['filterObject'];
    onChange: (filterObject: FilterObject) => void;
    lineageFields: string[];
}) {
    return (
        <div className='flex flex-col gap-3'>
            <GsMutationFilter
                initialValue={{
                    aminoAcidMutations: filterObject.aminoAcidMutations ?? [],
                    nucleotideMutations: filterObject.nucleotideMutations ?? [],
                    aminoAcidInsertions: filterObject.aminoAcidInsertions ?? [],
                    nucleotideInsertions: filterObject.nucleotideInsertions ?? [],
                }}
                onMutationChange={(mutationFilter) => {
                    onChange({
                        ...filterObject,
                        aminoAcidMutations: mutationFilter?.aminoAcidMutations,
                        nucleotideMutations: mutationFilter?.nucleotideMutations,
                        aminoAcidInsertions: mutationFilter?.aminoAcidInsertions,
                        nucleotideInsertions: mutationFilter?.nucleotideInsertions,
                    } as FilterObject);
                }}
            />
            {lineageFields.map((field) => (
                <label key={field} className='form-control'>
                    <div className='label'>
                        <span className='label-text'>{field}</span>
                    </div>
                    <GsLineageFilter
                        lapisField={field}
                        value={filterObject[field] as string | undefined}
                        lapisFilter={{}}
                        onLineageChange={(lineage) =>
                            onChange({ ...filterObject, [field]: lineage[field] ?? undefined } as FilterObject)
                        }
                    />
                </label>
            ))}
        </div>
    );
});
