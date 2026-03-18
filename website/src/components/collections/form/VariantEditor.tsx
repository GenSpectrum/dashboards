import { GsMutationFilter } from '../../genspectrum/GsMutationFilter.tsx';
import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import type { VariantUpdate } from '../../../types/Collection.ts';

type Props = {
    variant: VariantUpdate;
    onChange: (variant: VariantUpdate) => void;
    onRemove: () => void;
    canRemove?: boolean;
};

export function VariantEditor({ variant, onChange, onRemove, canRemove = true }: Props) {
    function setField(fields: Partial<VariantUpdate>) {
        onChange({ ...variant, ...fields } as VariantUpdate);
    }

    function switchType(type: 'query' | 'mutationList') {
        if (type === 'query') {
            onChange({ type: 'query', name: variant.name, description: variant.description, countQuery: '' });
        } else {
            onChange({ type: 'mutationList', name: variant.name, description: variant.description, mutationList: {} });
        }
    }

    return (
        <div className='grid grid-cols-3 gap-x-8 rounded-lg border border-gray-200 p-4'>
            <div className='flex flex-col gap-2 h-full'>
                <input
                    className='input input-sm input-bordered font-medium'
                    placeholder='Variant name'
                    value={variant.name}
                    onChange={(e) => setField({ name: e.currentTarget.value })}
                />
                <textarea
                    className='textarea textarea-bordered flex-1 resize-none'
                    placeholder='Optional description for this variant.'
                    value={variant.description ?? ''}
                    onChange={(e) => setField({ description: e.currentTarget.value || undefined })}
                />
            </div>

            <div className='col-span-2 flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2 text-sm'>
                        {(['query', 'mutationList'] as const).map((type) => (
                            <label
                                key={type}
                                className={`cursor-pointer rounded-md border px-3 py-1.5 ${variant.type === type ? 'border-primary' : 'border-gray-300'}`}
                            >
                                <input
                                    type='radio'
                                    className='hidden'
                                    checked={variant.type === type}
                                    onChange={() => switchType(type)}
                                />
                                {type === 'query' ? 'Query' : 'Mutation list'}
                            </label>
                        ))}
                    </div>
                    {canRemove && (
                        <button type='button' className='btn btn-ghost btn-xs text-error' onClick={onRemove}>
                            Remove
                        </button>
                    )}
                </div>

                {variant.type === 'query' ? (
                    <QueryVariantFields variant={variant} onChange={onChange} />
                ) : (
                    <MutationListVariantFields variant={variant} onChange={onChange} />
                )}
            </div>
        </div>
    );
}

function QueryVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantUpdate, { type: 'query' }>;
    onChange: (v: VariantUpdate) => void;
}) {
    return (
        <div className='flex flex-col gap-4'>
            <InputLabel
                title='Count query'
                description='LAPIS filter expression for counting sequences matching this variant.'
            >
                <textarea
                    className='textarea textarea-bordered w-full max-w-xl font-mono text-sm'
                    rows={2}
                    value={variant.countQuery}
                    onChange={(e) => onChange({ ...variant, countQuery: e.currentTarget.value })}
                />
            </InputLabel>
            <InputLabel
                title='Coverage query'
                description='Optional LAPIS filter for the denominator (baseline). Defaults to all sequences.'
            >
                <textarea
                    className='textarea textarea-bordered w-full max-w-xl font-mono text-sm'
                    rows={2}
                    value={variant.coverageQuery ?? ''}
                    onChange={(e) => onChange({ ...variant, coverageQuery: e.currentTarget.value || undefined })}
                />
            </InputLabel>
        </div>
    );
}

function MutationListVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantUpdate, { type: 'mutationList' }>;
    onChange: (v: VariantUpdate) => void;
}) {
    return (
        <GsMutationFilter
            initialValue={{
                aminoAcidMutations: variant.mutationList.aaMutations ?? [],
                nucleotideMutations: variant.mutationList.nucMutations ?? [],
                aminoAcidInsertions: variant.mutationList.aaInsertions ?? [],
                nucleotideInsertions: variant.mutationList.nucInsertions ?? [],
            }}
            onMutationChange={(mutationFilter) => {
                onChange({
                    ...variant,
                    mutationList: {
                        aaMutations: mutationFilter?.aminoAcidMutations,
                        nucMutations: mutationFilter?.nucleotideMutations,
                        aaInsertions: mutationFilter?.aminoAcidInsertions,
                        nucInsertions: mutationFilter?.nucleotideInsertions,
                    },
                });
            }}
        />
    );
}
