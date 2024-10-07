import type { Subscription } from '../../../types/Subscription.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { SubscriptionDisplay } from './SubscriptionDisplay.tsx';
import { organismConfig } from '../../../types/Organism.ts';
import { getBackendServiceForClientside } from '../backendApi/backendService.ts';
import { useMutation } from '@tanstack/react-query';
import { type JSX } from 'react';

export function SubscriptionEntry({
    subscription,
    userId,
    refetchSubscriptions,
}: {
    subscription: Subscription;
    userId: string;
    refetchSubscriptions: () => void;
}) {
    const getIcon = () => {
        if (!subscription.active) {
            return 'mdi--bell-off-outline text-gray-500';
        }

        if (subscription.triggerEvaluationResult.type === 'ConditionMet') {
            return 'mdi--bell-ring text-red-500';
        }

        return `mdi--bell-outline text-gray-500`;
    };

    return (
        <BorderedCard>
            <div className='flex flex-row'>
                <details className='collapse collapse-arrow mr-4 overflow-visible'>
                    <summary className='collapse-title'>
                        <div className={`flex items-center justify-between`}>
                            <CardDescription
                                title={subscription.name}
                                subtitle={organismConfig[subscription.organism].label}
                                icon={`size-6 ${getIcon()}`}
                            />
                        </div>
                    </summary>
                    <div className='collapse-content'>
                        <SubscriptionDisplay subscription={subscription} />
                    </div>
                </details>
                <MoreDropdown subscription={subscription} userId={userId} refetchSubscriptions={refetchSubscriptions} />
            </div>
        </BorderedCard>
    );
}

function MoreDropdown({
    subscription,
    userId,
    refetchSubscriptions,
}: {
    subscription: Subscription;
    userId: string;
    refetchSubscriptions: () => void;
}) {
    const deleteSubscription = useMutation({
        mutationFn: () => getBackendServiceForClientside().deleteSubscription(subscription.id, userId),
        onSuccess: () => {
            refetchSubscriptions();
        },
        onError: (error) => {
            console.error(error);
            // TODO: #205 Show error as banner
            window.location.href = '/500';
        },
    });

    const activateSubscription = useMutation({
        mutationFn: () =>
            getBackendServiceForClientside().putSubscription({ active: !subscription.active }, userId, subscription.id),
        onSuccess: () => {
            refetchSubscriptions();
        },
        onError: (error) => {
            console.error(error);
            // TODO: #205 Show error as banner
            window.location.href = '/500';
        },
    });

    const handleDelete = async () => {
        deleteSubscription.mutate();
    };

    const handleActivate = async () => {
        activateSubscription.mutate();
    };

    return (
        <div className='dropdown dropdown-end'>
            <div tabIndex={0} role='button' className='btn btn-xs'>
                ...
            </div>
            <ul tabIndex={0} className='menu dropdown-content z-[10] w-52 rounded-box bg-base-100 p-2 shadow'>
                {/*TODO: #170 Page to edit subscription*/}
                {/*<li>*/}
                {/*    <EditButton />*/}
                {/*</li>*/}
                <li>
                    <ActivateButton isActive={subscription.active} onClick={handleActivate} />
                </li>
                <li>
                    <DeleteButton onClick={handleDelete} />
                </li>
            </ul>
        </div>
    );
}

// TODO: #170 Page to edit subscription
// function EditButton() {
//     return (
//         <button
//             className={'flex items-center gap-2'}
//
//             onClick={() => console.error('Not implemented. Will be done by #170')}
//         >
//             <div className={'iconify mdi--pencil'}></div>
//             Edit
//         </button>
//     );
// }

function ActivateButton({
    isActive,
    onClick,
}: {
    isActive: boolean;
    onClick: JSX.IntrinsicElements['button']['onClick'];
}) {
    return (
        <button className={'flex items-center gap-2'} onClick={onClick}>
            <div className={`iconify ${isActive ? 'mdi--pause' : 'mdi--play'}`}></div>
            {isActive ? 'Deactivate' : 'Activate'}
        </button>
    );
}

function DeleteButton({ onClick }: { onClick: JSX.IntrinsicElements['button']['onClick'] }) {
    return (
        <button className={'flex items-center gap-2'} onClick={onClick}>
            <div className={'iconify mdi--delete'}></div>
            Delete
        </button>
    );
}
