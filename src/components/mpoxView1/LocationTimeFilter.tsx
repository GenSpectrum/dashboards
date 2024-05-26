import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { MpoxView1 } from '../../routes/mpoxView1.ts';

export type LocationTimeFilterProps = {
    initialLocation: MpoxView1.LapisLocation;
};

export const LocationTimeFilter = ({ initialLocation }: LocationTimeFilterProps) => {
    const [location, setLocation] = useState(initialLocation);

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            setLocation({
                geo_loc_country: event.detail.geo_loc_country,
                geo_loc_admin_1: event.detail.geo_loc_admin_1,
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
        const currentRoute = Routing.getCurrentRouteInBrowser() as MpoxView1.Route;
        Routing.navigateTo({
            ...currentRoute,
            baselineFilter: {
                ...currentRoute.baselineFilter,
                ...location,
            },
        });
    };

    const { geo_loc_country, geo_loc_admin_1 } = initialLocation;
    const initialLocationValue = [geo_loc_country, geo_loc_admin_1].filter(Boolean).join(' / ');

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-location-filter
                fields='["geo_loc_country", "geo_loc_admin_1"]'
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
