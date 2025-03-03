import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useState } from 'react';

import { type LineageFilterConfig, LineageFilterInput } from './LineageFilterInput.tsx';
import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { VariantFilter } from '../../views/View.ts';
import { getMutationFilter } from '../../views/helpers.ts';
import { AdvancedQueryFilter } from '../genspectrum/AdvancedQueryFilter.tsx';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter.tsx';

export type VariantFilterConfig = {
    lineageFilterConfigs?: LineageFilterConfig[];
    mutationFilterConfig: {
        enabled: boolean;
    };
    variantQueryConfig: {
        enabled: boolean;
    };
};

type Options = {
    enableMutationFilter: boolean;
    enableVariantQuery?: boolean;
};

export function makeVariantFilterConfig(
    organismConstants: OrganismConstants,
    { enableMutationFilter, enableVariantQuery }: Options,
) {
    return {
        lineageFilterConfigs: organismConstants.lineageFilters,
        mutationFilterConfig: { enabled: enableMutationFilter },
        variantQueryConfig: {
            enabled: enableVariantQuery ?? organismConstants.useAdvancedQuery,
        },
    };
}

export function VariantSelector({
    onVariantFilterChange,
    variantFilterConfig,
    variantFilter,
    lapisFilter,
}: {
    variantFilterConfig: VariantFilterConfig;
    onVariantFilterChange: (variantFilter: VariantFilter) => void;
    variantFilter: VariantFilter;
    lapisFilter: LapisFilter;
}) {
    const [isInVariantQueryMode, setIsInVariantQueryMode] = useState(
        variantFilterConfig.variantQueryConfig.enabled && variantFilter.variantQuery !== undefined,
    );

    return (
        <div>
            {variantFilterConfig.variantQueryConfig.enabled && (
                <label className='mb-1 flex cursor-pointer items-center gap-1 text-sm'>
                    Advanced
                    <input
                        type='checkbox'
                        className='checkbox checkbox-xs'
                        onChange={() => setIsInVariantQueryMode((value) => !value)}
                        checked={isInVariantQueryMode}
                    />
                </label>
            )}

            {isInVariantQueryMode ? (
                <AdvancedQueryFilter
                    onInput={(event) => {
                        onVariantFilterChange({
                            ...variantFilter,
                            variantQuery: event.target.value,
                        });
                    }}
                    value={variantFilter.variantQuery ?? ''}
                />
            ) : (
                <div className={`flex flex-col gap-2`}>
                    {variantFilterConfig.lineageFilterConfigs?.map((lineageFilterConfig) => (
                        <LineageFilterInput
                            lineageFilterConfig={lineageFilterConfig}
                            onLineageChange={(lineage) => {
                                onVariantFilterChange({
                                    ...variantFilter,
                                    variantQuery: undefined,
                                    lineages: {
                                        ...variantFilter.lineages,
                                        [lineageFilterConfig.lapisField]: lineage,
                                    },
                                });
                            }}
                            key={lineageFilterConfig.lapisField}
                            lapisFilter={lapisFilter}
                            value={variantFilter.lineages?.[lineageFilterConfig.lapisField]}
                        />
                    ))}
                    {variantFilterConfig.mutationFilterConfig.enabled && (
                        <GsMutationFilter
                            initialValue={
                                variantFilter.mutations === undefined
                                    ? undefined
                                    : getMutationFilter(variantFilter.mutations)
                            }
                            onMutationChange={(mutations) => {
                                onVariantFilterChange({
                                    ...variantFilter,
                                    variantQuery: undefined,
                                    mutations,
                                });
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
