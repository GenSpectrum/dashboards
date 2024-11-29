import { type VariantFilterConfig } from './CompareVariantsPageStateSelector.tsx';
import { LineageFilterInput } from './LineageFilterInput.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import type { Id } from '../../views/View.ts';
import { getMutationFilter } from '../../views/helpers.ts';
import { GsMutationFilter, type MutationFilter } from '../genspectrum/GsMutationFilter.tsx';

function copyVariantFilterConfig(variantFilterConfig: VariantFilterConfig): VariantFilterConfig {
    return {
        mutationFilterConfig: {
            ...variantFilterConfig.mutationFilterConfig,
        },
        lineageFilterConfigs: variantFilterConfig.lineageFilterConfigs.map((lineageFilterConfig) => {
            return {
                ...lineageFilterConfig,
            };
        }),
    };
}

export function VariantsSelector({
    variantFilterConfigs,
    setVariantFilterConfigs,
    emptyVariantFilterConfig,
}: {
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    setVariantFilterConfigs: (variants: Map<Id, VariantFilterConfig>) => void;
    emptyVariantFilterConfig: VariantFilterConfig;
}) {
    const removeVariant = (id: Id) => {
        setVariantFilterConfigs(new Map(Array.from(variantFilterConfigs).filter(([key]) => key !== id)));
    };

    const addVariant = () => {
        const newVariantFilterConfigs = new Map(variantFilterConfigs);

        const newId = variantFilterConfigs.size === 0 ? 0 : Math.max(...Array.from(variantFilterConfigs.keys())) + 1;

        newVariantFilterConfigs.set(newId, copyVariantFilterConfig(emptyVariantFilterConfig));

        setVariantFilterConfigs(newVariantFilterConfigs);
    };

    const updateLineageFilterConfig = (id: Id, index: number, lineage: string | undefined) => {
        const newVariantFilterConfigs = new Map(variantFilterConfigs);

        const variantFilterConfig = newVariantFilterConfigs.get(id)!;

        variantFilterConfig.lineageFilterConfigs[index].initialValue = lineage;

        newVariantFilterConfigs.set(id, variantFilterConfig);

        setVariantFilterConfigs(newVariantFilterConfigs);
    };

    const updateMutationFilter = (id: Id, mutation: MutationFilter | undefined) => {
        const newVariantFilterConfigs = new Map(variantFilterConfigs);

        const variantFilterConfig = newVariantFilterConfigs.get(id)!;

        variantFilterConfig.mutationFilterConfig = mutation ?? {
            nucleotideMutations: [],
            aminoAcidMutations: [],
            nucleotideInsertions: [],
            aminoAcidInsertions: [],
        };

        newVariantFilterConfigs.set(id, variantFilterConfig);

        setVariantFilterConfigs(newVariantFilterConfigs);
    };

    return (
        <div>
            <SelectorHeadline>Variant Filter</SelectorHeadline>
            <div className='flex flex-col gap-4'>
                {Array.from(variantFilterConfigs).map(([id, filterConfig]) => (
                    <div key={id}>
                        <div className='flex items-center justify-end'>
                            <button className='btn btn-ghost btn-sm font-normal' onClick={() => removeVariant(id)}>
                                Remove
                            </button>
                        </div>
                        <div className='flex flex-col gap-2'>
                            {filterConfig.lineageFilterConfigs.map((lineageFilterConfig, index) => (
                                <LineageFilterInput
                                    lineageFilterConfig={lineageFilterConfig}
                                    onLineageChange={(lineage) => updateLineageFilterConfig(id, index, lineage)}
                                    key={lineageFilterConfig.lapisField}
                                />
                            ))}
                            <GsMutationFilter
                                initialValue={getMutationFilter(filterConfig.mutationFilterConfig)}
                                onMutationChange={(mutation) => updateMutationFilter(id, mutation)}
                            />
                        </div>
                    </div>
                ))}
                <button className='btn btn-sm max-w-32' onClick={addVariant}>
                    + Add variant
                </button>
            </div>
        </div>
    );
}
