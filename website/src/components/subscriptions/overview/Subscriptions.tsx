import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { SubscriptionEntry } from './SubscriptionEntry.tsx';
import { FilterDropdown, getFilters, getSelectedFilters } from './SubscriptionFilter.tsx';
import { getBackendServiceForClientside } from '../../../backendApi/backendService.ts';
import { querySubscriptions } from '../../../backendApi/querySubscriptions.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';
import { getClientLogger } from '../../../clientLogger.ts';
import { PageHeadline } from '../../../styles/containers/PageHeadline.tsx';
import type { Organism } from '../../../types/Organism.ts';
import type { Subscription } from '../../../types/Subscription.ts';
import { Page } from '../../../types/pages.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

type SubscriptionsProps = {
    organismsFromUrl: Organism[];
};

const logger = getClientLogger('Subscriptions');

export const Subscriptions = withQueryProvider(SubscriptionsInner);

export function SubscriptionsInner({ organismsFromUrl }: SubscriptionsProps) {
    const {
        isLoading,
        isError,
        data: subscriptions,
        error,
        refetch: refetchSubscriptions,
    } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => {
            return querySubscriptions(getBackendServiceForClientside());
        },
    });

    if (isLoading) {
        return <LoadingSubscriptions />;
    }
    if (isError) {
        logger.error(`Failed to fetch subscriptions: ${getErrorLogMessage(error)}`);
        return <ErrorSubscriptions />;
    }
    if (subscriptions === undefined || subscriptions.length === 0) {
        return <NoSubscriptions />;
    }

    return (
        <SubscriptionsDisplay
            subscriptions={subscriptions}
            organismsFromUrl={organismsFromUrl}
            refetchSubscriptions={() => void refetchSubscriptions()}
        />
    );
}

function LoadingSubscriptions() {
    return (
        <>
            <PageHeadline>Subscriptions</PageHeadline>
            <div>Loading...</div>
        </>
    );
}

function ErrorSubscriptions() {
    return (
        <>
            <PageHeadline>Subscriptions</PageHeadline>
            <div>
                Oops! Something went wrong. Please try to reload this page. If the error still persists, please contact
                an admin.
            </div>
        </>
    );
}

function NoSubscriptions() {
    return (
        <>
            <div className='flex items-baseline justify-between'>
                <PageHeadline>Subscriptions</PageHeadline>
                <AddSubscriptionButton />
            </div>
            <div className='mb-4'>Subscriptions let you keep an eye on variants.</div>
            <a className='btn btn-primary btn-sm' href={Page.createSubscription}>
                Add your first subscription
            </a>
        </>
    );
}

export function SubscriptionsDisplay({
    subscriptions,
    organismsFromUrl,
    refetchSubscriptions,
}: {
    subscriptions: Subscription[];
    organismsFromUrl: Organism[];
    refetchSubscriptions: () => void;
}) {
    const filters = getFilters(subscriptions);
    const [selectedFilters, setSelectedFilters] = useState(getSelectedFilters(filters, organismsFromUrl));

    const filteredSubscriptions = subscriptions.filter((subscription) => {
        const isOrganismSelected = selectedFilters.some(
            (filter) => filter.selected && filter.name === subscription.organism,
        );

        return isOrganismSelected;
    });

    return (
        <>
            <div className='flex items-baseline justify-between'>
                <PageHeadline>Your subscriptions</PageHeadline>
                <div className='flex gap-1'>
                    <FilterDropdown selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
                    <AddSubscriptionButton />
                </div>
            </div>
            <SubscriptionsList subscriptions={filteredSubscriptions} refetchSubscriptions={refetchSubscriptions} />
        </>
    );
}

function AddSubscriptionButton() {
    return (
        <a className='btn btn-sm' href={Page.createSubscription}>
            Add
        </a>
    );
}

function SubscriptionsList({
    subscriptions,
    refetchSubscriptions,
}: {
    subscriptions: Subscription[];
    refetchSubscriptions: () => void;
}) {
    return (
        <div className='flex flex-col gap-2'>
            {subscriptions.map((subscription) => (
                <SubscriptionEntry
                    key={subscription.id}
                    subscription={subscription}
                    refetchSubscriptions={refetchSubscriptions}
                />
            ))}
        </div>
    );
}
