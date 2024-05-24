import { useCallback, useEffect, useState } from 'react';
import { getCurrentRouteInBrowser, type LapisLocation, navigateTo } from '../routing.ts';

export type LocationTimeVariantFilterProps = {
    initialLocation: LapisLocation;
    initialNextcladePangoLineage?: string;
};

export const LocationTimeVariantFilter = ({
    initialLocation,
    initialNextcladePangoLineage = '',
}: LocationTimeVariantFilterProps) => {
    const [location, setLocation] = useState(initialLocation);
    const [nextcladePangoLineage, setNextcladePangoLineage] = useState(initialNextcladePangoLineage);

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            setLocation({
                region: event.detail.region,
                country: event.detail.country,
                division: event.detail.division,
            });
        };

        const handleLineageChange = (event: CustomEvent) => {
            setNextcladePangoLineage(event.detail.nextcladePangoLineage);
        };

        const locationFilter = document.querySelector('gs-location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('gs-location-changed', handleLocationChange);
        }
        const lineageFilter = document.querySelector('gs-text-input');
        if (lineageFilter) {
            lineageFilter.addEventListener('gs-text-input-changed', handleLineageChange);
        }

        return () => {
            if (locationFilter) {
                locationFilter.removeEventListener('gs-location-changed', handleLocationChange);
            }
            if (lineageFilter) {
                lineageFilter.removeEventListener('gs-text-input-changed', handleLineageChange);
            }
        };
    }, []);

    const search = () => {
        const currentRoute = getCurrentRouteInBrowser()!;
        navigateTo({
            ...currentRoute,
            ...location,
            nextcladePangoLineage,
        });
    };

    const { region, country, division } = initialLocation;
    const initialLocationValue = [region, country, division].filter(Boolean).join(' / ');

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-location-filter
                fields='["region", "country", "division", "location"]'
                initialValue={initialLocationValue}
                width='100%'
            ></gs-location-filter>
            <gs-text-input
                lapisField='nextcladePangoLineage'
                placeholderText='Pango Lineage'
                initialValue={initialNextcladePangoLineage}
                width='100%'
            ></gs-text-input>
            <button onClick={() => search()} className='rounded-lg border p-4 hover:bg-amber-200' type='submit'>
                Search
            </button>
        </div>
    );
};
