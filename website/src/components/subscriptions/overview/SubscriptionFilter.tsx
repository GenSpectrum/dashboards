import { type Organism, organismConfig } from '../../../types/Organism.ts';
import type { Subscription } from '../../../types/Subscription.ts';

export interface Filter {
    name: Organism;
    count: number;
}

export interface SelectedFilter extends Filter {
    selected: boolean;
}

export function FilterDropdown({
    selectedFilters,
    setSelectedFilters,
}: {
    selectedFilters: SelectedFilter[];
    setSelectedFilters: (value: ((prevState: SelectedFilter[]) => SelectedFilter[]) | SelectedFilter[]) => void;
}) {
    return (
        <div className='dropdown dropdown-end'>
            <div tabIndex={0} role='button' className='btn btn-sm'>
                <div className='iconify mdi--filter'></div>
                Filter
            </div>
            <div tabIndex={0} className='menu dropdown-content rounded-box bg-base-100 z-10 w-52 p-2 shadow-sm'>
                <SubscriptionFilter selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
            </div>
        </div>
    );
}

export function SubscriptionFilter({
    selectedFilters,
    setSelectedFilters,
}: {
    selectedFilters: SelectedFilter[];
    setSelectedFilters: (filters: SelectedFilter[]) => void;
}) {
    const handleFilterChange = (filter: Filter) => {
        const newSelectedFilters = selectedFilters.map((selectedFilter) => {
            if (selectedFilter.name === filter.name) {
                return { ...selectedFilter, selected: !selectedFilter.selected };
            }
            return selectedFilter;
        });

        setSelectedFilters(newSelectedFilters);

        changeUrlSearchParam(
            'organism',
            newSelectedFilters.filter((filter) => filter.selected).map((filter) => filter.name),
        );
    };

    return (
        <ul className='menu p-0'>
            <li>
                <h2 className='menu-title'>Organism</h2>
                <ul>
                    {selectedFilters.map((filter) => (
                        <li key={filter.name}>
                            <label className='flex'>
                                <input
                                    type='checkbox'
                                    checked={filter.selected}
                                    className='checkbox'
                                    onChange={() => {
                                        handleFilterChange(filter);
                                    }}
                                />
                                <div className='ml-2'>
                                    <span>{organismConfig[filter.name].label}</span>
                                    <span className='ml-1 text-gray-500'>({filter.count})</span>
                                </div>
                            </label>
                        </li>
                    ))}
                </ul>
            </li>
        </ul>
    );
}

const changeUrlSearchParam = (key: string, values: string[]) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);

    if (values.length === 0) {
        url.searchParams.append(key, '');
    } else {
        for (const value of values) {
            url.searchParams.append(key, value);
        }
    }
    window.history.replaceState({}, '', url.toString());
};

export const getFilters = (subscriptions: Subscription[]): Filter[] => {
    const filters = subscriptions.map((subscription) => subscription.organism);
    const uniqueFilters = Array.from(new Set(filters));

    return uniqueFilters.map((uniqueFilter) => ({
        name: uniqueFilter,
        count: filters.filter((filter) => uniqueFilter === filter).length,
    }));
};

export const getSelectedFilters = (filters: Filter[], searchParams: string[]): SelectedFilter[] => {
    if (searchParams.length === 0) {
        return filters.map((filter) => ({ ...filter, selected: true }));
    }

    return filters.map((filter) => ({
        ...filter,
        selected: searchParams.includes(filter.name),
    }));
};
