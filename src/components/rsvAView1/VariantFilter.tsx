import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { RsvAView1 } from '../../routes/rsvAView1.ts';

export type VariantFilterProps = {
    initialLineage?: string;
};

export const VariantFilter = ({ initialLineage }: VariantFilterProps) => {
    const [lineage, setLineage] = useState(initialLineage);

    useEffect(() => {
        const handleLineageChange = (event: CustomEvent) => {
            setLineage(event.detail.lineage);
        };
        const lineageFilter = document.getElementById('lineage-filter');
        if (lineageFilter) {
            lineageFilter.addEventListener('gs-text-input-changed', handleLineageChange);
        }

        return () => {
            if (lineageFilter) {
                lineageFilter.removeEventListener('gs-text-input-changed', handleLineageChange);
            }
        };
    }, []);

    const search = () => {
        const currentRoute = Routing.getCurrentRouteInBrowser()! as RsvAView1.Route;
        const newRoute = {
            ...currentRoute,
            variantFilter: { lineage },
        };
        Routing.navigateTo(newRoute);
    };

    return (
        <div className='flex flex-col items-stretch gap-2'>
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
