import { SelectorHeadline } from './SelectorHeadline.tsx';
import type { LapisMutationQuery } from '../../views/helpers.ts';
import { GsLineageFilter } from '../genspectrum/GsLineageFilter.tsx';
import { GsMutationFilter } from '../genspectrum/GsMutationFilter.tsx';
import { GsTextInput } from '../genspectrum/GsTextInput.tsx';

export type MutationFilterConfig = {
    initialMutations: LapisMutationQuery;
};

export type LineageFilterConfig = {
    initialValue: string | undefined;
    placeholderText: string;
    lapisField: string;
    filterType: 'lineage' | 'text';
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
    const mutationFilter = {
        nucleotideMutations: mutationFilterConfig.initialMutations.nucleotideMutations || [],
        aminoAcidMutations: mutationFilterConfig.initialMutations.aminoAcidMutations || [],
        nucleotideInsertions: mutationFilterConfig.initialMutations.nucleotideInsertions || [],
        aminoAcidInsertions: mutationFilterConfig.initialMutations.aminoAcidInsertions || [],
    };

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
                <GsMutationFilter initialValue={mutationFilter} onMutationChange={onMutationChange} />
            </div>
        </div>
    );
}

function LineageFilterInput({
    lineageFilterConfig,
    onLineageChange,
}: {
    lineageFilterConfig: LineageFilterConfig;
    onLineageChange: (lineage: string | undefined) => void;
}) {
    switch (lineageFilterConfig.filterType) {
        case 'lineage':
            return (
                <GsLineageFilter
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onLineageChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    initialValue={lineageFilterConfig.initialValue}
                />
            );

        case 'text':
            return (
                <GsTextInput
                    lapisField={lineageFilterConfig.lapisField}
                    placeholderText={lineageFilterConfig.placeholderText}
                    onInputChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                    initialValue={lineageFilterConfig.initialValue}
                />
            );
    }
}
