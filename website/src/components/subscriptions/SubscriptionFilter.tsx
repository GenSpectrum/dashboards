import { type Organism, organismConfig } from '../../routes/View.ts';

export interface Filter {
    name: Organism;
    count: number;
}

export interface SelectedFilter extends Filter {
    selected: boolean;
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
                <h2 className='menu-title'>Filters</h2>
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
