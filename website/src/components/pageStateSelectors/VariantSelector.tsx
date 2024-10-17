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
};

export type TextFilterConfig = {
    initialValue: string | undefined;
    placeholderText: string;
    lapisField: string;
};

export function VariantSelector({
    mutationFilterConfig,
    onMutationChange,
    lineageFilterConfig,
    onLineageChange,
    cladeFilterConfig,
    onCladeChange,
}: {
    mutationFilterConfig: MutationFilterConfig;
    onMutationChange: (mutations: LapisMutationQuery | undefined) => void;
    lineageFilterConfig?: LineageFilterConfig;
    onLineageChange: (lineage: string | undefined) => void;
    cladeFilterConfig?: TextFilterConfig;
    onCladeChange: (clade: string | undefined) => void;
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
                {lineageFilterConfig && (
                    <GsLineageFilter
                        lapisField={lineageFilterConfig.lapisField}
                        placeholderText={lineageFilterConfig.placeholderText}
                        onLineageChange={(lineage) => onLineageChange(lineage[lineageFilterConfig.lapisField])}
                        initialValue={lineageFilterConfig.initialValue}
                    />
                )}
                {cladeFilterConfig && (
                    <GsTextInput
                        lapisField={cladeFilterConfig.lapisField}
                        placeholderText={cladeFilterConfig.placeholderText}
                        onInputChange={(clade) => onCladeChange(clade[cladeFilterConfig.lapisField])}
                        initialValue={cladeFilterConfig.initialValue}
                    />
                )}
                <GsMutationFilter initialValue={mutationFilter} onMutationChange={onMutationChange} />
            </div>
        </div>
    );
}
