import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { CovidView1 } from '../../routes/covidView1.ts';

export type LocationTimeFilterProps = {
    initialLocation: CovidView1.LapisLocation;
};

export const LocationTimeFilter = ({ initialLocation }: LocationTimeFilterProps) => {
    const [location, setLocation] = useState(initialLocation);

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            setLocation({
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

    const search = () => {
        const currentRoute = Routing.getCurrentRouteInBrowser() as CovidView1.Route;
        Routing.navigateTo({
            ...currentRoute,
            baselineFilter: {
                ...currentRoute.baselineFilter,
                ...location,
            },
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
