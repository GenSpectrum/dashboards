import { useEffect, useState } from 'react';
import type { Organism } from '../../routes/View.ts';

interface SubscriptionFilter {
    [key: string]: string;
}

export interface Subscription {
    id: string;
    name: string;
    filter: SubscriptionFilter;
    interval: string;
    trigger: string;
    isActive: boolean;
    conditionsMet: boolean;
    organism: Organism;
}

export function SubscriptionsTable({ subscriptions }: { subscriptions: Subscription[] }) {
    const [selectedSubscriptions, setSelectedSubscriptions] = useState(
        subscriptions.map((subscription) => ({ id: subscription.id, selected: false })),
    );

    const handleSelectAllSubscriptions = () => {
        const allSelected = selectedSubscriptions.every((subscription) => subscription.selected);

        if (allSelected) {
            setSelectedSubscriptions(
                selectedSubscriptions.map((subscription) => {
                    return { id: subscription.id, selected: false };
                }),
            );
            return;
        }

        setSelectedSubscriptions(
            selectedSubscriptions.map((subscription) => {
                return { id: subscription.id, selected: true };
            }),
        );
    };

    const handleSelectSubscription = (id: string) => {
        setSelectedSubscriptions(
            selectedSubscriptions.map((subscription) => {
                if (subscription.id === id) {
                    return { id: subscription.id, selected: !subscription.selected };
                }
                return subscription;
            }),
        );
    };

    return (
        <div className='w-full divide-y-2 overflow-x-auto rounded border-2'>
            <div className='backgound flex w-full place-content-between items-center bg-gray-200'>
                <div className='flex h-12 items-center'>
                    <div className='ml-2'>Subscriptions</div>
                    <label>
                        <input className='input input-sm ml-8' placeholder='Search' />
                    </label>
                </div>

                <div className='flex-end mr-2'>
                    <button
                        className={`btn ${selectedSubscriptions.some((subscription) => subscription.selected) ? '' : 'btn-disabled'} btn-sm mx-2`}
                    >
                        Delete
                        {selectedSubscriptions.some((subscription) => subscription.selected) && (
                            <span>
                                ({selectedSubscriptions.filter((subscription) => subscription.selected).length})
                            </span>
                        )}
                    </button>
                    <a className='btn btn-primary btn-sm' href='/subscriptions/create'>
                        Add
                    </a>
                </div>
            </div>

            <table className='table table-pin-cols w-full table-auto'>
                <thead>
                    <tr>
                        <td>
                            <label>
                                <input
                                    type='checkbox'
                                    className='checkbox'
                                    onChange={handleSelectAllSubscriptions}
                                    checked={
                                        selectedSubscriptions.every((subscription) => subscription.selected) &&
                                        selectedSubscriptions.length > 0
                                    }
                                />
                            </label>
                        </td>
                        <th>Status</th>
                        <th>Name</th>
                        <th>Filter</th>
                        <th>Interval</th>
                        <th>Trigger</th>
                        <th>Is active</th>
                        <th>Organism</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {subscriptions.map((subscription) => (
                        <tr key={subscription.id}>
                            <td>
                                <label>
                                    <input
                                        type='checkbox'
                                        className='checkbox'
                                        checked={
                                            selectedSubscriptions.find(
                                                (selectedSubscription) => selectedSubscription.id === subscription.id,
                                            )?.selected || false
                                        }
                                        onChange={() => {
                                            handleSelectSubscription(subscription.id);
                                        }}
                                    />
                                </label>
                            </td>
                            <td>
                                <div
                                    className='tooltip'
                                    data-tip={
                                        subscription.conditionsMet ? 'Trigger criteria met' : 'Trigger criteria not met'
                                    }
                                >
                                    <span
                                        className='iconify text-2xl mdi--circle-slice-8'
                                        style={{ color: `${subscription.conditionsMet ? '#21ff00' : '#ff0000'}` }}
                                    />
                                </div>
                            </td>
                            <td>{subscription.name}</td>
                            <td>
                                <p>Country: {subscription.filter.country}</p>
                                <p>DateFrom: {subscription.filter.dateFrom}</p>
                                <p>DateTo: {subscription.filter.dateTo}</p>
                            </td>
                            <td>{subscription.interval}</td>
                            <td>{subscription.trigger}</td>
                            <td>{subscription.isActive.toString()}</td>
                            <td>{subscription.organism}</td>
                            <td>
                                <button className='btn btn-ghost btn-xs'>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
