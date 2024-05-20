import { useEffect, useState } from 'react';
import { getCurrentRouteInBrowser, type LapisLocation, navigateTo } from '../routing.ts';

export type LocationTimeVariantFilterProps = {
    initialLocation: LapisLocation;
};

export const LocationTimeVariantFilter = ({ initialLocation }: LocationTimeVariantFilterProps) => {
    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            const currentRoute = getCurrentRouteInBrowser()!;
            navigateTo({
                ...currentRoute,
                region: event.detail.region,
                country: event.detail.country,
                division: event.detail.division,
            });
        };

        const locationFilter = document.querySelector('gs-location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('gs-location-changed', handleLocationChange);
        }

        return () => {
            if (locationFilter) {
                locationFilter.removeEventListener('gs-location-changed', handleLocationChange);
            }
        };
    }, []);

    const { region, country, division } = initialLocation;
    const initialLocationValue = [region, country, division].filter(Boolean).join(' / ');

    return (
        <div>
            <div>
                <gs-location-filter
                    fields='["region", "country", "division", "location"]'
                    initialValue={initialLocationValue}
                    width='100%'
                ></gs-location-filter>
            </div>
        </div>
    );
};
