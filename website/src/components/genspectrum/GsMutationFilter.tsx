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
    onMutationChange: (mutationFilter: MutationFilter) => void;
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

        if (mutationFilterRef.current) {
            mutationFilterRef.current.addEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
            mutationFilterRef.current.addEventListener('gs-mutation-filter-on-blur', handleMutationFilterBlur);
        }

        return () => {
            if (mutationFilterRef.current) {
                mutationFilterRef.current.removeEventListener('gs-mutation-filter-changed', handleMutationFilterChange);
                mutationFilterRef.current.removeEventListener('gs-mutation-filter-on-blur', handleMutationFilterBlur);
            }
        };
    }, []);

    return <gs-mutation-filter width={width} initialValue={initialValue} ref={mutationFilterRef}></gs-mutation-filter>;
}
