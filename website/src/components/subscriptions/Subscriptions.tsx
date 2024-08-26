import { type SelectedFilter, SubscriptionFilter } from './SubscriptionFilter.tsx';
import { type Subscription, SubscriptionsTable } from './SubscriptionTable.tsx';
import { useState } from 'react';

export const Subscriptions = ({
    filters,
    subscriptions,
}: {
    filters: SelectedFilter[];
    subscriptions: Subscription[];
}) => {
    const [selectedFilters, setSelectedFilters] = useState(filters);

    const filteredSubscriptions = subscriptions.filter((subscription) => {
        const isOrganismSelected = selectedFilters.some(
            (filter) => filter.selected && filter.name === subscription.organism,
        );

        return isOrganismSelected;
    });

    return (
        <div className='ml-2 mt-2 flex flex-row'>
            <div className='w-1/6 min-w-48'>
                <SubscriptionFilter selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
            </div>
            <SubscriptionsTable subscriptions={filteredSubscriptions} />
        </div>
    );
};
