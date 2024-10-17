import '@genspectrum/dashboard-components';
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
    onBlur = () => {},
    onMutationChange = () => {},
}: {
    width?: string;
    initialValue?: MutationFilter | string[] | undefined;
    onMutationChange: (mutationFilter: MutationFilter | undefined) => void;
    onBlur?: (mutationFilter: MutationFilter | undefined) => void;
}) {
    const mutationFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleMutationFilterChange = (event: CustomEvent) => {
            onMutationChange(event.detail);
        };

        const handleMutationFilterBlur = (event: CustomEvent) => {
            onBlur(event.detail);
        };

        const currentMutationFilterRef = mutationFilterRef.current;
        if (currentMutationFilterRef) {
            currentMutationFilterRef.addEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
            currentMutationFilterRef.addEventListener('gs-mutation-filter-on-blur', handleMutationFilterBlur);
        }

        return () => {
            if (currentMutationFilterRef) {
                currentMutationFilterRef.removeEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
                currentMutationFilterRef.removeEventListener('gs-mutation-filter-on-blur', handleMutationFilterBlur);
            }
        };
    }, [onMutationChange, onBlur]);

    return (
        <gs-mutation-filter
            width={width}
            initialValue={JSON.stringify(initialValue)}
            ref={mutationFilterRef}
        ></gs-mutation-filter>
    );
}
