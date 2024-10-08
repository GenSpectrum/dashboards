import { FilterDropdown, getFilters, getSelectedFilters } from './SubscriptionFilter.tsx';
import { useState } from 'react';
import type { Subscription } from '../../../types/Subscription.ts';
import { PageContainer } from '../../../styles/containers/PageContainer.tsx';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import { SubscriptionEntry } from './SubscriptionEntry.tsx';
import { useQuery } from '@tanstack/react-query';
import { querySubscriptions } from '../backendApi/querySubscriptions.ts';
import { getBackendServiceForClientside } from '../backendApi/backendService.ts';
import { Page } from '../../../types/pages.ts';
import type { Organism } from '../../../types/Organism.ts';
import { withQueryProvider } from '../backendApi/withQueryProvider.tsx';

type SubscriptionsProps = {
    organismsFromUrl: Organism[];
    userId: string;
};

export const Subscriptions = withQueryProvider(SubscriptionsInner);

export function SubscriptionsInner({ userId, organismsFromUrl }: SubscriptionsProps) {
    const {
        isLoading,
        isError,
        data: subscriptions,
        error,
        refetch: refetchSubscriptions,
    } = useQuery({
        queryKey: ['subscriptions', userId],
        queryFn: () => {
            return querySubscriptions(userId, getBackendServiceForClientside());
        },
    });

    if (isLoading) {
        return <LoadingSubscriptions />;
    }
    if (isError) {
        console.error(error);
        return <ErrorSubscriptions />;
    }
    if (subscriptions === undefined || subscriptions.length === 0) {
        return <NoSubscriptions />;
    }

    return (
        <SubscriptionsDisplay
            userId={userId}
            subscriptions={subscriptions}
            organismsFromUrl={organismsFromUrl}
            refetchSubscriptions={refetchSubscriptions}
        />
    );
}

const LoadingSubscriptions = () => {
    return (
        <PageContainer>
            <PageHeadline>Subscriptions</PageHeadline>
            <div>Loading...</div>
        </PageContainer>
    );
};

const ErrorSubscriptions = () => {
    return (
        <PageContainer>
            <PageHeadline>Subscriptions</PageHeadline>
            <div>
                Oops! Something went wrong. Please try to reload this page. If the error still persists, please contact
                an admin.
            </div>
        </PageContainer>
    );
};

const NoSubscriptions = () => {
    return (
        <PageContainer>
            <div className={'flex items-baseline justify-between'}>
                <PageHeadline>Subscriptions</PageHeadline>
                <AddSubscriptionButton />
            </div>
            <div className={'mb-4'}>Subscriptions let you keep an eye on variants.</div>
            <a className='btn btn-primary btn-sm' href={Page.createSubscription}>
                Add your first subscription
            </a>
        </PageContainer>
    );
};

export const SubscriptionsDisplay = ({
    userId,
    subscriptions,
    organismsFromUrl,
    refetchSubscriptions,
}: {
    userId: string;
    subscriptions: Subscription[];
    organismsFromUrl: Organism[];
    refetchSubscriptions: () => void;
}) => {
    const filters = getFilters(subscriptions);
    const [selectedFilters, setSelectedFilters] = useState(getSelectedFilters(filters, organismsFromUrl));

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
            <SubscriptionsList
                subscriptions={filteredSubscriptions}
                userId={userId}
                refetchSubscriptions={refetchSubscriptions}
            />
        </PageContainer>
    );
};

function AddSubscriptionButton() {
    return (
        <a className='btn btn-sm' href={Page.createSubscription}>
            Add
        </a>
    );
}

function SubscriptionsList({
    subscriptions,
    userId,
    refetchSubscriptions,
}: {
    subscriptions: Subscription[];
    userId: string;
    refetchSubscriptions: () => void;
}) {
    return (
        <div className={'flex flex-col gap-2'}>
            {subscriptions.map((subscription) => (
                <SubscriptionEntry
                    key={subscription.id}
                    subscription={subscription}
                    userId={userId}
                    refetchSubscriptions={refetchSubscriptions}
                />
            ))}
        </div>
    );
}
