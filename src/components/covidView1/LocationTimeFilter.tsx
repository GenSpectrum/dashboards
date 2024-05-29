import { useEffect, useState } from 'react';
import { Routing } from '../../routes/routing.ts';
import { CovidView1 } from '../../routes/covidView1.ts';
import { type DateRange, isCustomDateRange } from '../../routes/helpers.ts';

export type LocationTimeFilterProps = {
    initialLocation: CovidView1.LapisLocation;
    initialDateRange: DateRange;
};

const today = new Date().toISOString().substring(0, 10);
const customDateRangeOptions = [
    { label: '2024', dateFrom: '2024-01-01', dateTo: today },
    { label: '2023', dateFrom: '2023-01-02', dateTo: '2023-12-31' },
    { label: '2022', dateFrom: '2022-01-03', dateTo: '2023-01-01' },
    { label: '2021', dateFrom: '2024-01-04', dateTo: '2022-01-02' },
    { label: '2020', dateFrom: CovidView1.earliestDate, dateTo: '2021-01-03' },
];

export const LocationTimeFilter = ({ initialLocation, initialDateRange }: LocationTimeFilterProps) => {
    const [location, setLocation] = useState(initialLocation);
    const [dateRange, setDateRange] = useState(initialDateRange);

    useEffect(() => {
        const handleLocationChange = (event: CustomEvent) => {
            setLocation({
                region: event.detail.region,
                country: event.detail.country,
                division: event.detail.division,
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
        const currentRoute = Routing.getCurrentRouteInBrowser() as CovidView1.Route;
        Routing.navigateTo({
            ...currentRoute,
            baselineFilter: {
                ...currentRoute.baselineFilter,
                location,
                dateRange,
            },
        });
    };

    const { region, country, division } = initialLocation;
    const initialLocationValue = [region, country, division].filter(Boolean).join(' / ');
    const initialDateRangeValue = isCustomDateRange(dateRange) ? 'custom' : dateRange;
    const initialDateRangeFrom = isCustomDateRange(dateRange) ? dateRange.from : undefined;
    const initialDateRangeTo = isCustomDateRange(dateRange) ? dateRange.to : undefined;

    return (
        <div className='flex flex-col items-stretch gap-2'>
            <gs-location-filter
                fields='["region", "country", "division"]'
                initialValue={initialLocationValue}
                width='100%'
            ></gs-location-filter>
            {/* TODO This is a temporary fix to mitigate https://github.com/GenSpectrum/dashboards/issues/283 */}
            <div className='h-[9rem]'>
                <gs-date-range-selector
                    customSelectOptions={JSON.stringify(customDateRangeOptions)}
                    earliestDate={CovidView1.earliestDate}
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
