import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { MpoxView1 } from '../../routes/mpoxView1.ts';

export type VariantFilterProps = {
    initialClade?: string;
    initialLineage?: string;
};

export const VariantFilter = ({ initialClade, initialLineage }: VariantFilterProps) => {
    const [clade, setClade] = useState(initialClade);
    const [lineage, setLineage] = useState(initialLineage);

    useEffect(() => {
        const handleCladeChange = (event: CustomEvent) => {
            setClade(event.detail.clade);
        };
        const cladeFilter = document.getElementById('clade-filter');
        if (cladeFilter) {
            cladeFilter.addEventListener('gs-text-input-changed', handleCladeChange);
        }

        const handleLineageChange = (event: CustomEvent) => {
            setLineage(event.detail.lineage);
        };
        const lineageFilter = document.getElementById('lineage-filter');
        if (lineageFilter) {
            lineageFilter.addEventListener('gs-text-input-changed', handleLineageChange);
        }

        return () => {
            if (cladeFilter) {
                cladeFilter.removeEventListener('gs-text-input-changed', handleCladeChange);
            }
            if (lineageFilter) {
                lineageFilter.removeEventListener('gs-text-input-changed', handleLineageChange);
            }
        };
    }, []);

    const search = () => {
        const currentRoute = Routing.getCurrentRouteInBrowser()! as MpoxView1.Route;
        const newRoute = {
            ...currentRoute,
            variantFilter: { clade, lineage },
        };
        console.log(JSON.stringify(newRoute));
        Routing.navigateTo(newRoute);
    };

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-text-input
                id='clade-filter'
                lapisField='clade'
                placeholderText='Clade'
                initialValue={initialClade}
                width='100%'
            ></gs-text-input>
            <gs-text-input
                id='lineage-filter'
                lapisField='lineage'
                placeholderText='Lineage'
                initialValue={initialLineage}
                width='100%'
            ></gs-text-input>
            <button
                onClick={() => search()}
                className='rounded-lg border bg-white p-4 hover:bg-amber-200'
                type='submit'
            >
                Submit
            </button>
        </div>
    );
};
