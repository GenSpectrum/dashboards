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
    onMutationChange = () => {},
}: {
    width?: string;
    initialValue?: MutationFilter | string[] | undefined;
    onMutationChange: (mutationFilter: MutationFilter | undefined) => void;
}) {
    const mutationFilterRef = useRef<HTMLElement>();

    useEffect(() => {
        const handleMutationFilterChange = (event: CustomEvent) => {
            onMutationChange(event.detail);
        };

        const currentMutationFilterRef = mutationFilterRef.current;
        if (currentMutationFilterRef) {
            currentMutationFilterRef.addEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
        }

        return () => {
            if (currentMutationFilterRef) {
                currentMutationFilterRef.removeEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
            }
        };
    }, [onMutationChange]);

    return (
        <gs-mutation-filter
            width={width}
            initialValue={JSON.stringify(initialValue)}
            ref={mutationFilterRef}
        ></gs-mutation-filter>
    );
}
