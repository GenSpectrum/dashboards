import '@genspectrum/dashboard-components/components';
import { gsEventNames } from '@genspectrum/dashboard-components/util';
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
    onMutationChange = () => {},
}: {
    width?: string;
    initialValue?: MutationFilter | string[] | undefined;
    onMutationChange: (mutationFilter: MutationFilter | undefined) => void;
}) {
    const mutationFilterRef = useRef<HTMLElement>();

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

    return (
        <label className='form-control'>
            <div className='label'>
                <span className='label-text'>Mutations</span>
            </div>
            <gs-mutation-filter
                width={width}
                initialValue={JSON.stringify(initialValue ?? [])}
                ref={mutationFilterRef}
            ></gs-mutation-filter>
        </label>
    );
}
