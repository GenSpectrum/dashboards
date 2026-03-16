import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import type { VariantRequest } from '../../../types/Collection.ts';

type Props = {
    variant: VariantRequest;
    index: number;
    onChange: (variant: VariantRequest) => void;
    onRemove: () => void;
};

export function VariantEditor({ variant, index, onChange, onRemove }: Props) {
    function setField(fields: Partial<VariantRequest>) {
        onChange({ ...variant, ...fields } as VariantRequest);
    }

    function switchType(type: 'query' | 'mutationList') {
        if (type === 'query') {
            onChange({ type: 'query', name: variant.name, description: variant.description, countQuery: '' });
        } else {
            onChange({ type: 'mutationList', name: variant.name, description: variant.description, mutationList: {} });
        }
    }

    return (
        <div className='flex flex-col gap-4 rounded-lg border border-gray-200 p-4'>
            <div className='flex items-center justify-between'>
                <span className='font-medium'>Variant {index + 1}</span>
                <button type='button' className='btn btn-ghost btn-xs text-error' onClick={onRemove}>
                    Remove
                </button>
            </div>

            <div className='flex flex-col gap-4 sm:flex-row'>
                <InputLabel title='Name' description='A name to identify this variant.'>
                    <input
                        className='input input-sm input-bordered w-full max-w-xl'
                        value={variant.name}
                        onChange={(e) => setField({ name: e.currentTarget.value })}
                    />
                </InputLabel>

                <InputLabel title='Type' description='How this variant is defined.'>
                    <select
                        className='select select-sm select-bordered'
                        value={variant.type}
                        onChange={(e) => switchType(e.currentTarget.value as 'query' | 'mutationList')}
                    >
                        <option value='query'>Query</option>
                        <option value='mutationList'>Mutation list</option>
                    </select>
                </InputLabel>
            </div>

            <InputLabel title='Description' description='Optional description for this variant.'>
                <input
                    className='input input-sm input-bordered w-full max-w-xl'
                    value={variant.description ?? ''}
                    onChange={(e) => setField({ description: e.currentTarget.value || undefined })}
                />
            </InputLabel>

            {variant.type === 'query' ? (
                <QueryVariantFields variant={variant} onChange={onChange} />
            ) : (
                <MutationListVariantFields variant={variant} onChange={onChange} />
            )}
        </div>
    );
}

function QueryVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantRequest, { type: 'query' }>;
    onChange: (v: VariantRequest) => void;
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
                    onChange={(e) =>
                        onChange({ ...variant, coverageQuery: e.currentTarget.value || undefined })
                    }
                />
            </InputLabel>
        </div>
    );
}

function MutationListVariantFields({
    variant,
    onChange,
}: {
    variant: Extract<VariantRequest, { type: 'mutationList' }>;
    onChange: (v: VariantRequest) => void;
}) {
    function setMutationField(key: string, value: string) {
        const list = value
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean);
        onChange({
            ...variant,
            mutationList: {
                ...variant.mutationList,
                [key]: list.length > 0 ? list : undefined,
            },
        });
    }

    function getMutationField(key: string): string {
        const val = (variant.mutationList as Record<string, unknown>)[key];
        return Array.isArray(val) ? val.join('\n') : '';
    }

    const fields: { key: string; title: string }[] = [
        { key: 'aaMutations', title: 'AA mutations' },
        { key: 'nucMutations', title: 'Nucleotide mutations' },
        { key: 'aaInsertions', title: 'AA insertions' },
        { key: 'nucInsertions', title: 'Nucleotide insertions' },
    ];

    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {fields.map(({ key, title }) => (
                <InputLabel key={key} title={title} description='One entry per line.'>
                    <textarea
                        className='textarea textarea-bordered w-full font-mono text-sm'
                        rows={3}
                        value={getMutationField(key)}
                        onChange={(e) => setMutationField(key, e.currentTarget.value)}
                    />
                </InputLabel>
            ))}
        </div>
    );
}
