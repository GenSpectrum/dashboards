import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { CovidView1 } from '../../routes/covidView1.ts';

export type VariantFilterProps = {
    initialNextcladePangoLineage?: string;
};

export const VariantFilter = ({ initialNextcladePangoLineage }: VariantFilterProps) => {
    const [nextcladePangoLineage, setNextcladePangoLineage] = useState(initialNextcladePangoLineage);

    useEffect(() => {
        const handleLineageChange = (event: CustomEvent) => {
            setNextcladePangoLineage(event.detail.nextcladePangoLineage);
        };
        const lineageFilter = document.querySelector('gs-text-input');
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
        const currentRoute = Routing.getCurrentRouteInBrowser()! as CovidView1.Route;
        const newRoute = {
            ...currentRoute,
            variantFilter: { nextcladePangoLineage },
        };
        Routing.navigateTo(newRoute);
    };

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-text-input
                lapisField='nextcladePangoLineage'
                placeholderText='Pango Lineage'
                initialValue={initialNextcladePangoLineage}
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
