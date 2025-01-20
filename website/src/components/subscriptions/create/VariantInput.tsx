import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { useEffect, useState } from 'react';

import { InputLabel } from '../../../styles/input/InputLabel.tsx';
import { GsLineageFilter } from '../../genspectrum/GsLineageFilter.tsx';
import { GsMutationFilter } from '../../genspectrum/GsMutationFilter.tsx';

export function VariantInput({ onVariantInputChange }: { onVariantInputChange: (value: LapisFilter) => void }) {
    const [variantFilter, setVariantFilter] = useState<LapisFilter>({});

    useEffect(() => {
        onVariantInputChange(variantFilter);
    }, [variantFilter, onVariantInputChange]);

    return (
        <InputLabel
            title='Variant'
            description='Defines the additional filter applied to the numerator of the prevalence.'
        >
            <div className='flex w-full flex-col gap-2'>
                <GsLineageFilter
                    lapisField='pangoLineage'
                    placeholderText='Pangolineage'
                    onLineageChange={(lineage) => {
                        setVariantFilter((prevVariantFilter) => {
                            return { ...prevVariantFilter, ...lineage };
                        });
                    }}
                    lapisFilter={{}}
                />
                <GsMutationFilter
                    width='100%'
                    onMutationChange={(mutationFilters) => {
                        setVariantFilter((prevVariantFilter) => {
                            return { ...prevVariantFilter, ...mutationFilters };
                        });
                    }}
                />
            </div>
        </InputLabel>
    );
}
