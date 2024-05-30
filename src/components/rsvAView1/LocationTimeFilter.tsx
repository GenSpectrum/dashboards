import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { RsvAView1 } from '../../routes/rsvAView1.ts';
import { type DateRange, isCustomDateRange } from '../../routes/helpers.ts';

export type LocationTimeFilterProps = {
    initialLocation: RsvAView1.LapisLocation;
    initialDateRange: DateRange;
};

const today = new Date().toISOString().substring(0, 10);
const customDateRangeOptions = [
    { label: 'Since 2020', dateFrom: '2020-01-01', dateTo: today },
    { label: '2010-2019', dateFrom: '2010-01-01', dateTo: '2019-12-31' },
    { label: '2000-2009', dateFrom: '2000-01-01', dateTo: '2009-12-31' },
    { label: 'Before 2000', dateFrom: RsvAView1.earliestDate, dateTo: '1999-12-31' },
];

export const LocationTimeFilter = ({ initialLocation, initialDateRange }: LocationTimeFilterProps) => {
    const [location, setLocation] = useState(initialLocation);
    const [dateRange, setDateRange] = useState(initialDateRange);

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            setLocation({
                geo_loc_country: event.detail.geo_loc_country,
                geo_loc_admin_1: event.detail.geo_loc_admin_1,
            });
        };
        const handleDateRangeChange = (event: CustomEvent) => {
            setDateRange({
                from: event.detail.dateFrom,
                to: event.detail.dateTo,
            });
        };

        const locationFilter = document.querySelector('gs-location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('gs-location-changed', handleLocationChange);
        }
        const dateRangeFilter = document.querySelector('gs-date-range-selector');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('gs-date-range-changed', handleDateRangeChange);
        }

        return () => {
            if (locationFilter) {
                locationFilter.removeEventListener('gs-location-changed', handleLocationChange);
            }
            if (dateRangeFilter) {
                dateRangeFilter.removeEventListener('gs-date-range-changed', handleDateRangeChange);
            }
        };
    }, []);

    const search = () => {
        const currentRoute = Routing.getCurrentRouteInBrowser() as RsvAView1.Route;
        Routing.navigateTo({
            ...currentRoute,
            baselineFilter: {
                ...currentRoute.baselineFilter,
                location,
                dateRange,
            },
        });
    };

    const { geo_loc_country, geo_loc_admin_1 } = initialLocation;
    const initialLocationValue = [geo_loc_country, geo_loc_admin_1].filter(Boolean).join(' / ');
    const initialDateRangeValue = isCustomDateRange(dateRange) ? 'custom' : dateRange;
    const initialDateRangeFrom = isCustomDateRange(dateRange) ? dateRange.from : undefined;
    const initialDateRangeTo = isCustomDateRange(dateRange) ? dateRange.to : undefined;

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-location-filter
                fields='["geo_loc_country", "geo_loc_admin_1"]'
                initialValue={initialLocationValue}
                width='100%'
            ></gs-location-filter>
            {/* TODO This is a temporary fix to mitigate https://github.com/GenSpectrum/dashboards/issues/283 */}
            <div className='h-[9rem]'>
                <gs-date-range-selector
                    customSelectOptions={JSON.stringify(customDateRangeOptions)}
                    earliestDate={RsvAView1.earliestDate}
                    initialValue={initialDateRangeValue}
                    initialDateFrom={initialDateRangeFrom}
                    initialDateTo={initialDateRangeTo}
                    width='100%'
                    dateColumn='date'
                ></gs-date-range-selector>
            </div>
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
