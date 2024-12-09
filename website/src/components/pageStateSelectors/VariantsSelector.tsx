import { type VariantFilterConfig } from './VariantFilterConfig.ts';
import { VariantSelector } from './VariantSelector.tsx';
import type { Id } from '../../views/View.ts';

export function VariantsSelector({
    variantFilterConfigs,
    setVariantFilterConfigs,
    emptyVariantFilterConfigProvider,
}: {
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    setVariantFilterConfigs: (variants: Map<Id, VariantFilterConfig>) => void;
    emptyVariantFilterConfigProvider: () => VariantFilterConfig;
}) {
    const removeVariant = (id: Id) => {
        setVariantFilterConfigs(new Map(Array.from(variantFilterConfigs).filter(([key]) => key !== id)));
    };

    const addVariant = () => {
        const newVariantFilterConfigs = new Map(variantFilterConfigs);

        const newId = variantFilterConfigs.size === 0 ? 0 : Math.max(...Array.from(variantFilterConfigs.keys())) + 1;

        newVariantFilterConfigs.set(newId, emptyVariantFilterConfigProvider());

        setVariantFilterConfigs(newVariantFilterConfigs);
    };

    const updateVariantFilter = (id: Id, variantFilter: VariantFilterConfig) => {
        const newVariantFilterConfigs = new Map(variantFilterConfigs);

        newVariantFilterConfigs.set(id, variantFilter);

        setVariantFilterConfigs(newVariantFilterConfigs);
    };

    return (
        <div className='flex flex-col gap-4'>
            {Array.from(variantFilterConfigs).map(([id, filterConfig]) => (
                <div key={id}>
                    <div className='flex items-center justify-end'>
                        <button className='btn btn-ghost btn-sm font-normal' onClick={() => removeVariant(id)}>
                            Remove
                        </button>
                    </div>
                    <VariantSelector
                        variantFilterConfig={filterConfig}
                        onVariantFilterChange={(variantFilter) => updateVariantFilter(id, variantFilter)}
                    />
                </div>
            ))}
            <button className='btn btn-sm max-w-32' onClick={addVariant}>
                + Add variant
            </button>
        </div>
    );
}
