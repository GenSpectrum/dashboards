import type { LapisFilter } from '@genspectrum/dashboard-components/util';

import { LineageFilterInput } from './LineageFilterInput.tsx';
import type { VariantFilterConfig } from './VariantFilterConfig.ts';
import { getMutationFilter } from '../../views/helpers.ts';
import { AdvancedQueryFilter } from '../genspectrum/AdvancedQueryFilter.tsx';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter.tsx';

export function VariantSelector({
    onVariantFilterChange,
    variantFilterConfig,
    lapisFilter,
}: {
    variantFilterConfig: VariantFilterConfig;
    onVariantFilterChange: (variantFilter: VariantFilterConfig) => void;
    lapisFilter: LapisFilter;
}) {
    return (
        <div>
            <label
                className={`mb-1 flex cursor-pointer items-center gap-1 text-sm ${variantFilterConfig.isInVariantQueryMode === undefined ? 'hidden' : ''}`}
            >
                Advanced
                <input
                    type='checkbox'
                    className='checkbox checkbox-xs'
                    onChange={() => {
                        onVariantFilterChange({
                            ...variantFilterConfig,
                            isInVariantQueryMode: !variantFilterConfig.isInVariantQueryMode,
                        });
                    }}
                    checked={variantFilterConfig.isInVariantQueryMode}
                />
            </label>

            <div className={variantFilterConfig.isInVariantQueryMode ? '' : 'hidden'}>
                <AdvancedQueryFilter
                    onInput={(event) => {
                        const newVariantQuery = {
                            variantQueryConfig: event.target.value,
                        };

                        const newState = {
                            ...variantFilterConfig,
                            ...newVariantQuery,
                        };

                        onVariantFilterChange(newState);
                    }}
                    value={variantFilterConfig.variantQueryConfig ?? ''}
                />
            </div>
            <div className={`flex flex-col gap-2 ${variantFilterConfig.isInVariantQueryMode ? 'hidden' : ''}`}>
                {variantFilterConfig.lineageFilterConfigs?.map((lineageFilterConfig) => (
                    <LineageFilterInput
                        lineageFilterConfig={lineageFilterConfig}
                        onLineageChange={(lineage) => {
                            const newVariantFilterConfig = {
                                ...variantFilterConfig,
                                lineageFilterConfigs: variantFilterConfig.lineageFilterConfigs?.map((config) =>
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
                {variantFilterConfig.mutationFilterConfig && (
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
        </div>
    );
}
