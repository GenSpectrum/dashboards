import { CovidView1 } from '../../routes/covidView1.ts';
import { Routing } from '../../routes/routing.ts';
import { useEffect, useState } from 'react';
import { CovidView2 } from '../../routes/covidView2.ts';

export type JointFilterProps = {
    filterId: number;
    initialLocation: CovidView1.LapisLocation;
    initialNextcladePangoLineage?: string;
};

export const JointFilter = ({ filterId, initialLocation, initialNextcladePangoLineage }: JointFilterProps) => {
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
        const locationFilter = document.getElementById(`location-filter-${filterId}`);
        if (locationFilter) {
            locationFilter.addEventListener('gs-location-changed', handleLocationChange);
        }

        const handleLineageChange = (event: CustomEvent) => {
            setNextcladePangoLineage(event.detail.nextcladePangoLineage);
        };
        const lineageFilter = document.getElementById(`lineage-filter-${filterId}`);
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
        const currentRoute = Routing.getCurrentRouteInBrowser() as CovidView2.Route;
        Routing.navigateTo(
            CovidView2.setFilter(currentRoute, {
                id: filterId,
                baselineFilter: location,
                variantFilter: { nextcladePangoLineage },
            }),
        );
    };

    const { region, country, division } = initialLocation;
    const initialLocationValue = [region, country, division].filter(Boolean).join(' / ');

    return (
        <div>
            <div className='flex'>
                <div className='flex-1 bg-blue-50 px-2 py-4'>
                    <div className='mb-2 font-semibold'>Filter dataset:</div>
                    <gs-location-filter
                        id={`location-filter-${filterId}`}
                        fields='["region", "country", "division", "location"]'
                        initialValue={initialLocationValue}
                        width='100%'
                    ></gs-location-filter>
                </div>
                <div className='flex-1 border-l-2 bg-green-50 px-2 py-4'>
                    <div className='mb-2 font-semibold'>Search variant:</div>
                    <gs-text-input
                        id={`lineage-filter-${filterId}`}
                        lapisField='nextcladePangoLineage'
                        placeholderText='Pango Lineage'
                        initialValue={initialNextcladePangoLineage}
                        width='100%'
                    ></gs-text-input>
                </div>
            </div>
            <button
                onClick={() => search()}
                className='mt-2 w-full rounded-lg border bg-white p-4 hover:bg-amber-200'
                type='submit'
            >
                Submit
            </button>
        </div>
    );
};
