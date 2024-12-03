import { type LineageFilterConfig, LineageFilterInput } from './LineageFilterInput.tsx';
import { SelectorHeadline } from './SelectorHeadline.tsx';
import { getMutationFilter, type LapisMutationQuery } from '../../views/helpers.ts';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter.tsx';

export type MutationFilterConfig = {
    initialMutations: LapisMutationQuery;
};

export function VariantSelector({
    mutationFilterConfig,
    onMutationChange,
    lineageFilterConfigs,
}: {
    mutationFilterConfig: MutationFilterConfig;
    onMutationChange: (mutations: LapisMutationQuery | undefined) => void;
    lineageFilterConfigs: {
        lineageFilterConfig: LineageFilterConfig;
        onLineageChange: (lineage: string | undefined) => void;
    }[];
}) {
    return (
        <div>
            <SelectorHeadline>Variant Filter</SelectorHeadline>
            <div className='flex flex-col gap-2'>
                {lineageFilterConfigs.map(({ lineageFilterConfig, onLineageChange }) => (
                    <LineageFilterInput
                        lineageFilterConfig={lineageFilterConfig}
                        onLineageChange={onLineageChange}
                        key={lineageFilterConfig.lapisField}
                    />
                ))}
                <GsMutationFilter
                    initialValue={getMutationFilter(mutationFilterConfig.initialMutations)}
                    onMutationChange={onMutationChange}
                />
            </div>
        </div>
    );
}
