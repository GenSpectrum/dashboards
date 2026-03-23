import '@genspectrum/dashboard-components/components';
import { type MutationType, gsEventNames } from '@genspectrum/dashboard-components/util';
import { useEffect, useRef } from 'react';

export type MutationFilter = {
    nucleotideMutations: string[];
    aminoAcidMutations: string[];
    nucleotideInsertions: string[];
    aminoAcidInsertions: string[];
};

export function GsMutationFilter({
    initialValue,
    width,
    enabledMutationTypes,
    onMutationChange,
    showLabel = true,
}: {
    width?: string;
    initialValue?: MutationFilter | string[] | undefined;
    enabledMutationTypes?: MutationType[];
    onMutationChange: (mutationFilter: MutationFilter | undefined) => void;
    showLabel?: boolean;
}) {
    const mutationFilterRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const currentMutationFilterRef = mutationFilterRef.current;
        if (!currentMutationFilterRef) {
            return;
        }

        const handleMutationFilterChange = (event: CustomEvent) => {
            onMutationChange(event.detail);
        };
        currentMutationFilterRef.addEventListener(gsEventNames.mutationFilterChanged, handleMutationFilterChange);

        return () => {
            currentMutationFilterRef.removeEventListener(
                gsEventNames.mutationFilterChanged,
                handleMutationFilterChange,
            );
        };
    }, [onMutationChange]);

    // TODO - the JSON stringify below shouldn't be needed.

    return (
        <label className='form-control'>
            {showLabel && (
                <div className='label'>
                    <span className='label-text'>Mutations</span>
                </div>
            )}
            <gs-mutation-filter
                width={width}
                initialValue={JSON.stringify(initialValue ?? [])}
                enabledMutationTypes={enabledMutationTypes}
                ref={mutationFilterRef}
            ></gs-mutation-filter>
        </label>
    );
}
