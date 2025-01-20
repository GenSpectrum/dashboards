import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { LineageFilterInput } from './LineageFilterInput.tsx';
import type { VariantFilterConfig } from './VariantFilterConfig.ts';
import { getMutationFilter } from '../../views/helpers.ts';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter.tsx';

export function VariantSelector({
    onVariantFilterChange,
    variantFilterConfig,
    hideMutationFilter,
    lapisFilter,
}: {
    variantFilterConfig: VariantFilterConfig;
    onVariantFilterChange: (variantFilter: VariantFilterConfig) => void;
    hideMutationFilter?: boolean | undefined;
    lapisFilter: LapisFilter;
}) {
    return (
        <div className='flex flex-col gap-2'>
            {variantFilterConfig.lineageFilterConfigs.map((lineageFilterConfig) => (
                <LineageFilterInput
                    lineageFilterConfig={lineageFilterConfig}
                    onLineageChange={(lineage) => {
                        const newVariantFilterConfig = {
                            ...variantFilterConfig,
                            lineageFilterConfigs: variantFilterConfig.lineageFilterConfigs.map((config) =>
                                config.lapisField === lineageFilterConfig.lapisField
                                    ? { ...config, initialValue: lineage }
                                    : config,
                            ),
                        };
                        onVariantFilterChange(newVariantFilterConfig);
                    }}
                    key={lineageFilterConfig.lapisField}
                    lapisFilter={lapisFilter}
                />
            ))}
            {!hideMutationFilter && (
                <GsMutationFilter
                    initialValue={getMutationFilter(variantFilterConfig.mutationFilterConfig)}
                    onMutationChange={(mutation) => {
                        if (mutation === undefined) {
                            return;
                        }
                        const newVariantFilterConfig = {
                            ...variantFilterConfig,
                            mutationFilterConfig: mutation,
                        };
                        onVariantFilterChange(newVariantFilterConfig);
                    }}
                />
            )}
        </div>
    );
}
