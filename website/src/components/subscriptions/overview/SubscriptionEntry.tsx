import type { Subscription } from '../../../types/Subscription.ts';
import { BorderedCard } from '../../../styles/containers/BorderedCard.tsx';
import { CardDescription } from '../../../styles/containers/CardDescription.tsx';
import { SubscriptionDisplay } from './SubscriptionDisplay.tsx';
import { organismConfig } from '../../../routes/View.ts';

export function SubscriptionEntry({ subscription }: { subscription: Subscription }) {
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
                <MoreDropdown subscription={subscription} />
            </div>
        </BorderedCard>
    );
}

function MoreDropdown({ subscription }: { subscription: Subscription }) {
    return (
        <div className='dropdown dropdown-end'>
            <div tabIndex={0} role='button' className='btn btn-xs'>
                ...
            </div>
            <ul tabIndex={0} className='menu dropdown-content z-[10] w-52 rounded-box bg-base-100 p-2 shadow'>
                <li>
                    <EditButton />
                </li>
                <li>
                    <ActivateButton isActive={subscription.active} />
                </li>
                <li>
                    <DeleteButton />
                </li>
            </ul>
        </div>
    );
}

function EditButton() {
    return (
        <button
            className={'flex items-center gap-2'}
            // TODO: #170 Page to edit subscription
            onClick={() => console.error('Not implemented. Will be done by #170')}
        >
            <div className={'iconify mdi--pencil'}></div>
            Edit
        </button>
    );
}

function ActivateButton({ isActive }: { isActive: boolean }) {
    return (
        <button
            className={'flex items-center gap-2'}
            onClick={() =>
                // TODO: #171 Activate/Deactivate subscription
                console.error('Not implemented. Will be done by #171')
            }
        >
            <div className={`iconify ${isActive ? 'mdi--pause' : 'mdi--play'}`}></div>
            {isActive ? 'Deactivate' : 'Activate'}
        </button>
    );
}

function DeleteButton() {
    return (
        <button
            className={'flex items-center gap-2'}
            onClick={() => console.error('Not implemented. Will be done by #163')}
        >
            <div className={'iconify mdi--delete'}></div>
            Delete
        </button>
    );
}
