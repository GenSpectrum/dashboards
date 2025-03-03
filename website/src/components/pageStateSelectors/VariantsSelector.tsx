import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { VariantSelector, type VariantFilterConfig } from './VariantSelector.tsx';
import type { Id, VariantFilter } from '../../views/View.ts';

export function VariantsSelector({
    variantFilters,
    variantFilterConfigs,
    setVariantFilters,
    lapisFilter,
}: {
    variantFilters: Map<Id, VariantFilter>;
    variantFilterConfigs: Map<Id, VariantFilterConfig>;
    setVariantFilters: (variantFilters: Map<Id, VariantFilter>) => void;
    lapisFilter: LapisFilter;
}) {
    const removeVariant = (id: Id) => {
        setVariantFilters(new Map(Array.from(variantFilters).filter(([key]) => key !== id)));
    };

    const addVariant = () => {
        const newVariantFilters = new Map(variantFilters);

        const newId = variantFilters.size === 0 ? 0 : Math.max(...Array.from(variantFilters.keys())) + 1;
        newVariantFilters.set(newId, {});

        setVariantFilters(newVariantFilters);
    };

    const updateVariantFilter = (id: Id, variantFilter: VariantFilter) => {
        const newVariantFilters = new Map(variantFilters);
        newVariantFilters.set(id, variantFilter);

        setVariantFilters(newVariantFilters);
    };

    return (
        <div className='flex flex-col gap-3'>
            {Array.from(variantFilterConfigs).map(([id, filterConfig]) => (
                <div key={id}>
                    <VariantSelector
                        variantFilter={variantFilters.get(id) ?? {}}
                        variantFilterConfig={filterConfig}
                        onVariantFilterChange={(variantFilter) => updateVariantFilter(id, variantFilter)}
                        lapisFilter={lapisFilter}
                    />
                    <button className='text-sm hover:text-gray-500' onClick={() => removeVariant(id)}>
                        Remove
                    </button>
                </div>
            ))}
            <button className='btn btn-sm max-w-32' onClick={addVariant}>
                + Add variant
            </button>
        </div>
    );
}
