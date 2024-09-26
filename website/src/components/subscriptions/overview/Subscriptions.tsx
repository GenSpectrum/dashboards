import { FilterDropdown, type SelectedFilter } from './SubscriptionFilter.tsx';
import { useState } from 'react';
import type { Subscription } from '../../../types/Subscription.ts';
import { PageContainer } from '../../../styles/containers/PageContainer.tsx';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { SubscriptionEntry } from './SubscriptionEntry.tsx';

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
        <PageContainer>
            <div className={'flex items-baseline justify-between'}>
                <PageHeadline>Subscriptions</PageHeadline>
                <div className={'flex gap-1'}>
                    <FilterDropdown selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
                    <AddSubscriptionButton />
                </div>
            </div>
            <SubscriptionsList subscriptions={filteredSubscriptions} />
        </PageContainer>
    );
};

function AddSubscriptionButton() {
    return (
        <a className='btn btn-sm' href='/subscriptions/create'>
            Add
        </a>
    );
}

function SubscriptionsList({ subscriptions }: { subscriptions: Subscription[] }) {
    return (
        <div className={'flex flex-col gap-2'}>
            {subscriptions.map((subscription) => (
                <SubscriptionEntry key={subscription.id} subscription={subscription} />
            ))}
        </div>
    );
}
